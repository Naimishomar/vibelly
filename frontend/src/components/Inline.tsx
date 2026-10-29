import { Link } from 'react-router-dom';

// Inline markdown: **bold** and [text](url). Mirrored by `inline` in scripts/prerender.cjs.
export function Inline({ text }: { text: string }) {
  return <>{text.split(/(\*\*.*?\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((p, j) => {
    if (p.startsWith('**')) return <strong key={j} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
    const link = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      return link[2].startsWith('/')
        ? <Link key={j} to={link[2]} className="underline hover:text-white">{link[1]}</Link>
        : <a key={j} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{link[1]}</a>;
    }
    return p;
  })}</>;
}

// First row is the header. Mirrored by `tableHtml` in scripts/prerender.cjs.
export function Table({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr>{head.map((h) => <th key={h} scope="col" className="border-b border-white/20 p-2 text-white font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r) => (
            <tr key={r[0]}>{r.map((c, j) => <td key={j} className="border-b border-white/10 p-2 text-zinc-300 align-top"><Inline text={c} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
