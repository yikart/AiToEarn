export interface AliOSSModuleOptions {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  endpoint?: string
  internal?: boolean
  secure?: boolean
  timeout?: string | number
  cname?: boolean
  isRequestPay?: boolean
}

export interface AliOSSModuleAsyncOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<AliOSSModuleOptions> | AliOSSModuleOptions
  inject?: any[]
}
