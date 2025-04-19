import React, { useState } from "react";
import { Maximize2, Plus, X } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

const ItemSpecifics = ({ 
  title = "物品属性", 
  specifics = {}, 
  translatedSpecifics = {}, 
  expanded = false, 
  toggleExpand, 
  onChange 
}) => {
  const [editing, setEditing] = useState(false);
  const [editedSpecifics, setEditedSpecifics] = useState({ ...specifics });
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleEdit = (key, value) => {
    setEditedSpecifics({ ...editedSpecifics, [key]: value });
  };

  const handleRemove = (key) => {
    const newSpecifics = { ...editedSpecifics };
    delete newSpecifics[key];
    setEditedSpecifics(newSpecifics);
  };

  const handleAddProperty = () => {
    if (!newKey.trim()) return;
    setEditedSpecifics({ ...editedSpecifics, [newKey]: newValue });
    setNewKey("");
    setNewValue("");
  };

  const handleSave = () => {
    onChange(editedSpecifics);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditedSpecifics({ ...specifics });
    setEditing(false);
  };

  return (
    <div className="mb-4 border rounded-lg overflow-hidden shadow-sm">
      <div className="flex justify-between items-center bg-gray-100 px-4 py-2">
        <h3 className="font-medium text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          <CopyButton 
            text={Object.entries(specifics)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n")} 
          />
          <button onClick={toggleExpand} className="p-1 rounded hover:bg-gray-200 transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">中文</div>
            {editing ? (
              <div className="flex space-x-2">
                <button 
                  onClick={handleSave} 
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  保存
                </button>
                <button 
                  onClick={handleCancel} 
                  className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setEditing(true)} 
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                编辑
              </button>
            )}
          </div>
          
          <div className="divide-y">
            {editing ? (
              <>
                {Object.entries(editedSpecifics).map(([key, value]) => (
                  <div key={key} className="py-2 flex items-center">
                    <input
                      type="text"
                      value={key}
                      disabled
                      className="w-1/3 p-1 border rounded bg-gray-100 mr-2"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleEdit(key, e.target.value)}
                      className="w-2/3 p-1 border rounded mr-2"
                    />
                    <button 
                      onClick={() => handleRemove(key)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                <div className="py-2 flex items-center">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="新属性名称"
                    className="w-1/3 p-1 border rounded mr-2"
                  />
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="属性值"
                    className="w-2/3 p-1 border rounded mr-2"
                  />
                  <button 
                    onClick={handleAddProperty}
                    className="text-green-500 hover:text-green-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </>
            ) : (
              Object.entries(specifics).map(([key, value]) => (
                <div key={key} className="py-2 flex">
                  <span className="font-medium w-1/3">{key}:</span>
                  <span className="w-2/3">{value}</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {expanded && translatedSpecifics && Object.keys(translatedSpecifics).length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-1">翻译</div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="divide-y">
                {Object.entries(translatedSpecifics).map(([key, value]) => (
                  <div key={key} className="py-2 flex">
                    <span className="font-medium w-1/3">{key}:</span>
                    <span className="w-2/3">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <CopyButton 
                  text={Object.entries(translatedSpecifics)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\n")} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemSpecifics;