import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = 'https://ajlhijgibdkioivcpjff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGhpamdpYmRraW9pdmNwamZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjg1NjEsImV4cCI6MjA4MjMwNDU2MX0.dT3L4bwWr5HfV6kg3DL0wC7TXG7MvtPagmTpHiDKj3s';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
