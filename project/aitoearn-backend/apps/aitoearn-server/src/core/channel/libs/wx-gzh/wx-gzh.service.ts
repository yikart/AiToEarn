/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: WxGzh
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { WechatApiResponse, WxGzhArticleNews, WxGzhArticleNewsPic } from './common'
import { WxGZHError } from './wx-gzh.exception'

@Injectable()
export class WxGzhApiService {
  /**
   * 上传临时素材
   * @param accessToken
   * @param media
   * @param type
   * @returns
   */
  private readonly logger = new Logger(WxGzhApiService.name)

  private async request<T>(
    url: string,
    config: AxiosRequestConfig = {},
    options: { operation?: string } = {},
  ): Promise<T> {
    const operation = options.operation || 'wx-gzh request'
    this.logger.debug(`[WXGZH:${operation}] Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`)
    try {
      const response: AxiosResponse<WechatApiResponse<T>> = await axios(url, config)
      if (response.data && response.data.errcode) {
        throw WxGZHError.buildFromResponse(response.data, operation)
      }
      return response.data
    }
    catch (error) {
      const err = WxGZHError.buildFromError(error, options.operation || 'wx-gzh request')
      this.logger.error(
        `[WXGZH:${operation}] Error !! message=${err.message} status=${err.status} rawError=${JSON.stringify(err.rawError)}`,
      )
      throw err
    }
  }

  async uploadTempMedia(
    accessToken: string,
    type: 'image' | 'voice' | 'video' | 'thumb',
    file: Blob,
    fileName: string,
  ) {
    const formData = new FormData()
    formData.append('media', file, fileName)

    const config: AxiosRequestConfig = {
      method: 'POST',
      data: formData,
    }
    return await this.request<{
      type: 'image' | 'voice' | 'video' | 'thumb'
      media_id: string
      created_at: number
    }>(
      `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${type}`,
      config,
      { operation: 'uploadTempMedia' },
    )
  }

  /**
   * 获取临时素材
   * @param accessToken
   * @param mediaId
   * @returns
   */
  async getTempMedia(accessToken: string, mediaId: string) {
    const config: AxiosRequestConfig = {
      method: 'GET',
      params: {
        media_id: mediaId,
      },
    }
    return await this.request<{
      video_url?: string
    }>(
      `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`,
      config,
      { operation: 'getTempMedia' },
    )
  }

  /**
   * 上传图文中的图片素材(不占用限制)
   * @param accessToken
   * @param file
   * @returns
   */
  async uploadImg(accessToken: string, file: Blob, fileName: string) {
    const formData = new FormData()
    formData.append('media', file, fileName)

    const config: AxiosRequestConfig = {
      method: 'POST',
      data: formData,
    }
    return await this.request<{ url: string }>(
      `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`,
      config,
      { operation: 'uploadImg' },
    )
  }

  /**
   * 上传永久素材
   * @param accessToken
   * @param type
   * @param file
   * @returns
   */
  async addMaterial(
    accessToken: string,
    type: 'image' | 'voice' | 'video' | 'thumb',
    file: Blob,
    fileName: string,
    videoOptions?: {
      title: string
      introduction?: string
    },
  ) {
    const formData = new FormData()
    formData.append('media', file, fileName)

    if (type === 'video')
      formData.append('description', JSON.stringify(videoOptions))

    const config: AxiosRequestConfig = {
      method: 'POST',
      data: formData,
    }
    return await this.request<{
      media_id: string
      url: string
      errcode?: number
      errmsg?: string
    }>(
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=${type}`,
      config,
      { operation: 'addMaterial' },
    )
  }

  /**
   * 获取永久素材
   * @param accessToken
   * @param mediaId
   * @returns
   */
  async getMaterial(accessToken: string, mediaId: string) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { media_id: mediaId },
    }
    return await this.request<{
      news_item: {
        title: string
        thumb_media_id: string
        show_cover_pic: string
        author: string
        digest: string
        content: string
        url: string
        content_source_url: string
      }[] | {
        title: string
        description: string
        down_url: string
      }
    }>(
      `https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=${accessToken}`,
      config,
      { operation: 'getMaterial' },
    )
  }

  /**
   * 新建草稿
   * @param accessToken
   * @param data
   * @returns
   */
  async draftAdd(
    accessToken: string,
    data: WxGzhArticleNews | WxGzhArticleNewsPic,
  ) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { articles: [data] },
    }
    return await this.request<{
      media_id: string
    }>(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
      config,
      { operation: 'draftAdd' },
    )
  }

  /**
   * 发布
   * @param accessToken
   * @param mediaId
   * @returns
   */
  async freePublish(accessToken: string, mediaId: string) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { media_id: mediaId },
    }
    return await this.request<{
      publish_id: string
      msg_data_id: string
    }>(
      `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`,
      config,
      { operation: 'freePublish' },
    )
  }

  // --------  留言管理  -----
  /**
   * 回复评论
   * @param accessToken
   * @param msgDataId 消息ID
   * @param userCommentId 用户评论ID
   * @param content 评论内容
   * @returns
   */
  async listComment(
    accessToken: string,
    msgDataId: string,
    begin: number,
    count: number, // <=50
  ) {
    count = Math.min(count, 50)
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        msg_data_id: msgDataId,
        index: 0,
        begin,
        count,
      },
    }
    return await this.request<{
      comment: {
        user_comment_id: string
        openid: string
        create_time: string
        content: string
        comment_type: number
        reply: {
          content: string
          create_time: string
        }
      }[]
      total: number
    }>(
      `https://api.weixin.qq.com/cgi-bin/comment/list?access_token=${accessToken}`,
      config,
      { operation: 'listComment' },
    )
  }

