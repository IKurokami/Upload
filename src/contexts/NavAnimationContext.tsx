import React, { createContext, useContext, useState } from "react";

export type NavBoundingBox = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

interface NavAnimationContextProps {
  navBoundingBox: NavBoundingBox;
  setNavBoundingBox: (box: NavBoundingBox) => void;
}

const NavAnimationContext = createContext<NavAnimationContextProps | undefined>(undefined);

export const NavAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navBoundingBox, setNavBoundingBox] = useState<NavBoundingBox>(null);
  return (
    <NavAnimationContext.Provider value={{ navBoundingBox, setNavBoundingBox }}>
      {children}
    </NavAnimationContext.Provider>
  );
};

export const useNavAnimation = () => {
  const context = useContext(NavAnimationContext);
  if (!context) throw new Error("useNavAnimation must be used within NavAnimationProvider");
  return context;
}; 