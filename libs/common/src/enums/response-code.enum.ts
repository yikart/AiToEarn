export enum ResponseCode {
  Success = 0,

  // 错误码域从 10000 开始，每个模块各自前缀 11000 12000 以此类推
  // 10 (libs)
  // 10000 (common)

  // 10100 (s3)
  S3PutObjectError = 10100,
}
