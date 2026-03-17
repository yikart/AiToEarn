import { Module } from '@nestjs/common'
import { ClaudeCodeRouterService } from './claude-code-router.service'

@Module({
  providers: [ClaudeCodeRouterService],
  exports: [ClaudeCodeRouterService],
})
export class ClaudeCodeRouterModule {
  constructor(private readonly claudeCodeRouterService: ClaudeCodeRouterService) {}
}
