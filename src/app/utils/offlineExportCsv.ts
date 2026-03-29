import type { DayLog } from '../context/CycleContext';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsvExport(logs: Record<string, DayLog>): string {
  const headers = [
    'Date',
    'Period Day',
    'Flow',
    'Moods',
    'Symptoms',
    'Sleep Quality',
    'Energy Level',
    'Water Glasses',
    'Cervical Mucus',
    'Intimacy',
    'Protection Used',
    'Intimacy Notes',
    'Notes',
  ];

  const sortedKeys = Object.keys(logs).sort();

  const rows = sortedKeys.map((dateKey) => {
    const log = logs[dateKey];
    return [
      escapeCsv(dateKey),
      escapeCsv(log.isPeriod ? 'Yes' : 'No'),
      escapeCsv(log.flow ?? ''),
      escapeCsv(log.moods.join('; ')),
      escapeCsv(log.symptoms.join('; ')),
      escapeCsv(log.sleepQuality ?? ''),
      escapeCsv(log.energyLevel ?? ''),
      escapeCsv(log.waterGlasses ?? 0),
      escapeCsv(log.cervicalMucus ?? ''),
      escapeCsv(log.hadIntimacy ? 'Yes' : 'No'),
      escapeCsv(log.protectionUsed ?? ''),
      escapeCsv(log.intimacyNotes ?? ''),
      escapeCsv(log.notes),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsvFile(csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `menstracker-health-report-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
