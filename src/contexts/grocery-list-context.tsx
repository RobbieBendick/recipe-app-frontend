import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Ingredient } from '../schemas/schemas';

export interface GroceryList {
  id: string;
  name: string;
  items: Ingredient[];
  recipeTitles?: string[]; // Optional: titles of recipes used to create this list
  createdAt: Date;
  lastUpdated: Date;
}

const STORAGE_KEY = 'groceryLists';

interface GroceryListContextType {
  groceryLists: GroceryList[];
  addGroceryList: (
    groceryList: Omit<GroceryList, 'id' | 'createdAt' | 'lastUpdated'>
  ) => void;
  updateGroceryList: (id: string, updates: Partial<GroceryList>) => void;
  deleteGroceryList: (id: string) => void;
  getGroceryList: (id: string) => GroceryList | undefined;
}

const GroceryListContext = createContext<GroceryListContextType | undefined>(
  undefined
);

export const useGroceryList = () => {
  const context = useContext(GroceryListContext);
  if (!context) {
    throw new Error('useGroceryList must be used within a GroceryListProvider');
  }
  return context;
};

interface GroceryListProviderProps {
  children: ReactNode;
}

export const GroceryListProvider: React.FC<GroceryListProviderProps> = ({
  children,
}) => {
  // Load from localStorage on mount
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{
          id: string;
          name: string;
          items: Ingredient[];
          recipeTitles?: string[];
          createdAt: string;
          lastUpdated: string;
        }>;
        // Convert date strings back to Date objects
        return parsed.map(list => ({
          ...list,
          createdAt: new Date(list.createdAt),
          lastUpdated: new Date(list.lastUpdated),
        }));
      }
    } catch (error) {
      console.error('Error loading grocery lists from localStorage:', error);
    }
    return [];
  });

  // Save to localStorage whenever groceryLists changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groceryLists));
    } catch (error) {
      console.error('Error saving grocery lists to localStorage:', error);
    }
  }, [groceryLists]);

  const addGroceryList = (
    groceryList: Omit<GroceryList, 'id' | 'createdAt' | 'lastUpdated'>
  ) => {
    const newGroceryList: GroceryList = {
      ...groceryList,
      id: `grocery_${Date.now()}`,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    setGroceryLists(prev => [...prev, newGroceryList]);
  };

  const updateGroceryList = (id: string, updates: Partial<GroceryList>) => {
    setGroceryLists(prev =>
      prev.map(list =>
        list.id === id ? { ...list, ...updates, lastUpdated: new Date() } : list
      )
    );
  };

  const deleteGroceryList = (id: string) => {
    setGroceryLists(prev => prev.filter(list => list.id !== id));
  };

  const getGroceryList = (id: string) => {
    return groceryLists.find(list => list.id === id);
  };

  const value: GroceryListContextType = {
    groceryLists,
    addGroceryList,
    updateGroceryList,
    deleteGroceryList,
    getGroceryList,
  };

  return (
    <GroceryListContext.Provider value={value}>
      {children}
    </GroceryListContext.Provider>
  );
};
