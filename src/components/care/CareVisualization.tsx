export function CareVisualization() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <svg
        viewBox="0 0 420 360"
        className="h-auto w-full"
        role="img"
        aria-label="A connected care map: an appointment tomorrow at 10:30, a renewed prescription, and a care team update."
      >
        <line x1="210" y1="92" x2="210" y2="150" stroke="currentColor" strokeOpacity="0.25" />
        <line x1="210" y1="150" x2="96" y2="210" stroke="currentColor" strokeOpacity="0.25" />
        <line x1="210" y1="150" x2="324" y2="210" stroke="currentColor" strokeOpacity="0.25" />
        <circle cx="210" cy="150" r="3.5" fill="#D46B4C" />

        <rect x="132" y="18" width="156" height="74" fill="var(--lh-surface)" stroke="var(--lh-line)" />
        <text x="148" y="42" fill="var(--lh-muted)" fontSize="10" letterSpacing="1.8">
          APPOINTMENT
        </text>
        <text x="148" y="62" fill="var(--lh-ink)" fontSize="16" fontFamily="Manrope">
          Tomorrow
        </text>
        <text x="148" y="80" fill="var(--lh-ink)" fontSize="16" fontFamily="Manrope">
          10:30
        </text>

        <rect x="24" y="210" width="148" height="72" fill="var(--lh-surface)" stroke="var(--lh-line)" />
        <text x="40" y="236" fill="var(--lh-muted)" fontSize="10" letterSpacing="1.8">
          PRESCRIPTION
        </text>
        <text x="40" y="258" fill="var(--lh-ink)" fontSize="15">
          Renewed
        </text>

        <rect x="248" y="210" width="148" height="72" fill="var(--lh-surface)" stroke="var(--lh-line)" />
        <text x="264" y="236" fill="var(--lh-muted)" fontSize="10" letterSpacing="1.8">
          CARE TEAM
        </text>
        <text x="264" y="258" fill="var(--lh-ink)" fontSize="15">
          Update
        </text>
      </svg>
    </div>
  )
}
