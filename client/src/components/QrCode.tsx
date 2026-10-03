import { create } from 'qrcode';
import { useMemo } from 'react';

/** Blank modules around the code, so a camera can find its edges. */
const QUIET_ZONE = 2;

interface Props {
  /** The text to encode. */
  value: string;
  /** Spoken description: the picture itself carries no readable text. */
  label: string;
  className?: string;
}

/** A QR code drawn as one SVG path in the current text color, on a white background. */
export default function QrCode({ value, label, className }: Props) {
  const { size, path } = useMemo(() => {
    const { modules } = create(value, { errorCorrectionLevel: 'M' });
    let d = '';
    for (let row = 0; row < modules.size; row += 1) {
      for (let col = 0; col < modules.size; col += 1) {
        if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { size: modules.size, path: d };
  }, [value]);

  const extent = size + QUIET_ZONE * 2;

  return (
    <svg
      viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${extent} ${extent}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className={className}
    >
      <rect x={-QUIET_ZONE} y={-QUIET_ZONE} width={extent} height={extent} fill="#fff" />
      <path d={path} fill="currentColor" />
    </svg>
  );
}
