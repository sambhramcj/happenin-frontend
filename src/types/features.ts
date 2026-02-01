// TypeScript types for all new features

// ============================================
// Festival System Types
// ============================================

export interface FestivalSubmission {
  id: string;
  fest_id: string;
  event_id: string;
  submitted_by_email: string;
  submission_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by_email?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface FestivalAnalytics {
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  totalAttendance: number;
  uniqueParticipants: number;
  categoryBreakdown: Record<string, number>;
  averageRevenuePerEvent: number;
  conversionRate: number;
}

export interface FestivalScheduleEntry {
  eventId: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  venue: string;
  category: string;
  startDateTime: string;
}

// ============================================
// Voice Search Types
// ============================================

export interface VoiceFilters {
  category?: string;
  location?: string;
  priceRange?: 'free' | 'paid' | 'any';
  nearby?: boolean;
  college?: string;
  date?: string;
}

export interface VoiceCommandResult {
  query: string;
  filters: VoiceFilters;
}

// ============================================
// Sponsorship Types
// ============================================

export interface SponsorshipAsset {
  id: string;
  sponsorship_id: string;
  asset_type: string;
  asset_url: string;
  placement: 'banner' | 'sidebar' | 'footer' | 'inline';
  click_count: number;
  impression_count: number;
  created_at: string;
  sponsor?: {
    id: string;
    name: string;
    logo_url?: string;
    website_url?: string;
  };
  tier?: string;
}

export interface SponsorshipAnalytics {
  totalClicks: number;
  totalImpressions: number;
  clickThroughRate: number;
  assets: SponsorshipAsset[];
}

// ============================================
// Recommendation Types
// ============================================

export interface UserEventInteraction {
  id: string;
  user_email: string;
  event_id: string;
  interaction_type: 'view' | 'like' | 'share' | 'register' | 'skip';
  interaction_weight: number;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_email: string;
  preferred_categories: string[];
  preferred_colleges: string[];
  max_price?: number;
  max_distance_km?: number;
  preferred_days: string[];
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  updated_at: string;
}

export interface RecommendedEvent {
  id: string;
  title: string;
  category: string;
  event_date: string;
  event_time: string;
  location: string;
  price: number;
  banner_url?: string;
  recommendation_score: number;
}

// ============================================
// Real-time Types
// ============================================

export interface RealTimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  schema: string;
  table: string;
}

export interface RealTimeOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
}

// ============================================
// Admin Types
// ============================================

export interface VerificationRequest {
  userId: string;
  verificationType: 'email' | 'organizer' | 'college';
  verified: boolean;
  reason?: string;
}

export interface UserVerificationStatus {
  id: string;
  email: string;
  name: string;
  role: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  college_id?: string;
}

export interface FraudPattern {
  type: 'bulk_registration' | 'suspicious_registrations' | 'over_registration' | 'payment_fraud_attempts' | 'duplicate_events';
  severity: 'low' | 'medium' | 'high';
  description: string;
  count: number;
  affectedUsers: string[];
}

export interface FraudDetectionResult {
  patterns: FraudPattern[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  scannedAt: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FestivalSubmissionResponse {
  success: boolean;
  submission: FestivalSubmission;
  message: string;
}

export interface RecommendationsResponse {
  success: boolean;
  data: RecommendedEvent[];
}

export interface SponsorshipAssetResponse {
  success: boolean;
  asset: SponsorshipAsset;
  message: string;
}

export interface VerificationResponse {
  success: boolean;
  user: UserVerificationStatus;
  message: string;
}

// ============================================
// Hook Return Types
// ============================================

export interface UseRealtimeReturn {
  isConnected: boolean;
  error: string | null;
  unsubscribe: () => void;
}

export interface InteractionTrackingOptions {
  eventId: string;
  interactionType: 'view' | 'like' | 'share' | 'register' | 'skip';
}

// ============================================
// Enums
// ============================================

export enum InteractionType {
  VIEW = 'view',
  LIKE = 'like',
  SHARE = 'share',
  REGISTER = 'register',
  SKIP = 'skip'
}

export enum FraudSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum VerificationType {
  EMAIL = 'email',
  ORGANIZER = 'organizer',
  COLLEGE = 'college'
}

// ============================================
// Constants
// ============================================

export const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  [InteractionType.VIEW]: 1,
  [InteractionType.LIKE]: 3,
  [InteractionType.SHARE]: 4,
  [InteractionType.REGISTER]: 10,
  [InteractionType.SKIP]: -2
};
export const MIN_RECOMMENDATIONS = 10;
export const SIMILAR_USERS_LIMIT = 10;
export const BULK_REGISTRATION_WINDOW = 5 * 60 * 1000; // 5 minutes
export const BULK_REGISTRATION_THRESHOLD = 5;

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate recommendation score based on multiple factors
 */
export function calculateRecommendationScore(
  collaborativeScore: number,
  contentScore: number,
  preferenceScore: number,
  weights = { collaborative: 0.5, content: 0.3, preference: 0.2 }
): number {
  return (
    collaborativeScore * weights.collaborative +
    contentScore * weights.content +
    preferenceScore * weights.preference
  );
}

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}
