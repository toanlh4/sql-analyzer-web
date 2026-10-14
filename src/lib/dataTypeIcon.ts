import { Braces, Calendar, CaseSensitive, Clock, Hash, HelpCircle, List, ToggleLeft, type LucideIcon } from 'lucide-react';

/** Map a warehouse data type (VARCHAR, BIGINT, TIMESTAMP, ...) to an icon. */
export function dataTypeIcon(dataType: string | null | undefined): LucideIcon {
  const t = (dataType ?? '').toLowerCase();
  if (!t || t === 'unknown') return HelpCircle;
  if (/bool/.test(t)) return ToggleLeft;
  if (/timestamp|datetime|^time/.test(t)) return Clock;
  if (/date/.test(t)) return Calendar;
  if (/int|numeric|decimal|number|float|double|real|money|serial/.test(t)) return Hash;
  if (/array|list|\[\]/.test(t)) return List;
  if (/json|struct|map|variant|object|record|super/.test(t)) return Braces;
  return CaseSensitive;
}
