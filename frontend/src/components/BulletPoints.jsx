import React, { useState } from "react";
import { Copy, Maximize2, Plus, Minus, Edit, Check, X } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

const BulletPoints = ({ 
  title = "五点描述", 
  points = [], 
  translatedPoints = [], 
  expanded = false, 
  toggleExpand, 
  onChange 
}) => {
  const [editIndex, setEditIndex] = useState(-1);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (index, value) => {
    setEditIndex(index);
    setEditValue(value);
  };

  const handleSaveEdit = () => {
    if (editIndex !== -1) {
      const newPoints = [...points];
      newPoints[editIndex] = editValue;
      onChange(newPoints);
      setEditIndex(-1);
    }
  };

  const handleCancelEdit = () => {
    setEditIndex(-1);
  };

  const handleAddPoint = () => {
    const newPoints = [...(points || []), "新增卖点"];
    onChange(newPoints);
  };

  const handleRemovePoint = (index) => {
    const newPoints = [...points];
    newPoints.splice(index, 1);
    onChange(newPoints);
  };

  return (
    <div className="mb-4 border rounded-lg overflow-hidden shadow-card transition-all duration-300 hover:shadow-hover">
      <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-gray-100">
        <h3 className="font-medium text-primary-700">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleAddPoint}
            className="p-1.5 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-200 transition-colors"
            title="添加卖点"
          >
            <Plus size={16} />
          </button>
          <CopyButton text={points?.join("\n") || ""} />
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
          <ul className="space-y-2">
            {(points || []).map((point, index) => (
              <li key={index} className="flex group">
                {editIndex === index ? (
                  <div className="flex-1 flex items-center">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 p-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
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
                    <div className="flex-1 p-3 bg-gray-50 rounded-md border border-gray-100">
                      {point}
                    </div>
                    <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(index, point)}
                        className="p-1 text-gray-500 hover:text-primary-600 rounded hover:bg-gray-200"
                        title="编辑"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleRemovePoint(index)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-200 ml-1"
                        title="删除"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {(!points || points.length === 0) && (
              <li className="text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-100">
                无卖点数据，请先生成内容或手动添加
              </li>
            )}
          </ul>
        </div>
        
        {expanded && translatedPoints && (
          <div className="animate-slide-up">
            <div className="text-sm text-gray-600 mb-1 flex items-center">
              <span className="tag tag-green mr-2">翻译</span>
            </div>
            <ul className="space-y-2">
              {(translatedPoints || []).map((point, index) => (
                <li key={index} className="flex justify-between group">
                  <div className="flex-1 p-3 bg-gray-50 rounded-md border border-gray-100">
                    {point}
                  </div>
                  <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={point} />
                  </div>
                </li>
              ))}
              {(!translatedPoints || translatedPoints.length === 0) && (
                <li className="text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-100">
                  无翻译数据
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulletPoints;