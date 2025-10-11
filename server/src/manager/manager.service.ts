import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Manager, ManagerStatus } from '../db/schema/manager.schema';
import { CreateManagerDto, UpdateManagerDto } from './dto/manager.dto';
import { encryptPassword } from '../util/password.util';

@Injectable()
export class ManagerService {
  constructor(
    @InjectModel(Manager.name)
    private readonly managerModel: Model<Manager>,
  ) {}

  async findByAccount(account: string) {
    return this.managerModel.findOne({
      account,
      status: ManagerStatus.OPEN,
    });
  }

  async findById(id: string) {
    return this.managerModel.findById(id);
  }

  async create(createManagerDto: CreateManagerDto) {
    const { password, salt } = encryptPassword(createManagerDto.password);
    const manager = new this.managerModel({
      ...createManagerDto,
      password,
      salt,
    });
    return manager.save();
  }

  async update(id: string, updateManagerDto: UpdateManagerDto) {
    if (updateManagerDto.password) {
      const { password, salt } = encryptPassword(updateManagerDto.password);
      updateManagerDto.password = password;
      updateManagerDto.salt = salt;
    }
    return this.managerModel.findByIdAndUpdate(
      id,
      { $set: updateManagerDto },
      { new: true },
    );
  }

  async delete(id: string) {
    return this.managerModel.findByIdAndUpdate(
      id,
      { $set: { status: ManagerStatus.DELETE } },
      { new: true },
    );
  }
}
