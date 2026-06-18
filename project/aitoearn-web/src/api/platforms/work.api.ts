import type { ValidateWorkOwnershipDto, ValidateWorkOwnershipVo } from './work.types'
import http from '@/utils/request'

/**
 * 校验作品归属
 * POST /channel/work/validate
 */
export function apiValidateWorkOwnership(data: ValidateWorkOwnershipDto) {
  return http.post<ValidateWorkOwnershipVo>('/channel/work/validate', data)
}
