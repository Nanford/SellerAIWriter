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
const client = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

/**
 * 生成电商内容
 * @param {string} desc - 商品描述
 * @param {string} imgB64 - Base64编码的图片
 * @param {string} platform - 平台（amazon或ebay）
 * @returns {Object} 生成的内容
 */
export async function generateContentGemini(desc, imgB64, platform = 'amazon') {
  console.log('Gemini generation started with params:', { 
    textLength: desc?.length, 
    hasImage: !!imgB64,
    platform
  });
  try {
    // Dynamically construct the prompt based on the platform
    const platformName = platform === 'amazon' ? 'Amazon' : 'eBay';
    const platformSpecifics = platform === 'amazon' ? {
      titleLength: "Strictly within 150 characters, optimized with core keywords",
      descriptionFormat: "Can use simple HTML tags for formatting (e.g., <p>, <ul>, <li>, <b>)",
      bulletPointsRequired: true,
      keywordsPurpose: "Generate a set of backend search terms to improve visibility within Amazon search, usually not shown directly to buyers",
      itemSpecificsImportance: "Very important, infer and fill as many relevant attributes as possible based on the provided information"
    } : {
      titleLength: "Strictly within 80 characters, including the most important keywords",
      descriptionFormat: "Usually plain text, keep paragraphs clear",
      bulletPointsRequired: false, // eBay doesn't have a dedicated field, but can generate key features for the description
      keywordsPurpose: "Generate a set of keywords suitable for embedding in the title and description to improve search engine visibility",
      itemSpecificsImportance: "Important, especially for filtering features, infer based on information"
    };

    const dynamicPrompt = `You are a top-tier e-commerce content strategist and copywriter, especially proficient in the rules and best practices of the ${platformName} platform.
Your task is to analyze the provided product text description and product image (if provided), and then generate a product information JSON object that fully complies with ${platformName} platform requirements and possesses marketing appeal.

**Core Requirements:**
1.  **Deep Integration of Text and Image Info:** Carefully analyze visual information from the image such as product appearance, details, materials, usage scenarios, etc., and combine it with the provided text description.
2.  **Platform Rule Compliance:** Strictly adhere to ${platformName}'s specific requirements, especially regarding title length, description format, etc.
3.  **Marketing Orientation:** The generated content should not only be accurate but also highlight product selling points to attract potential buyers.
4.  **JSON Output:** You MUST return the result strictly in the following JSON structure. Do not include any markdown code blocks or other explanatory text, just output the pure JSON object.

**JSON Structure & ${platformName} Specific Requirements:**
{
  "title": "Product title. ${platformSpecifics.titleLength}.",
  "description": "Detailed product description. Should include features, benefits, specifications, uses, applicable scenarios, etc. ${platformSpecifics.descriptionFormat}.",
  ${platformSpecifics.bulletPointsRequired ?
  `"bulletPoints": [
    "Bullet 1: Concisely summarize a core advantage",
    "Bullet 2: Highlight another unique feature or benefit",
    "Bullet 3: Describe material, craftsmanship, or quality-related aspects",
    "Bullet 4: Emphasize ease of use, compatibility, or special design",
    "Bullet 5: Mention packaging, accessories, or after-sales support (if applicable)"
  ],` : `"bulletPoints": ["Generate 3-5 key feature points based on the description to enrich the content"],`}
  "keywords": ["Generate a list of keywords based on product information and the target platform. ${platformSpecifics.keywordsPurpose}."],
  "category": ["Based on the product information, suggest 1-3 most relevant ${platformName} category paths. Example: 'Home & Kitchen > Kitchen & Dining > Tableware > Bowls'"],
  "itemSpecifics": {
    "Brand": "Infer from information or fill in 'Unbranded'/'Generic'",
    "Material": "Infer from image and text",
    "Color": "Infer from image and text",
    "Size/Dimensions": "Infer from image and text",
    "Style": "Infer from image and text",
    // Try to infer more relevant attributes common on the ${platformName} platform...
    "${platform === 'amazon' ? 'Model Number' : 'MPN'}": "Try to infer",
    "${platform === 'amazon' ? 'Item Weight' : 'Weight'}": "Try to infer"
    // ... more platform-based attributes
  }
}

Please create based on the user-provided information. Ensure the output is a single, valid JSON object only.`;

    // Prepare parts for the API call
    const parts = [
      { text: dynamicPrompt },
      { text: `\nProduct Description: ${desc}` } // Clearly label the user's text description
    ];

    // If an image is provided, add it to the parts array
    if (imgB64) {
      parts.push({ text: "\nProduct Image:" }); // Label the image part
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
      const result = JSON.parse(text);
      console.log('Gemini generation completed successfully');
      return result;
    } catch (parseError) {
      console.error("JSON解析错误，尝试使用替代格式:", parseError);
      // 如果解析失败，返回一个基本结构
      const fallbackResult = {
        title: desc.substring(0, 100),
        description: text,
        bulletPoints: [],
        keywords: [],
        category: [],
        itemSpecifics: {}
      };
      console.log('Gemini generation completed but JSON parsing failed, returning fallback.');
      return fallbackResult;
    }
  } catch (error) {
    console.error("Gemini API 调用错误:", error);
    console.log('Gemini generation failed, throwing error.');
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
    console.log('[Gemini Service] Attempting translate API call...');
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
      console.log('[Gemini Service] Translate API call finished.');
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