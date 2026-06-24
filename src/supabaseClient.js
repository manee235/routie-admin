import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wsainudpskltqfxtpucn.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzYWludWRwc2tsdHFmeHRwdWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDI2NjMsImV4cCI6MjA5MzMxODY2M30.q2zCyqrUyZtzaL-ZumDj53EV-CkGFVQiicAped_hAqU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
