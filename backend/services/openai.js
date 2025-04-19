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
  console.log('OpenAI generation started with params:', { 
    textLength: text?.length, 
    hasImage: !!imageBase64,
    platform
  });
  let retryCount = 0;
  const maxRetries = 3;
  const baseDelay = 1000; // 1秒

  while (retryCount <= maxRetries) {
    try {
      console.log("调用OpenAI API...");
      
      const platformName = platform === 'amazon' ? '亚马逊 (Amazon)' : 'eBay';
      const platformSpecifics = platform === 'amazon' ? {
        titleLength: "严格控制在 150 字符以内，优化以包含核心关键词",
        descriptionFormat: "可以使用简单的 HTML 标签进行格式化 (如 <p>, <ul>, <li>, <b>)",
        bulletPointsRequired: true,
        keywordsPurpose: "生成一组后端搜索关键词 (Search Terms)，用于提高商品在亚马逊内部的搜索可见性，通常不直接展示给买家",
        itemSpecificsImportance: "非常重要，请尽可能多地根据信息推断并填充"
      } : {
        titleLength: "严格控制在 80 字符以内，包含最重要关键词",
        descriptionFormat: "通常为纯文本，保持段落清晰",
        bulletPointsRequired: false, // eBay 无此专用字段，但可生成用于描述
        keywordsPurpose: "生成一组适合嵌入标题和描述中的关键词，以提高搜索引擎可见性",
        itemSpecificsImportance: "重要，尤其对于筛选功能，请根据信息推断"
      };

      const systemContent = `你是一位顶级的电商内容策略师和文案专家，尤其精通 ${platformName} 平台的规则和最佳实践。
你的任务是分析用户提供的商品文本描述和商品图片（如果提供），然后生成一份完全符合 ${platformName} 平台要求且具有营销吸引力的商品信息 JSON 对象。

**核心要求：**
1.  **深度结合图文信息：** 仔细分析图片中的商品外观、细节、材质、使用场景等视觉信息，并将其与用户提供的文本描述相结合。
2.  **平台规则遵从：** 严格遵守 ${platformName} 的具体要求，特别是标题长度、描述格式等。
3.  **营销导向：** 生成的内容不仅要准确，还要能突出商品卖点，吸引潜在买家。
4.  **JSON 输出：** 必须严格按照以下 JSON 结构返回结果，不要包含任何 markdown 代码块或其他解释性文本，直接输出纯粹的 JSON 对象。

**JSON 结构及 ${platformName} 特定要求：**
{
  "title": "产品标题。${platformSpecifics.titleLength}。",
  "description": "详细的产品描述。应包含产品特点、优势、规格、用途、适用场景等。${platformSpecifics.descriptionFormat}。",
  ${platformSpecifics.bulletPointsRequired ?
  `"bulletPoints": [
    "卖点1: 简洁有力地概括一个核心优势",
    "卖点2: 突出另一个独特功能或好处",
    "卖点3: 说明材质、工艺或质量相关特点",
    "卖点4: 强调易用性、兼容性或特殊设计",
    "卖点5: 提及包装、配件或售后保障 (如果适用)"
  ],` : `"bulletPoints": ["根据描述生成 3-5 个关键特性列表，用于丰富描述内容"],`}
  "keywords": ["根据商品信息和目标平台生成一组关键词列表。${platformSpecifics.keywordsPurpose}。"],
  "category": ["根据商品信息，建议 1-3 个最相关的 ${platformName} 分类路径。例如：'家居>厨房>餐具>碗'"],
  "itemSpecifics": {
    "品牌": "根据信息推断或填写 '通用'",
    "材质": "根据图片和文本推断",
    "颜色": "根据图片和文本推断",
    "尺寸/规格": "根据图片和文本推断",
    "风格": "根据图片和文本推断",
    // 尝试推断更多 ${platformName} 平台常用的相关属性...
    "${platform === 'amazon' ? '型号' : 'MPN'}": "尝试推断",
    "${platform === 'amazon' ? '商品重量' : '物品重量'}": "尝试推断"
    // ... 更多基于平台的属性
  }
}

请基于用户提供的信息进行创作。`;

      const messages = [
        {
          role: 'system',
          content: systemContent
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
      const result = JSON.parse(response.choices[0].message.content);
      console.log('OpenAI generation completed successfully');
      return result;
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
      const fallbackResult = {
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
      console.log('OpenAI generation failed after retries, returning fallback.');
      return fallbackResult;
    }
  }
  // Add a final fallback return outside the loop in case something unexpected happens
  console.log('OpenAI generation failed completely, returning final fallback.');
  return {
        title: text && text.length > 10 ? text.substring(0, 80) : "完全失败 - 无法生成标题",
        description: "所有API调用和重试均失败。原始描述: " + text,
        bulletPoints: ["系统错误"],
        keywords: [],
        category: [],
        itemSpecifics: {}
      };
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
  
  console.log('[OpenAI Translate] 开始翻译，参数:', { 
    contentType: typeof content, 
    targetLanguage
  });
  
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

      console.log('[OpenAI Service] Attempting translate API call... Attempt:', retryCount + 1);
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      const endTime = Date.now();
      console.log(`[OpenAI Service] Translate API call finished in ${(endTime - startTime) / 1000} seconds.`);

      const parsedResult = JSON.parse(response.choices[0].message.content);
      console.log('[OpenAI Translate] 翻译成功，返回解析后的结果');
      return parsedResult;
    } catch (error) {
      console.error(`[OpenAI Service Translate] Error during API call (Attempt ${retryCount + 1}):`, error);
      
      // 增加重试逻辑，仅对连接和超时错误进行重试
      if (
        retryCount < maxRetries && (
          (error.cause && 
           (error.cause.code === 'ETIMEDOUT' || 
            error.cause.code === 'ECONNRESET' || 
            error.cause.code === 'ECONNREFUSED')) ||
          (error instanceof OpenAI.APIError && (error.status === 429 || error.status >= 500)) || // Add retry for rate limits and server errors
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('connection')
        )
      ) {
        retryCount++;
        const retryDelay = baseDelay * Math.pow(2, retryCount); // 指数退避策略
        console.log(`[OpenAI Service Translate] 第${retryCount}次重试，等待${retryDelay}毫秒...`);
        await delay(retryDelay);
        continue;
      }
      
      // 如果重试耗尽或非可重试错误
      console.error('[OpenAI Translate] 翻译失败，达到最大重试次数或遇到不可重试错误，将返回原始内容');
      return content; // 返回原始 content
    }
  }
  // 如果循环结束（理论上不应发生，除非maxRetries=0且第一次就失败且不可重试）
  console.error('[OpenAI Translate] 翻译流程异常结束，返回原始内容');
  return content;
}