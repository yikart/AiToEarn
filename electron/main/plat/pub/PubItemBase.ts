import { AccountModel } from '../../../db/models/account';
import { PlatformBase } from '../PlatformBase';

export abstract class PubItemBase {
  accountModel: AccountModel;
  platform: PlatformBase;

  protected constructor(accountModel: AccountModel, platform: PlatformBase) {
    this.accountModel = accountModel;
    this.platform = platform;
  }
}
