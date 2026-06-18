export enum GoogleBusinessOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export interface GoogleBusinessLocation {
  name: string
  title: string
  websiteUri?: string
  metadata?: {
    canDelete?: boolean
    mapsUri?: string
    newReviewUri?: string
    placeId?: string
  }
  profile?: {
    description?: string
  }
  storefrontAddress?: {
    addressLines?: string[]
    locality?: string
    administrativeArea?: string
    postalCode?: string
    regionCode?: string
  }
  regularHours?: {
    periods?: GoogleBusinessTimePeriod[]
  }
  moreHours?: Array<{
    hoursTypeId?: string
    periods?: GoogleBusinessTimePeriod[]
  }>
  serviceItems?: GoogleBusinessServiceItem[]
}

export interface GoogleBusinessTimePeriod {
  openDay?: string
  openTime?: string
  closeDay?: string
  closeTime?: string
}

export interface GoogleBusinessServiceItem {
  structuredServiceItem?: {
    serviceTypeId?: string
    description?: string
  }
  freeFormServiceItem?: {
    categoryId?: string
    label?: {
      displayName?: string
      description?: string
    }
  }
}

export interface GoogleBusinessFollowersMetadata {
  count?: number | string
}

export interface GoogleBusinessAccount {
  name: string
  accountName: string
  type: string
  role: string
  verificationState?: string
}
