import { META_INSTAGRAM_GRAPH_API_BASE_URL } from '../meta/constants'

export const InstagramOAuth2Config = {
  pkce: false,
  shortLived: true,
  apiBaseUrl: META_INSTAGRAM_GRAPH_API_BASE_URL,
  authURL: 'https://api.instagram.com/oauth/authorize',
  // short-lived access token, expires in 1 hour
  accessTokenURL: 'https://api.instagram.com/oauth/access_token',
  pageAccountURL: '',
  longLivedAccessTokenURL: 'https://graph.instagram.com/access_token',
  // refresh long-lived access token: https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token
  refreshTokenURL: 'https://graph.instagram.com/refresh_access_token',
  // see https://developers.facebook.com/docs/instagram-platform/reference/me/
  userProfileURL:
        `${META_INSTAGRAM_GRAPH_API_BASE_URL}/me?fields=id,name,username,profile_picture_url`,
  requestAccessTokenMethod: 'POST',

  defaultScopes: [
    // see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
    'instagram_business_basic',
    'instagram_business_content_publish',
    'instagram_business_manage_comments',
    'instagram_business_manage_insights',
  ],
  longLivedGrantType: 'ig_exchange_token',
  longLivedParamsMap: {
    access_token: 'access_token',
  },
  scopesSeparator: ' ',
}
