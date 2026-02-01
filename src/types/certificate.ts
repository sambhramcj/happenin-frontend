/**
 * TypeScript types for certificate generation system
 */

export interface CertificateTemplate {
  id: string;
  event_id: string;
  base_pdf_url: string;
  base_pdf_storage_path: string;
  name_font: string;
  name_font_size: number;
  name_color: string;
  name_align: "left" | "center" | "right";
  name_pos_x: number;
  name_pos_y: number;
  created_at: string;
  updated_at: string;
}

export interface CertificateGenerationRequest {
  eventId: string;
  studentName: string;
  download?: boolean;
}

export interface BulkCertificateRequest {
  eventId: string;
  studentNames: string[];
}

export interface CertificateFont {
  name: string;
  value: string;
  category: "formal" | "modern" | "display" | "script" | "minimal";
  googleFontsUrl: string;
  weight?: number;
  recommended?: boolean;
}

export interface CertificateGenerationResult {
  success: boolean;
  studentName: string;
  downloadUrl?: string;
  error?: string;
}
