import OpenAI from "openai";
import dotenv from "dotenv";

// 确保加载环境变量
dotenv.config();

// 获取API密钥
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("警告: OPENAI_API_KEY环境变量未设置或为空");
}

// 去掉引号，确保API密钥格式正确
const cleanedApiKey = apiKey ? apiKey.replace(/^["'](.*)["']$/, '$1') : '';

// 初始化 OpenAI 客户端
const openai = new OpenAI({ 
  apiKey: cleanedApiKey,
  maxRetries: 3,
  timeout: 30000
});

/**
 * 使用OpenAI生成电商内容
 * @param {string} text - 商品描述
 * @param {string|null} imageBase64 - 图片base64编码（可选）
 * @param {string} platform - 目标平台（amazon或ebay）
 * @returns {Object} 生成的内容对象
 */
export async function generateContentOpenAI(text, imageBase64 = null, platform = 'amazon') {
  try {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的电商产品描述撰写专家，精通${platform === 'amazon' ? '亚马逊' : 'eBay'}平台的产品发布规则。
请根据用户提供的信息，生成以下格式的JSON数据（不要包含markdown代码块，直接返回JSON）：
{
  "title": "产品标题，简洁有力，包含关键词，控制在80字符以内",
  "description": "详细的产品描述，包含产品特点和卖点",
  "bulletPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "keywords": ["关键词1", "关键词2", "关键词3", ...],
  "category": ["建议分类路径"],
  "itemSpecifics": {
    "品牌": "xx",
    "材质": "xx",
    "尺寸": "xx",
    ...其他相关属性
  }
}`
      }
    ];

    const userMessage = {
      role: 'user',
      content: []
    };

    // 添加文本描述
    userMessage.content.push({
      type: 'text',
      text: text
    });

    // 如果有图片，添加图片
    if (imageBase64) {
      userMessage.content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      });
    }

    messages.push(userMessage);

    // 使用 gpt-4o 模型，当前比 gpt-4.1 更为普及且性价比更高
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API错误:", error);
    // 返回一个基本结构作为后备
    return {
      title: text.substring(0, 100),
      description: "无法生成描述，请检查API密钥是否正确配置。",
      bulletPoints: ["请检查OpenAI API配置"],
      keywords: [],
      category: [],
      itemSpecifics: {}
    };
  }
}

/**
 * 使用OpenAI翻译内容
 * @param {Object} content - 需要翻译的内容对象
 * @param {string} targetLanguage - 目标语言
 * @returns {Object} 翻译后的内容对象
 */
export async function translateContentOpenAI(content, targetLanguage) {
  try {
    const languageMap = {
      'en': '英语',
      'de': '德语',
      'fr': '法语',
      'it': '意大利语'
    };

    const messages = [
      {
        role: 'system',
        content: `你是一个专业的翻译专家。请将以下JSON对象中的所有中文文本内容翻译成${languageMap[targetLanguage] || targetLanguage}，保持JSON结构不变。直接返回翻译后的JSON对象（不要包含markdown代码块）。`
      },
      {
        role: 'user',
        content: JSON.stringify(content)
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI翻译API错误:", error);
    // 翻译失败时返回原内容
    return content;
  }
}