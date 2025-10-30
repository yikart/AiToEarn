import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// 增加已用存储的 DTO
export const addUsedStorageSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  amount: z.number().min(0).describe('存储大小（Bytes）'),
})

export class AddUsedStorageDto extends createZodDto(addUsedStorageSchema) {}

// 减少已用存储的 DTO
export const deductUsedStorageSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  amount: z.number().min(0).describe('存储大小（Bytes）'),
})

export class DeductUsedStorageDto extends createZodDto(deductUsedStorageSchema) {}

// 设置总存储容量的 DTO
export const setTotalStorageSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  totalStorage: z.number().min(0).describe('总存储容量（Bytes）'),
  expiredAt: z.date().optional().describe('过期时间'),
})

export class SetTotalStorageDto extends createZodDto(setTotalStorageSchema) {}

// 查询用户存储信息的 DTO
export const storageInfoSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
})

export class StorageInfoDto extends createZodDto(storageInfoSchema) {}
