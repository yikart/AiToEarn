// Operation constants for FacebookService (human-readable lowercase labels)
// Chosen scheme: const object + literal type (plan option 2)
export const FacebookOperation = {
  REFRESH_OAUTH_CREDENTIAL: 'refresh oauth credential',
  GET_PAGE_ACCESS_TOKEN: 'get page access token',

  INIT_VIDEO_UPLOAD: 'init video upload',
  CHUNKED_VIDEO_UPLOAD: 'chunked video upload',
  FINALIZE_VIDEO_UPLOAD: 'finalize video upload',
  PUBLISH_VIDEO_POST: 'publish video post',
  PUBLISH_VIDEO_BY_IMAGE_URL: 'publish video by image url',

  UPLOAD_PHOTO_BY_URL: 'upload photo by url',
  UPLOAD_PHOTO_BY_FILE: 'upload photo by file',
  PUBLISH_SINGLE_PHOTO_POST: 'publish single photo post',
  PUBLISH_MULTIPLE_PHOTO_POST: 'publish multiple photo post',
  PUBLISH_FEED_POST: 'publish feed post',

  GET_OBJECT_INFO: 'get object info',
  GET_PAGE_INSIGHTS: 'get page insights',
  GET_OBJECT_INSIGHTS: 'get object insights',
  GET_PAGE_DETAILS: 'get page details',
  GET_PAGE_PUBLISHED_POSTS: 'get page published posts',
  GET_PAGE_POST_DETAILS: 'get page post details',

  GET_POST_COMMENTS: 'get post comments',
  GET_POST_REACTIONS: 'get post reactions',
  FETCH_PAGE_POSTS: 'fetch page posts',
  FETCH_OBJECT_COMMENTS: 'fetch object comments',
  PUBLISH_PLAINTEXT_COMMENT: 'publish plaintext comment',

  INIT_REEL_UPLOAD: 'init reel upload',
  UPLOAD_REEL_CHUNK: 'upload reel chunk',
  PUBLISH_REEL_POST: 'publish reel post',

  INIT_VIDEO_STORY_UPLOAD: 'init video story upload',
  UPLOAD_VIDEO_STORY_CHUNK: 'upload video story chunk',
  PUBLISH_VIDEO_STORY_POST: 'publish video story post',
  PUBLISH_PHOTO_STORY_POST: 'publish photo story post',

  SEARCH_PAGES: 'search pages',
  FETCH_POST_ATTACHMENT: 'fetch post attachment',
  DELETE_POST: 'delete post',
} as const

export type FacebookOperationLabel = typeof FacebookOperation[keyof typeof FacebookOperation]
