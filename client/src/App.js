import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Button, Segmented } from 'antd';
import { UploadOutlined, BookOutlined, ReadOutlined, FileTextOutlined } from '@ant-design/icons';
import FileManager from './components/FileManager';
import FileUpload from './components/FileUpload';
import FilePreview from './components/FilePreview';
import Highlights from './components/Highlights';
import { LanguageProvider, useLanguage } from './i18n';
import './App.css';

const { Header, Content } = Layout;

const NavBar = () => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  return (
    <Header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      height: 64,
      padding: '0 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.85)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      backdropFilter: 'blur(20px) saturate(160%)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#00B3BA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ReadOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#231815',
          letterSpacing: '-0.02em',
        }}>
          {t('appTitle')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Segmented
          size="middle"
          value={language}
          onChange={setLanguage}
          options={[
            { label: t('langChinese'), value: 'zh-CN' },
            { label: t('langEnglish'), value: 'en-US' },
          ]}
        />
        <Link to="/upload">
          <Button
            type={location.pathname === '/upload' ? 'primary' : 'default'}
            icon={<UploadOutlined />}
            style={{ borderRadius: 10, border: location.pathname === '/upload' ? 'none' : '1px solid #d9d9d9' }}
          >
            {t('navUpload')}
          </Button>
        </Link>
        <Link to="/">
          <Button
            type={location.pathname === '/' || location.pathname === '/files' ? 'primary' : 'default'}
            icon={<FileTextOutlined />}
            style={{ borderRadius: 10, border: (location.pathname === '/' || location.pathname === '/files') ? 'none' : '1px solid #d9d9d9' }}
          >
            {t('navFiles')}
          </Button>
        </Link>
        <Link to="/highlights">
          <Button
            type={location.pathname === '/highlights' ? 'primary' : 'default'}
            icon={<BookOutlined />}
            style={{ borderRadius: 10, border: location.pathname === '/highlights' ? 'none' : '1px solid #d9d9d9' }}
          >
            {t('navHighlights')}
          </Button>
        </Link>
      </div>
    </Header>
  );
};

const AppShell = () => {
  useEffect(() => {
    const checkUploadsDir = async () => {
      try {
        await fetch('/api/files');
      } catch (error) {
        console.error('Failed to check uploads directory', error);
      }
    };
    checkUploadsDir();
  }, []);

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <NavBar />
        <Content style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<FileManager />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/upload" element={<FileUpload />} />
            <Route path="/preview/:id" element={<FilePreview />} />
            <Route path="/highlights" element={<Highlights />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

const App = () => (
  <LanguageProvider>
    <AppShell />
  </LanguageProvider>
);

export default App;
