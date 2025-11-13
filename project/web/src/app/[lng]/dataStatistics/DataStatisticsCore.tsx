'use client'

import { Spin } from 'antd'
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import DataStatisticsDetails from '@/app/[lng]/dataStatistics/components/DataStatisticsDetails'
import DataStatisticsHeader from '@/app/[lng]/dataStatistics/components/DataStatisticsHeader'
import DataStatisticsTable from '@/app/[lng]/dataStatistics/components/DataStatisticsTable'
import { useDataStatisticsStore } from '@/app/[lng]/dataStatistics/useDataStatistics'
import { useAccountStore } from '@/store/account'
import styles from './dataStatistics.module.scss'

export function DataStatisticsCore() {
  const {
    setChoosedGroupIds,
    setFilteredAccountList,
    choosedGroupIds,
    getStatistics,
    timeRangeValue,
    init,
    filteredAccountList,
    currentDetailType,
    sortingData,
    loading,
    accountSearchValue,
  } = useDataStatisticsStore(
    useShallow(state => ({
      setChoosedGroupIds: state.setChoosedGroupIds,
      setFilteredAccountList: state.setFilteredAccountList,
      choosedGroupIds: state.choosedGroupIds,
      init: state.init,
      getStatistics: state.getStatistics,
      timeRangeValue: state.timeRangeValue,
      filteredAccountList: state.filteredAccountList,
      currentDetailType: state.currentDetailType,
      sortingData: state.sortingData,
      loading: state.loading,
      accountSearchValue: state.accountSearchValue,
    })),
  )
  const { accountGroupList, accountList } = useAccountStore(
    useShallow(state => ({
      accountGroupList: state.accountGroupList,
      accountList: state.accountList,
    })),
  )

  useEffect(() => {
    init()
  }, [])

  // 数据明细切换，重新分拣数据
  useEffect(() => {
    sortingData()
  }, [currentDetailType, sortingData])

  // 获取数据统计
  useEffect(() => {
    getStatistics()
  }, [timeRangeValue, getStatistics, filteredAccountList])

  // 初始化选择所有账户组
  useEffect(() => {
    if (accountGroupList.length > 0) {
      setChoosedGroupIds(accountGroupList.map(group => group.id))
    }
  }, [setChoosedGroupIds, accountGroupList])

  // 过滤账户
  useEffect(() => {
    setFilteredAccountList(
      accountList.filter((v) => {
        return (
          choosedGroupIds.includes(v.groupId)
          && v.nickname.includes(accountSearchValue)
        )
      }),
    )
  }, [choosedGroupIds, accountList, accountSearchValue])

  return (
    <Spin spinning={loading}>
      <div className={styles.dataStatistics}>
        <DataStatisticsHeader />
        <DataStatisticsDetails />
        <DataStatisticsTable />
      </div>
    </Spin>
  )
}
