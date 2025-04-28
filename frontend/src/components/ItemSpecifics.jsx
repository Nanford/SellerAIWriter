import React, { useState } from "react";
import { Copy, Maximize2, Plus, Minus, Edit, Check, X } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

const ItemSpecifics = ({ 
  title = "物品属性", 
  specifics = {}, 
  translatedSpecifics = {}, 
  expanded = false, 
  toggleExpand, 
  onChange 
}) => {
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleStartEdit = (key, value) => {
    setEditKey(key);
    setEditValue(value);
  };

  const handleSaveEdit = () => {
    if (editKey) {
      const newSpecifics = { ...specifics };
      if (editValue.trim()) {
        newSpecifics[editKey] = editValue;
      }
      onChange(newSpecifics);
      setEditKey("");
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditKey("");
    setEditValue("");
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewKey("");
    setNewValue("");
  };

  const handleSaveAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      const newSpecifics = { ...specifics };
      newSpecifics[newKey] = newValue;
      onChange(newSpecifics);
      setIsAdding(false);
      setNewKey("");
      setNewValue("");
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewKey("");
    setNewValue("");
  };

  const handleDelete = (key) => {
    const newSpecifics = { ...specifics };
    delete newSpecifics[key];
    onChange(newSpecifics);
  };

  const formatSpecifics = (specs) => {
    return Object.entries(specs || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  };

  return (
    <div className="mb-4 border rounded-lg overflow-hidden shadow-card transition-all duration-300 hover:shadow-hover">
      <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-gray-100">
        <h3 className="font-medium text-primary-700">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleStartAdd}
            className="p-1.5 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-200 transition-colors"
            title="添加属性"
          >
            <Plus size={16} />
          </button>
          <CopyButton text={formatSpecifics(specifics)} />
          <button 
            onClick={toggleExpand} 
            className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-primary-600"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1 flex items-center">
            <span className="tag tag-blue mr-2">中文</span>
          </div>
          
          {isAdding && (
            <div className="flex mb-3 p-3 bg-gray-50 rounded-md border border-primary-200">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="属性名称"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="属性值"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="input"
                />
              </div>
              <div className="ml-2 flex flex-col space-y-1">
                <button
                  onClick={handleSaveAdd}
                  className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                  title="保存"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  title="取消"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {Object.entries(specifics || {}).map(([key, value]) => (
              <div key={key} className="flex group">
                {editKey === key ? (
                  <div className="flex-1 flex">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="p-2 bg-gray-100 rounded-md flex items-center font-medium">
                        {key}
                      </div>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div className="ml-2 flex flex-col space-y-1">
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                        title="保存"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        title="取消"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-100 font-medium text-gray-700">
                        {key}
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                        {value}
                      </div>
                    </div>
                    <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(key, value)}
                        className="p-1 text-gray-500 hover:text-primary-600 rounded hover:bg-gray-200"
                        title="编辑"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(key)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-200 ml-1"
                        title="删除"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {(!specifics || Object.keys(specifics).length === 0) && !isAdding && (
              <div className="text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-100">
                无物品属性数据，请先生成内容或手动添加
              </div>
            )}
          </div>
        </div>
        
        {expanded && translatedSpecifics && (
          <div className="animate-slide-up">
            <div className="text-sm text-gray-600 mb-1 flex items-center justify-between">
              <span className="tag tag-green mr-2">翻译</span>
              {translatedSpecifics && Object.keys(translatedSpecifics).length > 0 && (
                <CopyButton 
                  text={formatSpecifics(translatedSpecifics)} 
                  title="复制所有翻译属性" 
                />
              )}
            </div>
            <div className="space-y-2">
              {Object.entries(translatedSpecifics || {}).map(([key, value]) => (
                <div key={key} className="flex group">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100 font-medium text-gray-700">
                      {key}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      {value}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={`${key}: ${value}`} title={`复制"${key}"属性翻译`} />
                  </div>
                </div>
              ))}
              {(!translatedSpecifics || Object.keys(translatedSpecifics).length === 0) && (
                <div className="text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-100">
                  无翻译数据
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemSpecifics;