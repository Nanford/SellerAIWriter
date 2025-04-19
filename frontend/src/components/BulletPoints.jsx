import React, { useState } from "react";
import { Copy, Maximize2 } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

const BulletPoints = ({ 
  title = "五点描述", 
  points = [], 
  translatedPoints = [], 
  expanded = false, 
  toggleExpand, 
  onChange 
}) => {
  const [editing, setEditing] = useState(false);
  const [editedPoints, setEditedPoints] = useState(points);

  const handleEdit = (index, value) => {
    const newPoints = [...editedPoints];
    newPoints[index] = value;
    setEditedPoints(newPoints);
  };

  const handleSave = () => {
    onChange(editedPoints);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditedPoints(points);
    setEditing(false);
  };

  return (
    <div className="mb-4 border rounded-lg overflow-hidden shadow-sm">
      <div className="flex justify-between items-center bg-gray-100 px-4 py-2">
        <h3 className="font-medium text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          <CopyButton text={points.join("\n")} />
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
          
          <ul className="list-disc pl-5 space-y-2">
            {editing ? (
              editedPoints.map((point, index) => (
                <li key={index} className="pl-1">
                  <input 
                    type="text"
                    value={point}
                    onChange={(e) => handleEdit(index, e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </li>
              ))
            ) : (
              points.map((point, index) => (
                <li key={index} className="pl-1">{point}</li>
              ))
            )}
          </ul>
        </div>
        
        {expanded && translatedPoints && translatedPoints.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-1">翻译</div>
            <div className="p-2 bg-gray-50 rounded">
              <ul className="list-disc pl-5 space-y-2">
                {translatedPoints.map((point, index) => (
                  <li key={index} className="pl-1">{point}</li>
                ))}
              </ul>
              <div className="flex justify-end mt-2">
                <CopyButton text={translatedPoints.join("\n")} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulletPoints;