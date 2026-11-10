import { BrandIcon, type BrandIconName } from './BrandIcon';

const MAP: Record<string, BrandIconName> = {
  sparkles: 'spark',
  mic: 'mic',
  camera: 'camera',
  gem: 'relic',
  mail: 'letter',
  book: 'book',
  map: 'pin',
  utensils: 'pot',
  music: 'gramophone',
  heart: 'hearts',
};

export function TaskIcon({ name, className, accent, draw }: { name: string; className?: string; accent?: string; draw?: boolean }) {
  return <BrandIcon name={MAP[name] ?? 'spark'} className={className} accent={accent} draw={draw} />;
}
