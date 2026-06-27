// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL  = 'sb_secret_VFULUOGescQEt_nCya2eow_4rVMXuka'
const SUPABASE_KEY  = 'https://sb_publishable_2h_ldtFGo6PPXAZwvVqkVw_kf5zcYPb.supabase.co'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
