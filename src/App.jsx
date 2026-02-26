import React, { useEffect, useMemo, useState } from 'react'
import ModeToggle from './components/ModeToggle.jsx'
import Stepper from './components/Stepper.jsx'
import UploadStep from './components/UploadStep.jsx'
import RequirementStep from './components/RequirementStep.jsx'
import EditorStep from './components/EditorStep.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import { fetchKbSize, renderPhotoKb, renderDocumentsPdf, uploadFiles, uploadFilesKb } from './lib/api.js'

const PHOTO_WIDTH = Math.round((2.5 / 2.54) * 200)
const PHOTO_HEIGHT = Math.round((3.5 / 2.54) * 200)
const SIGN_WIDTH = Math.round((4.5 / 2.54) * 200)
const SIGN_HEIGHT = Math.round((2.0 / 2.54) * 200)

export default function App() {
    const [mode, setMode] = useState('pan')
    const [step, setStep] = useState(1)
    const [files, setFiles] = useState([])
    const [uploadResult, setUploadResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [kbDownloadLoading, setKbDownloadLoading] = useState(false)
    const [kbDownloadError, setKbDownloadError] = useState('')
    const [kbSizeLoading, setKbSizeLoading] = useState(false)
    const [kbSizeError, setKbSizeError] = useState('')
    const [kbSizeBytes, setKbSizeBytes] = useState(null)
    const [requirements, setRequirements] = useState({
        application: 'NSDL',
        type: 'Photograph',
        resizeMode: 'Selected',
        maxKb: 50
    })

    const handleModeChange = (nextMode) => {
        setMode(nextMode)
        setStep(1)
        setFiles([])
        setUploadResult(null)
        setError('')
        setKbDownloadError('')
        setKbDownloadLoading(false)
        setKbSizeError('')
        setKbSizeLoading(false)
        setKbSizeBytes(null)
        if (nextMode === 'kb') {
            setRequirements((prev) => ({
                ...prev,
                type: 'Photograph',
                resizeMode: 'Selected',
                maxKb: prev.maxKb > 0 ? prev.maxKb : 100
            }))
        } else if (nextMode === 'pdf') {
            setRequirements((prev) => ({
                ...prev,
                type: 'Document',
                resizeMode: 'Original',
                maxKb: 250
            }))
        }
    }

    const targetPx = useMemo(() => {
        if (requirements.type === 'Photograph') {
            return `${PHOTO_WIDTH} x ${PHOTO_HEIGHT}px`
        }
        if (requirements.type === 'Signature') {
            return `${SIGN_WIDTH} x ${SIGN_HEIGHT}px`
        }
        return 'PDF (A4/fit-to-content)'
    }, [requirements.type])

    const handleUpload = async () => {
        setLoading(true)
        setError('')
        try {
            const result = mode === 'kb' ? await uploadFilesKb(files) : await uploadFiles(files)
            setUploadResult(result)
            setStep(2)
        } catch (err) {
            setError('Upload failed. Please check file types and sizes.')
        } finally {
            setLoading(false)
        }
    }

    const handleRequirementNext = () => {
        if (mode === 'kb' || mode === 'pdf') {
            return
        }
        setStep(3)
    }

    useEffect(() => {
        if (mode !== 'kb' || !uploadResult?.files?.length) {
            setKbSizeBytes(null)
            setKbSizeError('')
            setKbSizeLoading(false)
            return
        }

        const fileMeta = uploadResult.files[0]
        const payload = {
            fileId: fileMeta.fileId,
            rotate: 0,
            crop: null,
            maxKb: requirements.maxKb
        }

        let active = true
        const controller = new AbortController()
        setKbSizeLoading(true)
        setKbSizeError('')

        const timer = setTimeout(async () => {
            try {
                const result = await fetchKbSize(payload, controller.signal)
                if (!active) return
                setKbSizeBytes({
                    bytes: result.sizeBytes,
                    exact: result.exact
                })
            } catch (err) {
                if (!active) return
                if (err?.name !== 'AbortError') {
                    setKbSizeError('Backend size check failed.')
                    setKbSizeBytes(null)
                }
            } finally {
                if (active) setKbSizeLoading(false)
            }
        }, 1000)

        return () => {
            active = false
            controller.abort()
            clearTimeout(timer)
        }
    }, [mode, requirements.maxKb, uploadResult])

    const triggerDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    const handleKbDownload = async () => {
        if (!uploadResult?.files?.length) {
            setKbDownloadError('Please upload a JPG first.')
            return
        }
        setKbDownloadLoading(true)
        setKbDownloadError('')
        try {
            const fileMeta = uploadResult.files[0]
            const payload = {
                fileId: fileMeta.fileId,
                rotate: 0,
                crop: null,
                maxKb: requirements.maxKb
            }
            const blob = await renderPhotoKb(payload)
            triggerDownload(blob, `pan-photo-${requirements.maxKb}kb.jpg`)
        } catch (err) {
            setKbDownloadError('Download failed. Try a smaller KB value.')
        } finally {
            setKbDownloadLoading(false)
        }
    }

    const handlePdfDownload = async () => {
        if (!uploadResult?.files?.length) {
            setKbDownloadError('Please upload files first.')
            return
        }
        setKbDownloadLoading(true)
        setKbDownloadError('')
        try {
            const payload = {
                fileIds: uploadResult.files.map((file) => file.fileId),
                maxKb: requirements.maxKb
            }
            const blob = await renderDocumentsPdf(payload)
            triggerDownload(blob, `pan-documents-${requirements.maxKb}kb.pdf`)
        } catch (err) {
            setKbDownloadError(err?.message || 'Download failed. Try a higher KB value.')
        } finally {
            setKbDownloadLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-6xl mx-auto px-6 py-10 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-18 w-12 rounded-xl bg-white/70 border border-slate/20 flex items-center justify-center overflow-hidden">
                            <img src="/assets/pan-logo.png" alt="PAN Card Resizer logo" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <div className="text-sm uppercase tracking-[0.3em] text-slate">PAN Card Resizer</div>
                        <h1 className="text-3xl md:text-4xl font-display font-semibold mt-2">
                            Fast, compliant image processing for PAN applications
                        </h1>
                        </div>
                    </div>
                    <ModeToggle mode={mode} onChange={handleModeChange} />
                </div>

                <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
                    <Stepper current={step} mode={mode} />
                    <div className="text-sm text-slate">
                        Mode: <span className="font-semibold text-ink">{mode === 'pan' ? 'PAN Card Editor' : mode === 'kb' ? 'KB Editor' : 'PAN PDF Editor'}</span>
                    </div>
                </div>

                <div className={`mt-8 grid gap-6 ${step === 3 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1.6fr_0.8fr]'}`}>
                    {step === 1 && (
                        <UploadStep
                            mode={mode}
                            files={files}
                            setFiles={setFiles}
                            onNext={handleUpload}
                            loading={loading}
                            error={error}
                        />
                    )}
                    {step === 2 && (
                        <RequirementStep
                            mode={mode}
                            requirements={requirements}
                            setRequirements={setRequirements}
                            onNext={mode === 'kb' ? handleKbDownload : mode === 'pdf' ? handlePdfDownload : handleRequirementNext}
                            onBack={() => setStep(1)}
                            downloadLoading={kbDownloadLoading}
                            downloadError={kbDownloadError}
                            kbSizeBytes={kbSizeBytes}
                            kbSizeLoading={kbSizeLoading}
                            kbSizeError={kbSizeError}
                        />
                    )}
                    {step === 3 && (
                        <EditorStep mode={mode} requirements={requirements} uploadResult={uploadResult} onBack={() => setStep(2)} />
                    )}

                    {step !== 3 && (
                        <SummaryCard
                            mode={mode}
                            requirements={requirements}
                            targetPx={targetPx}
                            kbSizeBytes={kbSizeBytes}
                            kbSizeLoading={kbSizeLoading}
                            kbSizeError={kbSizeError}
                        />
                    )}
                </div>
            </div>
            <footer className="border-t border-slate/10 mt-auto">
                <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-slate flex items-center justify-between flex-wrap gap-2">
                    <span>© {new Date().getFullYear()} PAN Card Resizer</span>
                    <a
                        href="https://mdsufi.netlify.app"
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink hover:underline"
                    >
                        Built by MD Sufi
                    </a>
                </div>
            </footer>
        </div>
    )
}
