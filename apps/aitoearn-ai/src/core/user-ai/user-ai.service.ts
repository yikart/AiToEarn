import path from 'node:path'
/*
 * @Author: AI Assistant
 * @Date: 2025-01-15
 * @Description: 用户AI服务 - 统一管理用户AI调用和token关联
 */
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import axios from 'axios'
import { BigNumber } from 'bignumber.js'
import { Model } from 'mongoose'
import { OpenAI } from 'openai'
import { AppException, ExceptionCode } from '@/common'
import { config } from '@/config'
import { S3Service } from '@/libs/aws-s3/s3.service'
import { User } from '@/libs/database/schema'
import { UserNewApiToken } from '@/libs/database/schema/userNewApiToken.schema'
import { FireflycardService } from '@/libs/fireflycard'
import { Md2cardService } from '@/libs/md2card'
import { MidjourneyService } from '@/libs/midjourney'
import { NewApiService, VideoService } from '@/libs/new-api'
import { CreateTokenRequest, UpdateTokenRequest } from '@/libs/new-api/interfaces'
import { OpenaiService } from '@/libs/openai'
import { PointsNatsApi } from '@/transports/user/points.natsApi'
import { FireflycardGenerationDto, Md2CardGenerationDto, UserAiChatDto, UserImageEditDto, UserImageGenerationDto, UserImageVariationDto, UserLogsQueryDto, UserMJTaskStatusQueryDto, UserMJVideoGenerationDto, UserVideoGenerationRequestDto, UserVideoTaskQueryDto } from './user-ai.dto'

@Injectable()
export class UserAiService {
  private readonly logger = new Logger(UserAiService.name)

  constructor(
    @InjectModel(UserNewApiToken.name)
    private readonly userNewApiTokenModel: Model<UserNewApiToken>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly newApiService: NewApiService,
    private readonly openaiService: OpenaiService,
    private readonly midjourneyService: MidjourneyService,
    private readonly videoService: VideoService,
    private readonly md2cardService: Md2cardService,
    private readonly fireflycardService: FireflycardService,
    private readonly pointsNatsApi: PointsNatsApi,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * 积分到token配额的转换比例
   */
  private readonly creditRatio = config.userAi.creditRatio

  /**
   * 根据用户ID查找token关联关系
   */
  async findTokenByUserId(userId: string): Promise<UserNewApiToken | null> {
    return await this.userNewApiTokenModel.findOne({ userId })
  }

  /**
   * 根据用户ID获取用户信息
   */
  async getUserById(userId: string): Promise<User | null> {
    return await this.userModel.findById(userId)
  }

  /**
   * 根据tokenId查找token关联关系
   */
  async findTokenByTokenId(tokenId: number): Promise<UserNewApiToken | null> {
    return await this.userNewApiTokenModel.findOne({ tokenId })
  }

  /**
   * 创建用户token关联关系
   */
  async createTokenAssociation(data: {
    userId: string
    tokenId: number
    tokenKey: string
    tokenName: string
  }): Promise<UserNewApiToken> {
    const userToken = new this.userNewApiTokenModel(data)
    const result = await userToken.save()

    this.logger.debug(`创建用户token关联成功: userId=${data.userId}, tokenId=${data.tokenId}`)
    return result
  }

  /**
   * 更新用户token关联关系
   */
  async updateTokenAssociation(
    userId: string,
    updateData: Partial<{
      tokenId: number
      tokenKey: string
      tokenName: string
    }>,
  ): Promise<UserNewApiToken | null> {
    const result = await this.userNewApiTokenModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true },
    )

