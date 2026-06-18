import type { PlatformMediaRules } from './platforms.interface'
import { z } from 'zod'

export enum PublishMediaAdaptationImageFormat {
  Off = 'off',
  Auto = 'auto',
  Jpeg = 'jpeg',
  Png = 'png',
  Webp = 'webp',
}

export interface PublishMediaAdaptationOption {
  imageFormat?: PublishMediaAdaptationImageFormat
}

const targetImageFormats = [
  PublishMediaAdaptationImageFormat.Jpeg,
  PublishMediaAdaptationImageFormat.Png,
  PublishMediaAdaptationImageFormat.Webp,
]

export function createPublishMediaAdaptationOptionSchema() {
  return z.object({
    imageFormat: z.enum(PublishMediaAdaptationImageFormat).optional().describe('图片和封面格式转换目标'),
  }).optional().describe('媒体格式转换选项')
}

export function createPublishMediaOptionsSchema() {
  return z.object({
    adaptation: createPublishMediaAdaptationOptionSchema(),
  }).optional().describe('媒体处理选项')
}

export function normalizeAdaptationImageFormat(format: string): string {
  const normalized = format.toLowerCase()
  return normalized === 'jpg' ? PublishMediaAdaptationImageFormat.Jpeg : normalized
}

export function listAllowedAdaptationImageFormats(rules: PlatformMediaRules): PublishMediaAdaptationImageFormat[] {
  const allowed = new Set((rules.imageFormats ?? []).map(normalizeAdaptationImageFormat))
  return targetImageFormats.filter(format => allowed.has(format))
}

export function isImageFormatAllowedByMediaRules(format: string | undefined, rules: PlatformMediaRules): boolean {
  if (!format) {
    return false
  }
  const allowed = new Set((rules.imageFormats ?? []).map(normalizeAdaptationImageFormat))
  return allowed.has(normalizeAdaptationImageFormat(format))
}
