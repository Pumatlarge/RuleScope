// API服务配置 - 简化版文件管理器

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 文件管理API
export const fileAPI = {
  // 获取文件列表
  getFiles: async () => {
    const response = await fetch(`${API_BASE_URL}/files`);
    return response.json();
  },

  // 上传文件
  uploadFile: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  // 删除文件
  deleteFile: async (filename) => {
    const response = await fetch(`${API_BASE_URL}/files/${filename}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // 获取文件内容
  getFileContent: async (filename) => {
    const response = await fetch(`${API_BASE_URL}/files/${filename}/content`);
    return response.json();
  }
};

export default fileAPI;