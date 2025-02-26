import { PubStatus } from '../../../db/models/pubRecord';

export interface PubVideoData {
  title: string;
  desc: string;
  videoPath: string;
  coverPath: string;
  otherInfo: Record<string, any>;
  publishTime?: Date;
  status?: PubStatus;
}
