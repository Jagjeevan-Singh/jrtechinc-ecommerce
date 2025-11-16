import { useEffect, useRef, useState } from "react";
import "./CircularText.css";

const CircularText = ({ text, spinDuration = 20, onHover = "speedUp", className = "" }) => {
  // Normalize spaces: collapse runs of whitespace to a single normal space,
  // ensure there is a star at both ends (so the ring shows a separator on both ends),
  // then replace regular space with a thin space so words remain separated but
  // don't create a large empty gap on the circle.
  // Collapse whitespace and trim.
  let normalized = (text || "").replace(/\s+/g, ' ').trim();
  // Remove any existing star characters at the ends to avoid duplicates (handles '*' and '★'),
  // then add a single decorative star at each end.
  normalized = normalized.replace(/^[*★\s]+|[*★\s]+$/g, '');
  normalized = `★ ${normalized} ★`;
  // Replace regular spaces with a thin space (U+2009) to reduce large gaps
  const letters = Array.from(normalized).map((ch) => (ch === ' ' ? '\u2009' : ch));
  // spacing multiplier (1.0 = natural evenly distributed). Keep tight by default.
  const spacingMultiplier = 1.0;
  const containerRef = useRef(null);
  const [radius, setRadius] = useState(0);

  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
  const size = el.offsetWidth || el.clientWidth || 64;
  // radius: slightly smaller than before so letters sit closer to the logo
  // reduce the gap from +8 to +2 to make the ring tighter
  setRadius(Math.max(12, Math.round(size / 2) + 2));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div ref={containerRef} className={`circular-text ${className}`}>
      <div className="circular-rotator" style={{ animationDuration: `${spinDuration}s` }}>
        {letters.map((letter, i) => {
          const baseAngle = (360 / Math.max(1, letters.length)) * i;
          const rotationDeg = baseAngle * spacingMultiplier;
          const isStar = letters[i] === '★' || letters[i] === '*';
          // push stars slightly outward so they sit between the phrases
          const starOffset = isStar ? radius + 8 : radius;
          const transform = `rotate(${rotationDeg}deg) translateY(-${starOffset}px)`;
          return (
            <span key={i} className={isStar ? 'star' : ''} style={{ transform, WebkitTransform: transform }}>
              {letters[i]}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default CircularText;
export { CircularText };
