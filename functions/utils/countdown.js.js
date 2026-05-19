// ============================================
// GJob.in – Enterprise‑Grade Countdown Service
// ============================================

/**
 * Parse a date string (YYYY-MM-DD or other formats) into a Date object at 23:59:59 IST.
 * Returns a valid Date or null.
 */
function parseDateSafe(dateStr) {
  if (!dateStr || dateStr === '0000-00-00') return null;
  // Try ISO format first
  const d = new Date(dateStr + 'T23:59:59+05:30');
  if (!isNaN(d.getTime())) return d;
  // Try DD-MM-YYYY or DD/MM/YYYY
  const parts = String(dateStr).match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (parts) {
    const [, dd, mm, yyyy] = parts;
    const iso = `${yyyy}-${mm}-${dd}T23:59:59+05:30`;
    const parsed = new Date(iso);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  // Fallback: try any date parsing
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Returns a comprehensive countdown object for a post.
 * The object indicates whether a countdown should be displayed, its properties,
 * and additional context like exam badges, status badges, and CTA buttons.
 *
 * @param {Object} post - The post row from database
 * @returns {Object} Countdown configuration object
 */
export function getCountdown(post) {
  const now = new Date();

  // Parse all relevant dates (with India timezone end-of-day)
  const lastDate = parseDateSafe(post.last_date);
  const correctionLastDate = parseDateSafe(post.correction_last_date);
  const examDate = parseDateSafe(post.exam_date);
  const resultDate = parseDateSafe(post.result_date);

  // Priority order: Last Date (future) -> Correction Window (if last passed) -> Correction Only -> Exam -> Result
  let target = null;
  let type = '';
  let title = '';
  let label = '';
  let showApplyBtn = false;
  let showAdmitCardBtn = false;
  let statusBadge = '';
  let isExpired = false;

  // 1. Last Date is in the future
  if (lastDate && lastDate > now) {
    target = lastDate;
    type = 'last_date';
    title = 'Application Last Date';
    label = 'Complete your application before the deadline!';
    showApplyBtn = true;
    statusBadge = '🟢 Applications Open';
  }
  // 2. Last Date passed but Correction Date is still open
  else if (lastDate && lastDate <= now && correctionLastDate && correctionLastDate > now) {
    target = correctionLastDate;
    type = 'correction_window';
    title = 'Correction Window Open';
    label = 'Application deadline passed. Only corrections allowed now.';
    showApplyBtn = true;
    statusBadge = '🟠 Correction Active';
  }
  // 3. No Last Date, but Correction Date is available and future
  else if ((!lastDate || lastDate <= now) && correctionLastDate && correctionLastDate > now) {
    target = correctionLastDate;
    type = 'correction_only';
    title = 'Form Correction Last Date';
    label = 'Make necessary corrections before the deadline!';
    showApplyBtn = true;
    statusBadge = '🟠 Correction Window';
  }
  // 4. Exam Date future (only if no other countdown active)
  else if (examDate && examDate > now) {
    target = examDate;
    type = 'exam_date';
    title = 'Exam Date';
    label = 'Prepare well for your exam.';
    statusBadge = '🔵 Exam Scheduled';
    // Show admit card button if exam is within 30 days
    showAdmitCardBtn = true;
  }
  // 5. Result Date future (lowest priority)
  else if (resultDate && resultDate > now) {
    target = resultDate;
    type = 'result_date';
    title = 'Result Declaration Date';
    label = 'Stay tuned for the result announcement.';
    statusBadge = '🟣 Result Awaited';
  }

  // Check if the application process is completely expired
  if (!target && ((lastDate && lastDate <= now) || (correctionLastDate && correctionLastDate <= now))) {
    isExpired = true;
    statusBadge = '⚫ Applications Closed';
  }

  // If no target date and not expired, there is no countdown
  if (!target && !isExpired) {
    return {
      active: false,
      expired: false,
      title: '',
      label: '',
      date: '',
      days: 0,
      color: { bg: '', box: '' },
      urgencyMsg: '',
      animation: '',
      icon: '',
      statusBadge: '',
      showApplyBtn: false,
      showAdmitCardBtn: false,
      examBadge: null,
      resultBadge: null
    };
  }

  // Calculate days remaining
  const diffMs = target ? target - now : 0;
  const daysRemaining = target ? Math.ceil(diffMs / 86400000) : 0;

  // Color scheme based on urgency
  let colorBg, colorBox, urgencyMsg, animation, icon;
  if (daysRemaining > 30) {
    colorBg = 'linear-gradient(135deg, #2e7d32, #43a047)';
    colorBox = '#1b5e20';
    urgencyMsg = `${daysRemaining} days remaining – Apply at your convenience`;
    animation = '';
    icon = type === 'exam_date' ? '📚' : (type === 'result_date' ? '📊' : '📅');
  } else if (daysRemaining >= 8) {
    colorBg = 'linear-gradient(135deg, #1565c0, #1976d2)';
    colorBox = '#0d47a1';
    urgencyMsg = `${daysRemaining} days left – Good time to submit`;
    animation = '';
    icon = type === 'exam_date' ? '📖' : (type === 'result_date' ? '📈' : '📋');
  } else if (daysRemaining >= 3) {
    colorBg = 'linear-gradient(135deg, #e65100, #f57c00)';
    colorBox = '#bf360c';
    urgencyMsg = `Only ${daysRemaining} days left – Apply immediately!`;
    animation = 'animation: gentlePulse 2s ease-in-out infinite;';
    icon = type === 'exam_date' ? '⏳' : (type === 'result_date' ? '📉' : '⚠️');
  } else if (daysRemaining >= 1) {
    colorBg = 'linear-gradient(135deg, #c62828, #e53935)';
    colorBox = '#b71c1c';
    urgencyMsg = `Last ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining – Don't miss out!`;
    animation = 'animation: urgentPulse 1s ease-in-out infinite;';
    icon = type === 'exam_date' ? '📝' : (type === 'result_date' ? '🎯' : '🚨');
  } else {
    colorBg = 'linear-gradient(135deg, #880e4f, #c51162)';
    colorBox = '#4a0024';
    urgencyMsg = type === 'exam_date' ? 'EXAM TOMORROW! Best of luck!' :
                 (type === 'result_date' ? 'RESULT TOMORROW!' : 'TODAY IS THE LAST DAY!');
    animation = 'animation: urgentPulse 0.8s ease-in-out infinite;';
    icon = type === 'exam_date' ? '💪' : (type === 'result_date' ? '🏆' : '🔥');
  }

  // Exam badge (if exam date is upcoming but a different countdown is active)
  const examBadge = examDate && examDate > now && type !== 'exam_date' ? {
    active: true,
    days: Math.ceil((examDate - now) / 86400000),
    date: examDate.toISOString(),
    formattedDate: examDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } : null;

  // Result badge (if result date is upcoming but not the primary countdown)
  const resultBadge = resultDate && resultDate > now && type !== 'result_date' ? {
    active: true,
    days: Math.ceil((resultDate - now) / 86400000),
    date: resultDate.toISOString(),
    formattedDate: resultDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } : null;

  return {
    active: true,
    expired: false,
    type,
    title,
    label,
    date: target ? target.toISOString() : '',
    days: daysRemaining,
    color: { bg: colorBg, box: colorBox },
    urgencyMsg,
    animation,
    icon,
    statusBadge,
    showApplyBtn,
    showAdmitCardBtn,
    examBadge,
    resultBadge,
    isExpired: false
  };
}

/**
 * For backward compatibility or when you only need the older format,
 * this function returns the legacy countdown object.
 */
export function getCountdownLegacy(post) {
  const data = getCountdown(post);
  if (!data.active) return null;
  return {
    target: new Date(data.date),
    title: data.title,
    label: data.label,
    days: data.days,
    color: data.color.bg,
    showApply: data.showApplyBtn
  };
}