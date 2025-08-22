export interface AddPoints {
  userId: string
  amount: number
  type: string
  description: string
  metadata: Record<string, any>
}
