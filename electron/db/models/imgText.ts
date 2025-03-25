/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-02-12 18:32:28
 * @LastEditors: nevin
 * @Description: 视频发布记录
 */
import { Column, Entity } from 'typeorm';
import { WorkData } from './workData';

@Entity({ name: 'imgText' })
export class ImgTextModel extends WorkData {
  @Column({ type: 'json', nullable: true, comment: '多个图片的路径' })
  imagesPath?: string[];
}
