export const FacebookOAuth2Config = {
  pkce: false,
  shortLived: true,
  apiBaseUrl: 'https://graph.facebook.com/',
  authURL: 'https://www.facebook.com/v23.0/dialog/oauth',
  accessTokenURL: 'https://graph.facebook.com/v23.0/oauth/access_token',
  longLivedAccessTokenURL:
        'https://graph.facebook.com/v23.0/oauth/access_token',
  refreshTokenURL:
        'https://graph.facebook.com/v23.0/oauth/access_token',
  // see https://developers.facebook.com/docs/graph-api/overview/#me
  userProfileURL:
        'https://graph.facebook.com/me?fields=id,first_name,last_name,middle_name,name,name_format,picture,short_name',
  pageAccountURL: 'https://graph.facebook.com/v23.0/me/accounts',

  requestAccessTokenMethod: 'POST',
  defaultScopes: [
    // see https://developers.facebook.com/docs/permissions
    'public_profile',
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    // 'pages_read_user_content',
    // 'pages_manage_engagement',
    // 'pages_manage_metadata',
    // 'read_insights',
    // 'pages_manage_ads',
  ],
  longLivedGrantType: 'fb_exchange_token',
  longLivedParamsMap: {
    access_token: 'fb_exchange_token',
  },
  scopesSeparator: ' ',
}
