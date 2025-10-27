import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

import { PubRecord, PubStatus, PubType } from 'src/db/schema/pubRecord.schema';
import { TikTokAuthService } from './tiktok.auth.service';
import { CreateVideoDto, TikTokCommentDto, GetVideosQueryDto, TikTokVideoFilterDto } from './dto/tiktok.dto';

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);
  private readonly apiBaseUrl: string;
  private readonly uploadApiBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tikTokAuthService: TikTokAuthService,
    @InjectModel(PubRecord.name) private readonly pubRecordModel: Model<PubRecord>,
  ) {
    const tiktokConfig = this.configService.get('tiktok');
    if (!tiktokConfig) {
      throw new Error('TikTok配置未找到，请检查环境变量和配置文件');
    }
    this.apiBaseUrl = tiktokConfig.apiBaseUrl;
    this.uploadApiBaseUrl = tiktokConfig.uploadApiBaseUrl;
  }

  /**
   * 获取用户视频列表
   * @param accessToken 访问令牌
   * @param userId 用户ID
   * @param accountId TikTok账号ID
   * @param limit 每页结果数
   * @param cursor 分页游标
   * @returns 用户视频列表
   */
  async getUserVideos(
    accessToken: string,
    userId: string,
    accountId: string,
    limit = 10,
    cursor?: string
  ): Promise<any> {
    try {
      // 确保limit是数字且在有效范围内
      limit = isNaN(Number(limit)) ? 10 : Math.min(Math.max(Number(limit), 1), 50);

      const params: any = {
        fields: 'id,create_time,video_description,duration,height,width,share_count,comment_count,like_count,view_count,title,embed_link,embed_html,thumbnail_url',
        max_count: limit
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiBaseUrl}/v2/video/list`, {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return data.data;
    } catch (error) {
      this.logger.error('获取TikTok视频列表失败:', error.response?.data || error.message);
      throw new BadRequestException(`获取视频列表失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 获取视频详情
   * @param accessToken 访问令牌
   * @param videoId 视频ID
   * @returns 视频详情
   */
  async getVideoDetail(
    accessToken: string,
    videoId: string
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiBaseUrl}/v2/video/info/`, {
          params: {
            fields: 'id,create_time,video_description,duration,height,width,share_count,comment_count,like_count,view_count,title,embed_link,embed_html,thumbnail_url',
            video_id: videoId
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return data.data;
    } catch (error) {
      this.logger.error('获取TikTok视频详情失败:', error.response?.data || error.message);
      throw new BadRequestException(`获取视频详情失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 方式1：初始化视频上传（旧版）
   * @param accessToken 访问令牌
   * @param videoSize 视频文件总大小（字节）
   * @param chunkSize 分片大小（字节），默认为5MB
   * @returns 初始化结果，包含上传所需的参数
   */
  async initVideoUpload(
    accessToken: string,
    videoSize?: number,
    chunkSize: number = 5 * 1024 * 1024 // 默认5MB
  ): Promise<any> {
    try {
      const requestBody: any = {};
      
      // 如果提供了视频大小，添加分片上传的相关信息
      if (videoSize) {
        const totalChunkCount = Math.ceil(videoSize / chunkSize);
        requestBody.source_info = {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunkCount
        };
      }

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/v2/post/publish/inbox/video/init/`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return data.data;
    } catch (error) {
      this.logger.error('初始化TikTok视频上传失败:', error.response?.data || error.message);
      throw new BadRequestException(`初始化视频上传失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * 方式2：初始化视频发布（直接发布，新版）
   * @param accessToken 访问令牌
   * @param videoSize 视频文件总大小（字节）
   * @param videoInfo 视频相关信息，包含标题、隐私级别等
   * @param chunkSize 分片大小（字节），默认为10MB
   * @returns 初始化结果，包含上传所需的参数
   */
  async initVideoPublish(
    accessToken: string,
    videoSize: number,
    videoInfo: {
      title?: string;
      description?: string;
      privacyStatus?: string;
      disableComment?: boolean;
      disableDuet?: boolean;
      disableStitch?: boolean;
      videoCoverTimestampMs?: number;
      tags?: string[];
    },
    chunkSize: number = 10 * 1024 * 1024 // 默认10MB
  ): Promise<any> {
    try {
      // 计算总分片数
      const totalChunkCount = Math.ceil(videoSize / chunkSize);
      
      // 处理hashtags，如果提供了
      let title = videoInfo.title || videoInfo.description || '';
      if (videoInfo.tags && videoInfo.tags.length > 0) {
        const hashtagText = videoInfo.tags
          .map(tag => `#${tag.replace(/^#/, '')}`)
          .join(' ');
        if (title) {
          title = `${title} ${hashtagText}`;
        } else {
          title = hashtagText;
        }
      }
      
      // 构建请求体
      const requestBody: any = {
        post_info: {
          title: title,
          privacy_level: videoInfo.privacyStatus || 'PUBLIC',
          disable_duet: videoInfo.disableDuet || false,
          disable_comment: videoInfo.disableComment || false,
          disable_stitch: videoInfo.disableStitch || false
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunkCount
        }
      };
      
      // 添加视频封面时间戳，如果提供了
      if (videoInfo.videoCoverTimestampMs) {
        requestBody.post_info.video_cover_timestamp_ms = videoInfo.videoCoverTimestampMs;
      }
      
      this.logger.debug('初始化视频发布请求:', JSON.stringify(requestBody));

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/v2/post/publish/video/init/`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );
      
      if (!data.data.publish_id || !data.data.upload_url) {
        throw new BadRequestException('初始化视频发布失败，缺少publish_id或upload_url');
      }

      return data.data;
    } catch (error) {
      this.logger.error('初始化TikTok视频发布失败:', error.response?.data || error.message);
      throw new BadRequestException(`初始化视频发布失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 上传视频文件
   * @param accessToken 访问令牌
   * @param videoBuffer 视频文件缓冲区
   * @param initData 初始化返回的数据
   * @returns 上传结果
   */
  async uploadVideo(
    accessToken: string,
    videoBuffer: Buffer,
    initData?: any
  ): Promise<any> {
    try {
      // 如果没有提供初始化数据，先进行初始化
      if (!initData) {
        // 计算视频大小并进行初始化
        const videoSize = videoBuffer.length;
        initData = await this.initVideoUpload(accessToken, videoSize);
      }

      // 检查是否需要分片上传
      if (initData.publish_id && initData.upload_url && videoBuffer.length > 10 * 1024 * 1024) {
        // 如果有publish_id和upload_url，并且视频超过10MB，则使用分片上传
        return await this.uploadVideoChunked(accessToken, videoBuffer, initData);
      }

      // 如果不需要分片，使用单次上传
      // 创建Node.js版的FormData
      const formData = new FormData();

      // 直接将Buffer添加到FormData中
      const filename = `video_${Date.now()}.mp4`;
      formData.append('video', videoBuffer, {
        filename,
        contentType: 'video/mp4'
      });
      
      // 添加初始化返回的必要参数
      if (initData.upload_params) {
        Object.entries(initData.upload_params).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // 使用初始化返回的上传URL，如果没有则使用默认URL
      const uploadUrl = initData.upload_url || `${this.apiBaseUrl}/v2/video/upload/`;

      const { data } = await firstValueFrom(
        this.httpService.post(uploadUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return {
        ...data.data,
        init_data: initData, // 返回初始化数据，可能在发布时需要
      };
    } catch (error) {
      this.logger.error('上传TikTok视频失败:', error.response?.data || error.message);
      throw new BadRequestException(`上传视频失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * 方式1：分片上传视频（POST方式）
   * @param accessToken 访问令牌
   * @param videoBuffer 视频文件缓冲区
   * @param initData 初始化返回的数据，包含 publish_id 和 upload_url
   * @returns 上传结果
   */
  private async uploadVideoChunked(
    accessToken: string,
    videoBuffer: Buffer,
    initData: any
  ): Promise<any> {
    try {
      const { publish_id, upload_url } = initData;
      
      if (!publish_id || !upload_url) {
        throw new BadRequestException('初始化响应缺少 publish_id 或 upload_url');
      }
      
      // 设置分片大小（每个分片5MB）
      const chunkSize = 5 * 1024 * 1024;
      const totalSize = videoBuffer.length;
      const totalChunkCount = Math.ceil(totalSize / chunkSize);
      
      this.logger.debug(`视频总大小: ${totalSize} 字节, 分片数: ${totalChunkCount}`);
      
      // 选择视频内容类型
      const contentType = 'video/mp4';
      
      // 存储每个分片的上传响应
      const uploadResponses = [];
      
      // 上传每个分片
      for (let i = 0; i < totalChunkCount; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunkBuffer = videoBuffer.subarray(start, end);
        const chunkLength = chunkBuffer.length;
        
        this.logger.debug(`正在上传第${i + 1}/${totalChunkCount}个分片，范围: ${start}-${end-1}/${totalSize}, 大小: ${chunkLength} 字节`);
        
        // 使用原生的请求头而不是FormData
        const { data } = await firstValueFrom(
          this.httpService.post(upload_url, chunkBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Length': chunkLength.toString(),
              'Content-Range': `bytes ${start}-${end-1}/${totalSize}`,
              'Authorization': `Bearer ${accessToken}`
            }
          })
        );
        
        uploadResponses.push(data);
      }
      
      // 使用最后一个分片的响应作为最终响应
      const finalResponse = uploadResponses[totalChunkCount - 1];
      
      return {
        ...finalResponse.data,
        publish_id,
        video_id: finalResponse.data?.video_id || finalResponse.data?.id,
        init_data: initData, // 返回初始化数据，可能在发布时需要
      };
    } catch (error) {
      this.logger.error('分片上传TikTok视频失败:', error.response?.data || error.message);
      throw new BadRequestException(`分片上传视频失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * 方式2：直接上传视频（PUT方式）
   * @param accessToken 访问令牌
   * @param videoBuffer 视频文件缓冲区
   * @param initData 初始化返回的数据，包含 publish_id 和 upload_url
   * @returns 上传结果
   */
  async directUploadVideo(
    accessToken: string,
    videoBuffer: Buffer,
    initData: any
  ): Promise<any> {
    try {
      const { publish_id, upload_url } = initData;
      
      if (!publish_id || !upload_url) {
        throw new BadRequestException('初始化响应缺少 publish_id 或 upload_url');
      }
      
      const totalSize = videoBuffer.length;
      // 建议的分片大小，如果文件大于10MB则分片上传
      const chunkSize = 10 * 1024 * 1024;
      const needChunking = totalSize > chunkSize;
      
      // 选择视频内容类型
      const contentType = 'video/mp4';
      
      this.logger.debug(`直接上传视频，总大小: ${totalSize} 字节, 是否需要分片: ${needChunking}`);
      
      if (!needChunking) {
        // 单次上传整个文件
        const { data } = await firstValueFrom(
          this.httpService.put(upload_url, videoBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Length': totalSize.toString(),
              'Authorization': `Bearer ${accessToken}`
            }
          })
        );
        
        return {
          publish_id,
          ...data?.data,
        };
      } else {
        // 分片上传
        const totalChunkCount = Math.ceil(totalSize / chunkSize);
        let lastResponse = null;
        
        // 上传每个分片
        for (let i = 0; i < totalChunkCount; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, totalSize);
          const chunkBuffer = videoBuffer.subarray(start, end);
          const chunkLength = chunkBuffer.length;
          
          this.logger.debug(`正在上传第${i + 1}/${totalChunkCount}个分片，范围: ${start}-${end-1}/${totalSize}, 大小: ${chunkLength} 字节`);
          
          const { data } = await firstValueFrom(
            this.httpService.put(upload_url, chunkBuffer, {
              headers: {
                'Content-Type': contentType,
                'Content-Length': chunkLength.toString(),
                'Content-Range': `bytes ${start}-${end-1}/${totalSize}`,
                'Authorization': `Bearer ${accessToken}`
              }
            })
          );
          
          lastResponse = data;
        }
        
        return {
          publish_id,
          ...lastResponse?.data,
        };
      }
    } catch (error) {
      this.logger.error('直接上传TikTok视频失败:', error.response?.data || error.message);
      throw new BadRequestException(`直接上传视频失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * 检查视频发布状态
   * @param accessToken 访问令牌
   * @param publishId 发布ID
   * @returns 发布状态信息
   */
  async checkPublishStatus(
    accessToken: string,
    publishId: string
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.apiBaseUrl}/v2/post/publish/status/fetch/`, 
          { publish_id: publishId },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )
      );

      return data.data;
    } catch (error) {
      this.logger.error('检查TikTok视频发布状态失败:', error.response?.data || error.message);
      throw new BadRequestException(`检查视频发布状态失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * 三步式完整上传并发布视频（新版API）
   * @param accessToken 访问令牌
   * @param userId 用户ID
   * @param accountId TikTok账号ID
   * @param videoBuffer 视频数据
   * @param videoInfo 视频信息
   * @param pollInterval 轮询状态的时间间隔（毫秒）。默认2秒。
   * @param maxRetries 最大重试次数。默认30次，大约60秒。
   * @returns 视频发布结果
   */
  async uploadAndPublishVideo(
    accessToken: string,
    userId: string,
    accountId: string,
    videoBuffer: Buffer,
    videoInfo: {
      title?: string;
      description?: string;
      privacyStatus?: string;
      disableComment?: boolean;
      disableDuet?: boolean;
      disableStitch?: boolean;
      videoCoverTimestampMs?: number;
      tags?: string[];
    },
    pollInterval: number = 2000,  
    maxRetries: number = 30
  ): Promise<any> {
    try {
      // 1. 第一步：初始化视频发布
      this.logger.debug('第一步：初始化视频发布...');
      const videoSize = videoBuffer.length;
      const initResult = await this.initVideoPublish(accessToken, videoSize, videoInfo);
      
      if (!initResult.publish_id || !initResult.upload_url) {
        throw new BadRequestException('初始化失败，缺少必要的上传参数');
      }
      
      const { publish_id } = initResult;
      
      // 2. 第二步：上传视频文件
      this.logger.debug(`第二步：上传视频文件，publish_id: ${publish_id}...`);
      await this.directUploadVideo(accessToken, videoBuffer, initResult);
      
      // 3. 第三步：轮询视频发布状态 // 每分钟不超过30次
      this.logger.debug(`第三步：轮询视频发布状态，publish_id: ${publish_id}...`);
      
      // 存储发布记录
      const maxRecord = await this.pubRecordModel.findOne().sort({ id: -1 });
      const newId = maxRecord ? maxRecord.id + 1 : 1;
      
      const pubRecord = await this.pubRecordModel.create({
        id: newId,
        userId,
        accountId,
        type: PubType.VIDEO,
        status: PubStatus.UNPUBLISH,
        title: videoInfo.title,
        desc: videoInfo.description,
        attachments: [publish_id],
        publishTime: new Date(),
        createTime: new Date(),
        updateTime: new Date(),
      });
      
      let finalStatus = null;
      let tries = 0;
      
      // 轮询检查发布状态
      while (tries < maxRetries) {
        tries++;
        
        const statusResult = await this.checkPublishStatus(accessToken, publish_id);
        this.logger.debug(`状态检查 ${tries}/${maxRetries}: ${JSON.stringify(statusResult)}`);
        
        // 判断视频是否发布成功
        // 根据实际API返回的状态字段来判断（这里的status字段可能需要根据实际情况调整）
        if (statusResult.status === 'SUCCESS' || statusResult.status === 'PUBLISHED') {
          finalStatus = statusResult;
          break;
        } else if (statusResult.status === 'FAILED' || statusResult.status === 'ERROR') {
          // 更新发布记录为失败状态
          await this.pubRecordModel.findByIdAndUpdate(pubRecord._id, {
            status: PubStatus.FAIL,
            failReason: statusResult.error_message || '发布失败',
            updateTime: new Date()
          });
          
          throw new BadRequestException(`视频发布失败: ${statusResult.error_message || '未知错误'}`);
        }
        
        // 等待指定时间后再次查询
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      if (!finalStatus) {
        // 超时仍未完成
        await this.pubRecordModel.findByIdAndUpdate(pubRecord._id, {
          status: PubStatus.FAIL,
          failReason: '检查视频发布状态超时',
          updateTime: new Date()
        });
        
        throw new BadRequestException('视频发布状态检查超时，请稍后在TikTok应用中查看发布状态');
      }
      
      // 更新发布记录为成功状态
      const videoId = finalStatus.video_id || finalStatus.id || publish_id;
      await this.pubRecordModel.findByIdAndUpdate(pubRecord._id, {
        status: PubStatus.RELEASED,
        resourceId: videoId,
        updateTime: new Date()
      });
      
      return {
        ...finalStatus,
        resourceId: videoId,
        publish_id,
      };
    } catch (error) {
      this.logger.error('三步式视频上传发布失败:', error.response?.data || error.message);
      throw new BadRequestException(`视频上传发布失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 发布视频（原始方式）
   * @param accessToken 访问令牌
   * @param userId 用户ID
   * @param accountId TikTok账号ID
   * @param videoDto 视频发布参数
   * @param uploadResult 上传结果，包含视频ID和初始化数据
   * @returns 发布结果
   */
  async publishVideo(
    accessToken: string,
    userId: string,
    accountId: string,
    videoDto: CreateVideoDto,
    uploadResult: any
  ): Promise<any> {
    try {
      const videoId = uploadResult.video_id || (uploadResult.init_data?.video_id);
      if (!videoId) {
        throw new BadRequestException('无效的视频上传结果，缺少视频ID');
      }

      const params: any = {
        video_id: videoId,
        text: videoDto.description,
        disable_comment: false,
        disable_duet: false,
        privacy_level: videoDto.private ? 'private' : 'public'
      };

      if (videoDto.hashtags && videoDto.hashtags.length > 0) {
        // 添加话题标签
        const hashtags = videoDto.hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ');
        params.text = `${params.text} ${hashtags}`;
      }

      // 如果有初始化数据，添加必要的发布参数
      if (uploadResult.init_data && uploadResult.init_data.publish_params) {
        Object.assign(params, uploadResult.init_data.publish_params);
      }

      // 获取当前最大的 id
      const maxRecord = await this.pubRecordModel.findOne().sort({ id: -1 });
      const newId = maxRecord ? maxRecord.id + 1 : 1;

      // 创建发布记录
      const pubRecord = await this.pubRecordModel.create({
        id: newId,
        userId,
        accountId,
        type: PubType.VIDEO,
        status: PubStatus.UNPUBLISH,
        content: videoDto.description,
        attachments: [videoId],
        publishTime: new Date(),
        createTime: new Date(),
        updateTime: new Date(),
      });

      try {
        // 获取发布URL，可能在初始化时已提供
        const publishUrl = (uploadResult.init_data && uploadResult.init_data.publish_url) || 
                          `${this.apiBaseUrl}/v2/video/publish/`;

        const { data } = await firstValueFrom(
          this.httpService.post(publishUrl, params, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          })
        );

        // 更新发布记录状态
        await this.pubRecordModel.findByIdAndUpdate(pubRecord._id, {
          status: PubStatus.RELEASED,
          remoteId: data.data.share_id || videoId,
          updateTime: new Date()
        });

        return data.data;
      } catch (error) {
        // 更新发布记录为失败状态
        await this.pubRecordModel.findByIdAndUpdate(pubRecord._id, {
          status: PubStatus.FAIL,
          failReason: error.response?.data?.error?.message || error.message,
          updateTime: new Date()
        });

        throw error;
      }
    } catch (error) {
      this.logger.error('发布TikTok视频失败:', error.response?.data || error.message);
      throw new BadRequestException(`发布视频失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 删除视频
   * @param accessToken 访问令牌
   * @param videoId 视频ID
   * @returns 删除结果
   */
  async deleteVideo(
    accessToken: string,
    videoId: string
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/v2/video/delete/`, {
          video_id: videoId
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return { success: true };
    } catch (error) {
      this.logger.error('删除TikTok视频失败:', error.response?.data || error.message);
      throw new BadRequestException(`删除视频失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 获取视频评论列表
   * @param accessToken 访问令牌
   * @param videoId 视频ID
   * @param limit 每页结果数
   * @param cursor 分页游标
   * @returns 评论列表
   */
  async getVideoComments(
    accessToken: string,
    videoId: string,
    limit = 20,
    cursor?: string
  ): Promise<any> {
    try {
      // 确保limit是数字且在有效范围内
      limit = isNaN(Number(limit)) ? 20 : Math.min(Math.max(Number(limit), 1), 50);

      const params: any = {
        fields: 'id,text,create_time,like_count,reply_comment_total,user',
        video_id: videoId,
        max_count: limit
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiBaseUrl}/v2/comment/list/`, {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return data.data;
    } catch (error) {
      this.logger.error('获取TikTok视频评论失败:', error.response?.data || error.message);
      throw new BadRequestException(`获取评论失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 发表评论
   * @param accessToken 访问令牌
   * @param commentDto 评论参数
   * @returns 评论结果
   */
  async postComment(
    accessToken: string,
    commentDto: TikTokCommentDto
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/v2/comment/post/`, {
          video_id: commentDto.videoId,
          text: commentDto.text
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return data.data;
    } catch (error) {
      this.logger.error('发表TikTok评论失败:', error.response?.data || error.message);
      throw new BadRequestException(`发表评论失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 删除评论
   * @param accessToken 访问令牌
   * @param videoId 视频ID
   * @param commentId 评论ID
   * @returns 删除结果
   */
  async deleteComment(
    accessToken: string,
    videoId: string,
    commentId: string
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/v2/comment/delete/`, {
          video_id: videoId,
          comment_id: commentId
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return { success: true };
    } catch (error) {
      this.logger.error('删除TikTok评论失败:', error.response?.data || error.message);
      throw new BadRequestException(`删除评论失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 点赞视频
   * @param accessToken 访问令牌
   * @param userId 用户ID
   * @param accountId TikTok账号ID
   * @param videoId 视频ID
   * @returns 点赞结果
   */
  async likeVideo(
    accessToken: string,
    userId: string,
    accountId: string,
    videoId: string
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/v2/video/like/`, {
          video_id: videoId
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return { success: true };
    } catch (error) {
      this.logger.error('TikTok视频点赞失败:', error.response?.data || error.message);
      throw new BadRequestException(`视频点赞失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 取消点赞视频
   * @param accessToken 访问令牌
   * @param userId 用户ID
   * @param accountId TikTok账号ID
   * @param videoId 视频ID
   * @returns 取消点赞结果
   */
  async unlikeVideo(
    accessToken: string,
    userId: string,
    accountId: string,
    videoId: string
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/v2/video/unlike/`, {
          video_id: videoId
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return { success: true };
    } catch (error) {
      this.logger.error('取消TikTok视频点赞失败:', error.response?.data || error.message);
      throw new BadRequestException(`取消视频点赞失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 搜索视频
   * @param accessToken 访问令牌
   * @param filterDto 搜索过滤参数
   * @returns 搜索结果
   */
  async searchVideos(
    accessToken: string,
    filterDto: TikTokVideoFilterDto
  ): Promise<any> {
    try {
      // 确保limit是数字且在有效范围内
      const limit = isNaN(Number(filterDto.limit)) ? 10 : Math.min(Math.max(Number(filterDto.limit), 1), 50);

      const params: any = {
        fields: 'id,create_time,video_description,duration,height,width,share_count,comment_count,like_count,view_count,title,embed_link,thumbnail_url',
        max_count: limit,
        search_key: filterDto.keyword || ''
      };

      if (filterDto.cursor) {
        params.cursor = filterDto.cursor;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiBaseUrl}/v2/video/search/`, {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      // 如果设置了最低播放次数过滤
      let videos = data.data.videos || [];
      if (filterDto.minPlayCount && !isNaN(Number(filterDto.minPlayCount)) && Number(filterDto.minPlayCount) > 0) {
        videos = videos.filter(video => {
          return video.view_count >= Number(filterDto.minPlayCount);
        });
      }

      return {
        videos: videos,
        cursor: data.data.cursor,
        has_more: data.data.has_more
      };
    } catch (error) {
      this.logger.error('搜索TikTok视频失败:', error.response?.data || error.message);
      throw new BadRequestException(`搜索视频失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 获取用户TikTok账号信息
   * @param accessToken 访问令牌
   * @param accountId TikTok账号ID
   * @returns 账号信息
   */
  async getUserProfile(
    accessToken: string,
    accountId: string
  ): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiBaseUrl}/v2/user/info/`, {
          params: {
            fields: 'open_id,union_id,avatar_url,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count,nickname',
            open_id: accountId
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      );

      return data.data.user;
    } catch (error) {
      this.logger.error('获取TikTok用户信息失败:', error.response?.data || error.message);
      throw new BadRequestException(`获取用户信息失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}
