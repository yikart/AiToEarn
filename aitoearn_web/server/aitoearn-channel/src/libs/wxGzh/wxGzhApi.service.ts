/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: WxGzh
 */
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { WxGzhArticleNews, WxGzhArticleNewsPic } from './common';

@Injectable()
export class WxGzhApiService {
  /**
   * 上传临时素材
   * @param accessToken
   * @param media
   * @param type
   * @returns
   */
  async uploadTempMedia(
    accessToken: string,
    type: 'image' | 'voice' | 'video' | 'thumb',
    file: Blob,
    fileName: string,
  ) {
    try {
      const formData = new FormData();
      formData.append('media', file, fileName);

      const result = await axios.post<{
        type: 'image' | 'voice' | 'video' | 'thumb'; // 'TYPE';
        media_id: string; // 'MEDIA_ID';
        created_at: number; // 123456789;
      }>(
        `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${type}`,
        formData,
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during component_access_token:', error);
      return null;
    }
  }

  /**
   * 获取临时素材
   * @param accessToken
   * @param mediaId
   * @returns
   */
  async getTempMedia(accessToken: string, mediaId: string) {
    try {
      const result = await axios.get<{
        video_url?: string; // url;
        errcode?: number; // 40007;
        errmsg?: string; // 'invalid media_id';
      }>(
        `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`,
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during component_access_token:', error);
      return null;
    }
  }

  /**
   * 上传图文中的图片素材(不占用限制)
   * @param accessToken
   * @param file
   * @returns
   */
  async uploadImg(accessToken: string, file: Blob, fileName: string) {
    try {
      const formData = new FormData();
      formData.append('media', file, fileName);

      const result = await axios.post<{
        url: string; // url;
      }>(
        `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`,
        formData,
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during component_access_token:', error);
      return null;
    }
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
      title: string;
      introduction?: string;
    },
  ) {
    try {
      const formData = new FormData();
      formData.append('media', file, fileName);

      // 如果是视频，则添加 description 参数
      if (type === 'video')
        formData.append('description', JSON.stringify(videoOptions));

      const result = await axios.post<{
        media_id: string; // 'MEDIA_ID';
        url: string; // 123456789;
        errcode?: number; // 40007;
        errmsg?: string; // 'invalid media_id';
      }>(
        `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=${type}`,
        formData,
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during component_access_token:', error);
      return null;
    }
  }

  /**
   * 获取永久素材
   * @param accessToken
   * @param mediaId
   * @returns
   */
  async getMaterial(accessToken: string, mediaId: string) {
    try {
      const result = await axios.post<
        | {
          news_item: {
            title: string; // 'TITLE';
            thumb_media_id: string; // 'THUMB_MEDIA_ID';
            show_cover_pic: string; // 'SHOW_COVER_PIC';
            author: string; // 'AUTHOR';
            digest: string; // 'DIGEST';
            content: string; // 'CONTENT';
            url: string; // 'URL';
            content_source_url: string; // 'CONTENT_SOURCE_URL';
          }[];
        }
        | {
          title: string; // TITLE;
          description: string; // DESCRIPTION;
          down_url: string; // DOWN_URL;
        }
        | {
          errcode: number; // 40007;
          errmsg: string; // 'invalid media_id';
        }
      >(
        `https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=${accessToken}`,
        { media_id: mediaId },
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during component_access_token:', error);
      return null;
    }
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
    try {
      const result = await axios.post<{
        media_id: string; // MEDIA_ID
        errcode?: number; // 40007;
        errmsg?: string; // 'invalid media_id';
      }>(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
        data,
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during component_access_token:', error);
      return {
        media_id: '',
        errcode: 1,
        errmsg: '新建草稿请求出错',
      };
    }
  }

  /**
   * 发布
   * @param accessToken
   * @param mediaId
   * @returns
   */
  async freePublish(accessToken: string, mediaId: string) {
    try {
      const result = await axios.post<{
        errcode: number; // 40007;
        errmsg: string; // 'invalid media_id';
        publish_id: string; // '100000001';
        msg_data_id: string;
      }>(
        `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`,
        {
          media_id: mediaId,
        },
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during component_access_token:', error);
      return {
        publish_id: '',
        msg_data_id: '',
        errcode: 1,
        errmsg: '发布请求失败',
      };
    }
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
    if (count > 50)
      count = 50;
    try {
      const result = await axios.post<{
        errmsg?: string; // 'invalid media_id';
        errcode?: number; // 40007;
        comment: {
          user_comment_id: string; // USER_COMMENT_ID,
          openid: string; // openid，用户如果用非微信身份评论，不返回openid
          create_time: string; // CREATE_TIME,
          content: string; // CONTENT,
          comment_type: number;
          reply: {
            content: string; // CONTENT,
            create_time: string; // CREATE_TIME
          }
        }[];
        total: number;
      }>(
        `https://api.weixin.qq.com/cgi-bin/comment/list?access_token=${accessToken}`,
        {
          msg_data_id: msgDataId,
          index: 0,
          begin,
          count,
          type: 0,
        },
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during getusersummary:', error);
      return {
        errcode: 1,
        errmsg: '请求失败',
      };
    }
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
    try {
      const result = await axios.post<{
        errmsg?: string; // 'invalid media_id';
        errcode?: number; // 40007;
      }>(
        `https://api.weixin.qq.com/cgi-bin/comment/reply/add?access_token=${accessToken}`,
        {
          msg_data_id: msgDataId,
          index: 0,
          user_comment_id: userCommentId,
          content,
        },
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during getusersummary:', error);
      return {
        errcode: 1,
        errmsg: '请求失败',
      };
    }
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
    try {
      const result = await axios.post<{
        list:
        {
          ref_date: string // '2014-12-07';
          user_source: number // 0;
          new_user: number // 0;
          cancel_user: number // 0;
        }[];
        errmsg?: string; // 'invalid media_id';
        errcode?: number; // 40007;
      }>(
        `https://api.weixin.qq.com/datacube/getusersummary?access_token=${accessToken}`,
        {
          begin_date: beginDate,
          end_date: endDate,
        },
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during getusersummary:', error);
      return {
        list: [],
        errcode: 1,
        errmsg: '请求失败',
      };
    }
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
    try {
      const result = await axios.post<{
        list:
        {
          ref_date: string // '2014-12-07';
          cumulate_user: number // 0;
        }[];
        errmsg?: string; // 'invalid media_id';
        errcode?: number; // 40007;
      }>(
        `https://api.weixin.qq.com/datacube/getusercumulate?access_token=${accessToken}`,
        {
          begin_date: beginDate,
          end_date: endDate,
        },
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during getusersummary:', error);
      return {
        list: [],
        errcode: 1,
        errmsg: '请求失败',
      };
    }
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
    try {
      const result = await axios.post<{
        list:
        {
          ref_date: string // 数据的日期，需在begin_date和end_date之间;
          user_source: number // 用户从哪里进入来阅读该图文。99999999.全部；0:会话;1.好友;2.朋友圈;4.历史消息页;5.其他;6.看一看;7.搜一搜；
          int_page_read_count: number // 图文页的阅读次数
          share_count: number // 分享的次数
          add_to_fav_count: number // 收藏的次数
        }[];
        errmsg?: string; // 'invalid media_id';
        errcode?: number; // 40007;
      }>(
        `https://api.weixin.qq.com/datacube/getuserread?access_token=${accessToken}`,
        {
          begin_date: beginDate,
          end_date: endDate,
        },
      );

      return result.data;
    }
    catch (error) {
      Logger.log('Error during getusersummary:', error);
      return {
        list: [],
        errcode: 1,
        errmsg: '请求失败',
      };
    }
  }
}
