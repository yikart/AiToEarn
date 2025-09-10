export enum ResponseCode {
  Success = 0,

  // 错误码域从 10000 开始，每个模块各自前缀 11000 12000 以此类推
  // 10 (libs)
  // 10000 (common)

  // 10100 (s3)
  S3DownloadFileFailed = 10100,

  // 11000 (multilogin-account)
  MultiloginAccountNotFound = 11000,
  MultiloginAccountProfilesExceeded = 11001,
  NoAvailableMultiloginAccount = 11002,

  // 11100 (cloud-space)
  CloudSpaceNotFound = 11100,
  CloudSpaceCreationFailed = 11101,

  // 11200 (cloud-instance)
  UCloudInstanceCreationFailed = 11200,
  UCloudInstanceNotFound = 11201,
  UCloudInstanceDeletionFailed = 11202,

  // 11300 (browser-profile)
  BrowserProfileNotFound = 11300,

  // 12000 (user)
  UserPointsInsufficient = 12001,

  // 13000 (ai)
  InvalidModel = 13000,
  AiCallFailed = 13001,
  InvalidAiTaskId = 13002,
  AiLogNotFound = 130003,
}
