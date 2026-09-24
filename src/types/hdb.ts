export interface HdbRecord {
  _id: number;
  month: string; // "YYYY-MM"
  town: string;
  flat_type: string; // "3 ROOM", "4 ROOM", etc.
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string | number;
  flat_model: string;
  lease_commence_date: string | number;
  remaining_lease: string;
  resale_price: string | number;
  // Computed fields
  price_num: number;
  floor_area_num: number;
  remaining_lease_years: number;
  psm: number; // Price per square meter
  psf: number; // Price per square foot
  lat?: number;
  lng?: number;
}

export interface DataGovResponse {
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    records: Array<{
      _id: number;
      month: string;
      town: string;
      flat_type: string;
      block: string;
      street_name: string;
      storey_range: string;
      floor_area_sqm: string;
      flat_model: string;
      lease_commence_date: string;
      remaining_lease: string;
      resale_price: string;
    }>;
    total: number;
    limit: number;
    filters?: string;
    _links?: {
      start?: string;
      next?: string;
    };
  };
}

export interface TownSummary {
  town: string;
  count: number;
  medianPrice: number;
  avgPsm: number;
  minPrice: number;
  maxPrice: number;
}

export interface MonthlyTrend {
  month: string;
  medianPrice: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
  avgPsm: number;
}

export interface BudgetFilterParams {
  maxBudget: number;
  minBudget: number;
  minAreaSqm: number;
  minRemainingLease: number;
  towns: string[];
  flatTypes: string[];
}
