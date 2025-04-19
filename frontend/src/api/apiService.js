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
    
    const response = await api.post('/generate', payload);
    return response.data;
  } catch (error) {
    console.error('内容生成失败:', error);
    
    // 尝试从错误响应中获取后备数据
    if (error.response && error.response.data && error.response.data.fallbackData) {
      console.log('使用后备数据:', error.response.data.fallbackData);
      return error.response.data.fallbackData;
    }
    
    // 如果没有后备数据，返回基本结构
    return {
      title: text ? text.substring(0, 100) : "生成失败",
      description: "生成内容时发生错误，请稍后重试。错误信息: " + error.message,
      bulletPoints: ["生成失败，请稍后重试"],
      keywords: [],
      category: [],
      itemSpecifics: {}
    };
  }
};

/**
 * 翻译内容
 * @param {Object} content - 需要翻译的内容
 * @param {string} targetLanguage - 目标语言代码
 * @param {string} model - 使用的AI模型 (openai | gemini)
 * @returns {Promise<Object>} 翻译后的内容
 */
export const translateContent = async (content, targetLanguage, model = 'openai') => {
  try {
    const payload = {
      content,
      targetLanguage,
      model
    };
    
    const response = await api.post('/translate', payload);
    return response.data;
  } catch (error) {
    console.error('翻译失败:', error);
    
    // 尝试从错误响应中获取后备数据
    if (error.response && error.response.data && error.response.data.fallbackData) {
      return error.response.data.fallbackData;
    }
    
    // 如果没有后备数据，返回原始内容
    alert(`翻译失败: ${error.message}`);
    return content;
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