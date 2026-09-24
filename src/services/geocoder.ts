/**
 * Geocoder Service for Singapore HDB Blocks & Addresses
 * Pairs with Tab 05's geocoder so the map draws itself.
 * Features:
 * 1. Singapore OneMap public search geocoding
 * 2. Town Centroid database with high precision
 * 3. Spatial block hash offset algorithm (guaranteeing distinct coordinates within towns even keyless/offline)
 * 4. In-memory & LocalStorage geocoding cache
 */

export interface GeocodedLocation {
  lat: number;
  lng: number;
  address: string;
  building?: string;
  postalCode?: string;
  isApproximate?: boolean;
}

// Singapore HDB Town Geographic Centers (WGS84 Lat/Lng)
export const SG_TOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ANG MO KIO': { lat: 1.3691, lng: 103.8454 },
  'BEDOK': { lat: 1.3236, lng: 103.9273 },
  'BISHAN': { lat: 1.3526, lng: 103.8352 },
  'BUKIT BATOK': { lat: 1.3590, lng: 103.7637 },
  'BUKIT MERAH': { lat: 1.2819, lng: 103.8239 },
  'BUKIT PANJANG': { lat: 1.3774, lng: 103.7719 },
  'BUKIT TIMAH': { lat: 1.3294, lng: 103.8021 },
  'CENTRAL AREA': { lat: 1.2870, lng: 103.8519 },
  'CHOA CHU KANG': { lat: 1.3840, lng: 103.7470 },
  'CLEMENTI': { lat: 1.3162, lng: 103.7649 },
  'GEYLANG': { lat: 1.3201, lng: 103.8918 },
  'HOUGANG': { lat: 1.3712, lng: 103.8915 },
  'JURONG EAST': { lat: 1.3329, lng: 103.7436 },
  'JURONG WEST': { lat: 1.3404, lng: 103.7090 },
  'KALLANG/WHAMPOA': { lat: 1.3100, lng: 103.8651 },
  'MARINE PARADE': { lat: 1.3020, lng: 103.9073 },
  'PASIR RIS': { lat: 1.3721, lng: 103.9474 },
  'PUNGGOL': { lat: 1.4052, lng: 103.9023 },
  'QUEENSTOWN': { lat: 1.2942, lng: 103.7861 },
  'SEMBAWANG': { lat: 1.4491, lng: 103.8185 },
  'SENGKANG': { lat: 1.3916, lng: 103.8954 },
  'SERANGOON': { lat: 1.3554, lng: 103.8679 },
  'TAMPINES': { lat: 1.3533, lng: 103.9452 },
  'TOA PAYOH': { lat: 1.3343, lng: 103.8563 },
  'WOODLANDS': { lat: 1.4382, lng: 103.7890 },
  'YISHUN': { lat: 1.4304, lng: 103.8354 },
};

const GEOCODE_CACHE_KEY = 'kakiflats_geocode_cache_v1';
const memoryCache = new Map<string, GeocodedLocation>();

// Initialize memory cache from localStorage
try {
  const saved = localStorage.getItem(GEOCODE_CACHE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => memoryCache.set(k, v as GeocodedLocation));
  }
} catch {
  // ignore storage error
}

function persistCache() {
  try {
    const obj: Record<string, GeocodedLocation> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // quota exceeded or private mode
  }
}

/**
 * Deterministic pseudo-random offset within a town radius so blocks don't stack on exact same spot
 */
function getDeterministicTownOffset(town: string, block: string, street: string): { lat: number; lng: number } {
  const base = SG_TOWN_COORDINATES[town.toUpperCase()] || { lat: 1.3521, lng: 103.8198 };
  const str = `${block}_${street}_${town}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  // Offset within ~1.2km radius around town center
  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  const radiusKm = 0.2 + ((Math.abs(hash >> 3) % 1000) / 1000) * 1.1;
  const latOffset = (radiusKm / 111) * Math.sin(angle);
  const lngOffset = (radiusKm / (111 * Math.cos((base.lat * Math.PI) / 180))) * Math.cos(angle);

  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset,
  };
}

/**
 * Geocode a block and street name in Singapore
 */
export async function geocodeHdbBlock(
  block: string,
  street: string,
  town: string
): Promise<GeocodedLocation> {
  const cacheKey = `${block.trim()} ${street.trim()} SINGAPORE`.toUpperCase();

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // Fallback coords ready
  const fallback = getDeterministicTownOffset(town, block, street);

  try {
    const query = encodeURIComponent(`BLK ${block} ${street}`);
    const res = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const top = data.results[0];
        const lat = parseFloat(top.LATITUDE);
        const lng = parseFloat(top.LONGITUDE);
        if (!isNaN(lat) && !isNaN(lng)) {
          const loc: GeocodedLocation = {
            lat,
            lng,
            address: top.ADDRESS || `${block} ${street}`,
            building: top.BUILDING || '',
            postalCode: top.POSTAL || '',
            isApproximate: false,
          };
          memoryCache.set(cacheKey, loc);
          persistCache();
          return loc;
        }
      }
    }
  } catch {
    // Network / timeout / OneMap offline -> gracefully fallback to deterministic town coordinates
  }

  // Return realistic mapped location within town
  const fallbackLoc: GeocodedLocation = {
    lat: fallback.lat,
    lng: fallback.lng,
    address: `Blk ${block} ${street}, ${town}`,
    isApproximate: true,
  };
  memoryCache.set(cacheKey, fallbackLoc);
  return fallbackLoc;
}

/**
 * Free-text search on Singapore OneMap
 */
export async function searchSingaporeAddress(query: string): Promise<GeocodedLocation[]> {
  if (!query.trim()) return [];
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encoded}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data && data.results) {
      return data.results.slice(0, 5).map((r: any) => ({
        lat: parseFloat(r.LATITUDE),
        lng: parseFloat(r.LONGITUDE),
        address: r.ADDRESS,
        building: r.BUILDING,
        postalCode: r.POSTAL,
        isApproximate: false,
      }));
    }
  } catch {
    // Fallback: check if town name
    const upper = query.toUpperCase().trim();
    for (const [townName, coords] of Object.entries(SG_TOWN_COORDINATES)) {
      if (townName.includes(upper) || upper.includes(townName)) {
        return [
          {
            lat: coords.lat,
            lng: coords.lng,
            address: `${townName}, Singapore`,
            isApproximate: true,
          },
        ];
      }
    }
  }
  return [];
}
