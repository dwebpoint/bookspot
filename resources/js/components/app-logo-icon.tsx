import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Calendar base */}
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            {/* Calendar header line */}
            <line x1="3" y1="9" x2="21" y2="9" />
            {/* Top pegs */}
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="16" y1="2" x2="16" y2="6" />
            {/* Checkmark to indicate booking */}
            <polyline points="9,14 11,16 15,12" />
        </svg>
    );
}
