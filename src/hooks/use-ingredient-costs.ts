import { useState, useEffect, useCallback } from 'react';
import { ingredientCostDB, IngredientCost } from '../database/ingredient-costs';

export const useIngredientCosts = () => {
  const [ingredients, setIngredients] = useState<IngredientCost[]>([]);
  const [stats, setStats] = useState(ingredientCostDB.getStats());
  const [loading, setLoading] = useState(false);

  // Load ingredients from database
  const loadIngredients = useCallback(() => {
    setIngredients(ingredientCostDB.getAllIngredients());
    setStats(ingredientCostDB.getStats());
  }, []);

  // Add ingredient cost
  const addIngredientCost = useCallback(
    (cost: IngredientCost) => {
      ingredientCostDB.addIngredientCost(cost);
      loadIngredients();
    },
    [loadIngredients]
  );

  // Search ingredients
  const searchIngredients = useCallback((query: string) => {
    return ingredientCostDB.searchIngredients(query);
  }, []);

  // Get cost by name
  const getCostByName = useCallback((name: string) => {
    return ingredientCostDB.getCostByName(name);
  }, []);

  // Calculate recipe cost
  const calculateRecipeCost = useCallback(
    (
      ingredients: Array<{
        name: string;
        quantity: number;
        measurement: string;
      }>
    ) => {
      return ingredientCostDB.calculateRecipeCost(ingredients);
    },
    []
  );

  // Add from Kroger data
  const addFromKrogerData = useCallback(
    (
      krogerProducts: Array<{
        productId: string;
        description: string;
        brand: string;
        size: string;
        price: { regular: number; promo?: number };
        locationId?: string;
      }>
    ) => {
      setLoading(true);
      try {
        ingredientCostDB.addFromKrogerData(krogerProducts);
        loadIngredients();
      } finally {
        setLoading(false);
      }
    },
    [loadIngredients]
  );

  // Clear all data
  const clearAll = useCallback(() => {
    ingredientCostDB.clear();
    loadIngredients();
  }, [loadIngredients]);

  // Load ingredients on mount
  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  return {
    ingredients,
    stats,
    loading,
    addIngredientCost,
    searchIngredients,
    getCostByName,
    calculateRecipeCost,
    addFromKrogerData,
    clearAll,
    refresh: loadIngredients,
  };
};
