import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, message, Tabs, Modal, Form, Input, Select, Tag, Space, Divider, Spin } from 'antd';
import { ArrowLeft, Edit, Delete, History, Eye, Plus } from '@ant-design/icons';
import DocumentPreview from '../components/DocumentPreview';
import { documentAPI, versionAPI } from '../services/api';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [selectedVersions, setSelectedVersions] = useState([null, null]);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [compareResult, setCompareResult] = useState(null);

  useEffect(() => {
    fetchDocument();
    fetchVersions();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await documentAPI.getDocument(id);
      setDocument(response.data.document);
    } catch (error) {
      message.error('获取文档详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await versionAPI.getVersions(id);
      setVersions(response.data.versions);
    } catch (error) {
      message.error('获取版本信息失败');
    }
  };

  const handleEdit = () => {
    if (!document) return;
    
    editForm.setFieldsValue({
      title: document.title,
      department: document.department,
      documentType: document.documentType,
      category: document.category,
      signatory: document.signatory,
      signatureDate: document.signatureDate ? moment(document.signatureDate).format('YYYY-MM-DD') : '',
      effectiveDate: document.effectiveDate ? moment(document.effectiveDate).format('YYYY-MM-DD') : '',
      tags: document.tags?.join(', ') || '',
      description: document.description || ''
    });
    
    setEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      const updateData = {
        ...values,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
        signatureDate: values.signatureDate || null,
        effectiveDate: values.effectiveDate || null
      };

      await documentAPI.updateDocument(id, updateData);
      message.success('文档更新成功');
      setEditModalVisible(false);
      fetchDocument();
      fetchVersions();
    } catch (error) {
      message.error('更新文档失败');
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文档吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await documentAPI.deleteDocument(id);
          message.success('文档删除成功');
          navigate('/documents');
        } catch (error) {
          message.error('删除文档失败');
        }
      }
    });
  };

  const handleVersionSelect = (version, index) => {
    const newSelected = [...selectedVersions];
    newSelected[index] = version;
    setSelectedVersions(newSelected);
  };

  const handleCompare = async () => {
    if (!selectedVersions[0] || !selectedVersions[1]) {
      message.warning('请选择两个版本进行对比');
      return;
    }

    try {
      setLoading(true);
      const response = await versionAPI.compare(id, selectedVersions[0].version, selectedVersions[1].version);
      setCompareResult(response.data);
      setCompareModalVisible(true);
    } catch (error) {
      message.error('版本对比失败');
    } finally {
      setLoading(false);
    }
  };

  const renderCompareResult = () => {
    if (!compareResult) return null;

    const { comparison } = compareResult;
    const { changes } = comparison;

    return (
      <div>
        <div className="mb-4">
          <h3>对比摘要</h3>
          <p>版本 {comparison.version1.version} vs 版本 {comparison.version2.version}</p>
          <div className="flex gap-4 mt-2">
            <span className="text-green-600">新增: {changes.added.length} 处</span>
            <span className="text-red-600">删除: {changes.removed.length} 处</span>
            <span className="text-yellow-600">修改: {changes.modified.length} 处</span>
          </div>
        </div>

        <div className="space-y-4">
          {changes.added.map((change, index) => (
            <div key={index} className="p-3 bg-green-50 rounded">
              <div className="text-sm text-green-600 mb-1">新增 (第 {change.lineNumber} 行)</div>
              <div className="font-mono text-sm">{change.content}</div>
              {change.context && (
                <div className="text-xs text-gray-500 mt-1">
                  上下文: {change.context.map(c => c.content).join('...')}
                </div>
              )}
            </div>
          ))}

          {changes.removed.map((change, index) => (
            <div key={index} className="p-3 bg-red-50 rounded">
              <div className="text-sm text-red-600 mb-1">删除 (第 {change.lineNumber} 行)</div>
              <div className="font-mono text-sm">{change.content}</div>
              {change.context && (
                <div className="text-xs text-gray-500 mt-1">
                  上下文: {change.context.map(c => c.content).join('...')}
                </div>
              )}
            </div>
          ))}

          {changes.modified.map((change, index) => (
            <div key={index} className="p-3 bg-yellow-50 rounded">
              <div className="text-sm text-yellow-600 mb-1">修改</div>
              <div className="font-mono text-sm">{change.content}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center">
            <h2>文档不存在</h2>
            <Button type="primary" onClick={() => navigate('/documents')}>
              返回文档列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          icon={<ArrowLeft />} 
          onClick={() => navigate('/documents')}
          className="mb-4"
        >
          返回列表
        </Button>

        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="文档详情" key="1">
              <DocumentPreview 
                document={document}
                onBack={() => navigate('/documents')}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabPane>

            <TabPane tab="版本历史" key="2">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3>版本历史记录</h3>
                  <Button 
                    icon={<Eye />} 
                    onClick={handleCompare}
                    disabled={versions.length < 2}
                  >
                    版本对比
                  </Button>
                </div>

                {versions.length === 0 ? (
                  <div className="text-center text-gray-500">暂无版本记录</div>
                ) : (
                  <div className="space-y-4">
                    {versions.map((version, index) => (
                      <Card key={version._id} className="relative">
                        <div className="absolute top-4 right-4">
                          <Tag color={version.isCurrent ? 'green' : 'default'}>
                            {version.isCurrent ? '当前版本' : `版本 ${version.version}`}
                          </Tag>
                        </div>
                        
                        <Row gutter={16}>
                          <Col span={8}>
                            <div>
                              <div className="font-semibold">版本号</div>
                              <div>{version.version}</div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div>
                              <div className="font-semibold">上传人</div>
                              <div>{version.uploadedBy?.fullName}</div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div>
                              <div className="font-semibold">上传时间</div>
                              <div>{moment(version.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div>
                              <div className="font-semibold">签发人</div>
                              <div>{version.signatory || '未指定'}</div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div>
                              <div className="font-semibold">签发日期</div>
                              <div>{version.signatureDate ? moment(version.signatureDate).format('YYYY-MM-DD') : '未指定'}</div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div>
                              <div className="font-semibold">文件大小</div>
                              <div>{(version.fileSize / 1024).toFixed(2)} KB</div>
                            </div>
                          </Col>
                        </Row>

                        {version.changes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <div className="text-sm font-semibold">变更说明</div>
                            <div className="text-sm text-gray-600">{version.changes}</div>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <Button size="small" onClick={() => handleVersionSelect(version, 0)}>
                            选择对比
                          </Button>
                          <Button size="small" onClick={() => handleVersionSelect(version, 1)}>
                            选择对比
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>

      {/* 编辑模态框 */}
      <Modal
        title="编辑文档"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="title" label="文档标题" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="所属部门" rules={[{ required: true }]}>
                <Select>
                  <Option value="人力资源部">人力资源部</Option>
                  <Option value="财务部">财务部</Option>
                  <Option value="技术部">技术部</Option>
                  <Option value="市场部">市场部</Option>
                  <Option value="运营部">运营部</Option>
                  <Option value="法务部">法务部</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="documentType" label="文档类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="管理制度">管理制度</Option>
                  <Option value="操作规范">操作规范</Option>
                  <Option value="岗位职责">岗位职责</Option>
                  <Option value="应急预案">应急预案</Option>
                  <Option value="工作流程">工作流程</Option>
                  <Option value="考核制度">考核制度</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                <Select>
                  <Option value="人事管理">人事管理</Option>
                  <Option value="财务管理">财务管理</Option>
                  <Option value="技术管理">技术管理</Option>
                  <Option value="市场营销">市场营销</Option>
                  <Option value="安全生产">安全生产</Option>
                  <Option value="质量控制">质量控制</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="signatory" label="签发人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="signatureDate" label="签发日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="effectiveDate" label="生效日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Input placeholder="用逗号分隔" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="文档描述">
            <Input.TextArea rows={4} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 版本对比模态框 */}
      <Modal
        title="版本对比"
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={null}
        width={1000}
        style={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          renderCompareResult()
        )}
      </Modal>
    </div>
  );
};

export default DocumentDetail;