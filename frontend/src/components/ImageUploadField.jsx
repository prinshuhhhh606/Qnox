import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react';
import { uploadImageFile } from '../services/api';
import './ImageUploadField.css';

export default function ImageUploadField({ label = 'IMAGE', value = '', onChange, placeholder = 'https://...' }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileProcess = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    setUploading(true);
    try {
      // 1. Try uploading to backend API
      const res = await uploadImageFile(file);
      if (res && res.url) {
        onChange(res.url);
        setUploading(false);
        return;
      }
    } catch (err) {
      console.warn('[QNOX Upload] Direct API upload fallback, converting to local high-res data URL:', err.message);
    }

    // 2. High-availability local FileReader fallback if backend upload is offline
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target.result);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFileProcess(file);
  };

  return (
    <div className="qnox-image-upload-wrapper">
      <div className="qnox-image-upload-label">
        <span>{label}</span>
        <div className="qnox-upload-mode-toggle">
          <button
            type="button"
            className={`qnox-upload-mode-btn ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
          >
            Upload File
          </button>
          <span className="text-neutral-600">&bull;</span>
          <button
            type="button"
            className={`qnox-upload-mode-btn ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
          >
            Enter URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`qnox-upload-dropzone ${dragOver ? 'dragging' : ''}`}
          >
            {uploading ? (
              <div className="flex items-center space-x-2 text-xs text-[#c5a880]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="tracking-widest uppercase font-semibold">PROCESSING IMAGE...</span>
              </div>
            ) : (
              <>
                <Upload className="w-5 h-5 text-[#c5a880]" />
                <div className="text-xs text-neutral-300 font-medium">
                  Click to Choose Image from Computer or Drag & Drop
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  JPEG, PNG, WebP (Max 5MB)
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="qnox-modal-form-input pl-9"
          />
          <LinkIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      {/* Live Thumbnail Preview & Remove Widget */}
      {value && (
        <div className="qnox-image-preview-box">
          <img src={value} alt="Preview" className="qnox-preview-thumb" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[#c5a880] tracking-widest uppercase font-bold flex items-center space-x-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>IMAGE ATTACHED</span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate font-mono mt-0.5">
              {value.startsWith('data:') ? 'Local file uploaded & ready' : value}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
