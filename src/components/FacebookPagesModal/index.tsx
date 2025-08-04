import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, List, Button, message, Spin, Avatar } from 'antd';
import { apiGetFacebookPages, apiSubmitFacebookPages } from '@/api/plat/facebook';
import { useAccountStore } from '@/store/account';
import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';

export interface FacebookPageItem {
  id: string;
  name: string;
  profile_picture_url?: string;
}

interface FacebookPagesModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FacebookPagesModal: React.FC<FacebookPagesModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('account');
  const [pages, setPages] = useState<FacebookPageItem[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const accountStore = useAccountStore();

  // 获取Facebook页面列表
  const fetchPages = async () => {
    setLoading(true);
    try {
      const res: any = await apiGetFacebookPages('');
      if (res?.code === 0) {
        setPages(res.data || []);
      } else {
        message.error(t('facebookPages.fetchError' as any));
      }
    } catch (error) {
      console.error('获取Facebook页面列表失败:', error);
      message.error(t('facebookPages.fetchError' as any));
    } finally {
      setLoading(false);
    }
  };

  // 提交选择的页面
  const handleSubmit = async () => {
    if (selectedPageIds.length === 0) {
      message.warning(t('facebookPages.selectAtLeastOne' as any));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiSubmitFacebookPages(selectedPageIds);
      if (res?.code === 0) {
        message.success(t('facebookPages.submitSuccess' as any));
        // 刷新账户列表
        await accountStore.getAccountList();
        onSuccess();
        onClose();
      } else {
        message.error(t('facebookPages.submitError' as any));
      }
    } catch (error) {
      console.error('提交页面选择失败:', error);
      message.error(t('facebookPages.submitError' as any));
    } finally {
      setSubmitting(false);
    }
  };

  // 处理页面选择变化
  const handlePageChange = (pageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPageIds(prev => [...prev, pageId]);
    } else {
      setSelectedPageIds(prev => prev.filter(id => id !== pageId));
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPageIds(pages.map(page => page.id));
    } else {
      setSelectedPageIds([]);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPages();
      setSelectedPageIds([]);
    }
  }, [open]);

  return (
    <Modal
      title={t('facebookPages.title' as any)}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('facebookPages.cancel' as any)}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          {t('facebookPages.confirm' as any)}
        </Button>,
      ]}
      width={600}
      className={styles.facebookPagesModal}
    >
      <div className={styles.selectAll}>
        <Checkbox
          checked={selectedPageIds.length === pages.length && pages.length > 0}
          indeterminate={selectedPageIds.length > 0 && selectedPageIds.length < pages.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          {t('facebookPages.selectAll' as any)}
        </Checkbox>
      </div>

      <Spin spinning={loading}>
        <List
          className={styles.pageList}
          dataSource={pages}
          renderItem={(page) => (
            <List.Item className={styles.pageItem}>
              <Checkbox
                checked={selectedPageIds.includes(page.id)}
                onChange={(e) => handlePageChange(page.id, e.target.checked)}
              >
                <div className={styles.pageInfo}>
                  <Avatar 
                    src={page.profile_picture_url} 
                    size={32}
                    className={styles.pageAvatar}
                  >
                    {page.name?.charAt(0)}
                  </Avatar>
                  <span className={styles.pageName}>{page.name}</span>
                </div>
              </Checkbox>
            </List.Item>
          )}
          locale={{
            emptyText: loading ? t('facebookPages.loading' as any) : t('facebookPages.noPages' as any),
          }}
        />
      </Spin>
    </Modal>
  );
};

export default FacebookPagesModal; 