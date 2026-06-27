// js/fatigue.js
// Fatigue signal detection — overtraining indicators

const DISMISS_KEY = 'fatigue_dismissed'

/**
 * Detect all fatigue signals from workout data
 * @param {Array} sessions - All workout_sessions rows
 * @returns {Array} signals sorted by priority
 */
export function detectFatigueSignals(sessions) {
  const signals = []
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  if (!sessions.length) return signals

  // ── Helper: get unique dates
  const uniqueDates = [...new Set(sessions.map(s => s.session_date))].sort()
  const lastWorkout = uniqueDates[uniqueDates.length - 1]

  // ── 1. Volume Drop
  const volumeSignal = detectVolumeDrop(sessions, now)
  if (volumeSignal) signals.push(volumeSignal)

  // ── 2. Frequency Drop
  const freqSignal = detectFrequencyDrop(sessions, now)
  if (freqSignal) signals.push(freqSignal)

  // ── 3. Long Rest
  const restSignal = detectLongRest(lastWorkout, todayStr)
  if (restSignal) signals.push(restSignal)

  // ── 4. Plateau Cluster
  const plateauSignal = detectPlateauCluster(sessions)
  if (plateauSignal) signals.push(plateauSignal)

  // Sort by priority (lower = higher priority)
  signals.sort((a, b) => a.priority - b.priority)

  return signals
}

function getWeekStart(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}

function getWeekVolume(sessions, weekStartStr) {
  const weekEnd = new Date(weekStartStr)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  return sessions
    .filter(s => s.session_date >= weekStartStr && s.session_date <= weekEndStr)
    .reduce((sum, s) => sum + s.reps * parseFloat(s.weight_kg), 0)
}

function getWeekSessionCount(sessions, weekStartStr) {
  const weekEnd = new Date(weekStartStr)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  return [...new Set(
    sessions
      .filter(s => s.session_date >= weekStartStr && s.session_date <= weekEndStr)
      .map(s => s.session_date)
  )].length
}

function detectVolumeDrop(sessions, now) {
  const thisWeekStart = getWeekStart(now)
  const thisWeekVol = getWeekVolume(sessions, thisWeekStart)

  // Get 4 previous weeks
  const prevVolumes = []
  for (let i = 1; i <= 4; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const ws = getWeekStart(d)
    prevVolumes.push(getWeekVolume(sessions, ws))
  }

  const avgPrev = prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length
  if (avgPrev === 0) return null

  const dropPercent = ((avgPrev - thisWeekVol) / avgPrev) * 100

  if (dropPercent > 40) {
    return {
      type: 'volume_drop',
      priority: 1,
      severity: 'critical',
      icon: '📉',
      message: `Volume minggu ini turun ${Math.round(dropPercent)}% dari rata-rata 4 minggu sebelumnya. Pertimbangkan deload terencana atau evaluasi intensitas latihan.`,
      data: { dropPercent: Math.round(dropPercent), thisWeek: Math.round(thisWeekVol), avgPrev: Math.round(avgPrev) }
    }
  } else if (dropPercent > 25) {
    return {
      type: 'volume_drop',
      priority: 3,
      severity: 'warning',
      icon: '📉',
      message: `Volume minggu ini turun ${Math.round(dropPercent)}% dari rata-rata. Pantau apakah ini penurunan sementara atau tren menurun.`,
      data: { dropPercent: Math.round(dropPercent), thisWeek: Math.round(thisWeekVol), avgPrev: Math.round(avgPrev) }
    }
  }
  return null
}

function detectFrequencyDrop(sessions, now) {
  const thisWeekStart = getWeekStart(now)
  const thisWeekCount = getWeekSessionCount(sessions, thisWeekStart)

  const prevCounts = []
  for (let i = 1; i <= 4; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    prevCounts.push(getWeekSessionCount(sessions, getWeekStart(d)))
  }

  const avgPrev = prevCounts.reduce((a, b) => a + b, 0) / prevCounts.length
  if (avgPrev === 0) return null

  const dropPercent = ((avgPrev - thisWeekCount) / avgPrev) * 100

  if (dropPercent > 40) {
    return {
      type: 'frequency_drop',
      priority: 4,
      severity: 'warning',
      icon: '📅',
      message: `Frekuensi latihan minggu ini turun ${Math.round(dropPercent)}%. Rata-rata sebelumnya ${avgPrev.toFixed(1)}x/minggu, minggu ini ${thisWeekCount}x.`,
      data: { dropPercent: Math.round(dropPercent), thisWeek: thisWeekCount, avgPrev: avgPrev.toFixed(1) }
    }
  }
  return null
}

