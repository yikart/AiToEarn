import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Modal } from "antd";
import SimpleAccountChoose, {
  ISimpleAccountChooseProps,
  ISimpleAccountChooseRef,
} from "@/components/ChooseAccountModule/components/SimpleAccountChoose";
import { SocialAccount } from "@/api/types/account.type";

export interface IChooseAccountModuleRef {
  getSimpleAccountChooseRef: () => ISimpleAccountChooseRef | null;
}

export interface IChooseAccountModuleProps {
  open: boolean;
  onClose: (open: boolean) => void;
  // 简化账户选择props
  simpleAccountChooseProps?: ISimpleAccountChooseProps;
  // 账户选择确认
  onAccountConfirm?: (accounts: SocialAccount[]) => void;
  // 账户选择change
  onAccountChange?: (accounts: SocialAccount[], account: SocialAccount) => void;
}

const ChooseAccountModule = memo(
  forwardRef(
    (
      {
        open,
        onClose,
        onAccountConfirm,
        onAccountChange,
        simpleAccountChooseProps,
      }: IChooseAccountModuleProps,
      ref: ForwardedRef<IChooseAccountModuleRef>,
    ) => {
      const [newChoosedAccounts, setNewChoosedAccounts] = useState<
        SocialAccount[]
      >([]);
      const simpleAccountChooseRef = useRef<ISimpleAccountChooseRef>(null);

      const handleOk = () => {
        if (onAccountConfirm) onAccountConfirm(newChoosedAccounts);
        close();
      };

      const handleCancel = () => {
        setNewChoosedAccounts(simpleAccountChooseProps?.choosedAccounts || []);
        close();
      };

      const close = () => {
        onClose(false);
      };

      useEffect(() => {
        setTimeout(() => simpleAccountChooseRef.current?.recover(), 1);
      }, [simpleAccountChooseProps?.choosedAccounts]);

      useEffect(() => {
        simpleAccountChooseRef.current?.init();
      }, [open]);

      const ImperativeHandle: IChooseAccountModuleRef = {
        getSimpleAccountChooseRef() {
          return simpleAccountChooseRef.current;
        },
      };
      useImperativeHandle(ref, () => ImperativeHandle);

      return (
        <Modal
          width={800}
          title="账户选择"
          open={open}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          {simpleAccountChooseProps && (
            <SimpleAccountChoose
              {...simpleAccountChooseProps}
              disableAllSelect={
                simpleAccountChooseProps.disableAllSelect || false
              }
              ref={simpleAccountChooseRef}
              onChange={(accounts: SocialAccount[], account: SocialAccount) => {
                setNewChoosedAccounts(accounts);
                if (onAccountChange) onAccountChange(accounts, account);
              }}
            />
          )}
        </Modal>
      );
    },
  ),
);
ChooseAccountModule.displayName = "ChooseAccountModule";

export default ChooseAccountModule;
