'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type NavPosition = 'left' | 'right' | 'top' | 'bottom';

interface NavbarPositionContextValue {
  position: NavPosition;
  setPosition: (pos: NavPosition) => void;
}

const NavbarPositionContext = createContext<NavbarPositionContextValue>({
  position: 'left',
  setPosition: () => {},
});

export function NavbarPositionProvider({ children }: { children: React.ReactNode }) {
  const [position, setPositionState] = useState<NavPosition>('left');

  useEffect(() => {
    const saved = localStorage.getItem('navbar_position') as NavPosition | null;
    if (saved && ['left', 'right', 'top', 'bottom'].includes(saved)) {
      setPositionState(saved);
    }
  }, []);

  const setPosition = (pos: NavPosition) => {
    setPositionState(pos);
    localStorage.setItem('navbar_position', pos);
  };

  return (
    <NavbarPositionContext.Provider value={{ position, setPosition }}>
      {children}
    </NavbarPositionContext.Provider>
  );
}

export function useNavbarPosition() {
  return useContext(NavbarPositionContext);
}
