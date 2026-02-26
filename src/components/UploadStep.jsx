import React, { useEffect, useMemo, useRef } from 'react'

export default function UploadStep({ mode, files, setFiles, onNext, loading, error }) {
    const fileInputRef = useRef(null)

    const handleChange = (event) => {
        let selected = Array.from(event.target.files || [])
        if (mode === 'kb') {
            selected = selected.filter((file) => file.type.startsWith('image/') || file.name.match(/\.(jpe?g|png)$/i)).slice(0, 1)
        }
        setFiles(selected)
    }

    const previews = useMemo(() => {
        return files.map((file) => ({
            key: file.name + file.size,
            file,
            isImage: file.type.startsWith('image/') || file.name.match(/\.(jpe?g|png)$/i),
            url: file.type.startsWith('image/') || file.name.match(/\.(jpe?g|png)$/i) ? URL.createObjectURL(file) : ''
        }))
    }, [files])

    useEffect(() => {
        return () => {
            previews.forEach((item) => {
                if (item.url) URL.revokeObjectURL(item.url)
            })
        }
    }, [previews])

    return (
        <div className="card-surface rounded-2xl p-6 requirement-screen">
            <h2 className="text-xl font-semibold font-display">Upload</h2>

            <input
                ref={fileInputRef}
                type="file"
                multiple={mode !== 'kb'}
                accept={mode === 'kb' ? 'image/jpeg,image/png,.jpg,.jpeg,.png' : 'image/jpeg,image/png,application/pdf,.pdf'}
                onChange={handleChange}
                className="hidden"
            />

            <section className="req-section mt-6">
                <div className="req-section-title">Select Files</div>

                {files.length === 0 ? (
                    <div className="req-card text-center min-h-[180px] justify-center">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="pan-blue-btn"
                        >
                            {mode === 'kb' ? 'Select Image' : 'Select File'}
                        </button>
                        <p className="text-xs text-slate mt-3">
                            {mode === 'kb'
                                ? 'Upload one JPG/PNG image for KB resize editor.'
                                : mode === 'pdf'
                                    ? 'Upload images or PDFs to combine and fit target KB.'
                                    : 'Max 5MB per file, 10MB total.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="pan-back-btn"
                            >
                                Change Files
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiles([])}
                                className="px-4 py-2 rounded-md border border-ember/40 text-ember text-sm bg-white"
                            >
                                Remove
                            </button>
                        </div>

                        <div className={previews.length === 1 ? 'grid grid-cols-1 place-items-center' : 'req-grid req-grid-2'}>
                            {previews.map((item) => (
                                <div key={item.key} className={`req-card min-h-[220px] ${previews.length === 1 ? 'w-full max-w-md' : ''}`}>
                                    {item.isImage ? (
                                        <div className="w-full h-72 rounded-xl bg-slate-50 flex items-center justify-center p-2">
                                            <img
                                                src={item.url}
                                                alt={item.file.name}
                                                className="max-h-full max-w-full object-contain object-center"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-72 rounded-xl bg-slate-50 flex items-center justify-center text-slate">
                                            PDF Document
                                        </div>
                                    )}
                                    <div className="text-sm font-semibold text-ink truncate mt-3 w-full">{item.file.name}</div>
                                    <div className="text-xs text-slate mt-1 w-full">{Math.round(item.file.size / 1024)} KB</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {error && <div className="mt-4 text-sm text-ember">{error}</div>}

            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={onNext}
                    disabled={files.length === 0 || loading}
                    className="pan-blue-btn"
                >
                    {loading ? 'Uploading...' : 'Next >'}
                </button>
            </div>
        </div>
    )
}
