import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from '../schemas'

export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getById(id: string) {
    return await this.userModel.findById(id).exec()
  }
}
