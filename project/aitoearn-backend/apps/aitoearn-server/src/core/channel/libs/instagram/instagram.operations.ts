export const InstagramOperation = {
  REFRESH_OAUTH_CREDENTIAL: 'refresh_oauth_credential',
  CREATE_MEDIA_CONTAINER: 'create_media_container',
  CHUNKED_MEDIA_UPLOAD: 'chunked_media_upload',
  PUBLISH_MEDIA_CONTAINER: 'publish_media_container',
  GET_ACCOUNT_METRICS: 'get_account_metrics',
  GET_MEDIA_INSIGHTS: 'get_media_insights',
  GET_OBJECT_INFO: 'get_object_info',
  GET_ACCOUNT_INSIGHTS: 'get_account_insights',
  GET_ACCOUNT_INFO: 'get_account_info',
  GET_USER_PROFILE: 'get_user_profile',
  GET_USER_POSTS: 'get_user_posts',
  GET_POST_DETAIL: 'get_post_detail',
  FETCH_POST_COMMENTS: 'fetch_post_comments',
  FETCH_COMMENT_REPLIES: 'fetch_comment_replies',
  PUBLISH_COMMENT: 'publish_comment',
  PUBLISH_SUB_COMMENT: 'publish_sub_comment',
} as const

export type InstagramOperationLabel = typeof InstagramOperation[keyof typeof InstagramOperation]
