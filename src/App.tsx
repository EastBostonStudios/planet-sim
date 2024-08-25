import * as Popover from "@radix-ui/react-popover";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import styled from "styled-components";

const StyledApp = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: black;
    background-image: url("test.gif");
    background-size:cover;
`;

const StyledTopBar = styled.div`
    background: linear-gradient(black 0%, var(--color-2-transparent) 100%);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: outset var(--color-5);
    border-width: 0 0 3px 0;
    padding:4px;
`;
/*
    height: var(--spacing-large);
    background: linear-gradient(var(--color-2) 0%, var(--color-1) 100%);
    border-style: solid;
    border-width: 4px;
    border-color: black;
 */

const StyledButton = styled.button``;

const Button2 = styled.button`
    width:32px;
    height:32px;
    border-radius: 16px;
`;

const StyledDiv = styled.div`
    padding: var(--spacing-small);
    background-color: var(--color-1);
    border-style: outset;
    border-width: 4px;
    border-color: var(--color-3);
`;

const App = () => {
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  return (
    <StyledApp className="App">
      <Canvas
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <OrbitControls />
        <directionalLight rotation={[45, 45, 45]} />
        <ambientLight />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#6be092" />
        </mesh>
      </Canvas>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <StyledTopBar
          style={{ display: "flex", gap: "8px", justifyContent: "end" }}
        >
          <Button2>?</Button2>
          <Button2>!</Button2>
        </StyledTopBar>

        <Popover.Root>
          <Popover.Trigger asChild>
            <StyledButton>Test</StyledButton>
          </Popover.Trigger>
          <Popover.Anchor />
          <Popover.Portal>
            <Popover.Content sideOffset={5}>
              <Popover.Close />
              <Popover.Arrow />
              <div>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <StyledButton>Test 2</StyledButton>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <StyledTopBar style={{ width: 400 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </StyledTopBar>
        </div>
      </div>
    </StyledApp>
  );
};

export default App;
