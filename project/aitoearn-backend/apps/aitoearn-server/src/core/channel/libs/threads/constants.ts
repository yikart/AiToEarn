export const ThreadsOAuth2Config = {
  pkce: false,
  shortLived: true,
  apiBaseUrl: 'https://graph.threads.net/v1.0/',
  authURL: 'https://threads.net/oauth/authorize',
  accessTokenURL: 'https://graph.threads.net/oauth/access_token',
  pageAccountURL: '',
  longLivedAccessTokenURL: 'https://graph.threads.net/access_token',
  // refresh long-lived access token: https://developers.facebook.com/docs/threads/get-started/long-lived-access-tokens/
  refreshTokenURL: 'https://graph.threads.net/oauth/refresh_access_token',
  userProfileURL:
        'https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography',
  requestAccessTokenMethod: 'POST',
  defaultScopes: [
    'threads_basic',
    'threads_content_publish',
    // 'threads_manage_insights',
    // 'threads_profile_discovery',
  ],
  longLivedGrantType: 'th_exchange_token',
  longLivedParamsMap: {
    access_token: 'access_token',
  },
  scopesSeparator: ',',
}
