import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// 确保加载环境变量
dotenv.config();

// 获取API密钥
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("警告: GOOGLE_GEMINI_API_KEY环境变量未设置或为空");
}

// 去掉引号，确保API密钥格式正确
const cleanedApiKey = apiKey ? apiKey.replace(/^["'](.*)["']$/, '$1') : '';

// 初始化 GenAI 客户端
const genAI = new GoogleGenerativeAI(cleanedApiKey);
const client = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const systemPrompt = `You are an expert Amazon/eBay listing creator. You should generate product listing content based on the provided description and/or image. The output should be in JSON format with the following structure:
{
  "title": "Product title, concise and keyword-rich",
  "description": "Detailed product description that highlights features and benefits",
  "bulletPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "keywords": ["keyword1", "keyword2", "keyword3", ...],
  "category": ["Suggested category path"],
  "itemSpecifics": {
    "Brand": "value",
    "Material": "value",
    "Size": "value",
    "Color": "value",
    ...other relevant attributes
  }
}`;

/**
 * 生成电商内容
 * @param {string} desc - 商品描述
 * @param {string} imgB64 - Base64编码的图片
 * @param {string} platform - 平台（amazon或ebay）
 * @returns {Object} 生成的内容
 */
export async function generateContentGemini(desc, imgB64, platform = 'amazon') {
  try {
    const platformSpecificPrompt = `You are creating content for ${platform === 'amazon' ? 'Amazon' : 'eBay'} platform.`;
    
    // 准备提示和内容
    const parts = [{
      text: `${systemPrompt}\n${platformSpecificPrompt}\n${desc}`
    }];

    // 如果有图片，添加到内容中
    if (imgB64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imgB64
        }
      });
    }

    // 调用 API 生成内容
    const result = await client.generateContent({
      contents: parts,
      generationConfig: {
        temperature: 0.7
      }
    });
    
    // 确保获取到文本内容并安全解析
    const text = result.response.text();
    if (!text) {
      throw new Error("API返回的响应为空");
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON解析错误，尝试使用替代格式:", parseError);
      // 如果解析失败，返回一个基本结构
      return {
        title: desc.substring(0, 100),
        description: text,
        bulletPoints: [],
        keywords: [],
        category: [],
        itemSpecifics: {}
      };
    }
  } catch (error) {
    console.error("Gemini API 调用错误:", error);
    throw new Error(`Gemini内容生成失败: ${error.message}`);
  }
}

/**
 * 翻译内容
 * @param {Object} obj - 需要翻译的内容
 * @param {string} target - 目标语言
 * @returns {Object} 翻译后的内容
 */
export async function translateContentGemini(obj, target) {
  try {
    const result = await client.generateContent({
      contents: [{ 
        text: `Translate following JSON to ${target} (keep keys intact):\n${JSON.stringify(obj)}` 
      }],
      generationConfig: {
        temperature: 0.3
      }
    });
    
    // 确保获取到文本内容并安全解析
    const text = result.response.text();
    if (!text) {
      throw new Error("翻译API返回的响应为空");
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("翻译JSON解析错误:", parseError);
      // 如果解析失败，尝试基于原始数据返回一个简单翻译
      return obj;
    }
  } catch (error) {
    console.error("Gemini 翻译API调用错误:", error);
    throw new Error(`Gemini翻译失败: ${error.message}`);
  }
}