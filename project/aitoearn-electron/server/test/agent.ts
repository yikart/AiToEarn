import * as supertest from 'supertest';
import { INestApplication } from '@nestjs/common';

export class Agent {
  private static _app: INestApplication;

  private static _agent: supertest.Agent;

  public static app(): INestApplication {
    return Agent._app;
  }

  public static async initialize(app: INestApplication): Promise<void> {
    Agent._app = app;

    const agent = supertest.agent(Agent._app.getHttpServer());
    Agent._agent = agent;
  }

  public static get() {
    return Agent._agent;
  }

  public static login(token: string) {
    this._agent.set('Authorization', `Bearer ${token}`);
  }
}
