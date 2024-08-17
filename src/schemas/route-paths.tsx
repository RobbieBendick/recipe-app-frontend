export interface IRoute {
  path: string;
  element: JSX.Element;
}
export const ROUTE_PATHS: { [key: string]: string } = {
  home: '/',
  recipes: '/recipes',
  recentGroceryLists: '/recent-grocery-lists',
  createGroceryList: '/create-grocery-list',
};
