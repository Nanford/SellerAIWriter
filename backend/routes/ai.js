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
    const { text, platform = 'amazon', imagePath, model = 'openai' } = req.body;
    
    console.log('🔍 Processing request parameters:');
    console.log('- Text:', text ? text.substring(0, 50) + '...' : 'None');
    console.log('- Platform:', platform);
    console.log('- Image Path:', imagePath || 'None');
    console.log('- Model:', model);
    
    // Check for image
    let imageBase64 = null;
    if (imagePath) {
      try {
        console.log('🖼️ Attempting to read image from:', imagePath);
        const imageBuffer = safeReadFile(imagePath); // Assuming safeReadFile is defined elsewhere
        if (imageBuffer) {
          imageBase64 = imageBuffer.toString('base64');
          console.log('✅ Image successfully loaded and converted to Base64');
        } else {
          console.error('❌ Image file not found or empty at path:', imagePath);
        }
      } catch (fileError) {
        console.error('❌ Error processing image:', fileError);
        // Decide if you want to proceed without the image or return an error
        // For now, we'll proceed without the image
      }
    }
    
    console.log(`🤖 Will use ${model} model for content generation`);
    
    let result;
    console.log('🚀 Calling API...');
    const startTime = Date.now();
    
    if (model === 'gemini') {
      console.log('📡 Calling Gemini API...');
      result = await generateContentGemini(text || "", imageBase64, platform);
    } else {
      console.log('📡 Calling OpenAI API...');
      result = await generateContentOpenAI(text || "", imageBase64, platform);
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
  try {
    const { content, targetLanguage, model = 'openai' } = req.body;
    
    // 强制禁用本地模式，确保使用API
    const useLocalMode = false;
    
    if (useLocalMode) {
      // 为不同语言返回简单翻译示例
      const demoTranslations = {
        en: {
          title: "English Translation Example",
          description: "This is an example of translated content in English.",
          bulletPoints: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
          keywords: ["keyword1", "keyword2", "keyword3"],
          category: ["Example Category"],
          itemSpecifics: content.itemSpecifics || {}
        },
        de: {
          title: "Beispiel für deutsche Übersetzung",
          description: "Dies ist ein Beispiel für übersetzte Inhalte auf Deutsch.",
          bulletPoints: ["Punkt 1", "Punkt 2", "Punkt 3", "Punkt 4", "Punkt 5"],
          keywords: ["Schlüsselwort1", "Schlüsselwort2", "Schlüsselwort3"],
          category: ["Beispielkategorie"],
          itemSpecifics: content.itemSpecifics || {}
        },
        fr: {
          title: "Exemple de traduction française",
          description: "Voici un exemple de contenu traduit en français.",
          bulletPoints: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
          keywords: ["mot-clé1", "mot-clé2", "mot-clé3"],
          category: ["Catégorie d'exemple"],
          itemSpecifics: content.itemSpecifics || {}
        },
        it: {
          title: "Esempio di traduzione italiana",
          description: "Questo è un esempio di contenuto tradotto in italiano.",
          bulletPoints: ["Punto 1", "Punto 2", "Punto 3", "Punto 4", "Punto 5"],
          keywords: ["parola chiave1", "parola chiave2", "parola chiave3"],
          category: ["Categoria di esempio"],
          itemSpecifics: content.itemSpecifics || {}
        }
      };
      
      return res.json(demoTranslations[targetLanguage] || demoTranslations.en);
    }
    
    if (!content || !targetLanguage) {
      return res.status(400).json({ error: '缺少内容或目标语言' });
    }
    
    console.log(`将使用 ${model} 模型进行翻译到 ${targetLanguage}`);
    
    let result;
    console.log(`[Translate Route] Calling ${model} service...`); // Log before
    if (model === 'gemini') {
      console.log('调用Gemini API进行翻译...');
      result = await translateContentGemini(content, targetLanguage);
    } else {
      console.log('调用OpenAI API进行翻译...');
      result = await translateContentOpenAI(content, targetLanguage);
    }
    console.log(`[Translate Route] ${model} service call returned.`); // Log after
    
    console.log('翻译API调用成功，返回结果');
    res.json(result);
  } catch (error) {
    console.error('[Translate Route] Caught error:', error); // Ensure errors here are logged
    console.error('翻译错误:', error);
    res.status(500).json({ 
      error: '翻译失败', 
      details: error.message,
      // 返回原始内容作为后备
      fallbackData: req.body.content || {}
    });
  }
});

export default router;