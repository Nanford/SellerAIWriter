import React from "react";
import { Copy, Maximize2 } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

const ContentBox = ({ title, content, translatedContent, expanded, toggleExpand }) => (
  <div className="mb-4 border rounded-lg overflow-hidden shadow-card transition-all duration-300 hover:shadow-hover">
    <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-gray-100">
      <h3 className="font-medium text-primary-700">{title}</h3>
      <div className="flex items-center space-x-2">
        <CopyButton text={content} />
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
        <div className="p-3 bg-gray-50 rounded-md min-h-8 whitespace-pre-line border border-gray-100">{content}</div>
      </div>
      {expanded && translatedContent && (
        <div className="animate-slide-up">
          <div className="text-sm text-gray-600 mb-1 flex items-center">
            <span className="tag tag-green mr-2">翻译</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-md min-h-8 flex justify-between whitespace-pre-line border border-gray-100">
            <span>{translatedContent}</span>
            <CopyButton text={translatedContent} />
          </div>
        </div>
      )}
    </div>
  </div>
);
export default ContentBox;