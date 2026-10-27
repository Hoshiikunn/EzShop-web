export function formatDateTime(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const normalized = typeof value === 'string' ? value.replace(/-/g, '/') : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '已过期';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const timePart = [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');

  return days > 0 ? `${days} 天 ${timePart}` : timePart;
}
