export interface GooglePlacePhoto {
  photoReference: string
  url?: string
  width: number
  height: number
  attributions: string[]
}

export interface GooglePlaceReview {
  authorName: string
  authorPhoto?: string
  rating: number
  text?: string
  language?: string
  time: number
  relativeTimeDescription?: string
}

export interface GooglePlaceOpeningHours {
  day: number
  open?: string
  close?: string
  isClosed: boolean
}

export interface GooglePlacePreview {
  placeId: string
  name: string
  formattedAddress?: string
  lat?: number
  lng?: number
  phone?: string
  website?: string
  rating?: number
  userRatingsTotal?: number
  priceLevel?: number
  types?: string[]
  url?: string
  openingHours?: GooglePlaceOpeningHours[]
  photos?: GooglePlacePhoto[]
  reviews?: GooglePlaceReview[]
}
