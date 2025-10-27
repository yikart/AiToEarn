/*
 * @Author: zhangwei
 * @Date: 2025-05-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: zhangwei
 * @Description: youtube
 */
import { Injectable, BadRequestException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const multer = require('multer');
const readline = require('readline');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
import { GoogleService } from '../google/google.service';
import { Readable } from 'stream';
import { Model } from 'mongoose';
import { PubType, PubStatus, PubRecord } from 'src/db/schema/pubRecord.schema'

// 配置 multer 存储设置（内存存储或本地存储）
const storage = multer.memoryStorage();  // 存储在内存中
const upload = multer({ storage: storage });

@Injectable()
export class YoutubeService {
  private youtubeService = google.youtube('v3');

  constructor(
    private oauth2Service: GoogleService,
    @InjectModel(PubRecord.name)
    private readonly PubRecordModel: Model<PubRecord>,

    ) {}

  /**
   * 获取频道列表
   * @param userId 用户ID
   * @param handle 频道handle
   * @param userName 用户名
   * @param id 频道ID
   * @param mine 是否查询自己的频道
   * @returns 频道列表
   */
  async getChannelsList(accessToken, handle, userName, id, mine) {
    // 根据传入的参数来选择一个有效的请求参数
    let requestParams: any = {
      access_token: accessToken,  // 使用授权的 access token
      part: 'contentOwnerDetails, snippet, contentDetails, statistics, status, topicDetails',
    };

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id;  // 如果提供了 id, 使用 id
    } else if (handle) {
      requestParams.forHandle = handle;  // 如果提供了 handle, 使用 handle
    } else if (userName) {
      requestParams.forUsername = userName;  // 如果提供了 userName, 使用 userName
    } else if (mine !== undefined) {
      // 如果 mine 被传递且是布尔值, 可以检查是否为 `true`
      if (mine) {
        requestParams.mine = true;  // 请求当前登录用户的频道
      }
    }

    try {
      const response = await this.youtubeService.channels.list(requestParams);

      const channels = response.data;
      console.log(channels);
      if (channels.length === 0) {
        console.log('No channel found.');
        return [];
      } else {
        console.log(`This channel's ID is ${channels}`);
        return channels;
      }
    } catch (err) {
      console.log('The API returned an error: ' + err);
      return err;
    }
  }

  /**
   * 更新频道
   * @param accessToken
   * @param ChannelId 频道ID
   * @param brandingSettings 品牌设置
   * @param status 状态
   * @returns 更新结果
   */
  async updateChannels(accessToken, ChannelId, brandingSettings, status) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody: any = {
        id: ChannelId,
        // snippet: {
        //   playlistId: playlistId,
        //   resourceId: resourceId,
        // },
        // contentDetails: {},
      };

      // 如果传递了 note，则添加到请求体
      if (brandingSettings !== undefined) {
        requestBody.brandingSettings = brandingSettings;
      }
      if (status !== undefined) {
        requestBody.status = status;
      }

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.channelSections.update(
        {
          auth: oauth2Client,
          part: 'brandingSettings',
          requestBody
        }
      );

      // 返回上传的视频 ID
      if (response.data) {
        console.log('Channels update successfully:', response.data);
        return response.data;
      } else {
        return 'Channels updated failed';
      }
    } catch (error) {
      console.error('Error Channels update:', error);
      return error;
    }

  }

  /**
   * 获取频道板块列表
   * @param accessToken
   * @param channelId 频道ID
   * @param id 板块ID
   * @param mine 是否查询自己的板块
   * @param maxResults 最大结果数
   * @param pageToken 分页令牌
   * @returns 频道板块列表
   */
  async getChannelSectionsList(accessToken, channelId, id, mine, maxResults, pageToken) {
    // 根据传入的参数来选择一个有效的请求参数
    let requestParams: any = {
      access_token: accessToken,  // 使用授权的 access token
      part: 'contentDetails, id, snippet',
    };

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id;  // 如果提供了 id, 使用 id
    } else if (channelId) {
      requestParams.channelId = channelId;  // 如果提供了 handle, 使用 handle
    } else if (mine !== undefined) {
      // 如果 mine 被传递且是布尔值, 可以检查是否为 `true`
      if (mine) {
        requestParams.mine = true;  // 请求当前登录用户的频道
      }
    } else if (maxResults) {
      requestParams.maxResults = maxResults;  // 如果提供了 handle, 使用 handle
    } else if (pageToken) {
      requestParams.pageToken = pageToken;  // 如果提供了 handle, 使用 handle
    }

    try {
      const response = await this.youtubeService.channelSections.list(requestParams);
      const sections = response.data;
      console.log(sections);
      if (sections.length === 0) {
        console.log('No sections found.');
        return [];
      } else {
        console.log(`This sections's ID is ${sections}.`);
        return sections;
      }
    } catch (err) {
      console.log('The API returned an error: ' + err);
      return err;
    }
  }

  /**
 * 创建频道板块。
 *
   * @param snippet 元数据
   * @param contentDetails 内容详情
   * @returns 创建结果
 */
  async insertChannelSection(accessToken, snippet, contentDetails) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody = {
        snippet: snippet,
        contentDetails: contentDetails,
      };

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.channelSections.insert(
        {
          auth: oauth2Client,
          part: 'snippet,id, contentDetails',
          requestBody
        }
      );
      // 返回上传的视频 ID
      if (response.data) {
        console.log('Channel Section insert successfully:', response.data);
        return response.data;
      } else {
        return 'Channel Section insert failed';
      }
    } catch (error) {
      console.error('Error Channel Section insert:', error);
      return error;
    }
  }

  /**
 * 更新频道板块。
  * @param snippet 元数据
  * @param contentDetails 内容详情
  * @returns 创建结果
 */
  async updateChannelSection(accessToken, snippet, contentDetails) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody = {
        snippet: snippet,
        contentDetails: contentDetails,
      };

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.channelSections.update(
        {
          auth: oauth2Client,
          part: 'snippet,id, contentDetails',
          requestBody
        }
      );
      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }
  }

  /**
 * 删除频道板块
 *  @param channelSectionId 频道板块ID
* @returns 删除结果
 */
  async deleteChannelsSections(accessToken, channelSectionId) {
    // 设置 OAuth2 客户端凭证
    this.oauth2Service.setCredentials(accessToken);
    const oauth2Client = this.oauth2Service.getClient();

    try {
      const response = await this.youtubeService.channelSections.delete({
        auth: oauth2Client,
        id: channelSectionId,
      });
      console.log('Video deleted:', response.data);
    } catch (error) {
      console.error('Error deleting video:', error);
      return error
    }
  }

  /**
 * 获取频道板块列表。
 *   @param parentId 父评论ID
   * @param id 评论ID
   * @param maxResults 最大结果数
   * @param pageToken 分页令牌
   * @returns 评论列表
 */
  async getCommentsList(accessToken, parentId, id, maxResults, pageToken) {
    // 根据传入的参数来选择一个有效的请求参数
    let requestParams: any = {
      access_token: accessToken,  // 使用授权的 access token
      part: 'id, snippet',
    };

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id;  // 如果提供了 id, 使用 id
    } else if (parentId) {
      requestParams.channelId = parentId;  // 如果提供了 handle, 使用 handle
    } else if (maxResults) {
      requestParams.maxResults = maxResults;  // 如果提供了 handle, 使用 handle
    } else if (pageToken) {
      requestParams.pageToken = pageToken;  // 如果提供了 handle, 使用 handle
    }

    try {
      const response = await this.youtubeService.comments.list(requestParams);
      const sections = response.data;
      console.log(sections);
      if (sections.length === 0) {
        console.log('No sections found.');
        return [];
      } else {
        console.log(`This sections's ID is ${sections}.`);
        return sections;
      }
    } catch (err) {
      console.log('The API returned an error: ' + err);
      return err;
    }
  }

  /**
 * 创建对现有评论的回复
    * @param snippet 元数据
   * @returns 创建结果
 */
  async insertComment(accessToken, snippet) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody = {
        snippet: snippet
      };

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.comments.insert(
        {
          auth: oauth2Client,
          part: 'snippet,id',
          requestBody
        }
      );
      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }
  }

  /**
 * 更新评论。
    * @param snippet 元数据
   * @returns 创建结果
 */
  async updateComments(accessToken, snippet) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody = {
        snippet: snippet
      };

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.comments.update(
        {
          auth: oauth2Client,
          part: 'snippet,id',
          requestBody
        }
      );
      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }
  }

  /**
 * 设置一条或多条评论的审核状态。
   * @param id 评论ID
   * @param moderationStatus 审核状态
   * @param banAuthor 是否禁止作者
   * @returns 设置结果
 */
    async setModerationStatusComments(accessToken, id, moderationStatus, banAuthor) {
      try {
        // 设置 OAuth2 客户端凭证
        this.oauth2Service.setCredentials(accessToken);
        const oauth2Client = this.oauth2Service.getClient();

        // 构造请求体
        const requestBody = {
          id: id,
          moderationStatus:moderationStatus,  // heldForReview 等待管理员审核   published - 清除要公开显示的评论。 rejected - 不显示该评论
          banAuthor: banAuthor  // 自动拒绝评论作者撰写的任何其他评论 将作者加入黑名单
        };

        console.log(requestBody);

        // 调用 YouTube API 上传视频
        const response = await this.youtubeService.comments.setModerationStatus(
          {
            auth: oauth2Client,
            part: 'snippet,id',
            requestBody
          }
        );
        // 返回上传的视频 ID
        if (response.data) {
          console.log('Playlist insert successfully:', response.data);
          return response.data;
        } else {
          return 'Video upload failed';
        }
      } catch (error) {
        console.error('Error uploading video:', error);
        return error;
      }
    }

  /**
 * 删除评论
   * @param id 评论ID
   * @returns 删除结果
 */
  async deleteComments(accessToken, id) {
    // 设置 OAuth2 客户端凭证
    this.oauth2Service.setCredentials(accessToken);
    const oauth2Client = this.oauth2Service.getClient();

    try {
      const response = await this.youtubeService.comments.delete({
        auth: oauth2Client,
        id: id,
      });
      console.log('Video deleted:', response.data);
    } catch (error) {
      console.error('Error deleting video:', error);
      return error
    }
  }


  /**
 * 获取评论会话列表。
 */
  async getCommentThreadsList(accessToken, allThreadsRelatedToChannelId, id, videoId, maxResults, pageToken, order, searchTerms) {
    // 根据传入的参数来选择一个有效的请求参数
    let requestParams: any = {
      access_token: accessToken,  // 使用授权的 access token
      part: 'id, snippet',
    };

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id;  // 如果提供了 id, 使用 id
    } else if (allThreadsRelatedToChannelId) {
      requestParams.allThreadsRelatedToChannelId = allThreadsRelatedToChannelId;  // 如果提供了 handle, 使用 handle
    } else if (maxResults) {
      requestParams.maxResults = maxResults;  // 如果提供了 handle, 使用 handle
    } else if (pageToken) {
      requestParams.pageToken = pageToken;  // 如果提供了 handle, 使用 handle
    }
    else if (videoId) {
      requestParams.videoId = videoId;  // 如果提供了 handle, 使用 handle
    }
    else if (order) {
      requestParams.order = order;  // 如果提供了 handle, 使用 handle
    }
    else if (searchTerms) {
      requestParams.searchTerms = searchTerms;  // 如果提供了 handle, 使用 handle
    }

    try {
      const response = await this.youtubeService.commentThreads.list(requestParams);
      const sections = response.data;
      console.log(sections);
      if (sections.length === 0) {
        console.log('No sections found.');
        return [];
      } else {
        console.log(`This sections's ID is ${sections}.`);
        return sections;
      }
    } catch (err) {
      console.log('The API returned an error: ' + err);
      return err;
    }
  }


  /**
 * 创建顶级评论
 */
  async insertCommentThreads(accessToken, snippet) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody = {
        snippet: snippet
      };

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.commentThreads.insert(
        {
          auth: oauth2Client,
          part: 'snippet,id',
          requestBody
        }
      );
      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }
  }

  /**
   * 获取视频类别列表。
   */
  async getVideoCategoriesList(accessToken, id, regionCode) {

    // 根据传入的参数来选择一个有效的请求参数
    let requestParams: any = {
      access_token: accessToken,  // 使用授权的 access token
      part: 'snippet',
    };

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id;  // 如果提供了 id, 使用 id
    } else if (regionCode) {
      requestParams.regionCode = regionCode;  // 如果提供了 handle, 使用 handle
    }

    try {
      const response = await this.youtubeService.videoCategories.list(requestParams);

      const categories = response.data;
      console.log(categories);
      if (categories.length === 0) {
        console.log('No categories found.');
        return [];
      } else {
        console.log(`This categories's ID is ${categories}.`);
        return categories;
      }
    } catch (err) {
      console.log('The API returned an error: ' + err);
      return err;
    }
  }

  /**
 * 获取视频列表。
   * @param id 视频ID
   * @param chart 图表类型
   * @param maxResults 最大结果数
   * @param pageToken 分页令牌
   * @returns 视频列表
 */
  async getVideosList(accessToken, id, myRating, maxResults, pageToken) {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

    // 根据传入的参数来选择一个有效的请求参数
    let requestParams: any = {
      auth: oauth2Client,
      part: 'snippet,contentDetails,statistics, id, status, topicDetails',
      // id: ids
    };

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id;  // 如果提供了 id, 使用 id
    } else if (myRating !== undefined) {
      // 如果 mine 被传递且是布尔值, 可以检查是否为 `true`
      if (myRating) {
        requestParams.myRating = myRating;  // 请求当前登录用户的频道
      }
    } else if (maxResults) {
      requestParams.maxResults = maxResults;  // 如果提供了 handle, 使用 handle
    } else if (pageToken) {
      requestParams.pageToken = pageToken;  // 如果提供了 handle, 使用 handle
    }

    try {
      const response = await this.youtubeService.videos.list(requestParams);

      const infos = response.data;
      console.log(infos);
      if (infos.length === 0) {
        console.log('No categories found.');
        return [];
      } else {
        console.log(`This infos's ID is ${infos}.`);
        return infos;
      }
    } catch (err) {
      console.log('The API returned an error: ' + err);
      return err;
    }
  }

  /**
 * 上传视频。
    * @param file 视频文件
    * @param accountId 账号ID
   * @param title 标题
   * @param description 描述
   * @param keywords 关键词
   * @param categoryId 分类ID
   * @param privacyStatus 状态（公开？私密）
   * @returns 视频ID
 */
  async uploadVideo(userId, accountId, accessToken, file, title, description, keywords, categoryId, privacyStatus, publishAt) {
    // 获取当前最大的 id
    const maxRecord = await this.PubRecordModel.findOne().sort({ id: -1 });
    const newId = maxRecord ? maxRecord.id + 1 : 1;
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      try {
        const channelInfo = await this.youtubeService.channels.list({
          part: ['snippet'],
          mine: true,
          auth: oauth2Client,
        });

        if (!channelInfo.data.items || channelInfo.data.items.length === 0) {
          throw new Error('未检测到可用的 YouTube 频道，请先创建频道');
        }

        // 可以上传
      } catch (err) {
        if (err.errors?.[0]?.reason === 'youtubeSignupRequired') {
          throw new Error('当前账号未启用 YouTube，请先创建频道');
        }
      }


      // 准备视频的元数据
      const fileStream = Readable.from(file.buffer); // 使用文件的 Buffer 转为可读取流
      const fileSize = file.size;  // 获取文件大小

      // 构造请求体
      let requestBody: any = {
        snippet: {
          title: title,
          description: description,
          // tags: keywords ? keywords.split(',') : [],
          tags: keywords ? keywords : [],
          categoryId: categoryId || '22', // 默认 categoryId 为 '22'，如果没有指定
        },
        status: {
          privacyStatus: privacyStatus,  // 可以是 'public', 'private', 'unlisted'
        },
      };


      // 创建发布记录
      let newData: any = {
        userId: userId,
        type: PubType.VIDEO,
        title: title,
        desc: description,
        accountId: accountId,
        status:PubStatus.UNPUBLISH,
        timingTime: publishAt,
        publishTime: new Date()
      }

      if (publishAt) {
        requestBody.status.publishAt = publishAt;  // 如果提供了 publishAt 则使用 publishAt
      }

      console.log(requestBody);

      await this.PubRecordModel.create({
        ...newData,
        id: newId,
      });

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.videos.insert(
        {
          auth: oauth2Client,
          part: 'snippet,status, id, contentDetails',
          requestBody,
          media: {
            body: fileStream,  // 上传的文件流
          },
        },
        {
          onUploadProgress: (e) => {
            const progress = Math.round((e.bytesRead / fileSize) * 100);
            console.log(`Uploading... ${progress}%`);
          },
        }
      );

    //   const response = {    "data": {
    //     "id": "7RckZHFBu7A"
    // },}
      // 返回上传的视频 ID
      if (response.data.id) {
        console.log('Video uploaded successfully, video ID:', response.data);
        // return { videoId: response.data.id };
        // 更新发布记录
        await this.PubRecordModel.updateOne({ id:newId }, {
          status: PubStatus.RELEASED,
          publishTime: response.data.snippet.publishedAt,
          coverPath: response.data.snippet.thumbnails.url
         });

        return response.data
      } else {
        await this.PubRecordModel.updateOne({ id:newId }, { status: PubStatus.FAIL });
        return 'Video upload failed';
      }
    } catch (error) {
      await this.PubRecordModel.updateOne({ id:newId }, { status: PubStatus.FAIL });
      console.error('Error uploading video:', error);
      return error;
    }

  }

  /**
 * 删除视频
 */
  async deleteVideo(accessToken, videoId) {
    // 设置 OAuth2 客户端凭证
    this.oauth2Service.setCredentials(accessToken);
    const oauth2Client = this.oauth2Service.getClient();

    try {
      const response = await this.youtubeService.videos.delete({
        auth: oauth2Client,
        id: videoId,
      });
      // await this.PubRecordModel.updateOne({ id:videoId }, { status: PubStatus.FAIL });
      console.log('Video deleted:', response.data);
    } catch (error) {
      console.error('Error deleting video:', error);
      return error
    }
  }

  /**
 * 更新视频。
 */
  async updateVideo(accessToken, videoId, snippet, status, recordingDetails) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      const requestBody: any = {
        id: videoId,
        snippet: snippet,
        status: status,
        recordingDetails: recordingDetails
      };
      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.videos.update(
        {
          auth: oauth2Client,
          part: 'snippet,status,id',
          requestBody
        }
      );

      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }

  }


  /**
 * 创建播放列表。
 */
  async insertPlayList(accessToken, snippet, status) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      // const requestBody = {
      //   snippet: {
      //     title: title,
      //     description: description
      //   },
      //   status: {
      //     privacyStatus: privacyStatus,  // 可以是 'public', 'private', 'unlisted'
      //   },
      // };
      const requestBody = {
        snippet: snippet,
        status: status,
      };

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.playlists.insert(
        {
          auth: oauth2Client,
          part: 'snippet,status, id, contentDetails',
          requestBody
        }
      );
      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }
  }

  /**
 * 获取播放列表。
 */
  async getPlayList(accessToken, channelId, playListIds, mine, maxResults, pageToken) {
    // 设置 OAuth2 客户端凭证
    this.oauth2Service.setCredentials(accessToken);
    const oauth2Client = this.oauth2Service.getClient();

  // 根据传入的参数来选择一个有效的请求参数
  let requestParams: any = {
    auth: oauth2Client,
    part: 'snippet,contentDetails, id, status, topicDetails, player',
    // id: ids
  };

    // 根据参数选择 `id` 或 `forUsername`
    if (playListIds) {
      requestParams.ids = playListIds;  // 如果提供了 id, 使用 id
    } else if (channelId) {
      requestParams.channelId = channelId;  // 如果提供了 handle, 使用 handle
    } else if (mine !== undefined) {
      // 如果 mine 被传递且是布尔值, 可以检查是否为 `true`
      if (mine) {
        requestParams.mine = true;  // 请求当前登录用户的频道
      }
    } else if (maxResults) {
      requestParams.maxResults = maxResults;  // 如果提供了 handle, 使用 handle
    }  else if (pageToken) {
      requestParams.pageToken = pageToken;  // 如果提供了 handle, 使用 handle
    }

  try {
    const response = await this.youtubeService.playlist.list(requestParams);

    const infos = response.data;
    console.log(infos);
    if (infos.length === 0) {
      console.log('No categories found.');
      return [];
    } else {
      console.log(`This infos's ID is ${infos}.`);
      return infos;
    }
  } catch (err) {
    console.log('The API returned an error: ' + err);
    return err;
  }
}

  /**
 * 更新播放列表。
 */
  async updatePlayList(accessToken, playListId, snippet, status) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody: any = {
        id: playListId,  // 必填
        snippet: snippet,  // 类型断言
        status: status  // 类型断言
      };

      // 根据参数选择 `title`、`description`、`privacyStatus` 或 `podcastStatus`

      // if (description) {
      //   requestBody.snippet.description = description;  // 如果提供了 id, 使用 id
      // }

      // if (privacyStatus || podcastStatus) {
      //   if (privacyStatus) {
      //     requestBody.status.privacyStatus = privacyStatus;  // 如果提供了 id, 使用 id
      //   }
      //   if (podcastStatus) {
      //     requestBody.status.podcastStatus = podcastStatus;  // 如果提供了 id, 使用 id
      //   }
      // }
      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.playlists.update(
        {
          auth: oauth2Client,
          part: 'snippet,status,id',
          requestBody
        }
      );

      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }

  }

  /**
 * 删除播放列表
 */
  async deletePlaylist(accessToken, playListId) {
    // 设置 OAuth2 客户端凭证
    this.oauth2Service.setCredentials(accessToken);
    const oauth2Client = this.oauth2Service.getClient();

    try {
      const response = await this.youtubeService.playlists.delete({
        auth: oauth2Client,
        id: playListId,
      });
      console.log('Video deleted:', response.data);
    } catch (error) {
      console.error('Error deleting video:', error);
      return error
    }
  }

  /**
 * 将视频添加到播放列表中
 */
  async addVideoToPlaylist(accessToken, videoId, playlistId) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody = {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId,
          },
        }
      };

      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.playlistItems.insert(
        {
          auth: oauth2Client,
          part: 'snippet,status, id, contentDetails',
          requestBody
        }
      );

    //   const response = {    "data": {
    //     "id": "7RckZHFBu7A"
    // },}
      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        throw new Error('Video upload failed');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }

  }


  /**
 * 获取播放列表项。
 */
    async getPlayItemsList(accessToken, playlistId, itemsIds, maxResults, pageToken) {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

    // 根据传入的参数来选择一个有效的请求参数
    let requestParams: any = {
      auth: oauth2Client,
      part: 'snippet, contentDetails, id, status',
      // id: ids
    };

      // 根据参数选择 `id` 或 `forUsername`
      if (itemsIds) {
        requestParams.ids = itemsIds;  // 如果提供了 id, 使用 id
      } else if (playlistId) {
        requestParams.playlistId = playlistId;  // 如果提供了 handle, 使用 handle
      } else if (maxResults) {
        requestParams.maxResults = maxResults;  // 如果提供了 handle, 使用 handle
      } else if (pageToken) {
        requestParams.pageToken = pageToken;  // 如果提供了 handle, 使用 handle
      }

    try {
      const response = await this.youtubeService.playlistItems.list(requestParams);

      const infos = response.data;
      console.log(infos);
      if (infos.length === 0) {
        console.log('No categories found.');
        return [];
      } else {
        console.log(`This infos's ID is ${infos}.`);
        return infos;
      }
    } catch (err) {
      console.log('The API returned an error: ' + err);
      return err;
    }
  }

  /**
 * 插入播放列表项。
 */
  async insertPlayItems(accessToken, snippet, contentDetails) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // // 构造请求体
      // const requestBody: any = {
      //   snippet: {
      //     playlistId: playlistId,
      //     resourceId: resourceId,
      //   },
      //   contentDetails: {},
      // };

      // // 如果传递了 position，则添加到请求体
      // if (position !== undefined) {
      //   requestBody.snippet.position = position;
      // }

      // // 如果传递了 note，则添加到请求体
      // if (note !== undefined) {
      //   requestBody.contentDetails.note = note;
      // }
      const requestBody: any = {
        snippet: snippet,
        contentDetails: contentDetails,
      };
      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.playlistItems.insert(
        {
          auth: oauth2Client,
          part: 'snippet,status, id, contentDetails',
          requestBody
        }
      );

      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }
  }

  /**
 * 更新播放列表项。
 */
  async updatePlayItems(accessToken, playlistItemsId, snippet, contentDetails) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      const requestBody: any = {
        id: playlistItemsId,
        snippet: snippet,
        contentDetails: contentDetails,
      };
      console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeService.playlistItems.update(
        {
          auth: oauth2Client,
          part: 'snippet,status,id',
          requestBody
        }
      );

      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video upload failed';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      return error;
    }

  }

