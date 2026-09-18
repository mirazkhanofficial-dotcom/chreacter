import type { ReactNode } from 'react';

interface AnatomicalSkeletonOverlayProps {
  scaleX: number;
  scaleY: number;
  className?: string;
}

function Bone({ children, strokeWidth = 7 }: { children: ReactNode; strokeWidth?: number }) {
  return (
    <g fill="none" stroke="#d9f9ff" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  );
}

export default function AnatomicalSkeletonOverlay({ scaleX, scaleY, className }: AnatomicalSkeletonOverlayProps) {
  return (
    <g className={className} transform={`scale(${scaleX} ${scaleY})`} opacity="0.95" pointerEvents="none">
      <g fill="#0e1014" stroke="#e6fbff" strokeWidth="5">
        <ellipse cx="190" cy="50" rx="32" ry="38" />
        <path d="M 166 67 Q 190 82 214 67 L 207 92 Q 190 101 173 92 Z" />
        <circle cx="178" cy="49" r="7" />
        <circle cx="202" cy="49" r="7" />
        <path d="M 190 52 L 185 64 L 195 64 Z" />
        <path d="M 178 74 Q 190 82 202 74" />
      </g>

      <Bone strokeWidth={8}>
        <line x1="184" y1="91" x2="182" y2="125" />
        <line x1="182" y1="125" x2="181" y2="340" />
        <line x1="106" y1="115" x2="275" y2="105" />
        <line x1="106" y1="115" x2="92" y2="220" />
        <line x1="92" y1="220" x2="82" y2="330" />
        <line x1="82" y1="330" x2="80" y2="385" />
        <line x1="275" y1="105" x2="292" y2="215" />
        <line x1="292" y1="215" x2="305" y2="325" />
        <line x1="305" y1="325" x2="310" y2="375" />
        <line x1="140" y1="350" x2="230" y2="340" />
        <line x1="140" y1="350" x2="135" y2="505" />
        <line x1="135" y1="505" x2="130" y2="675" />
        <line x1="130" y1="675" x2="158" y2="735" />
        <line x1="230" y1="340" x2="240" y2="495" />
        <line x1="240" y1="495" x2="245" y2="670" />
        <line x1="245" y1="670" x2="273" y2="725" />
      </Bone>

      <g fill="none" stroke="#d9f9ff" strokeWidth="5">
        <path d="M 151 135 Q 181 119 211 134" />
        <path d="M 145 151 Q 181 135 218 151" />
        <path d="M 143 168 Q 181 151 220 168" />
        <path d="M 142 185 Q 181 168 220 185" />
        <path d="M 143 202 Q 181 185 219 202" />
        <path d="M 148 219 Q 181 203 214 219" />
        <path d="M 153 236 Q 181 221 209 236" />
        <path d="M 158 253 Q 181 239 204 253" />
        <path d="M 163 270 Q 181 257 199 270" />
        <path d="M 163 135 Q 135 155 145 202 Q 151 230 176 245" />
        <path d="M 201 135 Q 228 155 218 202 Q 211 230 187 245" />
      </g>

      <g fill="#0e1014" stroke="#e6fbff" strokeWidth="4">
        <ellipse cx="181" cy="340" rx="45" ry="22" />
        <path d="M 151 345 Q 181 375 211 345" />
      </g>

      <g fill="#d9f9ff" stroke="#0e1014" strokeWidth="2">
        <circle cx="106" cy="115" r="9" />
        <circle cx="275" cy="105" r="9" />
        <circle cx="92" cy="220" r="8" />
        <circle cx="292" cy="215" r="8" />
        <circle cx="82" cy="330" r="7" />
        <circle cx="305" cy="325" r="7" />
        <circle cx="140" cy="350" r="9" />
        <circle cx="230" cy="340" r="9" />
        <circle cx="135" cy="505" r="9" />
        <circle cx="240" cy="495" r="9" />
        <circle cx="130" cy="675" r="8" />
        <circle cx="245" cy="670" r="8" />
      </g>

      <Bone strokeWidth={4}>
        <path d="M 80 385 l -8 10 m 8 -10 l 8 10 m 222 -10 l -8 10 m 8 -10 l 8 10" />
        <path d="M 158 735 l -18 13 m 18 -13 l 18 3 m 97 -3 l -18 16 m 18 -16 l 19 0" />
      </Bone>
    </g>
  );
}
