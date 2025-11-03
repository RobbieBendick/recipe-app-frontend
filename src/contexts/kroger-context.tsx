import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { krogerAPI } from '../services/kroger-api';
import { ingredientCostDB } from '../database/ingredient-costs';

interface KrogerContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  isFetchingCosts: boolean;
  testConnection: () => Promise<void>;
  fetchIngredientCosts: (locationId?: string) => Promise<void>;
  completeIngredientDatabase: (locationId?: string) => Promise<void>;
  clearError: () => void;
}

const KrogerContext = createContext<KrogerContextType | undefined>(undefined);

interface KrogerProviderProps {
  children: ReactNode;
}

export const KrogerProvider: React.FC<KrogerProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingCosts, setIsFetchingCosts] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      console.log('Testing Kroger API connection on app startup...');
      const connected = await krogerAPI.testConnection();
      setIsConnected(connected);

      if (connected) {
        console.log('✅ Kroger API connected successfully!');
      } else {
        setConnectionError('Failed to connect to Kroger API');
      }
    } catch (error) {
      console.error('❌ Kroger API connection failed:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Unknown error'
      );
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchIngredientCosts = useCallback(
    async (locationId?: string) => {
      if (!isConnected) {
        console.log('❌ Cannot fetch costs: Kroger API not connected');
        return;
      }

      // Check if we already have recent Kroger data (within last 7 days)
      const stats = ingredientCostDB.getStats();
      const hasRecentKrogerData =
        stats.sources.kroger && stats.sources.kroger > 0;
      const isDataRecent =
        stats.lastSync &&
        Date.now() - stats.lastSync.getTime() < 24 * 60 * 60 * 1000 * 7; // 7 days

      if (hasRecentKrogerData && isDataRecent) {
        console.log('📦 Using cached Kroger data (less than 7 days old)');
        console.log(
          `📊 Database contains ${stats.totalIngredients} ingredients`
        );
        console.log(`📊 Data sources:`, stats.sources);
        return;
      }

      setIsFetchingCosts(true);
      try {
        console.log('🛒 Fetching ingredient costs from Kroger...');
        const results = await krogerAPI.fetchIngredientCosts(locationId);

        // Add successful ingredients to the cost database
        for (const ingredient of results.ingredients) {
          ingredientCostDB.addOrUpdateIngredientCost({
            id: `kroger_${ingredient.name}_${Date.now()}`,
            name: ingredient.name,
            costPerGram: ingredient.costPerGram,
            source: 'kroger',
            lastUpdated: new Date(),
            locationId: '01400943', // Store the location ID for reference
            brand: ingredient.brand,
            size: ingredient.size,
            notes: `Auto-fetched from Kroger API - $${ingredient.price.toFixed(
              2
            )}`,
          });
        }

        console.log(`✅ Added ${results.success} ingredient costs to database`);
        console.log(`❌ Failed to fetch ${results.failed} ingredients`);

        // Show database stats after caching
        const stats = ingredientCostDB.getStats();
        console.log(
          `📊 Database now contains ${stats.totalIngredients} ingredients`
        );
        console.log(`📊 Data sources:`, stats.sources);
      } catch (error) {
        console.error('❌ Error fetching ingredient costs:', error);
      } finally {
        setIsFetchingCosts(false);
      }
    },
    [isConnected]
  );

  const completeIngredientDatabase = async (locationId?: string) => {
    if (!isConnected) {
      console.log('❌ Cannot complete database: Kroger API not connected');
      return;
    }

    setIsFetchingCosts(true);
    try {
      console.log('🔄 Starting complete ingredient database fetch...');
      const results = await krogerAPI.fetchIngredientCosts(locationId);

      // Add successful ingredients to the cost database
      for (const ingredient of results.ingredients) {
        ingredientCostDB.addOrUpdateIngredientCost({
          id: `kroger_${ingredient.name}_${Date.now()}`,
          name: ingredient.name,
          costPerGram: ingredient.costPerGram,
          source: 'kroger',
          lastUpdated: new Date(),
          locationId: '01400943', // Store the location ID for reference
          brand: ingredient.brand,
          size: ingredient.size,
          notes: `Complete database fetch - $${ingredient.price.toFixed(2)}`,
        });
      }

      console.log(`✅ Complete database fetch results:`);
      console.log(`✅ Successfully fetched: ${results.success}`);
      console.log(`❌ Failed to fetch: ${results.failed}`);

      // Show database stats after caching
      const stats = ingredientCostDB.getStats();
      console.log(
        `📊 Database now contains ${stats.totalIngredients} ingredients`
      );
      console.log(`📊 Data sources:`, stats.sources);
    } catch (error) {
      console.error('❌ Error completing ingredient database:', error);
    } finally {
      setIsFetchingCosts(false);
    }
  };

  const clearError = () => {
    setConnectionError(null);
  };

  // Test connection on app startup
  useEffect(() => {
    testConnection();

    // Show cached data immediately if available
    const stats = ingredientCostDB.getStats();
    if (stats.totalIngredients > 0) {
      console.log('📦 Cached ingredient data available:');
      console.log(`📊 Database contains ${stats.totalIngredients} ingredients`);
      console.log(`📊 Data sources:`, stats.sources);
      console.log(
        `📊 Last updated: ${
          stats.lastSync ? new Date(stats.lastSync).toLocaleString() : 'Unknown'
        }`
      );
    }
  }, []);

  // Auto-fetch ingredient costs when connected
  useEffect(() => {
    if (isConnected) {
      console.log('🔄 Kroger connected! Auto-fetching ingredient costs...');
      fetchIngredientCosts('01400943'); // Use test location ID
    }
  }, [isConnected, fetchIngredientCosts]);

  const value: KrogerContextType = {
    isConnected,
    isConnecting,
    connectionError,
    isFetchingCosts,
    testConnection,
    fetchIngredientCosts,
    completeIngredientDatabase,
    clearError,
  };

  return (
    <KrogerContext.Provider value={value}>{children}</KrogerContext.Provider>
  );
};

export const useKroger = (): KrogerContextType => {
  const context = useContext(KrogerContext);
  if (context === undefined) {
    throw new Error('useKroger must be used within a KrogerProvider');
  }
  return context;
};
