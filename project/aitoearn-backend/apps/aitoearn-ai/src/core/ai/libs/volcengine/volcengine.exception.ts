import type { Locale } from '@yikart/common'
import type { AxiosError } from 'axios'
import { HttpException, HttpStatus } from '@nestjs/common'
import { getErrorMessage, getLocale } from '@yikart/common'
import { isAxiosError } from 'axios'

interface VolcengineErrorPayload {
  code?: string | number
  message?: string
  param?: string
  type?: string
}

interface VolcengineErrorResponseData {
  error?: VolcengineErrorPayload
}

interface VolcengineExceptionInput {
  operation: string
  httpStatus?: number
  providerCode?: string | number
  providerMessage?: string
  providerType?: string
  providerParam?: string
  requestId?: string
  raw?: unknown
}

type OfficialMessage = Record<Locale, string>

const DEFAULT_MESSAGE: OfficialMessage = {
  'en-US': 'Volcengine request failed',
  'zh-CN': '火山引擎请求失败',
}

const OFFICIAL_MESSAGE_BY_CODE: Record<string, OfficialMessage> = {
  'MissingParameter': {
    'en-US': 'The request failed because it is missing one or multiple required parameters.',
    'zh-CN': '请求缺少必要参数，请查阅 API 文档。',
  },
  'InvalidParameter': {
    'en-US': 'One or more parameters specified in the request are not valid.',
    'zh-CN': '请求包含非法参数，请查阅 API 文档。',
  },
  'InvalidEndpoint.ClosedEndpoint': {
    'en-US': 'The request targeted an endpoint that is currently closed or temporarily unavailable.',
    'zh-CN': '推理接入点处于已被关闭或暂时不可用，请稍后重试，或联系推理接入点管理员。',
  },
  'SensitiveContentDetected': {
    'en-US': 'The request failed because the input text may contain sensitive information.',
    'zh-CN': '输入文本可能包含敏感信息，请您使用其他 prompt。',
  },
  'SensitiveContentDetected.SevereViolation': {
    'en-US': 'The request failed because the input text may contain severe violation information.',
    'zh-CN': '输入文本可能包含严重违规相关信息，请您使用其他 prompt。',
  },
  'SensitiveContentDetected.Violence': {
    'en-US': 'The request failed because the input text may contain violence information.',
    'zh-CN': '输入文本可能包含激进行为相关信息，请您使用其他 prompt。',
  },
  'InputTextSensitiveContentDetected': {
    'en-US': 'The request failed because the input text may contain sensitive information.',
    'zh-CN': '输入文本可能包含敏感信息，请您更换后重试。',
  },
  'InputImageSensitiveContentDetected': {
    'en-US': 'The request failed because the input image may contain sensitive information.',
    'zh-CN': '输入图片可能包含敏感信息，请您更换后重试。',
  },
  'InputVideoSensitiveContentDetected': {
    'en-US': 'The request failed because the input video may contain sensitive information.',
    'zh-CN': '输入视频可能包含敏感信息，请您更换后重试。',
  },
  'InputAudioSensitiveContentDetected': {
    'en-US': 'The request failed because the input audio may contain sensitive information.',
    'zh-CN': '输入音频可能包含敏感信息，请您更换后重试。',
  },
  'OutputTextSensitiveContentDetected': {
    'en-US': 'The request failed because the output may contain sensitive information.',
    'zh-CN': '生成的文字可能包含敏感信息，请您更换输入内容后重试。',
  },
  'OutputImageSensitiveContentDetected': {
    'en-US': 'The request failed because the output image may contain sensitive information.',
    'zh-CN': '生成的图像可能包含敏感信息，请您更换输入内容后重试。',
  },
  'OutputVideoSensitiveContentDetected': {
    'en-US': 'The request failed because the output video may contain sensitive information.',
    'zh-CN': '生成的视频可能包含敏感信息，请您更换输入内容后重试。',
  },
  'OutputAudioSensitiveContentDetected': {
    'en-US': 'The request failed because the output audio may contain sensitive information.',
    'zh-CN': '生成的音频可能包含敏感信息，请您更换输入内容后重试。',
  },
  'InputTextSensitiveContentDetected.PolicyViolation': {
    'en-US': 'The request failed because the input text may violate platform rules.',
    'zh-CN': '输入文本可能违反平台规定，请您更换后重试。',
  },
  'InputImageSensitiveContentDetected.PolicyViolation': {
    'en-US': 'The request failed because the input image may violate platform rules.',
    'zh-CN': '输入图片可能违反平台规定，请您更换后重试。',
  },
  'InputVideoSensitiveContentDetected.PolicyViolation': {
    'en-US': 'The request failed because the input video may violate platform rules.',
    'zh-CN': '输入视频可能违反平台规定，请您更换后重试。',
  },
  'InputAudioSensitiveContentDetected.PolicyViolation': {
    'en-US': 'The request failed because the input audio may violate platform rules.',
    'zh-CN': '输入音频可能违反平台规定，请您更换后重试。',
  },
  'InputImageSensitiveContentDetected.PrivacyInformation': {
    'en-US': 'The request failed because the input image may contain real person.',
    'zh-CN': '输入图片可能包含真人，请您更换后重试。',
  },
  'InputVideoSensitiveContentDetected.PrivacyInformation': {
    'en-US': 'The request failed because the input video may contain real person.',
    'zh-CN': '输入视频可能包含真人，请您更换后重试。',
  },
  'InputTextRiskDetection': {
    'en-US': 'The request could not be processed because the input text includes sensitive content that violates ContentSecurityDetection.',
    'zh-CN': '火山引擎风险识别产品检测到输入文本可能包含敏感信息，请您更换后重试。',
  },
  'InputImageRiskDetection': {
    'en-US': 'The request could not be processed because the input image includes sensitive content that violates ContentSecurityDetection.',
    'zh-CN': '火山引擎风险识别产品检测到输入图片可能包含敏感信息，请您更换后重试。',
  },
  'OutputTextRiskDetection': {
    'en-US': 'The request could not be processed because the output text includes sensitive content that violates ContentSecurityDetection.',
    'zh-CN': '火山引擎风险识别产品检测到输出文本可能包含敏感信息，请您更换后重试。',
  },
  'OutputImageRiskDetection': {
    'en-US': 'The request could not be processed because the output image includes sensitive content that violates ContentSecurityDetection.',
    'zh-CN': '火山引擎风险识别产品检测到输出图片可能包含敏感信息，请您更换后重试。',
  },
  'ContentSecurityDetectionError': {
    'en-US': 'Internal error.',
    'zh-CN': '火山引擎风险识别产品请求失败。',
  },
  'InvalidArgumentError': {
    'en-US': 'The request arguments are invalid.',
    'zh-CN': '请求参数不合法，请检查消息结构后重试。',
  },
  'InvalidArgumentError.UnknownRole': {
    'en-US': 'The role of message is not supported.',
    'zh-CN': '消息体中的 role 不被支持，请检查参数后重试。',
  },
  'InvalidArgumentError.InvalidImageDetail': {
    'en-US': 'Invalid image detail value.',
    'zh-CN': 'image_url.detail 参数值无效，只支持 auto、high、low。',
  },
  'InvalidArgumentError.InvalidPixelLimit': {
    'en-US': 'Customized image pixel limits are invalid.',
    'zh-CN': '图片像素限制参数无效，请检查 min_pixels 与 max_pixels。',
  },
  'InvalidImageURL.EmptyURL': {
    'en-US': 'Empty base64 image url.',
    'zh-CN': '传入的图片 URL 为空。',
  },
  'InvalidImageURL.InvalidFormat': {
    'en-US': 'Invalid base64 image url.',
    'zh-CN': '图片 URL 或 Base64 数据无效，请检查格式后重试。',
  },
  'OutofContextError': {
    'en-US': 'Total tokens of image and text exceed max message tokens.',
    'zh-CN': '图文输入总 token 超出模型上下文长度限制，请缩短输入后重试。',
  },
  'AuthenticationError': {
    'en-US': 'The API key or AK/SK in the request is missing or invalid.',
    'zh-CN': '请求携带的 API Key 或 AK/SK 校验未通过，请检查鉴权凭证。',
  },
  'InvalidAccountStatus': {
    'en-US': 'There is an issue with your account status.',
    'zh-CN': '当前使用的账号状态异常，请联系平台管理员处理。',
  },
  'OperationDenied.ServiceNotOpen': {
    'en-US': 'Operation is denied because the model service is unavailable.',
    'zh-CN': '模型服务不可用，请前往火山方舟控制台开通对应模型服务。',
  },
  'OperationDenied.ServiceOverdue': {
    'en-US': 'Operation is denied because your account balance is overdue.',
    'zh-CN': '您的账单已逾期，请前往火山费用中心充值后重试。',
  },
  'AccountOverdueError': {
    'en-US': 'The request failed because your account has an overdue balance.',
    'zh-CN': '当前账号欠费，请充值后重试。',
  },
  'AccessDenied': {
    'en-US': 'The request failed because you do not have access to the requested resource.',
    'zh-CN': '没有访问该资源的权限，请检查权限设置或联系管理员。',
  },
  'InvalidEndpointOrModel.NotFound': {
    'en-US': 'The model or endpoint does not exist or you do not have access to it.',
    'zh-CN': '模型或推理接入点不存在，或者您无权访问该资源。',
  },
  'ModelNotOpen': {
    'en-US': 'Your account has not activated the model service.',
    'zh-CN': '当前账号暂未开通该模型服务，请前往火山方舟控制台开通。',
  },
  'InvalidEndpointOrModel.ModelIDAccessDisabled': {
    'en-US': 'Accessing the model via Model ID is not allowed for your account.',
    'zh-CN': '当前账号不允许通过模型 ID 调用，请改用有权限的推理接入点 ID。',
  },
  'RateLimitExceeded.EndpointRPMExceeded': {
    'en-US': 'The Requests Per Minute limit of the associated endpoint for your account has been exceeded.',
    'zh-CN': '请求已超过推理接入点 RPM 限制，请稍后重试。',
  },
  'RateLimitExceeded.EndpointTPMExceeded': {
    'en-US': 'The Tokens Per Minute limit of the associated endpoint for your account has been exceeded.',
    'zh-CN': '请求已超过推理接入点 TPM 限制，请稍后重试。',
  },
  'ModelAccountRpmRateLimitExceeded': {
    'en-US': 'RPM limit of the model is exceeded.',
    'zh-CN': '请求已超过账户模型 RPM 限制，请稍后重试。',
  },
  'ModelAccountTpmRateLimitExceeded': {
    'en-US': 'TPM limit of the model is exceeded.',
    'zh-CN': '请求已超过账户模型 TPM 限制，请稍后重试。',
  },
  'APIAccountRpmRateLimitExceeded': {
    'en-US': 'The RPM limit for the API on your account has been exceeded.',
    'zh-CN': '当前账号该接口的 RPM 限制已超出，请稍后重试。',
  },
  'ModelAccountIpmRateLimitExceeded': {
    'en-US': 'IPM limit of the model is exceeded.',
    'zh-CN': '请求已超过账户模型 IPM 限制，请稍后重试。',
  },
  'QuotaExceeded': {
    'en-US': 'The request has exceeded the quota.',
    'zh-CN': '当前账号额度已用尽或当前排队任务数超过限制，请稍后重试或检查额度配置。',
  },
  'ServerOverloaded': {
    'en-US': 'The service is currently unable to handle additional requests due to server overload. Please retry later.',
    'zh-CN': '服务资源紧张，请稍后重试。',
  },
  'RequestBurstTooFast': {
    'en-US': 'System protection triggered by request burst. Please slow down traffic growth and increase requests gradually before retrying.',
    'zh-CN': '请求量激增触发系统保护，请放缓流量提升速度后再试。',
  },
  'SetLimitExceeded': {
    'en-US': 'Your account has reached the set inference limit for the model, and the model service has been paused.',
    'zh-CN': '已达到当前模型设置的推理限额，请调整限额或关闭安心体验模式后重试。',
  },
  'InflightBatchsizeExceeded': {
    'en-US': 'The Inflight Batchsize limit has been exceeded.',
    'zh-CN': '已达到当前充值金额下的最大并发数限制，请降低并发或充值后重试。',
  },
  'AccountRateLimitExceeded': {
    'en-US': 'Requests are too frequent. Please reduce your request frequency, wait a short moment, and retry your request.',
    'zh-CN': '请求过于频繁，请稍后重试。',
  },
  'InternalServiceError': {
    'en-US': 'The service encountered an unexpected internal error. Please retry later.',
    'zh-CN': '内部系统异常，请稍后重试。',
  },
}

