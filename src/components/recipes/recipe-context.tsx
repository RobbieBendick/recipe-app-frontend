import { createContext, useState } from 'react';
import { IRecipe } from '../../schemas/schemas';

interface IRecipeContext {
  isAddRecipeDialogOpen: boolean;
  toggleAddRecipeDialog: () => void;
  savedRecipes: IRecipe[];
  setSavedRecipes: (recipes: IRecipe[]) => void;
}

export const RecipeContext = createContext<IRecipeContext>({
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

  const [savedRecipes, setSavedRecipes] = useState<IRecipe[]>([]);

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
