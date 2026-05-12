import { Injectable, Logger } from '@nestjs/common'
import { getUser } from '@yikart/common'
import { Tool } from '@yikart/nest-mcp'
import { z } from 'zod'
import { EngagementService } from '../channel/engagement/engagement.service'
import { EngagementRecordService } from '../channel/engagement/engagement.record.service'
import { EngagementTaskStatus, EngagementTaskType } from '@yikart/channel-db'

const GetAvailableEngagementTasksSchema = z.object({
  limit: z.number().int().positive().default(10).describe('Maximum number of tasks to return'),
  taskType: z.enum(EngagementTaskType).optional().describe('Filter by task type: LIKE, FAVORITE, COMMENT, REPLY'),
  platform: z.string().optional().describe('Filter by platform'),
})

const ClaimEngagementTaskSchema = z.object({
  taskId: z.string().describe('The engagement task ID to claim'),
  accountId: z.string().describe('Account ID to use for the task'),
  userId: z.string().optional().describe('User ID (optional, will use current user if not provided)'),
})

const GetEngagementTaskDetailsSchema = z.object({
  taskId: z.string().describe('The engagement task ID'),
})

const GetMyEngagementTasksSchema = z.object({
  status: z.enum(EngagementTaskStatus).optional().describe('Filter by task status'),
  limit: z.number().int().positive().default(20).describe('Maximum number of tasks to return'),
})

@Injectable()
export class TaskMcpController {
  private readonly logger = new Logger(TaskMcpController.name)

  constructor(
    private readonly engagementService: EngagementService,
    private readonly engagementRecordService: EngagementRecordService,
  ) {}

  @Tool({
    name: 'getAvailableEngagementTasks',
    description: 'Get available engagement tasks that can be claimed. Engagement tasks include: liking posts, favoriting/bookmarking posts, commenting on posts, and replying to comments. Returns a list of tasks with their IDs, platform, task type, and post information.',
    parameters: GetAvailableEngagementTasksSchema,
  })
  async getAvailableEngagementTasks(params: z.infer<typeof GetAvailableEngagementTasksSchema>) {
    const { limit, taskType, platform } = params

    try {
      const tasks = await this.engagementRecordService.listAvailableEngagementTasks({
        limit,
        taskType,
        platform,
      })

      if (tasks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No available engagement tasks found at the moment.',
            },
          ],
        }
      }

      const formatted = tasks.map(task => {
        const lines = [
          `Task ID: ${task.id}`,
          `Platform: ${task.platform}`,
          `Task Type: ${task.taskType}`,
          `Post ID: ${task.postId}`,
          `Status: ${task.status}`,
        ]
        if (task.prompt) {
          lines.push(`Prompt: ${task.prompt}`)
        }
        return lines.join('\n')
      }).join('\n\n---\n\n')

      return {
        content: [
          {
            type: 'text',
            text: `Available Engagement Tasks:\n\n${formatted}`,
          },
        ],
      }
    } catch (error) {
      this.logger.error('Failed to get available engagement tasks', error)
      return {
        content: [
          {
            type: 'text',
            text: `Error getting available tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  }

  @Tool({
    name: 'claimEngagementTask',
    description: 'Claim an engagement task to work on it. Once claimed, you will need to perform the engagement action (like, favorite, comment, or reply) using the appropriate platform account.',
    parameters: ClaimEngagementTaskSchema,
  })
  async claimEngagementTask(params: z.infer<typeof ClaimEngagementTaskSchema>) {
    const user = getUser()
    const { taskId, accountId, userId } = params
    const targetUserId = userId || user.id

    try {
      const result = await this.engagementRecordService.claimEngagementTask(taskId, {
        accountId,
        userId: targetUserId,
      })

      if (!result) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to claim task ${taskId}. The task may already be claimed or does not exist.`,
            },
          ],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Task ${taskId} claimed successfully using account ${accountId}. You can now perform the ${result.taskType} engagement action on post ${result.postId}.`,
          },
        ],
      }
    } catch (error) {
      this.logger.error(`Failed to claim task ${taskId}`, error)
      return {
        content: [
          {
            type: 'text',
            text: `Error claiming task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  }

  @Tool({
    name: 'getEngagementTaskDetails',
    description: 'Get detailed information about a specific engagement task including the post ID, target platform, task type, required actions, and current status.',
    parameters: GetEngagementTaskDetailsSchema,
  })
  async getEngagementTaskDetails(params: z.infer<typeof GetEngagementTaskDetailsSchema>) {
    const { taskId } = params

    try {
      const task = await this.engagementRecordService.getEngagementTask(taskId)

      if (!task) {
        return {
          content: [
            {
              type: 'text',
              text: `Engagement task ${taskId} not found`,
            },
          ],
          isError: true,
        }
      }

      const lines = [
        `Task ID: ${task.id}`,
        `Platform: ${task.platform}`,
        `Task Type: ${task.taskType}`,
        `Post ID: ${task.postId}`,
        `Status: ${task.status}`,
        `Model: ${task.model}`,
        `Sub Tasks: ${task.completedSubTaskCount}/${task.subTaskCount} completed`,
      ]

      if (task.prompt) {
        lines.push(`Prompt: ${task.prompt}`)
      }
      if (task.targetScope) {
        lines.push(`Target Scope: ${task.targetScope}`)
      }
      if (task.targetIds && task.targetIds.length > 0) {
        lines.push(`Target IDs: ${task.targetIds.join(', ')}`)
      }

      return {
        content: [
          {
            type: 'text',
            text: `Engagement Task Details:\n\n${lines.join('\n')}`,
          },
        ],
      }
    } catch (error) {
      this.logger.error(`Failed to get task details for ${taskId}`, error)
      return {
        content: [
          {
            type: 'text',
            text: `Error getting task details: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  }

  @Tool({
    name: 'getMyEngagementTasks',
    description: 'Get engagement tasks that the current user has claimed. Use this to see tasks you are currently working on or have completed.',
    parameters: GetMyEngagementTasksSchema,
  })
  async getMyEngagementTasks(params: z.infer<typeof GetMyEngagementTasksSchema>) {
    const user = getUser()
    const { status, limit } = params

    try {
      const tasks = await this.engagementRecordService.getEngagementTasksByUserId(user.id, {
        status,
        limit,
      })

      if (tasks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'You have not claimed any engagement tasks yet.',
            },
          ],
        }
      }

      const formatted = tasks.map(task => {
        const lines = [
          `Task ID: ${task.id}`,
          `Platform: ${task.platform}`,
          `Task Type: ${task.taskType}`,
          `Post ID: ${task.postId}`,
          `Status: ${task.status}`,
          `Progress: ${task.completedSubTaskCount}/${task.subTaskCount} sub-tasks completed`,
        ]
        return lines.join('\n')
      }).join('\n\n---\n\n')

      return {
        content: [
          {
            type: 'text',
            text: `My Engagement Tasks:\n\n${formatted}`,
          },
        ],
      }
    } catch (error) {
      this.logger.error('Failed to get my engagement tasks', error)
      return {
        content: [
          {
            type: 'text',
            text: `Error getting my tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  }
}