export default function ToolIcon({ tool, size = 'md', framed = true, className = '' }) {
  const sizes = {
    xs: { frame: 40, icon: 20, glyph: 17, radius: 12 },
    sm: { frame: 48, icon: 24, glyph: 20, radius: 14 },
    md: { frame: 56, icon: 28, glyph: 22, radius: 16 },
    lg: { frame: 64, icon: 32, glyph: 25, radius: 18 },
    hero: { frame: 84, icon: 44, glyph: 34, radius: 24 },
  };

  const config = sizes[size] || sizes.md;
  const glyph = tool.glyph || tool.icon;
  const isSvgIcon = typeof tool.icon === 'string' && tool.icon.includes('<svg');
  const glyphText = typeof glyph === 'string' ? glyph : String(glyph);

  return (
    <span
      className={`tool-icon${framed ? ' tool-icon-framed' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--tool-icon-frame-size': `${config.frame}px`,
        '--tool-icon-symbol-size': `${config.icon}px`,
        '--tool-icon-glyph-size': `${config.glyph}px`,
        '--tool-icon-radius': `${config.radius}px`,
        '--tool-icon-color': tool.color,
      }}
      aria-hidden="true"
    >
      {isSvgIcon ? (
        <span className="tool-icon-svg" dangerouslySetInnerHTML={{ __html: tool.icon }} />
      ) : (
        <span className={`tool-icon-glyph${glyphText.length > 2 ? ' tool-icon-glyph-wide' : ''}`}>{glyphText}</span>
      )}
    </span>
  );
}
