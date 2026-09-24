import { HdbRecord } from '../types/hdb';

export function parseRemainingLeaseToYears(leaseStr: string): number {
  if (!leaseStr) return 70;
  // Patterns like "61 years 04 months", "70 years", "95 years 11 months"
  const yearsMatch = leaseStr.match(/(\d+)\s*years?/i);
  const monthsMatch = leaseStr.match(/(\d+)\s*months?/i);

  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 70;
  const months = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
  return Number((years + months / 12).toFixed(1));
}

export function enrichHdbRecord(raw: {
  _id: number;
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string | number;
  flat_model: string;
  lease_commence_date: string | number;
  remaining_lease: string;
  resale_price: string | number;
}): HdbRecord {
  const price = typeof raw.resale_price === 'number' ? raw.resale_price : parseFloat(raw.resale_price);
  const area = typeof raw.floor_area_sqm === 'number' ? raw.floor_area_sqm : parseFloat(raw.floor_area_sqm);
  const remainingYears = parseRemainingLeaseToYears(String(raw.remaining_lease));
  const psm = area > 0 ? Math.round(price / area) : 0;
  const psf = Math.round(psm / 10.7639);

  return {
    ...raw,
    price_num: price,
    floor_area_num: area,
    remaining_lease_years: remainingYears,
    psm,
    psf,
  };
}

