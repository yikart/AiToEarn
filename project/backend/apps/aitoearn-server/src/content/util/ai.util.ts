import { Injectable } from '@nestjs/common'
import { UserType } from '@yikart/common'
import OpenAI from 'openai'
import { ChatMessageDto, ChatService, UserChatCompletionDto } from '../../ai/chat'

@Injectable()
export class ContentAiUtil {
  constructor(
    private readonly chatService: ChatService,
  ) { }

  // Intelligent image content generation
  async imgContentByAi(user: { userId: string, userType: UserType }, model: string, imgUrl: string, prompt: string, option?: {
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user

    const messages: ChatMessageDto[] = []
    if (option?.systemPrompt) {
      messages.push({
        role: 'system',
        content: option.systemPrompt,
      })
    }

    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: imgUrl,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.chatService.userChatCompletion(request)
    return res.content as string || ''
  }

  // Intelligent video content generation
  async videoContentByAi(user: { userId: string, userType: UserType }, model: string, videoUrl: string, prompt: string, option?: {
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user

    const messages: ChatMessageDto[] = []
    if (option?.systemPrompt) {
      messages.push({
        role: 'system',
        content: option.systemPrompt,
      })
    }

    messages.push({
      role: 'user',
      content: [
        {
          type: 'video',
          video_url: {
            url: videoUrl,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.chatService.userChatCompletion(request)
    return res.content as string || ''
  }

  // Return text content based on image
  async getContentByAi(user: { userId: string, userType: UserType }, model: string, prompt: string, option: {
    coverUrl?: string
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user
    if (!prompt && !option.coverUrl)
      return ''

    const messages: ChatMessageDto[] = []
    if (option.systemPrompt) {
      messages.push({
        role: 'system',
        content: option.systemPrompt,
      })
    }

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: prompt,
      },
    ]
    if (option.coverUrl) {
      content.push({
        type: 'image_url',
        image_url: {
          url: option.coverUrl,
        },
      })
    }

    messages.push({
      role: 'user',
      content,
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.chatService.userChatCompletion(request)
    return res.content as string || ''
  }

  // Return text content based on image
  async getTitleByAi(user: { userId: string, userType: UserType }, model: string, prompt: string): Promise<string> {
    const { userId, userType } = user
    if (!prompt)
      return ''
    const systemContent = `Generate the content title based on the reference title and the original content. Keep the same language as the content, Just return the title text`

    const messages: ChatMessageDto[] = [{
      role: 'system',
      content: systemContent,
    }]

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: prompt,
      },
    ]

    messages.push({
      role: 'user',
      content,
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.chatService.userChatCompletion(request)
    return res.content as string || ''
  }
}
