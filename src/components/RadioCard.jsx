import React from 'react'

export default function RadioCard({ label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border rounded-2xl p-4 transition-all ${
        selected ? 'border-ink bg-white shadow-soft' : 'border-slate/20 bg-white/70 hover:border-slate/40'
      }`}
    >
      <div className="font-semibold text-ink">{label}</div>
      <div className="text-sm text-slate mt-1">{description}</div>
    </button>
  )
}
