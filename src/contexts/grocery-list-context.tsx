import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Ingredient } from '../schemas/schemas';

export interface GroceryList {
  id: string;
  name: string;
  items: Ingredient[];
  createdAt: Date;
  lastUpdated: Date;
}

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
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);

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
