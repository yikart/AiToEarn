export enum VipStatus {
  none = 'none',
  expired = 'expired',
  trialing = 'trialing',
  monthly_once = 'monthly_once',
  yearly_once = 'yearly_once',
  active_monthly = 'active_monthly',
  active_yearly = 'active_yearly',
  active_nonrenewing = 'active_nonrenewing',
}

export const VipActiveStatusArr = [
  VipStatus.trialing,
  VipStatus.monthly_once,
  VipStatus.yearly_once,
  VipStatus.active_monthly,
  VipStatus.active_yearly,
  VipStatus.active_nonrenewing,
]
