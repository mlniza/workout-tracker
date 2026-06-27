// js/navbar.js — inject navbar HTML into any page
export function renderNavbar() {
  const nav = document.createElement('nav')
  nav.className = 'navbar'
  nav.innerHTML = `
    <div class="navbar__brand">WORKOUT<span>.</span>TRACKER</div>
    <ul class="navbar__links">
      <li><a href="/index.html"     data-page="dashboard">Dashboard</a></li>
      <li><a href="/log.html"       data-page="log">Log Sesi</a></li>
      <li><a href="/history.html"   data-page="history">Riwayat</a></li>
      <li><a href="/body.html"      data-page="body">Berat Badan</a></li>
      <li><a href="/exercises.html" data-page="exercises">Exercise</a></li>
    </ul>
    <div class="navbar__user">
      <span class="navbar__user-email"></span>
      <button class="btn-logout">Keluar</button>
    </div>
  `
  document.body.prepend(nav)
}
