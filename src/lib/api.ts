// HAPPENIN — API CLIENT
// Production-ready API wrapper with retry, error handling, and offline support
// 
// DISASTER SCENARIO HANDLING:
// - Fest day traffic: stale-while-revalidate for event lists
// - Payment delays: mark as "Pending verification" while webhook confirms
// - Connection drops: preserve registration intent locally

import { retryWithBackoff } from './offline';

type RequestOptions = Omit<RequestInit, 'cache'> & {
  retry?: boolean;
  skipAuth?: boolean;
  cacheMode?: 'stale-while-revalidate' | 'no-cache';
};

/**
 * Cache for stale-while-revalidate responses
 * Used during fest day traffic spikes
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const responseCache = new Map<string, CacheEntry>();

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Check if cached response is still valid
 */
function isCacheValid(cacheEntry: CacheEntry): boolean {
  return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { retry = true, skipAuth = false, cacheMode, ...fetchOptions } = options;
  const cacheStrategy = (cacheMode || 'no-cache') as 'stale-while-revalidate' | 'no-cache';

  const makeRequest = async () => {
    // Check cache first for stale-while-revalidate
    if (cacheStrategy === 'stale-while-revalidate') {
      const cached = responseCache.get(endpoint);
      if (cached && isCacheValid(cached)) {
        return cached.data as T;
      }
    }

    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      // DISASTER SCENARIO: Return stale data if available during failures
      if (cacheStrategy === 'stale-while-revalidate') {
        const cached = responseCache.get(endpoint);
        if (cached) {
          console.warn(`Using stale cache for ${endpoint} due to error`);
          return cached.data as T;
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    // Update cache if using stale-while-revalidate
    if (cacheStrategy === 'stale-while-revalidate') {
      responseCache.set(endpoint, {
        data,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minute TTL
      });
    }

    return data as T;
  };

  if (retry) {
    return retryWithBackoff(makeRequest, `API ${endpoint}`);
  }

  return makeRequest();
}

export const api = {
  // Events
  // DISASTER SCENARIO: Fest day traffic - use stale-while-revalidate
  async getEvents() {
    return apiRequest<any[]>('/api/events', {
      cacheMode: 'stale-while-revalidate',
    });
  },

  async createEvent(data: any) {
    return apiRequest('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
      cacheMode: 'no-cache',
    });
  },

  // Student
  async getProfile() {
    return apiRequest<any>('/api/student/profile');
  },

  async updateProfile(data: any) {
    return apiRequest('/api/student/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTickets() {
    return apiRequest<any[]>('/api/student/tickets');
  },

  // Payments
  async createOrder(data: { eventId: string; finalPrice: number }) {
    return apiRequest<{ orderId: string; amount: number }>('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
      retry: false, // Never retry payment creation
    });
  },

  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    eventId: string;
    finalPrice: number;
  }) {
    return apiRequest<{ success: boolean; ticket?: any }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Organizer
  async getEventRegistrations(eventId: string) {
    return apiRequest<any>(`/api/organizer/events/${eventId}/registrations`);
  },

  async getAttendance(eventId: string) {
    return apiRequest<any>(`/api/organizer/attendance/${eventId}`);
  },

  async recordAttendance(eventId: string, qrCodeData: string) {
    return apiRequest(`/api/organizer/attendance/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ qrCodeData }),
    });
  },

  // Image upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    });
  },
};

export { APIError };
