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
            {/* Calendar body — rounder corners for a friendlier feel */}
            <rect x="3" y="4" width="18" height="18" rx="4" ry="4" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="16" y1="2" x2="16" y2="6" />
            {/* Heart: two semicircle arcs meeting at the V notch, tapering to a point */}
            <path d="M12 19 C12 19 7 16 7 13.5 A2.5 2.5 0 0 1 12 13.5 A2.5 2.5 0 0 1 17 13.5 C17 16 12 19 12 19 Z" />
        </svg>
    );
}
