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
 * @param {string} desc - 商品描述 + 产品要素 (结合图片和用户输入)
 * @param {string} imgB64 - Base64编码的图片
 * @param {string} platform - 平台（amazon或ebay）
 * @returns {Object} 生成的内容
 */
export async function generateContentGemini(desc, imgB64, platform = 'amazon') {
  console.log('[Gemini Generate] 开始生成内容，平台:', platform);
  try {
    let dynamicPrompt = '';
    let generationConfig = {
      temperature: 0.6, // Slightly lower temperature
      responseMimeType: "application/json" // Request JSON directly
    };

    if (platform === 'ebay') {
        // --- Revised eBay Specific Prompt for Gemini --- 
        dynamicPrompt = 
`你是 eBay 平台规则、SEO 优化与产品文案的中文内容专家。
根据下面的「产品要素」，生成 eBay 上架资料，只用简体中文。

【输出结构】
严格按照以下 JSON 结构输出:
{
  "title": "商品标题（≤ 80 字符，含关键词、卖点、硬信息）",
  "bulletPoints": [
    "五点描述1（格式：'**加粗卖点词**: 说明'，20–40 字符）",
    "五点描述2",
    "五点描述3",
    "五点描述4",
    "五点描述5"
  ],
  "description": "商品描述（HTML格式：<h3>标题</h3><p>内容...</p>。段落：总结->材质->容量/功能->安装->保养）",
  "keywords": ["搜索关键词数组（5–10 个英文术语，字符串数组）"],
  "category": "分类建议（1条英文 eBay 类目路径字符串）",
  "itemSpecifics": { 
    "要求": "物品属性对象（JSON对象）。必须包含 Brand, Type, Style, Material, Color, Dimensions, Weight, Features, Room, Assembly Required 这些键（如果可用）。",
    "Brand": "推断或 Unbranded",
    "Type": "推断产品类型",
    "Style": "推断风格",
    "Material": "推断材质",
    "Color": "推断颜色",
    "Dimensions": "推断尺寸",
    "Weight": "推断重量",
    "Features": "推断特色，逗号分隔",
    "Room": "推断房间",
    "Assembly Required": "推断 Yes/No"
    // ... 可添加其他相关属性
  },
  "tips": [
    "温馨提示数组（拍摄道具不随货等）",
    "提示2（如需要）"
  ]
}

【写作风格与合规】
- 简洁、专业、主动式动词。
- 数字精确到整或 0.5，未知写 \"约\"。
- 遵守 eBay 合规：无联系方式/外链/保修天数。

「产品要素」（从图片和下文提取）：
${desc}
`;
    } else {
        // --- Amazon Specific Prompt for Gemini (Refined) --- 
        const platformName = '亚马逊 (Amazon)';
        const platformSpecifics = {
          titleLength: "建议 80-150 字符，最多200字符",
          descriptionFormat: "可用HTML标签 (<p>, <ul>, <li>, <b>)",
          keywordsPurpose: "后端 Search Terms，不直接展示"
        };

        dynamicPrompt = 
`你是 ${platformName} 平台的顶级内容策略师和文案专家。
分析商品文本和图片（若有），生成符合 ${platformName} 要求的营销性商品信息 JSON 对象。

**核心要求：**
1.  **结合图文信息**。
2.  **遵守 ${platformName} 规则**（标题长度、描述格式、五点描述重要性）。
3.  **营销导向**。
4.  **严格按以下 JSON 结构输出**，不要有 markdown 代码块。

**JSON 结构及 ${platformName} 特定要求：**
{
  "title": "产品标题（${platformSpecifics.titleLength}）",
  "description": "详细产品描述（特点、优势、规格、场景。${platformSpecifics.descriptionFormat}）",
  "bulletPoints": [
    "五点描述1（核心优势）",
    "五点描述2（独特功能/好处）",
    "五点描述3（材质/工艺/质量）",
    "五点描述4（易用性/兼容性/设计）",
    "五点描述5（包装/配件/售后）"
  ],
  "keywords": ["关键词数组（${platformSpecifics.keywordsPurpose}）"],
  "category": ["分类建议数组（1-3条 ${platformName} 路径）"],
  "itemSpecifics": {
    "要求": "填充相关属性键值对",
    "品牌": "推断或填 '通用'",
    "材质": "根据图文推断",
    "颜色": "根据图文推断",
    "尺寸/规格": "根据图文推断",
    "风格": "根据图文推断",
    "型号": "尝试推断",
    "商品重量": "尝试推断",
    "制造商零件编号": "尝试推断"
  }
}

请基于用户提供的信息创作。
「产品要素」（从图片和下文提取）：
${desc}
`;
    }

    // Prepare parts for the API call
    const parts = [
      { text: dynamicPrompt } 
    ];

    // If an image is provided, add it to the parts array
    if (imgB64) {
      parts.push({ text: "\n\n商品图片:" }); // Label the image part
      parts.push({
        inlineData: {
          mimeType: "image/jpeg", // Assuming JPEG, adjust if needed
          data: imgB64
        }
      });
    }

    // Call the Gemini API
    console.log('[Gemini Generate] Sending request to Gemini API...');
    const startTime = Date.now();
    const result = await client.generateContent({
      contents: [{ parts }],
      generationConfig: generationConfig
    });
    const endTime = Date.now();
    console.log(`[Gemini Generate] Gemini API call finished in ${(endTime - startTime) / 1000} seconds.`);
    
    // Process the response
    if (result.response && result.response.candidates && result.response.candidates[0].content.parts[0].text) {
      const resultJsonString = result.response.candidates[0].content.parts[0].text;
      console.log('[Gemini Generate] Received raw response string:', resultJsonString);
      try {
        const parsedResult = JSON.parse(resultJsonString);
        console.log('[Gemini Generate] Gemini generation completed successfully, parsed result:', parsedResult);
        return parsedResult;
      } catch (parseError) {
        console.error("[Gemini Generate] JSON 解析错误:", parseError);
        console.error("[Gemini Generate] 收到的原始文本:", resultJsonString);
        throw new Error(`无法解析 Gemini 返回的 JSON: ${parseError.message}`); 
      }
    } else {
      console.error('[Gemini Generate] API 未返回预期的文本内容结构', result.response);
      throw new Error('Gemini API 返回的响应结构不完整');
    }

  } catch (error) {
    console.error("[Gemini Generate] Error during generation:", error);
    // 返回与平台匹配的错误结构
    const errorPayload = {
        title: "生成错误 (Gemini)",
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
    console.log('[Gemini Generate] Returning error payload.');
    return errorPayload;
  }
}

/**
 * 翻译电商内容
 * @param {string} desc - 商品描述 + 产品要素 (结合图片和用户输入)
 * @param {string} imgB64 - Base64编码的图片
 * @param {string} platform - 平台（amazon或ebay）
 * @returns {Object} 翻译后的内容
 */
export async function translateContentGemini(desc, imgB64, platform = 'amazon') {
  // Implementation of translateContentGemini function
}