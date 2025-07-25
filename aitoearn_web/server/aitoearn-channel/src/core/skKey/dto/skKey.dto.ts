import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateSkKeySchema = z.object({
  userId: z.string({ required_error: '用户ID' }),
  desc: z.string({ required_error: '描述' }).optional(),
});
export class CreateSkKeyDto extends createZodDto(CreateSkKeySchema) {}

export const SkKeyKeySchema = z.object({
  key: z.string({ required_error: 'key' }),
});
export class SkKeyKeyDto extends createZodDto(SkKeyKeySchema) {}

export const UpSkKeyInfoSchema = z.object({
  key: z.string({ required_error: 'key' }),
  desc: z.string({ required_error: '描述' }),
});
export class UpSkKeyInfoDto extends createZodDto(UpSkKeyInfoSchema) {}

export const GetSkKeyListSchema = z.object({
  userId: z.string({ required_error: '用户ID' }),
  pageNo: z.number().default(1),
  pageSize: z.number().default(10),
});
export class GetSkKeyListDto extends createZodDto(GetSkKeyListSchema) {}

export const AddRefAccountSchema = z.object({
  key: z.string({ required_error: '用户ID' }),
  accountId: z.string({ required_error: '用户ID' }),
});
export class AddRefAccountDto extends createZodDto(AddRefAccountSchema) {}

export const GetRefAccountListSchema = z.object({
  key: z.string({ required_error: 'key' }),
  pageNo: z.number().default(1),
  pageSize: z.number().default(10),
});
export class GetRefAccountListDto extends createZodDto(GetRefAccountListSchema) {}
