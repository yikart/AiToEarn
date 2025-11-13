import type { TableProps } from 'antd'
import type { CSSProperties } from 'react'
import type { ViralTitle } from '@/api/types/viralTitles'
import Icon from '@ant-design/icons'
import { Table, Typography } from 'antd'
import { useTransClient } from '@/app/i18n/client'
import { describeNumber } from '@/utils'
import hotContentStyles from '../../HotContent/hotContent.module.scss'
import hotEventStyles from '../../HotEvent/hotEvent.module.scss'
import styles from '../hotTitle.module.scss'
import HotTitleBackSvg from '../svgs/hotTitleBack.svg'

export function HotTitleItem({
  data,
  style,
  bottomLinkText,
  onBottomLinkClick,
  headRightElement,
}: {
  data: {
    category: string
    titles: ViralTitle[]
  }
  bottomLinkText: string
  onBottomLinkClick: () => void
  style?: CSSProperties
  headRightElement?: React.ReactNode
}) {
  const { t } = useTransClient('hot-content')
  const columns: TableProps<ViralTitle>['columns'] = [
    {
      title: t('rank'),
      width: 50,
      render: (text, data, ind) => (
        <>
          {ind <= 2
            ? (
                <div
                  className={hotContentStyles.rankingTopthree}
                  style={{ width: '20px', height: '20px', lineHeight: '20px' }}
                >
                  {ind + 1}
                </div>
              )
            : (
                <p style={{ width: '20px', textAlign: 'center' }}>{ind + 1}</p>
              )}
        </>
      ),
    },
    {
      title: t('viralTitles'),
      render: (text, data, ind) => (
        <div className="hotTitleItem-title">
          <Typography.Paragraph copyable={{ text: data.title }}>
            {data.title}
          </Typography.Paragraph>
        </div>
      ),
    },
    {
      title: t('engagement'),
      width: 100,
      align: 'center',
      render: (text, data, ind) => <>{describeNumber(data.engagement)}</>,
    },
  ]

  return (
    <div className={`${styles.hotTitleItem} hotTitleItem`} style={style}>
      <div className="hotTitleItem-head">
        <div className="hotTitleItem-head-left">
          <div className="hotTitleItem-head-name">{data.category}</div>
          <Icon component={HotTitleBackSvg} />
        </div>
        {headRightElement}
      </div>
      <div
        className={`hotTitleItem-content ${hotEventStyles['hotEvent-item-content']}`}
      >
        <Table
          dataSource={data.titles}
          columns={columns}
          rowKey={record => record._id}
          pagination={false}
          scroll={{ y: 400 }}
          onRow={(record) => {
            return {
              onClick: () => {
                if (!record.url)
                  return
                window.open(record.url, '_blank')
              },
            }
          }}
        />
        <a
          onClick={(e) => {
            e.preventDefault()
            onBottomLinkClick()
          }}
        >
          {bottomLinkText}
        </a>
      </div>
    </div>
  )
}
