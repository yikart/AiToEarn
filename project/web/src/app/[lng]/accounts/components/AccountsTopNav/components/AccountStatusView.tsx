import type { SocialAccount } from '@/api/types/account.type'
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { AccountStatus } from '@/app/config/accountConfig'
import { useTransClient } from '@/app/i18n/client'

function AccountStatusView({ account }: { account: SocialAccount }) {
  const { t } = useTransClient('account')
  if (account.status === AccountStatus.USABLE) {
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <CheckCircleOutlined className="text-xs" />
        {t('online')}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-xs text-warning">
      <WarningOutlined className="text-xs" />
      {t('offline')}
    </span>
  )
}

export default AccountStatusView
