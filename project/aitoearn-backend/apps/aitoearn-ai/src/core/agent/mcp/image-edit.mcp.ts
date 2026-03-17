import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { UserType } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import axios from 'axios'
import sharp, { Blend, FitEnum, Gravity } from 'sharp'
import { z } from 'zod'
import { McpServerName } from '../agent.constants'
import { successResult, wrapTool } from './mcp.utils'

// ==================== Zod Schemas ====================

const imageInputSchema = z.string().describe('Image URL (http/https)')

const gravitySchema = z.enum([
  'northwest',
  'north',
  'northeast',
  'west',
  'center',
  'east',
  'southwest',
  'south',
  'southeast',
])

const fitSchema = z.enum(['cover', 'contain', 'fill', 'inside', 'outside'])

const blendSchema = z.enum([
  'over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
])

const layerResizeSchema = z.object({
  width: z.number().int().positive().optional().describe('Target width in pixels'),
  height: z.number().int().positive().optional().describe('Target height in pixels'),
  scale: z.number().positive().optional().describe('Scale factor (e.g., 0.5 = half size)'),
  fit: fitSchema.optional().default('contain').describe('Resize fit mode'),
})

const compositeLayerSchema = z.object({
  input: imageInputSchema.describe('Image URL to overlay'),
  resize: layerResizeSchema.optional().describe('Resize the layer before compositing'),
  gravity: gravitySchema.optional().describe('Position anchor. Use ALONE without top/left.'),
  top: z.number().int().optional().describe('Absolute Y from top edge. Use with left, WITHOUT gravity.'),
  left: z.number().int().optional().describe('Absolute X from left edge. Use with top, WITHOUT gravity.'),
  blend: blendSchema.optional().describe('Blend mode'),
  opacity: z.number().min(0).max(1).optional().describe('Opacity 0-1'),
})

const compositeImagesSchema = z.object({
  base: imageInputSchema.describe('Base image URL (e.g., poster)'),
  layers: z.array(compositeLayerSchema).min(1).describe('Images to overlay'),
})

const resizeImageSchema = z.object({
  input: imageInputSchema,
  width: z.number().int().positive().optional().describe('Target width'),
  height: z.number().int().positive().optional().describe('Target height'),
  fit: fitSchema.optional().default('cover').describe('Resize fit mode'),
  background: z.string().optional().describe('Background color (e.g., #ffffff)'),
  extract: z.object({
    left: z.number().int().min(0),
    top: z.number().int().min(0),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).optional().describe('Crop region'),
})

const transformImageSchema = z.object({
  input: imageInputSchema,
  rotate: z.number().optional().describe('Rotation angle in degrees'),
  flip: z.boolean().optional().describe('Vertical flip'),
  flop: z.boolean().optional().describe('Horizontal flip'),
})

const adjustImageSchema = z.object({
  input: imageInputSchema,
  modulate: z.object({
    brightness: z.number().min(0).optional().describe('Brightness multiplier (1 = no change)'),
    saturation: z.number().min(0).optional().describe('Saturation multiplier (1 = no change)'),
    hue: z.number().optional().describe('Hue rotation in degrees'),
  }).optional(),
  sharpen: z.object({
    sigma: z.number().min(0.01).max(10).describe('Sharpening sigma'),
  }).optional(),
  blur: z.number().min(0.3).max(100).optional().describe('Blur sigma'),
  greyscale: z.boolean().optional().describe('Convert to greyscale'),
  negate: z.boolean().optional().describe('Invert colors'),
})

const getImageMetadataSchema = z.object({
  input: imageInputSchema,
})

// ==================== Tool Names ====================

export enum ImageEditToolName {
  CompositeImages = 'compositeImages',
  ResizeImage = 'resizeImage',
  TransformImage = 'transformImage',
  AdjustImage = 'adjustImage',
  GetImageMetadata = 'getImageMetadata',
}

// ==================== Helper Functions ====================

async function loadImageFromUrl(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxContentLength: 50 * 1024 * 1024, // 50MB limit
  })
  return Buffer.from(response.data)
}

