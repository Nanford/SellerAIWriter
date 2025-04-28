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
 * @param {string} text - 商品描述 + 产品要素 (结合图片和用户输入)
 * @param {string|null} imageBase64 - 图片base64编码（可选）
 * @param {string} platform - 目标平台（amazon或ebay）
 * @returns {Object} 生成的内容对象
 */
export async function generateContentOpenAI(text, imageBase64 = null, platform = 'amazon') {
  console.log('[OpenAI Generate] 开始生成内容，平台:', platform);
  let retryCount = 0;
  const maxRetries = 3;
  const baseDelay = 1000; // 1秒

  while (retryCount <= maxRetries) {
    try {
      console.log("[OpenAI Generate] 调用OpenAI API... 尝试次数:", retryCount + 1);
      
      let systemContent = '';
      let responseFormat = { type: 'json_object' }; // Default format

      if (platform === 'ebay') {
        // --- Revised eBay Specific Prompt --- 
        systemContent = 
`你是一名精通 eBay 平台规则、SEO 优化与产品文案的中文内容专家。
现在请根据用户提供的「产品要素」（结合图片和文本信息）为我生成 eBay 上架资料，只用简体中文。

【输出结构】
严格按照以下 JSON 结构输出，不要包含任何 markdown 代码块或其他解释性文本，直接输出纯粹的 JSON 对象:
{
  "title": "商品标题（Title）。要求：≤ 80 字符，含品类关键词、1-2 核心卖点、硬信息（如尺寸/层数）。",
  "bulletPoints": [
    "五点描述（Bullet Points）第一点。格式：'卖点词: 专业说明,包括用途,优点,易用性,(儿童或礼物相关的产品则是精致，安全)。要求：每条 160–220 字符。",
    "五点描述第二点。格式同上。",
    "五点描述第三点。格式同上。",
    "五点描述第四点。格式同上。",
    "五点描述第五点。格式同上。"
  ],
  "description": "商品描述（Product Description）。结构：首段总结，后续段落依次阐述材质/容量/功能/安装/保养等。",
  "keywords": ["搜索关键词数组（Search Terms）。要求：返回一个包含 5–10 个相关中文术语的字符串数组。确保关键词不在最终的中文标题中重复。"],
  "category": "分类建议（Category Path）。要求：仅提供一条最相关的英文 eBay 类目完整路径（字符串）。",
  "itemSpecifics": { 
    "要求": "物品属性对象（Item Specifics）。生成一个包含相关属性键值对的 JSON 对象。必须包含 Brand, Type, Style, Material, Color, Dimensions, Weight, Features, Room, Assembly Required 这些键（如果信息可用）。根据产品要素填充，未知信息可留空或写'N/A'。",
    "Brand": "Unbranded 或推断出的品牌",
    "Type": "产品类型，例如 Serving Cart, Storage Rack",
    "Style": "风格，例如 Industrial, Modern",
    "Material": "主要材质，例如 Metal+Wood",
    "Color": "颜色",
    "Dimensions": "尺寸 (长x宽x高)",
    "Weight": "重量 (大约值)",
    "Features": "特色功能，多个请用逗号分隔",
    "Room": "适用房间",
    "Assembly Required": "是否需要组装 (Yes/No)"
    // ... 可根据产品添加其他相关属性
  },
  "tips": [
    "温馨提示数组。要求：列表形式，说明拍摄道具不随货等注意事项。",
    "第二条提示（如果需要）。"
  ]
}

【写作风格与合规】
- 语气简洁、专业，避免夸大；动词使用主动式。
- 数字/参数精确到整或 0.5 单位；未知请写 \"约\"。
- 符合 eBay 合规：不出现电话、邮件、外链、不提保修天数、不过度引导站外交易。

请根据用户提供的图片和文本信息，提取产品要素，并生成符合上述所有要求的 JSON 对象。
`;
      } else {
        // --- Amazon Specific Prompt (Refined) --- 
        const platformName = '亚马逊 (Amazon)';
        const platformSpecifics = {
          titleLength: "建议 80-150 字符，最多200字符，优化以包含核心关键词",
          descriptionFormat: "基于图片识别的关键信息，做商品段落描述",
          bulletPointsRequired: true,
          keywordsPurpose: "生成一组后端搜索关键词 (Search Terms)，用于提高商品在亚马逊内部的搜索可见性，通常不直接展示给买家",
          itemSpecificsImportance: "非常重要，请尽可能多地根据信息推断并填充相关的属性键值对"
        };

        systemContent = 
`你是一位顶级的电商内容策略师和文案专家，尤其精通 ${platformName} 平台的规则和最佳实践。
你的任务是分析用户提供的商品文本描述和商品图片（如果提供），然后生成一份完全符合 ${platformName} 平台要求且具有营销吸引力的商品信息 JSON 对象。

**核心要求：**
1.  **深度结合图文信息：** 仔细分析图片中的商品外观、细节、材质、使用场景等视觉信息，并将其与用户提供的文本描述相结合。
2.  **平台规则遵从：** 严格遵守 ${platformName} 的具体要求，特别是标题长度、描述格式、五点描述的重要性。
3.  **营销导向：** 生成的内容不仅要准确，还要能突出商品卖点，吸引潜在买家。
4.  **JSON 输出：** 必须严格按照以下 JSON 结构返回结果，不要包含任何 markdown 代码块或其他解释性文本，直接输出纯粹的 JSON 对象。

**JSON 结构及 ${platformName} 特定要求：**
{
  "title": "产品标题。${platformSpecifics.titleLength}。",
  "description": "详细的产品描述。应包含产品特点、优势、规格、用途、适用场景等。${platformSpecifics.descriptionFormat}。",
  "bulletPoints": [
    "五点描述（Bullet Point 1）: 简洁有力地概括一个核心优势,160–220 字符",
    "五点描述（Bullet Point 2）: 突出另一个独特功能或好处,160–220 字符",
    "五点描述（Bullet Point 3）: 说明材质、工艺或质量相关特点,160–220 字符",
    "五点描述（Bullet Point 4）: 强调易用性、兼容性或特殊设计,160–220 字符",
    "五点描述（Bullet Point 5）: 提及包装、配件或售后保障 (如果适用),160–220 字符"
  ],
  "keywords": ["关键词数组。${platformSpecifics.keywordsPurpose}。"],
  "category": ["分类建议数组。建议 1-3 个最相关的 ${platformName} 分类路径。例如：'家居>厨房>餐具>碗'"],
  "itemSpecifics": {
    "要求": "${platformSpecifics.itemSpecificsImportance}",
    "品牌": "根据信息推断或填写 '通用'",
    "材质": "根据图片和文本推断",
    "颜色": "根据图片和文本推断",
    "尺寸/规格": "根据图片和文本推断",
    "风格": "根据图片和文本推断",
    "型号": "尝试推断",
    "商品重量": "尝试推断",
    "制造商零件编号": "尝试推断"
  }
}

请基于用户提供的信息进行创作。
`;
      }

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

      // 添加文本描述 (包含产品要素)
      userMessage.content.push({
        type: 'text',
        text: `产品要素（结合图片识别和用户输入）：
${text}`
      });

      // 如果有图片，添加图片
      if (imageBase64) {
        userMessage.content.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high" // Request high detail for image analysis
          }
        });
      }

      messages.push(userMessage);

      // 使用 gpt-4o 模型
      console.log('[OpenAI Generate] Sending request to OpenAI API...');
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.6, // Slightly lower temperature for more factual adherence
        response_format: responseFormat
      });
      const endTime = Date.now();
      console.log(`[OpenAI Generate] OpenAI API call finished in ${(endTime - startTime) / 1000} seconds.`);

      const resultJsonString = response.choices[0].message.content;
      console.log('[OpenAI Generate] Received raw response string:', resultJsonString);
      const result = JSON.parse(resultJsonString);
      console.log('[OpenAI Generate] OpenAI generation completed successfully, parsed result:', result);
      return result;
      
    } catch (error) {
      console.error("[OpenAI Generate] Error during generation (Attempt", retryCount + 1, "):", error);
      
      // 重试逻辑...
      if (
        retryCount < maxRetries && (
          (error.cause && 
           (error.cause.code === 'ETIMEDOUT' || 
            error.cause.code === 'ECONNRESET' || 
            error.cause.code === 'ECONNREFUSED')) ||
          (error instanceof OpenAI.APIError && (error.status === 429 || error.status >= 500)) ||
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('connection')
        )
      ) {
        retryCount++;
        const retryDelay = baseDelay * Math.pow(2, retryCount); 
        console.log(`[OpenAI Generate] 第${retryCount}次重试，等待${retryDelay}毫秒...`);
        await delay(retryDelay);
        continue;
      }
      
      // 如果达到最大重试次数或不是网络相关错误，则返回包含错误信息的基本结构
      console.error('[OpenAI Generate] Generation failed after retries or due to non-retryable error.');
      // 返回与平台匹配的错误结构
      const errorPayload = {
        title: "生成错误",
        description: `API调用失败: ${error.message}`,
        bulletPoints: ["无法生成内容"],
        keywords: [],
      };
      if (platform === 'ebay') {
        errorPayload.category = '';
        errorPayload.itemSpecifics = { Error: error.message };
        errorPayload.tips = [`错误: ${error.message}`];
      } else {
        errorPayload.category = [];
        errorPayload.itemSpecifics = { Error: error.message };
      }
      return errorPayload;
    }
  }
  // 循环结束后仍失败（理论上仅在 maxRetries=0 时发生）
  console.error('[OpenAI Generate] Generation failed completely outside retry loop.');
  // 返回与平台匹配的错误结构
  const finalErrorPayload = {
        title: "生成完全失败",
        description: "所有API调用和重试均失败。",
        bulletPoints: ["系统错误"],
        keywords: [],
  };
  if (platform === 'ebay') {
        finalErrorPayload.category = '';
        finalErrorPayload.itemSpecifics = { Error: 'Complete Failure' };
        finalErrorPayload.tips = ['错误: 完全失败'];
  } else {
        finalErrorPayload.category = [];
        finalErrorPayload.itemSpecifics = { Error: 'Complete Failure' };
  }
  return finalErrorPayload;
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