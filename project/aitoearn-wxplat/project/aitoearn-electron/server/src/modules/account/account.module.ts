import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../../db/schema/account.schema';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AccountGroupController } from './accountGroup/accountGroup.controller';
import { AccountGroupService } from './accountGroup/accountGroup.service';
import {
  AccountGroup,
  AccountGroupSchema,
} from '../../db/schema/accountGroup.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    MongooseModule.forFeature([
      { name: AccountGroup.name, schema: AccountGroupSchema },
    ]),
  ],
  providers: [AccountService, AccountGroupService],
  controllers: [AccountController, AccountGroupController],
  exports: [AccountService, AccountGroupService],
})
export class AccountModule {}