const OFFICIAL_MESSAGE_BY_PREFIX: Array<{ prefix: string, message: OfficialMessage }> = [
  {
    prefix: 'MissingParameter.',
    message: {
      'en-US': 'The required parameter is missing.',
      'zh-CN': '缺少必要的请求参数，请确认请求参数后重试。',
    },
  },
  {
    prefix: 'InvalidParameter.',
    message: {
      'en-US': 'The specified parameter is invalid.',
      'zh-CN': '请求参数值不合法，请检查参数值的正确性后重试。',
    },
  },
]

function extractResponseData(error: AxiosError): VolcengineErrorResponseData | undefined {
  const data = error.response?.data
  if (data == null || typeof data !== 'object') {
    return undefined
  }
  return data as VolcengineErrorResponseData
}

function extractRequestId(rawMessage?: string): string | undefined {
  if (!rawMessage) {
    return undefined
  }

  const match = rawMessage.match(/(?:ARKRequest ID|Request ID)\s*[:：]\s*([A-Z0-9-]+)/i)
  return match?.[1]
}

function stripRequestIdFragment(rawMessage?: string): string | undefined {
  if (!rawMessage) {
    return undefined
  }

  return rawMessage
    .replace(/\s*(?:ARKRequest ID|Request ID)\s*[:：]\s*[A-Z0-9-]+(?:[;；].*)?$/i, '')
    .trim()
}

