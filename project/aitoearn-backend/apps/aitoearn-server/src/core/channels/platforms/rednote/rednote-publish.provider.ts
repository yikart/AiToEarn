import type {
  NormalizedPublishTask,
  PublishNormalizeInput,
  PublishProvider,
  PublishProviderResult,
  PublishPublishInput,
  PublishValidateInput,
  PublishValidationResult,
} from '../platforms.interface'
import type { RedNoteOption } from './rednote.schema'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { RedNoteWorkProvider } from './rednote-work.provider'

interface RedNoteDataOption {
  dataId: string
  uniqueId: string
}

@Injectable()
export class RedNotePublishProvider implements PublishProvider<RedNoteOption, RedNoteDataOption> {
  readonly platform = AccountType.RedNote

  constructor(private readonly workProvider: RedNoteWorkProvider) {}

  async validate(input: PublishValidateInput<RedNoteOption>): Promise<PublishValidationResult> {
    if (!input.option?.workLink) {
      return {
        valid: false,
        issues: [{
          code: PublishValidationIssueCode.Required,
          path: ['option', 'workLink'],
          params: { field: PublishValidationField.Option },
        }],
      }
    }

    try {
      await this.workProvider.getWorkLinkInfo(input.option.workLink)
    }
    catch {
      return {
        valid: false,
        issues: [{
          code: PublishValidationIssueCode.InvalidOption,
          path: ['option', 'workLink'],
          params: { field: PublishValidationField.Option },
        }],
      }
    }

    return { valid: true }
  }

  async normalize(input: PublishNormalizeInput<RedNoteOption>): Promise<NormalizedPublishTask<RedNoteOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<RedNoteOption>): Promise<PublishProviderResult<RedNoteDataOption>> {
    const workLink = input.option?.workLink
    if (!workLink) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const workLinkInfo = await this.workProvider.getWorkLinkInfo(workLink)
    const extra = workLinkInfo.extra

    return {
      status: 200,
      platformWorkId: extra.dataId,
      permalink: extra.resolvedUrl ?? workLink,
      originalWorkLink: extra.originalWorkLink,
      workStatus: extra.workStatus,
      dataOption: {
        dataId: extra.dataId,
        uniqueId: extra.uniqueId,
      },
    }
  }
}
