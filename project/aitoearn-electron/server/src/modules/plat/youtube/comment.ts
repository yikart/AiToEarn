export enum VideoUTypes {
  Little = 0,
  Big = 1,
}

export interface AccessToken {
  access_token: string; // 'd30bedaa4d8eb3128cf35ddc1030e27d';
  expires_in: number; // 1630220614;
  refresh_token: string; // 'WxFDKwqScZIQDm4iWmKDvetyFugM6HkX';
  scopes: string[]; // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
  token_type: string;
  id_token: string;
}
