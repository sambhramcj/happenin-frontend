"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Move, Type, Palette, AlignLeft, AlignCenter, AlignRight, Save, Eye, Download } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import {
  CERTIFICATE_FONTS,
  getFontsByCategory,
  FONT_CATEGORIES,
  type FontCategory,
  RECOMMENDED_FONTS_BY_EVENT_TYPE,
} from "@/lib/certificate-fonts";

interface CertificateTemplateEditorProps {
  eventId: string;
  existingTemplate?: {
    id: string;
    base_pdf_url: string;
    name_font: string;
    name_font_size: number;
    name_color: string;
    name_align: "left" | "center" | "right";
    name_pos_x: number;
    name_pos_y: number;
  };
  onSave?: () => void;
}

export default function CertificateTemplateEditor({
  eventId,
  existingTemplate,
  onSave,
}: CertificateTemplateEditorProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>(existingTemplate?.base_pdf_url || "");
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  // Template Configuration
  const [nameFont, setNameFont] = useState(existingTemplate?.name_font || "Playfair Display");
  const [nameFontSize, setNameFontSize] = useState(existingTemplate?.name_font_size || 48);
  const [nameColor, setNameColor] = useState(existingTemplate?.name_color || "#000000");
  const [nameAlign, setNameAlign] = useState<"left" | "center" | "right">(existingTemplate?.name_align || "center");
  const [namePosX, setNamePosX] = useState(existingTemplate?.name_pos_x || 300);
  const [namePosY, setNamePosY] = useState(existingTemplate?.name_pos_y || 400);

  // UI State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FontCategory>("formal");
  const [error, setError] = useState("");

  // Load Google Font dynamically
  useEffect(() => {
    const selectedFont = CERTIFICATE_FONTS.find((f) => f.value === nameFont);
    if (selectedFont) {
      const link = document.createElement("link");
      link.href = selectedFont.googleFontsUrl;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, [nameFont]);

  // Render preview on canvas
  useEffect(() => {
    if (!pdfPreviewUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = pdfPreviewUrl;

    img.onload = () => {
      // Set canvas dimensions
      const maxWidth = 800;
      const scale = maxWidth / img.width;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      setPdfDimensions({ width: img.width, height: img.height });

      // Draw PDF image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw placeholder text
      const scaledX = namePosX * scale;
      const scaledY = namePosY * scale;
      const scaledFontSize = nameFontSize * scale;

      ctx.font = `${scaledFontSize}px "${nameFont}"`;
      ctx.fillStyle = nameColor;
      ctx.textAlign = nameAlign;
      ctx.fillText("STUDENT NAME", scaledX, scaledY);

      // Draw draggable indicator
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(scaledX - 10, scaledY - scaledFontSize - 10, 20, scaledFontSize + 20);
      ctx.setLineDash([]);
    };
  }, [pdfPreviewUrl, nameFont, nameFontSize, nameColor, nameAlign, namePosX, namePosY]);

  // Handle PDF upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("PDF must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Upload to Supabase Storage
      const fileExt = "pdf";
      const fileName = `${eventId}-${Date.now()}.${fileExt}`;
      const filePath = `certificates/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("event-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("event-media").getPublicUrl(filePath);

      setPdfFile(file);
      setPdfPreviewUrl(urlData.publicUrl);

      // Convert PDF first page to image for preview (simplified - in production use pdf.js)
      const reader = new FileReader();
      reader.onload = (e) => {
        // In production, use pdf.js to render first page
        // For now, we'll use the public URL directly
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload PDF. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle canvas drag
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    updatePosition(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const updatePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = pdfDimensions.width / canvas.width;
    const scaleY = pdfDimensions.height / canvas.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setNamePosX(Math.round(x));
    setNamePosY(Math.round(y));
  };

  // Save template
  const handleSave = async () => {
    if (!pdfPreviewUrl) {
      setError("Please upload a certificate PDF first");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const templateData = {
        event_id: eventId,
        base_pdf_url: pdfPreviewUrl,
        base_pdf_storage_path: pdfPreviewUrl.split("/").pop() || "",
        name_font: nameFont,
        name_font_size: nameFontSize,
        name_color: nameColor,
        name_align: nameAlign,
        name_pos_x: namePosX,
        name_pos_y: namePosY,
      };

      if (existingTemplate) {
        // Update
        const { error: updateError } = await supabase
          .from("certificate_templates")
          .update(templateData)
          .eq("id", existingTemplate.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase.from("certificate_templates").insert(templateData);

        if (insertError) throw insertError;
      }

      onSave?.();
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const categoryFonts = getFontsByCategory(selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Certificate Template</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload your certificate and customize the participant name placement
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: PDF Upload & Preview */}
        <div className="space-y-4">
          {/* Upload Button */}
          {!pdfPreviewUrl && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {isUploading ? "Uploading..." : "Click to upload certificate PDF"}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">PDF up to 10MB</p>
            </div>
          )}

          {/* Canvas Preview */}
          {pdfPreviewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview & Position</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change PDF
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <div className="relative border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="w-full cursor-move"
                />
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  <Move className="inline h-3 w-3 mr-1" />
                  Drag to position name
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Position: X={namePosX.toFixed(0)}, Y={namePosY.toFixed(0)}
              </p>
            </div>
          )}
        </div>

        {/* Right: Customization Options */}
        <div className="space-y-6">
          {/* Font Selection */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Type className="h-4 w-4 mr-2" />
              Font Family
            </label>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(Object.keys(FONT_CATEGORIES) as FontCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {FONT_CATEGORIES[cat].icon} {FONT_CATEGORIES[cat].label.split("/")[0].trim()}
                </button>
              ))}
            </div>

            {/* Font Dropdown */}
            <select
              value={nameFont}
              onChange={(e) => setNameFont(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {categoryFonts.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name} {font.recommended ? "⭐" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-500">{FONT_CATEGORIES[selectedCategory].description}</p>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Size: {nameFontSize}px
            </label>
            <input
              type="range"
              min="24"
              max="120"
              value={nameFontSize}
              onChange={(e) => setNameFontSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>24px</span>
              <span>120px</span>
            </div>
          </div>

          {/* Font Color */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <Palette className="h-4 w-4 mr-2" />
              Text Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={nameColor}
                onChange={(e) => setNameColor(e.target.value)}
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={nameColor}
                onChange={(e) => setNameColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Text Alignment</label>
            <div className="flex gap-2">
              {[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setNameAlign(value as any)}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    nameAlign === value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4 mx-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual Position Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position X</label>
              <input
                type="number"
                value={namePosX}
                onChange={(e) => setNamePosX(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position Y</label>
              <input
                type="number"
                value={namePosY}
                onChange={(e) => setNamePosY(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!pdfPreviewUrl || isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {isSaving ? "Saving..." : existingTemplate ? "Update Template" : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
