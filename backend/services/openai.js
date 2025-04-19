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
  maxRetries: 5,       // 增加至5次重试
  timeout: 60000       // 增加超时时间到60秒
});

// 简单延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 使用OpenAI生成电商内容
 * @param {string} text - 商品描述
 * @param {string|null} imageBase64 - 图片base64编码（可选）
 * @param {string} platform - 目标平台（amazon或ebay）
 * @returns {Object} 生成的内容对象
 */
export async function generateContentOpenAI(text, imageBase64 = null, platform = 'amazon') {
  let retryCount = 0;
  const maxRetries = 3;
  const baseDelay = 1000; // 1秒

  while (retryCount <= maxRetries) {
    try {
      console.log("调用OpenAI API...");
      
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

      // 使用 gpt-4o 模型
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      console.log("API调用成功，返回结果");
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI API错误:", error);
      
      // 增加重试逻辑，仅对连接和超时错误进行重试
      if (
        retryCount < maxRetries && (
          (error.cause && 
           (error.cause.code === 'ETIMEDOUT' || 
            error.cause.code === 'ECONNRESET' || 
            error.cause.code === 'ECONNREFUSED')) ||
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('connection')
        )
      ) {
        retryCount++;
        const retryDelay = baseDelay * Math.pow(2, retryCount); // 指数退避策略
        console.log(`第${retryCount}次重试，等待${retryDelay}毫秒...`);
        await delay(retryDelay);
        continue;
      }
      
      // 如果达到最大重试次数或不是网络相关错误，则返回基本结构
      return {
        title: text && text.length > 10 ? text.substring(0, 80) : "未能生成标题",
        description: "API调用失败，请稍后重试。原始描述: " + text,
        bulletPoints: ["API连接失败，请稍后重试", "无法生成完整卖点", "请检查网络连接", "可能是暂时性服务中断", "或API密钥配置问题"],
        keywords: ["商品", "电商"],
        category: ["商品分类"],
        itemSpecifics: {
          "品牌": "通用",
          "材质": "标准",
          "尺寸": "标准尺寸"
        }
      };
    }
  }
}

/**
 * 使用OpenAI翻译内容
 * @param {Object} content - 需要翻译的内容对象
 * @param {string} targetLanguage - 目标语言
 * @returns {Object} 翻译后的内容对象
 */
export async function translateContentOpenAI(content, targetLanguage) {
  let retryCount = 0;
  const maxRetries = 3;
  const baseDelay = 1000; // 1秒
  
  while (retryCount <= maxRetries) {
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
      
      // 增加重试逻辑，仅对连接和超时错误进行重试
      if (
        retryCount < maxRetries && (
          (error.cause && 
           (error.cause.code === 'ETIMEDOUT' || 
            error.cause.code === 'ECONNRESET' || 
            error.cause.code === 'ECONNREFUSED')) ||
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('connection')
        )
      ) {
        retryCount++;
        const retryDelay = baseDelay * Math.pow(2, retryCount); // 指数退避策略
        console.log(`翻译API第${retryCount}次重试，等待${retryDelay}毫秒...`);
        await delay(retryDelay);
        continue;
      }
      
      // 翻译失败时返回原内容
      return content;
    }
  }
}