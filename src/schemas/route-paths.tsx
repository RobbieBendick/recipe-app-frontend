export interface IRoute {
  path: string;
  element: JSX.Element;
}
export const ROUTE_PATHS: { [key: string]: string } = {
  home: '/',
  recipes: '/recipes',
  recipePage: '/recipe/:recipeId',
  savedGroceryLists: '/saved-grocery-lists',
  createGroceryList: '/create-grocery-list',
  krogerTest: '/kroger-test',
  ingredientCosts: '/ingredient-costs',
  testDb: '/test-db',
};
