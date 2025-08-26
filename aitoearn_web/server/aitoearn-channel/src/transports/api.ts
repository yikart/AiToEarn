export const NatsApi = {
  user: {
    points: {
      add: 'user.points.add',
    },
  },
  account: {
    account: {
      create: 'account.account.create',
      getAccountInfo: 'account.account.getAccountInfo',
      updateAccountInfo: 'account.account.updateAccountInfo',
      getAccountByParam: 'account.account.getAccountByParam',
      updateAccountStatistics: 'account.account.updateAccountStatistics',
    },
  },
  channel: {
    wxPlat: {
      createAccountAndSetAccessToken: 'channel.wxPlat.createAccountAndSetAccessToken',
    },
  },
}
