// Pinterest API v5 endpoints
// Docs:
// - Overview: https://developers.pinterest.com/docs/api/v5/
// - OAuth: https://developers.pinterest.com/docs/api/v5/#tag/OAuth
// - User Account: https://developers.pinterest.com/docs/api/v5/#tag/User-Account
// - Boards: https://developers.pinterest.com/docs/api/v5/#tag/Boards
// - Pins: https://developers.pinterest.com/docs/api/v5/#tag/Pins
// - Media: https://developers.pinterest.com/docs/api/v5/#tag/Media

export const PinterestAPIConfig = {
  baseUrl: 'https://api.pinterest.com',
  oauthTokenURL: 'https://api.pinterest.com/v5/oauth/token',
  userAccountURL: 'https://api.pinterest.com/v5/user_account',
  boardsURL: 'https://api.pinterest.com/v5/boards',
  pinsURL: 'https://api.pinterest.com/v5/pins',
  mediaURL: 'https://api.pinterest.com/v5/media',
} as const
