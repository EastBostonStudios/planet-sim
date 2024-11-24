import React, { useContext, type Dispatch, type SetStateAction } from "react";
import styled from "styled-components";

const HtmlOverlaysContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
`;

export type HtmlOverlayAnchor = "left" | "right" | "bottom" | "top" | "center";

export enum HtmlOverlayPriority {
  High = 0,
}

export type HtmlOverlayEntry = {
  id: string;
  priority: HtmlOverlayPriority;
  relativeIndex: number;
  screenDepth: number;
  isFrustumCulled: boolean;
  isOcclusionCulled: boolean | undefined;
  rect: DOMRect;
  node: React.ReactNode;
};

type HtmlOverlaysContextType = {
  htmlOverlaysRef: { current: ReadonlyArray<HtmlOverlayEntry> };
  frameCounterRef: { current: number };
  setHtmlOverlays: Dispatch<SetStateAction<HtmlOverlayEntry[]>>;
};

const HtmlOverlaysContext = React.createContext<
  HtmlOverlaysContextType | undefined
>(undefined);

export const HtmlOverlaysProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const htmlOverlaysRef = React.useRef(new Array<HtmlOverlayEntry>());
  const [htmlOverlays, setHtmlOverlays] = React.useState<HtmlOverlayEntry[]>(
    [],
  );
  React.useEffect(() => {
    htmlOverlaysRef.current = htmlOverlays;
  }, [htmlOverlays]);
  const frameCounterRef = React.useRef(0);
  return (
    <HtmlOverlaysContext.Provider
      value={{ htmlOverlaysRef, frameCounterRef, setHtmlOverlays }}
    >
      {children}
      <HtmlOverlaysContainer>
        {htmlOverlays.map(({ id, node }) => (
          <div key={id}>{node}</div>
        ))}
      </HtmlOverlaysContainer>
    </HtmlOverlaysContext.Provider>
  );
};

export const useHtmlOverlays = () => {
  const context = useContext(HtmlOverlaysContext);
  if (!context)
    throw new Error(
      "useHtmlOverlays() must be used within HtmlOverlaysProvider",
    );
  return context;
};
