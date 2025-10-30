import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { QueryUserListDto, UpdateUserStatusDto } from './dto/user-admin.dto';
import { AppHttpException } from '../filters/http-exception.filter';
import { ErrHttpBack } from '../filters/http-exception.back-code';
import { Manager } from '../auth/manager.guard';

@Manager()
@Controller('admin/user')
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  // @ApiOperation({ summary: '获取用户列表' })
  @Get('list')
  async getUserList(@Query() query: QueryUserListDto) {
    return this.userService.getUserList(query);
  }

  // @ApiOperation({ summary: '获取用户详情' })
  @Get('info/:id')
  async getUserDetail(@Param('id') id: string) {
    const userInfo = await this.userService.getUserInfoById(id);
    if (!userInfo) throw new AppHttpException(ErrHttpBack.err_user_no_had);
    return userInfo;
  }

  // @ApiOperation({ summary: '更新用户状态' })
  @Put(':id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    const userInfo = await this.userService.getUserInfoById(id);
    if (!userInfo) throw new AppHttpException(ErrHttpBack.err_user_no_had);

    return this.userService.updateUserStatus(id, body.status);
  }

  // 删除用户
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const userInfo = await this.userService.getUserInfoById(id);
    if (!userInfo) throw new AppHttpException(ErrHttpBack.err_user_no_had);

    return this.userService.deleteUser(userInfo);
  }

  // 用户总数
  @Get('count')
  async getUserCount() {
    return this.userService.getUserCount();
  }
}
