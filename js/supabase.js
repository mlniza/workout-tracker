// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL  = 'sb_publishable_2h_ldtFGo6PPXAZwvVqkVw_kf5zcYPb'
const SUPABASE_KEY  = 'sb_secret_bP-q8QsQxXyXP_a6lr_ygQ_Wcesi7jh'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