function parseColor(color: string): { r: number, g: number, b: number, alpha: number } {
  const hex = color.replace('#', '')
  if (hex.length === 6) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      alpha: 1,
    }
  }
  if (hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      alpha: Number.parseInt(hex.slice(6, 8), 16) / 255,
    }
  }
  return { r: 255, g: 255, b: 255, alpha: 1 }
}

async function resizeLayer(
  layerImage: sharp.Sharp,
  resize: { width?: number, height?: number, scale?: number, fit?: string } | undefined,
  originalWidth: number,
  originalHeight: number,
): Promise<{ image: sharp.Sharp, width: number, height: number }> {
  if (!resize) {
    return { image: layerImage, width: originalWidth, height: originalHeight }
  }

  let targetWidth: number | undefined
  let targetHeight: number | undefined

  if (resize.scale) {
    targetWidth = Math.round(originalWidth * resize.scale)
    targetHeight = Math.round(originalHeight * resize.scale)
  }
  else {
    targetWidth = resize.width
    targetHeight = resize.height
  }

  if (!targetWidth && !targetHeight) {
    return { image: layerImage, width: originalWidth, height: originalHeight }
  }

  const resized = layerImage.resize({
    width: targetWidth,
    height: targetHeight,
    fit: (resize.fit || 'contain') as keyof FitEnum,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })

  const metadata = await resized.metadata()
  return { image: resized, width: metadata.width!, height: metadata.height! }
}

// ==================== MCP Service ====================

@Injectable()
export class ImageEditMcp {
  private readonly logger = new Logger(ImageEditMcp.name)

  constructor(
    private readonly assetsService: AssetsService,
  ) {}

