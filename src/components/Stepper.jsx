import React from 'react'

const stepsDefault = [
  { id: 1, title: 'Upload' },
  { id: 2, title: 'Requirement' },
  { id: 3, title: 'Editor & Download' }
]

const stepsKb = [
  { id: 1, title: 'Upload' },
  { id: 2, title: 'Requirement' }
]

export default function Stepper({ current, mode }) {
  const steps = mode === 'kb' || mode === 'pdf' ? stepsKb : stepsDefault
  return (
    <div className="flex gap-4 items-center">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step.id === current ? 'step-badge' : 'bg-white border border-slate/20 text-slate'
            }`}
          >
            {step.id}
          </div>
          <div className="text-sm font-semibold text-ink">{step.title}</div>
          {idx < steps.length - 1 && <div className="w-8 h-px bg-slate/30" />}
        </div>
      ))}
    </div>
  )
}
