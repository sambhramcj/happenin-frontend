/**
 * Certificate System Helper Functions
 * Common utilities for certificate operations
 */

import { CertificateTemplate } from "@/types/certificate";

/**
 * Check if a certificate template exists for an event
 */
export async function checkCertificateTemplateExists(eventId: string): Promise<{
  exists: boolean;
  template: CertificateTemplate | null;
}> {
  try {
    const response = await fetch(`/api/certificates/generate?eventId=${eventId}`);
    const data = await response.json();
    return {
      exists: data.exists || false,
      template: data.template || null,
    };
  } catch (error) {
    console.error("Failed to check certificate template:", error);
    return { exists: false, template: null };
  }
}

/**
 * Generate a single certificate and trigger download
 */
export async function generateAndDownloadCertificate(
  eventId: string,
  studentName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        studentName,
        download: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate certificate");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${studentName.replace(/\s+/g, "_")}_Certificate.pdf`;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Certificate generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Parse names from CSV or text input
 * Handles: comma-separated, newline-separated, mixed
 */
export function parseStudentNames(input: string): string[] {
  return input
    .split(/[\n,]/) // Split by newline or comma
    .map((name) => name.trim()) // Remove whitespace
    .filter((name) => name.length > 0) // Remove empty strings
    .filter((name) => !/^[,\n\s]+$/.test(name)); // Remove lines with only separators
}

/**
 * Validate student name
 */
export function validateStudentName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name cannot be empty" };
  }

  if (name.length > 100) {
    return { valid: false, error: "Name is too long (max 100 characters)" };
  }

  // Check for suspicious characters (basic SQL injection prevention)
  if (/[<>{}[\]\\]/.test(name)) {
    return { valid: false, error: "Name contains invalid characters" };
  }

  return { valid: true };
}

/**
 * Validate PDF file
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== "application/pdf") {
    return { valid: false, error: "File must be a PDF" };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: "PDF must be less than 10MB" };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a safe filename from student name
 */
export function generateCertificateFilename(studentName: string): string {
  return `${studentName.replace(/[^a-zA-Z0-9]/g, "_")}_Certificate.pdf`;
}

/**
 * Calculate estimated generation time
 */
export function estimateGenerationTime(numCertificates: number): string {
  const secondsPerCert = 1.5; // Average time per certificate
  const totalSeconds = numCertificates * secondsPerCert;

  if (totalSeconds < 60) {
    return `~${Math.ceil(totalSeconds)} seconds`;
  }

  const minutes = Math.ceil(totalSeconds / 60);
  return `~${minutes} minute${minutes > 1 ? "s" : ""}`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Check if browser supports required features
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missingFeatures: string[];
} {
  const features = {
    canvas: typeof document !== "undefined" && !!document.createElement("canvas").getContext,
    fetch: typeof fetch !== "undefined",
    blob: typeof Blob !== "undefined",
    fileReader: typeof FileReader !== "undefined",
  };

  const missingFeatures = Object.entries(features)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);

  return {
    supported: missingFeatures.length === 0,
    missingFeatures,
  };
}

/**
 * Convert canvas to blob (for preview thumbnails)
 */
export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob));
  });
}

/**
 * Get recommended font based on event type
 */
export function getRecommendedFontForEventType(eventType?: string): string {
  const fontMap: Record<string, string> = {
    academic: "Playfair Display",
    formal: "Libre Baskerville",
    tech: "Inter",
    hackathon: "Space Grotesk",
    cultural: "Montserrat",
    sports: "Bebas Neue",
    workshop: "Poppins",
    conference: "Crimson Text",
    volunteer: "Lora",
  };

  return fontMap[eventType?.toLowerCase() || ""] || "Playfair Display";
}

/**
 * Validate hex color code
 */
export function validateHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Get contrast color (for text on colored backgrounds)
 */
export function getContrastColor(hexColor: string): "#000000" | "#FFFFFF" {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

/**
 * Estimate PDF page dimensions from file
 * (Simplified - in production use pdf.js)
 */
export function estimatePdfDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    // Default A4 size in points (72 DPI)
    // In production, use pdf.js to get actual dimensions
    resolve({ width: 595, height: 842 }); // A4 portrait
  });
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Sleep/delay utility (for rate limiting)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Get storage path for certificate PDF
 */
export function getCertificateStoragePath(eventId: string, filename: string): string {
  return `certificates/${eventId}/${filename}`;
}

/**
 * Calculate success rate from generation results
 */
export function calculateSuccessRate(
  results: Array<{ success: boolean }>
): { successRate: number; successful: number; failed: number } {
  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;
  const successRate = results.length > 0 ? (successful / results.length) * 100 : 0;

  return { successRate, successful, failed };
}
