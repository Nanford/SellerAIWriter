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
 * @param {string} model - 使用的AI模型 (openai | gemini)
 * @returns {Promise<Object>} 生成的内容
 */
export const generateContent = async (text, platform = 'amazon', imagePath = null, model = 'openai') => {
  try {
    const payload = {
      text,
      platform,
      imagePath,
      model
    };
    
    console.log("Sending payload to API:", payload);
    const response = await api.post('/generate', payload);
    console.log("API response:", response);
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
 * @param {string} model - 使用的AI模型 (openai | gemini)
 * @returns {Promise<Object>} 翻译后的内容
 */
export const translateContent = async (content, targetLanguage, model) => {
  console.log('Translating content with params:', { targetLanguage, model, contentType: typeof content });
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, targetLanguage, model }),
  });

  if (!response.ok) {
    console.error('翻译失败:', response.statusText);
    return content;
  }

  return response.json();
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