import { z } from 'zod'

// ========== Volcengine Track Structure Schema (matches volcengine.interface.ts) ==========

// TransformFilter - 2D Transform
export const transformFilterSchema = z.object({
  Type: z.literal('transform').describe('Filter type'),
  PosX: z.number().describe('Element top-left X coordinate (pixels). Full-screen video MUST use 0, NOT canvas center!'),
  PosY: z.number().describe('Element top-left Y coordinate (pixels). Full-screen video MUST use 0, NOT canvas center!'),
  Width: z.number().describe('Element width (pixels)'),
  Height: z.number().describe('Element height (pixels)'),
  Rotation: z.number().optional().describe('Rotation angle [-360, 360], clockwise positive, rotates around element center'),
  FlipX: z.boolean().optional().describe('Horizontal mirror flip'),
  FlipY: z.boolean().optional().describe('Vertical mirror flip'),
  Alpha: z.number().optional().describe('Opacity [0,1], 0 is transparent'),
})

// LutFilter - Color Filter
export const lutFilterSchema = z.object({
  Type: z.literal('lut_filter').describe('Filter type'),
  TargetTime: z.tuple([z.number(), z.number()]).describe('Filter time range in element [startMs, endMs]'),
  Source: z.string().describe('Filter ID'),
  Intensity: z.number().optional().describe('Filter intensity [0,1]'),
})

// EffectFilter - Visual Effect
export const effectFilterSchema = z.object({
  Type: z.literal('effect_filter').describe('Filter type'),
  TargetTime: z.tuple([z.number(), z.number()]).describe('Filter time range in element [startMs, endMs]'),
  Source: z.string().describe('Effect ID'),
})

// TransitionFilter - Transition
export const transitionFilterSchema = z.object({
  Type: z.literal('transition').describe('Filter type'),
  Source: z.string().describe('Transition ID'),
  Duration: z.number().describe('Transition duration (milliseconds)'),
})

// CropFilter - Area Crop
export const cropFilterSchema = z.object({
  Type: z.literal('crop').describe('Filter type'),
  PosX: z.number().describe('Crop area top-left X coordinate (pixels), NOT center point'),
  PosY: z.number().describe('Crop area top-left Y coordinate (pixels), NOT center point'),
  Width: z.number().describe('Crop area width (pixels)'),
  Height: z.number().describe('Crop area height (pixels)'),
})

// TrimFilter - Time Trim
export const trimFilterSchema = z.object({
  Type: z.literal('trim').describe('Filter type'),
  StartTime: z.number().describe('Trim start time (milliseconds)'),
  EndTime: z.number().describe('Trim end time (milliseconds)'),
})

// SpeedFilter - Playback Speed
export const speedFilterSchema = z.object({
  Type: z.literal('speed').describe('Filter type'),
  Speed: z.number().describe('Playback speed [0.1, 4]'),
})

// VideoAnimationsFilter - Video Animation
export const videoAnimationsFilterSchema = z.object({
  Type: z.literal('video_animation').describe('Filter type'),
  AnimRes: z.string().describe('Video animation ID'),
  AnimStartTime: z.number().describe('Animation start time (milliseconds)'),
  AnimEndTime: z.number().describe('Animation end time (milliseconds)'),
  AnimLoop: z.boolean().optional().describe('Whether to loop'),
  AnimLoopDuration: z.number().optional().describe('Loop animation duration (milliseconds)'),
})

// TextAnimationsFilter - Text Animation
export const textAnimationsFilterSchema = z.object({
  Type: z.literal('text_animation').describe('Filter type'),
  AnimInRes: z.string().optional().describe('Enter animation ID'),
  AnimInDuration: z.number().optional().describe('Enter animation duration (milliseconds)'),
  AnimOutRes: z.string().optional().describe('Exit animation ID'),
  AnimOutDuration: z.number().optional().describe('Exit animation duration (milliseconds)'),
  AnimLoopRes: z.string().optional().describe('Loop animation ID'),
  AnimLoopDuration: z.number().optional().describe('Loop animation duration (milliseconds)'),
})

// AudioFadeFilter - Audio Fade
export const audioFadeFilterSchema = z.object({
  Type: z.literal('a_fade').describe('Filter type'),
  FadeIn: z.number().optional().describe('Fade in time (milliseconds)'),
  FadeOut: z.number().optional().describe('Fade out time (milliseconds)'),
})

// AudioVolumeFilter - Volume Control
export const audioVolumeFilterSchema = z.object({
  Type: z.literal('a_volume').describe('Filter type'),
  Volume: z.number().describe('Volume, 0 is mute, 1 is default'),
})

// EqFilter - Image Equalizer
export const eqFilterSchema = z.object({
  Type: z.literal('equalizer').describe('Filter type'),
  TargetTime: z.tuple([z.number(), z.number()]).describe('Filter time range in element [startMs, endMs]'),
  Brightness: z.number().optional().describe('Brightness [0, 1]'),
  Saturation: z.number().optional().describe('Saturation [0, 1]'),
  Tone: z.number().optional().describe('Tone [0, 1]'),
})

