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
  getPinterestAccountListApi,
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

const { Search } = Input;
const { TextArea } = Input;
const { Text, Title } = Typography;

export default function PinterestPage() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化数据
  useEffect(() => {
    loadAccountList();
    loadBoards(1, 20);
  }, []);

  // 当选中账户时，加载boards
  useEffect(() => {
    if (selectedAccount) {
      loadBoards();
    }
  }, [selectedAccount]);

  // 加载账户列表
  const loadAccountList = async () => {
    try {
      setLoading(true);
      const response = await getPinterestAccountListApi();
      if (response?.code === 0) {
        setAccounts(response.data.items);
        if (response.data.items.length > 0) {
          setSelectedAccount(response.data.items[0]);
        }
      }
    } catch (error) {
      message.error("加载账户列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载boards
  const loadBoards = async (page = 1, size = 20) => {
    if (!selectedAccount) return;
    
    try {
      setLoading(true);
      const response = await getPinterestBoardListApi({ page, size });
      if (response?.code === 0) {
        setBoards(response.data.list);
        setTotal(response.data.count);
      }
    } catch (error) {
      message.error("加载Board列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载pins
  const loadPins = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const response = await getPinterestPinListApi({ page: page, size });
      if (response?.code === 0) {
        setPins(response.data.list);
        setTotal(response.data.count);
        setCurrentPage(page);
        setPageSize(size);
      }
    } catch (error) {
      message.error("加载Pin列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建Board
  const handleCreateBoard = async (values: any) => {
    try {
      setLoading(true);
      const response = await createPinterestBoardApi(values);
      if (response?.code === 0) {
        message.success("Board创建成功");
        setBoardModalVisible(false);
        boardForm.resetFields();
        loadBoards();
      }
    } catch (error) {
      message.error("创建Board失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除Board
  const handleDeleteBoard = async (boardId: string) => {
    try {
      setLoading(true);
      const response = await deletePinterestBoardApi(boardId);
      if (response?.code === 0) {
        message.success("Board删除成功");
        loadBoards();
      }
    } catch (error) {
      message.error("删除Board失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建Pin
  const handleCreatePin = async (values: any) => {
    if (!imageFile) {
      message.error("请上传图片");
      return;
    }

    try {
      setLoading(true);
      
      // 构造Pin数据
      const pinData: any = {
        board_id: values.board_id,
        link: values.link,
        title: values.title,
        description: values.description,
        dominant_color: values.dominant_color || "#e60023",
        alt_text: values.alt_text,
        media_source: {
          source_type: "image_url",
          content_type: imageFile.type,
          data: imagePreview,
          url: imagePreview
        },
        items: [{
          title: values.title,
          description: values.description,
          link: values.link,
          media_source: {
            source_type: "image_url",
            content_type: imageFile.type,
            data: imagePreview,
            url: imagePreview
          }
        }]
      };

      const response = await createPinterestPinApi(pinData);
      if (response?.code === 0) {
        message.success("Pin创建成功");
        setPinModalVisible(false);
        pinForm.resetFields();
        setImageFile(null);
        setImagePreview("");
        loadPins(currentPage, pageSize);
      }
    } catch (error) {
      message.error("创建Pin失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除Pin
  const handleDeletePin = async (pinId: string) => {
    try {
      setLoading(true);
      const response = await deletePinterestPinApi(pinId);
      if (response?.code === 0) {
        message.success("Pin删除成功");
        loadPins(currentPage, pageSize);
      }
    } catch (error) {
      message.error("删除Pin失败");
    } finally {
      setLoading(false);
    }
  };

  // 图片上传处理
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        message.error("请选择图片文件");
      }
    }
  };

  // 查看Board详情
  const handleViewBoard = async (board: any) => {
    try {
      setLoading(true);
      const response = await getPinterestBoardApi(board.id);
      if (response?.code === 0) {
        setSelectedBoard(response.data);
        setBoardDetailModalVisible(true);
      }
    } catch (error) {
      message.error("获取Board详情失败");
    } finally {
      setLoading(false);
    }
  };

  // 查看Pin详情
  const handleViewPin = async (pin: any) => {
    try {
      setLoading(true);
      const response = await getPinterestPinApi(pin.id);
      if (response?.code === 0) {
        setSelectedPin(response.data);
        setPinDetailModalVisible(true);
      }
    } catch (error) {
      message.error("获取Pin详情失败");
    } finally {
      setLoading(false);
    }
  };

  // 过滤boards
  const filteredBoards = boards.filter(board => 
    board.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (board.description && board.description.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  // 过滤pins
  const filteredPins = pins.filter(pin => 
    pin.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (pin.description && pin.description.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  // Tab标签
  const tabItems = [
    {
      key: "boards",
      label: (
        <span>
          <BarsOutlined /> 
           我的Board
        </span>
      )
    },
    {
      key: "pins",
      label: (
        <span>
          <PushpinOutlined /> 
           我的Pin
        </span>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          {/* <PictureOutlined />  */}
          Pinterest 管理
        </Title>
        <div className={styles.actions}>
          <Select
            style={{ width: 200 }}
            placeholder="选择账户"
            value={selectedAccount?.id}
            onChange={(value) => {
              const account = accounts.find(acc => acc.id === value);
              setSelectedAccount(account || null);
            }}
          >
            {accounts.map(account => (
              <Select.Option key={account.id} value={account.id}>
                {account.name}
              </Select.Option>
            ))}
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              if (activeTab === "boards") {
                loadBoards();
              } else {
                loadPins(currentPage, pageSize);
              }
            }}
            className={styles.refreshButton}
          >
            刷新
          </Button>
        </div>
      </div>

      {selectedAccount && (
        <Card className={styles.statsCard}>
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <Statistic 
                title="关注者" 
                value={selectedAccount.follower_count || 0}
                prefix={<UserOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Board数量" 
                value={selectedAccount.board_count || 0}
                prefix={<BarsOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Pin数量" 
                value={selectedAccount.pin_count || 0}
                prefix={<PushpinOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="月观看量" 
                value={selectedAccount.monthly_views || 0}
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
            placeholder="搜索..."
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
                loadBoards(); // 为创建Pin加载boards
              }
            }}
          >
            {activeTab === "boards" ? "创建Board" : "创建Pin"}
          </Button>
        </div>

        <Tabs 
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key === "pins") {
              loadPins();
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
                  description="暂无Board"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                filteredBoards.map(board => (
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
                        查看
                      </Button>,
                      <Popconfirm
                        key="delete"
                        title="确定删除此Board吗？"
                        onConfirm={() => handleDeleteBoard(board.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button 
                          type="link" 
                          icon={<DeleteOutlined />}
                          danger
                          size="small"
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <div className={styles.boardCardMeta}>
                      <Card.Meta
                        title={board.name}
                        description={board.description || "暂无描述"}
                      />
                      <div className={styles.boardBadges}>
                        <div>
                          <span className={styles.badgeText}>Pins</span>
                          <Badge 
                            count={board.pin_count || 0} 
                            showZero 
                            style={{ backgroundColor: '#e60023' }}
                          />
                        </div>
                        <div>
                          <span className={styles.badgeText}>关注者</span>
                          <Badge 
                            count={board.follower_count || 0} 
                            showZero
                            style={{ backgroundColor: '#e60023' }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
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
                    description="暂无Pin"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  filteredPins.map(pin => (
                    <Card
                      key={pin.id}
                      className={styles.pinCard}
                      cover={
                        <div className={styles.pinImage}>
                          {pin.media?.images?.["400x300"]?.url ? (
                            <img 
                              src={pin.media.images["400x300"].url} 
                              alt={pin.title}
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
                          查看
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
                            链接
                          </Button>
                        ),
                        <Popconfirm
                          key="delete"
                          title="确定删除此Pin吗？"
                          onConfirm={() => handleDeletePin(pin.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button 
                            type="link" 
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      ].filter(Boolean)}
                    >
                      <div className={styles.pinCardMeta}>
                        <Card.Meta
                          title={pin.title}
                          description={pin.description || "暂无描述"}
                        />
                      </div>
                    </Card>
                  ))
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
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
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
        title="创建新Board"
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
            label="Board名称"
            name="name"
            rules={[{ required: true, message: "请输入Board名称" }]}
          >
            <Input placeholder="输入Board名称" />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea 
              placeholder="输入Board描述" 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            label="隐私设置"
            name="privacy"
            initialValue="PUBLIC"
          >
            <Select>
              <Select.Option value="PUBLIC">公开</Select.Option>
              <Select.Option value="PRIVATE">私有</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              创建Board
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建Pin模态框 */}
      <Modal
        title="创建新Pin"
        open={pinModalVisible}
        onCancel={() => {
          setPinModalVisible(false);
          setImageFile(null);
          setImagePreview("");
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
            label="选择Board"
            name="board_id"
            rules={[{ required: true, message: "请选择Board" }]}
          >
            <Select placeholder="选择要发布到的Board">
              {boards.map(board => (
                <Select.Option key={board.id} value={board.id}>
                  {board.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="上传图片"
            required
          >
            <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="预览" 
                  className={styles.previewImage}
                />
              ) : (
                <div>
                  <UploadOutlined className={styles.uploadIcon} />
                  <div className={styles.uploadText}>点击上传图片</div>
                  <div className={styles.uploadHint}>支持JPG、PNG、GIF格式</div>
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
          </Form.Item>
          
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="输入Pin标题" />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: "请输入描述" }]}
          >
            <TextArea 
              placeholder="输入Pin描述" 
              rows={3}
            />
          </Form.Item>
          
          <Form.Item
            label="链接"
            name="link"
          >
            <Input placeholder="输入目标链接（可选）" />
          </Form.Item>
          
          <Form.Item
            label="Alt文本"
            name="alt_text"
          >
            <Input placeholder="输入图片Alt文本（可选）" />
          </Form.Item>
          
          <Form.Item
            label="主色调"
            name="dominant_color"
          >
            <div className={styles.colorPicker}>
              <input
                type="color"
                className={styles.colorInput}
                defaultValue="#e60023"
              />
              <Text type="secondary">选择Pin的主色调</Text>
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              创建Pin
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Board详情模态框 */}
      <Modal
        title="Board详情"
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
                <Statistic title="Pin数量" value={selectedBoard.pin_count} />
              </Col>
              <Col span={12}>
                <Statistic title="关注者" value={selectedBoard.follower_count} />
              </Col>
            </Row>
            <Divider />
            <Text type="secondary">
              创建时间: {new Date(selectedBoard.created_at).toLocaleDateString()}
            </Text>
          </div>
        )}
      </Modal>

      {/* Pin详情模态框 */}
      <Modal
        title="Pin详情"
        open={pinDetailModalVisible}
        onCancel={() => setPinDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedPin && (
          <div>
            <Title level={4}>{selectedPin.title}</Title>
            <Text type="secondary">{selectedPin.description}</Text>
            <Divider />
            {selectedPin.media?.images?.["600x"]?.url && (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <img 
                  src={selectedPin.media.images["600x"].url} 
                  alt={selectedPin.title}
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                />
              </div>
            )}
            {selectedPin.link && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>链接: </Text>
                <a href={selectedPin.link} target="_blank" rel="noopener noreferrer">
                  {selectedPin.link}
                </a>
              </div>
            )}
            <Text type="secondary">
              创建时间: {new Date(selectedPin.created_at).toLocaleDateString()}
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
} 