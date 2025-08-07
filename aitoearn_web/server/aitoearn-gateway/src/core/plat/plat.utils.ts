import { AccountNatsApi } from '@transports/account/account.natsApi'
import { Account } from '@transports/account/comment'

// 添加账户方法
export async function AddAccount(account: Account, accountNatsApi: AccountNatsApi) {
  if (!account)
    return null
  const res: Account = await accountNatsApi.createAccount({
    ...account,
    account: account?.id,
    _id: undefined,
  })
  return res
}
