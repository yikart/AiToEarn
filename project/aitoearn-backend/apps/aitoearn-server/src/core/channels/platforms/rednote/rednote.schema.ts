import { z } from 'zod'

export const RedNoteOptionSchema = z.object({
  workLink: z.string().trim().min(1).describe('已完成的小红书作品链接'),
})

export type RedNoteOption = z.infer<typeof RedNoteOptionSchema>
