/**
 * Central API Configuration
 */

// ML API URL from environment variables with fallback
export const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// API Feature Flags
export const USE_ML_API = import.meta.env.VITE_USE_ML_API === 'true';

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// AI Mentor (Groq) Configuration
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
