// supabase/functions/_shared/wards.ts

export interface WardBox {
  name: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export const WARDS: WardBox[] = [
  { name: "MG Road / Central",     latMin: 12.965, latMax: 12.985, lonMin: 77.595, lonMax: 77.620 },
  { name: "Koramangala",           latMin: 12.925, latMax: 12.945, lonMin: 77.610, lonMax: 77.635 },
  { name: "Indiranagar",           latMin: 12.965, latMax: 12.985, lonMin: 77.630, lonMax: 77.650 },
  { name: "HSR Layout",            latMin: 12.900, latMax: 12.925, lonMin: 77.630, lonMax: 77.655 },
  { name: "BTM Layout",            latMin: 12.905, latMax: 12.925, lonMin: 77.600, lonMax: 77.620 },
  { name: "Jayanagar",             latMin: 12.920, latMax: 12.940, lonMin: 77.580, lonMax: 77.600 },
  { name: "Basavanagudi",          latMin: 12.935, latMax: 12.955, lonMin: 77.565, lonMax: 77.585 },
  { name: "Malleshwaram",          latMin: 13.000, latMax: 13.020, lonMin: 77.560, lonMax: 77.580 },
  { name: "Rajajinagar",           latMin: 12.985, latMax: 13.005, lonMin: 77.545, lonMax: 77.565 },
  { name: "Whitefield",            latMin: 12.960, latMax: 12.985, lonMin: 77.715, lonMax: 77.750 },
  { name: "Marathahalli",          latMin: 12.950, latMax: 12.970, lonMin: 77.690, lonMax: 77.715 },
  { name: "Electronic City",       latMin: 12.830, latMax: 12.860, lonMin: 77.660, lonMax: 77.690 },
  { name: "Hebbal",                latMin: 13.030, latMax: 13.060, lonMin: 77.580, lonMax: 77.610 },
  { name: "Yelahanka",             latMin: 13.090, latMax: 13.130, lonMin: 77.580, lonMax: 77.620 },
  { name: "Avalahalli / Jala",     latMin: 13.130, latMax: 13.170, lonMin: 77.520, lonMax: 77.600 },
  { name: "Devanahalli",           latMin: 13.230, latMax: 13.270, lonMin: 77.690, lonMax: 77.730 },
];

/**
 * Returns the ward name whose bounding box contains the given coordinates.
 * Falls back to "Unmapped Area" for real submissions outside these zones —
 * this is expected behavior, not an error.
 */
export function getWardForCoordinates(latitude: number, longitude: number): string {
  const match = WARDS.find(
    (w) =>
      latitude >= w.latMin &&
      latitude <= w.latMax &&
      longitude >= w.lonMin &&
      longitude <= w.lonMax
  );
  return match ? match.name : "Unmapped Area";
}