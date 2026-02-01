/**
 * Server-side PDF generation utilities
 * Uses pdf-lib for PDF manipulation
 * ONLY works on server - never expose to client
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Fetch Google Font as ArrayBuffer
 * Downloads the font file from Google Fonts for embedding
 */
export async function fetchGoogleFont(fontFamily: string, weight: number = 400): Promise<ArrayBuffer> {
  // Construct Google Fonts API URL
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weight}&display=swap`;

  // Fetch CSS to get actual font file URL
  const cssResponse = await fetch(fontUrl);
  const cssText = await cssResponse.text();

  // Extract font file URL from CSS
  const urlMatch = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!urlMatch) {
    throw new Error(`Could not find font file URL for ${fontFamily}`);
  }

  const fontFileUrl = urlMatch[1];

  // Fetch actual font file
  const fontResponse = await fetch(fontFileUrl);
  const fontBuffer = await fontResponse.arrayBuffer();

  return fontBuffer;
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Calculate text width for alignment
 */
function getTextWidth(text: string, fontSize: number): number {
  // Approximate width calculation (varies by font)
  // In production, use actual font metrics
  return text.length * fontSize * 0.6;
}

export interface CertificateConfig {
  basePdfUrl: string;
  studentName: string;
  nameFont: string;
  nameFontSize: number;
  nameColor: string;
  nameAlign: "left" | "center" | "right";
  namePosX: number;
  namePosY: number;
  fontWeight?: number;
}

/**
 * Generate certificate with student name
 * SERVER-SIDE ONLY - Never call from client
 */
export async function generateCertificate(config: CertificateConfig): Promise<Uint8Array> {
  try {
    // 1. Fetch base PDF
    const pdfResponse = await fetch(config.basePdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // 2. Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // 3. Register fontkit for custom fonts
    pdfDoc.registerFontkit(fontkit);

    // 4. Fetch and embed Google Font
    let font;
    try {
      const fontBuffer = await fetchGoogleFont(config.nameFont, config.fontWeight || 700);
      font = await pdfDoc.embedFont(fontBuffer);
    } catch (error) {
      console.error("Failed to load custom font, falling back to Helvetica Bold:", error);
      font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    // 5. Get first page (certificates are typically single page)
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    // 6. Convert hex color to RGB
    const color = hexToRgb(config.nameColor);

    // 7. Calculate text position based on alignment
    let xPosition = config.namePosX;
    const textWidth = font.widthOfTextAtSize(config.studentName, config.nameFontSize);

    if (config.nameAlign === "center") {
      xPosition = config.namePosX - textWidth / 2;
    } else if (config.nameAlign === "right") {
      xPosition = config.namePosX - textWidth;
    }

    // 8. Draw text on PDF
    // Note: PDF coordinate system has origin at bottom-left, not top-left
    const yPosition = pageHeight - config.namePosY;

    firstPage.drawText(config.studentName, {
      x: xPosition,
      y: yPosition,
      size: config.nameFontSize,
      font: font,
      color: rgb(color.r, color.g, color.b),
    });

    // 9. Save and return PDF bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error("Certificate generation error:", error);
    throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate certificates for multiple students (bulk mode)
 */
export async function generateBulkCertificates(
  config: Omit<CertificateConfig, "studentName">,
  studentNames: string[]
): Promise<Uint8Array[]> {
  const certificates: Uint8Array[] = [];

  for (const name of studentNames) {
    const cert = await generateCertificate({
      ...config,
      studentName: name,
    });
    certificates.push(cert);
  }

  return certificates;
}

/**
 * Validate certificate template configuration
 */
export function validateCertificateConfig(config: Partial<CertificateConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.basePdfUrl) {
    errors.push("Base PDF URL is required");
  }

  if (!config.studentName || config.studentName.trim() === "") {
    errors.push("Student name is required");
  }

  if (!config.nameFont) {
    errors.push("Font is required");
  }

  if (!config.nameFontSize || config.nameFontSize < 12 || config.nameFontSize > 200) {
    errors.push("Font size must be between 12 and 200");
  }

  if (!config.nameColor || !/^#[0-9A-F]{6}$/i.test(config.nameColor)) {
    errors.push("Valid color hex code is required");
  }

  if (!["left", "center", "right"].includes(config.nameAlign || "")) {
    errors.push("Valid alignment is required (left, center, right)");
  }

  if (config.namePosX === undefined || config.namePosY === undefined) {
    errors.push("Name position (X, Y) is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
