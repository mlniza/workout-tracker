// js/dashboard.js
// Dashboard modules: Heatmap, Radar Chart, Fatigue Banners

import { isDismissed, dismissSignal } from './fatigue.js'

// ═══════════════════════════════════════════════════════════
//  1. WORKOUT HEATMAP CALENDAR
// ═══════════════════════════════════════════════════════════

const HEATMAP_COLORS = {
  0: '#2E2E2E',    // Tidak latihan
  1: '#6B1010',    // 1 exercise
  2: '#A32020',    // 2–3 exercise
  4: '#E63030',    // ≥4 exercise
}

function getHeatmapColor(exerciseCount) {
  if (exerciseCount === 0) return HEATMAP_COLORS[0]
  if (exerciseCount === 1) return HEATMAP_COLORS[1]
  if (exerciseCount <= 3) return HEATMAP_COLORS[2]
  return HEATMAP_COLORS[4]
}

/**
 * Render GitHub-style workout heatmap
 * @param {HTMLElement} container - Target container element
 * @param {Array} sessions - workout_sessions data
 */
export function renderHeatmap(container, sessions) {
  const now = new Date()
  const year = now.getFullYear()

  // Build session map: date -> { exercises: Set, volume: number }
  const sessionMap = {}
  sessions.forEach(s => {
    if (!sessionMap[s.session_date]) {
      sessionMap[s.session_date] = { exercises: new Set(), volume: 0 }
    }
    sessionMap[s.session_date].exercises.add(s.exercise_name)
    sessionMap[s.session_date].volume += s.reps * parseFloat(s.weight_kg)
  })

  // Calculate 52 weeks back from today
  const dayLabels = ['', 'Sen', '', 'Rab', '', 'Jum', '']
  const endDate = new Date(now)
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (52 * 7) - startDate.getDay())

  // Build grid data
  const weeks = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const weekDays = []
    for (let d = 0; d < 7; d++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const data = sessionMap[dateStr]
      weekDays.push({
        date: dateStr,
        count: data ? data.exercises.size : 0,
        volume: data ? Math.round(data.volume) : 0,
        future: currentDate > endDate
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(weekDays)
  }

  // Calculate stats
  const thisYearStart = `${year}-01-01`
  const totalDays = Object.keys(sessionMap).filter(d => d >= thisYearStart).length
  const streak = calculateStreak(sessionMap)

  // Month labels
  const months = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const firstDay = new Date(week[0].date + 'T00:00:00')
    const month = firstDay.getMonth()
    if (month !== lastMonth) {
      months.push({ index: i, name: firstDay.toLocaleDateString('id-ID', { month: 'short' }) })
      lastMonth = month
    }
  })

  // Render
  container.innerHTML = `
    <div class="heatmap">
      <div class="heatmap__header">
        <span class="heatmap__title">KONSISTENSI LATIHAN</span>
        <span class="heatmap__year">${year}</span>
      </div>
      <div class="heatmap__body">
        <div class="heatmap__days">
          ${dayLabels.map(l => `<div class="heatmap__day-label">${l}</div>`).join('')}
        </div>
        <div class="heatmap__scroll">
          <div class="heatmap__months">
            ${renderMonthLabels(months, weeks.length)}
          </div>
          <div class="heatmap__grid" id="heatmapGrid">
            ${weeks.map(week => `
              <div class="heatmap__week">
                ${week.map(day => `
                  <div class="heatmap__cell${day.future ? ' heatmap__cell--future' : ''}"
                       style="background:${day.future ? 'transparent' : getHeatmapColor(day.count)}"
                       data-date="${day.date}"
                       data-count="${day.count}"
                       data-volume="${day.volume}"
                       ${!day.future ? 'tabindex="0"' : ''}>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="heatmap__footer">
        <div class="heatmap__stats">
          <span>🔥 <strong>${totalDays}</strong> hari latihan tahun ini</span>
          <span>⚡ Streak terpanjang: <strong>${streak}</strong> hari</span>
        </div>
        <div class="heatmap__legend">
          <span class="heatmap__legend-label">Kurang</span>
          <div class="heatmap__legend-cell" style="background:#2E2E2E"></div>
          <div class="heatmap__legend-cell" style="background:#6B1010"></div>
          <div class="heatmap__legend-cell" style="background:#A32020"></div>
          <div class="heatmap__legend-cell" style="background:#E63030"></div>
          <span class="heatmap__legend-label">Banyak</span>
        </div>
      </div>
    </div>
  `

  // Tooltip + click
  const tooltip = document.createElement('div')
  tooltip.className = 'heatmap__tooltip'
  tooltip.style.display = 'none'
  container.appendChild(tooltip)

  container.querySelectorAll('.heatmap__cell:not(.heatmap__cell--future)').forEach(cell => {
    cell.addEventListener('mouseenter', (e) => {
      const date = cell.dataset.date
      const count = parseInt(cell.dataset.count)
      const volume = parseInt(cell.dataset.volume)
      const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
      })

      tooltip.innerHTML = `
        <div style="font-weight:600;margin-bottom:0.2rem;">${dateLabel}</div>
        <div>${count ? `${count} exercise · ${volume.toLocaleString('id-ID')} kg` : 'Tidak ada latihan'}</div>
      `
      tooltip.style.display = 'block'

      const rect = cell.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`
      tooltip.style.top = `${rect.top - containerRect.top - 8}px`
    })

    cell.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none'
    })

    cell.addEventListener('click', () => {
      window.location.href = `/history.html?date=${cell.dataset.date}`
    })
  })
}

function renderMonthLabels(months, totalWeeks) {
  let html = ''
  for (let i = 0; i < months.length; i++) {
    const pos = months[i].index
    html += `<span style="position:absolute;left:${pos * 14}px">${months[i].name}</span>`
  }
  return `<div style="position:relative;height:16px;width:${totalWeeks * 14}px">${html}</div>`
}

function calculateStreak(sessionMap) {
  const dates = Object.keys(sessionMap).sort()
  if (!dates.length) return 0

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00')
    const curr = new Date(dates[i] + 'T00:00:00')
    const diff = (curr - prev) / (1000 * 60 * 60 * 24)

    if (diff === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }
  return maxStreak
}


// ═══════════════════════════════════════════════════════════
//  2. RADAR CHART — MUSCLE BALANCE
// ═══════════════════════════════════════════════════════════

const MUSCLE_CATEGORIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

/**
 * Calculate muscle balance scores
 * @param {Array} sessions - Filtered workout sessions
 * @returns {Object} { scores, volumes, frequencies, recommendations }
 */
export function calculateMuscleBalance(sessions) {
  const data = {}
  MUSCLE_CATEGORIES.forEach(cat => {
    data[cat] = { volume: 0, days: new Set() }
  })

  // Categorize sessions by exercise category
  sessions.forEach(s => {
    // Try matching the exercise_name to known categories
    // We use the session data which should have the category info
    // Since we only have exercise_name, we'll map from the exercises table
    // For now, we'll use the category field if available, or infer from name
    const cat = inferCategory(s)
    if (cat && data[cat]) {
      data[cat].volume += s.reps * parseFloat(s.weight_kg)
      data[cat].days.add(s.session_date)
    }
  })

  // Find max values for normalization
  const volumes = {}
  const frequencies = {}
  MUSCLE_CATEGORIES.forEach(cat => {
    volumes[cat] = Math.round(data[cat].volume)
    frequencies[cat] = data[cat].days.size
  })

  const maxVol = Math.max(...Object.values(volumes), 1)
  const maxFreq = Math.max(...Object.values(frequencies), 1)

  // Calculate scores
  const scores = {}
  MUSCLE_CATEGORIES.forEach(cat => {
    const volNorm = (volumes[cat] / maxVol) * 100
    const freqNorm = (frequencies[cat] / maxFreq) * 100
    scores[cat] = Math.round(volNorm * 0.6 + freqNorm * 0.4)
  })

  // Generate recommendations
  const recommendations = generateRecommendations(scores, volumes, frequencies)

  return { scores, volumes, frequencies, recommendations }
}

function inferCategory(session) {
  // Map exercise names/categories to our 6 muscle categories
  // This uses common exercise naming conventions
  const name = (session.exercise_name || '').toLowerCase()

  const categoryMap = {
    'Chest': ['bench press', 'chest', 'pec', 'fly', 'push up', 'push-up', 'crossover', 'dip'],
    'Back': ['deadlift', 'row', 'pull up', 'pull-up', 'pulldown', 'lat ', 'back', 'cable row'],
    'Legs': ['squat', 'leg ', 'lunge', 'calf', 'hamstring', 'quad', 'romanian', 'leg press', 'leg curl', 'leg extension', 'box jump'],
    'Shoulders': ['shoulder', 'overhead press', 'lateral raise', 'front raise', 'face pull', 'deltoid', 'military press', 'ohp'],
    'Arms': ['curl', 'bicep', 'tricep', 'pushdown', 'skull crusher', 'hammer', 'preacher'],
    'Core': ['plank', 'crunch', 'ab ', 'core', 'sit up', 'sit-up', 'russian twist', 'leg raise', 'hanging']
  }

  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => name.includes(k))) return cat
  }

  return null // Skip cardio and unmatched
}

function getScoreLabel(score) {
  if (score >= 80) return { text: 'Dominan', color: '#E63030' }
  if (score >= 50) return { text: 'Seimbang', color: '#4ADE80' }
  if (score >= 20) return { text: 'Kurang', color: '#FBBF24' }
  return { text: 'Sangat Kurang', color: '#888888' }
}

function generateRecommendations(scores, volumes, frequencies) {
  const recs = []
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1])

  // Find weak points
  sorted.forEach(([cat, score]) => {
    if (score < 20 && recs.length < 3) {
      recs.push({
        type: 'critical',
        text: `${cat} sangat kurang (skor: ${score}). Tambahkan minimal 2 sesi ${cat.toLowerCase()} per minggu.`
      })
    } else if (score < 50 && recs.length < 3) {
      recs.push({
        type: 'warning',
        text: `${cat} kurang dilatih (skor: ${score}). Pertimbangkan tambahan volume untuk menyeimbangkan.`
      })
    }
  })

  // Check imbalance
  const maxScore = Math.max(...Object.values(scores))
  const minScore = Math.min(...Object.values(scores))
  if (maxScore > 0 && (maxScore - minScore) > 60 && recs.length < 3) {
    const dominant = sorted[sorted.length - 1][0]
    const weakest = sorted[0][0]
    recs.push({
      type: 'info',
      text: `Ketidakseimbangan tinggi antara ${dominant} (${maxScore}) dan ${weakest} (${minScore}). Seimbangkan rasio push/pull.`
    })
  }

  if (!recs.length) {
    recs.push({ type: 'success', text: 'Distribusi latihan cukup seimbang. Pertahankan!' })
  }

  return recs
}

/**
 * Render radar chart using Chart.js
 */
export function renderRadarChart(canvasId, scores, volumes, frequencies) {
  const ctx = document.getElementById(canvasId)
  if (!ctx) return null

  const labels = MUSCLE_CATEGORIES
  const data = labels.map(cat => scores[cat] || 0)

  return new Chart(ctx.getContext('2d'), {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Muscle Balance',
        data,
        backgroundColor: 'rgba(230, 48, 48, 0.15)',
        borderColor: '#E63030',
        borderWidth: 2,
        pointBackgroundColor: '#E63030',
        pointBorderColor: '#E63030',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const cat = labels[ctx.dataIndex]
              const score = data[ctx.dataIndex]
              const vol = (volumes[cat] || 0).toLocaleString('id-ID')
              const freq = frequencies[cat] || 0
              const { text } = getScoreLabel(score)
              return [
                `Skor: ${score} (${text})`,
                `Volume: ${vol} kg`,
                `Frekuensi: ${freq} hari`
              ]
            },
            title: function(items) {
              return items[0].label
            }
          },
          backgroundColor: '#1A1A1A',
          titleColor: '#E8E8E8',
          bodyColor: '#AAAAAA',
          borderColor: '#333333',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25,
            font: { size: 10 },
            color: '#666666',
            backdropColor: 'transparent'
          },
          grid: {
            color: 'rgba(255,255,255,0.08)'
          },
          angleLines: {
            color: 'rgba(255,255,255,0.08)'
          },
          pointLabels: {
            font: { size: 11, weight: '600' },
            color: '#AAAAAA'
          }
        }
      }
    }
  })
}


// ═══════════════════════════════════════════════════════════
//  3. FATIGUE SIGNAL BANNERS
// ═══════════════════════════════════════════════════════════



const SEVERITY_STYLES = {
  critical: { bg: 'rgba(230, 48, 48, 0.12)', border: '#E63030', color: '#E8E8E8' },
  warning:  { bg: 'rgba(253, 230, 138, 0.1)', border: '#FDE68A', color: '#FDE68A' },
  normal:   { bg: 'rgba(58, 58, 58, 0.5)',     border: '#3A3A3A', color: '#AAAAAA' }
}

/**
 * Render fatigue signal banners
 * @param {HTMLElement} container - Target container
 * @param {Array} signals - From detectFatigueSignals()
 */
export function renderFatigueBanners(container, signals) {
  const visible = signals.filter(s => !isDismissed(s.type))

  if (!visible.length) {
    container.style.display = 'none'
    return
  }

  container.style.display = 'block'
  container.innerHTML = visible.map(signal => {
    const style = SEVERITY_STYLES[signal.severity] || SEVERITY_STYLES.normal
    return `
      <div class="fatigue-banner" data-type="${signal.type}"
           style="background:${style.bg};border-left:3px solid ${style.border};">
        <div class="fatigue-banner__content">
          <span class="fatigue-banner__icon">${signal.icon}</span>
          <span class="fatigue-banner__msg" style="color:${style.color}">${signal.message}</span>
        </div>
        <button class="fatigue-banner__dismiss" data-dismiss="${signal.type}" title="Sembunyikan 7 hari">×</button>
      </div>
    `
  }).join('')

  // Dismiss handlers
  container.querySelectorAll('.fatigue-banner__dismiss').forEach(btn => {
    btn.addEventListener('click', () => {
      dismissSignal(btn.dataset.dismiss)
      const banner = btn.closest('.fatigue-banner')
      banner.style.opacity = '0'
      banner.style.transform = 'translateX(20px)'
      setTimeout(() => {
        banner.remove()
        if (!container.querySelector('.fatigue-banner')) {
          container.style.display = 'none'
        }
      }, 300)
    })
  })
}


// ═══════════════════════════════════════════════════════════
//  4. RADAR RECOMMENDATIONS PANEL
// ═══════════════════════════════════════════════════════════

export function renderMuscleRecommendations(container, recommendations) {
  const icons = { critical: '🔴', warning: '🟡', info: '🔵', success: '🟢' }

  container.innerHTML = recommendations.map(rec => `
    <div class="muscle-rec">
      <span class="muscle-rec__icon">${icons[rec.type] || '•'}</span>
      <span class="muscle-rec__text">${rec.text}</span>
    </div>
  `).join('')
}
