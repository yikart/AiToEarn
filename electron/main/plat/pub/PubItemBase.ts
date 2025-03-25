import { AccountModel } from '../../../db/models/account';
import { PlatformBase } from '../PlatformBase';
import { WorkData } from '../../../db/models/workData';
import { VisibleTypeEnum } from '../../../../commont/publish/PublishEnum';

export abstract class PubItemBase {
  accountModel: AccountModel;
  platform: PlatformBase;

  /**
   * 通用发布参数解析
   * @param workData
   */
  commonParamsParse(workData: WorkData) {
    return {
      ...workData,
      cookies: JSON.parse(this.accountModel.loginCookie),
      desc: workData.desc!,
      title: workData.title || '',
      topics: workData.topics || [],
      coverPath: workData.coverPath || '',
      visibleType: workData.visibleType || VisibleTypeEnum.Private,
      diffParams: workData.diffParams || {},
      timingTime: workData.timingTime,
      location: workData.location,
    };
  }

  protected constructor(accountModel: AccountModel, platform: PlatformBase) {
    this.accountModel = accountModel;
    this.platform = platform;
  }
}
