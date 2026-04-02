import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getRoot(): { name: string; docs: string } {
    return {
      name: 'nestjs-agent',
      docs: 'See AGENTS.md and docs/architecture.md',
    }
  }
}
