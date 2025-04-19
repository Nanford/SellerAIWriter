# 电商AI内容生成助手

一个为Amazon和eBay卖家设计的智能内容生成工具，帮助卖家快速创建高质量的商品列表内容和多语言翻译。

## 功能特点

- **智能内容生成**：基于商品图片和简短描述，自动生成标题、描述、卖点、关键词等
- **平台适配**：针对Amazon和eBay平台生成符合各自规范的内容
- **多模型支持**：支持OpenAI (GPT-4o) 和 Google Gemini 2.5 模型
- **多语言翻译**：支持中文内容翻译为英文、德语、法语、意大利语
- **历史记录**：保存生成的内容记录，方便后续查询和使用

## 技术栈

- **前端**：React.js + Tailwind CSS
- **后端**：Node.js + Express
- **AI API**：
  - OpenAI API (GPT-4o)
  - Google Gemini API (Gemini 2.5)

## 安装指南

### 前提条件

- Node.js v18 或更高版本
- NPM 或 Yarn
- OpenAI API 密钥
- Google Gemini API 密钥

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/SellerAIWriter.git
cd SellerAIWriter
```

2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. 配置环境变量

在backend目录中创建.env文件，并配置以下内容：

```
OPENAI_API_KEY="your_openai_api_key"
GOOGLE_GEMINI_API_KEY="your_gemini_api_key"
DEFAULT_PROVIDER="gemini"   # openai | gemini
PORT=4000
```

4. 启动应用

```bash
# 启动后端服务
cd backend
npm run dev

# 在另一个终端窗口启动前端服务
cd frontend
npm run dev
```

5. 访问应用

浏览器打开 http://localhost:3000 即可访问应用

## 使用说明

1. **选择平台**：首先选择目标平台（Amazon或eBay）
2. **输入商品信息**：
   - 上传商品图片（可选）
   - 输入商品描述或关键信息
3. **选择AI模型**：选择使用OpenAI或Gemini模型
4. **生成内容**：点击生成按钮，系统会自动创建商品标题、描述、卖点等内容
5. **编辑内容**：所有生成的内容均可编辑修改
6. **翻译内容**：选择目标语言，点击翻译按钮将内容翻译为所选语言
7. **保存记录**：点击保存按钮将当前生成的内容保存到历史记录

## 环境变量说明

- `OPENAI_API_KEY`: OpenAI的API密钥
- `GOOGLE_GEMINI_API_KEY`: Google Gemini的API密钥
- `DEFAULT_PROVIDER`: 默认使用的AI提供商（openai或gemini）
- `PORT`: 后端服务器端口

## 注意事项

- API密钥涉及费用，请妥善保管并避免泄露
- 生成的内容可能需要进一步优化和调整
- 图片处理需要一定的时间，请耐心等待

## 许可证

MIT