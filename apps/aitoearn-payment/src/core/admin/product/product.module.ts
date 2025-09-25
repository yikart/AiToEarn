import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Product, ProductSchema } from '@/libs/database/schema/product.schema'
import { ProductApiModule } from '@/libs/stripe/product/productApi.module'
import { AdminProductController } from './product.controller'
import { AdminProductService } from './product.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    ProductApiModule,
  ],
  controllers: [AdminProductController],
  providers: [AdminProductService],
})
export class AdminProductModule {}
