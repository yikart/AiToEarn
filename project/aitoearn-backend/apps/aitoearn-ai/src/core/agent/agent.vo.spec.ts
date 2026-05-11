import { AgentMessageType, AgentMessageVoHelper } from './agent.vo'

describe('AgentMessageVoHelper', () => {
  it('should parse valid agent messages', () => {
    expect(AgentMessageVoHelper.create({
      type: AgentMessageType.User,
      content: 'hello',
    })).toEqual({
      type: AgentMessageType.User,
      content: 'hello',
    })
  })
})
