/**
 * Side-effecting half of the report export: fetch the authenticated data, build
 * the Excel workbook with the pure builder, and hand the browser a real .xlsx
 * download.
 *
 * The data is read from the same endpoints the dashboard already renders, so the
 * export needs no backend route and no new permissions. A failure at any step
 * throws before a success message can be shown.
 */
import type { Workbook } from 'exceljs';
import { ApiError, apiRequest } from '../../services/apiClient';
import {
  fetchDailyPoints,
  fetchFillHistory,
} from '../../services/historyApi';
import { fetchStations } from '../../services/stationsApi';
import { isStats } from '../../shared/hooks/useStats';
import {
  REPORT_FILL_PERIOD,
  REPORT_POINTS_PERIOD,
  buildCampusReportWorkbook,
} from './exportReport';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** `campus-report-2026-10-20_0930.xlsx` — sorted and copy-safe. */
export function reportFilename(generatedAt: Date): string {
  const iso = generatedAt.toISOString();
  const day = iso.slice(0, 10);
  const time = iso.slice(11, 16).replace(':', '');
  return `campus-report-${day}_${time}.xlsx`;
}

/** Start a client-side download for a binary file. */
function downloadBinaryFile(contents: ArrayBuffer, filename: string, mime: string): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('This environment cannot save files.');
  }

  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Safari needs the URL to survive the synchronous click; release it after.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Fetch the live dashboard data and trigger a .xlsx download.
 *
 * @returns the downloaded file name, for the caller's confirmation message.
 * @throws when any request fails, the payload is malformed, or the browser
 *         cannot create a download — in every case no file was produced.
 */
export async function exportCampusReport(): Promise<{ filename: string }> {
  const [statsBody, stations, fillHistory, pointsDaily] = await Promise.all([
    apiRequest('/stats'),
    fetchStations(),
    fetchFillHistory(REPORT_FILL_PERIOD),
    fetchDailyPoints(REPORT_POINTS_PERIOD),
  ]);

  if (!isStats(statsBody)) {
    throw new ApiError(0, 'The stats response did not match the expected shape.');
  }

  const generatedAt = new Date();
  const workbook: Workbook = await buildCampusReportWorkbook({
    generatedAt,
    stats: statsBody,
    stations,
    fillHistory,
    pointsDaily,
  });
  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  const filename = reportFilename(generatedAt);

  downloadBinaryFile(buffer, filename, XLSX_MIME);

  return { filename };
}
