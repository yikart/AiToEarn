import { Model } from 'mongoose'

export class BaseRepository<T> {
  constructor(
    protected readonly model: Model<T>,
  ) {}
}
