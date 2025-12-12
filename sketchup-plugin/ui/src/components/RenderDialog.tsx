import React, { useState } from 'react';
import './RenderDialog.css';

interface RenderSettings {
  quality: 'standard' | 'high' | 'ultra';
  style: 'photorealistic' | 'dramatic' | 'soft' | 'studio' | 'natural';
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16';
}

export const RenderDialog: React.FC = () => {
  const [settings, setSettings] = useState<RenderSettings>({
    quality: 'high',
    style: 'photorealistic',
    aspectRatio: '16:9'
  });
  const [loading, setLoading] = useState(false);

  const creditsCost = {
    standard: 5,
    high: 10,
    ultra: 15
  }[settings.quality];

  const handleRender = () => {
    setLoading(true);
    
    // Call Ruby plugin via SketchUp bridge
    if (window.sketchup) {
      window.sketchup.callback('render', JSON.stringify({
        quality: settings.quality,
        style: settings.style,
        aspectRatio: settings.aspectRatio
      }));
    }
    
    // Note: Loading state will be managed by Ruby plugin
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="render-dialog">
      <div className="card">
        <h1 className="title">🎨 Render with Renderiq</h1>
        <p className="subtitle">Transform your SketchUp model into a photorealistic render</p>

        <div className="form-section">
          <div className="form-group">
            <label>Quality</label>
            <select 
              value={settings.quality} 
              onChange={(e) => setSettings({...settings, quality: e.target.value as any})}
              className="select"
            >
              <option value="standard">Standard (1080p) - 5 credits</option>
              <option value="high">High (4K) - 10 credits</option>
              <option value="ultra">Ultra (4K Enhanced) - 15 credits</option>
            </select>
          </div>

          <div className="form-group">
            <label>Style</label>
            <select 
              value={settings.style} 
              onChange={(e) => setSettings({...settings, style: e.target.value as any})}
              className="select"
            >
              <option value="photorealistic">Photorealistic</option>
              <option value="dramatic">Dramatic Lighting</option>
              <option value="soft">Soft Lighting</option>
              <option value="studio">Studio Lighting</option>
              <option value="natural">Natural Daylight</option>
            </select>
          </div>

          <div className="form-group">
            <label>Aspect Ratio</label>
            <select 
              value={settings.aspectRatio} 
              onChange={(e) => setSettings({...settings, aspectRatio: e.target.value as any})}
              className="select"
            >
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Traditional)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>

          <div className="credits-info">
            <span className="credits-label">Credits required:</span>
            <span className="credits-value">{creditsCost} credits</span>
          </div>
        </div>

        <div className="button-group">
          <button 
            onClick={handleRender} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '⏳ Rendering...' : '🚀 Render Now'}
          </button>
          <button 
            onClick={() => window.sketchup?.close()} 
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// TypeScript declarations for SketchUp bridge
declare global {
  interface Window {
    sketchup?: {
      callback: (action: string, data?: string) => void;
      close: () => void;
    };
  }
}


