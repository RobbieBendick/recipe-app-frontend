// Kroger API Service
// Note: You'll need to register for Kroger API credentials at https://developer.kroger.com/

import type {
  KrogerProduct,
  KrogerProductSummary,
  KrogerProductSearchParams,
  KrogerSearchResults,
  KrogerProductsPayload,
  KrogerProductPayload,
  KrogerAPIConfig,
  KrogerAPIErrorUnauthorized,
  KrogerAPIErrorServerError,
  KrogerAPIErrorForbidden,
  KrogerAPIError,
} from '../types/kroger-api';
import { ingredientCostDB } from '../database/ingredient-costs';
import {
  MEASUREMENT_CONVERSIONS,
  ALL_INGREDIENT_NAMES,
  WHOLE_ITEM_MEASUREMENTS,
  WHOLE_ITEM_WEIGHTS,
} from '../constants/ingredient-constants';

class KrogerAPIService {
  private baseURL = '/api/kroger/v1'; // Use proxy for development
  private directBaseURL = 'https://api-ce.kroger.com/v1'; // Direct URL for production
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly scope = 'product.compact';

  constructor(config?: KrogerAPIConfig) {
    // You'll need to set these environment variables
    this.clientId =
      config?.clientId || import.meta.env.VITE_KROGER_CLIENT_ID || '';
    this.clientSecret =
      config?.clientSecret || import.meta.env.VITE_KROGER_CLIENT_SECRET || '';

    console.log('clientId', this.clientId);
    console.log('clientSecret', this.clientSecret);

    if (config?.baseURL) {
      this.baseURL = config.baseURL;
    }
  }

