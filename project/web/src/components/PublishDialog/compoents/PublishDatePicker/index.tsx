import type {
  ForwardedRef,
} from 'react'
import { SendOutlined } from '@ant-design/icons'
import { Button, message, Popover } from 'antd'
import {
  forwardRef,
  memo,
  useState,
} from 'react'
import { useTransClient } from '@/app/i18n/client'
import styles from './publishDatePicker.module.scss'

export interface IPublishDatePickerRef {
}

export interface IPublishDatePickerProps {
  loading: boolean
  onClick: () => void
}

const PublishDatePicker = memo(
  forwardRef(
    (
      { loading, onClick }: IPublishDatePickerProps,
      ref: ForwardedRef<IPublishDatePickerRef>,
    ) => {
      const { t } = useTransClient('publish')
      const [menuOpen, setMenuOpen] = useState(false)

      return (
        <Button.Group size="large">
          <Popover rootClassName={styles.publishDatePicker} open={menuOpen} content="1" trigger="click" onOpenChange={(setMenuOpen)} arrow={false}>
            <Button
              style={{ margin: '0' }}
              onClick={() => {
                setMenuOpen(true)
              }}
            >
              {t('buttons.publishNow')}
            </Button>
          </Popover>
          <Button
            size="large"
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={() => {
              onClick()
            }}
          >
            {t('buttons.schedulePublish')}
          </Button>
        </Button.Group>
      )
    },
  ),
)

export default PublishDatePicker
