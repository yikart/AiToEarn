import { LoginService } from '../../src/user/login.service';

export function mockSmsService() {
  const originalLoginService = jest.spyOn(
    LoginService.prototype,
    'postPhoneLoginCode',
  );
  originalLoginService.mockImplementation(async () => true);

  const originalVerifyCode = jest.spyOn(
    LoginService.prototype,
    'verifyPhoneCode',
  );
  originalVerifyCode.mockImplementation(
    async (phone, code) => code === '123456',
  );

  return {
    restore: () => {
      originalLoginService.mockRestore();
      originalVerifyCode.mockRestore();
    },
  };
}
