"use client";

interface DocumentPreviewProps {
  content: string;
  className?: string;
}

export default function DocumentPreview({ content, className = "" }: DocumentPreviewProps) {
  if (!content) return null;

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, index) => {
      if (part.match(/^\{[^}]+\}$/)) {
        const fieldName = part.slice(1, -1);
        return (
          <span
            key={index}
            className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm font-medium mx-0.5"
          >
            {fieldName}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="prose prose-sm max-w-none text-gray-900 whitespace-pre-wrap">
        {renderFormattedText(content)}
      </div>
    </div>
  );
}
