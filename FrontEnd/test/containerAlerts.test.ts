import { describe, expect, it } from 'vitest';
import { buildContainerAlerts } from '../src/features/dashboard/containerAlerts';
import { translate } from '../src/shared/i18n/catalog';
import { en } from '../src/shared/i18n/locales/en';
import { ar } from '../src/shared/i18n/locales/ar';
import type { ContainersSummary } from '../src/shared/hooks/useStats';

const tEn = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
  translate('en', key, params);
const tAr = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
  translate('ar', key, params);

const base: ContainersSummary = {
  total: 6,
  healthy: 3,
  attention: 1,
  critical: 1,
  unknown: 1,
  online: 4,
  offline: 1,
  neverConnected: 1,
  unassigned: 0,
  orphaned: 0,
  onlinePct: 66.7,
  averageFill: 49,
};

describe('buildContainerAlerts', () => {
  it('returns no alerts when every container is accounted for', () => {
    expect(buildContainerAlerts(tEn, base)).toEqual([]);
  });

  it('reports unassigned containers', () => {
    const alerts = buildContainerAlerts(tEn, { ...base, unassigned: 6 });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('6');
    expect(alerts[0]).toMatch(/not assigned to any station/i);
  });

  it('reports orphaned containers', () => {
    const alerts = buildContainerAlerts(tEn, { ...base, orphaned: 2 });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('2');
    expect(alerts[0]).toMatch(/no longer exists/i);
  });

  it('reports both cases at once', () => {
    const alerts = buildContainerAlerts(tEn, { ...base, unassigned: 4, orphaned: 1 });
    expect(alerts).toHaveLength(2);
    expect(alerts.join(' ')).toContain('4');
    expect(alerts.join(' ')).toContain('1');
  });

  it('has localized English and Arabic strings (not raw keys)', () => {
    const english = buildContainerAlerts(tEn, { ...base, unassigned: 3, orphaned: 1 });
    const arabic = buildContainerAlerts(tAr, { ...base, unassigned: 3, orphaned: 1 });

    expect(english[0]).not.toBe('metric.alert.unassigned');
    expect(arabic[0]).not.toBe('metric.alert.unassigned');
    expect(arabic[0]).not.toBe(english[0]);
    // The interpolated count is rendered with Latin digits in both locales.
    expect(arabic[0]).toContain('3');
    expect(arabic[1]).toContain('1');
  });

  it('defines the alert keys in both catalogs', () => {
    for (const key of ['metric.alert.unassigned', 'metric.alert.orphaned'] as const) {
      expect(en.strings[key]).toBeTruthy();
      expect(ar.strings[key]).toBeTruthy();
      expect(en.strings[key]).toContain('{count}');
      expect(ar.strings[key]).toContain('{count}');
    }
  });
});
