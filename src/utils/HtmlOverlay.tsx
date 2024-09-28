import * as React from "react";

import { type Group, Vector2, Vector3 } from "three";

import { useFrame } from "@react-three/fiber";
import {
  type HtmlOverlayAnchor,
  type HtmlOverlayEntry,
  HtmlOverlayPriority,
  useHtmlOverlays,
} from "./HtmlOverlaysProvider";
import { RenderLayerID } from "./renderingDefines";

export const HtmlOverlay3D: React.FC<{
  x: number;
  y: number;
  z: number;
  priority?: HtmlOverlayPriority;
  children: React.ReactNode;
  visible?: boolean;
  anchor?: HtmlOverlayAnchor;
  tilt?: boolean;
  maxPixelOverlap?: number;
  noOcclusion?: boolean;
}> = ({
  children,
  x,
  y,
  z,
  priority = HtmlOverlayPriority.High,
  visible = true,
  anchor = "center",
  maxPixelOverlap = 0,
  tilt = false,
  noOcclusion = false,
}) => {
  //----------------------------------------------------------------------------

  const { htmlOverlaysRef, frameCounterRef, setHtmlOverlays } =
    useHtmlOverlays();

  const id = React.useId();
  const objRef = React.useRef<Group>(null);
  const divRef = React.useRef<HTMLDivElement>(null);

  const baseSize = new Vector2(
    divRef.current?.clientWidth,
    divRef.current?.clientHeight,
  );

  const [entry, setEntry] = React.useState<HtmlOverlayEntry>();

  //----------------------------------------------------------------------------

  // Whenever this overlay or its children change, add it to the list
  React.useLayoutEffect(
    () =>
      setHtmlOverlays((prevNodes) => {
        for (let i = 0; i < prevNodes.length; i++) {
          if (prevNodes[i].id === id) {
            prevNodes[i].node = <div ref={divRef}>{children}</div>;
            return prevNodes; // Bail early
          }
        }
        // Otherwise, we must create a new entry
        const entry: HtmlOverlayEntry = {
          id,
          priority: HtmlOverlayPriority.High,
          screenDepth: 1.0,
          relativeIndex: prevNodes.length - 1,
          isFrustumCulled: true,
          isOcclusionCulled: true,
          rect: new DOMRect(),
          node: (
            <div
              ref={divRef}
              style={{
                // Only display after the next render loop!
                display: "none",
              }}
            >
              {children}
            </div>
          ),
        };
        const result = prevNodes.concat(entry);
        setEntry(entry);
        return result;
      }),
    [id, children, setHtmlOverlays],
  );

  // Whenever this overlay disappears, remove it from the list
  React.useEffect(
    () => () =>
      setHtmlOverlays((nodes) => nodes.filter((node) => node.id !== id)),
    [id, setHtmlOverlays],
  );

  React.useEffect(() => {
    // Update the object's position
    if (objRef.current) objRef.current.position.set(x, y, z);

    // Reset the visibility of the div if it moves (since we can't trust old
    // occlusion culling visibility assumption)
    if (divRef.current) divRef.current.style.cssText = "display:none;";
    if (entry) entry.isOcclusionCulled = true;
  }, [x, y, z, entry]);

  //----------------------------------------------------------------------------

  useFrame(({ camera, size, raycaster, scene }) => {
    //--------------------------------------------------------------------------

    // Bail if there's no local html ref, or no 3D object
    if (!divRef.current || !objRef.current || !entry) return;

    // Color-based debugging is immensely helpful (enable in debug options)
    // @ts-ignore
    let color = "blue";
    let isVisible = visible;

    // Figure out the position in global 3D space (from its local position)
    positionInWorld.setFromMatrixPosition(objRef.current.matrixWorld);

    // Figure out the position in screen space (z is a relative distance measure)
    positionOnScreen.copy(positionInWorld);
    positionOnScreen.project(camera);
    entry.screenDepth = positionOnScreen.z;
    entry.priority = priority;

    //--------------------------------------------------------------------------
    // Frustum culling: hide HTML overlays outside the camera's viewport
    if (
      positionOnScreen.z < 0 || // Behind the camera
      positionOnScreen.x < -1 ||
      positionOnScreen.x > 1 ||
      positionOnScreen.y < -1 ||
      positionOnScreen.y > 1
    ) {
      entry.isFrustumCulled = true;
      isVisible = false;
    } else entry.isFrustumCulled = false;

    //--------------------------------------------------------------------------
    // Occlusion culling: hide HTML Overlays behind objects in the scene

    if (noOcclusion) {
      entry.isOcclusionCulled = false;
    } else if (
      // Only recalculate for visible overlays
      isVisible &&
      // Only recalculate for on-screen overlays
      !entry.isFrustumCulled &&
      // Spreads out heavy raycast computation such that each HtmlOverlay
      // recomputes its visibility only once every few frames.
      (entry.isOcclusionCulled === undefined ||
        // Spreads out heavy raycast computation such that each HtmlOverlay
        // recomputes its visibility only once every few frames.
        frameCounterRef.current++ %
          // The more HtmlOverlays, the less frequently each will raycast
          Math.ceil(htmlOverlaysRef.current.length / 10) ===
          0)
    ) {
      entry.isOcclusionCulled = false; // Reset the occlusion flag

      // Perform a raycast on eligible layers to see what we hit
      raycaster.layers.disableAll();
      raycaster.layers.enable(RenderLayerID.VisibleCollidable);
      posRelativeToScreen2D.set(positionOnScreen.x, positionOnScreen.y);
      raycaster.setFromCamera(posRelativeToScreen2D, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        // If we hit notably closer than this overlay, occlude
        const hitDist = intersects[0].distance;
        const distToOverlay = raycaster.ray.origin.distanceTo(positionInWorld);
        if (hitDist / distToOverlay < nearlyOneWithErrorTolerance)
          entry.isOcclusionCulled = true;
      }
    }
    if (entry.isOcclusionCulled === undefined || entry.isOcclusionCulled) {
      color = "purple";
      isVisible = false;
    }

    //--------------------------------------------------------------------------
    // Priority/depth culling: hide labels behind other labels

    const transform = getRelativeTransformVector(anchor, tilt);
    if (anchor === "right") transform.x = -1 + transform.x;
    else if (anchor === "bottom") transform.y = -1 + transform.y;

    // This calculation is messy, but oodles more performant than calling, say,
    // div.getBoundingClientRect() on every frame.
    entry.rect = new DOMRect(
      (positionOnScreen.x * size.width) / 2 +
        size.width / 2 +
        size.left +
        transform.x * baseSize.x,
      (-positionOnScreen.y * size.height) / 2 +
        size.height / 2 +
        size.top +
        transform.y * baseSize.y,
      baseSize.x,
      baseSize.y,
    );

    // Check if this overlaps with any other HtmlOverlays... only worth doing
    // if this is still visible given the viewport check and occlusion culling
    if (isVisible) {
      // Use a for loop instead of .forEach() for efficiency
      for (let i = 0; i < htmlOverlaysRef.current.length; i++) {
        const other = htmlOverlaysRef.current[i];
        if (
          // Don't check if an overlay overlaps itself
          id === other.id ||
          // Don't check for overlapping rects with a culled overlay
          other.isFrustumCulled ||
          other.isOcclusionCulled ||
          // Annotations should never be hidden due to overlap
          priority === HtmlOverlayPriority.High ||
          // Don't check for overlapping rects if this is a tilted overlay,
          // since doRectsOverlap() doesn't work for tilted labels. This is due
          // to the CSS rotation occurring AFTER getBoundingClientRect(). To do
          // this correctly, we'd have to use math (yuck!) Maybe someday.
          tilt
        ) {
          // Do nothing
        }
        // Otherwise, if this is the same or lower priority, and it overlaps...
        else if (doRectsOverlap(entry.rect, other.rect, maxPixelOverlap)) {
          // If these overlays are close to one another in 3D space...
          const ratio = other.screenDepth / positionOnScreen.z;
          if (
            ratio > nearlyOneWithErrorTolerance &&
            ratio < 1.0 / nearlyOneWithErrorTolerance
          ) {
            // If these households are both alike in dignity...
            if (other.priority === priority) {
              /// ...hide the one with a higher relative index
              if (other.relativeIndex < entry.relativeIndex) {
                color = "orange";
                isVisible = false;
              }
            }
            /// ...otherwise, hide the lower-priority one
            else if (other.priority > priority) {
              color = "yellow";
              isVisible = false;
            }
          }
          // Otherwise, hide the one further from the screen
          else if (ratio < 1.0) {
            color = "red";
            isVisible = false;
          }
        }
      }
    }

    divRef.current.style.cssText = `position:absolute;white-space:nowrap;transition-property:opacity;transition-duration:600ms;${getCssForAnchorAndTilt(anchor, tilt, size.width, size.height)}${getCssForOpacity(isVisible)}`;
  });

  //----------------------------------------------------------------------------

  return (
    <group
      ref={objRef}
      name={
        // This name is only for debugging purposes
        `html-overlay-${id}`
      }
      layers={
        // This layer id Important to prevent raycasting against dozens or
        // hundreds of other HtmlOverlays
        RenderLayerID.InvisibleNonCollidable
      }
      position={
        // This prevents an awkward frame or two when x, y, and z haven't
        // been applied yet
        offScreen
      }
    />
  );
};

