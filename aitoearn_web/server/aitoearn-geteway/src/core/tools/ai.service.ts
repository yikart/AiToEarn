import { RedisService } from '@libs/redis/redis.service'
/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common'
import axios from 'axios'
import OpenAI from 'openai'
import { Observable } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { config } from '@/config'

export enum FireflycardTempTypes {
  A = 'tempA', // 默认
  B = 'tempB', // 书摘
  C = 'tempC', // 透明
  Jin = 'tempJin', // 金句
  Memo = 'tempMemo', // 备忘录
  Easy = 'tempEasy', // 便当
  BlackSun = 'tempBlackSun', // 黑日
  E = 'tempE', // 框界
  Write = 'tempWrite', // 手写
  Code = 'code', // 代码
  D = 'tempD', // 图片(暂时不用)
}
@Injectable()
export class AiToolsService {
  private baseURL: string = 'https://api.gpt.ge' // 新的API基础URL

  constructor(private readonly redisService: RedisService) {
    // 不再初始化OpenAI客户端，直接使用HTTP请求
  }

  /**
   * 通用聊天接口调用
   */
  private async chatCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }): Promise<any> {
    const requestBody = {
      model: params.model || 'gpt-4o',
      messages: params.messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 1000,
      stream: params.stream || false,
    };

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.ai.qwenKey}`, // 复用现有的key
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw error;
    }
  }

  /**
   * 视频智能标题
   * @param url
   * @param min
   * @param max
   * @returns
   */
  async videoAiTitle(url: string, min = 5, max = 50): Promise<string> {
    try {
      const result = await this.chatCompletion({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个短视频创作者,请帮我作品进行智能标题设置,只需要返回标题',
          },
          {
            role: 'user',
            content: `给视频设置一个标题,长度为${min}到${max}个字. 只需要返回该标题。视频URL: ${url}`,
          },
        ],
        temperature: 0.8,
        max_tokens: max + 20,
      });

      return result?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('videoAiTitle error:', error);
      return '';
    }
  }

  /**
   * 智能评论图片
   * @param imgUrl
   * @param title
   * @param desc
   * @param max
   * @returns
   */
  async reviewImgByAi(
    imgUrl: string,
    title = '无',
    desc = '无',
    max = 50,
  ): Promise<string> {
    try {
      // 注意：图片处理可能需要特殊处理，这里简化处理
      const result = await this.chatCompletion({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `你是我的好友,请对我发的短视频的作品或者朋友圈短视频作品进行评论,我会提供作品的信息. 请用中文回复,并且回复内容不超过${max}字.只需要返回评论内容.`,
          },
          {
            role: 'user',
            content: `作品标题: ${title}, 作品描述: ${desc}, 图片URL: ${imgUrl}`,
          },
        ],
        temperature: 0.8,
        max_tokens: max + 20,
      });

      return result?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('reviewImgByAi error:', error);
      return '';
    }
  }

  // 智能评论
  async reviewAi(
    title: string,
    desc = '无',
    max = 50,
  ): Promise<string> {
    try {
      const result = await this.chatCompletion({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `你是我的好友,请对我发的短视频作品或者朋友圈作品进行评论. 请用中文回复,并且回复内容不超过${max}字.只需要返回评论内容.`,
          },
          {
            role: 'user',
            content: `作品标题: ${title}, 作品描述: ${desc}`,
          },
        ],
        temperature: 0.8,
        max_tokens: max + 20,
      });

      return result?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('reviewAi error:', error);
      return '';
    }
  }

  /**
   * 智能回复评论
   * @param content
   * @param title
   * @param desc
   * @param max
   */
  async reviewAiRecover(
    content: string,
    title = '无',
    desc = '无',
    max = 50,
  ): Promise<string> {
    try {
      const result = await this.chatCompletion({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `你是一个风趣幽默又有分寸的文字创作者的助手,请帮我对别人对我作品的评论进行回复. 请用中文回复,并且回复内容不超过${max}字.只需要返回你的回复内容.`,
          },
          {
            role: 'user',
            content: `作品标题: ${title}, 作品描述: ${desc}, 评论内容: ${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: max + 20,
      });

      return result?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('reviewAiRecover error:', error);
      return '';
    }
  }

  /**
   * 根据主旨和提示词生成评论
   * @param subject 评论主旨
   * @param prompt 提示词
   * @param max 最大字数
   */
  async generateComment(
    subject: string,
    prompt: string = '请为以下内容生成一条友善、自然的评论',
    max = 100,
  ): Promise<string> {
    try {
      const result = await this.chatCompletion({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `评论主旨: ${subject}`,
          },
        ],
        temperature: 0.8,
        max_tokens: max + 20,
      });

      return result?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('generateComment error:', error);
      return '';
    }
  }

  /**
   * 生成AI的html图文
   * @param content
   */
  async aiArticleHtml(content: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      stream: true,
      model: 'deepseek-v3',
      messages: [
        {
          role: 'system',
          content: `你是一个web前端开发者,根据我发的内容进行web页面开发.注意,只需要返回代码`,
        },
        {
          role: 'user',
          content,
        },
      ],
      stream_options: {
        include_usage: true,
      },
      modalities: ['text'],
    })

    let res = ''

    for await (const chunk of completion) {
      if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
        console.log(chunk.choices[0].delta)
        const content = chunk.choices[0].delta.content
        if (content === null)
          return res
        res += content
      }
      else {
        console.log(chunk.usage)
      }
    }

    return res
  }

  /**
   * 获取AI的markdown
   * @param content
   */
  aiMarkdown(data: { content: string, prompt: string }) {
    const taskId = uuidv4().replace(/-/g, '')
    this.openai.chat.completions
      .create({
        stream: true,
        model: 'deepseek-v3',
        messages: [
          {
            role: 'system',
            content: `将以下内容美化成Markdown格式,${data.prompt},只需要美化样式,内容不改变,只返回markdown格式,不返回其他内容`,
          },
          {
            role: 'user',
            content: data.content,
          },
        ],
        stream_options: {
          include_usage: true,
        },
        modalities: ['text'],
      })
      .then(async (completion) => {
        let text = ''

        for await (const chunk of completion) {
          if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
            console.log(chunk.choices[0].delta)
            const content = chunk.choices[0].delta.content
            if (content !== null)
              text += content
          }
          else {
            console.log(chunk.usage)
          }
        }
        this.redisService.setKey<string>(`aiMarkdown:${taskId}`, text, 60 * 5)
      })

    return taskId
  }

  // 获取aiMarkdown的结果
  async getAiMarkdown(taskId: string) {
    try {
      const text = await this.redisService.get<string>(
        `aiMarkdown:${taskId}`,
        false,
      )
      return text
    }
    catch (error) {
      console.log('------ getAiMarkdown error ----', error)

      return ''
    }
  }

  /**
   * 生成AI的html图文
   * @param content
   */
  async aiArticleHtmlSse(content: string): Promise<Observable<any>> {
    const completion = await this.openai.chat.completions.create({
      stream: true,
      model: 'deepseek-v3',
      messages: [
        {
          role: 'system',
          content: `你是一个web前端开发者,根据我发的内容进行web页面开发.注意,只需要返回代码`,
        },
        {
          role: 'user',
          content,
        },
      ],
      stream_options: {
        include_usage: true,
      },
      modalities: ['text'],
    })

    return new Observable((observer) => {
      (async () => {
        for await (const chunk of completion) {
          if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
            console.log(chunk.choices[0].delta)
            const content = chunk.choices[0].delta.content
            if (content === null)
              return observer.complete()
            observer.next(content)
          }
          else {
            console.log(chunk.usage)
          }
        }
        observer.complete()
      })()
    })
  }

  /**
   * 获取流光卡片内容
   * @param title
   * @param content
   * @returns Promise<string> 返回流光卡片图片编码
   */
  async fireflycard(
    content: string,
    temp: FireflycardTempTypes,
    title = '',
  ): Promise<Buffer> {
    const url = `https://fireflycard-api.302ai.cn/api/saveImg`

    const body = {
      form: {
        title,
        content,
        pagination: '01',
      },
      style: {
        align: 'left',
        backgroundName: 'vertical-blue-color-29',
        backShadow: '',
        font: 'Alibaba-PuHuiTi-Regular',
        width: 440,
        ratio: '',
        height: 0,
        fontScale: 1,
        padding: '30px',
        borderRadius: '15px',
        color: '#000000',
        opacity: 1,
        blur: 0,
        backgroundAngle: '0deg',
        lineHeights: {
          content: '',
        },
        letterSpacings: {
          content: '',
        },
      },
      switchConfig: {
        showIcon: false,
        showDate: true,
        showTitle: !!title,
        showContent: true,
        showAuthor: false,
        showTextCount: false,
        showQRCode: false,
        showPageNum: false,
        showWatermark: false,
      },
      temp,
      language: 'zh',
    }

    const response = await axios.post(url, body, {
      responseType: 'arraybuffer',
    })
    return response.data
  }

  /**
   * 即梦生成封面 任务提交
   * @returns
   */
  async upJmImgTask(data: {
    prompt: string
    width: number
    height: number
    sessionIds: string[]
  }) {
    const body = {
      id: uuidv4(), // 标识符
      // jimeng-3.0（默认） /  jimeng-2.1 / jimeng-2.0-pro / jimeng-2.0 / jimeng-1.4 / jimeng-xl-pro
      model: 'jimeng-3.0',
      // 提示词，必填
      prompt: data.prompt,
      // 反向提示词，默认空字符串
      negativePrompt: '',
      // 图像宽度，默认1024
      width: data.width,
      // 图像高度，默认1024
      height: data.height,
      // 精细度，取值范围0-1，默认0.5
      sample_strength: 0.5,
      sessionId: data.sessionIds.join(','),
      // sessionId:
      //   '0e2bdef17755a3f121b608ec8a763f6b,7e90a4c9bb3c6c8b7056267f27395c78',
    }

    const result = await axios.post<{
      code: number // 0;
      msg: string // 'success';
      data: {
        _id: string // 'f05f1c88b28ced57d42c29b799185079';
        taskId: string // 'f05f1c88b28ced57d42c29b799185079';
        id: string // '0130c639-3d80-4e77-8da3-64de1dba8d2e';
        model: string // 'jimeng-3.0';
        prompt: string // '美好花园';
        negativePrompt: string // '';
        width: number // 10;
        height: number // 10;
        sample_strength: number // 0.5;
        status: string // 'pending';
        createTime: string // '2025-05-14 22:31:32';
        images: string[] // [];
      }
    }>('https://att-contents.yikart.cn/api/third/v1/images/generations', body)

    if (result.data.code) {
      console.log('------- upJmImgTask error ---', result.data.msg)
      return ''
    }

    return result.data.data.taskId
  }

  /**
   * 即梦生成图片任务获取
   * @returns
   */
  async getJmImgTaskRes(taskId: string): Promise<{
    taskId: string
    status: string
    imgList: string[]
  }> {
    const result = await axios.get<{
      code: number // 0;
      msg: string // 'success';
      data: {
        status: string
        taskId: string // '997272a47ac2b46e2b7660ae905b33cb';
        images: {
          url: string
        }[]
      }
    }>('https://att-contents.yikart.cn/api/third/v1/images/query', {
      params: { taskId },
    })

    console.log(
      '----------- getJmImgTaskRes result.data ----------',
      result.data,
    )

    if (result.data.code) {
      console.log('------- getJmImgTaskRes error ---', result.data.msg)
      return {
        taskId: '',
        status: 'error',
        imgList: [],
      }
    }

    if (result.data.data.status === 'failed') {
      return {
        taskId,
        status: 'failed',
        imgList: [],
      }
    }

    if (result.data.data.status !== 'success') {
      return {
        taskId,
        status: result.data.data.status,
        imgList: [],
      }
    }

    return {
      taskId,
      status: 'success',
      imgList: result.data.data.images.map((item: any) => {
        return item.url
      }),
    }
  }
}
