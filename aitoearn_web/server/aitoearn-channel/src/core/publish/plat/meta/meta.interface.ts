import { PublishTask } from '@/libs/database/schema/publishTask.schema';
import { DoPubRes } from '../../common';

export interface PublishMetaPostTask {
  id: string;
}

export interface MetaPostPublisher {
  publish: (task: PublishTask) => Promise<DoPubRes>
}
