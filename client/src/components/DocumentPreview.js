import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Tag, Space, Divider, message } from 'antd';
import { ArrowLeft, Download, Printer, ShareAlt, ZoomIn, ZoomOut, Fullscreen } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { documentAPI } from '../services/api';
import moment from 'moment';

const { Title, Paragraph, Text } = Typography;

const DocumentPreview = ({ document, onBack, onEdit, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/uploads/${document.storedFileName}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.originalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('文档下载成功');
    } catch (error) {
      message.error('文档下载失败');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>${document.title}</title>
          <style>
            body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; padding: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
            .content { white-space: pre-wrap; word-wrap: break-word; }
            @media print {
              body { font-size: 12pt; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${document.title}</h1>
            <p><strong>部门：</strong>${document.department}</p>
            <p><strong>类型：</strong>${document.documentType}</p>
            <p><strong>分类：</strong>${document.category}</p>
            <p><strong>签发人：</strong>${document.signatory || '未指定'}</p>
            <p><strong>签发日期：</strong>${document.signatureDate ? moment(document.signatureDate).format('YYYY-MM-DD') : '未指定'}</p>
            <p><strong>生效日期：</strong>${document.effectiveDate ? moment(document.effectiveDate).format('YYYY-MM-DD') : '未指定'}</p>
          </div>
          <div class="content">${document.content}</div>
          <div class="footer">
            <p>文档版本：${document.version} | 上传时间：${moment(document.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p>企业规章制度检索管理系统</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleZoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const handleZoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      const element = document.getElementById('preview-container');
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isFullscreen ? 'fixed inset-0 bg-white z-50 p-8' : ''}`}>
      <Card 
        id="preview-container"
        title={
          <div className="flex items-center justify-between">
            <Title level={2} className="mb-0">{document.title}</Title>
            <div className="no-print">
              <Space>
                <Button 
                  icon={<ArrowLeft />} 
                  onClick={onBack}
                  type="default"
                >
                  返回
                </Button>
                <Button 
                  icon={<Download />} 
                  onClick={handleDownload}
                  type="primary"
                >
                  下载
                </Button>
                <Button 
                  icon={<Printer />} 
                  onClick={handlePrint}
                  type="default"
                >
                  打印
                </Button>
                {document.uploadedBy._id === JSON.parse(localStorage.getItem('user'))?.id && (
                  <>
                    <Button 
                      icon={<ShareAlt />} 
                      onClick={onEdit}
                      type="default"
                    >
                      编辑
                    </Button>
                    <Button 
                      danger 
                      onClick={onDelete}
                    >
                      删除
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </div>
        }
        extra={
          <div className="no-print">
            <Space>
              <Button 
                icon={<ZoomIn />} 
                onClick={handleZoomIn}
                size="small"
              />
              <Button 
                icon={<ZoomOut />} 
                onClick={handleZoomOut}
                size="small"
              />
              <Button 
                icon={<Fullscreen />} 
                onClick={toggleFullscreen}
                size="small"
              />
            </Space>
          </div>
        }
        className="mb-6"
      >
        <Row gutter={[24, 16]} className="mb-6">
          <Col span={8}>
            <Text strong>部门：</Text>
            <Tag color="blue">{document.department}</Tag>
          </Col>
          <Col span={8}>
            <Text strong>类型：</Text>
            <Tag color="green">{document.documentType}</Tag>
          </Col>
          <Col span={8}>
            <Text strong>分类：</Text>
            <Tag color="orange">{document.category}</Tag>
          </Col>
          <Col span={8}>
            <Text strong>版本：</Text>
            <Tag color="purple">{document.version}</Tag>
          </Col>
          <Col span={8}>
            <Text strong>签发人：</Text>
            <span>{document.signatory || '未指定'}</span>
          </Col>
          <Col span={8}>
            <Text strong>签发日期：</Text>
            <span>{document.signatureDate ? moment(document.signatureDate).format('YYYY-MM-DD') : '未指定'}</span>
          </Col>
          <Col span={8}>
            <Text strong>生效日期：</Text>
            <span>{document.effectiveDate ? moment(document.effectiveDate).format('YYYY-MM-DD') : '未指定'}</span>
          </Col>
          <Col span={8}>
            <Text strong>上传时间：</Text>
            <span>{moment(document.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
          </Col>
          <Col span={8}>
            <Text strong>上传人：</Text>
            <span>{document.uploadedBy?.fullName}</span>
          </Col>
        </Row>

        <Divider />

        <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <Title level={1} style={{ marginTop: '2em', marginBottom: '1em' }}>
                  {children}
                </Title>
              ),
              h2: ({ children }) => (
                <Title level={2} style={{ marginTop: '1.5em', marginBottom: '0.8em' }}>
                  {children}
                </Title>
              ),
              h3: ({ children }) => (
                <Title level={3} style={{ marginTop: '1.2em', marginBottom: '0.6em' }}>
                  {children}
                </Title>
              ),
              p: ({ children }) => (
                <Paragraph style={{ marginBottom: '0.8em' }}>
                  {children}
                </Paragraph>
              ),
              ul: ({ children }) => (
                <ul style={{ marginBottom: '1em', paddingLeft: '20px' }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol style={{ marginBottom: '1em', paddingLeft: '20px' }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: '0.4em' }}>
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ 
                  borderLeft: '4px solid #d9d9d9', 
                  paddingLeft: '16px', 
                  margin: '1em 0', 
                  color: '#666' 
                }}>
                  {children}
                </blockquote>
              ),
              code: ({ children, inline }) => (
                <code style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: inline ? '2px 4px' : '4px 8px', 
                  borderRadius: '4px', 
                  fontFamily: 'Consolas, Monaco, monospace' 
                }}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '1em', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontFamily: 'Consolas, Monaco, monospace'
                }}>
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <table style={{ 
                  borderCollapse: 'collapse', 
                  width: '100%', 
                  margin: '1em 0' 
                }}>
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: '8px 12px', 
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left'
                }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: '8px 12px' 
                }}>
                  {children}
                </td>
              ),
            }}
          >
            {document.content}
          </ReactMarkdown>
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="mt-6">
            <Title level={4}>标签</Title>
            <Space wrap>
              {document.tags.map((tag, index) => (
                <Tag key={index} color="cyan">
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {document.description && (
          <div className="mt-6">
            <Title level={4}>文档描述</Title>
            <Paragraph>{document.description}</Paragraph>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p>文档ID：{document._id}</p>
          <p>文件大小：{(document.fileSize / 1024).toFixed(2)} KB</p>
          <p>最后更新：{moment(document.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
        </div>
      </Card>
    </div>
  );
};

export default DocumentPreview;