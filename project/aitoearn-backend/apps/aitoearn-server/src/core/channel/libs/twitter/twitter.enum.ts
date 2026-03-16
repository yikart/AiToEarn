// see https://docs.x.com/x-api/media/media-upload-initialize
export enum XMediaCategory {
  AMPLIFY_VIDEO = 'amplify_video',
  TWEET_GIF = 'tweet_gif',
  TWEET_IMAGE = 'tweet_image',
  TWEET_VIDEO = 'tweet_video',
  DM_GIF = 'dm_gif',
  DM_IMAGE = 'dm_image',
  DM_VIDEO = 'dm_video',
  SUBTITLES = 'subtitles',
}

export enum XMediaType {
  VIDEO_MP4 = 'video/mp4',
  VIDEO_WEBM = 'video/webm',
  VIDEO_MP2T = 'video/mp2t',
  VIDEO_QUICKTIME = 'video/quicktime',
  TEXT_SRT = 'text/srt',
  TEXT_VTT = 'text/vtt',
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_GIF = 'image/gif',
  IMAGE_BMP = 'image/bmp',
  IMAGE_PNG = 'image/png',
  IMAGE_WEBP = 'image/webp',
  IMAGE_PJPEG = 'image/pjpeg',
  IMAGE_TIFF = 'image/tiff',
  MODEL_GLTF_BINARY = 'model/gltf-binary',
  MODEL_USDZ_ZIP = 'model/vnd.usdz+zip',
}
