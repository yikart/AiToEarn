import { z } from 'zod'
import { PlatformStatus } from './platforms.interface'

export function createPlatformConfigSchema<T extends z.ZodTypeAny>(
  availableSchema: T,
  placeholderShape: z.ZodRawShape = {},
) {
  const schema = z.union([
    z.object({
      ...placeholderShape,
      status: z.literal(PlatformStatus.Hidden),
      logoUrl: z.string().default(''),
    }),
    z.object({
      ...placeholderShape,
      status: z.literal(PlatformStatus.Unavailable),
      logoUrl: z.url(),
    }),
    z.object({
      ...placeholderShape,
      status: z.literal(PlatformStatus.ComingSoon),
      logoUrl: z.url(),
    }),
    availableSchema,
  ])

  return schema as unknown as T
}

export interface PlatformConfigWithStatus {
  status: PlatformStatus
  logoUrl?: string
}

export interface AvailablePlatformConfig {
  status: PlatformStatus.Available
  logoUrl: string
}

export interface PlaceholderPlatformConfig {
  status: PlatformStatus.Unavailable | PlatformStatus.ComingSoon
  logoUrl: string
}

export interface VisiblePlatformConfig {
  status: PlatformStatus.Available | PlatformStatus.Unavailable | PlatformStatus.ComingSoon
  logoUrl: string
}

export function isAvailablePlatformConfig<T extends PlatformConfigWithStatus>(
  platformConfig: T | undefined,
): platformConfig is T & AvailablePlatformConfig {
  return platformConfig?.status === PlatformStatus.Available
}

export function isPlaceholderPlatformConfig<T extends PlatformConfigWithStatus>(
  platformConfig: T | undefined,
): platformConfig is T & PlaceholderPlatformConfig {
  return platformConfig?.status === PlatformStatus.Unavailable
    || platformConfig?.status === PlatformStatus.ComingSoon
}

export function isVisiblePlatformConfig<T extends PlatformConfigWithStatus>(
  platformConfig: T | undefined,
): platformConfig is T & VisiblePlatformConfig {
  return isAvailablePlatformConfig(platformConfig) || isPlaceholderPlatformConfig(platformConfig)
}
