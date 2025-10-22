export const NatsApi = {
  manager: {
    manager: {
      createByAccount: 'manager.manager.createByAccount',
      getInfoByAccount: 'manager.manager.getInfoByAccount',
    },
  },
  user: {
    income: {
      add: 'user.income.add',
      deduct: 'user.income.deduct',
    },
    user: {
      getUserInfoById: 'user.user.getUserInfoById',
    },
  },
  account: {
    account: {
      listByIds: 'account.account.listByIds',
      getUserAccounts: 'account.account.getUserAccounts',
      getAccountInfo: 'account.account.getAccountInfo',
      updateAccountInfo: 'account.account.updateAccountInfo',
      updateAccountStatistics: 'account.account.updateAccountStatistics',
      updateAccountStatus: 'account.account.updateAccountStatus',
      getAccountListByIds: 'account.account.getAccountListByIds',
      getUserAccountCount: 'account.account.getUserAccountCount',
      deleteUserAccount: 'account.account.deleteUserAccount',
      deleteUserAccounts: 'account.account.deleteUserAccounts',
      getAccountByParam: 'account.account.getAccountByParam',
    },
    group: {
      create: 'account.group.create',
      deleteList: 'account.group.deleteList',
      getList: 'account.group.getList',
      update: 'account.group.update',
    },
  },
  plat: {
    publish: {
      create: 'plat.publish.create',
      del: 'plat.publish.del',
    },
    bilibili: {
      archiveTypeList: 'plat.bilibili.archiveTypeList',
    },
    kwai: {
      authUrl: 'plat.kwai.authUrl',
      addKwaiAccount: 'plat.kwai.addKwaiAccount',
    },
    wxGzh: {
      getAccountAuthInfo: 'plat.wxPlat.getAccountAuthInfo',
      authUrl: 'plat.wxPlat.authUrl',
      videoInit: 'plat.wxPlat.videoInit',
      uploadVideoPart: 'plat.wxPlat.uploadVideoPart',
      videoComplete: 'plat.wxPlat.videoComplete',
      coverUpload: 'plat.wxPlat.coverUpload',
      uploadLitVideo: 'plat.wxPlat.uploadLitVideo',
      archiveAddByUtoken: 'plat.wxPlat.archiveAddByUtoken',
      archiveTypeList: 'plat.wxPlat.archiveTypeList',
      getAuthInfo: 'plat.wxPlat.getAuthInfo',
      archiveList: 'plat.wxPlat.archiveList',
      userStat: 'plat.wxPlat.userStat',
      arcStat: 'plat.wxPlat.arcStat',
      arcIncStat: 'plat.wxPlat.arcIncStat',
    },
    youtube: {
      getVideoCategories: 'plat.youtube.getVideoCategories',
    },
    pinterest: {
      getUserAccount: 'plat.pinterest.getUserAccount',
      createAdAccount: 'plat.pinterest.createAdAccount',
      getAdAccountById: 'plat.pinterest.getAdAccountById',
      getAdAccountList: 'plat.pinterest.getAdAccountList',
      createBoard: 'plat.pinterest.createBoard',
      getBoardList: 'plat.pinterest.getBoardList',
      getBoardById: 'plat.pinterest.getBoardById',
      delBoardById: 'plat.pinterest.delBoardById',
      createPin: 'plat.pinterest.createPin',
      getPinById: 'plat.pinterest.getPinById',
      getPinList: 'plat.pinterest.getPinList',
      delPinById: 'plat.pinterest.delPinById',
    },
    tiktok: {
      authUrl: 'plat.tiktok.authUrl',
      getAuthInfo: 'plat.tiktok.getAuthInfo',
      createAccountAndSetAccessToken:
        'plat.tiktok.createAccountAndSetAccessToken',
      refreshAccessToken: 'plat.tiktok.refreshAccessToken',
      revokeAccessToken: 'plat.tiktok.revokeAccessToken',
      getCreatorInfo: 'plat.tiktok.getCreatorInfo',
      initVideoPublish: 'plat.tiktok.initVideoPublish',
      initPhotoPublish: 'plat.tiktok.initPhotoPublish',
      getPublishStatus: 'plat.tiktok.getPublishStatus',
      uploadVideoFile: 'plat.tiktok.uploadVideoFile',
    },
    twitter: {
      authUrl: 'plat.twitter.authUrl',
      getAuthInfo: 'plat.twitter.getAuthInfo',
      createAccountAndSetAccessToken:
        'plat.twitter.createAccountAndSetAccessToken',
    },
  },
  publish: {
    pubRecord: {
      create: 'publish.pubRecord.create',
      del: 'publish.pubRecord.delete',
      info: 'publish.pubRecord.info',
      list: 'publish.pubRecord.list',
      updateStatus: 'publish.pubRecord.updateStatus',
    },
  },
  content: {
    material: {
      create: 'content.material.create',
      preview: 'content.material.preview',
      startTask: 'content.material.startTask',
      del: 'content.material.delete',
      updateInfo: 'content.material.updateInfo',
      info: 'content.material.info',
      list: 'content.material.list',
      listByIds: 'content.material.listByIds',
      optimalByIds: 'content.material.optimalByIds',
      optimalInGroup: 'content.material.optimalInGroup',
    },
    materialGroup: {
      create: 'content.materialGroup.create',
      del: 'content.materialGroup.delete',
      updateInfo: 'content.materialGroup.update',
      info: 'content.materialGroup.info',
      list: 'content.materialGroup.list',
    },
    media: {
      create: 'content.media.create',
      del: 'content.media.delete',
      info: 'content.media.info',
      list: 'content.media.list',
    },
    mediaGroup: {
      create: 'content.mediaGroup.create',
      del: 'content.mediaGroup.delete',
      update: 'content.mediaGroup.update',
      info: 'content.mediaGroup.info',
      list: 'content.mediaGroup.list',
    },
  },
  chanel: {
    ping: 'chanel.ping',
  },
  other: {
    feedback: {
      create: 'other.feedback.create',
    },
    notification: {
      createForUser: 'other.notification.createForUser',
    },
    appConfigs: {
      getInfo: 'other.appConfigs.getInfo',
      update: 'other.appConfigs.update',
      batchUpdate: 'other.appConfigs.batchUpdate',
      delete: 'other.appConfigs.delete',
      getList: 'other.appConfigs.getList',
    },
  },
  task: {
    task: {
      create: 'task.admin.task.create',
      update: 'task.admin.task.update',
      delete: 'task.admin.task.delete',
      updateStatus: 'task.admin.task.updateStatus',
      list: 'task.admin.task.list',
      info: 'task.admin.task.info',
      publish: 'task.admin.task.publish',
    },
    userTask: {
      list: 'task.admin.userTask.list',
      info: 'task.admin.userTask.info',
    },
    material: {
      create: 'task.admin.material.create',
      regenerate: 'task.admin.material.regenerate',
      get: 'task.admin.material.get',
      listByTaskId: 'task.admin.material.listByTaskId',
    },
    notification: {
      create: 'task.admin.notification.create',
      list: 'task.admin.notification.list',
      delete: 'task.admin.notification.delete',
    },
    matcher: {
      create: 'task.admin.matcher.create',
      get: 'task.admin.matcher.get',
      update: 'task.admin.matcher.update',
      delete: 'task.admin.matcher.delete',
      list: 'task.admin.matcher.list',
    },
  },
  payment: {
    admin: {
      checkout: {
        list: 'payment.admin.checkout.list',
        refund: 'admin.payment.refund',
        subscription: 'admin.payment.subscription',
        unsubscribe: 'admin.payment.subscription',
      },
    },
  },
}
