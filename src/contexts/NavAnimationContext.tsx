import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export type NavBoundingBox = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

interface NavAnimationContextProps {
  navBoundingBox: NavBoundingBox;
  setNavBoundingBox: (box: NavBoundingBox) => void;
  activeRoute: string;
  lastActiveRoute: string;
}

const NavAnimationContext = createContext<NavAnimationContextProps | undefined>(undefined);

export const NavAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navBoundingBox, setNavBoundingBox] = useState<NavBoundingBox>(null);
  const [activeRoute, setActiveRoute] = useState<string>('');
  const [lastActiveRoute, setLastActiveRoute] = useState<string>('');
  const location = useLocation();
  
  // Track route changes
  useEffect(() => {
    setLastActiveRoute(activeRoute);
    setActiveRoute(location.pathname);
  }, [location.pathname, activeRoute]);

  // Update position on scroll
  useEffect(() => {
    if (!navBoundingBox) return;

    let activeNavButton: Element | null = null;
    
    const updatePosition = () => {
      // Only find the button once and then reuse it
      if (!activeNavButton) {
        const route = location.pathname;
        activeNavButton = document.querySelector(
          `.nav-item-${route.replace(/\//g, "-").replace(/^-/, "")}`
        );
      }
      
      // Update bounding box if active button exists
      if (activeNavButton) {
        const rect = activeNavButton.getBoundingClientRect();
        setNavBoundingBox({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Update on scroll
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition);
    };
  }, [navBoundingBox, location.pathname]);

  return (
    <NavAnimationContext.Provider value={{ 
      navBoundingBox, 
      setNavBoundingBox, 
      activeRoute, 
      lastActiveRoute 
    }}>
      {children}
    </NavAnimationContext.Provider>
  );
};

export const useNavAnimation = () => {
  const context = useContext(NavAnimationContext);
  if (!context) throw new Error("useNavAnimation must be used within NavAnimationProvider");
  return context;
}; 