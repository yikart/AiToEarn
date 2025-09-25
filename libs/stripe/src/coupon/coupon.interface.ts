export interface IDuration {
  forever: 'forever'
  once: 'once'
}

export interface ICoupon {
  percent_off: number
  duration: IDuration
}
