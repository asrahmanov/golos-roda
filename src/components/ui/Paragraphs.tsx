export function Paragraphs({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={className}>
      {parts.map((p, i) =>
        p.startsWith('## ') ? (
          <h2 key={i} className="mb-4 mt-10 font-serif text-2xl font-semibold">{p.slice(3)}</h2>
        ) : (
          <p key={i} className="mb-5 whitespace-pre-line leading-relaxed">{p}</p>
        ),
      )}
    </div>
  );
}
