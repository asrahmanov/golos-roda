import { Reveal } from '@/components/ui/Motion';
import { cn } from '@/lib/utils';

export function SectionHead({
  eyebrow,
  title,
  lead,
  center = false,
  dark = false,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  center?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(center && 'mx-auto text-center', 'max-w-3xl', className)}>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className={cn('h-display mt-4 text-[clamp(2.2rem,5vw,4rem)] text-balance', dark ? 'text-cream-50' : 'text-ink-900')}>{title}</h2>
      </Reveal>
      {lead && (
        <Reveal delay={0.16}>
          <p className={cn('mt-5 text-lg leading-relaxed', dark ? 'text-cream-100/70' : 'text-ink-600')}>{lead}</p>
        </Reveal>
      )}
    </div>
  );
}
