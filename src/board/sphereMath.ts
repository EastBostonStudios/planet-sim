import { Vector2, Vector3 } from "three";
import { degToRad, radToDeg } from "three/src/math/MathUtils";

/*;
  x = R * cos(lat) * cos(lon)
  y = R * cos(lat) * sin(lon)
  z = R * sin(lat)

  lat = asin(z / R)
  lon = atan2(y, x)
 */
export function latLngToXYZ(lngLat: Vector2) {
  const lng = degToRad(lngLat.x);
  const lat = degToRad(lngLat.y);
  return new Vector3(
    -Math.cos(lat) * Math.cos(lng),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lng),
  );
}

export function xyzToLatLng(xyz: Vector3) {
  // Vector must be normalized!!
  const latRads = Math.asin(xyz.y);
  const lngRads = Math.atan2(xyz.z, -xyz.x);
  return new Vector2(radToDeg(lngRads), radToDeg(latRads));
}

const asdf = new Array<Vector3>();
for (let i = 0; i < 50; i++) {
  asdf.push(
    new Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ).normalize(),
  );
}
