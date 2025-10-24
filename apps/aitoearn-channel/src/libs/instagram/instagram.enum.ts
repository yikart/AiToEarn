export enum InstagramMediaType {
  CAROUSEL = 'CAROUSEL',
  REELS = 'REELS',
  STORIES = 'STORIES',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
}

// see https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights#metrics
export enum InstagramInsightsMetric {
  ACCOUNTS_ENGAGED = 'accounts_engaged',
  COMMENTS = 'comments',
  ENGAGED_AUDIENCE_DEMOGRAPHICS = 'engaged_audience_demographics',
  FOLLOWS_AND_UNFOLLOWS = 'follows_and_unfollows',
  IMPRESSIONS = 'impressions',
  LIKES = 'likes',
  PROFILE_LINKS_TAPS = 'profile_links_taps',
  REACH = 'reach',
  REPLIES = 'replies',
  SAVED = 'saved',
  SHARES = 'shares',
  TOTAL_INTERACTIONS = 'total_interactions',
  VIEWS = 'views',
}

export enum InstagramInsightsMetricType {
  TIME_SERIES = 'time_series', // Tells the API to aggregate results by time period.
  TOTAL_VALUE = 'total_value',
}

// Designates how to break down result set into subsets.
export enum InstagramInsightsResultBreakdown {
  CONTACT_BUTTON_TYPE = 'contact_button_type',
  FOLLOW_TYPE = 'follow_type',
  MEDIA_PRODUCT_TYPE = 'media_product_type',
  AGE = 'age',
  CITY = 'city',
  COUNTRY = 'country',
  GENDER = 'gender',
}

export enum InstagramInsightsPeriod {
  DAY = 'day', // 1 day
  LIFETIME = 'lifetime', // All time
}

export enum InstagramInsightsMetricTimeframe {
  LAST_14_DAYS = 'last_14_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  PREV_MONTH = 'prev_month',
  THIS_MONTH = 'this_month',
  THIS_WEEK = 'this_week',
}

// see https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights
export enum InstagramMediaInsightsMetric {
  CLIPS_REPLAYS_COUNT = 'clips_replays_count',
  COMMENTS = 'comments',
  FOLLOWS = 'follows',
  IG_REELS_AVG_WATCH_TIME = 'ig_reels_avg_watch_time',
  IG_REELS_VIDEO_VIEW_TOTAL_TIME = 'ig_reels_video_view_total_time',
  LIKES = 'likes',
  NAVIGATION = 'navigation',
  PROFILE_ACTIVITY = 'profile_activity',
  PROFILE_VISITS = 'profile_visits',
  REACH = 'reach',
  REPLIES = 'replies',
  SAVED = 'saved',
  SHARES = 'shares',
  TOTAL_INTERACTIONS = 'total_interactions',
  VIEWS = 'views',
}

export enum InstagramMediaInsightsResultBreakdown {
  ACTION_TYPE = 'action_type',
  STORY_NAVIGATION_ACTION_TYPE = 'story_navigation_action_type',
}

export enum InstagramMediaInsightsPeriod {
  DAY = 'day',
  WEEK = 'week',
  DAYS_28 = 'days_28',
  MONTH = 'month',
  LIFETIME = 'lifetime',
  TOTAL_OVER_RANGE = 'total_over_range',
}
