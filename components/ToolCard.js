import Link from 'next/link';
import ToolIcon from './ToolIcon';

export default function ToolCard({ tool, compact = false }) {
  return (
    <Link href={tool.href} prefetch className={`tool-card${compact ? ' tool-card-compact' : ''}`}>
      <div className="tool-card-icon-wrap">
        <ToolIcon tool={tool} size={compact ? 'sm' : 'lg'} />
      </div>

      <div className="tool-card-content">
        <h3>{tool.title}</h3>
        {!compact ? <p>{tool.description}</p> : null}
      </div>
    </Link>
  );
}
