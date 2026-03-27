import React, { useState } from 'react';
import { Alert, Button, Form, Input, message, Modal, Progress, Space, Typography, Upload } from 'antd';
import { DeleteOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileUpload = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [form] = Form.useForm();

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: '.doc,.docx,.txt,.pdf',
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(t('uploadTooLarge'));
        return Upload.LIST_IGNORE;
      }
      setUploadedFiles((prev) => {
        if (!prev.find((current) => current.uid === file.uid)) {
          return [...prev, file];
        }
        return prev;
      });
      return false;
    },
    fileList: uploadedFiles,
    onRemove: (file) => {
      setUploadedFiles((prev) => prev.filter((current) => current.uid !== file.uid));
    },
  };

  const handleStartUploadClick = () => {
    if (uploadedFiles.length === 0) {
      message.warning(t('uploadWarningChoose'));
      return;
    }

    const initialValues = {};
    uploadedFiles.forEach((file, index) => {
      initialValues[`name_${index}`] = file.name.replace(/\.[^/.]+$/, '');
      initialValues[`version_${index}`] = '2025-01';
    });
    form.setFieldsValue(initialValues);
    setConfirmModalVisible(true);
  };

  const performActualUpload = async (values) => {
    setConfirmModalVisible(false);
    setUploading(true);
    setUploadProgress(0);

    const totalFiles = uploadedFiles.length;
    let completed = 0;

    for (let i = 0; i < totalFiles; i += 1) {
      const file = uploadedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('regulationName', values[`name_${i}`]);
      formData.append('version', values[`version_${i}`]);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          completed += 1;
          setUploadProgress(Math.round((completed / totalFiles) * 100));
        } else {
          message.error(`${file.name} ${t('uploadUploadFailed')}`);
        }
      } catch (error) {
        message.error(`${file.name} ${t('uploadUploadError')}: ${error.message}`);
      }
    }

    setUploading(false);

    if (completed === totalFiles) {
      message.success(t('uploadAllDone'));
      setUploadedFiles([]);
      navigate('/');
    } else if (completed > 0) {
      message.warning(`${t('uploadPartialDone')} (${completed}/${totalFiles})`);
      navigate('/');
    }
  };

  const getFileType = (filename) => {
    const ext = filename?.toLowerCase().split('.').pop() || '';
    const typeMap = {
      docx: t('uploadTypeWord'),
      doc: t('uploadTypeWord'),
      txt: t('uploadTypeText'),
      pdf: t('uploadTypePdf'),
    };
    return typeMap[ext] || t('uploadTypeUnknown');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / (1024 ** index)).toFixed(2))} ${units[index]}`;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 20px 56px', width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>{t('uploadTitle')}</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>{t('uploadSubtitle')}</Text>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          padding: 28,
          marginBottom: 24,
        }}
      >
        <Dragger
          {...uploadProps}
          style={{
            marginBottom: 16,
            background: 'rgba(0,0,0,0.02)',
            borderRadius: 20,
            border: '2px dashed #00B3BA',
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#00B3BA', fontSize: 48 }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>{t('uploadDropTitle')}</p>
          <p className="ant-upload-hint" style={{ color: '#86868b' }}>{t('uploadDropHint')}</p>
        </Dragger>

        <Alert
          message={t('uploadRequirements')}
          description={t('uploadRequirementsDesc')}
          type="info"
          showIcon
          style={{ borderRadius: 16, marginTop: 16 }}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            WebkitBackdropFilter: 'blur(20px)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            padding: 28,
            marginBottom: 24,
          }}
        >
          <Title level={5} style={{ marginBottom: 16 }}>
            {t('uploadPending')} ({uploadedFiles.length})
          </Title>

          <Space direction="vertical" style={{ width: '100%' }}>
            {uploadedFiles.map((file) => (
              <div
                key={file.uid}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 16,
                }}
              >
                <div>
                  <Text strong>{file.name}</Text>
                  <div style={{ fontSize: 12, color: '#86868b' }}>
                    {getFileType(file.name)} · {formatFileSize(file.size)}
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setUploadedFiles((prev) => prev.filter((current) => current.uid !== file.uid))}
                >
                  {t('uploadRemove')}
                </Button>
              </div>
            ))}
          </Space>

          {uploading && (
            <div style={{ marginTop: 20 }}>
              <Progress percent={uploadProgress} status="active" strokeColor={{ from: '#00B3BA', to: '#2f80ed' }} />
            </div>
          )}

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setUploadedFiles([]); form.resetFields(); }} style={{ borderRadius: 12 }} disabled={uploading}>
                {t('uploadClear')}
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleStartUploadClick}
                loading={uploading}
                style={{ borderRadius: 12 }}
              >
                {uploading ? t('uploadUploading') : t('uploadStart')}
              </Button>
            </Space>
          </div>
        </div>
      )}

      <Modal
        title={t('uploadConfirmTitle')}
        open={confirmModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setConfirmModalVisible(false)}
        okText={t('uploadConfirmOk')}
        cancelText={t('uploadConfirmCancel')}
        width={600}
        destroyOnClose
      >
        <Alert message={t('uploadConfirmHint')} type="info" showIcon style={{ marginBottom: 20 }} />
        <Form form={form} layout="vertical" onFinish={performActualUpload}>
          {uploadedFiles.map((file, index) => (
            <div
              key={file.uid}
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: '#f5f5f5',
                borderRadius: 8,
              }}
            >
              <Text strong style={{ display: 'block', marginBottom: 12 }}>{file.name}</Text>
              <Space style={{ display: 'flex', width: '100%' }} align="start">
                <Form.Item
                  name={`name_${index}`}
                  label={t('uploadRegulationName')}
                  rules={[{ required: true, message: t('uploadRequired') }]}
                  style={{ flex: 1, margin: 0 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name={`version_${index}`}
                  label={t('uploadVersion')}
                  rules={[{ required: true, message: t('uploadRequired') }]}
                  style={{ width: 180, margin: 0 }}
                >
                  <Input placeholder={t('uploadVersionPlaceholder')} />
                </Form.Item>
              </Space>
            </div>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default FileUpload;
