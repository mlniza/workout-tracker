// js/toast.js
export function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()

  const t = document.createElement('div')
  t.className = `toast toast--${type}`
  t.textContent = msg
  document.body.appendChild(t)

  setTimeout(() => {
    t.classList.add('hide')
    setTimeout(() => t.remove(), 300)
  }, 3000)
}
