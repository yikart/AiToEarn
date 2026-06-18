import { describe, expect, it } from 'vitest'
import { PlatformErrorCategory } from '../platforms/platforms.exception'
import {
  categoryFromGoogleApiError,
  googleApiErrorReason,
  googleApiPlatformCode,
  googleApiPlatformMessage,
  isGoogleApiErrorRetryable,
} from './google-api-error.util'

describe('google api error classifier', () => {
  it('classifies Google error reasons before falling back to HTTP status', () => {
    const body = {
      error: {
        code: 403,
        message: 'Quota exceeded.',
        status: 'RESOURCE_EXHAUSTED',
        errors: [
          {
            reason: 'quotaExceeded',
            message: 'Daily Limit Exceeded',
          },
        ],
      },
    }

    expect(categoryFromGoogleApiError(403, body)).toBe(PlatformErrorCategory.Quota)
    expect(isGoogleApiErrorRetryable(403, body)).toBe(false)
    expect(googleApiPlatformCode(body)).toBe('RESOURCE_EXHAUSTED')
    expect(googleApiPlatformMessage(body)).toBe('Daily Limit Exceeded')
  })

  it('classifies rate limit reasons as retryable', () => {
    const body = {
      error: {
        code: 403,
        message: 'Rate Limit Exceeded',
        errors: [
          {
            reason: 'userRateLimitExceeded',
          },
        ],
      },
    }

    expect(categoryFromGoogleApiError(403, body)).toBe(PlatformErrorCategory.RateLimit)
    expect(isGoogleApiErrorRetryable(403, body)).toBe(true)
  })

  it('classifies OAuth token errors as auth failures', () => {
    const body = {
      error: 'invalid_grant',
      error_description: 'Bad Request',
    }

    expect(categoryFromGoogleApiError(400, body)).toBe(PlatformErrorCategory.Auth)
    expect(googleApiPlatformCode(body)).toBe('invalid_grant')
    expect(googleApiPlatformMessage(body)).toBe('Bad Request')
  })

  it('reads structured Google API error reasons', () => {
    const body = {
      error: {
        code: 400,
        message: 'The <code>snippet.categoryId</code> property specifies an invalid category ID.',
        errors: [
          {
            reason: 'invalidCategoryId',
            location: 'body.snippet.categoryId',
            locationType: 'other',
          },
        ],
      },
    }

    expect(googleApiErrorReason(body)).toBe('invalidCategoryId')
  })
})
