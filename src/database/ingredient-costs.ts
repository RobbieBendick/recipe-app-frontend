// Ingredient Cost Database
// Stores cost per unit (typically per gram) for ingredients
// This is a cached database that can be populated from Kroger API data

export interface IngredientCost {
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
  ingredients: Map<string, IngredientCost>;
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
  addIngredientCost(cost: IngredientCost): void {
    this.db.ingredients.set(cost.id, cost);
    this.db.totalIngredients = this.db.ingredients.size;
    this.db.lastSync = new Date();

    // Save to localStorage
    this.saveToStorage();
  }

  // Get cost for an ingredient by name (fuzzy search)
  getCostByName(name: string): IngredientCost | null {
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
  getCostById(id: string): IngredientCost | null {
    return this.db.ingredients.get(id) || null;
  }

  // Get all ingredients
  getAllIngredients(): IngredientCost[] {
    return Array.from(this.db.ingredients.values());
  }

  // Search ingredients by partial name
  searchIngredients(query: string): IngredientCost[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: IngredientCost[] = [];

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
        // Convert quantity to grams based on measurement
        const grams = this.convertToGrams(
          ingredient.quantity,
          ingredient.measurement
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
  private convertToGrams(quantity: number, measurement: string): number {
    const conversions: Record<string, number> = {
      // Weight conversions
      g: 1,
      gram: 1,
      grams: 1,
      kg: 1000,
      kilogram: 1000,
      lb: 453.592,
      pound: 453.592,
      pounds: 453.592,
      oz: 28.3495,
      ounce: 28.3495,
      ounces: 28.3495,

      // Volume conversions (approximate for common ingredients)
      ml: 1, // Assuming 1ml = 1g for most liquids
      milliliter: 1,
      milliliters: 1,
      l: 1000,
      liter: 1000,
      liters: 1000,
      cup: 240, // Approximate for most ingredients
      cups: 240,
      tablespoon: 15, // Approximate
      tablespoons: 15,
      tbsp: 15,
      teaspoon: 5, // Approximate
      teaspoons: 5,
      tsp: 5,
      pint: 473.176,
      pints: 473.176,
      quart: 946.353,
      quarts: 946.353,
      gallon: 3785.41,
      gallons: 3785.41,
    };

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
      const weightInGrams = this.parseWeightFromSize(product.size);

      if (weightInGrams > 0) {
        const costPerGram = product.price.regular / weightInGrams;

        const cost: IngredientCost = {
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
  }

  // Parse weight from size string (e.g., "1 lb" -> 453.592)
  private parseWeightFromSize(size: string): number {
    const sizeStr = size.toLowerCase();

    // Extract number and unit
    const match = sizeStr.match(
      /(\d+(?:\.\d+)?)\s*(lb|pound|oz|ounce|g|gram|kg|kilogram)/
    );
    if (!match) return 0;

    const quantity = parseFloat(match[1]);
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

    return quantity * (conversions[unit] || 0);
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
        this.db.ingredients = new Map(data.ingredients);
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
