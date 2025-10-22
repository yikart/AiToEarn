import { Injectable } from '@nestjs/common'
import { TaskMatcher, TaskMatcherRepository } from '@yikart/task-db'
import {
  CreateTaskMatcherDto,
  QueryTaskMatcherDto,
  UpdateTaskMatcherDto,
} from './task-matcher.dto'

@Injectable()
export class TaskMatcherService {
  constructor(
    private readonly taskOpportunityRepository: TaskMatcherRepository,
  ) { }

  async create(createDto: CreateTaskMatcherDto): Promise<TaskMatcher> {
    return await this.taskOpportunityRepository.create(createDto)
  }

  async findById(id: string): Promise<TaskMatcher | null> {
    return await this.taskOpportunityRepository.findById(id)
  }

  async update(updateDto: UpdateTaskMatcherDto): Promise<TaskMatcher | null> {
    return await this.taskOpportunityRepository.update(updateDto.id, updateDto)
  }

  async delete(id: string) {
    return await this.taskOpportunityRepository.delete(id)
  }

  async getList(query: QueryTaskMatcherDto) {
    return await this.taskOpportunityRepository.getList({
      pageNo: query.pageNo,
      pageSize: query.pageSize,
    }, query)
  }
}
