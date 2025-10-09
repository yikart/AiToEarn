"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Button, 
  Tabs, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Upload, 
  message, 
  Pagination,
  Spin,
  Popconfirm,
  Badge,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Empty,
  Divider
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  PictureOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
  EyeOutlined,
  LinkOutlined,
  BarsOutlined,
  PushpinOutlined,
  UserOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import styles from "./pinterest.module.scss";
import {
  getPinterestBoardListApi,
  createPinterestBoardApi,
  deletePinterestBoardApi,
  getPinterestPinListApi,
  createPinterestPinApi,
  deletePinterestPinApi,
  getPinterestAccountApi,
  getPinterestBoardApi,
  getPinterestPinApi
} from "@/api/pinterest";
import { getAccountListApi } from "@/api/account";
import { PlatType } from "@/app/config/platConfig";
import { uploadToOss } from "@/api/oss";
import { getOssUrl } from "@/utils/oss";
import { useTransClient } from "@/app/i18n/client";

const { Search } = Input;
const { TextArea } = Input;
const { Text, Title } = Typography;

// 自定义颜色选择器组件
const CustomColorPicker = ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => {
  const { t } = useTransClient('pinterest');
  
  return (
    <div className={styles.colorPickerContainer}>
      <input
        type="color"
        className={styles.colorPicker}
        value={value || "#e60023"}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <Text type="secondary" className={styles.colorPickerTip}>
        {t('pin.dominantColorTip')}
      </Text>
    </div>
  );
};

