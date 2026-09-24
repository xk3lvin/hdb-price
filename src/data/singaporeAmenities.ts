export interface SingaporeAmenity {
  id: string;
  name: string;
  category: 'school' | 'mrt' | 'shopping' | 'food' | 'health' | 'park';
  subCategory?: 'primary_school' | 'secondary_school' | 'junior_college' | 'mrt_station' | 'lrt_station' | 'mall' | 'supermarket' | 'hawker' | 'polyclinic' | 'hospital' | 'sports_park';
  lat: number;
  lng: number;
  town?: string;
  description?: string;
  tags?: string[];
}

/**
 * Comprehensive Singapore Schools & Key Amenities Database
 * Covering all 26+ HDB planning areas with exact GPS coordinates.
 */
export const SINGAPORE_AMENITIES: SingaporeAmenity[] = [
  // ==========================================
  // PRIMARY SCHOOLS (MOE 1km Priority Zone)
  // ==========================================
  // Ang Mo Kio
  { id: 'sch-amk-pri', name: 'Ang Mo Kio Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3688, lng: 103.8407, town: 'ANG MO KIO', description: 'MOE Government Primary School' },
  { id: 'sch-chij-st-nic', name: 'CHIJ St. Nicholas Girls\' Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3734, lng: 103.8344, town: 'ANG MO KIO', description: 'Autonomous Catholic SAP Primary School' },
  { id: 'sch-mayflower-pri', name: 'Mayflower Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3647, lng: 103.8378, town: 'ANG MO KIO', description: 'MOE Government Primary School' },
  { id: 'sch-jing-shan-pri', name: 'Jing Shan Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3692, lng: 103.8547, town: 'ANG MO KIO', description: 'MOE Government Primary School' },
  { id: 'sch-teck-ghee-pri', name: 'Teck Ghee Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3615, lng: 103.8504, town: 'ANG MO KIO', description: 'MOE Government Primary School' },
  { id: 'sch-townsville-pri', name: 'Townsville Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3592, lng: 103.8549, town: 'ANG MO KIO', description: 'MOE Government Primary School' },
  
  // Bishan / Toa Payoh
  { id: 'sch-catholic-high-pri', name: 'Catholic High School (Primary)', category: 'school', subCategory: 'primary_school', lat: 1.3547, lng: 103.8447, town: 'BISHAN', description: 'SAP Government-Aided Primary School' },
  { id: 'sch-ai-tong', name: 'Ai Tong School', category: 'school', subCategory: 'primary_school', lat: 1.3606, lng: 103.8335, town: 'BISHAN', description: 'SAP Primary School (Singapore Hokkien Huay Kuan)' },
  { id: 'sch-keng-cheng', name: 'Kheng Cheng School', category: 'school', subCategory: 'primary_school', lat: 1.3368, lng: 103.8501, town: 'TOA PAYOH', description: 'MOE Government-Aided Primary School' },
  { id: 'sch-pei-chun', name: 'Pei Chun Public School', category: 'school', subCategory: 'primary_school', lat: 1.3377, lng: 103.8543, town: 'TOA PAYOH', description: 'SAP Primary School' },
  { id: 'sch-chij-pri-toapayoh', name: 'CHIJ Primary (Toa Payoh)', category: 'school', subCategory: 'primary_school', lat: 1.3328, lng: 103.8427, town: 'TOA PAYOH', description: 'Government-Aided Mission School' },
  { id: 'sch-first-toapayoh-pri', name: 'First Toa Payoh Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3402, lng: 103.8601, town: 'TOA PAYOH', description: 'MOE Government Primary School' },
  { id: 'sch-kuo-chuan-presbyterian', name: 'Kuo Chuan Presbyterian Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3496, lng: 103.8542, town: 'BISHAN', description: 'Government-Aided Primary School' },

  // Bedok
  { id: 'sch-red-swastika', name: 'Red Swastika School', category: 'school', subCategory: 'primary_school', lat: 1.3323, lng: 103.9358, town: 'BEDOK', description: 'SAP Government-Aided Primary School' },
  { id: 'sch-yu-neng-pri', name: 'Yu Neng Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3339, lng: 103.9340, town: 'BEDOK', description: 'MOE Government Primary School' },
  { id: 'sch-fengshan-pri', name: 'Fengshan Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3312, lng: 103.9392, town: 'BEDOK', description: 'MOE Government Primary School' },
  { id: 'sch-bedok-green-pri', name: 'Bedok Green Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3262, lng: 103.9385, town: 'BEDOK', description: 'MOE Government Primary School' },
  { id: 'sch-opera-estate-pri', name: 'Opera Estate Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3195, lng: 103.9238, town: 'BEDOK', description: 'MOE Government Primary School' },
  { id: 'sch-st-anthony-canossian', name: 'St. Anthony\'s Canossian Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3371, lng: 103.9419, town: 'BEDOK', description: 'Government-Aided Catholic Girls Primary School' },

  // Tampines
  { id: 'sch-st-hildas-pri', name: 'St. Hilda\'s Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3498, lng: 103.9366, town: 'TAMPINES', description: 'Popular Government-Aided Anglican Primary School' },
  { id: 'sch-poi-ching', name: 'Poi Ching School', category: 'school', subCategory: 'primary_school', lat: 1.3563, lng: 103.9398, town: 'TAMPINES', description: 'SAP Government-Aided Primary School' },
  { id: 'sch-chongzheng-pri', name: 'Chongzheng Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3512, lng: 103.9515, town: 'TAMPINES', description: 'MOE Government Primary School' },
  { id: 'sch-tampines-pri', name: 'Tampines Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3489, lng: 103.9482, town: 'TAMPINES', description: 'MOE Government Primary School' },
  { id: 'sch-junyuan-pri', name: 'Junyuan Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3468, lng: 103.9405, town: 'TAMPINES', description: 'MOE Government Primary School' },
  { id: 'sch-gongshang-pri', name: 'Gongshang Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3582, lng: 103.9489, town: 'TAMPINES', description: 'Popular Government-Aided Primary School' },
  { id: 'sch-anghsana-pri', name: 'Angsana Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3530, lng: 103.9442, town: 'TAMPINES', description: 'MOE Government Primary School' },

  // Pasir Ris
  { id: 'sch-elias-park-pri', name: 'Elias Park Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3752, lng: 103.9458, town: 'PASIR RIS', description: 'MOE Government Primary School' },
  { id: 'sch-park-view-pri', name: 'Park View Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3789, lng: 103.9372, town: 'PASIR RIS', description: 'MOE Government Primary School' },
  { id: 'sch-casuarina-pri', name: 'Casuarina Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3732, lng: 103.9568, town: 'PASIR RIS', description: 'MOE Government Primary School' },
  { id: 'sch-white-sands-pri', name: 'White Sands Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3662, lng: 103.9621, town: 'PASIR RIS', description: 'MOE Government Primary School' },

  // Punggol & Sengkang
  { id: 'sch-horizon-pri', name: 'Horizon Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3989, lng: 103.9142, town: 'PUNGGOL', description: 'MOE Government Primary School' },
  { id: 'sch-mee-toh', name: 'Mee Toh School', category: 'school', subCategory: 'primary_school', lat: 1.3934, lng: 103.9102, town: 'PUNGGOL', description: 'Popular Government-Aided Buddhist Primary School' },
  { id: 'sch-oasis-pri', name: 'Oasis Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4045, lng: 103.9122, town: 'PUNGGOL', description: 'MOE Government Primary School' },
  { id: 'sch-waterway-pri', name: 'Waterway Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4082, lng: 103.9108, town: 'PUNGGOL', description: 'MOE Government Primary School' },
  { id: 'sch-punggol-green-pri', name: 'Punggol Green Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4012, lng: 103.9015, town: 'PUNGGOL', description: 'MOE Government Primary School' },
  { id: 'sch-valour-pri', name: 'Valour Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4071, lng: 103.8998, town: 'PUNGGOL', description: 'MOE Government Primary School' },
  { id: 'sch-nan-chiau-pri', name: 'Nan Chiau Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3921, lng: 103.8906, town: 'SENGKANG', description: 'Top Ranked SAP Primary School (Singapore Hokkien Huay Kuan)' },
  { id: 'sch-compassvale-pri', name: 'Compassvale Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3892, lng: 103.9008, town: 'SENGKANG', description: 'MOE Government Primary School' },
  { id: 'sch-anchor-green-pri', name: 'Anchor Green Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3912, lng: 103.8872, town: 'SENGKANG', description: 'MOE Government Primary School' },
  { id: 'sch-springdale-pri', name: 'Springdale Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3951, lng: 103.8894, town: 'SENGKANG', description: 'MOE Government Primary School' },
  { id: 'sch-sengkang-pri', name: 'Sengkang Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3871, lng: 103.8967, town: 'SENGKANG', description: 'MOE Government Primary School' },

  // Hougang & Serangoon
  { id: 'sch-rosyth', name: 'Rosyth School', category: 'school', subCategory: 'primary_school', lat: 1.3729, lng: 103.8745, town: 'SERANGOON', description: 'GEP Top Premier Primary School' },
  { id: 'sch-holy-innocents-pri', name: 'Holy Innocents\' Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3712, lng: 103.8942, town: 'HOUGANG', description: 'Government-Aided Catholic SAP Primary School' },
  { id: 'sch-montfort-junior', name: 'Montfort Junior School', category: 'school', subCategory: 'primary_school', lat: 1.3752, lng: 103.8892, town: 'HOUGANG', description: 'Catholic Primary School for Boys' },
  { id: 'sch-hougang-pri', name: 'Hougang Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3789, lng: 103.8821, town: 'HOUGANG', description: 'MOE Government Primary School' },
  { id: 'sch-chij-our-lady-of-good-counsel', name: 'CHIJ Our Lady of Good Counsel', category: 'school', subCategory: 'primary_school', lat: 1.3571, lng: 103.8652, town: 'SERANGOON', description: 'Catholic Primary School for Girls' },
  { id: 'sch-yangzheng-pri', name: 'Yangzheng Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3532, lng: 103.8715, town: 'SERANGOON', description: 'MOE Government Primary School' },

  // Jurong East & Jurong West
  { id: 'sch-rulang-pri', name: 'Rulang Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3468, lng: 103.7188, town: 'JURONG WEST', description: 'Top Rated Popular Primary School in the West' },
  { id: 'sch-frontier-pri', name: 'Frontier Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3392, lng: 103.7028, town: 'JURONG WEST', description: 'MOE Government Primary School near Pioneer MRT' },
  { id: 'sch-jurong-west-pri', name: 'Jurong West Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3415, lng: 103.6989, town: 'JURONG WEST', description: 'MOE Government Primary School' },
  { id: 'sch-west-grove-pri', name: 'West Grove Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3448, lng: 103.7005, town: 'JURONG WEST', description: 'MOE Government Primary School' },
  { id: 'sch-boon-lay-garden-pri', name: 'Boon Lay Garden Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3429, lng: 103.7121, town: 'JURONG WEST', description: 'MOE Government Primary School' },
  { id: 'sch-fuhua-pri', name: 'Fuhua Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3461, lng: 103.7292, town: 'JURONG EAST', description: 'MOE Government Primary School' },
  { id: 'sch-yuhua-pri', name: 'Yuhua Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3438, lng: 103.7410, town: 'JURONG EAST', description: 'MOE Government Primary School' },

  // Clementi & Queenstown & Bukit Merah
  { id: 'sch-nan-hua-pri', name: 'Nan Hua Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3198, lng: 103.7635, town: 'CLEMENTI', description: 'GEP Premier SAP Primary School' },
  { id: 'sch-clementi-pri', name: 'Clementi Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3162, lng: 103.7681, town: 'CLEMENTI', description: 'MOE Government Primary School' },
  { id: 'sch-pei-tong-pri', name: 'Pei Tong Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3175, lng: 103.7712, town: 'CLEMENTI', description: 'MOE Government Primary School' },
  { id: 'sch-henry-park-pri', name: 'Henry Park Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3168, lng: 103.7842, town: 'BUKIT TIMAH', description: 'GEP Top Premier Primary School' },
  { id: 'sch-queenstown-pri', name: 'Queenstown Primary School', category: 'school', subCategory: 'primary_school', lat: 1.2965, lng: 103.8055, town: 'QUEENSTOWN', description: 'MOE Government Primary School' },
  { id: 'sch-new-town-pri', name: 'New Town Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3032, lng: 103.8002, town: 'QUEENSTOWN', description: 'MOE Government Primary School' },
  { id: 'sch-radin-mas-pri', name: 'Radin Mas Primary School', category: 'school', subCategory: 'primary_school', lat: 1.2755, lng: 103.8219, town: 'BUKIT MERAH', description: 'MOE Government Primary School' },
  { id: 'sch-zhangde-pri', name: 'Zhangde Primary School', category: 'school', subCategory: 'primary_school', lat: 1.2842, lng: 103.8248, town: 'BUKIT MERAH', description: 'MOE Government Primary School' },
  { id: 'sch-cantonment-pri', name: 'Cantonment Primary School', category: 'school', subCategory: 'primary_school', lat: 1.2762, lng: 103.8398, town: 'CENTRAL', description: 'Primary School near The Pinnacle@Duxton' },
  { id: 'sch-tao-nan', name: 'Tao Nan School', category: 'school', subCategory: 'primary_school', lat: 1.3065, lng: 103.9102, town: 'MARINE PARADE', description: 'GEP Premier SAP Primary School (Singapore Hokkien Huay Kuan)' },
  { id: 'sch-chij-katong-pri', name: 'CHIJ (Katong) Primary', category: 'school', subCategory: 'primary_school', lat: 1.3051, lng: 103.9058, town: 'MARINE PARADE', description: 'Catholic Mission Primary School for Girls' },
  { id: 'sch-haig-girls', name: 'Haig Girls\' School', category: 'school', subCategory: 'primary_school', lat: 1.3132, lng: 103.8995, town: 'GEYLANG', description: 'MOE Government Primary School for Girls' },
  { id: 'sch-kong-hwa', name: 'Kong Hwa School', category: 'school', subCategory: 'primary_school', lat: 1.3115, lng: 103.8868, town: 'GEYLANG', description: 'Popular SAP Primary School (Singapore Hokkien Huay Kuan)' },

  // Woodlands & Sembawang & Yishun
  { id: 'sch-innovations-pri', name: 'Innova Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4285, lng: 103.7885, town: 'WOODLANDS', description: 'MOE Government Primary School' },
  { id: 'sch-si-ling-pri', name: 'Si Ling Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4328, lng: 103.7825, town: 'WOODLANDS', description: 'MOE Government Primary School' },
  { id: 'sch-woodlands-ring-pri', name: 'Woodlands Ring Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4352, lng: 103.7915, town: 'WOODLANDS', description: 'MOE Government Primary School' },
  { id: 'sch-evergreen-pri', name: 'Evergreen Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4485, lng: 103.7912, town: 'WOODLANDS', description: 'MOE Government Primary School' },
  { id: 'sch-chongfu', name: 'Chongfu School', category: 'school', subCategory: 'primary_school', lat: 1.4398, lng: 103.8402, town: 'YISHUN', description: 'Popular Government-Aided SAP Primary School' },
  { id: 'sch-huamin-pri', name: 'Huamin Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4281, lng: 103.8445, town: 'YISHUN', description: 'MOE Government Primary School' },
  { id: 'sch-yishun-pri', name: 'Yishun Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4338, lng: 103.8322, town: 'YISHUN', description: 'MOE Government Primary School' },
  { id: 'sch-canberra-pri', name: 'Canberra Primary School', category: 'school', subCategory: 'primary_school', lat: 1.4502, lng: 103.8215, town: 'SEMBAWANG', description: 'MOE Government Primary School' },

  // Bukit Panjang & Choa Chu Kang & Bukit Batok
  { id: 'sch-south-view-pri', name: 'South View Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3812, lng: 103.7462, town: 'CHOA CHU KANG', description: 'Popular Government Primary School' },
  { id: 'sch-de-la-salle', name: 'De La Salle School', category: 'school', subCategory: 'primary_school', lat: 1.3895, lng: 103.7468, town: 'CHOA CHU KANG', description: 'Government-Aided Catholic Primary School' },
  { id: 'sch-bukit-panjang-pri', name: 'Bukit Panjang Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3738, lng: 103.7698, town: 'BUKIT PANJANG', description: 'Popular Government Primary School' },
  { id: 'sch-zhenghua-pri', name: 'Zhenghua Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3792, lng: 103.7665, town: 'BUKIT PANJANG', description: 'MOE Government Primary School' },
  { id: 'sch-beacon-pri', name: 'Beacon Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3872, lng: 103.7718, town: 'BUKIT PANJANG', description: 'FutureSchools@Singapore Primary School' },
  { id: 'sch-princess-elizabeth-pri', name: 'Princess Elizabeth Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3492, lng: 103.7485, town: 'BUKIT BATOK', description: 'Highly Sought After Primary School' },
  { id: 'sch-bukit-view-pri', name: 'Bukit View Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3458, lng: 103.7582, town: 'BUKIT BATOK', description: 'MOE Government Primary School' },
  { id: 'sch-keming-pri', name: 'Keming Primary School', category: 'school', subCategory: 'primary_school', lat: 1.3462, lng: 103.7548, town: 'BUKIT BATOK', description: 'MOE Government Primary School' },

  // ==========================================
  // MRT & LRT STATIONS
  // ==========================================
  // East-West Line & North-South Line & Downtown
  { id: 'mrt-raffles-place', name: 'Raffles Place MRT (NS26/EW14)', category: 'mrt', subCategory: 'mrt_station', lat: 1.2839, lng: 103.8515, town: 'CENTRAL', description: 'Major interchange in CBD / Financial Centre', tags: ['NSL', 'EWL'] },
  { id: 'mrt-city-hall', name: 'City Hall MRT (NS25/EW13)', category: 'mrt', subCategory: 'mrt_station', lat: 1.2931, lng: 103.8522, town: 'CENTRAL', description: 'Civic District interchange', tags: ['NSL', 'EWL'] },
  { id: 'mrt-dhoby-ghaut', name: 'Dhoby Ghaut MRT (NS24/NE6/CC1)', category: 'mrt', subCategory: 'mrt_station', lat: 1.2991, lng: 103.8458, town: 'CENTRAL', description: 'Triple line interchange (NSL, NEL, CCL)', tags: ['NSL', 'NEL', 'CCL'] },
  { id: 'mrt-orchard', name: 'Orchard MRT (NS22/TE14)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3040, lng: 103.8318, town: 'CENTRAL', description: 'Orchard Shopping Belt interchange', tags: ['NSL', 'TEL'] },
  { id: 'mrt-tampines', name: 'Tampines MRT (EW2/DT32)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3533, lng: 103.9452, town: 'TAMPINES', description: 'Tampines Regional Centre Interchange', tags: ['EWL', 'DTL'] },
  { id: 'mrt-tampines-west', name: 'Tampines West MRT (DT31)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3456, lng: 103.9384, town: 'TAMPINES', description: 'Downtown Line station serving Tampines South', tags: ['DTL'] },
  { id: 'mrt-tampines-east', name: 'Tampines East MRT (DT33)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3562, lng: 103.9546, town: 'TAMPINES', description: 'Downtown Line station', tags: ['DTL'] },
  { id: 'mrt-bedok', name: 'Bedok MRT (EW5)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3240, lng: 103.9300, town: 'BEDOK', description: 'Bedok Central, Bedok Mall & Bus Interchange', tags: ['EWL'] },
  { id: 'mrt-bedok-reservoir', name: 'Bedok Reservoir MRT (DT30)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3361, lng: 103.9332, town: 'BEDOK', description: 'Downtown Line station next to Bedok Reservoir', tags: ['DTL'] },
  { id: 'mrt-bedok-north', name: 'Bedok North MRT (DT29)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3347, lng: 103.9180, town: 'BEDOK', description: 'Downtown Line station', tags: ['DTL'] },
  { id: 'mrt-ang-mo-kio', name: 'Ang Mo Kio MRT (NS16/CR11)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3699, lng: 103.8496, town: 'ANG MO KIO', description: 'AMK Hub & Bus Interchange', tags: ['NSL', 'CRL'] },
  { id: 'mrt-mayflower', name: 'Mayflower MRT (TE6)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3715, lng: 103.8365, town: 'ANG MO KIO', description: 'Thomson-East Coast Line station serving AMK West', tags: ['TEL'] },
  { id: 'mrt-lentor', name: 'Lentor MRT (TE5)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3855, lng: 103.8360, town: 'ANG MO KIO', description: 'Thomson-East Coast Line modern interchange node', tags: ['TEL'] },
  { id: 'mrt-bishan', name: 'Bishan MRT (NS17/CC15)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3508, lng: 103.8481, town: 'BISHAN', description: 'Major NSL & Circle Line Interchange, Junction 8', tags: ['NSL', 'CCL'] },
  { id: 'mrt-toa-payoh', name: 'Toa Payoh MRT (NS19)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3326, lng: 103.8477, town: 'TOA PAYOH', description: 'Toa Payoh HDB Hub & Central Bus Interchange', tags: ['NSL'] },
  { id: 'mrt-braddell', name: 'Braddell MRT (NS18)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3405, lng: 103.8468, town: 'TOA PAYOH', description: 'North-South Line station', tags: ['NSL'] },
  { id: 'mrt-punggol', name: 'Punggol MRT/LRT (NE17/PTC/CP4)', category: 'mrt', subCategory: 'mrt_station', lat: 1.4050, lng: 103.9022, town: 'PUNGGOL', description: 'Waterway Point, NEL and Punggol LRT Interchange', tags: ['NEL', 'LRT'] },
  { id: 'mrt-sengkang', name: 'Sengkang MRT/LRT (NE16/STC)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3916, lng: 103.8953, town: 'SENGKANG', description: 'Compass One, NEL and Sengkang LRT Interchange', tags: ['NEL', 'LRT'] },
  { id: 'mrt-buangkok', name: 'Buangkok MRT (NE15)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3828, lng: 103.8931, town: 'SENGKANG', description: 'Sengkang Grand Mall & Bus Interchange', tags: ['NEL'] },
  { id: 'mrt-hougang', name: 'Hougang MRT (NE14/CR8)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3712, lng: 103.8924, town: 'HOUGANG', description: 'Hougang Mall & Cross Island Line interchange', tags: ['NEL', 'CRL'] },
  { id: 'mrt-serangoon', name: 'Serangoon MRT (NE12/CC13)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3501, lng: 103.8738, town: 'SERANGOON', description: 'nex Mega Mall, NEL & Circle Line Interchange', tags: ['NEL', 'CCL'] },
  { id: 'mrt-jurong-east', name: 'Jurong East MRT (NS1/EW24/JE5)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3331, lng: 103.7423, town: 'JURONG EAST', description: 'West Regional Hub: Jem, Westgate, IMM, J-Walk', tags: ['NSL', 'EWL'] },
  { id: 'mrt-chinese-garden', name: 'Chinese Garden MRT (EW25)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3424, lng: 103.7326, town: 'JURONG EAST', description: 'Jurong Lake Gardens & Science Centre', tags: ['EWL'] },
  { id: 'mrt-lakeside', name: 'Lakeside MRT (EW26)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3443, lng: 103.7209, town: 'JURONG WEST', description: 'East-West Line serving Jurong West', tags: ['EWL'] },
  { id: 'mrt-boon-lay', name: 'Boon Lay MRT (EW27/JS8)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3386, lng: 103.7060, town: 'JURONG WEST', description: 'Jurong Point Mega Mall & Bus Interchange', tags: ['EWL'] },
  { id: 'mrt-pioneer', name: 'Pioneer MRT (EW28)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3376, lng: 103.6974, town: 'JURONG WEST', description: 'Pioneer Mall & Sports Centre', tags: ['EWL'] },
  { id: 'mrt-clementi', name: 'Clementi MRT (EW23/CR14)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3151, lng: 103.7652, town: 'CLEMENTI', description: 'The Clementi Mall & Bus Interchange', tags: ['EWL', 'CRL'] },
  { id: 'mrt-buona-vista', name: 'Buona Vista MRT (EW21/CC22)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3073, lng: 103.7900, town: 'QUEENSTOWN', description: 'one-north, The Star Vista, EWL & CCL', tags: ['EWL', 'CCL'] },
  { id: 'mrt-commonwealth', name: 'Commonwealth MRT (EW20)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3024, lng: 103.7983, town: 'QUEENSTOWN', description: 'East-West Line Queenstown', tags: ['EWL'] },
  { id: 'mrt-queenstown', name: 'Queenstown MRT (EW19)', category: 'mrt', subCategory: 'mrt_station', lat: 1.2945, lng: 103.8060, town: 'QUEENSTOWN', description: 'Dawson precinct, East-West Line', tags: ['EWL'] },
  { id: 'mrt-redhill', name: 'Redhill MRT (EW18)', category: 'mrt', subCategory: 'mrt_station', lat: 1.2896, lng: 103.8168, town: 'BUKIT MERAH', description: 'Bukit Merah Central & Redhill Market', tags: ['EWL'] },
  { id: 'mrt-tiong-bahru', name: 'Tiong Bahru MRT (EW17)', category: 'mrt', subCategory: 'mrt_station', lat: 1.2865, lng: 103.8269, town: 'BUKIT MERAH', description: 'Tiong Bahru Plaza & Heritage Enclave', tags: ['EWL'] },
  { id: 'mrt-outram-park', name: 'Outram Park MRT (EW16/NE3/TE17)', category: 'mrt', subCategory: 'mrt_station', lat: 1.2803, lng: 103.8395, town: 'CENTRAL', description: 'Triple Interchange (EWL, NEL, TEL) & SGH Medical Hub', tags: ['EWL', 'NEL', 'TEL'] },
  { id: 'mrt-woodlands', name: 'Woodlands MRT (NS9/TE2)', category: 'mrt', subCategory: 'mrt_station', lat: 1.4369, lng: 103.7865, town: 'WOODLANDS', description: 'Causeway Point, Woodlands Regional Centre', tags: ['NSL', 'TEL'] },
  { id: 'mrt-woodlands-south', name: 'Woodlands South MRT (TE3)', category: 'mrt', subCategory: 'mrt_station', lat: 1.4274, lng: 103.7932, town: 'WOODLANDS', description: 'TEL station serving Woodlands Champions Way', tags: ['TEL'] },
  { id: 'mrt-yishun', name: 'Yishun MRT (NS13)', category: 'mrt', subCategory: 'mrt_station', lat: 1.4294, lng: 103.8350, town: 'YISHUN', description: 'Northpoint City Mega Mall & Bus Interchange', tags: ['NSL'] },
  { id: 'mrt-khatib', name: 'Khatib MRT (NS14)', category: 'mrt', subCategory: 'mrt_station', lat: 1.4172, lng: 103.8330, town: 'YISHUN', description: 'North-South Line Khatib', tags: ['NSL'] },
  { id: 'mrt-pasir-ris', name: 'Pasir Ris MRT (EW1/CR5)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3730, lng: 103.9493, town: 'PASIR RIS', description: 'White Sands Shopping Mall & Cross Island Line', tags: ['EWL', 'CRL'] },
  { id: 'mrt-bukit-panjang', name: 'Bukit Panjang MRT/LRT (DT1/BP6)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3790, lng: 103.7618, town: 'BUKIT PANJANG', description: 'Hillion Mall, Junction 10, Downtown Line terminus', tags: ['DTL', 'LRT'] },
  { id: 'mrt-choa-chu-kang', name: 'Choa Chu Kang MRT/LRT (NS4/BP1/JS1)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3853, lng: 103.7444, town: 'CHOA CHU KANG', description: 'Lot One Shoppers\' Mall & Jurong Region Line', tags: ['NSL', 'LRT'] },
  { id: 'mrt-bukit-batok', name: 'Bukit Batok MRT (NS2)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3490, lng: 103.7496, town: 'BUKIT BATOK', description: 'West Mall & Bus Interchange', tags: ['NSL'] },
  { id: 'mrt-marine-parade', name: 'Marine Parade MRT (TE26)', category: 'mrt', subCategory: 'mrt_station', lat: 1.3025, lng: 103.9052, town: 'MARINE PARADE', description: 'Parkway Parade, Marine Parade Promenade', tags: ['TEL'] },

  // ==========================================
  // SHOPPING MALLS & SUPERMARKETS
  // ==========================================
  { id: 'mall-amk-hub', name: 'AMK Hub', category: 'shopping', subCategory: 'mall', lat: 1.3694, lng: 103.8488, town: 'ANG MO KIO', description: 'NTUC FairPrice Xtra 24hrs, Cathay Cineplex, 200+ retail stores' },
  { id: 'mall-junction-8', name: 'Junction 8 Shopping Centre', category: 'shopping', subCategory: 'mall', lat: 1.3503, lng: 103.8488, town: 'BISHAN', description: 'FairPrice Finest, Golden Village, Din Tai Fung, Uniqlo' },
  { id: 'mall-tampines-mall', name: 'Tampines Mall & Century Square', category: 'shopping', subCategory: 'mall', lat: 1.3526, lng: 103.9442, town: 'TAMPINES', description: 'Major retail cluster with FairPrice Finest, Isetan, Don Don Donki' },
  { id: 'mall-our-tampines-hub', name: 'Our Tampines Hub (OTH)', category: 'shopping', subCategory: 'mall', lat: 1.3538, lng: 103.9405, town: 'TAMPINES', description: 'Singapore\'s largest integrated community hub with 24/7 library, stadium, hawker centre, FairPrice' },
  { id: 'mall-bedok-mall', name: 'Bedok Mall', category: 'shopping', subCategory: 'mall', lat: 1.3248, lng: 103.9298, town: 'BEDOK', description: 'FairPrice Finest, Starbucks, 200+ fashion & dining shops' },
  { id: 'mall-waterway-point', name: 'Waterway Point', category: 'shopping', subCategory: 'mall', lat: 1.4062, lng: 103.9022, town: 'PUNGGOL', description: 'Waterfront Mega Mall, 24hr FairPrice Finest, Shaw Theatres IMAX' },
  { id: 'mall-compass-one', name: 'Compass One', category: 'shopping', subCategory: 'mall', lat: 1.3922, lng: 103.8948, town: 'SENGKANG', description: 'Cold Storage, Sengkang Public Library, Food Republic' },
  { id: 'mall-sengkang-grand', name: 'Sengkang Grand Mall', category: 'shopping', subCategory: 'mall', lat: 1.3828, lng: 103.8925, town: 'SENGKANG', description: 'FairPrice Finest, Hawker Centre, Buangkok Integrated Hub' },
  { id: 'mall-nex', name: 'nex Mega Mall', category: 'shopping', subCategory: 'mall', lat: 1.3506, lng: 103.8728, town: 'SERANGOON', description: 'Largest mall in the North-East, 24hr FairPrice Xtra, Cold Storage, Isetan' },
  { id: 'mall-hougang-mall', name: 'Hougang Mall', category: 'shopping', subCategory: 'mall', lat: 1.3725, lng: 103.8938, town: 'HOUGANG', description: 'FairPrice, Popular, Harvey Norman, food court' },
  { id: 'mall-jurong-point', name: 'Jurong Point', category: 'shopping', subCategory: 'mall', lat: 1.3398, lng: 103.7068, town: 'JURONG WEST', description: 'One of Singapore\'s largest suburban malls: NTUC FairPrice Xtra 24hrs, Don Don Donki, Golden Village' },
  { id: 'mall-jem-westgate', name: 'Jem & Westgate', category: 'shopping', subCategory: 'mall', lat: 1.3338, lng: 103.7432, town: 'JURONG EAST', description: 'IKEA Jurong, Don Don Donki, FairPrice Xtra, Din Tai Fung' },
  { id: 'mall-imm', name: 'IMM Outlet Mall', category: 'shopping', subCategory: 'mall', lat: 1.3348, lng: 103.7468, town: 'JURONG EAST', description: 'Singapore\'s largest outlet mall with Giant Hypermarket' },
  { id: 'mall-clementi', name: 'The Clementi Mall', category: 'shopping', subCategory: 'mall', lat: 1.3155, lng: 103.7651, town: 'CLEMENTI', description: 'FairPrice Finest, Clementi Public Library, B1 food hall' },
  { id: 'mall-tiong-bahru-plaza', name: 'Tiong Bahru Plaza', category: 'shopping', subCategory: 'mall', lat: 1.2862, lng: 103.8272, town: 'BUKIT MERAH', description: 'FairPrice Finest, Golden Village, Din Tai Fung' },
  { id: 'mall-causeway-point', name: 'Causeway Point', category: 'shopping', subCategory: 'mall', lat: 1.4362, lng: 103.7858, town: 'WOODLANDS', description: 'Metro, FairPrice Finest, Cathay Cineplex, 250 shops' },
  { id: 'mall-northpoint-city', name: 'Northpoint City', category: 'shopping', subCategory: 'mall', lat: 1.4298, lng: 103.8362, town: 'YISHUN', description: 'Largest mall in the North: FairPrice, Cold Storage, Yishun Public Library, South Wing' },
  { id: 'mall-white-sands', name: 'White Sands Shopping Mall', category: 'shopping', subCategory: 'mall', lat: 1.3722, lng: 103.9498, town: 'PASIR RIS', description: 'FairPrice, Pasir Ris Public Library, Koufu' },
  { id: 'mall-hillion-mall', name: 'Hillion Mall & Bukit Panjang Plaza', category: 'shopping', subCategory: 'mall', lat: 1.3785, lng: 103.7628, town: 'BUKIT PANJANG', description: '24hr FairPrice, Kopitiam, Harvey Norman' },
  { id: 'mall-lot-one', name: 'Lot One Shoppers\' Mall', category: 'shopping', subCategory: 'mall', lat: 1.3852, lng: 103.7448, town: 'CHOA CHU KANG', description: 'FairPrice, Shaw Theatres, Choa Chu Kang Library' },
  { id: 'mall-west-mall', name: 'West Mall', category: 'shopping', subCategory: 'mall', lat: 1.3502, lng: 103.7492, town: 'BUKIT BATOK', description: 'Cold Storage, Cathay Cineplex, Bukit Batok Library' },
  { id: 'mall-parkway-parade', name: 'Parkway Parade', category: 'shopping', subCategory: 'mall', lat: 1.3018, lng: 103.9052, town: 'MARINE PARADE', description: 'FairPrice Xtra, Cold Storage, Marks & Spencer, Isetan' },

  // ==========================================
  // HAWKER CENTRES & FOOD MARKETS
  // ==========================================
  { id: 'food-changi-village', name: 'Changi Village Hawker Centre', category: 'food', subCategory: 'hawker', lat: 1.3892, lng: 103.9882, town: 'PASIR RIS', description: 'Famous Nasi Lemak, Goreng Pisang & seafood' },
  { id: 'food-bedok-85', name: 'Fengshan Market & Food Centre (Bedok 85)', category: 'food', subCategory: 'hawker', lat: 1.3318, lng: 103.9388, town: 'BEDOK', description: 'Legendary Bak Chor Mee, BBQ chicken wings, oyster omelette, satay bee hoon' },
  { id: 'food-bedok-interchange', name: 'Bedok Interchange Hawker Centre', category: 'food', subCategory: 'hawker', lat: 1.3242, lng: 103.9308, town: 'BEDOK', description: 'Award-winning Song Zhou Carrot Cake, Mee Rebus, Duck Rice' },
  { id: 'food-tampines-round-market', name: 'Tampines Round Market & Food Centre', category: 'food', subCategory: 'hawker', lat: 1.3462, lng: 103.9442, town: 'TAMPINES', description: 'Iconic round architecture, Sarawak Kolo Mee, Lor Mee, Carrot Cake' },
  { id: 'food-old-airport-road', name: 'Old Airport Road Food Centre', category: 'food', subCategory: 'hawker', lat: 1.3082, lng: 103.8858, town: 'GEYLANG', description: 'One of Singapore\'s top food centres: Nam Sing Hokkien Mee, Lao Fu Zhi Char Kway Teow, soya beancurd' },
  { id: 'food-maxwell', name: 'Maxwell Food Centre', category: 'food', subCategory: 'hawker', lat: 1.2804, lng: 103.8447, town: 'CENTRAL', description: 'Tian Tian Hainanese Chicken Rice, Zhen Zhen Porridge, Popiah' },
  { id: 'food-amoy-street', name: 'Amoy Street Food Centre', category: 'food', subCategory: 'hawker', lat: 1.2792, lng: 103.8468, town: 'CENTRAL', description: 'Michelin Bib Gourmand A Noodle Story, Han Kee Fish Soup, J2 Famous Crispy Curry Puff' },
  { id: 'food-tiong-bahru-market', name: 'Tiong Bahru Market & Food Centre', category: 'food', subCategory: 'hawker', lat: 1.2848, lng: 103.8322, town: 'BUKIT MERAH', description: 'Jian Bo Shui Kueh, Lor Mee 178, Chwee Kueh, Roast Meats' },
  { id: 'food-abc-brickworks', name: 'ABC Brickworks Market & Food Centre', category: 'food', subCategory: 'hawker', lat: 1.2872, lng: 103.8080, town: 'BUKIT MERAH', description: 'Ah Er Soup, Fatty Cheong Roast Duck, Power Chendol' },
  { id: 'food-toa-payoh-lor-8', name: 'Toa Payoh Lorong 8 Market & Hawker', category: 'food', subCategory: 'hawker', lat: 1.3402, lng: 103.8582, town: 'TOA PAYOH', description: 'Popular neighbourhood hawker centre with famous fishball noodles' },
  { id: 'food-chomp-chomp', name: 'Chomp Chomp Food Centre', category: 'food', subCategory: 'hawker', lat: 1.3642, lng: 103.8665, town: 'SERANGOON', description: 'Famous supper haven: Sambal stingray, Hokkien mee, BBQ chicken wings, sugarcane juice' },
  { id: 'food-yuhua-market', name: 'Yuhua Village Market & Food Centre', category: 'food', subCategory: 'hawker', lat: 1.3440, lng: 103.7408, town: 'JURONG EAST', description: 'Jurong East favorite for breakfast bee hoon, laksa, and traditional kueh' },
  { id: 'food-boon-lay-place', name: 'Boon Lay Place Food Village', category: 'food', subCategory: 'hawker', lat: 1.3468, lng: 103.7128, town: 'JURONG WEST', description: 'Famous Boon Lay Power Nasi Lemak, BBQ satay, fried prawn noodles' },
  { id: 'food-chong-pang', name: 'Chong Pang Market & Food Centre', category: 'food', subCategory: 'hawker', lat: 1.4312, lng: 103.8282, town: 'YISHUN', description: 'Famous Chong Pang Nasi Lemak, soya bean, braised duck rice' },
  { id: 'food-one-punggol-hawker', name: 'One Punggol Hawker Centre', category: 'food', subCategory: 'hawker', lat: 1.4082, lng: 103.9052, town: 'PUNGGOL', description: 'Modern smart hawker centre with 34 stalls and social enterprise pricing' },

  // ==========================================
  // HEALTHCARE & POLYCLINICS
  // ==========================================
  { id: 'health-sgh', name: 'Singapore General Hospital (SGH)', category: 'health', subCategory: 'hospital', lat: 1.2785, lng: 103.8342, town: 'CENTRAL', description: 'Singapore\'s largest tertiary teaching hospital' },
  { id: 'health-nuh', name: 'National University Hospital (NUH)', category: 'health', subCategory: 'hospital', lat: 1.2938, lng: 103.7832, town: 'QUEENSTOWN', description: 'Tertiary referral hospital and medical research facility' },
  { id: 'health-cgh', name: 'Changi General Hospital (CGH)', category: 'health', subCategory: 'hospital', lat: 1.3402, lng: 103.9622, town: 'SIMEI', description: 'Regional general hospital serving eastern Singapore' },
  { id: 'health-ktph', name: 'Khoo Teck Puat Hospital (KTPH)', category: 'health', subCategory: 'hospital', lat: 1.4248, lng: 103.8385, town: 'YISHUN', description: 'Award-winning eco-friendly public general hospital' },
  { id: 'health-skh', name: 'Sengkang General Hospital (SKH)', category: 'health', subCategory: 'hospital', lat: 1.3948, lng: 103.8928, town: 'SENGKANG', description: 'Modern integrated acute and community hospital' },
  { id: 'health-ntfgh', name: 'Ng Teng Fong General Hospital (NTFGH)', category: 'health', subCategory: 'hospital', lat: 1.3340, lng: 103.7455, town: 'JURONG EAST', description: 'Integrated healthcare hub in Jurong East' },
  { id: 'health-amk-poly', name: 'Ang Mo Kio Polyclinic (NHG)', category: 'health', subCategory: 'polyclinic', lat: 1.3698, lng: 103.8465, town: 'ANG MO KIO', description: 'Subsidised primary healthcare, dental, vaccinations' },
  { id: 'health-bedok-poly', name: 'Bedok Polyclinic (Heartbeat@Bedok)', category: 'health', subCategory: 'polyclinic', lat: 1.3275, lng: 103.9318, town: 'BEDOK', description: 'Integrated community health hub at Heartbeat@Bedok' },
  { id: 'health-tampines-poly', name: 'Tampines Polyclinic (SingHealth)', category: 'health', subCategory: 'polyclinic', lat: 1.3562, lng: 103.9458, town: 'TAMPINES', description: 'Subsidised primary medical care and pharmacy' },
  { id: 'health-toa-payoh-poly', name: 'Toa Payoh Polyclinic (NHG)', category: 'health', subCategory: 'polyclinic', lat: 1.3345, lng: 103.8505, town: 'TOA PAYOH', description: 'National Healthcare Group polyclinic' },
  { id: 'health-oasis-poly', name: 'Punggol Polyclinic (Oasis Terraces)', category: 'health', subCategory: 'polyclinic', lat: 1.4055, lng: 103.9125, town: 'PUNGGOL', description: 'Modern SingHealth polyclinic at Oasis Terraces waterfront' },
  { id: 'health-sengkang-poly', name: 'Sengkang Polyclinic (SingHealth)', category: 'health', subCategory: 'polyclinic', lat: 1.3932, lng: 103.8918, town: 'SENGKANG', description: 'SingHealth primary care clinic' },
  { id: 'health-jurong-poly', name: 'Jurong Polyclinic (NUHS)', category: 'health', subCategory: 'polyclinic', lat: 1.3492, lng: 103.7388, town: 'JURONG EAST', description: 'National University Health System polyclinic' },
  { id: 'health-clementi-poly', name: 'Clementi Polyclinic (NUHS)', category: 'health', subCategory: 'polyclinic', lat: 1.3148, lng: 103.7632, town: 'CLEMENTI', description: 'Primary healthcare clinic opposite Clementi Stadium' },
  { id: 'health-woodlands-poly', name: 'Woodlands Polyclinic (NHG)', category: 'health', subCategory: 'polyclinic', lat: 1.4348, lng: 103.7892, town: 'WOODLANDS', description: 'Subsidised healthcare clinic near Woodlands Civic Centre' },
  { id: 'health-bukit-batok-poly', name: 'Bukit Batok Polyclinic (NHG)', category: 'health', subCategory: 'polyclinic', lat: 1.3508, lng: 103.7482, town: 'BUKIT BATOK', description: 'National Healthcare Group polyclinic' },

  // ==========================================
  // PARKS, SPORTS & RECREATION
  // ==========================================
  { id: 'park-bishan-amk', name: 'Bishan-Ang Mo Kio Park', category: 'park', subCategory: 'sports_park', lat: 1.3628, lng: 103.8465, town: 'BISHAN', description: '62-hectare riverine park with dog runs, water playground, McDonald\'s & cafes' },
  { id: 'park-bedok-reservoir', name: 'Bedok Reservoir Park', category: 'park', subCategory: 'sports_park', lat: 1.3412, lng: 103.9288, town: 'BEDOK', description: '4.3km running track, water sports, Forest Adventure obstacle course' },
  { id: 'park-punggol-waterway', name: 'Punggol Waterway Park', category: 'park', subCategory: 'sports_park', lat: 1.4112, lng: 103.9058, town: 'PUNGGOL', description: 'Waterway bridges (Jewel, Sunrise, Adventure), cycling track & Coney Island connector' },
  { id: 'park-jurong-lake-gardens', name: 'Jurong Lake Gardens', category: 'park', subCategory: 'sports_park', lat: 1.3385, lng: 103.7288, town: 'JURONG EAST', description: '90-hectare national garden with Rasau Walk boardwalk, Clivia dog run & Forest Ramble playground' },
  { id: 'park-east-coast-park', name: 'East Coast Park (ECP)', category: 'park', subCategory: 'sports_park', lat: 1.3025, lng: 103.9182, town: 'MARINE PARADE', description: '15km scenic coastline, Parkland Green, Marine Cove, seafood centres & cycling' },
  { id: 'park-admiralty-park', name: 'Admiralty Park & Woodlands Waterfront', category: 'park', subCategory: 'sports_park', lat: 1.4468, lng: 103.7825, town: 'WOODLANDS', description: 'Largest park in the north with 26 slides and scenic coastal jetty' },
  { id: 'park-sengkang-riverside', name: 'Sengkang Riverside Park', category: 'park', subCategory: 'sports_park', lat: 1.3982, lng: 103.8862, town: 'SENGKANG', description: 'Sunfish floating wetland, Punggol River connector, Pastor Cafe' },
  { id: 'park-bukit-timah-nature', name: 'Bukit Timah Nature Reserve', category: 'park', subCategory: 'sports_park', lat: 1.3548, lng: 103.7762, town: 'BUKIT TIMAH', description: 'Highest hill in Singapore (163m) with rainforest hiking trails' },
];
