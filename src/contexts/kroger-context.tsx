import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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

  const fetchIngredientCosts = async (locationId?: string) => {
    if (!isConnected) {
      console.log('❌ Cannot fetch costs: Kroger API not connected');
      return;
    }

    setIsFetchingCosts(true);
    try {
      console.log('🛒 Fetching ingredient costs from Kroger...');
      const results = await krogerAPI.fetchCommonIngredientCosts(locationId);

      // Add successful ingredients to the cost database
      for (const ingredient of results.ingredients) {
        ingredientCostDB.addIngredientCost({
          id: `kroger_${ingredient.name}_${Date.now()}`,
          name: ingredient.name,
          costPerGram: ingredient.costPerGram,
          source: 'kroger',
          lastUpdated: new Date(),
          brand: ingredient.brand,
          size: ingredient.size,
          notes: `Auto-fetched from Kroger API - $${ingredient.price.toFixed(
            2
          )}`,
        });
      }

      console.log(`✅ Added ${results.success} ingredient costs to database`);
      console.log(`❌ Failed to fetch ${results.failed} ingredients`);
    } catch (error) {
      console.error('❌ Error fetching ingredient costs:', error);
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
  }, []);

  // Auto-fetch ingredient costs when connected
  useEffect(() => {
    if (isConnected) {
      console.log('🔄 Kroger connected! Auto-fetching ingredient costs...');
      fetchIngredientCosts('01400943'); // Use test location ID
    }
  }, [isConnected]);

  const value: KrogerContextType = {
    isConnected,
    isConnecting,
    connectionError,
    isFetchingCosts,
    testConnection,
    fetchIngredientCosts,
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
