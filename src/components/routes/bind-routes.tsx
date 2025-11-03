import { Routes, Route } from 'react-router-dom';
import { DrawerProvider } from '@/components/drawer/drawer-context';
import { Home } from '@/components/home/home';
import { Recipes } from '@/components/recipes/recipes';
import { RecipePage } from '@/components/recipes/recipe-page';
import { SavedGroceryLists } from '@/components/saved-grocery-lists/saved-grocery-lists';
import { CreateGroceryList } from '@/components/create-grocery-list/create-grocery-list';
import { KrogerTest } from '@/components/kroger-test/kroger-test';
import { IngredientCostManager } from '@/components/ingredient-costs/ingredient-cost-manager';
import { TestDB } from '@/components/test-db/test-db';
import { RecipeProvider } from '@/components/recipes/recipe-context';
import ResponsiveNavBar from '@/components/nav/navbar';
import { IRoute, ROUTE_PATHS } from '@/schemas/route-paths';
import { IngredientProvider } from '@/components/recipes/ingredient/context/ingredient-context';

const routes: IRoute[] = [
  {
    path: ROUTE_PATHS.home,
    element: <Home />,
  },
  {
    path: ROUTE_PATHS.recipes,
    element: <Recipes />,
  },
  {
    path: ROUTE_PATHS.recipePage,
    element: <RecipePage />,
  },
  {
    path: ROUTE_PATHS.savedGroceryLists,
    element: <SavedGroceryLists />,
  },
  {
    path: ROUTE_PATHS.createGroceryList,
    element: <CreateGroceryList />,
  },
  {
    path: ROUTE_PATHS.krogerTest,
    element: <KrogerTest />,
  },
  {
    path: ROUTE_PATHS.ingredientCosts,
    element: <IngredientCostManager />,
  },
  {
    path: ROUTE_PATHS.testDb,
    element: <TestDB />,
  },
];

export function BindRoutes(props: { children?: React.ReactNode }): JSX.Element {
  return (
    <DrawerProvider>
      <RecipeProvider>
        <IngredientProvider>
          <>
            <ResponsiveNavBar />
            <Routes>
              {routes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
              {props.children}
            </Routes>
          </>
        </IngredientProvider>
      </RecipeProvider>
    </DrawerProvider>
  );
}
