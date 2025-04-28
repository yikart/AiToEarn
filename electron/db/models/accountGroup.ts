import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { TempModel } from './temp';

/**
 * 账户组
 * 与账户表关联
 */
@Entity({ name: 'accountGroup' })
export class AccountGroupModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id!: number;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '组名称',
  })
  name!: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: '组代理IP',
  })
  proxyIp?: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: '组排序',
    default: 1,
  })
  rank!: number;
}
