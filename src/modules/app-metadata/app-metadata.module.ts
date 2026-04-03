import { Module } from '@nestjs/common'
import { AppMetadataController } from './app-metadata.controller'
import { AppMetadataService } from './app-metadata.service'

@Module({
  controllers: [AppMetadataController],
  providers: [AppMetadataService],
  exports: [AppMetadataService],
})
export class AppMetadataModule {}
