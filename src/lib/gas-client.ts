// Optimized GAS Client with advanced caching, sync, and performance features
const GAS_URL = import.meta.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbwWoZtW-PbJv0wCB6VQquETpPpbenpFjRlhioqJ1jR0_5ES689-S_X126R9IVNoBDe0/exec';
const API_BASE_URL = GAS_URL; // Use GAS URL directly

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  COMPLAINTS_TTL: 2 * 60 * 1000, // 2 minutes for complaints (more dynamic)
  USERS_TTL: 10 * 60 * 1000, // 10 minutes for users
  OFFLINE_QUEUE_KEY: 'gas_offline_queue',
  CACHE_PREFIX: 'gas_cache_'
};

// Connection and retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  cached?: boolean;
  timestamp?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
  retries: number;
}

// Advanced caching system
class GasCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Offline queue management
class OfflineQueue {
  private queue: OfflineQueueItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  add(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>): void {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(queueItem);
    this.saveToStorage();
  }

  getAll(): OfflineQueueItem[] {
    return [...this.queue];
  }

  remove(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveToStorage();
  }

  updateRetries(id: string): void {
    const item = this.queue.find(item => item.id === id);
    if (item) {
      item.retries++;
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CACHE_CONFIG.OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save offline queue to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_CONFIG.OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline queue from storage:', error);
    }
  }
}

// Global instances
const cache = new GasCache();
const offlineQueue = new OfflineQueue();

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateBackoffDelay = (retryCount: number): number => {
  const delay = RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
};

const isOnline = (): boolean => {
  return navigator.onLine;
};

const compressData = (data: any): string => {
  // Simple compression for large payloads
  return JSON.stringify(data);
};

const decompressData = (data: string): any => {
  return JSON.parse(data);
};

