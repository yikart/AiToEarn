interface Location {
  longitude: number;
  latitude: number;
  country: string;
  countryCode: string;
  province: string;
  city: string;
  region: string;
  poiCheckSum: string;
}

interface POI {
  uid: string;
  name: string;
  longitude: number;
  latitude: number;
  address: string;
  province: string;
  city: string;
  region: string;
  fullAddress: string;
  source: number;
  poiCheckSum: string;
}

export interface WeChatLocationData {
  errCode: number;
  errMsg: string;
  data: {
    list: POI[];
    cookies: string;
    address: Location;
    continueFlag: number;
  };
}