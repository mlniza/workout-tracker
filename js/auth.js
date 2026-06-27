// js/auth.js
import { supabase } from './supabase.js'

// Protect all pages except login — call at top of every page script
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/login.html'
    return null
  }
  return session
}

// Render user email + logout button in navbar
export async function initNavbar(activePage) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  // Mark active nav link
  document.querySelectorAll('.navbar__links a').forEach(a => {
    if (a.dataset.page === activePage) a.classList.add('active')
  })

  // Inject user email
  const emailEl = document.querySelector('.navbar__user-email')
  if (emailEl) emailEl.textContent = session.user.email

  // Logout button
  const logoutBtn = document.querySelector('.btn-logout')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut()
      window.location.href = '/login.html'
    })
  }
}

export function getUserId(session) {
  return session?.user?.id
}
