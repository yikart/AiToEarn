import { URL } from 'node:url'
import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import * as natural from 'natural'

@Injectable()
export class AdminUtilService {
  private readonly logger = new Logger(AdminUtilService.name)

  constructor() { }

  /**
   * 小红书内容相似度检测
   * @param content 内容
   * @param articleUrl 文章链接
   * @returns
   */
  async articleXhsContentCheck(
    content: string,
    articleUrl: string,
  ): Promise<{
    status: 1 | 0
    extent: number
  }> {
    try {
      // 解析URL
      // https://www.xiaohongshu.com/explore/68063228000000001202f814?xsec_token=AB1nbuHhtoNuSMgYHIwZMaZqY1eo-IsGJkdrW04BZHKZQ=&xsec_source=pc_feed

      const inUrl = new URL(articleUrl)
      const xsecToken = inUrl.searchParams.get('xsec_token')
      const noteId = inUrl.pathname.split('/').pop()

      const body = {
        note_id: noteId,
        xsec_token: xsecToken,
      }

      const response = await axios.post<{
        code: number // 200
        msg: string
        data: {
          xsec_token: string
          title: string
          desc: string
        }
      }>(`https://platapi.yikart.cn/api/xhs/note_detail_v2`, body)
      let { desc } = response.data.data

      // desc 根据"[话题]"分割取出第一个
      const descArr = desc.split('[话题]')
      if (descArr.length > 1)
        desc = descArr[0]
      const res: number = natural.JaroWinklerDistance(content, desc)
      return {
        status: 1,
        extent: res,
      }
    }
    catch (error) {
      this.logger.error('------- 小红书内容相似度检测失败 -------', error)
      return {
        status: 0,
        extent: 0,
      }
    }
  }
}
