import React, { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center
        ${copied 
          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
          : 'text-gray-500 hover:text-primary-600 hover:bg-gray-100'
        }`
      }
      title="复制内容"
    >
      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
    </button>
  );
};

export default CopyButton;