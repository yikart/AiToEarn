import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { ProductDto } from './product.dto'
import { ProductService } from './product.service'

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
  ) {}

  // 获取产品信息
  @Get('/:id')
  async getProductById(
    @Param('id') id: string,
  ) {
    return this.productService.getProductById(id)
  }

  // 创建产品信息
  @Post()
  async create(
      @Payload() body: ProductDto,
  ) {
    return this.productService.create(body)
  }

  // 更新产品
  @Put('/:id')
  async modify(
    @Param('id') id: string,
    @Payload() body: ProductDto,
  ) {
    return this.productService.modify(id, body)
  }

  // 更新产品
  @Delete('/:id')
  async del(
    @Param('id') id: string,
  ) {
    return this.productService.del(id)
  }
}
