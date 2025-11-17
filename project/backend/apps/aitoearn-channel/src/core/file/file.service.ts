import { Injectable } from '@nestjs/common'
import { S3Service } from '@yikart/aws-s3'
import * as mime from 'mime-types'
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../../config'

@Injectable()
export class FileService {
  constructor(private readonly s3Service: S3Service) {}

  private getNewFilePath(opt: {
    path: string
    newName?: string
    permanent?: boolean
  }) {
    let { path, newName } = opt

    path = `${opt.permanent ? '' : 'temp/'}${path || `nopath/${moment().format('YYYYMM')}`}`
    path = path.replace('//', '/')
    newName = newName || uuidv4()

    return {
      path,
      newName,
    }
  }

  /**
   * 文件上传
   * @param {Express.Multer.File} file 文件buffer流对象
   * @param {string | undefined} path 路径，不传就会使用‘nopath’前缀
   * @param {string | undefined} newName 新的文件名
   * @param {string | undefined} permanent 是否为永久目录，默认临时
   * @returns
   */
  async upFileStream(
    file: any,
    path: string,
    newName?: string,
    permanent?: boolean,
  ) {
    const { path: newPath, newName: newFileName } = this.getNewFilePath({
      path,
      newName,
      permanent,
    })
    const filePath = `${newPath}/${newFileName}.${mime.extension(file.mimetype)}`
    const res = await this.s3Service.putObject(
      filePath,
      file.buffer,
    )

    return res
  }

  /**
   * 上传二进制流文件
   * @param buffer 二进制流 base64格式
   * @param option
   * @param option.path 路径
   * @param option.permanent 是否为永久目录，默认临时
   * @param option.fileType 文件后缀
   */
  async uploadByStream(
    buffer: Buffer, // base64格式(不带前缀)
    option: {
      path?: string
      permanent?: boolean
      fileType: string
    },
  ): Promise<string> {
    const { path, permanent, fileType } = option
    const objectName = `${permanent ? '' : 'temp/'}${path || 'nopath'}${`/${moment().format('YYYYMM')}/${uuidv4()}.${fileType}`}`
    const res = await this.s3Service.putObject(
      objectName,
      buffer,
    )

    return res.path
  }

  /**
   * aws 根据URL上传文件
   * @param url 远程地址
   * @param option
   * @returns
   */
  async upFileByUrl(
    url: string,
    option: { path?: string, permanent?: boolean },
  ): Promise<string> {
    const { path, permanent } = option
    // 从URL下载文件内容
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download file from URL: ${url}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 根据响应内容类型获取文件后缀
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const fileType = mime.extension(contentType) || 'jpg'
    const objectName = `${permanent ? '' : 'temp/'}${path || 'nopath'}${`/${moment().format('YYYYMM')}/${uuidv4()}.${fileType}`}`

    const res = await this.s3Service.putObject(
      objectName,
      buffer,
    )

    return res.path
  }

  /**
   * 初始化分片
   * @param path
   * @param fileType
   * @returns
   */
  async initiateMultipartUpload(path: string, fileType: string) {
    const { path: newPath, newName: newFileName } = this.getNewFilePath({
      path,
    })
    const filePath = `${newPath}/${newFileName}.${mime.extension(fileType)}`
    const res = await this.s3Service.initiateMultipartUpload(filePath)
    return {
      uploadId: res,
      fileId: filePath,
    }
  }

  /**
   * 上传分片数据
   * @param fileId
   * @param uploadId
   * @param partNumber
   * @param partData
   * @returns
   */
  async uploadPart(
    fileId: string,
    uploadId: string,
    partNumber: number,
    partData: Buffer,
  ) {
    const res = await this.s3Service.uploadPart(
      fileId,
      uploadId,
      partNumber,
      partData,
    )

    return {
      PartNumber: partNumber,
      ETag: res.ETag,
    }
  }

  /**
   * 合并分片
   * @param key
   * @param uploadId
   * @param parts
   * @returns
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { PartNumber: number, ETag: string }[],
  ) {
    const res = await this.s3Service.completeMultipartUpload(
      key,
      uploadId,
      parts,
    )

    return res
  }

  /**
   * 文件路径转换为url
   * @param url 参考标题
   * @returns
   */
  filePathToUrl(url: string): string {
    if (url.startsWith('http'))
      return url
    return `${config.awsS3.endpoint}/${url}`
  }
}