function resolveOfficialMessage(code: string | number | undefined, locale: Locale): string | undefined {
  if (code == null) {
    return undefined
  }

  const normalizedCode = String(code)
  const exactMessage = OFFICIAL_MESSAGE_BY_CODE[normalizedCode]
  if (exactMessage) {
    return exactMessage[locale]
  }

  const prefixMatch = OFFICIAL_MESSAGE_BY_PREFIX.find(item => normalizedCode.startsWith(item.prefix))
  return prefixMatch?.message[locale]
}

function buildMessage(baseMessage: string, requestId?: string, locale: Locale = getLocale()): string {
  if (!requestId) {
    return baseMessage
  }

  return locale === 'zh-CN'
    ? `${baseMessage}（Request ID: ${requestId}）`
    : `${baseMessage} (Request ID: ${requestId})`
}

function buildResponseBody(input: {
  statusCode: number
  message: string
  operation: string
  providerCode?: string | number
  providerMessage?: string
  providerType?: string
  providerParam?: string
  requestId?: string
}) {
  const data: Record<string, unknown> = {
    operation: input.operation,
  }

  if (input.providerCode !== undefined) {
    data['providerCode'] = input.providerCode
  }
  if (input.providerMessage !== undefined) {
    data['providerMessage'] = input.providerMessage
  }
  if (input.providerType !== undefined) {
    data['providerType'] = input.providerType
  }
  if (input.providerParam !== undefined) {
    data['providerParam'] = input.providerParam
  }
  if (input.requestId !== undefined) {
    data['requestId'] = input.requestId
  }

  return {
    code: input.statusCode,
    message: input.message,
    data,
  }
}

