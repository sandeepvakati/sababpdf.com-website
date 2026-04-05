import Link from 'next/link';

export default function ToolCard({ tool, compact = false }) {
  const glyph = tool.glyph || tool.icon;
  const isSvgIcon = typeof tool.icon === 'string' && tool.icon.includes('<svg');
  const glyphClass = String(glyph).length > 1 ? 'tool-card-symbol tool-card-symbol-wide' : 'tool-card-symbol';

  return (
    <Link href={tool.href} prefetch className={`tool-card${compact ? ' tool-card-compact' : ''}`}>
      <div
        className="tool-card-stack"
        style={{
          '--tool-accent': tool.color,
          '--tool-soft': tool.bg,
        }}
      >
        <span className="tool-card-plate tool-card-plate-back" aria-hidden="true" />
        <span className="tool-card-plate tool-card-plate-front">
          {isSvgIcon ? (
            <span 
              className="tool-card-svg" 
              dangerouslySetInnerHTML={{ __html: tool.icon }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}
            />
          ) : (
            <span className={glyphClass}>{glyph}</span>
          )}
        </span>
      </div>

      <div className="tool-card-content">
        <h3>{tool.title}</h3>
        {!compact ? <p>{tool.description}</p> : null}
      </div>
    </Link>
  );
}
