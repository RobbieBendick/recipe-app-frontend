// Ingredient Cost Database
// Stores cost per unit (typically per gram) for ingredients
// This is a cached database that can be populated from Kroger API data

import { krogerAPI } from '../services/kroger-api';
import {
  INGREDIENT_DENSITIES,
  MEASUREMENT_CONVERSIONS,
  WHOLE_ITEM_WEIGHTS,
  WHOLE_ITEM_MEASUREMENTS,
} from '../constants/ingredient-constants';

export interface IngredientInfo {
  id: string;
  name: string;
  costPerGram: number; // Cost per gram in USD
  source: 'kroger' | 'manual' | 'estimated';
  lastUpdated: Date;
  locationId?: string; // Kroger location ID if from Kroger API
  brand?: string;
  size?: string;
  notes?: string;
}

export interface CostDatabase {
  ingredients: Map<string, IngredientInfo>;
  lastSync: Date | null;
  totalIngredients: number;
}

class IngredientCostDatabase {
  private db: CostDatabase = {
    ingredients: new Map(),
    lastSync: null,
    totalIngredients: 0,
  };

  // Add or update an ingredient cost
  addIngredientCost(cost: IngredientInfo): void {
    this.db.ingredients.set(cost.id, cost);
    this.db.totalIngredients = this.db.ingredients.size;
    this.db.lastSync = new Date();

    // Save to localStorage
    this.saveToStorage();
  }

  // Add ingredient cost, replacing existing if same name found
  addOrUpdateIngredientCost(cost: IngredientInfo): void {
    const normalizedName = cost.name.toLowerCase().trim();

    // Check if we already have an ingredient with this name
    for (const [id, existingCost] of this.db.ingredients) {
      if (existingCost.name.toLowerCase().trim() === normalizedName) {
        // Replace the existing entry
        console.log(
          `🔄 Updating existing ingredient: ${cost.name} (replacing ${existingCost.id})`
        );
        this.db.ingredients.delete(id);
        break;
      }
    }

    // Add the new cost
    this.db.ingredients.set(cost.id, cost);
    this.db.totalIngredients = this.db.ingredients.size;
    this.db.lastSync = new Date();

    // Save to localStorage
    this.saveToStorage();
  }

  // Fix date objects that might be strings from localStorage
  private fixDateObjects(): void {
    for (const [id, ingredient] of this.db.ingredients) {
      if (!(ingredient.lastUpdated instanceof Date)) {
        ingredient.lastUpdated = new Date(ingredient.lastUpdated);
        this.db.ingredients.set(id, ingredient);
      }
    }
  }

  // Remove duplicates by keeping the most recent entry for each ingredient name
  removeDuplicates(): { removed: number; kept: number } {
    // First, fix any date objects that might be strings
    this.fixDateObjects();
    const ingredientGroups = new Map<string, IngredientInfo[]>();

    // Group ingredients by normalized name
    for (const cost of this.db.ingredients.values()) {
      const normalizedName = cost.name.toLowerCase().trim();
      if (!ingredientGroups.has(normalizedName)) {
        ingredientGroups.set(normalizedName, []);
      }
      ingredientGroups.get(normalizedName)!.push(cost);
    }

    let removed = 0;
    let kept = 0;
    const newIngredients = new Map<string, IngredientInfo>();

    // For each group, keep only the most recent entry
    for (const [, costs] of ingredientGroups) {
      if (costs.length > 1) {
        // Sort by lastUpdated date (most recent first)
        costs.sort((a, b) => {
          const dateA =
            a.lastUpdated instanceof Date
              ? a.lastUpdated
              : new Date(a.lastUpdated);
          const dateB =
            b.lastUpdated instanceof Date
              ? b.lastUpdated
              : new Date(b.lastUpdated);
          return dateB.getTime() - dateA.getTime();
        });

        // Keep the most recent one
        const keepCost = costs[0];
        newIngredients.set(keepCost.id, keepCost);
        kept++;

        // Remove the rest
        for (let i = 1; i < costs.length; i++) {
          removed++;
          console.log(
            `🗑️ Removed duplicate: ${costs[i].name} (${costs[i].id}) - kept newer version`
          );
        }
      } else {
        // Only one entry, keep it
        newIngredients.set(costs[0].id, costs[0]);
        kept++;
      }
    }

    // Update the database
    this.db.ingredients = newIngredients;
    this.db.totalIngredients = this.db.ingredients.size;
    this.db.lastSync = new Date();

    // Save to localStorage
    this.saveToStorage();

    console.log(
      `🧹 Duplicate removal complete: ${removed} removed, ${kept} kept`
    );
    return { removed, kept };
  }

  // Get cost for an ingredient by name (fuzzy search)
  getCostByName(name: string): IngredientInfo | null {
    const normalizedName = name.toLowerCase().trim();

    for (const cost of this.db.ingredients.values()) {
      if (
        cost.name.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(cost.name.toLowerCase())
      ) {
        return cost;
      }
    }
    return null;
  }

