import { requestContext } from '@yikart/common'
import { VolcengineException } from './volcengine.exception'

function buildProviderError() {
  return {
    isAxiosError: true,
    message: 'Request failed with status code 400',
    config: {
      method: 'post',
      url: '/api/v3/contents/generations/tasks',
    },
    response: {
      status: 400,
      data: {
        error: {
          code: 'InputImageSensitiveContentDetected.PrivacyInformation',
          message: 'The request failed because the input image may contain real person. Request id: 021775813653027eff6165463a2ce5f140dae355499e1796de13b',
          param: '',
          type: 'BadRequest',
        },
      },
    },
  }
}

describe('volcengineException', () => {
  it('should map provider error to zh-cn official message', () => {
    const error = requestContext.run({ locale: 'zh-CN' }, () =>
      VolcengineException.buildFromError(
        buildProviderError(),
        'POST /api/v3/contents/generations/tasks',
      ))

    expect(error.message).toBe('输入图片可能包含真人，请您更换后重试。（Request ID: 021775813653027eff6165463a2ce5f140dae355499e1796de13b）')
    expect(error.httpStatus).toBe(400)
    expect(error.providerCode).toBe('InputImageSensitiveContentDetected.PrivacyInformation')
    expect(error.providerType).toBe('BadRequest')
    expect(error.providerParam).toBe('')
    expect(error.requestId).toBe('021775813653027eff6165463a2ce5f140dae355499e1796de13b')
    expect(error.getResponse()).toEqual({
      code: 400,
      message: '输入图片可能包含真人，请您更换后重试。（Request ID: 021775813653027eff6165463a2ce5f140dae355499e1796de13b）',
      data: {
        operation: 'POST /api/v3/contents/generations/tasks',
        providerCode: 'InputImageSensitiveContentDetected.PrivacyInformation',
        providerMessage: 'The request failed because the input image may contain real person. Request id: 021775813653027eff6165463a2ce5f140dae355499e1796de13b',
        providerType: 'BadRequest',
        providerParam: '',
        requestId: '021775813653027eff6165463a2ce5f140dae355499e1796de13b',
      },
    })
  })

  it('should map provider error to en-us official message', () => {
    const error = requestContext.run({ locale: 'en-US' }, () =>
      VolcengineException.buildFromError(
        buildProviderError(),
        'POST /api/v3/contents/generations/tasks',
      ))

    expect(error.message).toBe('The request failed because the input image may contain real person. (Request ID: 021775813653027eff6165463a2ce5f140dae355499e1796de13b)')
  })
})
