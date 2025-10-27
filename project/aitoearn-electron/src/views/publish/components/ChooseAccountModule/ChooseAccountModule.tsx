import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Modal, Tabs } from 'antd';
import { AccountInfo } from '@/views/account/comment';
import PlatChoose, {
  IPlatChooseProps,
  IPlatChooseRef,
} from '@/views/publish/components/ChooseAccountModule/components/PlatChoose';

export interface IChooseAccountModuleRef {
  getPlatChooseRef: () => IPlatChooseRef | null;
}

export interface IChooseAccountModuleProps {
  open: boolean;
  onClose: (open: boolean) => void;
  // 按平台props
  platChooseProps?: IPlatChooseProps;
  // 按平台选择确认
  onPlatConfirm?: (accounts: AccountInfo[]) => void;
  // 按平台选择change
  onPlatChange?: (accounts: AccountInfo[], account: AccountInfo) => void;
}

const ChooseAccountModule = memo(
  forwardRef(
    (
      {
        open,
        onClose,
        onPlatConfirm,
        onPlatChange,
        platChooseProps,
      }: IChooseAccountModuleProps,
      ref: ForwardedRef<IChooseAccountModuleRef>,
    ) => {
      const [newChoosedAccounts, setNewChoosedAccounts] = useState<
        AccountInfo[]
      >([]);
      const platChooseRef = useRef<IPlatChooseRef>(null);

      const handleOk = () => {
        if (onPlatConfirm) onPlatConfirm(newChoosedAccounts);
        close();
      };

      const handleCancel = () => {
        setNewChoosedAccounts(platChooseProps?.choosedAccounts || []);
        close();
      };

      const close = () => {
        onClose(false);
      };

      useEffect(() => {
        setTimeout(() => platChooseRef.current?.recover(), 1);
      }, [platChooseProps?.choosedAccounts]);

      useEffect(() => {
        platChooseRef.current?.init();
      }, [open]);

      const ImperativeHandle: IChooseAccountModuleRef = {
        getPlatChooseRef() {
          return platChooseRef.current;
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
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: '按平台选择',
                children: (
                  <>
                    {platChooseProps && (
                      <PlatChoose
                        {...platChooseProps}
                        disableAllSelect={
                          platChooseProps.disableAllSelect || false
                        }
                        ref={platChooseRef}
                        onChange={(aList, account) => {
                          setNewChoosedAccounts(aList);
                          if (onPlatChange) onPlatChange(aList, account);
                        }}
                      />
                    )}
                  </>
                ),
              },
            ]}
          />
        </Modal>
      );
    },
  ),
);
ChooseAccountModule.displayName = 'ChooseAccountModule';

export default ChooseAccountModule;
