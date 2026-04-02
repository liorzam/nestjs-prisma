import { Test } from '@nestjs/testing'

import { AppService } from './app.service'

describe('AppService', () => {
  let service: AppService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AppService],
    }).compile()

    service = moduleRef.get(AppService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('getRoot returns project metadata', () => {
    expect(service.getRoot()).toEqual({
      name: 'nestjs-agent',
      docs: 'See AGENTS.md and docs/architecture.md',
    })
  })
})
