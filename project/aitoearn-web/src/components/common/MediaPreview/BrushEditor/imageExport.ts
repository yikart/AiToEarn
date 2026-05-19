/**
 * imageExport - 图片编辑导出配置与 Canvas 合成工具
 * 支持图片输出格式选择与 JPEG 质量压缩
 */

export const IMAGE_EXPORT_FORMATS = [
  { value: 'image/png', label: 'PNG', extension: 'png' },
  { value: 'image/jpeg', label: 'JPG', extension: 'jpg' },
] as const

export const IMAGE_EXPORT_QUALITY = {
  min: 30,
  max: 100,
  step: 5,
  default: 85,
} as const

export const DEFAULT_IMAGE_EXPORT_FORMAT = IMAGE_EXPORT_FORMATS[0].value

export type ImageExportFormat = typeof IMAGE_EXPORT_FORMATS[number]['value']
export type ImageExportExtension = typeof IMAGE_EXPORT_FORMATS[number]['extension']

export interface ImageExportOptions {
  format: ImageExportFormat
  quality: number
}

export function getImageExportExtension(format: ImageExportFormat): ImageExportExtension {
  return IMAGE_EXPORT_FORMATS.find(item => item.value === format)?.extension ?? 'png'
}

export function getImageExportLabel(format: ImageExportFormat) {
  return IMAGE_EXPORT_FORMATS.find(item => item.value === format)?.label ?? 'PNG'
}

export function createEditedImageFileName(format: ImageExportFormat) {
  return `edited_${Date.now()}.${getImageExportExtension(format)}`
}

function getCanvasExportQuality(format: ImageExportFormat, quality: number) {
  if (format !== 'image/jpeg')
    return undefined

  const normalizedQuality = Math.min(
    IMAGE_EXPORT_QUALITY.max,
    Math.max(IMAGE_EXPORT_QUALITY.min, quality),
  )

  return normalizedQuality / 100
}

function fillJpegBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bodyBackground = getComputedStyle(document.body).backgroundColor

  if (bodyBackground && bodyBackground !== 'rgba(0, 0, 0, 0)') {
    ctx.fillStyle = bodyBackground
  }
  else {
    ctx.fillStyle = 'Canvas'
  }

  ctx.fillRect(0, 0, width, height)
}

export function exportCanvasLayers(
  imageCanvas: HTMLCanvasElement,
  drawCanvas: HTMLCanvasElement,
  options: ImageExportOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mergeCanvas = document.createElement('canvas')
    mergeCanvas.width = imageCanvas.width
    mergeCanvas.height = imageCanvas.height

    const ctx = mergeCanvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    if (options.format === 'image/jpeg') {
      fillJpegBackground(ctx, mergeCanvas.width, mergeCanvas.height)
    }

    ctx.drawImage(imageCanvas, 0, 0)
    ctx.drawImage(drawCanvas, 0, 0)

    mergeCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('Failed to export image'))
      },
      options.format,
      getCanvasExportQuality(options.format, options.quality),
    )
  })
}
