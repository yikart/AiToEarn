/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-01-21 21:35:35
 * @LastEditors: nevin
 * @Description: 平台用户
 */
import { Entity, PrimaryColumn, Column } from 'typeorm';
import { TempModel } from './temp';

@Entity({ name: 'user' })
export class UserModel extends TempModel {
  @PrimaryColumn({ type: 'varchar', nullable: false, comment: '用户id' }) // 主键
  id!: string;

  @Column({ type: 'varchar', nullable: false, comment: '用户名称' })
  name!: string;

  @Column({ type: 'varchar', nullable: false, comment: '用户手机号' })
  phone!: string;

  @Column({ type: 'datetime', nullable: false, comment: '登录时间' })
  loginTime!: Date;
}
