export enum ResponseCode {
  Success = 0,

  // 错误码域从 10000 开始，每个模块各自前缀 11000 12000 以此类推
  // 10 (libs)
  // 10000 (common)

  // 10100 (s3)
  S3PutObjectError = 10100,

  // 11000 (multilogin-account)
  MultiloginAccountNotFound = 11000,
  MultiloginAccountProfilesExceeded = 11001,
  NoAvailableMultiloginAccount = 11002,

  // 12000 (browser-environment)
  BrowserEnvironmentNotFound = 12000,
  BrowserEnvironmentCreationFailed = 12001,
  BrowserEnvironmentQueryFailed = 12002,
  BrowserEnvironmentDeletionFailed = 12003,

  // 12100 (cloud-instance)
  UCloudInstanceCreationFailed = 12100,
  UCloudInstanceNotFound = 12101,
  UCloudInstanceQueryFailed = 12102,
  UCloudInstanceError = 12103,
  UCloudInstanceTimeout = 12104,
  UCloudInstanceDeletionFailed = 12105,

  // 12200 (browser-profile)
  BrowserProfileNotFound = 12200,
  BrowserProfileCreationFailed = 12201,
  BrowserProfileQueryFailed = 12202,
  BrowserProfileReleaseFailed = 12203,
  MultiloginProfileCreationFailed = 12204,
}