    return result
  }

  /**
   * 删除用户token关联关系
   */
  async deleteTokenAssociation(userId: string) {
    await this.userNewApiTokenModel.deleteOne({ userId })
  }

  /**
   * 检查用户是否已有token关联
   */
  async hasTokenAssociation(userId: string): Promise<boolean> {
    const count = await this.userNewApiTokenModel.countDocuments({ userId })
    return count > 0
  }

  /**
   * 根据积分计算token配额
   * 支持小数点积分，保留计算精度
   */
  private calculateQuotaFromScore(points: number): number {
    const quota = Math.round(points * 500000 * this.creditRatio)

    return Math.max(0, quota)
  }

  /**
   * 生成用户token名称
   */
  private generateTokenName(userId: string): string {
    return `user_${userId}`
  }

  /**
   * 获取或创建用户token
   * 如果用户没有token则自动创建，如果有则更新配额
   */
  async getOrCreateUserToken(userId: string) {
    let userToken = await this.findTokenByUserId(userId)
    const pointsBalance = await this.pointsNatsApi.getBalance({ userId })
    const userPoints = pointsBalance.balance
    this.logger.debug(`用户 ${userId} 积分: ${userPoints}`)

    if (!userPoints || userPoints <= 0) {
      throw new AppException(ExceptionCode.UserAiScoreInsufficient)
    }
    // const userPoints = 1999

    if (!userToken) {
      userToken = await this.createNewToken(userId, this.calculateQuotaFromScore(userPoints))
      this.logger.debug(`为用户 ${userId} 自动创建token，积分: ${userPoints}`)
    }
    else {
      await this.updateExistingTokenQuota(userToken.tokenId, this.calculateQuotaFromScore(userPoints))
      this.logger.debug(`更新用户 ${userId} token配额，积分: ${userPoints}`)
    }

    return {
      ...userToken,
      balance: pointsBalance.balance,
    }
  }

  /**
   * 更新用户token配额
   * 如果用户没有token则创建，如果有则更新配额
   */
  async updateTokenQuota(userId: string, userPoints: number): Promise<UserNewApiToken> {
    const quota = this.calculateQuotaFromScore(userPoints)
    let userToken = await this.findTokenByUserId(userId)

    if (!userToken) {
      userToken = await this.createNewToken(userId, quota)
    }
    else {
      await this.updateExistingTokenQuota(userToken.tokenId, quota)
    }

    return userToken
  }

  /**
   * 创建新的token
   */
  private async createNewToken(userId: string, quota: number): Promise<UserNewApiToken> {
    const tokenName = this.generateTokenName(userId)

    const createRequest: CreateTokenRequest = {
      name: tokenName,
      expired_time: -1,
      remain_quota: quota,
      unlimited_quota: false,
      model_limits_enabled: false,
      group: 'user',
    }

    const createdToken = await this.newApiService.createToken(createRequest)

    const userToken = await this.createTokenAssociation({
      userId,
      tokenId: createdToken.id,
      tokenKey: createdToken.key,
      tokenName: createdToken.name,
    })

    return userToken
  }

  /**
   * 更新现有token的配额
   */
  private async updateExistingTokenQuota(tokenId: number, quota: number): Promise<void> {
    const updateRequest: UpdateTokenRequest = {
      id: tokenId,
      remain_quota: quota,
      status: 1,
    }

    await this.newApiService.updateToken(updateRequest)

    this.logger.debug(`更新token配额成功: tokenId=${tokenId}, quota=${quota}`)
  }

  /**
   * 获取用户积分余额
   * @param userId 用户ID
   * @returns 用户积分余额
   */
  async getUserPointsBalance(userId: string): Promise<number> {
    const balanceVo = await this.pointsNatsApi.getBalance({ userId })
    return balanceVo.balance
  }

  /**
   * 扣减用户积分
   * @param userId 用户ID
   * @param amount 扣减积分数量
   * @param description 积分变动描述
   * @param metadata 额外信息
   */
  async deductUserPoints(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.pointsNatsApi.deductPoints({
      userId,
      amount,
      type: 'ai_service',
      description,
      metadata,
    })
  }

  /**
   * 增加用户积分
   * @param userId 用户ID
   * @param amount 增加积分数量
   * @param description 积分变动描述
   * @param metadata 额外信息
   */
  async addUserPoints(
    userId: string,
    amount: number,
    model: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.pointsNatsApi.addPoints({
      userId,
      amount,
      type: 'ai_service',
      description: `AI 生成模型: ${model}`,
      metadata,
    })
  }

  async userAiChat(request: UserAiChatDto) {
    const { userId, messages, model, temperature, maxTokens } = request

    const userToken = await this.getOrCreateUserToken(userId)
    const modelConfig = config.ai.models.chat.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ExceptionCode.InvalidImageModel)
    }
    const apiKey = userToken.tokenKey

    const langchainMessages: BaseMessage[] = messages.map((message) => {
      if (message.role === 'system') {
        return new SystemMessage(message)
      }
      else {
        return new HumanMessage(message)
      }
    })

    const aiResult = await this.openaiService.createChatCompletion({
      model,
      messages: langchainMessages,
      temperature,
      maxTokens,
      apiKey,
    })

    const usage = aiResult.usage_metadata
    if (!usage) {
      throw new AppException(ExceptionCode.UserAiCallFailed)
    }

    const prompt = new BigNumber(usage.input_tokens).div('1000').times(modelConfig.pricing.prompt)
    const completion = new BigNumber(usage.output_tokens).div('1000').times(modelConfig.pricing.completion)

    await this.deductUserPoints(
      userId,
      prompt.plus(completion).toNumber(),
      model,
      usage,
    )

    return {
      content: aiResult.content,
      model,
      usage,
    }
  }

  /**
   * 获取用户日志
   */
  async getUserLogs(dto: UserLogsQueryDto) {
    const userToken = await this.getOrCreateUserToken(dto.userId)

    const response = await this.newApiService.getLogs({
      ...dto,
      type: 2,
      p: dto.page,
      page_size: dto.size,
      token_name: userToken.tokenName,
    })

    return response
  }

  /**
   * 将 base64 字符串转换为 File 对象
   */
  private base64ToFile(base64String: string, filename = 'image'): File {
    const mimeType = base64String.split(';')[0].split(':')[1]
    if (!mimeType || !mimeType.includes('image/')) {
      throw new AppException(ExceptionCode.InvalidImageData)
    }
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')

    return new File([Buffer.from(base64Data, 'base64')], `${filename}.${mimeType.replace('image/', '')}`, { type: mimeType })
  }

  /**
   * 将 URL 转换为 File 对象
   */
  private async urlToFile(url: string, filename = 'image'): Promise<File> {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data)
    const contentType = response.headers['content-type'] || 'image/jpeg'
    const extension = contentType.split('/')[1] || 'jpg'

    return new File([buffer], `${filename}.${extension}`, { type: contentType })
  }

  /**
   * 将 URL 或 base64 字符串转换为 File 对象
   */
  private async urlOrBase64ToFile(urlOrBase64: string, filename = 'image'): Promise<File> {
    if (/^https?:\/\//.test(urlOrBase64)) {
      return await this.urlToFile(urlOrBase64, filename)
    }
    return this.base64ToFile(urlOrBase64, filename)
  }

  /**
   * 用户图片生成
   */
  async userImageGeneration(request: UserImageGenerationDto) {
    const { userId, user, ...imageParams } = request

    const userToken = await this.getOrCreateUserToken(userId)
    const modelConfig = config.ai.models.image.generation.find(m => m.name === imageParams.model)
    if (!modelConfig) {
      throw new AppException(ExceptionCode.InvalidImageModel)
    }
    const pricing = Number(modelConfig.pricing)
    if (userToken.balance < pricing) {
      throw new AppException(ExceptionCode.UserAiScoreInsufficient)
    }
    const apiKey = userToken.tokenKey

    const imageResult = await this.openaiService.createImageGeneration({
      ...imageParams,
      apiKey,
    } as Omit<OpenAI.Images.ImageGenerateParams, 'user'> & { apiKey?: string })

    if (!imageResult.usage) {
      throw new AppException(ExceptionCode.ImageGenerationFailed, '图片生成失败，数据返回错误')
    }

    await this.deductUserPoints(
      userId,
      pricing,
      imageParams.model,
    )

    for (const image of imageResult.data || []) {
      if (image.url) {
        const filename = `${Date.now().toString(36)}-${path.basename(image.url.split('?')[0])}`
        const { key } = await this.s3Service.uploadFileByUrl(`ai/images/${request.model}${user ? `${user ? `/${user}` : ''}` : ''}/${filename}`, image.url)
        image.url = key
      }
    }

    return {
      created: imageResult.created,
      list: imageResult.data || [],
      usage: imageResult.usage,
    }
  }

  /**
   * 用户图片编辑
   */
  async userImageEdit(request: UserImageEditDto) {
    const { userId, image, mask, user, ...editParams } = request

    const userToken = await this.getOrCreateUserToken(userId)
    const modelConfig = config.ai.models.image.generation.find(m => m.name === editParams.model)
    if (!modelConfig) {
      throw new AppException(ExceptionCode.InvalidImageModel)
    }
    const pricing = Number(modelConfig.pricing)
    if (userToken.balance < pricing) {
      throw new AppException(ExceptionCode.UserAiScoreInsufficient)
    }
    const apiKey = userToken.tokenKey

    const imageFile = await this.urlOrBase64ToFile(image, 'image')
    const maskFile = mask ? await this.urlOrBase64ToFile(mask, 'mask') : undefined

    const imageResult = await this.openaiService.createImageEdit({
      ...editParams,
      image: imageFile,
      mask: maskFile,
      apiKey,
    } as Omit<OpenAI.Images.ImageEditParams, 'user'> & { apiKey?: string })

    if (!imageResult.usage) {
      throw new AppException(ExceptionCode.ImageGenerationFailed, '图片生成失败，数据返回错误')
    }

    await this.deductUserPoints(
      userId,
      pricing,
      editParams.model,
    )

    for (const image of imageResult.data || []) {
      if (image.url) {
        const filename = `${Date.now().toString(36)}-${path.basename(image.url.split('?')[0])}`
        const { key } = await this.s3Service.uploadFileByUrl(`ai/images/${request.model}${user ? `${user ? `/${user}` : ''}` : ''}/${filename}`, image.url)
        image.url = key
      }
    }
    return {
      created: imageResult.created,
      list: imageResult.data || [],
      usage: imageResult.usage,
    }
  }

  /**
   * 用户图片变体
   */
  async userImageVariation(request: UserImageVariationDto) {
    const { userId, image, user, ...variationParams } = request

    const userToken = await this.getOrCreateUserToken(userId)
    const modelConfig = config.ai.models.image.generation.find(m => m.name === variationParams.model)
    if (!modelConfig) {
      throw new AppException(ExceptionCode.InvalidImageModel)
    }
    const pricing = Number(modelConfig.pricing)
    if (userToken.balance < pricing) {
      throw new AppException(ExceptionCode.UserAiScoreInsufficient)
    }
    const apiKey = userToken.tokenKey

    const imageFile = await this.urlOrBase64ToFile(image, 'image.png')

    const imageResult = await this.openaiService.createImageVariation({
      ...variationParams,
      image: imageFile,
      apiKey,
    } as Omit<OpenAI.Images.ImageCreateVariationParams, 'user'> & { apiKey?: string })

    if (!imageResult.usage) {
      throw new AppException(ExceptionCode.ImageGenerationFailed, '图片生成失败，数据返回错误')
    }

    await this.deductUserPoints(
      userId,
      pricing,
      variationParams.model,
    )

    for (const image of imageResult.data || []) {
      if (image.url) {
        const filename = `${Date.now().toString(36)}-${path.basename(image.url.split('?')[0])}`
        const { key } = await this.s3Service.uploadFileByUrl(`ai/images/${request.model}${user ? `/${user}` : ''}/${filename}`, image.url)
        image.url = key
      }
    }

    return {
      created: imageResult.created,
      list: imageResult.data || [],
      usage: imageResult.usage,
    }
  }

  /**
   * MJ视频生成
   */
  async userMjSubmitVideo(request: UserMJVideoGenerationDto) {
    const { userId } = request

    const userToken = await this.getOrCreateUserToken(userId)
    const apiKey = userToken.tokenKey

    const result = await this.midjourneyService.submitVideoTask({
      ...request,
      apiKey,
    })
    return result
  }

  /**
   * MJ任务查询
   */
  async userMjTaskFetch(request: UserMJTaskStatusQueryDto) {
    const { userId, taskId } = request

    // 获取或创建用户token
    const userToken = await this.getOrCreateUserToken(userId)
    const apiKey = userToken.tokenKey

    return await this.midjourneyService.fetchTask(taskId, apiKey)
  }

  /**
   * 用户视频生成（通用接口）
   */
  async userVideoGeneration(request: UserVideoGenerationRequestDto) {
    const { userId, model, ...videoParams } = request

    const modelConfig = config.ai.models.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ExceptionCode.InvalidVideoModel)
    }

    const price = await this.calculateVideoGenerationPrice({
      model,
      ...videoParams,
      resolution: videoParams.size || modelConfig.defaults?.resolution,
      ...modelConfig.defaults,
    })

    const userToken = await this.getOrCreateUserToken(userId)
    const apiKey = userToken.tokenKey

    const result = await this.videoService.submitVideoGeneration({
      model,
      ...videoParams,
      apiKey,
    })

    await this.deductUserPoints(
      userId,
      price,
      model,
      videoParams,
    )

    return result
  }

  /**
   * 查询视频任务状态
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryDto) {
    const { userId, taskId } = request

    const userToken = await this.getOrCreateUserToken(userId)
    const apiKey = userToken.tokenKey

    const result = await this.videoService.getVideoTaskStatus({
      taskId,
      apiKey,
    })

    if (result.fail_reason && result.fail_reason.startsWith('http')) {
      const filename = `${taskId}-${path.basename(result.fail_reason.split('?')[0])}`
      const uploadResult = await this.s3Service.uploadFileByUrl(`ai/videos/${filename}`, result.fail_reason)
      result.fail_reason = uploadResult.key
    }
    return result
  }

  /**
   * MD2Card生成
   */
  async generateMd2Card(request: Md2CardGenerationDto) {
    const { userId, ...cardParams } = request

    const pointsBalance = await this.pointsNatsApi.getBalance({ userId })
    const userPoints = pointsBalance.balance
    if (userPoints <= 0) {
      throw new AppException(ExceptionCode.UserAiScoreInsufficient)
    }

    const result = await this.md2cardService.generateCard(cardParams)

    await this.deductUserPoints(
      userId,
      2,
      'md2card',
    )

    for (const image of result.images) {
      const filename = `${Date.now().toString(36)}-${path.basename(image.url.split('?')[0])}`
      const { key } = await this.s3Service.uploadFileByUrl(`ai/images/md2card/${filename}`, image.url)
      image.url = key
    }

    return result
  }

  /**
   * Fireflycard生成（免费）
   */
  async generateFireflycard(request: FireflycardGenerationDto) {
    const { userId, ...cardParams } = request
    const imageBuffer = await this.fireflycardService.createImage({
      ...cardParams,
    })

    const filename = `${Date.now().toString(36)}.png`
    const { key } = await this.s3Service.uploadFile(`ai/images/fireflycard/${filename}`, imageBuffer)

    return {
      image: key,
    }
  }

  /**
   * 获取图片生成模型参数
   */
  async getImageGenerationModelParams() {
    return config.ai.models.image.generation
  }

  /**
   * 获取图片编辑模型参数
   */
  async getImageEditModelParams() {
    return config.ai.models.image.edit
  }

  /**
   * 获取视频生成模型参数
   */
  async getVideoGenerationModelParams() {
    return config.ai.models.video.generation
  }

  /**
   * 计算视频生成费用
   * 根据模型名称和参数匹配配置中的价格
   */
  /**
   * 计算视频生成价格（内部方法）
   */
  async calculateVideoGenerationPrice(params: {
    model: string
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
  }): Promise<number> {
    const { model, resolution, aspectRatio, mode, duration } = params

    // 查找对应的模型配置
    const modelConfig = config.ai.models.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ExceptionCode.InvalidVideoModel)
    }

    // 在pricing数组中查找匹配的价格配置
    const pricingConfig = modelConfig.pricing.find((pricing) => {
      // 匹配所有提供的参数
      const resolutionMatch = !pricing.resolution || !resolution || pricing.resolution === resolution
      const aspectRatioMatch = !pricing.aspectRatio || !aspectRatio || pricing.aspectRatio === aspectRatio
      const modeMatch = !pricing.mode || !mode || pricing.mode === mode
      const durationMatch = !pricing.duration || !duration || pricing.duration === duration

      return resolutionMatch && aspectRatioMatch && modeMatch && durationMatch
    })

    if (!pricingConfig) {
      throw new AppException(ExceptionCode.InvalidVideoParams)
    }

    return pricingConfig.price
  }

  /**
   * 获取视频生成价格（公开接口）
   */
  async getVideoGenerationPrice(params: {
    model: string
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
  }) {
    const price = await this.calculateVideoGenerationPrice(params)
    return { price }
  }
}
