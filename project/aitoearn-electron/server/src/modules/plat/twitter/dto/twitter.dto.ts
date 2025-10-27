export interface TwitterOAuthTokenResponse {
  token_type: 'bearer';
  expires_in: number; // typically 7200 seconds (2 hours)
  access_token: string;
  scope: string; // e.g., "users.read tweet.read offline.access"
  refresh_token?: string; // Present if 'offline.access' scope was requested
}

export interface TwitterUser {
  id: string;
  name: string; // Display name
  username: string; // Handle
  profile_image_url?: string;
  description?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  created_at?: string; // ISO 8601 date string
  verified?: boolean;
  // Add other fields as needed from the Twitter API v2 user object
}

// For storing in our AccountToken schema
export interface TwitterStoredTokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
}