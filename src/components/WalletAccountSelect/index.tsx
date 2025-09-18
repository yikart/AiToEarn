"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, Spin, Empty } from "antd";
import { getUserWalletAccountList, UserWalletAccount } from "@/api/userWalletAccount";

type Props = {
  value?: string;
  onChange?: (val?: string) => void;
  pageSize?: number;
  disabled?: boolean;
};

const { Option } = Select;

export default function WalletAccountSelect(props: Props) {
  const { value, onChange, pageSize = 50, disabled } = props;
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<UserWalletAccount[]>([]);
  const [pageNo, setPageNo] = useState(1);
  const [total, setTotal] = useState(0);

  const hasMore = useMemo(() => list.length < total, [list.length, total]);

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPage(nextPage: number) {
    setLoading(true);
    try {
      const res = await getUserWalletAccountList(nextPage, pageSize);
      if (res?.data) {
        const newList = nextPage === 1 ? (res.data.list || []) : [...list, ...(res.data.list || [])];
        setList(newList);
        setTotal(res.data.total || 0);
        setPageNo(nextPage);
      }
    } finally {
      setLoading(false);
    }
  }

  function onPopupScroll(e: any) {
    const target = e.target;
    if (!loading && hasMore && target.scrollTop + target.offsetHeight + 24 >= target.scrollHeight) {
      fetchPage(pageNo + 1);
    }
  }

  return (
    <Select
      showSearch
      placeholder="选择提现钱包账户"
      optionFilterProp="children"
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ width: "100%" }}
      onPopupScroll={onPopupScroll}
      notFoundContent={loading ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无账户" />}
      filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}
    >
      {list.map((item) => (
        <Option key={item._id} value={item._id}>
          {item.userName || item.mail} · {item.type} · {item.account}
        </Option>
      ))}
    </Select>
  );
}


