// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL  = 'https://wtvfcmshwenvlgntmthe.supabase.co'
const SUPABASE_KEY  = 'sb_secret_VFULUOGescQEt_nCya2eow_4rVMXuka'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
