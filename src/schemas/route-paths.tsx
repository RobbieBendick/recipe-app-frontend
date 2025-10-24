export interface IRoute {
  path: string;
  element: JSX.Element;
}
export const ROUTE_PATHS: { [key: string]: string } = {
  home: '/',
  recipes: '/recipes',
  recipePage: '/recipe/:recipeId',
  recentGroceryLists: '/recent-grocery-lists',
  createGroceryList: '/create-grocery-list',
};
