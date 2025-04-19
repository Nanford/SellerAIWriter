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
  console.log('收到生成请求:', req.body);
  
  try {
    const { text, platform = 'amazon', imagePath, model = 'openai' } = req.body;
    
    // 强制禁用本地模式，确保使用API
    const useLocalMode = false;  
    
    if (useLocalMode) {
      console.log('使用本地模式生成数据');
      // 返回预设数据
      return res.json({
        title: `${platform === 'amazon' ? 'Amazon' : 'eBay'} - ${text ? text.substring(0, 50) : '商品'}...`,
        description: `这是一个自动生成的商品描述。由于网络连接问题，无法访问AI服务。\n\n${text || ''}`,
        bulletPoints: [
          "这是第一个卖点",
          "这是第二个卖点",
          "这是第三个卖点",
          "这是第四个卖点",
          "这是第五个卖点"
        ],
        keywords: ["关键词1", "关键词2", "关键词3"],
        category: ["示例分类"],
        itemSpecifics: {
          "品牌": "示例品牌",
          "材质": "示例材质",
          "尺寸": "示例尺寸"
        }
      });
    }
    
    if (!text && !imagePath) {
      return res.status(400).json({ error: '缺少文本或图片内容' });
    }
    
    let imageBase64 = null;
    if (imagePath) {
      try {
        const imageBuffer = safeReadFile(imagePath);
        if (imageBuffer) {
          imageBase64 = imageBuffer.toString('base64');
          console.log('图片已成功转换为Base64格式');
        } else {
          console.error('无法读取图片或图片为空');
        }
      } catch (fileError) {
        console.error('处理图片错误:', fileError);
        // 继续处理，不让图片错误阻止整个请求
      }
    }
    
    console.log(`将使用 ${model} 模型进行内容生成`);
    
    let result;
    if (model === 'gemini') {
      console.log('调用Gemini API...');
      result = await generateContentGemini(text || "", imageBase64, platform);
    } else {
      console.log('调用OpenAI API...');
      result = await generateContentOpenAI(text || "", imageBase64, platform);
    }
    
    console.log('API调用成功，返回结果');
    res.json(result);
  } catch (error) {
    console.error('生成错误:', error);
    // 服务器错误时也返回一个可用的响应结构
    res.status(500).json({ 
      error: '内容生成失败', 
      details: error.message,
      fallbackData: {
        title: "生成失败 - 请重试",
        description: "由于服务器错误，无法生成内容。请稍后重试或检查服务器日志获取详细信息。",
        bulletPoints: ["服务器处理请求时出错"],
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
    if (model === 'gemini') {
      console.log('调用Gemini API进行翻译...');
      result = await translateContentGemini(content, targetLanguage);
    } else {
      console.log('调用OpenAI API进行翻译...');
      result = await translateContentOpenAI(content, targetLanguage);
    }
    
    console.log('翻译API调用成功，返回结果');
    res.json(result);
  } catch (error) {
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