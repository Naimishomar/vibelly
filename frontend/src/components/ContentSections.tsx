// Renders the shared page copy in src/content/pages.json (also prerendered by scripts/prerender.cjs).
interface Section {
  h2: string;
  paragraphs?: string[];
  bullets?: string[];
}

const serif = { fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' };

export default function ContentSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.h2}>
          <h2 className="text-3xl font-normal text-white mt-10 mb-4" style={serif}>{section.h2}</h2>
          {section.paragraphs?.map((p) => <p key={p} className="mb-4">{p}</p>)}
          {section.bullets && (
            <ul className="list-disc pl-6 space-y-2">
              {section.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
