import { META_FACEBOOK_GRAPH_API_BASE_URL, META_GRAPH_API_VERSION } from '../meta/constants'

export const FacebookOAuth2Config = {
  pkce: false,
  shortLived: true,
  apiBaseUrl: META_FACEBOOK_GRAPH_API_BASE_URL,
  authURL: `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth`,
  accessTokenURL: `${META_FACEBOOK_GRAPH_API_BASE_URL}/oauth/access_token`,
  longLivedAccessTokenURL:
        `${META_FACEBOOK_GRAPH_API_BASE_URL}/oauth/access_token`,
  refreshTokenURL:
        `${META_FACEBOOK_GRAPH_API_BASE_URL}/oauth/access_token`,
  // see https://developers.facebook.com/docs/graph-api/overview/#me
  userProfileURL:
        `${META_FACEBOOK_GRAPH_API_BASE_URL}/me?fields=id,first_name,last_name,middle_name,name,name_format,picture,short_name`,
  pageAccountURL: `${META_FACEBOOK_GRAPH_API_BASE_URL}/me/accounts`,

  requestAccessTokenMethod: 'POST',
  defaultScopes: [
    // see https://developers.facebook.com/docs/permissions
    'public_profile',
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_read_user_content',
    'pages_manage_engagement',
    'pages_manage_metadata',
    'read_insights',
    // 'pages_manage_ads',
  ],
  longLivedGrantType: 'fb_exchange_token',
  longLivedParamsMap: {
    access_token: 'fb_exchange_token',
  },
  scopesSeparator: ' ',
}
