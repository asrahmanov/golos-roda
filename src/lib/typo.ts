const SHORT = 'а|в|и|к|о|с|у|я|во|до|за|из|ко|на|не|ни|но|об|от|по|со|мы|вы|он|её|их|для|без|под|над|при|про|или|как|что|чем|это|она|они';
const BIND_NEXT = new RegExp(`(?<=^|[\\s(«„"'>—–-])(${SHORT}) (?=\\S)`, 'giu');

/** Неразрывные пробелы после коротких предлогов и союзов и перед тире — чтобы они не висели в конце строки. */
export function typo(text: string): string;
export function typo(text: string | null | undefined): string | null | undefined;
export function typo(text: string | null | undefined) {
  if (!text) return text;
  return text.replace(BIND_NEXT, '$1\u00A0').replace(/ ([—–])/g, '\u00A0$1');
}
