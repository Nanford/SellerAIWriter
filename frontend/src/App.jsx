import React, { useState } from "react";
import { Upload, Trash2, Languages, Database, Save, Maximize2, Copy, ChevronRight } from "lucide-react";
import ContentBox from "./components/ContentBox.jsx";
import BulletPoints from "./components/BulletPoints.jsx";
import ItemSpecifics from "./components/ItemSpecifics.jsx";
import { generateContent, uploadImage, translateContent, saveRecord } from './api/apiService';

const languages = [
  { id: "en", name: "英文 (English)", flag: "🇬🇧" },
  { id: "de", name: "德语 (Deutsch)", flag: "🇩🇪" },
  { id: "fr", name: "法语 (Français)", flag: "🇫🇷" },
  { id: "it", name: "意大利语 (Italiano)", flag: "🇮🇹" }
];

const models = [
  { id: "openai", name: "ChatGPT-4o" },
  { id: "gemini", name: "Gemini 2.5" }
];

export default function App() {
  const [productInfo, setProductInfo] = useState({
    title: '',
    description: '',
    extraInfo: '',
    image: null,
    imagePreview: null
  });
  
  const [platform, setPlatform] = useState('amazon');
  const [model, setModel] = useState('openai');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [translatedResult, setTranslatedResult] = useState(null);
  const [error, setError] = useState(null);
  const [translateAll, setTranslateAll] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    title: false,
    description: false,
    bulletPoints: false,
    keywords: false,
    category: false,
    itemSpecifics: false,
    tips: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProductInfo(prev => ({ 
      ...prev, 
      image: file,
      imagePreview: URL.createObjectURL(file)
    }));
  };

  const handleBulletPointsChange = (newBulletPoints) => {
    setResult(prev => ({
      ...prev,
      bulletPoints: newBulletPoints
    }));
  };

  const handleItemSpecificsChange = (newItemSpecifics) => {
    setResult(prev => ({
      ...prev,
      itemSpecifics: newItemSpecifics
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted, starting generation process");
    setIsLoading(true);
    setError(null);
    setResult(null);
    setTranslatedResult(null);
    setTranslateAll(false);
    setExpandedSections({
      title: false,
      description: false,
      bulletPoints: false,
      keywords: false,
      category: false,
      itemSpecifics: false,
      tips: true
    });
    
    try {
      // Upload image if present
      let imagePath = null;
      if (productInfo.image) {
        console.log("Uploading image...");
        const uploadResponse = await uploadImage(productInfo.image);
        console.log("Image upload response:", uploadResponse);
        imagePath = uploadResponse.path;
      }
      
      // Build description text
      const text = `
        商品名称: ${productInfo.title}
        
        商品描述: ${productInfo.description}
        
        ${productInfo.extraInfo ? `其他信息: ${productInfo.extraInfo}` : ''}
      `;
      console.log("Sending to API:", { text, platform, imagePath, model });
      
      // Generate content
      const generatedContent = await generateContent(text, platform, imagePath, model);
      console.log("API response:", generatedContent);
      setResult(generatedContent);
      setExpandedSections(prev => ({ 
        ...prev, 
        title: true, 
        description: true, 
        bulletPoints: true 
      }));
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message || '提交失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!result) return;
    
    setIsTranslating(true);
    setError(null);
    
    try {
      console.log('[Frontend App] Calling translateContent API service...');
      const translated = await translateContent(result, targetLanguage, model);
      
      console.log('[Frontend App] Received translated data from API:', translated);
      
      setTranslatedResult(translated);
      console.log('[Frontend App] Set translatedResult state.');
      setTranslateAll(true);
      
      setExpandedSections({
        title: true,
        description: true,
        bulletPoints: true,
        keywords: true,
        category: true,
        itemSpecifics: true,
        tips: true
      });

    } catch (err) {
      console.error('[Frontend App] Error during translation process:', err);
      setError(err.message || '翻译失败，请稍后再试');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!result) return;
    
    try {
      const record = {
        originalData: productInfo,
        generatedContent: result,
        translatedContent: translatedResult,
        platform,
        model,
        timestamp: new Date().toISOString()
      };
      
      await saveRecord(record);
      alert('记录保存成功！');
    } catch (err) {
      console.error('保存出错:', err);
      setError(err.message || '保存失败，请稍后再试');
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 text-gray-800 flex flex-col">
      <header className="bg-white shadow-sm py-4 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-700">电商AI内容生成器</h1>
            <div className="text-sm text-gray-500">让卖家出海更轻松</div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧输入表单 */}
            <div className="lg:col-span-1">
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h2 className="font-semibold text-lg text-primary-800">信息输入</h2>
                </div>
                <form onSubmit={handleSubmit} className="card-body">
                  <div className="form-group">
                    <label htmlFor="title" className="form-label">
                      商品名称
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={productInfo.title}
                      onChange={handleInputChange}
                      className="input"
                      required
                      placeholder="输入商品名称"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description" className="form-label">
                      商品描述
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={productInfo.description}
                      onChange={handleInputChange}
                      rows="5"
                      className="input"
                      required
                      placeholder="详细描述您的商品..."
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="extraInfo" className="form-label">
                      其他信息（可选）
                    </label>
                    <textarea
                      id="extraInfo"
                      name="extraInfo"
                      value={productInfo.extraInfo}
                      onChange={handleInputChange}
                      rows="3"
                      className="input"
                      placeholder="如目标客户群体、主要材质、核心功能等"
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      目标平台
                    </label>
                    <div className="flex space-x-4 mt-1">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="platform"
                          value="amazon"
                          checked={platform === 'amazon'}
                          onChange={() => setPlatform('amazon')}
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="ml-2">亚马逊</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="platform"
                          value="ebay"
                          checked={platform === 'ebay'}
                          onChange={() => setPlatform('ebay')}
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="ml-2">eBay</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      AI模型
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="input"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      商品图片 (可选)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                      {productInfo.imagePreview ? (
                        <div className="text-center">
                          <img
                            src={productInfo.imagePreview}
                            alt="预览"
                            className="mx-auto h-48 object-contain mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => setProductInfo(prev => ({ ...prev, image: null, imagePreview: null }))}
                            className="text-sm text-red-600 hover:text-red-800 flex items-center justify-center"
                          >
                            <Trash2 size={16} className="mr-1" /> 移除
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-primary-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="image-upload"
                              className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                            >
                              <span>上传图片</span>
                              <input
                                id="image-upload"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">或拖放到此处</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`btn btn-primary w-full ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? '生成中...' : '生成内容'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* 右侧结果区域 */}
            <div className="lg:col-span-2">
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-slide-up">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {result && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h2 className="text-xl font-semibold text-primary-800">生成结果</h2>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <select
                          value={targetLanguage}
                          onChange={(e) => {
                            setTargetLanguage(e.target.value);
                            setTranslateAll(false);
                          }}
                          className="pl-8 pr-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none text-sm"
                          disabled={isTranslating}
                        >
                          {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                        <Languages 
                          size={16} 
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" 
                        />
                      </div>
                      <button
                        onClick={handleTranslate}
                        disabled={isTranslating || !result}
                        className={`btn btn-primary py-1 px-3 text-sm ${isTranslating || !result ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <Languages size={16} className="mr-1"/>
                        {isTranslating ? '翻译中...' : '翻译'}
                      </button>
                      <button
                        onClick={handleSaveRecord}
                        disabled={!result}
                        className={`btn btn-green py-1 px-3 text-sm ${!result ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <Save size={16} className="mr-1" /> 保存
                      </button>
                    </div>
                  </div>
                  
                  <div className="card-body space-y-4">
                    <ContentBox
                      title="商品标题"
                      content={result.title || ''}
                      translatedContent={translateAll ? (translatedResult?.title || '') : null}
                      expanded={expandedSections.title}
                      toggleExpand={() => toggleSection('title')}
                    />
                    
                    <ContentBox
                      title="商品描述"
                      content={result.description || ''}
                      translatedContent={translateAll ? (translatedResult?.description || '') : null}
                      expanded={expandedSections.description}
                      toggleExpand={() => toggleSection('description')}
                    />
                    
                    <BulletPoints
                      title="五点描述"
                      points={result.bulletPoints || []}
                      translatedPoints={translateAll ? (translatedResult?.bulletPoints || []) : null}
                      expanded={expandedSections.bulletPoints}
                      toggleExpand={() => toggleSection('bulletPoints')}
                      onChange={handleBulletPointsChange}
                    />
                    
                    <ContentBox
                      title="关键词"
                      content={Array.isArray(result.keywords) ? (result.keywords || []).join(', ') : (result.keywords || '')}
                      translatedContent={translateAll ? (Array.isArray(translatedResult?.keywords) ? (translatedResult.keywords || []).join(', ') : (translatedResult?.keywords || '')) : null}
                      expanded={expandedSections.keywords}
                      toggleExpand={() => toggleSection('keywords')}
                    />
                    
                    <ContentBox
                      title="商品分类"
                      content={Array.isArray(result.category) ? (result.category || []).join(' > ') : (result.category || '')}
                      translatedContent={translateAll ? (Array.isArray(translatedResult?.category) ? (translatedResult.category || []).join(' > ') : (translatedResult?.category || '')) : null}
                      expanded={expandedSections.category}
                      toggleExpand={() => toggleSection('category')}
                    />
                    
                    <ItemSpecifics
                      title="物品属性"
                      specifics={result.itemSpecifics || {}}
                      translatedSpecifics={translateAll ? (translatedResult?.itemSpecifics || {}) : null}
                      expanded={expandedSections.itemSpecifics}
                      toggleExpand={() => toggleSection('itemSpecifics')}
                      onChange={handleItemSpecificsChange}
                    />
                    
                    {platform === 'ebay' && result.tips && result.tips.length > 0 && (
                      <ContentBox
                        title="温馨提示"
                        content={result.tips.join('\n')}
                        translatedContent={translateAll ? ((translatedResult?.tips || []).join('\n')) : null}
                        expanded={expandedSections.tips}
                        toggleExpand={() => toggleSection('tips')}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-bold text-primary-700">电商AI内容助手</div>
              <p className="text-sm text-gray-600 mt-1">让卖家出海更轻松</p>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} 版权所有
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}