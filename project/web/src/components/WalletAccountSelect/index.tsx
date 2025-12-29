'use client'

import type { UserWalletAccount } from '@/api/userWalletAccount'
// using payment API shape (id, userName, email, account, type, ...)
import { Empty, Select, Spin } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { getWalletAccountListApi } from '@/api/payment'
import { useTransClient } from '@/app/i18n/client'

interface Props {
  value?: string
  onChange?: (val?: string) => void
  pageSize?: number
  disabled?: boolean
}

const { Option } = Select

export default function WalletAccountSelect(props: Props) {
  const { value, onChange, pageSize = 50, disabled } = props
  const { t } = useTransClient('wallet')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<any[]>([])
  const [pageNo, setPageNo] = useState(1)
  const [total, setTotal] = useState(0)

  const hasMore = useMemo(() => list.length < total, [list.length, total])

  useEffect(() => {
    fetchPage(1)
  }, [])

  async function fetchPage(nextPage: number) {
    setLoading(true)
    try {
      // Use payment API which returns { data: { page, pageSize, totalPages, total, list: [] } }
      const res: any = await getWalletAccountListApi({ page: nextPage, pageSize })
      if (res && res.data && res.data.list) {
        const rawList = res.data.list || []
        const newList = nextPage === 1 ? rawList : [...list, ...rawList]
        setList(newList)
        setTotal(res.data.total || 0)
        setPageNo(nextPage)
      }
    }
    finally {
      setLoading(false)
    }
  }

  function onPopupScroll(e: any) {
    const target = e.target
    if (!loading && hasMore && target.scrollTop + target.offsetHeight + 24 >= target.scrollHeight) {
      fetchPage(pageNo + 1)
    }
  }

  return (
    <Select
      showSearch
      placeholder={t('selectWalletPlaceholder') || '选择提现钱包账户'}
      optionFilterProp="children"
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ width: '100%' }}
      onPopupScroll={onPopupScroll}
      notFoundContent={loading ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('messages.noData') || '暂无账户'} />}
      filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}
    >
      {list.map(item => (
        <Option key={item.id || item._id} value={item.id || item._id}>
          {`${item.userName || item.email} · ${item.type || ''} · ${item.account || ''}`}
        </Option>
      ))}
    </Select>
  )
}
