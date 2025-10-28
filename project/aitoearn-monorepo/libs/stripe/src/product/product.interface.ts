export interface IProduct {
  id?: string
  name?: string
  images?: string[]
  metadata?: object
  default_price?: number | null
  active: boolean
}
