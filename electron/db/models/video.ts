/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-02-12 18:32:28
 * @LastEditors: nevin
 * @Description: 视频发布记录
 */
import { Entity, Column } from 'typeorm';
import {
  ILableValue as ILableValueP,
  WorkData,
  DiffParmasType as DiffParmasTypeP,
} from './workData';

export type ILableValue = ILableValueP;

export type DiffParmasType = DiffParmasTypeP;

@Entity({ name: 'video' })
export class VideoModel extends WorkData {
  // 视频路径
  @Column({ type: 'varchar', nullable: true, comment: '视频路径' })
  videoPath?: string;
}
