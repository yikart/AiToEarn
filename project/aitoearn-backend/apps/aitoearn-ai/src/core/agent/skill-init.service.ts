import * as fs from 'node:fs'
import * as path from 'node:path'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'

const SKILL_DIRECTORIES = [
  'generating-images',
  'generating-videos',
  'editing-videos',
  'editing-images',
  'transferring-video-styles',
  'generating-drama-recaps',
  'composing-videos',
  'translating-videos',
  'removing-subtitles',
  'analyzing-videos',
  'managing-content',
  'crawling-social-media',
  'extracting-thumbnails',
] as const

@Injectable()
export class SkillInitService implements OnModuleInit {
  private readonly logger = new Logger(SkillInitService.name)
  private readonly sourceDir = path.join(__dirname, 'skills')
  private readonly targetDir = path.join(process.cwd(), '.claude-session', '.claude', 'skills')

  async onModuleInit(): Promise<void> {
    try {
      this.initializeSkills()
      this.logger.log(`Skills initialized: ${this.targetDir}`)
    }
    catch (error) {
      this.logger.error('Failed to initialize skills', error)
    }
  }

  private initializeSkills(): void {
    fs.mkdirSync(this.targetDir, { recursive: true })

    for (const skillName of SKILL_DIRECTORIES) {
      this.copySkillDirectory(skillName)
    }
  }

  private copySkillDirectory(skillName: string): void {
    const src = path.join(this.sourceDir, skillName)
    const dest = path.join(this.targetDir, skillName)

    if (!fs.existsSync(src)) {
      this.logger.warn(`Skill not found: ${skillName}`)
      return
    }

    fs.mkdirSync(dest, { recursive: true })

    for (const file of fs.readdirSync(src)) {
      const srcFile = path.join(src, file)
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, path.join(dest, file))
      }
    }
  }
}
