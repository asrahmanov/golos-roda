import { BookOpen, Camera, Gem, Heart, Mail, MapPin, Mic, Music, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  mic: Mic,
  camera: Camera,
  gem: Gem,
  mail: Mail,
  book: BookOpen,
  map: MapPin,
  utensils: UtensilsCrossed,
  music: Music,
  heart: Heart,
};

export function TaskIcon({ name, className }: { name: string; className?: string }) {
  const I = MAP[name] ?? Sparkles;
  return <I className={className} />;
}