export const INITIAL_HDB_RECORDS: HdbRecord[] = [
  // TAMPINES
  {
    _id: 101,
    month: "2026-06",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "458",
    street_name: "TAMPINES ST 42",
    storey_range: "10 TO 12",
    floor_area_sqm: "84",
    flat_model: "Simplified",
    lease_commence_date: "1988",
    remaining_lease: "60 years 08 months",
    resale_price: "560000"
  },
  {
    _id: 102,
    month: "2026-07",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "714",
    street_name: "TAMPINES ST 71",
    storey_range: "07 TO 09",
    floor_area_sqm: "100",
    flat_model: "Model A",
    lease_commence_date: "1997",
    remaining_lease: "69 years 09 months",
    resale_price: "645000"
  },
  {
    _id: 103,
    month: "2026-08",
    town: "TAMPINES",
    flat_type: "5 ROOM",
    block: "489A",
    street_name: "TAMPINES ST 45",
    storey_range: "10 TO 12",
    floor_area_sqm: "112",
    flat_model: "Improved",
    lease_commence_date: "1999",
    remaining_lease: "71 years 11 months",
    resale_price: "765000"
  },
  {
    _id: 104,
    month: "2026-05",
    town: "TAMPINES",
    flat_type: "3 ROOM",
    block: "256",
    street_name: "TAMPINES ST 21",
    storey_range: "04 TO 06",
    floor_area_sqm: "73",
    flat_model: "Model A",
    lease_commence_date: "1985",
    remaining_lease: "57 years 10 months",
    resale_price: "435000"
  },
  {
    _id: 105,
    month: "2026-08",
    town: "TAMPINES",
    flat_type: "EXECUTIVE",
    block: "342",
    street_name: "TAMPINES ST 33",
    storey_range: "04 TO 06",
    floor_area_sqm: "148",
    flat_model: "Maisonette",
    lease_commence_date: "1993",
    remaining_lease: "65 years 09 months",
    resale_price: "960000"
  },

  // ANG MO KIO
  {
    _id: 201,
    month: "2026-06",
    town: "ANG MO KIO",
    flat_type: "2 ROOM",
    block: "406",
    street_name: "ANG MO KIO AVE 10",
    storey_range: "10 TO 12",
    floor_area_sqm: "44",
    flat_model: "Improved",
    lease_commence_date: "1979",
    remaining_lease: "51 years 09 months",
    resale_price: "315000"
  },
  {
    _id: 202,
    month: "2026-07",
    town: "ANG MO KIO",
    flat_type: "3 ROOM",
    block: "108",
    street_name: "ANG MO KIO AVE 4",
    storey_range: "04 TO 06",
    floor_area_sqm: "67",
    flat_model: "New Generation",
    lease_commence_date: "1978",
    remaining_lease: "50 years 11 months",
    resale_price: "410000"
  },
  {
    _id: 203,
    month: "2026-08",
    town: "ANG MO KIO",
    flat_type: "4 ROOM",
    block: "310A",
    street_name: "ANG MO KIO AVE 1",
    storey_range: "19 TO 21",
    floor_area_sqm: "95",
    flat_model: "Model A",
    lease_commence_date: "2012",
    remaining_lease: "84 years 10 months",
    resale_price: "898000"
  },
  {
    _id: 204,
    month: "2026-07",
    town: "ANG MO KIO",
    flat_type: "5 ROOM",
    block: "590B",
    street_name: "ANG MO KIO ST 51",
    storey_range: "25 TO 27",
    floor_area_sqm: "112",
    flat_model: "Design, Build and Sell Scheme (DBSS)",
    lease_commence_date: "2011",
    remaining_lease: "83 years 08 months",
    resale_price: "1188000"
  },

  // BISHAN
  {
    _id: 301,
    month: "2026-08",
    town: "BISHAN",
    flat_type: "4 ROOM",
    block: "273A",
    street_name: "BISHAN ST 24",
    storey_range: "28 TO 30",
    floor_area_sqm: "93",
    flat_model: "Model A",
    lease_commence_date: "2011",
    remaining_lease: "83 years 10 months",
    resale_price: "1060000"
  },
  {
    _id: 302,
    month: "2026-07",
    town: "BISHAN",
    flat_type: "5 ROOM",
    block: "153",
    street_name: "BISHAN ST 13",
    storey_range: "13 TO 15",
    floor_area_sqm: "121",
    flat_model: "Improved",
    lease_commence_date: "1987",
    remaining_lease: "59 years 10 months",
    resale_price: "980000"
  },
  {
    _id: 303,
    month: "2026-06",
    town: "BISHAN",
    flat_type: "3 ROOM",
    block: "112",
    street_name: "BISHAN ST 12",
    storey_range: "07 TO 09",
    floor_area_sqm: "68",
    flat_model: "Simplified",
    lease_commence_date: "1986",
    remaining_lease: "58 years 11 months",
    resale_price: "510000"
  },
  {
    _id: 304,
    month: "2026-08",
    town: "BISHAN",
    flat_type: "EXECUTIVE",
    block: "248",
    street_name: "BISHAN ST 22",
    storey_range: "10 TO 12",
    floor_area_sqm: "150",
    flat_model: "Maisonette",
    lease_commence_date: "1992",
    remaining_lease: "64 years 08 months",
    resale_price: "1310000"
  },

  // PUNGGOL
  {
    _id: 401,
    month: "2026-08",
    town: "PUNGGOL",
    flat_type: "4 ROOM",
    block: "272D",
    street_name: "PUNGGOL WALK",
    storey_range: "13 TO 15",
    floor_area_sqm: "93",
    flat_model: "Model A",
    lease_commence_date: "2015",
    remaining_lease: "87 years 09 months",
    resale_price: "728000"
  },
  {
    _id: 402,
    month: "2026-07",
    town: "PUNGGOL",
    flat_type: "5 ROOM",
    block: "308A",
    street_name: "PUNGGOL WATERWAY",
    storey_range: "16 TO 18",
    floor_area_sqm: "113",
    flat_model: "Premium Apartment",
    lease_commence_date: "2016",
    remaining_lease: "88 years 10 months",
    resale_price: "850000"
  },
  {
    _id: 403,
    month: "2026-06",
    town: "PUNGGOL",
    flat_type: "3 ROOM",
    block: "601B",
    street_name: "PUNGGOL CENTRAL",
    storey_range: "10 TO 12",
    floor_area_sqm: "68",
    flat_model: "Model A",
    lease_commence_date: "2013",
    remaining_lease: "85 years 07 months",
    resale_price: "525000"
  },
  {
    _id: 404,
    month: "2026-08",
    town: "PUNGGOL",
    flat_type: "2 ROOM",
    block: "212A",
    street_name: "PUNGGOL WALK",
    storey_range: "07 TO 09",
    floor_area_sqm: "47",
    flat_model: "Model A",
    lease_commence_date: "2017",
    remaining_lease: "89 years 05 months",
    resale_price: "368000"
  },

  // SENGKANG
  {
    _id: 501,
    month: "2026-08",
    town: "SENGKANG",
    flat_type: "4 ROOM",
    block: "317C",
    street_name: "ANCHORVALE RD",
    storey_range: "10 TO 12",
    floor_area_sqm: "92",
    flat_model: "Model A",
    lease_commence_date: "2015",
    remaining_lease: "87 years 06 months",
    resale_price: "670000"
  },
  {
    _id: 502,
    month: "2026-07",
    town: "SENGKANG",
    flat_type: "5 ROOM",
    block: "216A",
    street_name: "COMPASSVALE DR",
    storey_range: "13 TO 15",
    floor_area_sqm: "110",
    flat_model: "Premium Apartment",
    lease_commence_date: "2003",
    remaining_lease: "75 years 08 months",
    resale_price: "720000"
  },
  {
    _id: 503,
    month: "2026-05",
    town: "SENGKANG",
    flat_type: "3 ROOM",
    block: "142",
    street_name: "RIVERVALE CRES",
    storey_range: "04 TO 06",
    floor_area_sqm: "67",
    flat_model: "Model A",
    lease_commence_date: "2000",
    remaining_lease: "72 years 10 months",
    resale_price: "468000"
  },
  {
    _id: 504,
    month: "2026-08",
    town: "SENGKANG",
    flat_type: "EXECUTIVE",
    block: "207B",
    street_name: "COMPASSVALE LANE",
    storey_range: "07 TO 09",
    floor_area_sqm: "130",
    flat_model: "Apartment",
    lease_commence_date: "2001",
    remaining_lease: "73 years 05 months",
    resale_price: "850000"
  },

  // QUEENSTOWN
  {
    _id: 601,
    month: "2026-08",
    town: "QUEENSTOWN",
    flat_type: "4 ROOM",
    block: "89",
    street_name: "DAWSON RD",
    storey_range: "34 TO 36",
    floor_area_sqm: "95",
    flat_model: "Premium Apartment Loft",
    lease_commence_date: "2016",
    remaining_lease: "88 years 08 months",
    resale_price: "1230000"
  },
  {
    _id: 602,
    month: "2026-07",
    town: "QUEENSTOWN",
    flat_type: "3 ROOM",
    block: "58",
    street_name: "STRATHMORE AVE",
    storey_range: "16 TO 18",
    floor_area_sqm: "68",
    flat_model: "Model A",
    lease_commence_date: "2006",
    remaining_lease: "78 years 09 months",
    resale_price: "680000"
  },
  {
    _id: 603,
    month: "2026-06",
    town: "QUEENSTOWN",
    flat_type: "5 ROOM",
    block: "90",
    street_name: "DAWSON RD",
    storey_range: "28 TO 30",
    floor_area_sqm: "115",
    flat_model: "Improved",
    lease_commence_date: "2016",
    remaining_lease: "88 years 10 months",
    resale_price: "1380000"
  },

  // BUKIT MERAH
  {
    _id: 701,
    month: "2026-08",
    town: "BUKIT MERAH",
    flat_type: "4 ROOM",
    block: "1A",
    street_name: "CANTONMENT RD",
    storey_range: "40 TO 42",
    floor_area_sqm: "93",
    flat_model: "Type S1",
    lease_commence_date: "2011",
    remaining_lease: "83 years 07 months",
    resale_price: "1350000"
  },
  {
    _id: 702,
    month: "2026-07",
    town: "BUKIT MERAH",
    flat_type: "3 ROOM",
    block: "128",
    street_name: "KIM TIAN RD",
    storey_range: "19 TO 21",
    floor_area_sqm: "68",
    flat_model: "Model A",
    lease_commence_date: "2013",
    remaining_lease: "85 years 09 months",
    resale_price: "720000"
  },
  {
    _id: 703,
    month: "2026-06",
    town: "BUKIT MERAH",
    flat_type: "5 ROOM",
    block: "1B",
    street_name: "CANTONMENT RD",
    storey_range: "31 TO 33",
    floor_area_sqm: "105",
    flat_model: "Type S2",
    lease_commence_date: "2011",
    remaining_lease: "83 years 07 months",
    resale_price: "1480000"
  },

  // BEDOK
  {
    _id: 801,
    month: "2026-08",
    town: "BEDOK",
    flat_type: "4 ROOM",
    block: "217",
    street_name: "BEDOK NORTH ST 1",
    storey_range: "07 TO 09",
    floor_area_sqm: "92",
    flat_model: "New Generation",
    lease_commence_date: "1978",
    remaining_lease: "50 years 10 months",
    resale_price: "560000"
  },
  {
    _id: 802,
    month: "2026-07",
    town: "BEDOK",
    flat_type: "3 ROOM",
    block: "515",
    street_name: "BEDOK NORTH AVE 2",
    storey_range: "04 TO 06",
    floor_area_sqm: "67",
    flat_model: "New Generation",
    lease_commence_date: "1979",
    remaining_lease: "51 years 08 months",
    resale_price: "395000"
  },
  {
    _id: 803,
    month: "2026-08",
    town: "BEDOK",
    flat_type: "5 ROOM",
    block: "763",
    street_name: "BEDOK RESERVOIR VIEW",
    storey_range: "13 TO 15",
    floor_area_sqm: "122",
    flat_model: "Improved",
    lease_commence_date: "2000",
    remaining_lease: "72 years 11 months",
    resale_price: "810000"
  },

  // WOODLANDS
  {
    _id: 901,
    month: "2026-08",
    town: "WOODLANDS",
    flat_type: "4 ROOM",
    block: "548",
    street_name: "WOODLANDS DRIVE 44",
    storey_range: "07 TO 09",
    floor_area_sqm: "91",
    flat_model: "Model A",
    lease_commence_date: "2000",
    remaining_lease: "72 years 08 months",
    resale_price: "515000"
  },
  {
    _id: 902,
    month: "2026-07",
    town: "WOODLANDS",
    flat_type: "5 ROOM",
    block: "888B",
    street_name: "WOODLANDS DRIVE 50",
    storey_range: "10 TO 12",
    floor_area_sqm: "115",
    flat_model: "Improved",
    lease_commence_date: "1998",
    remaining_lease: "70 years 07 months",
    resale_price: "630000"
  },
  {
    _id: 903,
    month: "2026-06",
    town: "WOODLANDS",
    flat_type: "3 ROOM",
    block: "312",
    street_name: "WOODLANDS ST 31",
    storey_range: "04 TO 06",
    floor_area_sqm: "67",
    flat_model: "Simplified",
    lease_commence_date: "1993",
    remaining_lease: "65 years 10 months",
    resale_price: "378000"
  },
  {
    _id: 904,
    month: "2026-08",
    town: "WOODLANDS",
    flat_type: "EXECUTIVE",
    block: "834",
    street_name: "WOODLANDS ST 83",
    storey_range: "07 TO 09",
    floor_area_sqm: "142",
    flat_model: "Apartment",
    lease_commence_date: "1995",
    remaining_lease: "67 years 09 months",
    resale_price: "790000"
  },

  // JURONG WEST
  {
    _id: 1001,
    month: "2026-08",
    town: "JURONG WEST",
    flat_type: "4 ROOM",
    block: "684B",
    street_name: "JURONG WEST ST 64",
    storey_range: "10 TO 12",
    floor_area_sqm: "90",
    flat_model: "Model A",
    lease_commence_date: "2000",
    remaining_lease: "72 years 10 months",
    resale_price: "545000"
  },
  {
    _id: 1002,
    month: "2026-07",
    town: "JURONG WEST",
    flat_type: "5 ROOM",
    block: "274C",
    street_name: "JURONG WEST AVE 3",
    storey_range: "13 TO 15",
    floor_area_sqm: "110",
    flat_model: "Premium Apartment",
    lease_commence_date: "2003",
    remaining_lease: "75 years 09 months",
    resale_price: "640000"
  },
  {
    _id: 1003,
    month: "2026-05",
    town: "JURONG WEST",
    flat_type: "3 ROOM",
    block: "415",
    street_name: "JURONG WEST ST 42",
    storey_range: "04 TO 06",
    floor_area_sqm: "67",
    flat_model: "New Generation",
    lease_commence_date: "1984",
    remaining_lease: "56 years 10 months",
    resale_price: "370000"
  },

  // TOA PAYOH
  {
    _id: 1101,
    month: "2026-08",
    town: "TOA PAYOH",
    flat_type: "4 ROOM",
    block: "138B",
    street_name: "LOR 1A TOA PAYOH",
    storey_range: "31 TO 33",
    floor_area_sqm: "93",
    flat_model: "Model A",
    lease_commence_date: "2012",
    remaining_lease: "84 years 08 months",
    resale_price: "1028000"
  },
  {
    _id: 1102,
    month: "2026-07",
    town: "TOA PAYOH",
    flat_type: "5 ROOM",
    block: "139A",
    street_name: "LOR 1A TOA PAYOH",
    storey_range: "37 TO 39",
    floor_area_sqm: "115",
    flat_model: "Improved",
    lease_commence_date: "2012",
    remaining_lease: "84 years 09 months",
    resale_price: "1280000"
  },
  {
    _id: 1103,
    month: "2026-06",
    town: "TOA PAYOH",
    flat_type: "3 ROOM",
    block: "83",
    street_name: "LOR 2 TOA PAYOH",
    storey_range: "07 TO 09",
    floor_area_sqm: "65",
    flat_model: "Improved",
    lease_commence_date: "1973",
    remaining_lease: "45 years 10 months",
    resale_price: "388000"
  },

  // KALLANG/WHAMPOA
  {
    _id: 1201,
    month: "2026-08",
    town: "KALLANG/WHAMPOA",
    flat_type: "4 ROOM",
    block: "10B",
    street_name: "BENDEMEER RD",
    storey_range: "34 TO 36",
    floor_area_sqm: "93",
    flat_model: "Model A",
    lease_commence_date: "2016",
    remaining_lease: "88 years 10 months",
    resale_price: "1070000"
  },
  {
    _id: 1202,
    month: "2026-07",
    town: "KALLANG/WHAMPOA",
    flat_type: "3 ROOM",
    block: "34",
    street_name: "WHAMPOA WEST",
    storey_range: "10 TO 12",
    floor_area_sqm: "68",
    flat_model: "Improved",
    lease_commence_date: "1972",
    remaining_lease: "44 years 11 months",
    resale_price: "430000"
  },

  // YISHUN
  {
    _id: 1301,
    month: "2026-08",
    town: "YISHUN",
    flat_type: "4 ROOM",
    block: "505B",
    street_name: "YISHUN ST 51",
    storey_range: "10 TO 12",
    floor_area_sqm: "92",
    flat_model: "Model A",
    lease_commence_date: "2018",
    remaining_lease: "90 years 08 months",
    resale_price: "615000"
  },
  {
    _id: 1302,
    month: "2026-07",
    town: "YISHUN",
    flat_type: "5 ROOM",
    block: "672B",
    street_name: "YISHUN AVE 4",
    storey_range: "13 TO 15",
    floor_area_sqm: "112",
    flat_model: "Improved",
    lease_commence_date: "2018",
    remaining_lease: "90 years 09 months",
    resale_price: "740000"
  },
  {
    _id: 1303,
    month: "2026-05",
    town: "YISHUN",
    flat_type: "3 ROOM",
    block: "148",
    street_name: "YISHUN RING RD",
    storey_range: "04 TO 06",
    floor_area_sqm: "68",
    flat_model: "Simplified",
    lease_commence_date: "1985",
    remaining_lease: "57 years 10 months",
    resale_price: "375000"
  },

  // CLEMENTI
  {
    _id: 1401,
    month: "2026-08",
    town: "CLEMENTI",
    flat_type: "4 ROOM",
    block: "441A",
    street_name: "CLEMENTI AVE 3",
    storey_range: "25 TO 27",
    floor_area_sqm: "92",
    flat_model: "Model A",
    lease_commence_date: "2017",
    remaining_lease: "89 years 09 months",
    resale_price: "988000"
  },
  {
    _id: 1402,
    month: "2026-07",
    town: "CLEMENTI",
    flat_type: "5 ROOM",
    block: "440B",
    street_name: "CLEMENTI AVE 3",
    storey_range: "31 TO 33",
    floor_area_sqm: "115",
    flat_model: "Improved",
    lease_commence_date: "2017",
    remaining_lease: "89 years 10 months",
    resale_price: "1230000"
  },
  {
    _id: 1403,
    month: "2026-06",
    town: "CLEMENTI",
    flat_type: "3 ROOM",
    block: "335",
    street_name: "CLEMENTI AVE 2",
    storey_range: "07 TO 09",
    floor_area_sqm: "67",
    flat_model: "New Generation",
    lease_commence_date: "1978",
    remaining_lease: "50 years 11 months",
    resale_price: "435000"
  },

  // JURONG EAST
  {
    _id: 1501,
    month: "2026-08",
    town: "JURONG EAST",
    flat_type: "4 ROOM",
    block: "266",
    street_name: "TOH GUAN RD",
    storey_range: "10 TO 12",
    floor_area_sqm: "100",
    flat_model: "Model A",
    lease_commence_date: "1998",
    remaining_lease: "70 years 10 months",
    resale_price: "625000"
  },
  {
    _id: 1502,
    month: "2026-07",
    town: "JURONG EAST",
    flat_type: "5 ROOM",
    block: "288B",
    street_name: "JURONG EAST ST 21",
    storey_range: "13 TO 15",
    floor_area_sqm: "110",
    flat_model: "Improved",
    lease_commence_date: "2000",
    remaining_lease: "72 years 08 months",
    resale_price: "760000"
  },

  // BUKIT BATOK
  {
    _id: 1601,
    month: "2026-08",
    town: "BUKIT BATOK",
    flat_type: "4 ROOM",
    block: "440B",
    street_name: "BUKIT BATOK WEST AVE 8",
    storey_range: "13 TO 15",
    floor_area_sqm: "93",
    flat_model: "Model A",
    lease_commence_date: "2019",
    remaining_lease: "91 years 09 months",
    resale_price: "678000"
  },
  {
    _id: 1602,
    month: "2026-07",
    town: "BUKIT BATOK",
    flat_type: "3 ROOM",
    block: "103",
    street_name: "BUKIT BATOK CENTRAL",
    storey_range: "07 TO 09",
    floor_area_sqm: "68",
    flat_model: "Simplified",
    lease_commence_date: "1985",
    remaining_lease: "57 years 09 months",
    resale_price: "420000"
  },

  // PASIR RIS
  {
    _id: 1701,
    month: "2026-08",
    town: "PASIR RIS",
    flat_type: "4 ROOM",
    block: "536",
    street_name: "PASIR RIS DR 1",
    storey_range: "07 TO 09",
    floor_area_sqm: "105",
    flat_model: "Model A",
    lease_commence_date: "1992",
    remaining_lease: "64 years 10 months",
    resale_price: "570000"
  },
  {
    _id: 1702,
    month: "2026-07",
    town: "PASIR RIS",
    flat_type: "EXECUTIVE",
    block: "643",
    street_name: "PASIR RIS DR 10",
    storey_range: "04 TO 06",
    floor_area_sqm: "148",
    flat_model: "Maisonette",
    lease_commence_date: "1993",
    remaining_lease: "65 years 08 months",
    resale_price: "880000"
  },

  // CHOA CHU KANG
  {
    _id: 1801,
    month: "2026-08",
    town: "CHOA CHU KANG",
    flat_type: "4 ROOM",
    block: "804B",
    street_name: "KEAT HONG CLOSE",
    storey_range: "13 TO 15",
    floor_area_sqm: "93",
    flat_model: "Model A",
    lease_commence_date: "2017",
    remaining_lease: "89 years 10 months",
    resale_price: "610000"
  },
  {
    _id: 1802,
    month: "2026-07",
    town: "CHOA CHU KANG",
    flat_type: "5 ROOM",
    block: "812B",
    street_name: "CHOA CHU KANG AVE 7",
    storey_range: "10 TO 12",
    floor_area_sqm: "112",
    flat_model: "Improved",
    lease_commence_date: "2017",
    remaining_lease: "89 years 08 months",
    resale_price: "720000"
  },

  // HOUGANG
  {
    _id: 1901,
    month: "2026-08",
    town: "HOUGANG",
    flat_type: "4 ROOM",
    block: "466A",
    street_name: "UPP SERANGOON RD",
    storey_range: "16 TO 18",
    floor_area_sqm: "92",
    flat_model: "Model A",
    lease_commence_date: "2018",
    remaining_lease: "90 years 09 months",
    resale_price: "735000"
  },
  {
    _id: 1902,
    month: "2026-07",
    town: "HOUGANG",
    flat_type: "5 ROOM",
    block: "542",
    street_name: "HOUGANG AVE 8",
    storey_range: "07 TO 09",
    floor_area_sqm: "121",
    flat_model: "Improved",
    lease_commence_date: "1992",
    remaining_lease: "64 years 11 months",
    resale_price: "755000"
  },

  // SERANGOON
  {
    _id: 2001,
    month: "2026-08",
    town: "SERANGOON",
    flat_type: "4 ROOM",
    block: "214",
    street_name: "SERANGOON AVE 4",
    storey_range: "07 TO 09",
    floor_area_sqm: "104",
    flat_model: "Model A",
    lease_commence_date: "1985",
    remaining_lease: "57 years 11 months",
    resale_price: "638000"
  },
  {
    _id: 2002,
    month: "2026-07",
    town: "SERANGOON",
    flat_type: "EXECUTIVE",
    block: "146",
    street_name: "SERANGOON NORTH AVE 1",
    storey_range: "04 TO 06",
    floor_area_sqm: "146",
    flat_model: "Maisonette",
    lease_commence_date: "1988",
    remaining_lease: "60 years 08 months",
    resale_price: "990000"
  },

  // BUKIT PANJANG
  {
    _id: 2101,
    month: "2026-08",
    town: "BUKIT PANJANG",
    flat_type: "4 ROOM",
    block: "540A",
    street_name: "SEGAR RD",
    storey_range: "13 TO 15",
    floor_area_sqm: "92",
    flat_model: "Model A",
    lease_commence_date: "2015",
    remaining_lease: "87 years 08 months",
    resale_price: "575000"
  },

  // GEYLANG
  {
    _id: 2201,
    month: "2026-08",
    town: "GEYLANG",
    flat_type: "4 ROOM",
    block: "14",
    street_name: "EUNOS CRES",
    storey_range: "10 TO 12",
    floor_area_sqm: "92",
    flat_model: "Model A",
    lease_commence_date: "2006",
    remaining_lease: "78 years 09 months",
    resale_price: "760000"
  },

  // SEMBAWANG
  {
    _id: 2301,
    month: "2026-08",
    town: "SEMBAWANG",
    flat_type: "4 ROOM",
    block: "508A",
    street_name: "WELLINGTON CIRCLE",
    storey_range: "07 TO 09",
    floor_area_sqm: "92",
    flat_model: "Model A",
    lease_commence_date: "2002",
    remaining_lease: "74 years 07 months",
    resale_price: "525000"
  },

  // MARINE PARADE
  {
    _id: 2401,
    month: "2026-08",
    town: "MARINE PARADE",
    flat_type: "4 ROOM",
    block: "59",
    street_name: "MARINE DR",
    storey_range: "13 TO 15",
    floor_area_sqm: "88",
    flat_model: "Improved",
    lease_commence_date: "1975",
    remaining_lease: "47 years 10 months",
    resale_price: "680000"
  },

  // CENTRAL AREA
  {
    _id: 2501,
    month: "2026-08",
    town: "CENTRAL AREA",
    flat_type: "4 ROOM",
    block: "4",
    street_name: "SAFFRON PATH (PINNACLE@DUSXON)",
    storey_range: "43 TO 45",
    floor_area_sqm: "95",
    flat_model: "Type S1",
    lease_commence_date: "2011",
    remaining_lease: "83 years 10 months",
    resale_price: "1420000"
  },

  // Historical records for trend calculation across years (2021-2026)
  {
    _id: 3001,
    month: "2021-01",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "458",
    street_name: "TAMPINES ST 42",
    storey_range: "07 TO 09",
    floor_area_sqm: "84",
    flat_model: "Simplified",
    lease_commence_date: "1988",
    remaining_lease: "66 years 00 months",
    resale_price: "420000"
  },
  {
    _id: 3002,
    month: "2022-01",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "458",
    street_name: "TAMPINES ST 42",
    storey_range: "07 TO 09",
    floor_area_sqm: "84",
    flat_model: "Simplified",
    lease_commence_date: "1988",
    remaining_lease: "65 years 00 months",
    resale_price: "465000"
  },
  {
    _id: 3003,
    month: "2023-01",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "458",
    street_name: "TAMPINES ST 42",
    storey_range: "07 TO 09",
    floor_area_sqm: "84",
    flat_model: "Simplified",
    lease_commence_date: "1988",
    remaining_lease: "64 years 00 months",
    resale_price: "500000"
  },
  {
    _id: 3004,
    month: "2024-01",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "458",
    street_name: "TAMPINES ST 42",
    storey_range: "07 TO 09",
    floor_area_sqm: "84",
    flat_model: "Simplified",
    lease_commence_date: "1988",
    remaining_lease: "63 years 00 months",
    resale_price: "530000"
  },
  {
    _id: 3005,
    month: "2025-01",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "458",
    street_name: "TAMPINES ST 42",
    storey_range: "07 TO 09",
    floor_area_sqm: "84",
    flat_model: "Simplified",
    lease_commence_date: "1988",
    remaining_lease: "62 years 00 months",
    resale_price: "545000"
  },
  {
    _id: 3006,
    month: "2025-07",
    town: "TAMPINES",
    flat_type: "4 ROOM",
    block: "458",
    street_name: "TAMPINES ST 42",
    storey_range: "10 TO 12",
    floor_area_sqm: "84",
    flat_model: "Simplified",
    lease_commence_date: "1988",
    remaining_lease: "61 years 06 months",
    resale_price: "552000"
  }
].map(r => enrichHdbRecord(r));

export const ALL_HDB_TOWNS = [
  'ANG MO KIO',
  'BEDOK',
  'BISHAN',
  'BUKIT BATOK',
  'BUKIT MERAH',
  'BUKIT PANJANG',
  'BUKIT TIMAH',
  'CENTRAL AREA',
  'CHOA CHU KANG',
  'CLEMENTI',
  'GEYLANG',
  'HOUGANG',
  'JURONG EAST',
  'JURONG WEST',
  'KALLANG/WHAMPOA',
  'MARINE PARADE',
  'PASIR RIS',
  'PUNGGOL',
  'QUEENSTOWN',
  'SEMBAWANG',
  'SENGKANG',
  'SERANGOON',
  'TAMPINES',
  'TOA PAYOH',
  'WOODLANDS',
  'YISHUN'
];

export const ALL_FLAT_TYPES = [
  '1 ROOM',
  '2 ROOM',
  '3 ROOM',
  '4 ROOM',
  '5 ROOM',
  'EXECUTIVE',
  'MULTI-GENERATION'
];
