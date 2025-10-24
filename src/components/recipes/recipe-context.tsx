import { createContext, useState, useEffect } from 'react';
import { Recipe } from '@/schemas/schemas';

interface RecipeContext {
  isAddRecipeDialogOpen: boolean;
  toggleAddRecipeDialog: () => void;
  savedRecipes: Recipe[];
  setSavedRecipes: (recipes: Recipe[]) => void;
}

export const RecipeContext = createContext<RecipeContext>({
  isAddRecipeDialogOpen: false,
  toggleAddRecipeDialog: () => null,
  savedRecipes: [],
  setSavedRecipes: () => null,
});

export function RecipeProvider(props: {
  children: React.ReactNode;
}): JSX.Element {
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] =
    useState<boolean>(false);

  const toggleAddRecipeDialog = () => {
    setIsAddRecipeDialogOpen(prev => !prev);
  };

  // load recipes from localStorage on component mount
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    try {
      const stored = localStorage.getItem('recipe-app-recipes');
      if (stored) {
        const parsed = JSON.parse(stored) as Recipe[];
        // convert createdAt strings back to Date objects
        return parsed.map((recipe: Recipe) => ({
          ...recipe,
          createdAt: recipe.createdAt ? new Date(recipe.createdAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Error loading recipes from localStorage:', error);
    }
    return [];
  });

  // Save recipes to localStorage whenever savedRecipes changes
  useEffect(() => {
    try {
      localStorage.setItem('recipe-app-recipes', JSON.stringify(savedRecipes));
    } catch (error) {
      console.error('Error saving recipes to localStorage:', error);
    }
  }, [savedRecipes]);

  return (
    <RecipeContext.Provider
      value={{
        isAddRecipeDialogOpen,
        toggleAddRecipeDialog,
        savedRecipes,
        setSavedRecipes,
      }}
    >
      {props.children}
    </RecipeContext.Provider>
  );
}
