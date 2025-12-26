import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = 'https://ajlhijgibdkioivcpjff.supabase.co';
const supabaseKey = 'sb_publishable_xL03gge3vvExit41CQXvcg_ARVsfOUN';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
