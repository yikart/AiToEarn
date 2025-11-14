import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Resource } from '@rekog/mcp-nest'
import { TestService } from './test.service'

@ApiTags('OpenSource/Core/Test/Test')
@Controller()
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Resource({
    uri: 'mcp://hello-world/{userName}',
    name: 'HelloWorld',
    description: 'A simple greeting resource',
    mimeType: 'text/plain',
  })
  async getCurrentSchema({ uri, userName }) {
    return {
      contents: [
        {
          uri,
          text: `User is ${userName}`,
          mimeType: 'text/plain',
        },
      ],
    }
  }
}
