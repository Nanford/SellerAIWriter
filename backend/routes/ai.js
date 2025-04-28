import express from 'express';
import { generateContentOpenAI, translateContentOpenAI } from '../services/openai.js';
import { generateContentGemini, translateContentGemini } from '../services/gemini.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 调试辅助函数
const safeReadFile = (filePath) => {
  try {
    if (!filePath) return null;
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      return null;
    }
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(`读取文件错误 ${filePath}:`, error);
    return null;
  }
};

/**
 * 处理生成请求的路由
 */
router.post('/generate', async (req, res) => {
  console.log('📥 Received generate request:', req.body);
  
  try {
    // Extract provider and specific version
    const { text, platform = 'amazon', imagePath, model: modelProvider = 'openai', modelVersion = 'gpt-4o' } = req.body;
    
    console.log('🔍 Processing request parameters:');
    console.log('- Text:', text ? text.substring(0, 50) + '...' : 'None');
    console.log('- Platform:', platform);
    console.log('- Image Path:', imagePath || 'None');
    console.log('- Model Provider:', modelProvider);
    console.log('- Model Version:', modelVersion);
    
    // Check for image
    let imageBase64 = null;
    if (imagePath) {
      try {
        console.log('🖼️ Attempting to read image from:', imagePath);
        // Assuming imagePath is relative to project root or an absolute path
        // Adjust path logic if needed, e.g., using path.join(__dirname, '..', imagePath) if relative to backend/uploads
        const absoluteImagePath = path.resolve(imagePath.startsWith('/') ? imagePath.substring(1) : imagePath); // Attempt to resolve path
        console.log('🖼️ Resolved image path to:', absoluteImagePath);
        const imageBuffer = safeReadFile(absoluteImagePath);
        if (imageBuffer) {
          imageBase64 = imageBuffer.toString('base64');
          console.log('✅ Image successfully loaded and converted to Base64');
        } else {
          console.error('❌ Image file not found or empty at path:', absoluteImagePath);
        }
      } catch (fileError) {
        console.error('❌ Error processing image:', fileError);
        // Decide if you want to proceed without the image or return an error
        // For now, we'll proceed without the image
      }
    }
    
    console.log(`🤖 Will use ${modelProvider} service with model version ${modelVersion} for content generation`);
    
    let result;
    console.log('🚀 Calling API...');
    const startTime = Date.now();
    
    // Pass modelVersion to the service function
    if (modelProvider === 'gemini') {
      console.log('📡 Calling Gemini API...');
      result = await generateContentGemini(text || "", imageBase64, platform, modelVersion);
    } else {
      console.log('📡 Calling OpenAI API...');
      result = await generateContentOpenAI(text || "", imageBase64, platform, modelVersion);
    }
    
    const endTime = Date.now();
    console.log(`✅ API call completed in ${(endTime - startTime) / 1000} seconds`);
    console.log('📤 Returning result to client');
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error in generation:', error);
    console.error('Error stack:', error.stack);
    
    // Send a meaningful error response
    res.status(500).json({ 
      error: 'Content generation failed', 
      details: error.message,
      // Include fallback data
      fallbackData: {
        title: "Generation Error",
        description: "Failed to generate content. Error: " + error.message,
        bulletPoints: ["Error occurred during generation"],
        keywords: [],
        category: [],
        itemSpecifics: {}
      }
    });
  }
});

/**
 * 处理翻译请求的路由
 */
router.post('/translate', async (req, res) => {
  console.log('[Translate Route] 收到翻译请求:', req.body);
  try {
    // Extract provider and specific version
    const { content, targetLanguage, model: modelProvider = 'openai', modelVersion = 'gpt-4o' } = req.body;
    
    if (!content || !targetLanguage) {
      console.error('[Translate Route] 错误: 缺少内容或目标语言');
      return res.status(400).json({ error: '缺少内容或目标语言' });
    }
    
    console.log(`[Translate Route] 将使用 ${modelProvider} 模型 (${modelVersion})进行翻译到 ${targetLanguage}`);
    
    let result;
    console.log(`[Translate Route] Calling ${modelProvider} service...`);
    // Pass modelVersion to the service function
    if (modelProvider === 'gemini') {
      result = await translateContentGemini(content, targetLanguage, modelVersion);
    } else {
      result = await translateContentOpenAI(content, targetLanguage, modelVersion);
    }
    console.log(`[Translate Route] ${modelProvider} service call returned.`);
    
    console.log('[Translate Route] 翻译API调用成功，返回结果给客户端');
    res.json(result);
  } catch (error) {
    // 确保捕获到任何未预料的错误并记录
    console.error('[Translate Route] 处理翻译请求时发生未捕获错误:', error);
    console.error('[Translate Route] 错误堆栈:', error.stack);
    res.status(500).json({ 
      error: '翻译失败（路由层）', 
      details: error.message,
      fallbackData: req.body.content || {}
    });
  }
});

export default router;