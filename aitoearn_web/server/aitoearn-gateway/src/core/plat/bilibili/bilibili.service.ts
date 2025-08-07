import { Injectable } from '@nestjs/common'
import { PlatBilibiliNatsApi } from 'src/transports/channel/bilibili.natsApi'

@Injectable()
export class BilibiliService {
  constructor(private readonly platBilibiliNatsApi: PlatBilibiliNatsApi) {}

  /**
   * 检查登陆状态是否过期
   * @param accountId
   * @param file File
   * @returns
   */
  async checkAccountAuthStatus(accountId: string) {
    const res = await this.platBilibiliNatsApi.getAccountAuthInfo(accountId)
    return res
  }

  /**
   * 上传视频分片
   * @param accountId
   * @param file File
   * @param uploadToken 上传Token
   * @param partNumber 分片索引
   * @returns
   */
  async uploadVideoPart(
    accountId: string,
    file: Express.Multer.File,
    uploadToken: string,
    partNumber: number,
  ) {
    // file转换为base64
    const { buffer } = file
    const base64 = buffer.toString('base64')

    const res = await this.platBilibiliNatsApi.uploadVideoPart(
      accountId,
      base64,
      uploadToken,
      partNumber,
    )
    return res
  }

  /**
   * 视频分片合并
   * @param accountId
   * @param uploadToken 上传Token
   * @returns
   */
  async videoComplete(accountId: string, uploadToken: string) {
    const res = await this.platBilibiliNatsApi.videoComplete(
      accountId,
      uploadToken,
    )

    return res
  }

  /**
   * 上传封面
   * @param accountId
   * @param file File
   * @returns
   */
  async coverUpload(accountId: string, file: Express.Multer.File) {
    // file转换为base64
    const { buffer } = file
    const base64 = buffer.toString('base64')

    const res = await this.platBilibiliNatsApi.coverUpload(accountId, base64)
    return res
  }

  /**
   * 上传小视频
   * @param accountId
   * @param file File
   * @param uploadToken 上传Token
   * @returns
   */
  async uploadLitVideo(
    accountId: string,
    file: Express.Multer.File,
    uploadToken: string,
  ) {
    // file转换为base64
    const { buffer } = file
    const base64 = buffer.toString('base64')

    const res = await this.platBilibiliNatsApi.uploadLitVideo(
      accountId,
      base64,
      uploadToken,
    )

    return res
  }
  /**
   * 封面上传
   * @param accessToken
   * @param file
   * @returns
   */
  // async coverUpload(
  //   userId: string,
  //   file: Express.Multer.File,
  // ): Promise<string> {
  //   const url = `https://member.bilibili.com/arcopen/fn/archive/cover/upload`;

  //   const formData = new FormData();
  //   const blob = new Blob([file.buffer], { type: file.mimetype });
  //   formData.append('file', blob, file.originalname);

  //   const result = await axios.post<{
  //     code: number; // 0;
  //     message: string; // '0';
  //     ttl: number; // 1;
  //     request_id: string; // '7b753a287405461f5afa526a1f672094';
  //     data: {
  //       url: string; // "https://archive.biliimg.com/bfs/..."
  //     };
  //   }>(url, formData, {
  //     headers: await this.platBilibiliNatsApi.getHeader(userId, false),
  //   });
  //   return result.data.data.url;
  // }
}
