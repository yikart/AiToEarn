import { BrowserEnvironmentRegion, CloudInstanceStatus, createZodDto } from '@aitoearn/common'
import { z } from 'zod'

export const createCloudInstanceSchema = z.object({
  region: z.enum(BrowserEnvironmentRegion),
  imageId: z.string(),
  bundleId: z.string(),
  name: z.string().optional(),
})

export const uLHostInstanceInfoSchema = z.object({
  ULHostId: z.string(),
  publicIp: z.string(),
  privateIp: z.string().optional(),
  status: z.string(),
  region: z.string(),
})

export const instanceStatusSchema = z.object({
  instanceId: z.string(),
  status: z.enum(CloudInstanceStatus),
  publicIp: z.string().optional(),
  privateIp: z.string().optional(),
})

export class CreateCloudInstanceDto extends createZodDto(createCloudInstanceSchema) {}
export class ULHostInstanceInfoDto extends createZodDto(uLHostInstanceInfoSchema) {}
export class InstanceStatusDto extends createZodDto(instanceStatusSchema) {}
