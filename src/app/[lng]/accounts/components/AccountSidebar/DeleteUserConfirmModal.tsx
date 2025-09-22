import { ForwardedRef, forwardRef, memo, useState } from "react";
import styles from "@/app/[lng]/accounts/components/AccountSidebar/AccountSidebar.module.scss";
import { Button, Modal } from "antd";
import { deleteAccountsApi } from "@/api/account";
import AvatarPlat from "@/components/AvatarPlat";
import { SocialAccount } from "@/api/types/account.type";

export interface IDeleteUserConfirmModalRef {}

export interface IDeleteUserConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
  deleteUsers: SocialAccount[];
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
      const [deleteLoading, setDeleteLoading] = useState(false);

      return (
        <Modal
          open={open}
          title="删除提示"
          width={500}
          zIndex={1002}
          rootClassName={styles.userManageDeleteHitModal}
          footer={
            <>
              <Button onClick={() => onClose()}>取消</Button>
              <Button
                type="primary"
                loading={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  const res = await deleteAccountsApi(
                    deleteUsers.map((v) => v.id),
                  );
                  setDeleteLoading(false);
                  if (!res) return setDeleteLoading(false);
                  onDeleteSuccess();
                  onClose();
                }}
              >
                确认
              </Button>
            </>
          }
        >
          <p>
            是否删除以下
            <span style={{ color: "var(--errerColor)" }}>
              {deleteUsers.length}
            </span>
            个账号？
          </p>
          <div className={styles["userManageDeleteHitModal-users"]}>
            {deleteUsers.map((v) => {
              return (
                <li key={v.id}>
                  <AvatarPlat account={v} size="large" />
                  <span>{v.nickname}</span>
                </li>
              );
            })}
          </div>
        </Modal>
      );
    },
  ),
);

export default DeleteUserConfirmModal;
