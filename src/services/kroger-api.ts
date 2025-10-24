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
    } catch (error) {
      console.error('Error searching Kroger products:', error);
      throw error;
    }
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
  async fetchCommonIngredientCosts(locationId?: string): Promise<{
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
    const commonIngredients = [
      'bread',
      'eggs',
      'milk',
      'flour',
      'sugar',
      'butter',
      'cheese',
      'chicken',
      'beef',
      'rice',
      'pasta',
      'oil',
      'salt',
      'pepper',
      'onions',
      'garlic',
      'tomatoes',
      'potatoes',
      'bananas',
      'apples',
    ];

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

    for (const ingredient of commonIngredients) {
      try {
        console.log(`Searching for: ${ingredient}`);

        // Search for the ingredient
        const searchResults = await this.searchProducts({
          term: ingredient,
          locationId,
          limit: 5, // Get top 5 results to find the cheapest
        });

        if (searchResults.products.length === 0) {
          console.log(`❌ No results for ${ingredient}`);
          results.failed++;
          continue;
        }

        console.log(
          `\n📋 Found ${searchResults.products.length} options for ${ingredient}:`
        );
        searchResults.products.forEach((product, index) => {
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

        for (const product of searchResults.products) {
          if (!product.price?.regular || !product.size) {
            console.log(`⚠️ Skipping ${product.brand} - missing price or size`);
            continue;
          }

          // Try to extract weight from size string
          const weightInGrams = this.parseWeightFromSize(product.size);
          if (weightInGrams <= 0) {
            console.log(
              `⚠️ Skipping ${product.brand} ${product.size} - no weight data`
            );
            continue;
          }

          const costPerGram = product.price.regular / weightInGrams;
          console.log(
            `💰 ${product.brand}: $${
              product.price.regular
            } / ${weightInGrams}g = $${costPerGram.toFixed(6)}/gram`
          );

          if (costPerGram < lowestCostPerGram) {
            lowestCostPerGram = costPerGram;
            cheapestProduct = product;
            bestWeight = weightInGrams;
            console.log(`🏆 New cheapest option!`);
          }
        }

        if (cheapestProduct && cheapestProduct.price?.regular) {
          const costPerGram = cheapestProduct.price.regular / bestWeight;

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
            } ${cheapestProduct.size} = ${bestWeight}g)`
          );
          results.success++;
        } else {
          console.log(
            `❌ No valid weight data for ${ingredient} - tried ${searchResults.products.length} products`
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

  // Parse weight from size string (e.g., "1 lb" -> 453.592)
  private parseWeightFromSize(size: string): number {
    const sizeStr = size.toLowerCase();
    console.log(`🔍 Parsing weight from: "${size}"`);

    // Try multiple patterns to extract weight
    const patterns = [
      // Standard patterns: "1 lb", "16 oz", "500g"
      /(\d+(?:\.\d+)?)\s*(lb|pound|oz|ounce|g|gram|kg|kilogram)/,
      // Patterns with extra text: "1 lb loaf", "16 oz bottle"
      /(\d+(?:\.\d+)?)\s*(lb|pound|oz|ounce|g|gram|kg|kilogram)\s+\w+/,
      // Patterns with fractions: "1/2 lb", "0.5 lb"
      /(\d+(?:\.\d+)?|\d+\/\d+)\s*(lb|pound|oz|ounce|g|gram|kg|kilogram)/,
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

        const conversions: Record<string, number> = {
          g: 1,
          gram: 1,
          kg: 1000,
          kilogram: 1000,
          lb: 453.592,
          pound: 453.592,
          oz: 28.3495,
          ounce: 28.3495,
        };

        const weightInGrams = quantity * (conversions[unit] || 0);
        console.log(`✅ Parsed: ${quantity} ${unit} = ${weightInGrams}g`);
        return weightInGrams;
      }
    }

    // If no weight pattern matches, try to estimate from common sizes
    const commonSizes: Record<string, number> = {
      dozen: 12 * 50, // 12 eggs * ~50g each
      count: 100, // Generic count item
      each: 100, // Generic each item
      bunch: 200, // Generic bunch
      head: 500, // Generic head (lettuce, cabbage)
      loaf: 500, // Generic loaf
      bottle: 500, // Generic bottle
      can: 400, // Generic can
      jar: 300, // Generic jar
      bag: 1000, // Generic bag
      box: 200, // Generic box
    };

    for (const [sizeKey, estimatedWeight] of Object.entries(commonSizes)) {
      if (sizeStr.includes(sizeKey)) {
        console.log(`📦 Estimated from "${sizeKey}": ${estimatedWeight}g`);
        return estimatedWeight;
      }
    }

    console.log(`❌ Could not parse weight from: "${size}"`);
    return 0;
  }
}

export const krogerAPI = new KrogerAPIService();
export type { KrogerProduct, KrogerProductSummary };
