export interface S3ModuleOptions {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

export interface S3ModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<S3ModuleOptions> | S3ModuleOptions
  inject?: any[]
  imports?: any[]
}
