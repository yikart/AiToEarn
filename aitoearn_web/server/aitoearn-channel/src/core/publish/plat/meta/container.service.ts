import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetaContainer, MetaMediaStatus } from '@/libs/database/schema/metaContainer.schema';
import { CreateMetaContainerDto } from '../../dto/meta.container.dto';

@Injectable()
export class MetaContainerService {
  constructor(
    @InjectModel(MetaContainer.name)
    private readonly metaPostMediaModel: Model<MetaContainer>,
  ) {}

  async createMetaPostMedia(
    data: CreateMetaContainerDto,
  ): Promise<MetaContainer> {
    const subPublishTask = new this.metaPostMediaModel(data);
    return subPublishTask.save();
  }

  async getContainers(publishId: string): Promise<MetaContainer[]> {
    return this.metaPostMediaModel.find({ publishId }).exec();
  }

  async getUnProcessedContainers(publishId: string): Promise<MetaContainer[]> {
    return this.metaPostMediaModel.find({ publishId, $or: [
      { status: MetaMediaStatus.CREATED },
      { status: MetaMediaStatus.IN_PROGRESS },
    ] }).exec();
  }

  async updateContainer(
    id: string,
    data: Partial<CreateMetaContainerDto>,
  ): Promise<MetaContainer | null> {
    return this.metaPostMediaModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    ).exec();
  }
}