  /**
   * 回复评论
   * @param accessToken
   * @param msgDataId 消息ID
   * @param userCommentId 用户评论ID
   * @param content 评论内容
   * @returns
   */
  async replycomment(
    accessToken: string,
    msgDataId: string,
    userCommentId: string,
    content: string,
  ) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        msg_data_id: msgDataId,
        index: 0,
        user_comment_id: userCommentId,
        content,
      },
    }
    return await this.request(
      `https://api.weixin.qq.com/cgi-bin/comment/reply/add?access_token=${accessToken}`,
      config,
      { operation: 'replycomment' },
    )
  }

  // -------- datacube 统计数据 -----
  /**
   * 获取用户增减数据
   * @param accessToken
   * @param beginDate yyyy-MM-dd
   * @param endDate yyyy-MM-dd 结束日期(最大跨度7天)
   * @returns
   */
  async getusersummary(
    accessToken: string,
    beginDate: string,
    endDate: string,
  ) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        begin_date: beginDate,
        end_date: endDate,
      },
    }
    return await this.request<{
      list: {
        ref_date: string
        user_source: number
        new_user: number
        cancel_user: number
      }[]
    }>(
      `https://api.weixin.qq.com/datacube/getusersummary?access_token=${accessToken}`,
      config,
      { operation: 'getusersummary' },
    )
  }

  /**
   * 获取累计用户数据
   * @param accessToken
   * @param beginDate yyyy-MM-dd
   * @param endDate yyyy-MM-dd 结束日期(最大跨度7天)
   * @returns
   */
  async getusercumulate(
    accessToken: string,
    beginDate: string,
    endDate: string,
  ) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        begin_date: beginDate,
        end_date: endDate,
      },
    }
    return await this.request<{
      list: {
        ref_date: string // '2014-12-07';
        cumulate_user: number // 0;
      }[]
    }>(
      `https://api.weixin.qq.com/datacube/getusercumulate?access_token=${accessToken}`,
      config,
      { operation: 'getusercumulate' },
    )
  }

  /**
   * 获取图文阅读概况数据
   * @param accessToken
   * @param beginDate yyyy-MM-dd
   * @param endDate yyyy-MM-dd 结束日期(最大值为昨日)
   * @returns
   */
  async getuserread(
    accessToken: string,
    beginDate: string,
    endDate: string,
  ) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        begin_date: beginDate,
        end_date: endDate,
      },
    }
    return await this.request<{
      list: {
        ref_date: string
        user_source: number
        int_page_read_count: number
        share_count: number
        add_to_fav_count: number
      }[]
    }>(
      `https://api.weixin.qq.com/datacube/getuserread?access_token=${accessToken}`,
      config,
      { operation: 'getuserread' },
    )
  }

  async deleteArticle(
    accessToken: string,
    article_id: string,
  ) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        article_id,
      },
    }
    return await this.request(
      `https://api.weixin.qq.com/cgi-bin/freepublish/delete?access_token=${accessToken}`,
      config,
      { operation: 'deleteArticle' },
    )
  }
}
