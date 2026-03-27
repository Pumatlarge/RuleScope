import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Upload, message, Card, Row, Col, Divider } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { documentAPI } from '../services/api';

const { Dragger } = Upload;
const { Option } = Select;

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const uploadProps = {
    name: 'document',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const isWordDoc = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       file.type === 'application/msword';
      
      if (!isWordDoc) {
        message.error('只能上传Word文档格式 (.docx, .doc)');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB');
        return false;
      }
      
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleSubmit = async (values) => {
    if (fileList.length === 0) {
      message.error('请选择要上传的文档');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', fileList[0]);
      formData.append('title', values.title);
      formData.append('department', values.department);
      formData.append('documentType', values.documentType);
      formData.append('category', values.category);
      formData.append('signatory', values.signatory);
      formData.append('signatureDate', values.signatureDate);
      formData.append('effectiveDate', values.effectiveDate);
      formData.append('tags', values.tags);
      formData.append('description', values.description);

      const response = await documentAPI.upload(formData);
      message.success('文档上传成功');
      navigate(`/documents/${response.data.document.id}`);
    } catch (error) {
      message.error(error.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card title="上传企业规章制度" className="mb-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="文档标题"
                rules={[{ required: true, message: '请输入文档标题' }]}
              >
                <Input placeholder="请输入文档标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="所属部门"
                rules={[{ required: true, message: '请选择所属部门' }]}
              >
                <Select placeholder="请选择所属部门">
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
              <Form.Item
                name="documentType"
                label="文档类型"
                rules={[{ required: true, message: '请选择文档类型' }]}
              >
                <Select placeholder="请选择文档类型">
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
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
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

          <Form.Item
            name="document"
            label="上传文档"
            rules={[{ required: true, message: '请选择要上传的文档' }]}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                只支持上传 .docx, .doc 格式的Word文档，文件大小不能超过10MB
              </p>
            </Dragger>
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="signatory"
                label="签发人"
              >
                <Input placeholder="请输入签发人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="signatureDate"
                label="签发日期"
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="effectiveDate"
                label="生效日期"
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tags"
                label="标签"
              >
                <Input placeholder="请输入标签，用逗号分隔" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="文档描述"
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入文档描述"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploading}
              size="large"
              block
            >
              {uploading ? '上传中...' : '上传文档'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DocumentUpload;