// DelogoFilter - Local Blur
export const delogoFilterSchema = z.object({
  Type: z.literal('delogo').describe('Filter type'),
  TargetTime: z.tuple([z.number(), z.number()]).describe('Filter time range in element [startMs, endMs]'),
  DelogoType: z.string().optional().describe('Delogo type, default gaussian'),
  PosX: z.number().describe('Local blur area top-left X coordinate (pixels), NOT center point'),
  PosY: z.number().describe('Local blur area top-left Y coordinate (pixels), NOT center point'),
  Width: z.number().describe('Local blur area width (pixels)'),
  Height: z.number().describe('Local blur area height (pixels)'),
  Sigma: z.number().optional().describe('Blur intensity [10,70]'),
  Radius: z.number().optional().describe('Blur radius [10,70]'),
})

// GaussianFilter - Gaussian Blur
export const gaussianFilterSchema = z.object({
  Type: z.literal('gaussian').describe('Filter type'),
  TargetTime: z.tuple([z.number(), z.number()]).describe('Filter time range in element [startMs, endMs]'),
  Radius: z.number().describe('Gaussian blur radius [10,70]'),
  Sigma: z.number().describe('Gaussian blur intensity [10,70]'),
})

// Filter Union Schema
export const filterSchema = z.union([
  transformFilterSchema,
  lutFilterSchema,
  effectFilterSchema,
  transitionFilterSchema,
  cropFilterSchema,
  trimFilterSchema,
  speedFilterSchema,
  videoAnimationsFilterSchema,
  textAnimationsFilterSchema,
  audioFadeFilterSchema,
  audioVolumeFilterSchema,
  eqFilterSchema,
  delogoFilterSchema,
  gaussianFilterSchema,
]).describe('Filter effect')

// TrackElement Schema
export const trackElementSchema = z.object({
  Type: z.enum(['video', 'audio', 'image', 'text', 'subtitle', 'effect', 'gaussian', 'text_roll']).describe('Element type'),
  Source: z.string().optional().describe('Resource source: vid://xxx, mid://xxx, tos://xxx or URL'),
  TargetTime: z.tuple([z.number(), z.number()]).describe('Track time range [startMs, endMs], in milliseconds'),
  // text/subtitle specific fields
  Text: z.string().optional().describe('Text content'),
  TextRes: z.string().optional().describe('Fancy text ID'),
  FontType: z.string().optional().describe('Font ID'),
  FontSize: z.number().optional().describe('Font size (pixels)'),
  FontColor: z.string().optional().describe('Font color (RGBA)'),
  BackgroundColor: z.string().optional().describe('Font background color (RGBA)'),
  BorderColor: z.string().optional().describe('Font border color (RGBA)'),
  BorderWidth: z.number().optional().describe('Font border width'),
  LineMaxWidth: z.number().optional().describe('Auto line wrap width [-1, 1]'),
  Typesetting: z.number().optional().describe('Text direction: 0=horizontal, 1=vertical'),
  AlignType: z.number().optional().describe('Text alignment'),
  // Extra - Filter list
  Extra: z.array(filterSchema).optional().describe('Extra effects list (Filters)'),
}).describe('Track element')

// Canvas Schema
export const canvasSchema = z.object({
  Width: z.number().describe('Canvas width (pixels)'),
  Height: z.number().describe('Canvas height (pixels)'),
  BackgroundColor: z.string().optional().describe('Canvas background color (RGBA)'),
})

// Codec Schema
export const codecSchema = z.object({
  VideoCodec: z.string().optional().describe('Video codec: h264, h265, vp9'),
  AudioCodec: z.string().optional().describe('Audio codec: aac'),
  VideoBitRate: z.number().optional().describe('Video bitrate (bps)'),
  AudioBitrate: z.number().optional().describe('Audio bitrate (kbps)'),
  Crf: z.number().optional().describe('Constant quality factor [0,51]'),
  Preset: z.string().optional().describe('Encoding speed preset'),
})

// Output Schema
export const outputSchema = z.object({
  Fps: z.number().optional().describe('Output frame rate'),
  DisableVideo: z.boolean().optional().describe('Output audio only'),
  DisableAudio: z.boolean().optional().describe('Output video only'),
  Alpha: z.boolean().optional().describe('Include Alpha channel'),
  Codec: codecSchema.optional().describe('Codec settings'),
})

// submitDirectEditTask Schema
export const submitDirectEditTaskSchema = z.object({
  Canvas: canvasSchema.optional().describe('Canvas configuration (optional — auto-detected from primary video source if omitted)'),
  Output: outputSchema.optional().describe('Output configuration'),
  Track: z.array(z.array(trackElementSchema)).describe('Track array, outer array is render layer (higher index = higher layer), inner array is elements on same track'),
})

export const getVideoEditTaskStatusSchema = z.object({
  taskId: z.string().describe('Task ID (returned by submitDirectEditTask)'),
})

export enum VideoEditToolName {
  SubmitDirectEditTask = 'submitDirectEditTask',
  GetVideoEditTaskStatus = 'getVideoEditTaskStatus',
}
