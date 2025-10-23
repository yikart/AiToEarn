import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import * as mime from 'mime-types'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../../config'
import { S3Service } from '../../libs/aws-s3/s3.service'

@Injectable()
export class FileService {
  constructor(private readonly s3Service: S3Service) {}

  private getNewFilePath(opt: {
    path: string
    newName?: string
    permanent?: boolean
  }) {
    let { path, newName } = opt

    path = `${config.environment}/${opt.permanent ? '' : 'temp/'}${path || `nopath/${dayjs().format('YYYYMM')}`}`
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
    const res = await this.s3Service.uploadFile(
      filePath,
      file.buffer,
      file.mimetype,
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
    const objectName = `${config.environment}/${permanent ? '' : 'temp/'}${path || 'nopath'}${`/${dayjs().format('YYYYMM')}/${uuidv4()}.${fileType}`}`
    const res = await this.s3Service.uploadFile(
      objectName,
      buffer,
      `application/${fileType}`,
    )

    return res.key
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
}
