// Component: CertificateImageEditor
// Purpose: Visual editor for placing name on certificate image

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface EditorProps {
  imageUrl: string;
  onSave: (config: {
    namePositionX: number;
    namePositionY: number;
    nameFontFamily: string;
    nameFontSize: number;
    nameFontColor: string;
    textAlignment: string;
  }) => void;
}

export default function CertificateImageEditor({ imageUrl, onSave }: EditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(60);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(32);
  const [fontColor, setFontColor] = useState('#000000');
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [previewName, setPreviewName] = useState('John Doe');

  const fonts = ['Arial', 'Times New Roman', 'Calibri', 'Georgia', 'Verdana'];

  useEffect(() => {
    // Draw preview
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw name at position
      const posXPx = (canvas.width * positionX) / 100;
      const posYPx = (canvas.height * positionY) / 100;

      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = fontColor;
      ctx.textAlign = textAlignment;
      ctx.textBaseline = 'middle';
      ctx.fillText(previewName, posXPx, posYPx);
    };
  }, [imageUrl, positionX, positionY, fontFamily, fontSize, fontColor, textAlignment, previewName]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPositionX(Math.min(100, Math.max(0, x)));
    setPositionY(Math.min(100, Math.max(0, y)));
  };

  const handleSave = () => {
    onSave({
      namePositionX: positionX,
      namePositionY: positionY,
      nameFontFamily: fontFamily,
      nameFontSize: fontSize,
      nameFontColor: fontColor,
      textAlignment,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
      {/* Canvas - Left side */}
      <div className="lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Certificate Preview</h3>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair w-full max-h-[500px]"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">Click to position the name field</p>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="font-semibold">Position X: {positionX.toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-semibold">Position Y: {positionY.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Controls - Right side */}
      <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-6">Text Customization</h3>

        {/* Font Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Font</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Font Size: {fontSize}px</label>
          <input
            type="range"
            min="12"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            min="12"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full mt-2 p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Font Color */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Font Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600">{fontColor}</span>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Alignment</label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => setTextAlignment(align)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  textAlignment === align
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Preview Name</label>
          <input
            type="text"
            value={previewName}
            onChange={(e) => setPreviewName(e.target.value)}
            maxLength={50}
            placeholder="Enter name to preview"
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPositionX(50);
              setPositionY(60);
              setFontFamily('Arial');
              setFontSize(32);
              setFontColor('#000000');
              setTextAlignment('center');
            }}
            className="flex-1 py-2 px-3 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
