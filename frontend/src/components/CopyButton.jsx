import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-200 transition-colors"
      title={copied ? "已复制!" : "复制文本"}
    >
      {copied ? (
        <Check size={16} className="text-green-500" />
      ) : (
        <Copy size={16} />
      )}
    </button>
  );
};

export default CopyButton;