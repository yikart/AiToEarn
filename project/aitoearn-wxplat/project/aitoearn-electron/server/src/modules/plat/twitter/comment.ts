export enum VideoUTypes {
  Little = 0,
  Big = 1,
}

export interface AccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scopes: string[];
  token_type: string;
  id_token: string;
}
