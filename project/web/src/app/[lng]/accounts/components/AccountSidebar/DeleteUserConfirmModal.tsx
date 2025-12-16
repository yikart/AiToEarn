/**
 * DeleteUserConfirmModal - 删除用户确认弹窗
 * 批量删除账号的二次确认弹窗
 */

import type { ForwardedRef } from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import { Button } from 'antd'
import { forwardRef, memo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { deleteAccountsApi } from '@/api/account'
import styles from '@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar.module.scss'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/AvatarPlat'

export interface IDeleteUserConfirmModalRef {}

export interface IDeleteUserConfirmModalProps {
  open: boolean
  onClose: () => void
  onDeleteSuccess: () => void
  deleteUsers: SocialAccount[]
}

const DeleteUserConfirmModal = memo(
  forwardRef(
    (
      {
        open,
        onClose,
        deleteUsers,
        onDeleteSuccess,
      }: IDeleteUserConfirmModalProps,
      ref: ForwardedRef<IDeleteUserConfirmModalRef>,
    ) => {
      const [deleteLoading, setDeleteLoading] = useState(false)
      const { t } = useTransClient('account')

      return (
        <Modal
          open={open}
          title={t('deleteConfirm.title' as any)}
          width={500}
          zIndex={1002}
          onCancel={() => onClose()}
          rootClassName={styles.userManageDeleteHitModal}
          footer={(
            <>
              <Button onClick={() => onClose()}>{t('deleteConfirm.cancel' as any)}</Button>
              <Button
                type="primary"
                loading={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true)
                  const res = await deleteAccountsApi(
                    deleteUsers.map(v => v.id),
                  )
                  setDeleteLoading(false)
                  if (!res)
                    return setDeleteLoading(false)
                  onDeleteSuccess()
                  onClose()
                }}
              >
                {t('deleteConfirm.confirm' as any)}
              </Button>
            </>
          )}
        >
          <p>
            {t('deleteConfirm.content' as any, { count: deleteUsers.length } as any)}
          </p>
          <div className={styles['userManageDeleteHitModal-users']}>
            {deleteUsers.map((v) => {
              return (
                <li key={v.id}>
                  <AvatarPlat account={v} size="large" />
                  <span>{v.nickname}</span>
                </li>
              )
            })}
          </div>
        </Modal>
      )
    },
  ),
)

export default DeleteUserConfirmModal
