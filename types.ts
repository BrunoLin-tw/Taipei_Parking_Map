export interface ParkingLotDesc {
  id: string;
  area: string;
  name: string;
  type: string; // "1": Planar, "2": Tower
  type2: string;
  summary: string;
  address: string;
  tel: string;
  payex: string;
  serviceTime: string;
  tw97x: string;
  tw97y: string;
  totalcar: number;
  totalmotor: number;
  totalbike: number;
  Pregnancy_First: string;
  Handicap_First: string;
  Taxi_OneHR_Free: string;
  AED_Equipment: string;
  CellSignal_Enhancement: string;
  Accessibility_Elevator: string;
  Phone_Charge: string;
  Child_Pickup_Area: string;
  FareInfo: {
    WorkingDay: Array<{ Period: string; Fare: string }>;
    Holiday: Array<{ Period: string; Fare: string }>;
  };
  EntranceCoord: {
    EntrancecoordInfo: Array<{
      Xcod: string;
      Ycod: string;
      Address: string;
    }>;
  };
}

export interface ParkingLotAvail {
  id: string;
  availablecar: number;
  availablemotor: number;
}

// New Taipei City Data Interfaces
export interface NTPCParkingLotDesc {
  ID: string;
  NAME: string;
  TYPE: string;
  AREA: string;
  ADDRESS: string;
  PAYEX: string;
  SERVICETIME: string;
  TW97X: string;
  TW97Y: string;
  TOTALCAR: string; // NTPC often returns numbers as strings
  TOTALMOTOR: string;
}

export interface NTPCParkingLotAvail {
  ID: string;
  AVAILABLECAR: string; // NTPC often returns numbers as strings
}

export interface ParkingLotData extends Partial<ParkingLotDesc> {
  id: string;
  name: string;
  address: string;
  payex: string;
  totalcar: number;
  availablecar: number;
  lat: number;
  lng: number;
  lastUpdated: number;
  source: 'TPC' | 'NTPC'; // Identify source
}

export interface APIResponseDesc {
  data: {
    park: ParkingLotDesc[];
  };
}

export interface APIResponseAvail {
  data: {
    park: ParkingLotAvail[];
  };
}