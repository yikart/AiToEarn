export enum ExceptionCode {
  Success = 0,

  // 通用错误码 (10xxx)
  InvalidRequest = 10001,
  Unauthorized = 10002,
  Forbidden = 10003,
  ServiceUnavailable = 10004,
  ExternalServiceError = 10005,

  // 用户相关错误码 (11xxx)
  UserNotFound = 11001,
  UserEmailAlreadyExists = 11002,
  UserPhoneAlreadyExists = 11003,
  UserInactive = 11004,
  UserPermissionDenied = 11005,

  // 任务相关错误码 (12xxx)
  TaskNotFound = 12001,
  TaskAlreadyCompleted = 12002,
  TaskExpired = 12003,
  TaskRecruitsFull = 12004,
  TaskAlreadyApplied = 12005,

  // 通知相关错误码 (13xxx)
  NotificationNotFound = 13001,
  NotificationAlreadyRead = 13002,
  NotificationAlreadyDeleted = 13003,
  NotificationPermissionDenied = 13004,

  // 内容相关错误码 (14xxx)
  MaterialNotFound = 14001,
  MaterialGenerationFailed = 14002,
  MediaNotFound = 14003,
  MediaProcessingFailed = 14004,

  // 渠道相关错误码 (15xxx)
  ChannelNotFound = 15001,
  ChannelConnectionFailed = 15002,
  ChannelAuthenticationFailed = 15003,

  // 文件相关错误码 (16xxx)
  FileNotFound = 16001,
  FileUploadFailed = 16002,
  FileFormatNotSupported = 16003,
  FileSizeExceeded = 16004,
}
