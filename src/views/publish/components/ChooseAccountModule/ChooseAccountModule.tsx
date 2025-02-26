import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Modal, Tabs } from 'antd';
import { AccountInfo } from '@/views/account/comment';
import { PubType } from '../../../../../commont/publish/PublishEnum';
import PlatChoose, {
  IPlatChooseRef,
} from '@/views/publish/components/ChooseAccountModule/components/PlatChoose';

export interface IChooseAccountModuleRef {}

export interface IChooseAccountModuleProps {
  open: boolean;
  onClose: (open: boolean) => void;
  // 发布类型，每个类型的平台都不同
  pubType: PubType;
  // 按平台 选择的数据
  choosedAccounts?: AccountInfo[];
  // 按平台选择确认
  onPlatConfirm?: (accounts: AccountInfo[]) => void;
  // 按平台选择change
  onPlatChange?: (accounts: AccountInfo[], account: AccountInfo) => void;
  // 按平台 是否禁用全选，true=禁用，false=不禁用，默认为false
  disableAllSelect?: boolean;
}

const ChooseAccountModule = memo(
  forwardRef(
    (
      {
        open,
        onClose,
        pubType,
        choosedAccounts,
        onPlatConfirm,
        onPlatChange,
        disableAllSelect,
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
        setNewChoosedAccounts(choosedAccounts || []);
        close();
      };

      const close = () => {
        onClose(false);
      };

      useEffect(() => {
        setTimeout(() => platChooseRef.current?.recover(), 1);
      }, [choosedAccounts]);

      useEffect(() => {
        platChooseRef.current?.init();
      }, [open]);

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
                  <PlatChoose
                    choosedAccounts={choosedAccounts}
                    disableAllSelect={disableAllSelect || false}
                    ref={platChooseRef}
                    pubType={pubType}
                    onChange={(aList, account) => {
                      setNewChoosedAccounts(aList);
                      if (onPlatChange) onPlatChange(aList, account);
                    }}
                  />
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
