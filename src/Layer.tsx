// biome-ignore lint/style/useImportType: <explanation>
import React, { createContext, type ReactNode, useContext } from "react";

const LayerContext = createContext<string | undefined>(undefined);

export const Layer: React.FC<{ name: string; children: ReactNode }> = ({
  name,
  children,
}) => {
  const parentName = useContext(LayerContext);
  // TODO: Allow layers to be disabled by some sort of flag system
  return (
    <LayerContext.Provider value={!parentName ? name : `${parentName}.${name}`}>
      {children}
    </LayerContext.Provider>
  );
};

export const useLayerName = (name: string) => {
  const parentName = useContext(LayerContext);
  return !parentName ? name : `${parentName}.${name}`;
};
