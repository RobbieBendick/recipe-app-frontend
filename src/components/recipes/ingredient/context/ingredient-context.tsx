import { createContext, useState } from 'react';
import '@/fontAwesomeConfig';

interface IngredientIconMap {
  [key: string]: string;
}

interface IngredientContext {
  ingredients: IngredientIconMap;
  setIngredients: (icons: IngredientIconMap) => void;
}

export const IngredientContext = createContext<IngredientContext>({
  ingredients: {},
  setIngredients: () => null,
});

export function IngredientProvider(props: {
  children: React.ReactNode;
}): JSX.Element {
  const ingredientIcons: IngredientIconMap = {
    Apple: 'apple-alt',
    Bread: 'bread-slice',
    Carrot: 'carrot',
    Cheese: 'cheese',
    Egg: 'egg',
    Fish: 'fish',
    Lemon: 'lemon',
    Pepper: 'pepper-hot',
    Bacon: 'bacon',
    'Ice Cream': 'ice-cream',
    Pizza: 'pizza-slice',
    Coffee: 'coffee',
    Herbs: 'seedling',
    'Chicken Thigh': 'drumstick-bite',
    Wine: 'wine-bottle',
    Cocktail: 'glass-martini-alt',
    Beer: 'beer',
    Milk: 'glass-martini-alt',
    Butter: 'cheese',
    Garlic: 'leaf',
    Onion: 'leaf',
    Tomato: 'pepper-hot',
    'Chicken Breast': 'drumstick-bite',
    Beef: 'hamburger',
    Pork: 'bacon',
    Shrimp: 'fish',
    Pasta: 'pizza-slice',
    Rice: 'seedling',
    Potato: 'carrot',
    Broccoli: 'leaf',
    Cauliflower: 'leaf',
    Spinach: 'leaf',
    'Bell Peppers': 'pepper-hot',
    Mushrooms: 'leaf',
    Zucchini: 'carrot',
    'Sweet Potatoes': 'carrot',
    Corn: 'seedling',
    Peas: 'seedling',
    Beans: 'seedling',
    Lentils: 'seedling',
    Chickpeas: 'seedling',
    Quinoa: 'seedling',
    Oats: 'seedling',
    Almonds: 'seedling',
    Walnuts: 'seedling',
    Peanuts: 'seedling',
  };

  const [ingredients, setIngredients] =
    useState<IngredientIconMap>(ingredientIcons);

  return (
    <IngredientContext.Provider
      value={{
        ingredients,
        setIngredients,
      }}
    >
      {props.children}
    </IngredientContext.Provider>
  );
}