export default function PinterestPage() {
  // 翻译函数
  const { t } = useTransClient('pinterest');

  // 状态管理
  const [activeTab, setActiveTab] = useState("boards");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [pins, setPins] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  
  // 模态框状态
  const [boardModalVisible, setBoardModalVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [boardDetailModalVisible, setBoardDetailModalVisible] = useState(false);
  const [pinDetailModalVisible, setPinDetailModalVisible] = useState(false);
  
  // 表单
  const [boardForm] = Form.useForm();
  const [pinForm] = Form.useForm();
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // 搜索
  const [searchKeyword, setSearchKeyword] = useState("");
  
  // 选中的项目
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  
  // 图片上传
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化数据
  useEffect(() => {
    loadAccountList();
  }, []);

  // 当selectedAccount变化时重新加载数据
  useEffect(() => {
    if (selectedAccount?.id) {
      if (activeTab === "boards") {
        loadBoards(1, 20);
      } else {
        loadPins(1, 10);
      }
    }
  }, [selectedAccount, activeTab]);


  // 加载账户列表
  const loadAccountList = async () => {
    try {
      setLoading(true);
      const response = await getAccountListApi();
      if (response?.code === 0) {
        // 过滤出Pinterest账户
        const pinterestAccounts = response.data.filter((account: any) => account.type === PlatType.Pinterest);
        setAccounts(pinterestAccounts);
        if (pinterestAccounts.length > 0) {
          setSelectedAccount(pinterestAccounts[0]);
        }
      }
    } catch (error) {
      message.error(t('messages.loadAccountsFailed'));
    } finally {
      setLoading(false);
    }
  };

    // 加载boards
    const loadBoards = async (page = 1, size = 20) => {
      if (!selectedAccount?.id) return;

      try {
        setLoading(true);
        const response = await getPinterestBoardListApi({ page, size }, selectedAccount.id);
        if (response?.code === 0) {
          setBoards(response.data?.list || []);
          setTotal(response.data?.count || 0);
        }
      } catch (error) {
        message.error(t('messages.loadBoardsFailed'));
      } finally {
        setLoading(false);
      }
    };

    // 加载pins
    const loadPins = async (page = 1, size = 10) => {
      if (!selectedAccount?.id) return;

      try {
        setLoading(true);
        const response = await getPinterestPinListApi({ page: page, size }, selectedAccount.id);
        if (response?.code === 0) {
          setPins(response.data?.list || []);
          setTotal(response.data?.count || 0);
          setCurrentPage(page);
          setPageSize(size);
        }
      } catch (error) {
        message.error(t('messages.loadPinsFailed'));
      } finally {
        setLoading(false);
      }
    };

  // 创建Board
  const handleCreateBoard = async (values: any) => {
    if (!selectedAccount?.id) {
      message.error(t('messages.loadAccountsFailed'));
      return;
    }

    try {
      setLoading(true);
      const response = await createPinterestBoardApi(values, selectedAccount.id);
      if (response?.code === 0) {
        message.success(t('messages.boardCreateSuccess'));
        setBoardModalVisible(false);
        boardForm.resetFields();
        loadBoards(1, 20);
      }
    } catch (error) {
      message.error(t('messages.boardCreateFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 删除Board
  const handleDeleteBoard = async (boardId: string) => {
    if (!selectedAccount?.id) {
      message.error(t('messages.loadAccountsFailed'));
      return;
    }

    try {
      setLoading(true);
      const response = await deletePinterestBoardApi(boardId, selectedAccount.id);
      if (response?.code === 0) {
        message.success(t('messages.boardDeleteSuccess'));
        loadBoards(1, 20);
      }
    } catch (error) {
      message.error(t('messages.boardDeleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 创建Pin
  const handleCreatePin = async (values: any) => {
    if (!imageUrl) {
      message.error(t('messages.uploadImageFirst'));
      return;
    }

    if (!selectedAccount?.id) {
      message.error(t('messages.loadAccountsFailed'));
      return;
    }

    try {
      setLoading(true);
      const pinData = {
        board_id: values.board_id,
        link: values.link,
        title: values.title,
        description: values.description,
        dominant_color: values.dominant_color || "#e60023",
        alt_text: values.alt_text,
        media_source: {
          source_type: "image_url",
          url: imageUrl
        }
      };

      const response = await createPinterestPinApi(pinData, selectedAccount.id);
      if (response?.code === 0) {
        message.success(t('messages.pinCreateSuccess'));
        setPinModalVisible(false);
        pinForm.resetFields();
        resetImageUpload();
        loadPins(currentPage, pageSize);
      }
    } catch (error) {
      message.error(t('messages.pinCreateFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 删除Pin
  const handleDeletePin = async (pinId: string) => {
    if (!selectedAccount?.id) {
      message.error(t('messages.loadAccountsFailed'));
      return;
    }

    try {
      setLoading(true);
      const response = await deletePinterestPinApi(pinId, selectedAccount.id);
      if (response?.code === 0) {
        message.success(t('messages.pinDeleteSuccess'));
        loadPins(currentPage, pageSize);
      }
    } catch (error) {
      message.error(t('messages.pinDeleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 重置图片上传状态
  const resetImageUpload = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    setUploading(false);
  };

  // 图片上传处理
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error(t('messages.selectImageFile'));
      return;
    }

    // 检查文件大小 (限制10MB)
    if (file.size > 10 * 1024 * 1024) {
      message.error(t('messages.imageSizeLimit'));
      return;
    }

    try {
      setUploading(true);
      setImageFile(file);

      // 生成预览图
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 上传到OSS
      const ossFileName = await uploadToOss(file);
      const fullImageUrl = getOssUrl(ossFileName);
      
      setImageUrl(fullImageUrl);
      message.success(t('messages.imageUploadSuccess'));
    } catch (error) {
      console.error("图片上传失败:", error);
      message.error(t('messages.imageUploadFailed'));
      resetImageUpload();
    } finally {
      setUploading(false);
    }
  };

  // 查看Board详情
  const handleViewBoard = async (board: any) => {
    if (!selectedAccount?.id) {
      message.error(t('messages.loadAccountsFailed'));
      return;
    }

    try {
      setLoading(true);
      const response = await getPinterestBoardApi(board.id, selectedAccount.id);
      if (response?.code === 0) {
        setSelectedBoard(response.data);
        setBoardDetailModalVisible(true);
      }
    } catch (error) {
      message.error(t('messages.getBoardDetailFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 查看Pin详情
  const handleViewPin = async (pin: any) => {
    if (!selectedAccount?.id) {
      message.error(t('messages.loadAccountsFailed'));
      return;
    }

    try {
      setLoading(true);
      const response = await getPinterestPinApi(pin.id, selectedAccount.id);
      if (response?.code === 0) {
        setSelectedPin(response.data);
        setPinDetailModalVisible(true);
      }
    } catch (error) {
      message.error(t('messages.getPinDetailFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 过滤boards
  const filteredBoards = boards.filter(board => 
    board && (
      board.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (board.description && board.description.toLowerCase().includes(searchKeyword.toLowerCase()))
    )
  );

  // 过滤pins
  const filteredPins = pins.filter(pin => 
    pin && (
      pin.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (pin.description && pin.description.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (pin.note && pin.note.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (pin.alt_text && pin.alt_text.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (pin.creative_type && pin.creative_type.toLowerCase().includes(searchKeyword.toLowerCase()))
    )
  );

  // Tab标签
  const tabItems = [
    {
      key: "boards",
      label: (
        <span>
          <BarsOutlined /> 
           {t('tabs.boards')}
        </span>
      )
    },
    {
      key: "pins",
      label: (
        <span>
          <PushpinOutlined /> 
           {t('tabs.pins')}
        </span>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          {/* <PictureOutlined />  */}
          {t('title')}
        </Title>
        <div className={styles.actions}>
          <Select
            style={{ width: 200 }}
            placeholder={t('actions.selectAccount')}
            value={selectedAccount?.id}
            onChange={(value) => {
              const account = accounts.find(acc => acc.id === value);
              setSelectedAccount(account || null);
            }}
          >
            {accounts.map(account => (
              <Select.Option key={account.id} value={account.id}>
                {account.nickname}
              </Select.Option>
            ))}
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              if (activeTab === "boards") {
                loadBoards(1, 20);
              } else {
                loadPins(currentPage, pageSize);
              }
            }}
            className={styles.refreshButton}
          >
            {t('actions.refresh')}
          </Button>
        </div>
      </div>

      {selectedAccount && (
        <Card className={styles.statsCard}>
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <Statistic 
                title={t('stats.followers')} 
                value={selectedAccount.fansCount || 0}
                prefix={<UserOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title={t('stats.boardCount')} 
                value={selectedAccount.board_count || 0}
                prefix={<BarsOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title={t('stats.pinCount')} 
                value={selectedAccount.workCount || 0}
                prefix={<PushpinOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title={t('stats.monthlyViews')} 
                value={selectedAccount.readCount || 0}
                prefix={<BarChartOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
          </Row>
        </Card>
      )}

      <div className={styles.content}>
        <div className={styles.filterSection}>
          <Search
            placeholder={t('actions.search')}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className={styles.searchBox}
            prefix={<SearchOutlined />}
          />
          <Button 
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (activeTab === "boards") {
                setBoardModalVisible(true);
              } else {
                setPinModalVisible(true);
                loadBoards(1, 20); // 为创建Pin加载boards
              }
            }}
          >
            {activeTab === "boards" ? t('actions.createBoard') : t('actions.createPin')}
          </Button>
        </div>

        <Tabs 
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key === "pins") {
              loadPins(1, 10);
            }
          }}
          items={tabItems}
          className={styles.tabs}
        />

        <div className={styles.tabContent}>
          {activeTab === "boards" && (
            <div className={styles.boardGrid}>
              {loading ? (
                <div className={styles.loading}>
                  <Spin size="large" />
                </div>
              ) : filteredBoards.length === 0 ? (
                <Empty 
                  description={t('empty.noBoards')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                filteredBoards.map(board => 
                  board && (
                    <Card
                      key={board.id}
                      className={styles.boardCard}
                      cover={
                        <div className={styles.boardImage}>
                          {board.media?.image_cover_url ? (
                            <img 
                              src={board.media.image_cover_url} 
                              alt={board.name}
                            />
                          ) : (
                            <BarsOutlined />
                          )}
                        </div>
                      }
                      actions={[
                        <Button 
                          key="view"
                          type="link" 
                          icon={<EyeOutlined />}
                          onClick={() => handleViewBoard(board)}
                          size="small"
                        >
                          {t('actions.view')}
                        </Button>,
                        <Popconfirm
                          key="delete"
                          title={t('board.deleteConfirm')}
                          onConfirm={() => handleDeleteBoard(board.id)}
                          okText={t('confirm.ok')}
                          cancelText={t('confirm.cancel')}
                        >
                          <Button 
                            type="link" 
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                          >
                            {t('actions.delete')}
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <div className={styles.boardCardMeta}>
                        <Card.Meta
                          title={board.name}
                          description={board.description || t('board.noDescription')}
                        />
                        <div className={styles.boardBadges}>
                          <div>
                            <span className={styles.badgeText}>{t('badges.pins')}</span>
                            <Badge 
                              count={board.pin_count || 0} 
                              showZero 
                              style={{ backgroundColor: '#e60023' }}
                            />
                          </div>
                          <div>
                            <span className={styles.badgeText}>{t('badges.followers')}</span>
                            <Badge 
                              count={board.follower_count || 0} 
                              showZero
                              style={{ backgroundColor: '#e60023' }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                )
              )}
            </div>
          )}

          {activeTab === "pins" && (
            <>
              <div className={styles.pinGrid}>
                {loading ? (
                  <div className={styles.loading}>
                    <Spin size="large" />
                  </div>
                ) : filteredPins.length === 0 ? (
                  <Empty 
                    description={t('empty.noPins')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  filteredPins.map(pin => 
                    pin && (
                      <Card
                        key={pin.id}
                        className={styles.pinCard}
                        cover={
                          <div className={styles.pinImage}>
                            {pin.media?.images?.["600x"]?.url ? (
                              <img 
                                src={pin.media.images["600x"].url} 
                                alt={pin.alt_text || pin.title || t('pin.imageAlt')}
                              />
                            ) : (
                              <PictureOutlined />
                            )}
                          </div>
                        }
                        actions={[
                          <Button 
                            key="view"
                            type="link" 
                            icon={<EyeOutlined />}
                            onClick={() => handleViewPin(pin)}
                            size="small"
                          >
                            {t('actions.view')}
                          </Button>,
                          pin.link && (
                            <Button 
                              key="link"
                              type="link" 
                              icon={<LinkOutlined />}
                              href={pin.link}
                              target="_blank"
                              size="small"
                            >
                              {t('actions.link')}
                            </Button>
                          ),
                          <Popconfirm
                            key="delete"
                            title={t('pin.deleteConfirm')}
                            onConfirm={() => handleDeletePin(pin.id)}
                            okText={t('confirm.ok')}
                            cancelText={t('confirm.cancel')}
                          >
                            <Button 
                              type="link" 
                              icon={<DeleteOutlined />}
                              danger
                              size="small"
                            >
                              {t('actions.delete')}
                            </Button>
                          </Popconfirm>
                        ].filter(Boolean)}
                      >
                        <div className={styles.pinCardMeta}>
                          <Card.Meta
                            title={pin.title}
                            description={pin.description || pin.note || t('pin.noDescription')}
                          />
                          <div className={styles.pinMetadata}>
                            {pin.creative_type && (
                              <Badge 
                                text={pin.creative_type} 
                                size="small" 
                                style={{ marginRight: 8 }}
                              />
                            )}
                            {pin.is_owner && (
                              <Badge 
                                text={t('badges.owner')} 
                                color="green" 
                                size="small" 
                              />
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  )
                )}
              </div>
              
              {!loading && filteredPins.length > 0 && (
                <div className={styles.pagination}>
                  <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    onChange={(page, size) => loadPins(page, size)}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => 
                      t('pagination.total', { 
                        range: `${range[0]}-${range[1]}`, 
                        total: total 
                      })
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 创建Board模态框 */}
      <Modal
        title={t('board.createTitle')}
        open={boardModalVisible}
        onCancel={() => setBoardModalVisible(false)}
        footer={null}
        className={styles.modal}
      >
        <Form
          form={boardForm}
          onFinish={handleCreateBoard}
          layout="vertical"
        >
          <Form.Item
            label={t('board.name')}
            name="name"
            rules={[{ required: true, message: t('validation.boardNameRequired') }]}
          >
            <Input placeholder={t('board.namePlaceholder')} />
          </Form.Item>
          
          <Form.Item
            label={t('board.description')}
            name="description"
          >
            <TextArea 
              placeholder={t('board.descriptionPlaceholder')} 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            label={t('board.privacy')}
            name="privacy"
            initialValue="PUBLIC"
          >
            <Select>
              <Select.Option value="PUBLIC">{t('board.public')}</Select.Option>
              <Select.Option value="PRIVATE">{t('board.private')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('board.createButton')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建Pin模态框 */}
      <Modal
        title={t('pin.createTitle')}
        open={pinModalVisible}
        onCancel={() => {
          setPinModalVisible(false);
          resetImageUpload();
        }}
        footer={null}
        className={styles.modal}
        width={600}
      >
        <Form
          form={pinForm}
          onFinish={handleCreatePin}
          layout="vertical"
        >
          <Form.Item
            label={t('pin.selectBoard')}
            name="board_id"
            rules={[{ required: true, message: t('validation.selectBoardRequired') }]}
          >
            <Select placeholder={t('pin.selectBoardPlaceholder')}>
              {boards?.map(board => 
                board && (
                  <Select.Option key={board.id} value={board.id}>
                    {board.name}
                  </Select.Option>
                )
              )}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('pin.uploadImage')}
            required
          >
            <div className={styles.uploadArea} onClick={() => !uploading && fileInputRef.current?.click()}>
              {uploading ? (
                <div className={styles.uploadLoading}>
                  <Spin size="large" />
                  <div className={styles.uploadText}>{t('pin.uploading')}</div>
                </div>
              ) : imagePreview ? (
                <div className={styles.uploadSuccess}>
                  <img 
                    src={imagePreview} 
                    alt="预览" 
                    className={styles.previewImage}
                  />
                  <div className={styles.uploadStatus}>
                    <span className={styles.successText}>{t('pin.uploadSuccess')}</span>
                    <Button 
                      size="small" 
                      type="link" 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetImageUpload();
                      }}
                    >
                      {t('pin.reupload')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadOutlined className={styles.uploadIcon} />
                  <div className={styles.uploadText}>{t('pin.uploadImagePlaceholder')}</div>
                  <div className={styles.uploadHint}>{t('pin.uploadHint')}</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            {imageUrl && (
              <div className={styles.urlDisplay}>
                <Text type="secondary" ellipsis>{t('pin.ossUrl')}: {imageUrl}</Text>
              </div>
            )}
          </Form.Item>
          
          <Form.Item
            label={t('pin.title')}
            name="title"
            rules={[{ required: true, message: t('validation.titleRequired') }]}
          >
            <Input placeholder={t('pin.titlePlaceholder')} />
          </Form.Item>
          
          <Form.Item
            label={t('pin.description')}
            name="description"
            rules={[{ required: true, message: t('validation.descriptionRequired') }]}
          >
            <TextArea 
              placeholder={t('pin.descriptionPlaceholder')} 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            label={t('pin.link')}
            name="link"
          >
            <Input placeholder={t('pin.linkPlaceholder')} />
          </Form.Item>
          
          <Form.Item
            label={t('pin.altText')}
            name="alt_text"
          >
            <Input placeholder={t('pin.altTextPlaceholder')} />
          </Form.Item>
          
          <Form.Item
            label={t('pin.dominantColor')}
            name="dominant_color"
            initialValue="#e60023"
          >
            <CustomColorPicker />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('pin.createButton')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Board详情模态框 */}
      <Modal
        title={t('board.detailTitle')}
        open={boardDetailModalVisible}
        onCancel={() => setBoardDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBoard && (
          <div>
            <Title level={4}>{selectedBoard.name}</Title>
            <Text type="secondary">{selectedBoard.description}</Text>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title={t('stats.pinCount')} value={selectedBoard.pin_count} />
              </Col>
              <Col span={12}>
                <Statistic title={t('stats.followers')} value={selectedBoard.follower_count} />
              </Col>
            </Row>
            <Divider />
            <Text type="secondary">
              {t('board.createTime')}: {new Date(selectedBoard.created_at).toLocaleDateString()}
            </Text>
          </div>
        )}
      </Modal>

      {/* Pin详情模态框 */}
      <Modal
        title={t('pin.detailTitle')}
        open={pinDetailModalVisible}
        onCancel={() => setPinDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedPin && (
          <div>
            <Title level={4}>{selectedPin.title}</Title>
            <Text type="secondary">{selectedPin.description || selectedPin.note}</Text>
            <Divider />
            
            {/* 图片显示 - 优先使用高清图片 */}
            {selectedPin.media?.images && (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <img 
                  src={
                    selectedPin.media.images["1200x"]?.url || 
                    selectedPin.media.images["600x"]?.url || 
                    selectedPin.media.images["400x300"]?.url
                  }
                  alt={selectedPin.alt_text || selectedPin.title || t('pin.imageAlt')}
                  style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px" }}
                />
              </div>
            )}

            {/* Pin信息 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('pin.pinId')}: </Text>
                <Text copyable>{selectedPin.id}</Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('pin.boardId')}: </Text>
                <Text copyable>{selectedPin.board_id}</Text>
              </Col>
              {selectedPin.creative_type && (
                <Col span={12}>
                  <Text strong>{t('pin.creativeType')}: </Text>
                  <Badge text={selectedPin.creative_type} />
                </Col>
              )}
              {selectedPin.dominant_color && (
                <Col span={12}>
                  <Text strong>{t('pin.dominantColor')}: </Text>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <div 
                      style={{ 
                        width: 20, 
                        height: 20, 
                        backgroundColor: selectedPin.dominant_color,
                        borderRadius: "4px",
                        border: "1px solid #d9d9d9"
                      }}
                    />
                    <Text>{selectedPin.dominant_color}</Text>
                  </div>
                </Col>
              )}
            </Row>

            {/* 状态信息 */}
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>{t('pin.isOwner')}: </Text>
                <Badge 
                  color={selectedPin.is_owner ? "green" : "default"} 
                  text={selectedPin.is_owner ? t('badges.yes') : t('badges.no')} 
                />
              </Col>
              <Col span={8}>
                <Text strong>{t('pin.isRemovable')}: </Text>
                <Badge 
                  color={selectedPin.is_removable ? "green" : "red"} 
                  text={selectedPin.is_removable ? t('badges.yes') : t('badges.no')} 
                />
              </Col>
              <Col span={8}>
                <Text strong>{t('pin.isStandard')}: </Text>
                <Badge 
                  color={selectedPin.is_standard ? "blue" : "default"} 
                  text={selectedPin.is_standard ? t('badges.yes') : t('badges.no')} 
                />
              </Col>
            </Row>

            {/* 链接信息 */}
            {selectedPin.link && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('pin.link')}: </Text>
                <a href={selectedPin.link} target="_blank" rel="noopener noreferrer">
                  {selectedPin.link}
                </a>
              </div>
            )}

            {/* Alt文本 */}
            {selectedPin.alt_text && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('pin.altText')}: </Text>
                <Text>{selectedPin.alt_text}</Text>
              </div>
            )}

            {/* Board拥有者信息 */}
            {selectedPin.board_owner && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{t('pin.boardOwner')}: </Text>
                <Text>@{selectedPin.board_owner.username}</Text>
              </div>
            )}

            <Divider />
            <Text type="secondary">
              {t('board.createTime')}: {new Date(selectedPin.created_at).toLocaleDateString('zh-CN')}
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
} 