export class VolcengineException extends HttpException {
  readonly operation: string
  readonly httpStatus: number
  readonly providerCode?: string | number
  readonly providerMessage?: string
  readonly providerType?: string
  readonly providerParam?: string
  readonly requestId?: string
  readonly raw?: unknown

  constructor(input: VolcengineExceptionInput) {
    const statusCode = input.httpStatus ?? HttpStatus.INTERNAL_SERVER_ERROR
    const locale = getLocale()
    const message = buildMessage(
      resolveOfficialMessage(input.providerCode, locale)
      ?? stripRequestIdFragment(input.providerMessage)
      ?? DEFAULT_MESSAGE[locale],
      input.requestId,
      locale,
    )

    super(
      buildResponseBody({
        statusCode,
        message,
        operation: input.operation,
        providerCode: input.providerCode,
        providerMessage: input.providerMessage,
        providerType: input.providerType,
        providerParam: input.providerParam,
        requestId: input.requestId,
      }),
      statusCode,
    )

    this.message = message
    this.name = 'VolcengineException'
    this.operation = input.operation
    this.httpStatus = statusCode
    this.providerCode = input.providerCode
    this.providerMessage = input.providerMessage
    this.providerType = input.providerType
    this.providerParam = input.providerParam
    this.requestId = input.requestId
    this.raw = input.raw
  }

  static buildFromError(error: unknown, operation: string): VolcengineException {
    if (error instanceof VolcengineException) {
      return error
    }

    if (!isAxiosError(error)) {
      return new VolcengineException({
        operation,
        providerMessage: getErrorMessage(error),
        raw: error,
      })
    }

    const responseData = extractResponseData(error)
    const payload = responseData?.error

    return new VolcengineException({
      operation,
      httpStatus: error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      providerCode: payload?.code,
      providerMessage: payload?.message ?? error.message,
      providerType: payload?.type,
      providerParam: payload?.param,
      requestId: extractRequestId(payload?.message) ?? extractRequestId(error.message),
      raw: error,
    })
  }
}