//------------------------------------------------------------------------------

const doRectsOverlap = (a: DOMRect, b: DOMRect, tolerance: number) =>
  a.left + tolerance <= b.right &&
  a.right - tolerance >= b.left &&
  a.bottom - tolerance >= b.top &&
  a.top + tolerance <= b.bottom;

const getRelativeTransformVector = (
  anchor: HtmlOverlayAnchor,
  tilt: boolean,
) => {
  const deltaX =
    anchor === "bottom"
      ? tilt
        ? -0.25
        : -0.5
      : anchor === "top"
        ? tilt
          ? -0.75
          : -0.5
        : anchor === "center"
          ? -0.5
          : 0;
  const deltaY =
    anchor === "left"
      ? tilt
        ? -0.25
        : -0.5
      : anchor === "right"
        ? tilt
          ? -0.75
          : -0.5
        : anchor === "center"
          ? -0.5
          : 0;
  return { x: deltaX, y: deltaY };
};

const getCssForAnchorAndTilt = (
  anchor: HtmlOverlayAnchor,
  tilt: boolean,
  width: number,
  height: number,
) => {
  const xInPixels = (positionOnScreen.x * width) / 2 + width / 2;
  const yInPixels = -((positionOnScreen.y * height) / 2) + height / 2;

  const horizontalPosition =
    anchor === "right"
      ? `right:${Math.round(width - xInPixels)}px;`
      : `left:${Math.round(xInPixels)}px;`;
  const verticalPosition =
    anchor === "bottom"
      ? `bottom:${Math.round(height - yInPixels)}px;`
      : `top:${Math.round(yInPixels)}px;`;

  const relativeTransform = getRelativeTransformVector(anchor, tilt);
  const deltaX = relativeTransform.x * 100;
  const deltaY = relativeTransform.y * 100;

  const rotation = tilt ? 45 : 0;
  const transformation =
    `transform-origin: ${anchor};` +
    `transform: translate(${deltaX}%, ${deltaY}%) rotate(${rotation}deg);`;

  return horizontalPosition + verticalPosition + transformation;
};

const getCssForOpacity = (isVisible: boolean) =>
  isVisible ? "opacity:1" : "pointer-events:none;opacity:0;";

// These "global" variables are actually advised for how React Three Fiber
// performance- we don't want to allocate a bunch of Vector3 instances per
// frame, so it's better to reuse memory. Note this only works because
// Javascript is single-threaded.
const positionInWorld = new Vector3();
const positionOnScreen = new Vector3();
const posRelativeToScreen2D = new Vector2();
const offScreen = new Vector3(
  Number.POSITIVE_INFINITY,
  Number.POSITIVE_INFINITY,
  Number.POSITIVE_INFINITY,
);

const nearlyOneWithErrorTolerance = 0.95;
