import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { PubType, PubStatus, PubRecord } from 'src/db/schema/pubRecord.schema'

import { TwitterAuthService } from './twitter.auth.service';

// Twitter API V2基础URL
const TWITTER_API_V2_URL = 'https://api.twitter.com/2';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly twitterAuthService: TwitterAuthService,
    @InjectModel(PubRecord.name)
    private readonly PubRecordModel: Model<PubRecord>,

  ) {}


  /**
   * 获取用户的Twitter时间线
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param maxResults 最大结果数
   * @returns Twitter时间线数据
   */
  async getUserTimeline(accessToken: string, userId: string, accountId: string, maxResults: number = 10) {
    try {
      // 确保maxResults是一个有效的整数
      const validMaxResults = Number(maxResults);

      // 调用Twitter API获取时间线
      const url = `${TWITTER_API_V2_URL}/users/${accountId}/tweets`;
      // console.log("timeline url:", url);
      const params = {
        'max_results': isNaN(validMaxResults) ? 10 : validMaxResults, // 如果是NaN则使用默认值10
        'tweet.fields': 'created_at,public_metrics,text,source',
        'expansions': 'attachments.media_keys',
        'media.fields': 'url,preview_image_url,type'
      };
      console.log("请求参数:", params);
      // console.log("accessToken:", accessToken);
      const response = await lastValueFrom(
        this.httpService.get(url, {
          params,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );
      console.log("==============response============");
      console.log(response);
      return response.data
    } catch (error) {
      console.error('完整错误对象:', JSON.stringify(error.response?.data || error.message));

      this.logger.error(`获取Twitter时间线失败: ${error.message}`, error.stack);
      throw new BadRequestException(`获取Twitter时间线失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 发布新推文
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param text 推文内容
   * @param mediaIds 媒体ID数组
   * @returns 发布结果
   */
  async createTweet(accessToken: string, userId: string, accountId: string, text: string, mediaIds?: string[]) {
    // 获取当前最大的 id
    const maxRecord = await this.PubRecordModel.findOne().sort({ id: -1 });
    const newId = maxRecord ? maxRecord.id + 1 : 1;

    try {


      const url = `${TWITTER_API_V2_URL}/tweets`;
      const payload: any = { text };

      // 如果有媒体附件，添加媒体信息
      if (mediaIds && mediaIds.length > 0) {
        payload.media = {
          media_ids: mediaIds
        };
      }

      // 创建发布记录
      let newData: any = {
        userId: userId,
        type: PubType.ARTICLE,
        title: text,
        desc: text,
        accountId: accountId,
        status:PubStatus.UNPUBLISH,
        // timingTime: publishAt,
        publishTime: new Date()
      }

      // if (publishAt) {
      //   requestBody.status.publishAt = publishAt;  // 如果提供了 publishAt 则使用 publishAt
      // }

      // console.log(requestBody);

      await this.PubRecordModel.create({
        ...newData,
        id: newId,
      });

      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      this.logger.log(`成功发布推文: userId=${userId}, accountId=${accountId}`);

      // 更新发布记录
      await this.PubRecordModel.updateOne({ id:newId }, {
        status: PubStatus.RELEASED,
        publishTime: new Date()
        });

      return response.data.data
    } catch (error) {
      await this.PubRecordModel.updateOne({ id:newId }, { status: PubStatus.FAIL });
      this.logger.error(`发布推文失败: ${error.message}`, error.stack);
      throw new BadRequestException(`发布推文失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 上传媒体文件
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param mediaFile 媒体文件Buffer
   * @param mimeType 媒体类型
   * @returns 媒体上传结果
   */
  async uploadMedia(accessToken, userId: string, accountId: string, mediaFile: Buffer, mimeType: string) {
    try {


      // Twitter有单独的媒体上传API
      const url = 'https://upload.twitter.com/1.1/media/upload.json';

      // 创建表单数据
      const formData = new FormData();
      formData.append('media', new Blob([mediaFile], { type: mimeType }));

      const response = await lastValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      this.logger.log(`媒体上传成功: userId=${userId}, accountId=${accountId}`);

      return response.data
    } catch (error) {
      this.logger.error(`上传媒体失败: ${error.message}`, error.stack);
      throw new BadRequestException(`上传媒体失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 删除推文
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param tweetId 推文ID
   * @returns 删除结果
   */
  async deleteTweet(accessToken, userId: string, accountId: string, tweetId: string) {
    try {

      const url = `${TWITTER_API_V2_URL}/tweets/${tweetId}`;

      await lastValueFrom(
        this.httpService.delete(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      this.logger.log(`成功删除推文: tweetId=${tweetId}, accountId=${accountId}`);

      return true
    } catch (error) {
      this.logger.error(`删除推文失败: ${error.message}`, error.stack);
      throw new BadRequestException(`删除推文失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 获取推文详情
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param tweetId 推文ID
   * @returns 推文详情
   */
  async getTweetDetail(accessToken, userId: string, accountId: string, tweetId: string) {
    try {

      const url = `${TWITTER_API_V2_URL}/tweets/${tweetId}`;
      const params = {
        'tweet.fields': 'created_at,public_metrics,text,source',
        'expansions': 'attachments.media_keys,author_id',
        'media.fields': 'url,preview_image_url,type'
      };

      const response = await lastValueFrom(
        this.httpService.get(url, {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return response.data.data
    } catch (error) {
      this.logger.error(`获取推文详情失败: ${error.message}`, error.stack);
      throw new BadRequestException(`获取推文详情失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 获取推文的统计数据
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param tweetId 推文ID
   * @returns 推文统计数据
   */
  async getTweetMetrics(accessToken, userId: string, accountId: string, tweetId: string) {
    try {

      const url = `${TWITTER_API_V2_URL}/tweets/${tweetId}`;
      const params = {
        'tweet.fields': 'public_metrics,non_public_metrics,organic_metrics', // 注意：某些指标需要高级API访问权限
      };

      const response = await lastValueFrom(
        this.httpService.get(url, {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`获取推文统计数据失败: ${error.message}`, error.stack);
      throw new BadRequestException(`获取推文统计数据失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 查找用户的推文
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param query 查询内容
   * @param maxResults 最大结果数
   * @returns 搜索结果
   */
  async searchTweets(accessToken, userId: string, accountId: string, query: string, maxResults: number = 10) {
    try {
      // 确保maxResults是一个有效的整数
      const validMaxResults = Number(maxResults);

      const url = `${TWITTER_API_V2_URL}/tweets/search/recent`;
      const params = {
        'query': `from:${accountId} ${query}`,
        'max_results': isNaN(validMaxResults) ? 10 : validMaxResults, // 如果是NaN则使用默认值10
        'tweet.fields': 'created_at,public_metrics,text',
        'expansions': 'attachments.media_keys',
        'media.fields': 'url,preview_image_url,type'
      };

      const response = await lastValueFrom(
        this.httpService.get(url, {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`搜索推文失败: ${error.message}`, error.stack);
      throw new BadRequestException(`搜索推文失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 对推文点赞
   * @param accessToken 访问令牌
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param tweetId 推文ID
   * @returns 点赞结果
   */
  async likeTweet(accessToken: string, userId: string, accountId: string, tweetId: string) {
    try {
      // Twitter API V2 点赞端点
      const url = `${TWITTER_API_V2_URL}/users/${accountId}/likes`;
      const data = {
        tweet_id: tweetId
      };

      const response = await lastValueFrom(
        this.httpService.post(url, data, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      );

      this.logger.log(`成功点赞推文: userId=${userId}, accountId=${accountId}, tweetId=${tweetId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`点赞推文失败: ${error.message}`, error.stack);
      throw new BadRequestException(`点赞推文失败: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * 取消对推文的点赞
   * @param accessToken 访问令牌
   * @param userId 用户ID
   * @param accountId Twitter账号ID
   * @param tweetId 推文ID
   * @returns 取消点赞结果
   */
  async unlikeTweet(accessToken: string, userId: string, accountId: string, tweetId: string) {
    try {
      // Twitter API V2 取消点赞端点
      const url = `${TWITTER_API_V2_URL}/users/${accountId}/likes/${tweetId}`;

      const response = await lastValueFrom(
        this.httpService.delete(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      this.logger.log(`成功取消点赞推文: userId=${userId}, accountId=${accountId}, tweetId=${tweetId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`取消点赞推文失败: ${error.message}`, error.stack);
      throw new BadRequestException(`取消点赞推文失败: ${error.response?.data?.error || error.message}`);
    }
  }

}
