import React, { type FC, type ReactNode, useEffect } from "react";
import styled from "styled-components";

const StyledApp = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: darkslategray;
`;

export const BasePage: FC<{ children: ReactNode }> = ({ children }) => {
  //----------------------------------------------------------------------------

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  return <StyledApp>{children}</StyledApp>;
};

export default BasePage;
