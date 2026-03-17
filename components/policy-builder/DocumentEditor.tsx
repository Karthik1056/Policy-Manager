"use client";

import { useState, useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Plus } from "lucide-react";
import api from "@/lib/api";

interface DocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
  policyId?: string;
  placeholder?: string;
}

export default function DocumentEditor({ value, onChange, policyId, placeholder }: DocumentEditorProps) {
  const [showVariableMenu, setShowVariableMenu] = useState(false);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (policyId && showVariableMenu) {
      fetchAvailableFields();
    }
  }, [policyId, showVariableMenu]);

  const fetchAvailableFields = async () => {
    try {
      const { data } = await api.get(`/field/getAll?policyId=${policyId}`);
      setAvailableFields(data.data || []);
    } catch (error) {
      console.error("Failed to fetch fields:", error);
      setAvailableFields([]);
    }
  };

  const insertVariable = (fieldName: string) => {
    const variable = `{${fieldName}}`;
    const before = value.substring(0, cursorPosition);
    const after = value.substring(cursorPosition);
    const newValue = before + variable + after;
    onChange(newValue);
    setShowVariableMenu(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPosition + variable.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPosition(pos);
    onChange(newValue);

    // Auto-detect {} typing
    if (newValue.endsWith("{")) {
      setShowVariableMenu(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "}") {
      setShowVariableMenu(false);
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    
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
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b bg-gray-50">
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = value.substring(start, end);
              const before = value.substring(0, start);
              const after = value.substring(end);
              onChange(before + `**${selectedText}**` + after);
            }
          }}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = value.substring(start, end);
              const before = value.substring(0, start);
              const after = value.substring(end);
              onChange(before + `*${selectedText}*` + after);
            }
          }}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = value.substring(start, end);
              const before = value.substring(0, start);
              const after = value.substring(end);
              onChange(before + `__${selectedText}__` + after);
            }
          }}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Underline"
        >
          <Underline size={18} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (textarea) {
              const pos = textarea.selectionStart;
              const before = value.substring(0, pos);
              const after = value.substring(pos);
              onChange(before + "\n• " + after);
            }
          }}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (textarea) {
              const pos = textarea.selectionStart;
              const before = value.substring(0, pos);
              const after = value.substring(pos);
              onChange(before + "\n1. " + after);
            }
          }}
          className="p-2 hover:bg-gray-200 rounded transition"
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCursorPosition(textareaRef.current?.selectionStart || 0);
              setShowVariableMenu(!showVariableMenu);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-2 transition"
          >
            <Plus size={16} />
            Insert Variable
          </button>
          {showVariableMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-xl z-50 w-80">
              <div className="p-3 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-700">Available Fields</p>
                <p className="text-xs text-gray-500 mt-1">Click to insert or type {"{field_name}"}</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableFields.length > 0 ? (
                  availableFields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => insertVariable(field.fieldName)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm text-gray-700 border-b last:border-b-0 transition"
                    >
                      <div className="font-medium">{field.fieldName}</div>
                      <div className="text-xs text-gray-500">{field.tabName} → {field.subTabName}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">No fields available yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add fields to use as variables</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowVariableMenu(false)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative min-h-[300px]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
          placeholder={placeholder || "Type your documentation here... Use {} to insert field variables"}
          className="w-full p-6 min-h-[300px] resize-none focus:outline-none font-sans text-base leading-relaxed"
          style={{ 
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: "1.8"
          }}
        />
      </div>

      {/* Preview */}
      <div className="border-t bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
        <div className="bg-white rounded p-4 min-h-[100px] text-sm leading-relaxed">
          {value ? renderFormattedText(value) : (
            <span className="text-gray-400 italic">Preview will appear here...</span>
          )}
        </div>
      </div>
    </div>
  );
}
