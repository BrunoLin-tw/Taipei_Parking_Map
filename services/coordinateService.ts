import proj4 from 'proj4';

// Fix for ESM/CDN import where proj4 might be wrapped in a default property
const p4 = (proj4 as any).default || proj4;

// Define the TWD97 (TM2 zone 121) projection string
// EPSG:3826
const TWD97_DEF = "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
// WGS84 projection string (standard lat/lon)
const WGS84_DEF = "+proj=longlat +datum=WGS84 +no_defs";

// Register the definition
p4.defs("EPSG:3826", TWD97_DEF);

/**
 * Converts TWD97 coordinates (X, Y) to WGS84 (Latitude, Longitude).
 * @param x TWD97 X coordinate
 * @param y TWD97 Y coordinate
 * @returns [latitude, longitude]
 */
export const convertTWD97ToWGS84 = (x: number, y: number): [number, number] => {
  if (!x || !y) return [0, 0];
  try {
    const result = p4("EPSG:3826", WGS84_DEF, [x, y]);
    // proj4 returns [lon, lat], but Leaflet uses [lat, lon]
    return [result[1], result[0]];
  } catch (error) {
    console.error("Coordinate conversion error:", error);
    return [0, 0];
  }
};