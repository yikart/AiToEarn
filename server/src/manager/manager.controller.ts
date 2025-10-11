import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ManagerService } from './manager.service';
import {
  CreateManagerDto,
  LoginDto,
  UpdateManagerDto,
} from './dto/manager.dto';
import { AuthService } from '../auth/auth.service';
import { Manager } from '../auth/manager.guard';
import { GetToken, Public } from '../auth/auth.guard';
import { TokenInfo } from '../auth/interfaces/auth.interfaces';
import { validatePassWord } from '../util/password.util';
import { AppHttpException } from '../filters/http-exception.filter';
import { ErrHttpBack } from '../filters/http-exception.back-code';

@ApiTags('manager - 管理员')
@Controller('manager')
export class ManagerController {
  constructor(
    private readonly managerService: ManagerService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: '管理员登录' })
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const manager = await this.managerService.findByAccount(loginDto.account);
    if (!manager) {
      throw new AppHttpException(ErrHttpBack.err_user_no_had);
    }

    const isValid = validatePassWord(
      manager.password,
      manager.salt,
      loginDto.password,
    );
    if (!isValid) {
      throw new AppHttpException(ErrHttpBack.err_no_power_login);
    }

    const token = await this.authService.generateToken({
      id: manager.id,
      phone: manager.phone || '',
      name: manager.name,
      isManager: true,
    });

    return {
      token,
      managerInfo: manager,
    };
  }

  @ApiOperation({ summary: '获取管理员信息' })
  @Manager()
  @Get('info')
  async getInfo(@GetToken() token: TokenInfo) {
    return this.managerService.findById(token.id);
  }

  @ApiOperation({ summary: '创建管理员' })
  @Manager()
  @Post()
  async create(@Body() createManagerDto: CreateManagerDto) {
    const existManager = await this.managerService.findByAccount(
      createManagerDto.account,
    );
    if (existManager) {
      throw new AppHttpException(ErrHttpBack.err_user_had);
    }
    return this.managerService.create(createManagerDto);
  }

  @ApiOperation({ summary: '更新管理员信息' })
  @Manager()
  @Put()
  async update(
    @GetToken() token: TokenInfo,
    @Body() updateManagerDto: UpdateManagerDto,
  ) {
    return this.managerService.update(token.id, updateManagerDto);
  }

  @ApiOperation({ summary: '删除管理员' })
  @Manager()
  @Delete()
  async delete(@GetToken() token: TokenInfo) {
    return this.managerService.delete(token.id);
  }
}
