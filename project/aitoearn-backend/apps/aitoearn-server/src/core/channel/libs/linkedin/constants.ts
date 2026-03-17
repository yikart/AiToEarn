export const LinkedinOAuth2Config = {
  pkce: false,
  apiBaseUrl: 'https://api.linkedin.com/v2',
  authURL: 'https://www.linkedin.com/oauth/v2/authorization',
  // access token, expires in 60 days
  accessTokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
  // refresh token is expires in 365 days
  refreshTokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
  userProfileURL:
        'https://api.linkedin.com/v2/userinfo',
  requestAccessTokenMethod: 'POST',

  defaultScopes: [
    'openid',
    'profile',
    'email',
    'w_member_social',
  ],
  scopesSeparator: ' ',
}
