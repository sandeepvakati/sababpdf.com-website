export function BrandLogoMark({ size = 64, className = '' }) {
  return (
    <img
      src="/sababpdf-sunpdf-logo.svg"
      alt="SababPDF logo"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export default function BrandLogo({ size = 64 }) {
  return (
    <>
      <BrandLogoMark size={size} className="brand-logo-image" />
      <span className="brand-text">
        Sabab<span className="accent-line">PDF</span>
      </span>
    </>
  );
}