  private createCompositeImagesTool(userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      ImageEditToolName.CompositeImages,
      `Composite multiple images onto a base image. Perfect for adding QR codes, logos, or watermarks to posters.

**Parameters:**
- base: Base image URL (e.g., poster background)
- layers: Array of overlay images with positioning
  - input: Overlay image URL
  - resize: Optional layer scaling
    - width/height: Target dimensions in pixels
    - scale: Scale factor (e.g., 0.5 = half size)
    - fit: Resize mode (contain, cover, fill, inside, outside)
  - gravity: Position anchor (northwest, north, northeast, west, center, east, southwest, south, southeast)
  - top/left: Absolute pixel coordinates from top-left corner
  - blend: Blend mode (over, multiply, screen, overlay, etc.)
  - opacity: Transparency 0-1

**IMPORTANT - Two positioning modes (mutually exclusive):**

Mode A - gravity only (anchor positioning):
  { "gravity": "southeast" } → places layer at bottom-right corner

Mode B - top/left only (absolute coordinates):
  { "top": 100, "left": 200 } → places layer at exact pixel position

Do NOT mix gravity with top/left - if both provided, gravity is ignored by Sharp.

**Example - QR code at bottom-right corner:**
{
  "base": "https://example.com/poster.jpg",
  "layers": [{
    "input": "https://example.com/qrcode.png",
    "resize": { "width": 150, "height": 150 },
    "gravity": "southeast"
  }]
}

**Example - Logo at absolute position:**
{
  "base": "https://example.com/poster.jpg",
  "layers": [{
    "input": "https://example.com/logo.png",
    "resize": { "scale": 0.5 },
    "top": 50,
    "left": 50
  }]
}`,
      compositeImagesSchema.shape,
      async ({ base, layers }) => {
        this.logger.debug({ base, layerCount: layers.length }, '[compositeImages] Starting')

        const baseBuffer = await loadImageFromUrl(base)
        let image = sharp(baseBuffer)

        const compositeInputs: sharp.OverlayOptions[] = []

        for (const layer of layers) {
          const layerBuffer = await loadImageFromUrl(layer.input)
          let layerImage = sharp(layerBuffer)

          // 1. 处理图层缩放
          const layerMetadata = await sharp(layerBuffer).metadata()
          const resized = await resizeLayer(
            layerImage,
            layer.resize,
            layerMetadata.width!,
            layerMetadata.height!,
          )
          layerImage = resized.image

          // 2. 处理透明度
          if (layer.opacity !== undefined && layer.opacity < 1) {
            const { data, info } = await layerImage.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
            const pixels = new Uint8Array(data)
            for (let i = 3; i < pixels.length; i += 4) {
              pixels[i] = Math.round(pixels[i] * layer.opacity)
            }
            layerImage = sharp(Buffer.from(pixels), {
              raw: { width: info.width, height: info.height, channels: 4 },
            })
          }

          const processedLayerBuffer = await layerImage.toBuffer()

          // 3. 直接传递定位参数给 Sharp
          compositeInputs.push({
            input: processedLayerBuffer,
            gravity: layer.gravity as Gravity,
            top: layer.top,
            left: layer.left,
            blend: (layer.blend || 'over') as Blend,
          })
        }

        image = image.composite(compositeInputs)

        const outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer()

        const result = await this.assetsService.uploadFromBuffer(userId, outputBuffer, {
          type: AssetType.ImageEdit,
          mimeType: 'image/png',
          filename: 'composite.png',
        }, 'image-edit')

        this.logger.debug({ url: result.url }, '[compositeImages] Completed')
        return {
          content: [
            {
              type: 'resource_link',
              uri: result.url,
              name: `Image`,
            },
            { type: 'text', text: `Image composited successfully. URL: ${result.url}` },
          ],
        }
      },
    )
  }

  private createResizeImageTool(userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      ImageEditToolName.ResizeImage,
      `Resize, crop, or extend an image.

**Parameters:**
- input: Image URL
- width/height: Target dimensions (at least one required for resize)
- fit: Resize mode
  - cover: Crop to fill (default)
  - contain: Fit within bounds, may add padding
  - fill: Stretch to exact size
  - inside: Fit within bounds, no upscaling
  - outside: Cover bounds, may exceed
- background: Padding color for contain mode (e.g., #ffffff)
- extract: Crop region { left, top, width, height }

**Example - Resize to 800x600:**
{ "input": "https://...", "width": 800, "height": 600, "fit": "cover" }

**Example - Crop center region:**
{ "input": "https://...", "extract": { "left": 100, "top": 100, "width": 500, "height": 500 } }`,
      resizeImageSchema.shape,
      async ({ input, width, height, fit, background, extract }) => {
        this.logger.debug({ input, width, height, fit, extract }, '[resizeImage] Starting')

        const buffer = await loadImageFromUrl(input)
        let image = sharp(buffer)

        if (extract) {
          image = image.extract(extract)
        }

        if (width || height) {
          const resizeOptions: sharp.ResizeOptions = {
            width,
            height,
            fit: fit as keyof FitEnum,
          }
          if (background) {
            resizeOptions.background = parseColor(background)
          }
          image = image.resize(resizeOptions)
        }

        const outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer()

        const result = await this.assetsService.uploadFromBuffer(userId, outputBuffer, {
          type: AssetType.ImageEdit,
          mimeType: 'image/png',
          filename: 'resized.png',
        }, 'image-edit')

        this.logger.debug({ url: result.url }, '[resizeImage] Completed')
        return successResult(`Image resized successfully. URL: ${result.url}`)
      },
    )
  }

  private createTransformImageTool(userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      ImageEditToolName.TransformImage,
      `Apply geometric transformations to an image.

**Parameters:**
- input: Image URL
- rotate: Rotation angle in degrees (positive = clockwise)
- flip: Vertical flip (mirror top-bottom)
- flop: Horizontal flip (mirror left-right)

**Example - Rotate 90 degrees:**
{ "input": "https://...", "rotate": 90 }

**Example - Horizontal flip:**
{ "input": "https://...", "flop": true }`,
      transformImageSchema.shape,
      async ({ input, rotate, flip, flop }) => {
        this.logger.debug({ input, rotate, flip, flop }, '[transformImage] Starting')

        const buffer = await loadImageFromUrl(input)
        let image = sharp(buffer)

        if (rotate !== undefined) {
          image = image.rotate(rotate)
        }
        if (flip) {
          image = image.flip()
        }
        if (flop) {
          image = image.flop()
        }

        const outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer()

        const result = await this.assetsService.uploadFromBuffer(userId, outputBuffer, {
          type: AssetType.ImageEdit,
          mimeType: 'image/png',
          filename: 'transformed.png',
        }, 'image-edit')

        this.logger.debug({ url: result.url }, '[transformImage] Completed')
        return {
          content: [
            {
              type: 'resource_link',
              uri: result.url,
              name: `Image`,
            },
            { type: 'text', text: `Image transformed successfully. URL: ${result.url}` },
          ],
        }
      },
    )
  }

  private createAdjustImageTool(userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      ImageEditToolName.AdjustImage,
      `Adjust image appearance: brightness, contrast, saturation, sharpness, blur.

**Parameters:**
- input: Image URL
- modulate: Color adjustments
  - brightness: Multiplier (1 = no change, 0.5 = darker, 2 = brighter)
  - saturation: Multiplier (1 = no change, 0 = greyscale, 2 = vivid)
  - hue: Rotation in degrees
- sharpen: { sigma: 0.01-10 } - higher = sharper
- blur: Blur sigma 0.3-100 - higher = more blur
- greyscale: Convert to black & white
- negate: Invert colors

**Example - Increase brightness and saturation:**
{ "input": "https://...", "modulate": { "brightness": 1.2, "saturation": 1.3 } }

**Example - Apply blur:**
{ "input": "https://...", "blur": 5 }`,
      adjustImageSchema.shape,
      async ({ input, modulate, sharpen, blur, greyscale, negate }) => {
        this.logger.debug({ input, modulate, sharpen, blur, greyscale, negate }, '[adjustImage] Starting')

        const buffer = await loadImageFromUrl(input)
        let image = sharp(buffer)

        if (modulate) {
          image = image.modulate(modulate)
        }
        if (sharpen) {
          image = image.sharpen({ sigma: sharpen.sigma })
        }
        if (blur) {
          image = image.blur(blur)
        }
        if (greyscale) {
          image = image.greyscale()
        }
        if (negate) {
          image = image.negate()
        }

        const outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer()

        const result = await this.assetsService.uploadFromBuffer(userId, outputBuffer, {
          type: AssetType.ImageEdit,
          mimeType: 'image/png',
          filename: 'adjusted.png',
        }, 'image-edit')

        this.logger.debug({ url: result.url }, '[adjustImage] Completed')
        return {
          content: [
            {
              type: 'resource_link',
              uri: result.url,
              name: `Image`,
            },
            { type: 'text', text: `Image adjusted successfully. URL: ${result.url}` },
          ],
        }
      },
    )
  }

  private createGetImageMetadataTool(_userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      ImageEditToolName.GetImageMetadata,
      `Get image metadata (dimensions, format, color space).

**Parameters:**
- input: Image URL

**Returns:**
- width, height: Image dimensions in pixels
- format: Image format (jpeg, png, webp, etc.)
- channels: Number of color channels (3 = RGB, 4 = RGBA)
- hasAlpha: Whether image has transparency

**Example:**
{ "input": "https://example.com/image.png" }`,
      getImageMetadataSchema.shape,
      async ({ input }) => {
        this.logger.debug({ input }, '[getImageMetadata] Starting')

        const buffer = await loadImageFromUrl(input)
        const metadata = await sharp(buffer).metadata()

        const result = {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha,
          space: metadata.space,
          density: metadata.density,
        }

        this.logger.debug({ metadata: result }, '[getImageMetadata] Completed')

        return successResult(`Image Metadata:
- Dimensions: ${result.width}x${result.height} pixels
- Format: ${result.format}
- Channels: ${result.channels} (${result.hasAlpha ? 'with alpha' : 'no alpha'})
- Color Space: ${result.space || 'unknown'}
- Density: ${result.density || 'unknown'} DPI`)
      },
    )
  }

  createServer(userId: string, userType: UserType): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({
      name: McpServerName.ImageEdit,
      version: '1.0.0',
      tools: [
        this.createCompositeImagesTool(userId, userType),
        this.createResizeImageTool(userId, userType),
        this.createTransformImageTool(userId, userType),
        this.createAdjustImageTool(userId, userType),
        this.createGetImageMetadataTool(userId, userType),
      ],
    })
  }
}
