export default function KillChainConnector({ color = '#22c55e', active = false }) {
  return (
    <div className="flex-shrink-0 w-12 self-center flex items-center justify-center relative" style={{ marginTop: '36px' }}>
      <div className="relative w-full h-0.5 overflow-hidden" style={{ backgroundColor: `${color}20` }}>
        {active && (
          <>
            <div
              className="absolute inset-y-0 w-8 -left-8"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                animation: 'flow-particle 1.4s linear infinite',
              }}
            />
            <div
              className="absolute inset-y-0 w-8 -left-8"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}aa, transparent)`,
                animation: 'flow-particle 1.4s linear infinite',
                animationDelay: '0.7s',
              }}
            />
          </>
        )}
      </div>
      <svg
        className="absolute -right-1 w-2 h-3"
        fill={color}
        viewBox="0 0 8 12"
        style={{ opacity: active ? 1 : 0.3 }}
      >
        <path d="M0 0L8 6L0 12Z" />
      </svg>
    </div>
  )
}
