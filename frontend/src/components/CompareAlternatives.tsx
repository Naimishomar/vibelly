import { Link } from 'react-router-dom';

export interface AlternativeLink {
  to: string;
  label: string;
  blurb: string;
}

export interface CompareAlternativesProps {
  title?: string;
  intro?: string;
  alternatives: AlternativeLink[];
}

export default function CompareAlternatives({
  title = 'More Vibelly alternatives to explore',
  intro = 'Pick the experience that fits what you are looking for — every page is free, anonymous, and works in your browser.',
  alternatives,
}: CompareAlternativesProps) {
  return (
    <section className="px-6 py-16 max-w-4xl mx-auto w-full">
      <h2
        className="text-2xl md:text-3xl font-semibold mb-3 text-white text-center"
        style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
      >
        {title}
      </h2>
      <p className="text-zinc-500 text-base text-center mb-10 max-w-2xl mx-auto">{intro}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {alternatives.map((alt) => (
          <Link
            key={alt.to}
            to={alt.to}
            className="group flex flex-col gap-2 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all"
          >
            <span className="font-semibold text-white group-hover:text-white transition-colors">
              {alt.label}
            </span>
            <span className="text-sm text-zinc-400 leading-relaxed">{alt.blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
