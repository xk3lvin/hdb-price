import { SINGAPORE_AMENITIES, SingaporeAmenity } from '../data/singaporeAmenities';

export interface NearbyAmenity extends SingaporeAmenity {
  distanceMeters: number;
  distanceKm: number;
  walkTimeMins: number;
  isP1Priority: boolean; // < 1km MOE Primary 1 registration rule
  priorityBand?: '< 1km Priority' | '1km – 2km Secondary' | '> 2km';
}

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in meters
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Filter and sort amenities within a specified radius (default 1000m / 1km)
 */
export function getAmenitiesWithinRadius(
  centerLat: number,
  centerLng: number,
  radiusMeters: number = 1000
): NearbyAmenity[] {
  const results: NearbyAmenity[] = [];

  for (const item of SINGAPORE_AMENITIES) {
    const dist = calculateDistanceMeters(centerLat, centerLng, item.lat, item.lng);

    if (dist <= radiusMeters) {
      const distKm = Number((dist / 1000).toFixed(2));
      const walkTimeMins = Math.max(1, Math.round(dist / 80)); // average walking pace ~80m/min
      const isPrimarySchool = item.category === 'school' && item.subCategory === 'primary_school';
      const isP1Priority = isPrimarySchool && dist <= 1000;

      let priorityBand: '< 1km Priority' | '1km – 2km Secondary' | '> 2km' | undefined;
      if (isPrimarySchool) {
        if (dist <= 1000) {
          priorityBand = '< 1km Priority';
        } else if (dist <= 2000) {
          priorityBand = '1km – 2km Secondary';
        } else {
          priorityBand = '> 2km';
        }
      }

      results.push({
        ...item,
        distanceMeters: dist,
        distanceKm: distKm,
        walkTimeMins,
        isP1Priority,
        priorityBand,
      });
    }
  }

  // Sort by closest distance first
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Preset key destinations for quick 1-click Singapore routing
 */
export interface DestinationPreset {
  name: string;
  category: 'cbd' | 'shopping' | 'transit' | 'education' | 'health' | 'airport';
  icon: string;
  lat: number;
  lng: number;
  description: string;
}

export const POPULAR_DESTINATIONS: DestinationPreset[] = [
  {
    name: 'Raffles Place / CBD',
    category: 'cbd',
    icon: '💼',
    lat: 1.2839,
    lng: 103.8515,
    description: 'Central Financial District & Banking Hub',
  },
  {
    name: 'Marina Bay Sands / MBFC',
    category: 'cbd',
    icon: '🏙️',
    lat: 1.2834,
    lng: 103.8607,
    description: 'Marina Bay Financial Centre & Downtown Bay',
  },
  {
    name: 'Orchard Road (ION Orchard)',
    category: 'shopping',
    icon: '🛍️',
    lat: 1.3040,
    lng: 103.8318,
    description: 'Singapore\'s Premier Shopping & Entertainment Belt',
  },
  {
    name: 'Changi Airport (Jewel)',
    category: 'airport',
    icon: '✈️',
    lat: 1.3602,
    lng: 103.9898,
    description: 'International Airport & Jewel Rain Vortex',
  },
  {
    name: 'NUS (Kent Ridge)',
    category: 'education',
    icon: '🎓',
    lat: 1.2966,
    lng: 103.7764,
    description: 'National University of Singapore University Town',
  },
  {
    name: 'SGH (Outram Medical Campus)',
    category: 'health',
    icon: '🏥',
    lat: 1.2785,
    lng: 103.8342,
    description: 'Singapore General Hospital & National Specialty Centres',
  },
  {
    name: 'Jurong East (Jem / Westgate)',
    category: 'transit',
    icon: '🏬',
    lat: 1.3338,
    lng: 103.7432,
    description: 'Jurong Lake District Commercial & Transit Hub',
  },
];
