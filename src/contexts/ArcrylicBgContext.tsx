import React, { createContext, useContext } from "react";

type ArcrylicBgContextType = boolean;

const ArcrylicBgContext = createContext<ArcrylicBgContextType>(false);

export const useArcrylicBg = () => useContext(ArcrylicBgContext);

export const ArcrylicBgProvider = ({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) => (
  <ArcrylicBgContext.Provider value={value}>
    {children}
  </ArcrylicBgContext.Provider>
);
