import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Space, Typography, Tag, message, Divider, Spin, Modal } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;

const FilePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    loadFile();
  }, [id]);

  const loadFile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files/${id}/content`);
      const data = await response.json();

      if (response.ok) {
        setFile(data);
        setContent(data.content);
      } else {
        message.error('加载文件失败');
      }
    } catch (error) {
      message.error('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/uploads/${id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.name || id;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('文件下载成功');
    } catch (error) {
      message.error('文件下载失败');
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件 "${file?.name}" 吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          const response = await fetch(`/api/files/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            message.success('文件删除成功');
            navigate('/files');
          } else {
            message.error('文件删除失败');
          }
        } catch (error) {
          message.error('文件删除失败');
        }
      },
      onCancel: () => { }
    });
  };

  const getFileType = (filename) => {
    if (!filename || typeof filename !== 'string') return '未知类型';
    const ext = filename.toLowerCase().split('.').pop();
    const typeMap = {
      'docx': 'Word文档',
      'doc': 'Word文档',
      'txt': '文本文件',
      'pdf': 'PDF文件'
    };
    return typeMap[ext] || '未知类型';
  };

  const getFileTypeColor = (filename) => {
    if (!filename || typeof filename !== 'string') return 'default';
    const ext = filename.toLowerCase().split('.').pop();
    const colorMap = {
      'docx': 'blue',
      'doc': 'blue',
      'txt': 'green',
      'pdf': 'red'
    };
    return colorMap[ext] || 'default';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载文件中...</div>
      </div>
    );
  }

  if (!file) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">文件不存在</Text>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/files')}>
            返回文件列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/files')}
          style={{ marginBottom: 16 }}
        >
          返回文件列表
        </Button>

        <Title level={2}>{file?.name || '正在加载...'}</Title>
        <Text type="secondary">智能解析预览 (Markdown 模式)</Text>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <div>
              <Text strong>文件类型：</Text>
              <Tag color={getFileTypeColor(file?.name)}>{getFileType(file?.name)}</Tag>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text strong>文件大小：</Text>
              <span style={{ color: '#1890ff' }}>{file?.size ? formatFileSize(file.size) : '未知'}</span>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text strong>上传时间：</Text>
              <span>{file?.uploadDate ? new Date(file.uploadDate).toLocaleString() : '未知'}</span>
            </div>
          </Col>
        </Row>

        <Divider />

        <div style={{ marginBottom: 24 }}>
          <Title level={4}>文件内容</Title>
          {['.txt', '.docx', '.doc'].includes(file.type) ? (
            <div className="markdown-preview" style={{
              padding: '24px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              minHeight: '400px'
            }}>
              {file.type !== '.txt' && (
                <div style={{ marginBottom: 20, padding: '8px 16px', background: '#e6f7ff', borderLeft: '4px solid #1890ff' }}>
                  <Text type="info"><b>智能解析：</b>已自动识别文档结构和大纲。</Text>
                </div>
              )}
              <div style={{ lineHeight: '1.8', color: '#262626' }}>
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          ) : file.type === '.pdf' ? (
            <div style={{
              textAlign: 'center',
              padding: '50px',
              background: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <Text type="secondary">PDF文件预览功能需要额外的PDF查看器</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                  下载PDF文件
                </Button>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}>
              <Text type="secondary">当前文件类型不支持在线预览</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                  下载文档
                </Button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/files')}>
              返回
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              下载文件
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除文件
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default FilePreview;