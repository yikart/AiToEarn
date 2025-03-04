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

interface Data {
  eventList: WxSphEventList[];
  lastBuff: string;
  continueFlag: boolean;
}

export interface WxSphEventList {
  eventTopicId: string;
  eventName: string;
  eventCreatorNickname: string;
}

export interface WeChatVideoApiResponse {
  errCode: number;
  errMsg: string;
  data: Data;
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

interface WeChatVideoUser {
  username: string;
  headImgUrl: string;
  nickName: string;
  authImgUrl: string;
  authCompanyName: string;
}

export interface WeChatVideoUserData {
  errCode: number;
  errMsg: string;
  data: {
    list: WeChatVideoUser[];
    totalCount: number;
  };
}
