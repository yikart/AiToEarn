import { Injectable } from '@nestjs/common'

export interface CreditsHelperOperation {
  userId: string
  amount: number
  type?: unknown
  source?: unknown
  description?: string
  metadata?: Record<string, unknown>
  expiredAt?: Date | null
}

@Injectable()
export class CreditsHelperService {
  async getBalance(_userId: string): Promise<number> {
    return Number.MAX_SAFE_INTEGER
  }

  async addCredits(_data: CreditsHelperOperation): Promise<void> {}

  async deductCredits(_data: CreditsHelperOperation): Promise<void> {}
}
