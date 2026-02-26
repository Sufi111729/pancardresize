import React from 'react'

const appOptions = [
    {
        key: 'UTI',
        label: 'UTI',
        logo: '/assets/utiitsl.png'
    },
    {
        key: 'NSDL',
        label: 'NSDL',
        logo: '/assets/nsdl.png'
    }
]

const typeOptions = [
    { key: 'Photograph', label: 'Photograph', logo: '/assets/type-photograph.svg' },
    { key: 'Signature', label: 'Signature', logo: '/assets/type-signature.svg' },
    { key: 'Document', label: 'Document', logo: '/assets/type-document.svg' }
]

function getSafePhotoMaxKb(current, application) {
    if (application === 'NSDL') return 50
    return current === 30 || current === 50 ? current : 50
}

export default function RequirementStep({ mode, requirements, setRequirements, onNext, onBack, downloadLoading, downloadError, kbSizeBytes, kbSizeLoading, kbSizeError }) {
    const update = (changes) => setRequirements((prev) => ({ ...prev, ...changes }))
    const kbSizeText = kbSizeBytes?.bytes != null ? (kbSizeBytes.bytes / 1024).toFixed(1) : null
    const kbExact = kbSizeBytes?.exact === true

    return (
        <div className="card-surface rounded-2xl p-6 requirement-screen">
            <h2 className="text-xl font-semibold font-display">Requirements</h2>

            {mode === 'kb' && (
                <section className="req-section mt-6">
                    <div className="req-section-title">KB Editor</div>
                    <div className="req-card min-h-[120px] items-start">
                        <label className="text-sm text-slate w-full">Target Image Size (KB)</label>
                        <div className="w-full mt-3 flex items-center gap-3">
                            <input
                                type="range"
                                min="10"
                                max="500"
                                step="1"
                                value={requirements.maxKb}
                                onChange={(e) => update({ maxKb: Number(e.target.value), type: 'Photograph' })}
                                className="w-full"
                            />
                            <input
                                type="number"
                                min="10"
                                max="500"
                                value={requirements.maxKb}
                                onChange={(e) => {
                                    const value = Number(e.target.value || 0)
                                    update({ maxKb: Math.max(10, Math.min(500, value)), type: 'Photograph' })
                                }}
                                className="w-24 px-2 py-1 rounded border border-slate/25 bg-white"
                            />
                            <span className="text-sm text-slate">KB</span>
                        </div>
                        <div className="mt-3 text-sm text-slate">
                            {kbSizeLoading && 'Calculating output size...'}
                            {!kbSizeLoading && kbSizeText && `Backend output: ${kbSizeText} KB${kbExact ? '' : ' (best effort)'}`}
                            {!kbSizeLoading && !kbSizeText && !kbSizeError && 'Backend output: --'}
                        </div>
                        {kbSizeError && <div className="text-sm text-ember mt-2">{kbSizeError}</div>}
                    </div>
                </section>
            )}

            {mode === 'pdf' && (
                <section className="req-section mt-6">
                    <div className="req-section-title">PDF Editor</div>
                    <div className="req-card min-h-[120px] items-start">
                        <label className="text-sm text-slate w-full">Target PDF Size (KB)</label>
                        <div className="w-full mt-3 flex items-center gap-3">
                            <input
                                type="range"
                                min="50"
                                max="2048"
                                step="1"
                                value={requirements.maxKb}
                                onChange={(e) => update({ maxKb: Number(e.target.value), type: 'Document' })}
                                className="w-full"
                            />
                            <input
                                type="number"
                                min="50"
                                max="2048"
                                value={requirements.maxKb}
                                onChange={(e) => {
                                    const value = Number(e.target.value || 0)
                                    update({ maxKb: Math.max(50, Math.min(2048, value)), type: 'Document' })
                                }}
                                className="w-24 px-2 py-1 rounded border border-slate/25 bg-white"
                            />
                            <span className="text-sm text-slate">KB</span>
                        </div>
                    </div>
                </section>
            )}

            {mode === 'pan' && (
            <section className="req-section mt-6">
                <div className="req-section-title">Application Website</div>
                <div className="req-grid req-grid-2">
                    {appOptions.map((item) => {
                        const selected = requirements.application === item.key
                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={`req-card ${selected ? 'req-card-active' : ''}`}
                                onClick={() => update({ application: item.key, maxKb: item.key === 'NSDL' ? 50 : requirements.maxKb })}
                            >
                                <span className="req-badge">{item.label}</span>
                                <img src={item.logo} alt={item.label} className="req-logo" />
                                <span className={`req-radio ${selected ? 'req-radio-on' : ''}`} />
                            </button>
                        )
                    })}
                </div>
            </section>
            )}

            {mode === 'pan' && (
            <section className="req-section mt-6">
                <div className="req-section-title">Type</div>
                <div className="req-grid req-grid-3">
                    {typeOptions.map((item) => {
                        const selected = requirements.type === item.key
                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={`req-card ${selected ? 'req-card-active' : ''}`}
                                onClick={() => update({
                                    type: item.key,
                                    maxKb:
                                        item.key === 'Document'
                                            ? 2048
                                            : item.key === 'Photograph'
                                                ? getSafePhotoMaxKb(requirements.maxKb, requirements.application)
                                                : 50
                                })}
                            >
                                <span className="req-badge">{item.label}</span>
                                <img src={item.logo} alt={item.label} className="req-type-logo" />
                                <span className={`req-radio ${selected ? 'req-radio-on' : ''}`} />
                            </button>
                        )
                    })}
                </div>
            </section>
            )}

            {mode === 'pan' && (
                <section className="req-section mt-6">
                    <div className="req-section-title">Resize</div>
                    <div className="req-inline-options">
                        <label className="req-inline">
                            <input
                                type="radio"
                                name="resizeMode"
                                checked={requirements.resizeMode === 'Original'}
                                onChange={() => update({ resizeMode: 'Original' })}
                            />
                            <span>Resize Original</span>
                        </label>
                        <label className="req-inline">
                            <input
                                type="radio"
                                name="resizeMode"
                                checked={requirements.resizeMode === 'Selected'}
                                onChange={() => update({ resizeMode: 'Selected' })}
                            />
                            <span>Resize Selected Area</span>
                        </label>
                    </div>
                </section>
            )}

            {mode === 'pan' && requirements.application === 'UTI' && requirements.type === 'Photograph' && (
                <div className="mt-6 flex items-center gap-3">
                    <label className="text-sm font-semibold text-ink">Photo Max Size</label>
                    <button
                        type="button"
                        onClick={() => update({ maxKb: 30 })}
                        className={`px-4 py-2 rounded-full text-sm ${requirements.maxKb === 30 ? 'bg-ink text-white' : 'bg-white border border-slate/20'}`}
                    >
                        30 KB
                    </button>
                    <button
                        type="button"
                        onClick={() => update({ maxKb: 50 })}
                        className={`px-4 py-2 rounded-full text-sm ${requirements.maxKb === 50 ? 'bg-ink text-white' : 'bg-white border border-slate/20'}`}
                    >
                        50 KB
                    </button>
                </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onBack} className="pan-back-btn">‹ Previous</button>
                <button type="button" onClick={onNext} className="pan-blue-btn" disabled={(mode === 'kb' || mode === 'pdf') && downloadLoading}>
                    {mode === 'kb'
                        ? (downloadLoading ? 'Downloading...' : 'Download')
                        : mode === 'pdf'
                            ? (downloadLoading ? 'Downloading...' : 'Download PDF')
                            : 'Next ›'}
                </button>
            </div>

            {(mode === 'kb' || mode === 'pdf') && downloadError && <div className="text-sm text-ember mt-3">{downloadError}</div>}
        </div>
    )
}
