/**
 * Animated mesh-gradient background.
 * Three soft blurred orbs drift slowly behind all page content.
 * Entirely decorative — pointer-events disabled, z-index -10.
 */
export function AmbientBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
            {/* Orb 1 — indigo, top-left */}
            <div
                className="absolute -left-48 -top-48 h-[680px] w-[680px] rounded-full opacity-[0.28] blur-[120px] dark:opacity-[0.14]"
                style={{
                    background: 'oklch(0.60 0.22 255)',
                    animation: 'blob-drift-1 30s infinite ease-in-out',
                }}
            />

            {/* Orb 2 — teal, bottom-right */}
            <div
                className="absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full opacity-[0.22] blur-[100px] dark:opacity-[0.12]"
                style={{
                    background: 'oklch(0.68 0.18 195)',
                    animation: 'blob-drift-2 38s infinite ease-in-out',
                    animationDelay: '-12s',
                }}
            />

            {/* Orb 3 — violet, centre-right */}
            <div
                className="absolute right-[10%] top-[35%] h-[420px] w-[420px] rounded-full opacity-[0.16] blur-[90px] dark:opacity-[0.09]"
                style={{
                    background: 'oklch(0.62 0.21 300)',
                    animation: 'blob-drift-3 24s infinite ease-in-out',
                    animationDelay: '-8s',
                }}
            />
        </div>
    );
}