  // Get cost by exact ID
  getCostById(id: string): IngredientInfo | null {
    return this.db.ingredients.get(id) || null;
  }

  // Get all ingredients
  getAllIngredients(): IngredientInfo[] {
    return Array.from(this.db.ingredients.values());
  }

  // Search ingredients by partial name
  searchIngredients(query: string): IngredientInfo[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: IngredientInfo[] = [];

    for (const cost of this.db.ingredients.values()) {
      if (cost.name.toLowerCase().includes(normalizedQuery)) {
        results.push(cost);
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Calculate total cost for a recipe
  calculateRecipeCost(
    ingredients: Array<{
      name: string;
      quantity: number;
      measurement: string;
    }>
  ): {
    totalCost: number;
    breakdown: Array<{
      ingredient: string;
      quantity: number;
      measurement: string;
      costPerGram: number;
      totalCost: number;
      found: boolean;
    }>;
    missingIngredients: string[];
  } {
    const breakdown: Array<{
      ingredient: string;
      quantity: number;
      measurement: string;
      costPerGram: number;
      totalCost: number;
      found: boolean;
    }> = [];

    const missingIngredients: string[] = [];
    let totalCost = 0;

    for (const ingredient of ingredients) {
      const cost = this.getCostByName(ingredient.name);

      if (cost) {
        // convert name to grams
        const grams = this.convertToGrams(
          ingredient.quantity,
          ingredient.measurement,
          ingredient.name
        );
        const ingredientCost = grams * cost.costPerGram;

        breakdown.push({
          ingredient: ingredient.name,
          quantity: ingredient.quantity,
          measurement: ingredient.measurement,
          costPerGram: cost.costPerGram,
          totalCost: ingredientCost,
          found: true,
        });

        totalCost += ingredientCost;
      } else {
        breakdown.push({
          ingredient: ingredient.name,
          quantity: ingredient.quantity,
          measurement: ingredient.measurement,
          costPerGram: 0,
          totalCost: 0,
          found: false,
        });

        missingIngredients.push(ingredient.name);
      }
    }

    return {
      totalCost,
      breakdown,
      missingIngredients,
    };
  }

  // Convert various measurements to grams
  convertToGrams(
    quantity: number,
    measurement: string,
    ingredientName: string
  ): number {
    // Ingredient-specific density conversions (grams per cup)
    // Use imported constants
    const conversions = MEASUREMENT_CONVERSIONS;

    // Note: Fraction handling is done by the recipe parser, which converts
    // fractions like "half cup" to quantity: 0.5, measurement: "cup"
    // So we don't need to handle fractions here

    // Weight measurements should use weight conversions, not density
    const weightMeasurements = [
      'g',
      'gram',
      'grams',
      'kg',
      'kilogram',
      'lb',
      'pound',
      'pounds',
      'oz',
      'ounce',
      'ounces',
    ];
    const measurementLower = measurement.toLowerCase();

    // If it's a weight measurement, use weight conversion directly
    if (weightMeasurements.includes(measurementLower)) {
      const conversionFactor = conversions[measurementLower] || 1;
      return quantity * conversionFactor;
    }

    // For volume measurements, use ingredient-specific density if available
    if (ingredientName && typeof ingredientName === 'string') {
      const density = INGREDIENT_DENSITIES[ingredientName.toLowerCase()];
      if (density) {
        // For cup measurements, use the density directly
        if (measurementLower === 'cup' || measurementLower === 'cups') {
          return quantity * density;
        }

        // For other volume measurements, convert to cups first, then apply density
        const cupConversions: Record<string, number> = {
          teaspoon: 1 / 48, // 1 tsp = 1/48 cup
          teaspoons: 1 / 48,
          tsp: 1 / 48,
          tablespoon: 1 / 16, // 1 tbsp = 1/16 cup
          tablespoons: 1 / 16,
          tbsp: 1 / 16,
          'fl oz': 1 / 8, // 1 fl oz = 1/8 cup
          floz: 1 / 8,
          'fluid ounce': 1 / 8,
          'fluid ounces': 1 / 8,
          ml: 1 / 236.588, // 1 ml = 1/236.588 cup
          milliliter: 1 / 236.588,
          milliliters: 1 / 236.588,
          l: 4.22675, // 1 liter = 4.22675 cups
          liter: 4.22675,
          liters: 4.22675,
          pint: 2, // 1 pint = 2 cups
          pints: 2,
          quart: 4, // 1 quart = 4 cups
          quarts: 4,
          gallon: 16, // 1 gallon = 16 cups
          gallons: 16,
        };

        const cupEquivalent = cupConversions[measurementLower];
        // Only use density if this is a recognized volume measurement
        if (cupEquivalent !== undefined) {
          const cups = quantity * cupEquivalent;
          return cups * density;
        }
      }
    }

    // For whole/piece items, use ingredient-specific weight estimates
    if (WHOLE_ITEM_MEASUREMENTS.includes(measurement.toLowerCase())) {
      console.log(
        `🔍 Processing whole/piece item: ${ingredientName} (${measurement})`
      );
      if (ingredientName && typeof ingredientName === 'string') {
        const ingredientLower = ingredientName.toLowerCase();
        console.log(
          `🔍 Processing: "${ingredientName}" -> "${ingredientLower}"`
        );

        // Try to find a matching weight
        for (const [item, weight] of Object.entries(WHOLE_ITEM_WEIGHTS)) {
          if (
            ingredientLower.includes(item) ||
            item.includes(ingredientLower)
          ) {
            console.log(
              `🍎 Found match! ${ingredientName}: ${weight}g per ${measurement}`
            );
            return quantity * weight;
          }
        }

        // If no specific match, try partial matches
        for (const [item, weight] of Object.entries(WHOLE_ITEM_WEIGHTS)) {
          if (
            ingredientLower.includes(item.substring(0, 4)) ||
            item.includes(ingredientLower.substring(0, 4))
          ) {
            console.log(
              `🍎 Partial match! ${ingredientName}: ${weight}g per ${measurement}`
            );
            return quantity * weight;
          }
        }

        console.log(
          `⚠️ No weight estimate found for ${ingredientName} (${measurement})`
        );
        return 0; // Return 0 if no weight estimate available
      }
    }

    const conversionFactor = conversions[measurement.toLowerCase()] || 1;
    return quantity * conversionFactor;
  }

  // Add multiple ingredients from Kroger API data
  addFromKrogerData(
    krogerProducts: Array<{
      productId: string;
      description: string;
      brand: string;
      size: string;
      price: { regular: number; promo?: number };
      locationId?: string;
    }>
  ): void {
    for (const product of krogerProducts) {
      // Extract weight from size (e.g., "1 lb" -> 453.592 grams)
      const weightInGrams = krogerAPI.parseWeightFromSize(
        product.size,
        product.description
      );

      if (weightInGrams instanceof Error || weightInGrams <= 0) {
        console.error(
          `❌ Error parsing weight from size: ${product.size} for ${product.description}`
        );
        continue;
      }

      const costPerGram = product.price.regular / weightInGrams;

      const cost: IngredientInfo = {
        id: `kroger_${product.productId}`,
        name: product.description,
        costPerGram,
        source: 'kroger',
        lastUpdated: new Date(),
        locationId: product.locationId,
        brand: product.brand,
        size: product.size,
        notes: product.price.promo
          ? `Sale price: $${product.price.promo}`
          : undefined,
      };

      this.addIngredientCost(cost);
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const data = {
        ingredients: Array.from(this.db.ingredients.entries()),
        lastSync: this.db.lastSync,
        totalIngredients: this.db.totalIngredients,
      };
      localStorage.setItem('ingredientCosts', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save ingredient costs to localStorage:', error);
    }
  }

  // Load from localStorage
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ingredientCosts');
      if (stored) {
        const data = JSON.parse(stored);
        this.db.ingredients = new Map();

        // Convert date strings back to Date objects
        for (const [id, ingredient] of data.ingredients) {
          ingredient.lastUpdated = new Date(ingredient.lastUpdated);
          this.db.ingredients.set(id, ingredient);
        }

        this.db.lastSync = data.lastSync ? new Date(data.lastSync) : null;
        this.db.totalIngredients = data.totalIngredients || 0;
      }
    } catch (error) {
      console.error(
        'Failed to load ingredient costs from localStorage:',
        error
      );
    }
  }

  // Remove ingredient by ID
  removeIngredient(id: string): boolean {
    const removed = this.db.ingredients.delete(id);
    if (removed) {
      this.db.totalIngredients = this.db.ingredients.size;
      this.db.lastSync = new Date();
      this.saveToStorage();
    }
    return removed;
  }

  // Clear all data
  clear(): void {
    this.db.ingredients.clear();
    this.db.lastSync = null;
    this.db.totalIngredients = 0;
    localStorage.removeItem('ingredientCosts');
  }

  // Get database stats
  getStats(): {
    totalIngredients: number;
    lastSync: Date | null;
    sources: Record<string, number>;
  } {
    const sources: Record<string, number> = {};

    for (const cost of this.db.ingredients.values()) {
      sources[cost.source] = (sources[cost.source] || 0) + 1;
    }

    return {
      totalIngredients: this.db.totalIngredients,
      lastSync: this.db.lastSync,
      sources,
    };
  }
}

// Export singleton instance
export const ingredientCostDB = new IngredientCostDatabase();

// Load data on import
ingredientCostDB.loadFromStorage();
