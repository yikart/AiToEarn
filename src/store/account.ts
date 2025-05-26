import { create } from 'zustand';
import { SocialAccount, getAccountListApi } from '@/api/apiReq';

interface AccountState {
  accounts: SocialAccount[];
  loading: boolean;
  fetchAccounts: () => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  loading: false,
  fetchAccounts: async () => {
    try {
      set({ loading: true });
      const response: any = await getAccountListApi();
      if (response?.code === 0 && response.data) {
        set({ accounts: response.data });
      }
    } catch (error) {
      console.error('获取账户列表失败:', error);
    } finally {
      set({ loading: false });
    }
  },
})); 