  // Get OAuth token with expiry handling
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - 300000
    ) {
      return this.accessToken;
    }

    try {
      // Use direct URL for OAuth (can't be proxied)
      const tokenURL = `${this.directBaseURL}/connect/oauth2/token`;
      const response = await fetch(tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(
            `${this.clientId}:${this.clientSecret}`
          )}`,
        },
        body: `grant_type=client_credentials&scope=${this.scope}`,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Kroger API authentication failed: ${
            response.statusText
          } - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
      return this.accessToken as string;
    } catch (error) {
      console.error('Error getting Kroger access token:', error);
      if (error instanceof Error) {
        throw new Error(`Kroger API authentication failed: ${error.message}`);
      } else {
        throw new Error(
          `Kroger API authentication failed: ${JSON.stringify(error)}`
        );
      }
    }
  }

  // Enhanced search for products with comprehensive parameters
  async searchProducts(
    params: KrogerProductSearchParams
  ): Promise<KrogerSearchResults> {
    try {
      const token = await this.getAccessToken();

      // First try specific search
      const searchResults = await this.performSpecificSearch(params, token);

      // If no results or very few results, try fuzzy search
      if (searchResults.products.length < 3) {
        console.log(
          `🔍 Specific search found ${searchResults.products.length} results, trying fuzzy search...`
        );
        const fuzzyResults = await this.performFuzzySearch(params, token);

        // Combine results, prioritizing specific matches
        const combinedProducts = [...searchResults.products];
        fuzzyResults.products.forEach(fuzzyProduct => {
          // Avoid duplicates
          if (
            !combinedProducts.some(
              existing => existing.productId === fuzzyProduct.productId
            )
          ) {
            combinedProducts.push(fuzzyProduct);
          }
        });

        searchResults.products = combinedProducts;
      }

      return searchResults;
    } catch (error) {
      console.error('Error searching Kroger products:', error);
      throw error;
    }
  }

  // Perform specific search with exact terms
  private async performSpecificSearch(
    params: KrogerProductSearchParams,
    token: string
  ): Promise<KrogerSearchResults> {
    const searchParams = new URLSearchParams();

    // Add search parameters
    if (params.term) searchParams.append('filter.term', params.term);
    if (params.productId)
      searchParams.append('filter.productId', params.productId);
    if (params.brand) searchParams.append('filter.brand', params.brand);
    if (params.locationId)
      searchParams.append('filter.locationId', params.locationId);
    if (params.fulfillment)
      searchParams.append('filter.fulfillment', params.fulfillment);
    if (params.start)
      searchParams.append('filter.start', params.start.toString());
    if (params.limit)
      searchParams.append('filter.limit', params.limit.toString());

    const response = await fetch(`${this.baseURL}/products?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      await this.handleAPIError(response);
    }

    const data: KrogerProductsPayload = await response.json();

    // Convert to simplified format for UI
    const products: KrogerProductSummary[] = data.data.map(
      this.convertToProductSummary
    );

    return {
      products,
      pagination: {
        start: params.start || 0,
        limit: params.limit || 10,
      },
    };
  }

  // Perform fuzzy search with broader terms
  private async performFuzzySearch(
    params: KrogerProductSearchParams,
    token: string
  ): Promise<KrogerSearchResults> {
    if (!params.term) {
      return { products: [], pagination: { start: 0, limit: 10 } };
    }

    // Create fuzzy search terms
    const fuzzyTerms = this.createFuzzySearchTerms(params.term);

    for (const fuzzyTerm of fuzzyTerms) {
      try {
        console.log(`🔍 Trying fuzzy search: "${fuzzyTerm}"`);

        const searchParams = new URLSearchParams();
        searchParams.append('filter.term', fuzzyTerm);
        if (params.locationId)
          searchParams.append('filter.locationId', params.locationId);
        if (params.fulfillment)
          searchParams.append('filter.fulfillment', params.fulfillment);
        searchParams.append('filter.limit', (params.limit || 10).toString());

        const response = await fetch(
          `${this.baseURL}/products?${searchParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );

        if (response.ok) {
          const data: KrogerProductsPayload = await response.json();
          const products: KrogerProductSummary[] = data.data.map(
            this.convertToProductSummary
          );

          if (products.length > 0) {
            console.log(
              `✅ Fuzzy search found ${products.length} results with "${fuzzyTerm}"`
            );
            return {
              products,
              pagination: {
                start: params.start || 0,
                limit: params.limit || 10,
              },
            };
          }
        }
      } catch (error) {
        console.log(`❌ Fuzzy search failed for "${fuzzyTerm}":`, error);
        continue;
      }
    }

    return { products: [], pagination: { start: 0, limit: 10 } };
  }

  // Create fuzzy search terms from the original search term
  private createFuzzySearchTerms(originalTerm: string): string[] {
    const terms = originalTerm.toLowerCase().split(/\s+/);
    const fuzzyTerms: string[] = [];

    // Add the original term first (highest priority)
    fuzzyTerms.push(originalTerm.toLowerCase());

    // Add individual words
    terms.forEach(term => {
      if (term.length > 2) {
        fuzzyTerms.push(term);
      }
    });

    // Add the full term as a phrase
    if (terms.length > 1) {
      fuzzyTerms.push(terms.join(' '));
    }

    // Remove duplicates and return
    return [...new Set(fuzzyTerms)];
  }

  // Legacy search method for backward compatibility
  async searchProductsLegacy(
    query: string,
    locationId?: string
  ): Promise<KrogerProductSummary[]> {
    const results = await this.searchProducts({
      term: query,
      locationId,
      limit: 10,
    });
    return results.products;
  }

  // Get product details by ID
  async getProduct(
    productId: string,
    locationId?: string
  ): Promise<KrogerProductSummary> {
    try {
      const token = await this.getAccessToken();

      const params = new URLSearchParams();
      if (locationId) {
        params.append('filter.locationId', locationId);
      }

      const response = await fetch(
        `${this.baseURL}/products/${productId}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      const data: KrogerProductPayload = await response.json();
      return this.convertToProductSummary(data.data);
    } catch (error) {
      console.error('Error getting Kroger product:', error);
      throw error;
    }
  }

  // Get full product details (raw API response)
  async getProductDetails(
    productId: string,
    locationId?: string
  ): Promise<KrogerProduct> {
    try {
      const token = await this.getAccessToken();

      const params = new URLSearchParams();
      if (locationId) {
        params.append('filter.locationId', locationId);
      }

      const response = await fetch(
        `${this.baseURL}/products/${productId}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        await this.handleAPIError(response);
      }

      const data: KrogerProductPayload = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting Kroger product details:', error);
      throw error;
    }
  }

  // Convert full product to summary format
  private convertToProductSummary(
    product: KrogerProduct
  ): KrogerProductSummary {
    const firstItem = product.items?.[0];
    const firstImage = product.images?.[0]?.sizes?.[0];

    return {
      productId: product.productId,
      upc: product.upc,
      brand: product.brand,
      description: product.description,
      image: firstImage?.url,
      size: firstItem?.size || '',
      price: firstItem?.price
        ? {
            regular: firstItem.price.regular,
            promo: firstItem.price.promo,
          }
        : undefined,
      availability: firstItem?.fulfillment
        ? {
            instore: firstItem.fulfillment.instore,
            curbside: firstItem.fulfillment.curbside,
            delivery: firstItem.fulfillment.delivery,
            shiptohome: firstItem.fulfillment.shiptohome,
            stockLevel: firstItem.inventory?.stockLevel,
          }
        : undefined,
      aisleLocation: product.aisleLocations?.[0]?.description,
      rating: product.ratingsAndReviews
        ? {
            average: product.ratingsAndReviews.averageOverallRating,
            count: product.ratingsAndReviews.totalReviewCount,
          }
        : undefined,
    };
  }

  // Handle API errors with specific error types
  private async handleAPIError(response: Response): Promise<never> {
    let errorData:
      | KrogerAPIErrorUnauthorized
      | KrogerAPIErrorForbidden
      | KrogerAPIErrorServerError
      | KrogerAPIError
      | Record<string, unknown>;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }

    switch (response.status) {
      case 400:
        throw new Error(
          `Bad Request: ${
            (errorData as KrogerAPIError).reason || response.statusText
          }`
        );
      case 401:
        throw new Error(
          `Unauthorized: ${
            (errorData as KrogerAPIErrorUnauthorized).errors
              ?.error_description || 'Invalid or expired token'
          }`
        );
      case 403:
        throw new Error(
          `Forbidden: ${
            (errorData as KrogerAPIErrorForbidden).errors?.reason ||
            'Missing required scopes'
          }`
        );
      case 500:
        throw new Error(
          `Server Error: ${
            (errorData as KrogerAPIErrorServerError).errors?.reason ||
            'Internal server error'
          }`
        );
      default:
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Kroger API connection...');
      console.log('Client ID:', this.clientId ? 'Set' : 'Missing');
      console.log('Client Secret:', this.clientSecret ? 'Set' : 'Missing');
      console.log('Base URL:', this.baseURL);

      await this.searchProducts({ term: 'milk', limit: 1 });
      return true;
    } catch (error) {
      console.error('Kroger API connection test failed:', error);
      return false;
    }
  }

  // Debug authentication step by step
  async debugAuthentication(): Promise<void> {
    console.log('=== Kroger API Debug ===');
    console.log('Client ID:', this.clientId);
    console.log('Client Secret:', this.clientSecret ? 'Set' : 'Missing');
    console.log('Base URL:', this.baseURL);
    console.log('Scope:', this.scope);

    const authString = btoa(`${this.clientId}:${this.clientSecret}`);
    console.log('Auth String:', authString);

    const url = `${this.directBaseURL}/connect/oauth2/token`;
    console.log('Token URL:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authString}`,
        },
        body: `grant_type=client_credentials&scope=${this.scope}`,
      });

      console.log('Response Status:', response.status);
      console.log(
        'Response Headers:',
        Object.fromEntries(response.headers.entries())
      );

      const responseText = await response.text();
      console.log('Response Body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error('Authentication debug failed:', error);
      throw error;
    }
  }

  // Clear stored token (useful for testing or re-authentication)
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Test both environments
  async testBothEnvironments(): Promise<void> {
    console.log('=== Testing Kroger API Authentication ===');

    // Test Certification Environment (OAuth only)
    console.log('\n--- Testing Certification Environment OAuth ---');
    this.directBaseURL = 'https://api-ce.kroger.com/v1';
    try {
      await this.debugAuthentication();
      console.log('✅ Certification environment OAuth works!');
      console.log('✅ Using proxy for API calls to avoid CORS issues');
      return;
    } catch (error) {
      console.log('❌ Certification environment failed:', error);
    }

    // Test Production Environment
    console.log('\n--- Testing Production Environment OAuth ---');
    this.directBaseURL = 'https://api.kroger.com/v1';
    try {
      await this.debugAuthentication();
      console.log('✅ Production environment OAuth works!');
      console.log('✅ Using proxy for API calls to avoid CORS issues');
      return;
    } catch (error) {
      console.log('❌ Production environment failed:', error);
    }

    throw new Error(
      'Both environments failed. Please check your application status in the Kroger Developer Portal.'
    );
  }

  // Fetch common ingredient costs and populate database
  async fetchIngredientCosts(locationId?: string): Promise<{
    success: number;
    failed: number;
    ingredients: Array<{
      name: string;
      costPerGram: number;
      brand: string;
      size: string;
      price: number;
    }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      ingredients: [] as Array<{
        name: string;
        costPerGram: number;
        brand: string;
        size: string;
        price: number;
      }>,
    };

    console.log('🛒 Fetching common ingredient costs from Kroger...');

    // Extract ingredient names from the constants array
    const ingredientNames = ALL_INGREDIENT_NAMES.filter(
      item => typeof item === 'string'
    ).map(item => item as string);

    for (const ingredient of ingredientNames) {
      try {
        console.log(`Searching for: ${ingredient}`);

        // Get fallback search terms first
        const fallbackTerms = this.getFallbackSearchTerms(ingredient);
        console.log(
          `📋 Fallback terms for "${ingredient}": ${fallbackTerms.join(', ')}`
        );

        // Try fallback terms first (they're more likely to match actual product names)
        let finalSearchResults = { products: [] as KrogerProductSummary[] };

        for (const fallbackTerm of fallbackTerms) {
          console.log(`🔍 Trying fallback: ${fallbackTerm}`);
          const fallbackResults = await this.searchProducts({
            term: fallbackTerm,
            locationId,
            limit: 5,
          });

          if (fallbackResults.products.length > 0) {
            console.log(
              `✅ Found ${fallbackResults.products.length} results with fallback: ${fallbackTerm}`
            );
            finalSearchResults = fallbackResults;
            break;
          }
        }

        // If no results from fallback terms, try the original ingredient name
        if (finalSearchResults.products.length === 0) {
          console.log(
            `⚠️ No results from fallback terms, trying original: "${ingredient}"`
          );
          const originalResults = await this.searchProducts({
            term: ingredient,
            locationId,
            limit: 5,
          });

          if (originalResults.products.length > 0) {
            console.log(
              `✅ Found ${originalResults.products.length} results with original term: ${ingredient}`
            );
            finalSearchResults = originalResults;
          }
        }

        if (finalSearchResults.products.length === 0) {
          console.log(`❌ No results for ${ingredient} or any fallback terms`);
          results.failed++;
          continue;
        }

        console.log(
          `\n📋 Found ${finalSearchResults.products.length} options for ${ingredient}:`
        );
        finalSearchResults.products.forEach((product, index) => {
          console.log(
            `  ${index + 1}. ${product.brand} ${product.description}`
          );
          console.log(
            `     Size: "${product.size}" | Price: $${
              product.price?.regular || 'N/A'
            }`
          );
        });

        // Find the cheapest option with valid weight data
        let cheapestProduct: KrogerProductSummary | null = null;
        let lowestCostPerGram = Infinity;
        let bestWeight = 0;

        for (const product of finalSearchResults.products) {
          if (!product.price?.regular || !product.size) {
            console.log(`⚠️ Skipping ${product.brand} - missing price or size`);
            continue;
          }

          // Try to extract weight from size string
          let weightInGrams = this.parseWeightFromSize(
            product.size,
            ingredient
          );

          // If size parsing fails, try extracting from description
          if (weightInGrams instanceof Error || weightInGrams <= 0) {
            console.log(
              `⚠️ Size "${product.size}" failed to parse, trying description: "${product.description}"`
            );
            const descriptionWeight = this.parseWeightFromSize(
              product.description,
              ingredient
            );
            if (
              !(descriptionWeight instanceof Error) &&
              descriptionWeight > 0
            ) {
              weightInGrams = descriptionWeight;
              console.log(
                `✅ Extracted weight from description: ${weightInGrams}g`
              );
            } else {
              console.log(
                `⚠️ Skipping ${product.brand} - no valid weight data in size or description`
              );
              continue;
            }
          }

          const costPerGram = (product.price.regular / weightInGrams) as number;
          console.log(
            `💰 ${product.brand}: $${
              product.price.regular
            } / ${weightInGrams}g = $${costPerGram.toFixed(6)}/gram`
          );

          if (costPerGram < lowestCostPerGram) {
            lowestCostPerGram = costPerGram;
            cheapestProduct = product;
            bestWeight = weightInGrams as number;
            console.log(`🏆 New cheapest option!`);
          }
        }

        if (cheapestProduct && cheapestProduct.price?.regular) {
          const costPerGram = (cheapestProduct.price.regular /
            (bestWeight as number)) as number;

          results.ingredients.push({
            name: ingredient,
            costPerGram,
            brand: cheapestProduct.brand || 'Unknown',
            size: cheapestProduct.size,
            price: cheapestProduct.price.regular,
          });

          console.log(
            `✅ ${ingredient}: $${costPerGram.toFixed(6)}/gram (${
              cheapestProduct.brand
            } ${cheapestProduct.size} = ${bestWeight as number}g)`
          );
          results.success++;
        } else {
          console.log(
            `❌ No valid weight data for ${ingredient} - tried ${finalSearchResults.products.length} products`
          );
          results.failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error fetching ${ingredient}:`, error);
        results.failed++;
      }
    }

    console.log(
      `\n📊 Results: ${results.success} successful, ${results.failed} failed`
    );

    // Print summary of all collected ingredient costs
    if (results.ingredients.length > 0) {
      console.log('\n🍽️ INGREDIENT COST SUMMARY:');
      console.log('='.repeat(50));
      results.ingredients.forEach((ingredient, index) => {
        console.log(`${index + 1}. ${ingredient.name.toUpperCase()}`);
        console.log(`   Cost per gram: $${ingredient.costPerGram.toFixed(6)}`);
        console.log(`   Brand: ${ingredient.brand}`);
        console.log(`   Size: ${ingredient.size}`);
        console.log(`   Price: $${ingredient.price.toFixed(2)}`);
        console.log(
          `   Cost per lb: $${(ingredient.costPerGram * 453.592).toFixed(2)}`
        );
        console.log(
          `   Cost per oz: $${(ingredient.costPerGram * 28.3495).toFixed(4)}`
        );
        console.log('');
      });
      console.log('='.repeat(50));
    }

    return results;
  }

  // Parse weight from size string using the ingredient cost database conversions
  public parseWeightFromSize(
    size: string,
    ingredientName: string
  ): number | Error {
    const sizeStr = size.toLowerCase();
    console.log(`🔍 Parsing weight from: "${size}"`);

    // Generate measurement units from constants
    const measurementUnits = Object.keys(MEASUREMENT_CONVERSIONS);
    const unitsPattern = measurementUnits.join('|');
    console.log(
      `📏 Available measurement units: ${measurementUnits.join(', ')}`
    );

    // Try multiple patterns to extract weight
    const patterns = [
      // Standard patterns: "1 lb", "16 oz", "500g", "10 fl oz"
      new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitsPattern})`),
      // Patterns with extra text: "1 lb loaf", "16 oz bottle", "10 fl oz bottle"
      new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitsPattern})\\s+\\w+`),
      // Patterns with fractions: "1/2 lb", "0.5 lb", "1/2 fl oz"
      new RegExp(`(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)\\s*(${unitsPattern})`),
      // Count patterns: "1ct", "2ct", "12ct", "1 ct", "2 ct"
      /(\d+(?:\.\d+)?)\s*(ct)\b/,
      // Count patterns with text: "1ct chicken", "2ct breast", "1 ct chicken", "2 ct breast", "1 ct watermelon"
      /(\d+(?:\.\d+)?)\s*(ct)\s+\w+/,
      // General count patterns: "1 ct", "2 ct" (without requiring word after)
      /(\d+(?:\.\d+)?)\s*(ct)(?:\s|$)/,
      // Whole patterns: "2 whole carrots", "1 whole chicken"
      /(\d+(?:\.\d+)?)\s*whole\s+\w+/,
    ];

    for (const pattern of patterns) {
      const match = sizeStr.match(pattern);
      if (match) {
        let quantity: number;
        const quantityStr = match[1];

        // Handle fractions
        if (quantityStr.includes('/')) {
          const [numerator, denominator] = quantityStr.split('/').map(Number);
          quantity = numerator / denominator;
        } else {
          quantity = parseFloat(quantityStr);
        }

        const unit = match[2];

        // Special handling for count-based items
        if (WHOLE_ITEM_MEASUREMENTS.includes(unit.toLowerCase())) {
          // Estimate weight based on common count items
          const weightInGrams = this.estimateWeightFromCount(
            sizeStr,
            quantity,
            ingredientName
          );
          console.log(`✅ Parsed: ${quantity}${unit} = ${weightInGrams}g`);
          return weightInGrams;
        }

        // Use the ingredient cost database's conversion method
        const weightInGrams = ingredientCostDB.convertToGrams(
          quantity,
          unit,
          ingredientName
        );
        console.log(`✅ Parsed: ${quantity} ${unit} = ${weightInGrams}g`);
        return weightInGrams;
      }
    }

    console.log(`❌ Could not parse weight from: "${size}"`);
    return new Error(`Could not parse weight from: "${size}"`);
  }

  // Get fallback search terms for when specific searches fail
  private getFallbackSearchTerms(ingredient: string): string[] {
    const fallbackMap: Record<string, string[]> = {
      'white bread': ['bread', 'loaf bread', 'sandwich bread'],
      eggs: ['large eggs', 'dozen eggs', 'fresh eggs'],
      milk: [
        'Kroger Kroger® 2% Reduced Fat Milk',
        'Kroger 2% milk',
        'Kroger milk',
        'milk',
        'dairy milk',
        'fresh milk',
      ],
      'all purpose flour': ['flour', 'wheat flour', 'baking flour'],
      'granulated sugar': ['sugar', 'white sugar', 'cane sugar'],
      butter: ['salted butter', 'unsalted butter', 'dairy butter'],
      cheese: ['cheese', 'shredded cheese', 'block cheese'],
      'cheddar cheese': ['cheddar cheese', 'cheddar block'],
      'mozzarella cheese': ['mozzarella cheese', 'shredded mozzarella'],

      'chicken breast': ['chicken', 'boneless chicken', 'chicken meat'],
      'ground beef': ['beef', 'hamburger', 'ground meat'],
      'jasmine rice': ['rice', 'white rice', 'long grain rice'],
      'spaghetti pasta': ['pasta', 'noodles', 'spaghetti'],
      'vegetable oil': ['oil', 'cooking oil', 'canola oil'],
      'table salt': ['salt', 'sea salt', 'kosher salt'],
      'black pepper': ['pepper', 'ground pepper', 'peppercorns'],
      'yellow onions': ['onions', 'cooking onions', 'sweet onions'],
      garlic: ['garlic cloves', 'fresh garlic', 'garlic bulbs'],
      tomatoes: ['fresh tomatoes', 'roma tomatoes', 'vine tomatoes'],
      'russet potatoes': ['potatoes', 'baking potatoes', 'idaho potatoes'],
      bananas: ['fresh bananas', 'ripe bananas', 'banana bunch'],
      'red apples': ['apples', 'gala apples', 'red delicious apples'],
      // Fruits fallback terms
      oranges: ['fresh oranges', 'navel oranges', 'valencia oranges'],
      lemons: ['fresh lemons', 'organic lemons', 'lemon fruit'],
      limes: ['fresh limes', 'key limes', 'lime fruit'],
      strawberries: [
        'fresh strawberries',
        'organic strawberries',
        'strawberry',
      ],
      blueberries: ['fresh blueberries', 'organic blueberries', 'blueberry'],
      raspberries: ['fresh raspberries', 'organic raspberries', 'raspberry'],
      blackberries: [
        'fresh blackberries',
        'organic blackberries',
        'blackberry',
      ],
      grapes: ['fresh grapes', 'red grapes', 'green grapes', 'grape bunch'],
      peaches: ['fresh peaches', 'ripe peaches', 'peach fruit'],
      pears: ['fresh pears', 'bartlett pears', 'pear fruit'],
      plums: ['fresh plums', 'ripe plums', 'plum fruit'],
      cherries: ['fresh cherries', 'sweet cherries', 'cherry fruit'],
      pineapple: ['fresh pineapple', 'whole pineapple', 'pineapple fruit'],
      mango: ['fresh mango', 'ripe mango', 'mango fruit'],
      avocado: ['fresh avocado', 'ripe avocado', 'avocado fruit'],
      kiwi: ['fresh kiwi', 'kiwi fruit', 'organic kiwi'],
      cantaloupe: ['fresh cantaloupe', 'ripe cantaloupe', 'cantaloupe melon'],
      watermelon: [
        'seedless whole watermelon',
        'seedless watermelon',
        'seeded whole watermelon',
        'watermelon seeded red',
        'watermelon fruit',
      ],
      'honeydew melon': ['fresh honeydew', 'ripe honeydew', 'honeydew melon'],

      // Additional fruits fallback terms
      cranberries: [
        'fresh cranberries',
        'dried cranberries',
        'cranberry fruit',
      ],
      elderberries: [
        'fresh elderberries',
        'dried elderberries',
        'elderberry fruit',
      ],
      gooseberries: [
        'fresh gooseberries',
        'gooseberry fruit',
        'cape gooseberries',
      ],
      currants: ['fresh currants', 'dried currants', 'red currants'],
      figs: ['fresh figs', 'dried figs', 'fig fruit'],
      dates: ['medjool dates', 'deglet noor dates', 'fresh dates'],
      prunes: ['dried prunes', 'pitted prunes', 'california prunes'],
      apricots: ['fresh apricots', 'dried apricots', 'apricot fruit'],
      nectarines: ['fresh nectarines', 'ripe nectarines', 'nectarine fruit'],
      persimmons: ['fresh persimmons', 'fuyu persimmons', 'hachiya persimmons'],
      pomegranate: [
        'fresh pomegranate',
        'pomegranate seeds',
        'pomegranate fruit',
      ],
      'passion fruit': [
        'fresh passion fruit',
        'passion fruit',
        'purple passion fruit',
      ],
      'dragon fruit': ['fresh dragon fruit', 'pitaya', 'dragon fruit'],
      'star fruit': ['fresh star fruit', 'carambola', 'star fruit'],
      papaya: ['fresh papaya', 'ripe papaya', 'papaya fruit'],
      guava: ['fresh guava', 'pink guava', 'guava fruit'],

      // Condiments and spreads fallback terms
      'peanut butter': [
        'creamy peanut butter',
        'chunky peanut butter',
        'natural peanut butter',
      ],
      jelly: ['grape jelly', 'strawberry jelly', 'fruit jelly'],
      jam: ['strawberry jam', 'grape jam', 'fruit jam'],
      'hot sauce': [
        'franks hot sauce',
        'louisiana hot sauce',
        'crystal hot sauce',
      ],
      sriracha: ['sriracha sauce', 'rooster sauce', 'thai hot sauce'],
      tabasco: ['tabasco sauce', 'original tabasco', 'hot pepper sauce'],
      ketchup: ['tomato ketchup', 'heinz ketchup', "hunt's ketchup"],
      mustard: ['yellow mustard', 'dijon mustard', 'spicy mustard'],
      mayonnaise: ["hellmann's mayo", 'best foods mayo', 'real mayonnaise'],
      'ranch dressing': [
        'hidden valley ranch',
        'ranch salad dressing',
        'buttermilk ranch',
      ],
      'italian dressing': [
        'wishbone italian',
        'italian salad dressing',
        'zesty italian',
      ],
      'balsamic vinegar': [
        'aged balsamic',
        'balsamic vinegar',
        'italian balsamic',
      ],
      'apple cider vinegar': [
        'bragg apple cider',
        'organic apple cider vinegar',
        'raw apple cider',
      ],
      'white vinegar': [
        'distilled white vinegar',
        'white vinegar',
        'cleaning vinegar',
      ],
      'soy sauce': [
        'kikkoman soy sauce',
        'low sodium soy sauce',
        'tamari soy sauce',
      ],
      'worcestershire sauce': [
        'lea and perrins',
        'worcestershire sauce',
        'worcester sauce',
      ],
      'barbecue sauce': ["sweet baby ray's", 'bbq sauce', 'barbecue sauce'],
      'teriyaki sauce': ['kikkoman teriyaki', 'teriyaki sauce', 'soy teriyaki'],
      'buffalo sauce': [
        "frank's buffalo",
        'buffalo wing sauce',
        'hot wing sauce',
      ],
      'chili sauce': [
        'heinz chili sauce',
        'sweet chili sauce',
        'thai chili sauce',
      ],
      'sweet and sour sauce': [
        'kikkoman sweet and sour',
        'sweet and sour',
        'chinese sweet and sour',
      ],
      'honey mustard': [
        "ken's honey mustard",
        'honey mustard dressing',
        'sweet honey mustard',
      ],
      'ranch seasoning': [
        'hidden valley ranch mix',
        'ranch seasoning mix',
        'ranch dip mix',
      ],
      'taco seasoning': [
        'mccormick taco seasoning',
        'taco seasoning mix',
        'mexican seasoning',
      ],
      'italian seasoning': [
        'mccormick italian seasoning',
        'italian herb mix',
        'mediterranean herbs',
      ],
      'garlic salt': [
        "lawry's garlic salt",
        'garlic salt seasoning',
        'seasoned salt',
      ],
    };

    return fallbackMap[ingredient] || [ingredient.split(' ')[0]]; // Fallback to first word
  }

  private estimateWeightFromCount(
    sizeStr: string,
    quantity: number,
    ingredientName: string
  ): number | Error {
    const sizeLower = sizeStr.toLowerCase();
    const ingredientLower = ingredientName.toLowerCase();

    // Try to match against common items
    for (const [item, weight] of Object.entries(WHOLE_ITEM_WEIGHTS)) {
      if (sizeLower.includes(item) || ingredientLower.includes(item)) {
        console.log(`📦 Estimated ${item}: ${weight}g per count`);
        return (weight * quantity) as number;
      }
    }
    return new Error(
      `No weight estimate found for ${ingredientName} - ${sizeStr}`
    ); // Default to 0 if no match found
  }
}

export const krogerAPI = new KrogerAPIService();
export type { KrogerProduct, KrogerProductSummary };
