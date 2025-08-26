import { z } from 'zod';
import { AccountType } from '@/transports/account/common';

export const GetAuthPageSchema = z.object({
  accountType: z.nativeEnum(AccountType, { required_error: '平台类型' }),
});