// Optimized request function with caching, retries, and offline support
const makeRequest = async (
  endpoint: string,
  method: string = 'GET',
  data: any = {},
  options: {
    useCache?: boolean;
    cacheKey?: string;
    ttl?: number;
    skipOfflineQueue?: boolean;
    optimistic?: boolean;
  } = {}
): Promise<ApiResponse> => {
  const {
    useCache = true,
    cacheKey = `${method}_${endpoint}_${JSON.stringify(data)}`,
    ttl,
    skipOfflineQueue = false,
    optimistic = false
  } = options;

  // Check cache first for GET requests
  if (method === 'GET' && useCache) {
    const cachedData = cache.get<ApiResponse>(cacheKey);
    if (cachedData) {
      console.log('🚀 GAS API: Serving from cache:', endpoint);
      return { ...cachedData, cached: true };
    }
  }

  // If offline and not skipping offline queue, add to queue
  if (!isOnline() && !skipOfflineQueue && (method === 'POST' || method === 'PUT')) {
    console.log('📱 GAS API: Offline - queuing request:', endpoint);
    offlineQueue.add({ endpoint, method, data });

    // Return optimistic response if enabled
    if (optimistic) {
      return {
        success: true,
        data: { id: `temp_${Date.now()}`, ...data },
        cached: false,
        timestamp: Date.now()
      };
    }

    throw new Error('Network unavailable. Request queued for later sync.');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`🚀 GAS API: ${method} ${endpoint} (attempt ${attempt + 1})`);

      const url = API_BASE_URL;
      const gasData = {
        path: endpoint,
        action: method === 'GET' ? 'get' : method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
        data: data
      };

      const config: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for better performance
        signal: AbortSignal.timeout(30000) // 30 second timeout
      };

      config.body = compressData(gasData);

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();

      // Cache successful GET responses
      if (method === 'GET' && result.success) {
        cache.set(cacheKey, result, ttl);
        console.log('💾 GAS API: Cached response for:', endpoint);
      }

      // Invalidate related caches on mutations
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        if (endpoint.includes('/complaints')) {
          cache.invalidate('complaints');
        } else if (endpoint.includes('/customers') || endpoint.includes('/users')) {
          cache.invalidate('users');
          cache.invalidate('customers');
        }
      }

      return result;

    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ GAS API: Attempt ${attempt + 1} failed for ${endpoint}:`, error.message);

      // Don't retry on client errors (4xx)
      if (error.message.includes('HTTP 4')) {
        break;
      }

      // Wait before retrying (except on last attempt)
      if (attempt < RETRY_CONFIG.MAX_RETRIES) {
        const backoffDelay = calculateBackoffDelay(attempt);
        console.log(`⏳ GAS API: Retrying in ${backoffDelay}ms...`);
        await delay(backoffDelay);
      }
    }
  }

  // All retries failed
  console.error('❌ GAS API: All retry attempts failed for:', endpoint, lastError);
  throw lastError || new Error('Request failed after all retry attempts');
};

// Background sync function
const processOfflineQueue = async (): Promise<void> => {
  if (!isOnline()) return;

  const queuedItems = offlineQueue.getAll();
  console.log(`🔄 GAS API: Processing ${queuedItems.length} queued requests`);

  for (const item of queuedItems) {
    try {
      console.log('📤 GAS API: Syncing queued request:', item.endpoint);
      await makeRequest(item.endpoint, item.method, item.data, { skipOfflineQueue: true });

      offlineQueue.remove(item.id);
      console.log('✅ GAS API: Successfully synced:', item.endpoint);

    } catch (error) {
      console.error('❌ GAS API: Failed to sync queued request:', item.endpoint, error);

      offlineQueue.updateRetries(item.id);

      // Remove from queue after max retries
      if (item.retries >= RETRY_CONFIG.MAX_RETRIES) {
        offlineQueue.remove(item.id);
        console.warn('🗑️ GAS API: Removed failed request from queue after max retries');
      }
    }
  }
};

// Initialize background sync
if (typeof window !== 'undefined') {
  // Process queue when coming back online
  window.addEventListener('online', () => {
    console.log('🌐 GAS API: Connection restored, processing offline queue');
    processOfflineQueue();
  });

  // Periodic sync (every 30 seconds when online)
  setInterval(() => {
    if (isOnline()) {
      processOfflineQueue();
    }
  }, 30000);
}

// Optimized GAS API with performance enhancements
export const gasApi = {
  // Core request method
  request: makeRequest,

  // Authentication
  login: async (email: string, password: string): Promise<ApiResponse> => {
    return makeRequest('/api/auth/login', 'POST', { email, password }, {
      useCache: false,
      skipOfflineQueue: true
    });
  },

  // Customer operations
  searchCustomer: async (contractAccountNumber?: string, businessPartnerNumber?: string): Promise<ApiResponse> => {
    return makeRequest('/api/customers/search', 'POST', { contractAccountNumber, businessPartnerNumber }, {
      cacheKey: `search_${contractAccountNumber}_${businessPartnerNumber}`,
      ttl: CACHE_CONFIG.DEFAULT_TTL
    });
  },

  createCustomer: async (customerData: any): Promise<ApiResponse> => {
    return makeRequest('/api/customers', 'POST', customerData, {
      useCache: false,
      optimistic: true
    });
  },

  getCustomers: async (filters: any = {}): Promise<ApiResponse> => {
    const cacheKey = `customers_${JSON.stringify(filters)}`;
    return makeRequest('/api/customers', 'GET', filters, {
      cacheKey,
      ttl: CACHE_CONFIG.USERS_TTL
    });
  },

  // Complaint operations with optimized caching
  createComplaint: async (complaintData: any): Promise<ApiResponse> => {
    return makeRequest('/api/complaints', 'POST', complaintData, {
      useCache: false,
      optimistic: true
    });
  },

  getComplaints: async (filters: any = {}): Promise<ApiResponse> => {
    const cacheKey = `complaints_${JSON.stringify(filters)}`;
    return makeRequest('/api/complaints', 'GET', filters, {
      cacheKey,
      ttl: CACHE_CONFIG.COMPLAINTS_TTL
    });
  },

  updateComplaint: async (id: string, updateData: any): Promise<ApiResponse> => {
    return makeRequest(`/api/complaints/${id}`, 'PUT', updateData, {
      useCache: false,
      optimistic: true
    });
  },

  deleteComplaint: async (id: string): Promise<ApiResponse> => {
    return makeRequest(`/api/complaints/${id}`, 'DELETE', {}, {
      useCache: false
    });
  },

  // User management
  getUsers: async (filters: any = {}): Promise<ApiResponse> => {
    const cacheKey = `users_${JSON.stringify(filters)}`;
    return makeRequest('/api/users', 'GET', filters, {
      cacheKey,
      ttl: CACHE_CONFIG.USERS_TTL
    });
  },

  createUser: async (userData: any): Promise<ApiResponse> => {
    return makeRequest('/api/users', 'POST', userData, {
      useCache: false
    });
  },

  updateUser: async (id: string, userData: any): Promise<ApiResponse> => {
    return makeRequest(`/api/users/${id}`, 'PUT', userData, {
      useCache: false
    });
  },

  deleteUser: async (id: string): Promise<ApiResponse> => {
    return makeRequest(`/api/users/${id}`, 'DELETE', {}, {
      useCache: false
    });
  },

  // Bulk operations for better performance
  bulkUpdateComplaints: async (updates: Array<{ id: string; data: any }>): Promise<ApiResponse> => {
    return makeRequest('/api/complaints/bulk', 'POST', { updates }, {
      useCache: false
    });
  },

  // Analytics and reporting with extended caching
  getAnalytics: async (filters: any = {}): Promise<ApiResponse> => {
    const cacheKey = `analytics_${JSON.stringify(filters)}`;
    return makeRequest('/api/analytics', 'GET', filters, {
      cacheKey,
      ttl: CACHE_CONFIG.DEFAULT_TTL * 2 // Longer cache for analytics
    });
  },

  // Utility methods
  clearCache: () => cache.clear(),
  getCacheStats: () => ({ size: cache['cache'].size }),
  processOfflineQueue,
  isOnline
};

// Export cache and queue for advanced usage
export { cache, offlineQueue };