/**
 * 删除播放列表项
 */
  async deletePlayItems(accessToken, playlistItemsId) {
    // 设置 OAuth2 客户端凭证
    this.oauth2Service.setCredentials(accessToken);
    const oauth2Client = this.oauth2Service.getClient();

    try {
      const response = await this.youtubeService.playlistItems.delete({
        auth: oauth2Client,
        id: playlistItemsId,
      });
      console.log('Video deleted:', response.data);
    } catch (error) {
      console.error('Error deleting video:', error);
      return error
    }
  }

  /**
 * 对视频的点赞、踩。
 */
  async videosRate(accessToken, videoId, rating) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Service.setCredentials(accessToken);
      const oauth2Client = this.oauth2Service.getClient();

      // 构造请求体
      const requestBody: any = {
        id: videoId,
        rating: rating  // like | dislike | none
      };

      console.log(requestBody);

      // 调用 API 进行点赞或踩
      const response = await this.youtubeService.videos.rate(
        {
          auth: oauth2Client,
          requestBody
        }
      );

      // 返回上传的视频 ID
      if (response.data) {
        console.log('Playlist insert successfully:', response.data);
        return response.data;
      } else {
        return 'Video rating failed';
      }
    } catch (error) {
      console.error('Error rating video:', error);
      this.handleApiError(error);
    }

  }

  /**
 * 获取视频的点赞、踩。
 */
  async getVideosRating(accessToken, videoIds) {
    // 设置 OAuth2 客户端凭证
    this.oauth2Service.setCredentials(accessToken);
    const oauth2Client = this.oauth2Service.getClient();

  // 根据传入的参数来选择一个有效的请求参数
  let requestParams: any = {
    auth: oauth2Client,
    id: videoIds
  };

  try {
    const response = await this.youtubeService.videos.getRating(requestParams);

    const infos = response.data;
    console.log(infos);
    if (infos.length === 0) {
      console.log('No categories found.');
      return [];
    } else {
      console.log(`This infos's ID is ${infos}.`);
      return infos;
    }
  } catch (err) {
    this.handleApiError(err);
  }
}

  /**
   * 处理API错误
   * @param error 错误对象
   */
  private handleApiError(error: any) {
    console.error('YouTube API Error:', error);

    if (error.response) {
      // API响应错误
      const { status, data } = error.response;
      if (status === 401) {
        throw new BadRequestException('授权已过期，请重新授权');
      } else if (status === 403) {
        throw new BadRequestException('权限不足，无法执行此操作');
      } else if (data && data.error && data.error.message) {
        throw new BadRequestException(`YouTube API错误: ${data.error.message}`);
      }
    }

    throw new BadRequestException('YouTube API请求失败');
  }

}

