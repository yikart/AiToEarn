import { Agent } from './agent';
import { AuthService } from '../src/auth/auth.service';
import { user } from './mockData';
import { initApp } from './app';

beforeAll(async () => {
  const app = await initApp();

  await Agent.initialize(app);

  const authService = app.get(AuthService);
  const token = await authService.generateToken({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
  });

  Agent.login(token);
});

afterAll(async () => {
  await Agent.app().close();
});
