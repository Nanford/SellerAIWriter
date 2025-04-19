import React from "react";
import { Copy, Maximize2 } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

const ContentBox = ({ title, content, translatedContent, expanded, toggleExpand }) => (
  <div className="mb-4 border rounded-lg overflow-hidden shadow-sm">
    <div className="flex justify-between items-center bg-gray-100 px-4 py-2">
      <h3 className="font-medium text-gray-800">{title}</h3>
      <div className="flex items-center space-x-2">
        <CopyButton text={content} />
        <button onClick={toggleExpand} className="p-1 rounded hover:bg-gray-200 transition-colors">
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
    <div className="p-4">
      <div className="mb-2">
        <div className="text-sm text-gray-600 mb-1">中文</div>
        <div className="p-2 bg-gray-50 rounded min-h-8 whitespace-pre-line">{content}</div>
      </div>
      {expanded && translatedContent && (
        <div>
          <div className="text-sm text-gray-600 mb-1">翻译</div>
          <div className="p-2 bg-gray-50 rounded min-h-8 flex justify-between whitespace-pre-line">
            <span>{translatedContent}</span>
            <CopyButton text={translatedContent} />
          </div>
        </div>
      )}
    </div>
  </div>
);
export default ContentBox;