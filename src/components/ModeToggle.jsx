import React from 'react'

export default function ModeToggle({ mode, onChange }) {
    return (
        <div className="flex gap-2 bg-white/80 p-2 rounded-full border border-slate/20">
            <button
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${mode === 'pan' ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                    }`}
                onClick={() => onChange('pan')}
            >
                PAN Card Editor
            </button>
            <button
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${mode === 'pdf' ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                    }`}
                onClick={() => onChange('pdf')}
            >
                PAN PDF Editor
            </button>
            <button
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${mode === 'kb' ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                    }`}
                onClick={() => onChange('kb')}
            >
                KB Editor
            </button>
        </div>
    )
}
