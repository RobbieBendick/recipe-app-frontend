import { createContext, useState } from 'react';

interface IDrawerContext {
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}

export const DrawerContext = createContext<IDrawerContext>({
  isDrawerOpen: false,
  toggleDrawer: () => null,
});

export function DrawerProvider(props: {
  children: React.ReactNode;
}): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  return (
    <DrawerContext.Provider
      value={{
        isDrawerOpen,
        toggleDrawer,
      }}
    >
      {props.children}
    </DrawerContext.Provider>
  );
}
