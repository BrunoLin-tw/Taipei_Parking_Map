import { 
  ParkingLotDesc, 
  ParkingLotAvail, 
  ParkingLotData, 
  NTPCParkingLotDesc, 
  NTPCParkingLotAvail 
} from '../types';
import { convertTWD97ToWGS84 } from './coordinateService';

// Taipei City URLs
const TPC_DESC_URL = 'https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_alldesc.json';
const TPC_AVAIL_URL = 'https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_allavailable.json';

// New Taipei City Base URLs
const NTPC_DESC_BASE_URL = 'https://data.ntpc.gov.tw/api/datasets/b1464ef0-9c7c-4a6f-abf7-6bdf32847e68/json';
const NTPC_AVAIL_BASE_URL = 'https://data.ntpc.gov.tw/api/datasets/e09b35a5-a738-48cc-b0f5-570b67ad9c78/json';

/**
 * Multiple CORS Proxies for redundancy
 * Primary: corsproxy.io (Fast & Reliable)
 * Secondary: allorigins (Standard)
 */
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

// Helper for sleeping (for retry logic)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch data with multiple proxies and retries
const fetchWithRetry = async (url: string, retries = 2): Promise<any> => {
  // Try direct fetch first (some environments might allow it)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch (err) {
    // Continue to proxies
  }

  // Try each proxy
  for (const proxyFn of PROXIES) {
    const proxyUrl = proxyFn(url);
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            console.warn("Proxy returned non-JSON content", url);
            break; // Try next proxy
          }
        }
      } catch (err) {
        if (i === retries) console.error(`Failed to fetch via proxy after ${retries} retries: ${proxyUrl}`, err);
        else await sleep(500 * (i + 1)); // Exponential backoff
      }
    }
  }

  throw new Error(`Unable to fetch data from ${url} even with proxies.`);
};

/**
 * NTPC API requires pagination. Fetch all pages until an empty or invalid result.
 */
const fetchAllNTPCData = async (baseUrl: string): Promise<any[]> => {
  let allData: any[] = [];
  let page = 0;
  const size = 1000;
  const ts = Date.now();

  while (true) {
    const url = `${baseUrl}?page=${page}&size=${size}&_t=${ts}`;
    try {
      const data = await fetchWithRetry(url);
      
      // NTPC returns [] when done, but sometimes a non-array error object if params are wrong
      if (!data || !Array.isArray(data) || data.length === 0) {
        break;
      }
      
      allData = allData.concat(data);
      page++;
      
      // Safety limit for pages (approx 15000 entries)
      if (page > 15) break; 
    } catch (error) {
      console.error(`Stopping NTPC fetch at page ${page} due to error:`, error);
      break; 
    }
  }
  return allData;
};

const getProp = (obj: any, key: string) => {
  if (!obj) return undefined;
  return obj[key] || obj[key.toLowerCase()] || obj[key.toUpperCase()];
};

const fetchTaipeiData = async (): Promise<ParkingLotData[]> => {
  try {
    const [descRes, availRes] = await Promise.all([
      fetch(TPC_DESC_URL),
      fetch(TPC_AVAIL_URL)
    ]);

    if (!descRes.ok || !availRes.ok) throw new Error("Failed to fetch Taipei data");

    const descJson = await descRes.json();
    const availJson = await availRes.json();

    const parksDesc: ParkingLotDesc[] = descJson.data.park;
    const parksAvail: ParkingLotAvail[] = availJson.data.park;

    const availMap = new Map<string, number>();
    parksAvail.forEach(p => availMap.set(p.id, p.availablecar));

    return parksDesc.map(desc => {
      const x = parseFloat(desc.tw97x);
      const y = parseFloat(desc.tw97y);
      const [lat, lng] = convertTWD97ToWGS84(x, y);

      return {
        ...desc,
        id: desc.id,
        name: desc.name,
        address: desc.address,
        payex: desc.payex,
        totalcar: desc.totalcar,
        availablecar: availMap.get(desc.id) ?? -9,
        lat,
        lng,
        lastUpdated: Date.now(),
        source: 'TPC' as const
      };
    }).filter(p => p.lat !== 0 && p.lng !== 0);
  } catch (error) {
    console.error("TPC Data Error:", error);
    return [];
  }
};

const fetchNewTaipeiData = async (): Promise<ParkingLotData[]> => {
  try {
    const [descArray, availArray] = await Promise.all([
      fetchAllNTPCData(NTPC_DESC_BASE_URL),
      fetchAllNTPCData(NTPC_AVAIL_BASE_URL)
    ]);

    const availMap = new Map<string, number>();
    availArray.forEach((p: any) => {
      const id = getProp(p, 'ID');
      const avail = getProp(p, 'AVAILABLECAR');
      const count = parseInt(avail, 10);
      if (id) {
        availMap.set(id, isNaN(count) ? -9 : count);
      }
    });

    return descArray.map((desc: any) => {
      const xStr = getProp(desc, 'TW97X');
      const yStr = getProp(desc, 'TW97Y');
      const x = parseFloat(xStr);
      const y = parseFloat(yStr);
      const [lat, lng] = convertTWD97ToWGS84(x, y);

      const id = getProp(desc, 'ID');
      const name = getProp(desc, 'NAME');
      const address = getProp(desc, 'ADDRESS');
      const payex = getProp(desc, 'PAYEX');
      const totalStr = getProp(desc, 'TOTALCAR');

      return {
        id: id,
        name: name,
        address: address,
        payex: payex,
        totalcar: parseInt(totalStr, 10) || 0,
        availablecar: availMap.get(id) ?? -9,
        lat,
        lng,
        lastUpdated: Date.now(),
        source: 'NTPC' as const
      };
    }).filter(p => p.lat !== 0 && p.lng !== 0 && p.id);
  } catch (error) {
    console.error("NTPC Data Error:", error);
    return []; 
  }
};

export const fetchParkingData = async (): Promise<ParkingLotData[]> => {
  const [tpcData, ntpcData] = await Promise.all([
    fetchTaipeiData(),
    fetchNewTaipeiData()
  ]);

  const combined = [...tpcData, ...ntpcData];
  
  if (combined.length === 0) {
    throw new Error("無法取得任何停車場資料，請檢查網路連線或 API 狀態。");
  }

  return combined;
};