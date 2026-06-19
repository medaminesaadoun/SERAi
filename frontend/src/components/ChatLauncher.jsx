import { createPortal } from 'react-dom'

export default function ChatLauncher({ onClick, unreadCount = 0, hidden = false }) {
  if (hidden) return null

  return createPortal(
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full
                 bg-accent text-bg shadow-2xl hover:scale-110 active:scale-95
                 transition-transform flex items-center justify-center group
                 ring-4 ring-accent/20 hover:ring-accent/40"
      style={{ boxShadow: '0 8px 32px rgb(var(--color-accent) / 0.4)' }}
      aria-label="Open AI chat"
      title="Ask AI about this analysis"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full
                         bg-red-500 text-white text-[10px] font-mono font-bold
                         flex items-center justify-center border-2 border-bg">
          {unreadCount}
        </span>
      )}
      <span className="absolute left-full ml-3 px-2.5 py-1 bg-bg border border-border
                       rounded-sm font-mono text-[10px] uppercase tracking-widest text-neutral-400
                       opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                       pointer-events-none">
        Ask AI
      </span>
    </button>,
    document.body
  )
}
