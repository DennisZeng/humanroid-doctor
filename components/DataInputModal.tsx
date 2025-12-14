import React, { useState } from 'react';
import { DataType } from '../types';

const TEXTS = {
  en: {
    inputParams: "Input Parameters",
    cancel: "CANCEL",
    upload: "UPLOAD DATA",
    import: "IMPORT",
    data: "DATA"
  },
  zh: {
    inputParams: "输入参数",
    cancel: "取消",
    upload: "上传数据",
    import: "导入",
    data: "数据"
  }
};

const DataInputModal = ({ type, onClose, onSubmit, language }) => {
  const [value, setValue] = useState('');
  const t = TEXTS[language];

  if (!type) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(type, value);
      setValue('');
    }
  };

  const getPlaceholder = () => {
    if (language === 'zh') {
        switch (type) {
          case DataType.PULSE: return "例如：80 BPM，心律规则";
          case DataType.BLOOD: return "例如：血红蛋白: 14.5 g/dL, 白细胞: 6.0";
          case DataType.URINE: return "例如：颜色: 淡黄, pH: 6.0";
          case DataType.STOOL: return "例如：性状: 正常, 颜色: 棕色";
          default: return "输入数据...";
        }
    }
    switch (type) {
      case DataType.PULSE: return "e.g., 80 BPM, Regular rhythm";
      case DataType.BLOOD: return "e.g., Hemoglobin: 14.5 g/dL, WBC: 6.0";
      case DataType.URINE: return "e.g., Color: Pale yellow, pH: 6.0";
      case DataType.STOOL: return "e.g., Consistency: Normal, Color: Brown";
      default: return "Enter data...";
    }
  };

  const getTitle = () => {
    const typeLabel = language === 'zh' ? getTypeLabelZh(type) : type.toUpperCase();
    return `${t.import} ${typeLabel} ${t.data}`;
  };

  const getTypeLabelZh = (type) => {
      switch (type) {
          case DataType.BLOOD: return "验血";
          case DataType.URINE: return "验尿";
          case DataType.PULSE: return "脉搏";
          case DataType.STOOL: return "粪便检查";
          default: return "";
      }
  };

  const getIcon = () => {
    switch (type) {
      case DataType.PULSE: return "❤️";
      case DataType.BLOOD: return "🩸";
      case DataType.URINE: return "💧";
      case DataType.STOOL: return "💩";
      default: return "📝";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-med-blue/30 rounded-2xl w-full max-w-md shadow-[0_0_30px_rgba(14,165,233,0.2)] overflow-hidden">
        
        <div className="bg-slate-800/50 p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getIcon()}</span>
            <h3 className="text-white font-display tracking-wider">{getTitle()}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-med-blue text-xs font-mono mb-2 uppercase">{t.inputParams}</label>
            <textarea 
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-med-blue focus:outline-none focus:ring-1 focus:ring-med-blue font-mono text-sm h-32 resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm font-mono transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              type="submit"
              disabled={!value.trim()}
              className="px-6 py-2 rounded-lg bg-med-blue text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed font-display tracking-wide text-sm transition-all shadow-lg shadow-med-blue/20"
            >
              {t.upload}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataInputModal;