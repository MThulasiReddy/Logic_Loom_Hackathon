/**
 * Date and Time utilities for Indian Standard Time (IST = UTC+05:30)
 */

export const formatIST = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  try {
    let dateInput = dateStr;
    // If input is an ISO string without timezone offset or Z, explicitly mark as IST (+05:30)
    if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
      dateInput = `${dateStr}+05:30`;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateStr);

    return (
      d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: options.showSeconds ? '2-digit' : undefined,
        hour12: true,
        ...options,
      }) + (options.hideSuffix ? '' : ' IST')
    );
  } catch (e) {
    return String(dateStr);
  }
};

export const formatISTTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    let dateInput = dateStr;
    if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
      dateInput = `${dateStr}+05:30`;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateStr);

    return (
      d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST'
    );
  } catch (e) {
    return String(dateStr);
  }
};

export const formatISTShort = (dateStr) => {
  if (!dateStr) return '—';
  try {
    let dateInput = dateStr;
    if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
      dateInput = `${dateStr}+05:30`;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return String(dateStr);
  }
};

