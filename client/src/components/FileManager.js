import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Empty,
  Form,
  Input,
  Menu,
  Modal,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import {
  BarsOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../i18n';

const { Title, Text } = Typography;

const highlightSidebarText = (text, search) => {
  if (!search) return text;
  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  return (
    <>
      {parts.map((part, index) => (
        part.toLowerCase() === search.toLowerCase()
          ? <mark key={`${part}-${index}`} style={{ backgroundColor: '#fff176', padding: '0 2px', borderRadius: 2 }}>{part}</mark>
          : part
      ))}
    </>
  );
};

const getSlug = (text) => text.toLowerCase()
  .replace(/(\*\*|__|\*|_|`{1,3})/g, '')
  .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
  .replace(/(^-|-$)/g, '');

const extractText = (children) => React.Children.toArray(children).map((child) => {
  if (typeof child === 'string' || typeof child === 'number') return child;
  if (child?.props?.children) return extractText(child.props.children);
  return '';
}).join('');

const buildOutline = (markdown) => {
  if (!markdown) return [];
  return markdown
    .split('\n')
    .map((line) => line.match(/^(#{1,6})\s+(.*)$/))
    .filter(Boolean)
    .map((match) => {
      const text = match[2].trim().replace(/(\*\*|__|\*|_|`{1,3})/g, '');
      return {
        level: match[1].length,
        text,
        id: `heading-${getSlug(text)}`,
      };
    });
};

const FileManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [savedHighlights, setSavedHighlights] = useState([]);
  const [selection, setSelection] = useState(null);
  const [showHighlightBtn, setShowHighlightBtn] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [form] = Form.useForm();

  const groupedFiles = useMemo(() => {
    const groups = {};
    files.forEach((file) => {
      const name = file.regulationName || 'Untitled';
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(file);
    });
    Object.keys(groups).forEach((name) => {
      groups[name] = groups[name].sort((a, b) => b.version.localeCompare(a.version));
    });
    return groups;
  }, [files]);

  const regulationNames = useMemo(
    () => Object.keys(groupedFiles)
      .filter((name) => name.toLowerCase().includes(globalSearch.toLowerCase()))
      .sort(),
    [groupedFiles, globalSearch],
  );

  const currentVersions = selectedReg ? groupedFiles[selectedReg] || [] : [];
  const selectedFile = currentVersions.find((file) => file.id === selectedVersionId) || null;
  const outlineData = useMemo(() => buildOutline(previewContent), [previewContent]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      message.error(t('filesLoadListFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadSavedHighlights = useCallback(async () => {
    if (!selectedVersionId) {
      setSavedHighlights([]);
      return;
    }
    try {
      const response = await fetch('/api/highlights');
      const data = await response.json();
      setSavedHighlights(data.filter((item) => item.fileId === selectedVersionId));
    } catch (error) {
      console.error('Failed to load highlights', error);
    }
  }, [selectedVersionId]);

  const loadPreview = useCallback(async (id) => {
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/files/${id}/content`);
      const data = await response.json();
      setPreviewContent(data.content || '');
    } catch (error) {
      message.error(t('filesLoadContentFailed'));
    } finally {
      setPreviewLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    loadSavedHighlights();
  }, [loadSavedHighlights]);

  useEffect(() => {
    if (selectedVersionId) {
      loadPreview(selectedVersionId);
    } else {
      setPreviewContent('');
    }
  }, [selectedVersionId, loadPreview]);

  useEffect(() => {
    const docId = searchParams.get('id');
    const searchText = searchParams.get('find');
    if (docId && files.length > 0) {
      const file = files.find((item) => item.id === docId);
      if (file) {
        setSelectedReg(file.regulationName);
        setSelectedVersionId(file.id);
        if (searchText) {
          setPageSearch(decodeURIComponent(searchText));
        }
      }
    }
  }, [files, searchParams]);

  useEffect(() => {
    const container = document.getElementById('content-scroller');
    if (!container) return undefined;
    const handleMouseUp = () => {
      const currentSelection = window.getSelection();
      if (currentSelection && currentSelection.toString().trim()) {
        const range = currentSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection(currentSelection.toString().trim());
        setBtnPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        setShowHighlightBtn(true);
      } else {
        setShowHighlightBtn(false);
      }
    };
    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [previewContent]);

  useEffect(() => {
    const container = document.getElementById('markdown-content-area');
    if (!container) return;

    container.querySelectorAll('mark.page-search-match').forEach((node) => {
      const parent = node.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(node.textContent), node);
        parent.normalize();
      }
    });

    if (!pageSearch) {
      setSearchCount(0);
      setSearchIndex(0);
      return;
    }

    const walk = (node) => {
      if (node.nodeType === 3) {
        const content = node.textContent;
        const lowerContent = content.toLowerCase();
        const lowerSearch = pageSearch.toLowerCase();
        if (!lowerContent.includes(lowerSearch)) return;

        const fragment = document.createDocumentFragment();
        let start = 0;
        let index = lowerContent.indexOf(lowerSearch, start);
        while (index !== -1) {
          fragment.appendChild(document.createTextNode(content.slice(start, index)));
          const mark = document.createElement('mark');
          mark.className = 'page-search-match';
          mark.style.backgroundColor = '#ffeb3b';
          mark.style.color = 'inherit';
          mark.textContent = content.slice(index, index + lowerSearch.length);
          fragment.appendChild(mark);
          start = index + lowerSearch.length;
          index = lowerContent.indexOf(lowerSearch, start);
        }
        fragment.appendChild(document.createTextNode(content.slice(start)));
        node.parentNode.replaceChild(fragment, node);
      } else if (node.nodeType === 1 && !['MARK', 'SCRIPT', 'STYLE'].includes(node.tagName)) {
        Array.from(node.childNodes).forEach(walk);
      }
    };

    walk(container);
    const matches = container.querySelectorAll('mark.page-search-match');
    setSearchCount(matches.length);
    if (matches.length > 0) {
      setSearchIndex(0);
      matches[0].style.backgroundColor = '#ff9800';
      matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [pageSearch, previewContent]);

  useEffect(() => {
    const container = document.getElementById('markdown-content-area');
    if (!container) return;

    container.querySelectorAll('mark.saved-highlight').forEach((node) => {
      const parent = node.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(node.textContent), node);
        parent.normalize();
      }
    });

    if (!savedHighlights.length) return;

    const textNodes = [];
    let fullText = '';

    const walkNodes = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          textNodes.push({
            node: child,
            start: fullText.length,
            end: fullText.length + child.textContent.length,
          });
          fullText += child.textContent;
        } else if (child.nodeType === 1 && !['MARK', 'SCRIPT', 'STYLE'].includes(child.tagName)) {
          walkNodes(child);
        }
      });
    };

    walkNodes(container);

    savedHighlights.forEach((highlight) => {
      const startIndex = fullText.indexOf(highlight.text);
      if (startIndex === -1) return;
      const endIndex = startIndex + highlight.text.length;
      const nodesToMark = textNodes.filter((node) => node.end > startIndex && node.start < endIndex);

      nodesToMark.forEach((entry) => {
        const nodeText = entry.node.textContent;
        const startInNode = Math.max(0, startIndex - entry.start);
        const endInNode = Math.min(nodeText.length, endIndex - entry.start);
        const fragment = document.createDocumentFragment();
        fragment.appendChild(document.createTextNode(nodeText.slice(0, startInNode)));

        const mark = document.createElement('mark');
        mark.className = 'saved-highlight';
        mark.style.backgroundColor = '#fff176';
        mark.style.cursor = 'pointer';
        mark.textContent = nodeText.slice(startInNode, endInNode);
        mark.onclick = async (event) => {
          event.stopPropagation();
          try {
            const response = await fetch(`/api/highlights/${highlight.id}`, { method: 'DELETE' });
            if (response.ok) {
              loadSavedHighlights();
            }
          } catch (error) {
            console.error('Failed to delete highlight', error);
          }
        };

        fragment.appendChild(mark);
        fragment.appendChild(document.createTextNode(nodeText.slice(endInNode)));
        entry.node.parentNode.replaceChild(fragment, entry.node);
      });

      fullText = `${fullText.slice(0, startIndex)}${' '.repeat(highlight.text.length)}${fullText.slice(endIndex)}`;
    });
  }, [savedHighlights, loadSavedHighlights, previewContent]);

  const handleNextSearch = () => {
    if (searchCount === 0) return;
    const matches = document.querySelectorAll('mark.page-search-match');
    const next = searchIndex + 1 >= searchCount ? 0 : searchIndex + 1;
    matches[searchIndex].style.backgroundColor = '#ffeb3b';
    matches[next].style.backgroundColor = '#ff9800';
    matches[next].scrollIntoView({ behavior: 'smooth', block: 'center' });
    setSearchIndex(next);
  };

  const handlePrevSearch = () => {
    if (searchCount === 0) return;
    const matches = document.querySelectorAll('mark.page-search-match');
    const prev = searchIndex - 1 < 0 ? searchCount - 1 : searchIndex - 1;
    matches[searchIndex].style.backgroundColor = '#ffeb3b';
    matches[prev].style.backgroundColor = '#ff9800';
    matches[prev].scrollIntoView({ behavior: 'smooth', block: 'center' });
    setSearchIndex(prev);
  };

  const handleEditMetadata = async (values) => {
    if (!editingFile) return;
    try {
      const response = await fetch(`/api/files/${editingFile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        message.success(t('filesUpdateSuccess'));
        setEditModalVisible(false);
        loadFiles();
      }
    } catch (error) {
      message.error(t('filesUpdateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!selectedFileToDelete) return;
    try {
      const response = await fetch(`/api/files/${selectedFileToDelete.id}`, { method: 'DELETE' });
      if (response.ok) {
        message.success(t('filesDeleteSuccess'));
        setDeleteModalVisible(false);
        if (selectedVersionId === selectedFileToDelete.id) {
          setSelectedVersionId(null);
          setSelectedReg(null);
          setPreviewContent('');
        }
        loadFiles();
      }
    } catch (error) {
      message.error(t('filesDeleteFailed'));
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    message.loading(t('filesDownloadPreparing'), 0.5);
    try {
      const response = await fetch(`/api/files/download/${selectedFile.id}`);
      if (!response.ok) throw new Error('download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', selectedFile.name || 'document');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error(`${t('filesDownloadFailed')}: ${error.message}`);
    }
  };

  const saveHighlight = async (note = '') => {
    if (!selection || !selectedFile) return;
    try {
      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selection,
          fileId: selectedFile.id,
          regulationName: selectedFile.regulationName,
          version: selectedFile.version,
          note,
        }),
      });
      if (response.ok) {
        setShowHighlightBtn(false);
        window.getSelection()?.removeAllRanges();
        loadSavedHighlights();
      }
    } catch (error) {
      message.error(t('highlightsActionFailed'));
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '0 16px 16px', gap: 16 }}>
        <div
          style={{
            width: sidebarCollapsed ? 0 : 300,
            transition: 'width 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 24,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            overflow: sidebarCollapsed ? 'visible' : 'hidden',
            position: 'relative',
          }}
        >
          {sidebarCollapsed ? (
            <Button
              icon={<MenuUnfoldOutlined />}
              style={{ position: 'absolute', right: -42, bottom: 24, borderRadius: 10 }}
              onClick={() => setSidebarCollapsed(false)}
            />
          ) : (
            <>
              <div style={{ padding: 16 }}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder={t('filesSearchRegulation')}
                  value={globalSearch}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                  allowClear
                  style={{ borderRadius: 20, height: 40 }}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
                <Menu
                  mode="inline"
                  style={{ background: 'transparent', borderRight: 'none' }}
                  items={regulationNames.map((regName) => ({
                    key: `reg-${regName}`,
                    label: <Text strong>{highlightSidebarText(regName, globalSearch)}</Text>,
                    children: groupedFiles[regName].map((file) => ({
                      key: file.id,
                      label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ fontSize: 13, fontWeight: selectedVersionId === file.id ? 600 : 400 }}>{file.version}</span>
                          <Space size={4}>
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined style={{ fontSize: 12 }} />}
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditingFile(file);
                                form.setFieldsValue({ regulationName: file.regulationName, version: file.version });
                                setEditModalVisible(true);
                              }}
                            />
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedFileToDelete(file);
                                setDeleteModalVisible(true);
                              }}
                            />
                          </Space>
                        </div>
                      ),
                      onClick: () => {
                        setSelectedReg(regName);
                        setSelectedVersionId(file.id);
                      },
                    })),
                  }))}
                  selectedKeys={selectedVersionId ? [selectedVersionId] : []}
                />
              </div>
              <div style={{ padding: 16, borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'right' }}>
                <Button type="text" icon={<MenuFoldOutlined />} onClick={() => setSidebarCollapsed(true)} />
              </div>
            </>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            borderRadius: 24,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {selectedFile ? (
            <>
              <div
                style={{
                  minHeight: 96,
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <Space>
                  <Button
                    icon={isFullWidth ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    title={isFullWidth ? t('filesExitFullWidth') : t('filesEnterFullWidth')}
                    onClick={() => setIsFullWidth((prev) => !prev)}
                  />
                  <Button icon={<DownloadOutlined />} shape="circle" onClick={handleDownload} />
                </Space>

                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <Title level={4} style={{ margin: 0 }}>{selectedFile.regulationName}</Title>
                  <Space style={{ marginTop: 8 }} wrap>
                    <div style={{ fontSize: 13, background: 'rgba(0, 179, 186, 0.08)', padding: '2px 10px', borderRadius: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11, marginRight: 6 }}>{t('filesVersion')}</Text>
                      <Text strong style={{ color: '#00B3BA' }}>{selectedFile.version}</Text>
                    </div>
                    <div style={{ fontSize: 13, background: 'rgba(0,0,0,0.02)', padding: '2px 10px', borderRadius: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11, marginRight: 6 }}>{t('filesUploadedAt')}</Text>
                      <Text>{selectedFile.uploadDate?.split('T')[0]}</Text>
                    </div>
                  </Space>
                </div>

                <Button icon={<BarsOutlined />} onClick={() => setOutlineCollapsed((prev) => !prev)} type={outlineCollapsed ? 'primary' : 'default'}>
                  {t('filesOutline')}
                </Button>
              </div>

              <div style={{ padding: '8px 24px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Input
                    placeholder={t('filesSearchDocument')}
                    prefix={<SearchOutlined />}
                    value={pageSearch}
                    onChange={(event) => setPageSearch(event.target.value)}
                    onPressEnter={handleNextSearch}
                    style={{ width: 240, borderRadius: 20, height: 36 }}
                  />
                  {searchCount > 0 && <Badge count={`${searchIndex + 1}/${searchCount}`} style={{ backgroundColor: '#00B3BA' }} />}
                </Space>
                <Space>
                  <Button type="text" size="small" icon={<UpOutlined />} onClick={handlePrevSearch} disabled={searchCount === 0} />
                  <Button type="text" size="small" icon={<DownOutlined />} onClick={handleNextSearch} disabled={searchCount === 0} />
                </Space>
              </div>

              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div
                  id="content-scroller"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: isFullWidth ? '40px 4%' : '40px 10%',
                    background: '#fff',
                  }}
                >
                  {previewLoading ? (
                    <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>
                  ) : (
                    <div style={{ maxWidth: 900, margin: '0 auto' }}>
                      <div id="markdown-content-area" className="markdown-preview" style={{ lineHeight: 1.8, fontSize: 16 }}>
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => {
                              const text = extractText(children);
                              return <h1 id={`heading-${getSlug(text)}`} style={{ scrollMarginTop: 100 }}>{children}</h1>;
                            },
                            h2: ({ children }) => {
                              const text = extractText(children);
                              return <h2 id={`heading-${getSlug(text)}`} style={{ scrollMarginTop: 100 }}>{children}</h2>;
                            },
                            h3: ({ children }) => {
                              const text = extractText(children);
                              return <h3 id={`heading-${getSlug(text)}`} style={{ scrollMarginTop: 100 }}>{children}</h3>;
                            },
                          }}
                        >
                          {previewContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {!outlineCollapsed && (
                  <div
                    style={{
                      width: 260,
                      background: 'rgba(255, 255, 255, 0.92)',
                      borderLeft: '1px solid rgba(0,0,0,0.06)',
                      padding: 20,
                      overflowY: 'auto',
                    }}
                  >
                    <Title level={5} style={{ marginBottom: 20 }}>{t('filesOutlineTitle')}</Title>
                    {outlineData.length > 0 ? outlineData.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: 8,
                          fontSize: 13,
                          marginLeft: (item.level - 1) * 16,
                          marginBottom: 4,
                        }}
                        onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      >
                        {item.text}
                      </div>
                    )) : <Empty description={t('filesOutlineEmpty')} />}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.55 }}>
              {loading ? <Spin size="large" /> : (
                <>
                  <FileTextOutlined style={{ fontSize: 80, marginBottom: 24 }} />
                  <Title level={3} style={{ fontWeight: 300 }}>{t('filesSelectDoc')}</Title>
                  <Button type="primary" size="large" icon={<CloudUploadOutlined />} style={{ marginTop: 20 }} onClick={() => navigate('/upload')}>
                    {t('filesUploadAction')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        title={t('filesEditTitle')}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        okText={t('filesSave')}
        cancelText={t('filesCancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleEditMetadata}>
          <Form.Item name="regulationName" label={t('filesRegulationName')} rules={[{ required: true, message: t('filesRequiredName') }]}>
            <Input placeholder={t('filesRegulationPlaceholder')} />
          </Form.Item>
          <Form.Item name="version" label={t('filesVersion')} rules={[{ required: true, message: t('filesRequiredVersion') }]}>
            <Input placeholder={t('filesVersionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('filesDeleteConfirmTitle')}
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText={t('filesDeleteConfirmOk')}
        cancelText={t('filesDeleteConfirmCancel')}
        okType="danger"
      >
        <p>
          {t('filesDeletePrompt')}
          <b>{selectedFileToDelete?.regulationName} ({selectedFileToDelete?.version})</b>
          {t('filesDeletePromptSuffix')}
        </p>
      </Modal>

      {showHighlightBtn && (
        <div
          style={{
            position: 'fixed',
            left: btnPos.x,
            top: btnPos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 14,
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            minWidth: 220,
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          }}
        >
          <Input.TextArea
            placeholder={t('highlightsNotePlaceholder')}
            autoSize={{ minRows: 1, maxRows: 3 }}
            id="highlight-note-input"
            style={{ borderRadius: 8 }}
          />
          <Button
            type="primary"
            block
            shape="round"
            icon={<EditOutlined />}
            onClick={() => saveHighlight(document.getElementById('highlight-note-input')?.value)}
          >
            {t('highlightsAddToCollection')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileManager;