function detectLongRest(lastWorkoutDate, todayStr) {
  if (!lastWorkoutDate) return null

  const last = new Date(lastWorkoutDate + 'T00:00:00')
  const today = new Date(todayStr + 'T00:00:00')
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24))

  if (diffDays > 5) {
    return {
      type: 'long_rest',
      priority: 5,
      severity: 'normal',
      icon: '💤',
      message: `Sudah ${diffDays} hari sejak latihan terakhir (${new Date(lastWorkoutDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}). Mulai kembali dengan intensitas ringan.`,
      data: { days: diffDays, lastDate: lastWorkoutDate }
    }
  }
  return null
}

function detectPlateauCluster(sessions) {
  // Group sessions by exercise
  const byExercise = {}
  sessions.forEach(s => {
    if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = {}
    if (!byExercise[s.exercise_name][s.session_date]) {
      byExercise[s.exercise_name][s.session_date] = 0
    }
    const w = parseFloat(s.weight_kg)
    if (w > byExercise[s.exercise_name][s.session_date]) {
      byExercise[s.exercise_name][s.session_date] = w
    }
  })

  const plateauExercises = []

  for (const [name, dateWeights] of Object.entries(byExercise)) {
    const dates = Object.keys(dateWeights).sort()
    if (dates.length < 3) continue

    // Check last 3 sessions
    const last3 = dates.slice(-3).map(d => dateWeights[d])
    const maxWeight = Math.max(...last3)
    const minWeight = Math.min(...last3)

    // Plateau: max weight hasn't increased (difference < 2.5kg across last 3)
    if (maxWeight - minWeight < 2.5 && last3[last3.length - 1] <= last3[0]) {
      plateauExercises.push(name)
    }
  }

  if (plateauExercises.length >= 3) {
    return {
      type: 'plateau_cluster',
      priority: 2,
      severity: 'critical',
      icon: '🪨',
      message: `${plateauExercises.length} exercise mengalami plateau: ${plateauExercises.slice(0, 4).join(', ')}${plateauExercises.length > 4 ? '...' : ''}. Pertimbangkan variasi rep range atau deload.`,
      data: { exercises: plateauExercises }
    }
  }
  return null
}

/**
 * Check if a signal was dismissed (within 7 days)
 */
export function isDismissed(signalType) {
  try {
    const dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}')
    const ts = dismissed[signalType]
    if (!ts) return false
    const diff = Date.now() - ts
    return diff < 7 * 24 * 60 * 60 * 1000 // 7 days
  } catch { return false }
}

/**
 * Dismiss a signal for 7 days
 */
export function dismissSignal(signalType) {
  try {
    const dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}')
    dismissed[signalType] = Date.now()
    localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissed))
  } catch { /* ignore */ }
}

/**
 * Build fatigue signal text for AI prompt
 */
export function buildFatiguePromptText(signals) {
  if (!signals.length) return ''

  let text = '\n=== FATIGUE SIGNALS ===\n'

  for (const s of signals) {
    switch (s.type) {
      case 'volume_drop':
        text += `\nVolume Drop: ${s.data.dropPercent}% (minggu ini: ${s.data.thisWeek} kg, rata-rata: ${s.data.avgPrev} kg)`
        break
      case 'frequency_drop':
        text += `\nFrequency Drop: ${s.data.dropPercent}% (minggu ini: ${s.data.thisWeek}x, rata-rata: ${s.data.avgPrev}x/minggu)`
        break
      case 'long_rest':
        text += `\nLong Rest: ${s.data.days} hari sejak latihan terakhir`
        break
      case 'plateau_cluster':
        text += `\nPlateau:\n${s.data.exercises.map(e => `- ${e}`).join('\n')}`
        break
    }
  }

  return text
}
