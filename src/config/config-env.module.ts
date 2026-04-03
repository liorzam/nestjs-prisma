import { Global, Module } from '@nestjs/common'
import { ConfigEnvService } from './config-env.service';


@Global()
@Module({
  providers: [ConfigEnvService],
  exports: [ConfigEnvService],
})
export class ConfigEnvModule {}
