/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: 工具箱
 */
import { Inject, Injectable } from '../core/decorators';
import { UserService } from '../user/service';
import { AccountService } from '../account/service';
import { InteractionService } from '../interaction/service';

@Injectable()
export class ToolsService {
  @Inject(UserService)
  private readonly userService!: UserService;
  @Inject(AccountService)
  private readonly accountService!: AccountService;
  @Inject(InteractionService)
  private readonly interactionService!: InteractionService;

  // 获取用户列表
  async getUserList() {
    return await this.userService.getUsers();
  }

  // 获取账户列表
  async getAccountList(userId: string) {
    return await this.accountService.getAccounts(userId);
  }

  // 获取自动互动列表
  async getAutorInteractionList(account: any, worksList: any, option: any) {
    return await this.interactionService.autorInteraction(
        account,
        worksList,  
        {
            commentContent: option.commentContent || null, 
            platform: option.accountType, // 平台
            likeProb: 100, // 点赞概率
            collectProb: 100, // 收藏概率
            commentProb: 100, // 评论概率
            commentType: 'ai', // 评论类型
        }

    );
  }
}
