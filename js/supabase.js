// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL  = 'https://wtvfcmshwenvlgntmthe.supabase.co/rest/v1/'
const SUPABASE_KEY  = 'https://sb_publishable_2h_ldtFGo6PPXAZwvVqkVw_kf5zcYPb.supabase.co'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
