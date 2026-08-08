export interface SeoArticleBlock {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface SeoArticleProps {
  intro?: string;
  blocks: SeoArticleBlock[];
}

export default function SeoArticle({ intro, blocks }: SeoArticleProps) {
  return (
    <article className="px-6 py-16 max-w-3xl mx-auto w-full text-left">
      {intro && (
        <p className="text-zinc-400 text-base leading-relaxed mb-10">{intro}</p>
      )}

      <div className="space-y-12">
        {blocks.map((block, index) => (
          <section key={index}>
            <h2
              className="text-2xl md:text-3xl font-semibold mb-5 text-white leading-tight"
              style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              {block.heading}
            </h2>
            {block.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-zinc-400 text-base leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
            {block.bullets && block.bullets.length > 0 && (
              <ul className="space-y-3 mt-6">
                {block.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300 text-base leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
