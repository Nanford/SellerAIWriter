import api from './client.js';

/**
 * 上传产品图片
 * @param {File} imageFile - 图片文件
 * @returns {Promise<Object>} 上传结果
 */
export const uploadImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('图片上传失败:', error);
    return { 
      success: false,
      error: error.message,
      path: null
    };
  }
};

/**
 * 生成商品内容
 * @param {string} text - 商品文本描述
 * @param {string} platform - 目标平台 (amazon | ebay)
 * @param {string|null} imagePath - 图片路径 (可选)
 * @param {string} modelProvider - 使用的AI模型提供商 (openai | gemini)
 * @param {string} modelVersion - 使用的AI模型具体版本 (e.g., gpt-4o)
 * @returns {Promise<Object>} 生成的内容
 */
export const generateContent = async (text, platform = 'amazon', imagePath = null, modelProvider = 'openai', modelVersion = 'gpt-4o') => {
  try {
    const payload = {
      text,
      platform,
      imagePath,
      model: modelProvider, // Keep 'model' field name for backend compatibility for now
      modelVersion       // Add modelVersion
    };
    
    console.log("Sending generate payload to API:", payload);
    const response = await api.post('/generate', payload);
    console.log("API response for generate:", response);
    return response.data;
  } catch (error) {
    console.error('Content generation failed - Error object:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    
    // If available, display server error message
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(`服务器错误: ${error.response.data.error}`);
    }
    
    // If server sent fallback data, use it
    if (error.response && error.response.data && error.response.data.fallbackData) {
      console.log('Using fallback data:', error.response.data.fallbackData);
      return error.response.data.fallbackData;
    }
    
    // Otherwise throw the error to be caught by the component
    throw error;
  }
};

/**
 * 翻译内容
 * @param {Object} content - 需要翻译的内容
 * @param {string} targetLanguage - 目标语言代码
 * @param {string} modelProvider - 使用的AI模型提供商 (openai | gemini)
 * @param {string} modelVersion - 使用的AI模型具体版本 (e.g., gpt-4o)
 * @returns {Promise<Object>} 翻译后的内容
 */
export const translateContent = async (content, targetLanguage, modelProvider = 'openai', modelVersion = 'gpt-4o') => {
  console.log('Translating content with params:', { targetLanguage, modelProvider, modelVersion });
  try {
    const payload = {
      content,
      targetLanguage,
      model: modelProvider, // Keep 'model' field name
      modelVersion       // Add modelVersion
    };
    
    console.log("Sending translate payload to API:", payload);
    const response = await api.post('/translate', payload);
    console.log("API response for translate:", response);
    return response.data;
  } catch (error) {
    console.error('翻译失败:', error);
    // 尝试从错误响应中获取后备数据或返回原始内容
    if (error.response && error.response.data && error.response.data.fallbackData) {
      console.warn('Translation API failed, using fallback data.');
      return error.response.data.fallbackData;
    } else {
      console.warn('Translation API failed, returning original content.');
      // 返回原始 content 以避免 UI 崩溃，并在控制台警告
      return content;
    }
  }
};

/**
 * 保存记录
 * @param {Object} data - 要保存的数据
 * @returns {Promise<Object>} 保存结果
 */
export const saveRecord = async (data) => {
  try {
    const response = await api.post('/records/save', data);
    return response.data;
  } catch (error) {
    console.error('保存记录失败:', error);
    alert(`保存记录失败: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * 获取历史记录
 * @returns {Promise<Array>} 历史记录列表
 */
export const getRecords = async () => {
  try {
    const response = await api.get('/records');
    return response.data;
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return [];
  }
};

export default api; 