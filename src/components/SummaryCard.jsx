import React from 'react'

export default function SummaryCard({ mode, requirements, targetPx, kbSizeBytes, kbSizeLoading, kbSizeError }) {
  const kbSizeText = kbSizeBytes?.bytes != null ? (kbSizeBytes.bytes / 1024).toFixed(1) : null
  const kbExact = kbSizeBytes?.exact === true
  return (
    <div className="card-surface rounded-2xl p-6 requirement-screen">
      <h3 className="text-xl font-semibold font-display">Summary</h3>

      <section className="req-section mt-6">
        <div className="req-section-title">Selection</div>
        <div className="space-y-2 text-sm text-ink">
          {mode === 'pan' && (
            <div className="flex justify-between">
              <span className="text-slate">Application</span>
              <span className="font-semibold">{requirements.application}</span>
            </div>
          )}
          {mode === 'pan' && (
            <div className="flex justify-between">
              <span className="text-slate">Type</span>
              <span className="font-semibold">{requirements.type}</span>
            </div>
          )}
          {mode === 'pan' && (
            <div className="flex justify-between">
              <span className="text-slate">Resize Mode</span>
              <span className="font-semibold">{requirements.resizeMode}</span>
            </div>
          )}
          {mode === 'pan' && (
            <div className="flex justify-between">
              <span className="text-slate">Target Pixels</span>
              <span className="font-semibold">{targetPx}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate">Max Size</span>
            <span className="font-semibold">{requirements.maxKb} KB</span>
          </div>
          {mode === 'kb' && (
            <div className="flex justify-between">
              <span className="text-slate">Backend Output</span>
              <span className="font-semibold">
                {kbSizeLoading && 'Calculating...'}
                {!kbSizeLoading && kbSizeText && `${kbSizeText} KB${kbExact ? '' : ' (best effort)'}`}
                {!kbSizeLoading && !kbSizeText && !kbSizeError && '--'}
                {kbSizeError && 'Error'}
              </span>
            </div>
          )}
          {mode === 'pan' && (
            <div className="flex justify-between">
              <span className="text-slate">Format</span>
              <span className="font-semibold">{requirements.type === 'Document' ? 'PDF' : 'JPG'}</span>
            </div>
          )}
          {mode === 'pan' && (
            <div className="flex justify-between">
              <span className="text-slate">DPI</span>
              <span className="font-semibold">200</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
