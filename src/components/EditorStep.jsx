import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPreview, fetchPreviewKb, renderDocumentImage, renderDocuments, renderPhoto, renderPhotoKb, renderSignature } from '../lib/api.js'

const ZOOM_MIN = 1
const ZOOM_MAX = 3

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function getTargetAspect(type) {
    if (type === 'Photograph') return 2.5 / 3.5
    if (type === 'Signature') return 4.5 / 2
    return 1
}

function computePointerFrame(width, height, aspect) {
    if (!width || !height) return null
    const safeAspect = aspect || 1
    const inset = 4
    let frameWidth
    let frameHeight

    if (width / height > safeAspect) {
        frameHeight = height * 0.8
        frameWidth = frameHeight * safeAspect
    } else {
        frameWidth = width * 0.8
        frameHeight = frameWidth / safeAspect
    }

    frameWidth = Math.min(frameWidth, width - inset * 2)
    frameHeight = Math.min(frameHeight, height - inset * 2)

    return {
        x: Math.round((width - frameWidth) / 2),
        y: Math.round((height - frameHeight) / 2),
        width: Math.round(frameWidth),
        height: Math.round(frameHeight)
    }
}

function clampPan(pan, frame, width, height, zoom) {
    if (!frame || !width || !height) return pan
    const scaledWidth = width * zoom
    const scaledHeight = height * zoom

    const minX = frame.x + frame.width - scaledWidth
    const maxX = frame.x
    const minY = frame.y + frame.height - scaledHeight
    const maxY = frame.y

    return {
        x: clamp(pan.x, Math.min(minX, maxX), Math.max(minX, maxX)),
        y: clamp(pan.y, Math.min(minY, maxY), Math.max(minY, maxY))
    }
}

function getCenteredPan(frame, width, height, zoom) {
    const centered = {
        x: (width - width * zoom) / 2,
        y: (height - height * zoom) / 2
    }
    return clampPan(centered, frame, width, height, zoom)
}

export default function EditorStep({ mode, requirements, uploadResult, onBack }) {
    const fileMeta = uploadResult?.files?.[0]
    const fileIds = uploadResult?.files?.map((file) => file.fileId) || []

    const [rotate, setRotate] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [bw, setBw] = useState(false)
    const [previewFilter, setPreviewFilter] = useState(false)
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
    const [saturation, setSaturation] = useState(100)
    const [activeTool, setActiveTool] = useState('zoom')
    const [showPreviewPopup, setShowPreviewPopup] = useState(false)
    const [previewUrl, setPreviewUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [drag, setDrag] = useState(null)
    const [imageBox, setImageBox] = useState({ width: 0, height: 0 })

    const imgRef = useRef(null)
    const viewportRef = useRef(null)

    const targetAspect = useMemo(() => getTargetAspect(requirements.type), [requirements.type])
    const hasFrame = requirements.type !== 'Document' && requirements.resizeMode === 'Selected'

    const rotatedDims = useMemo(() => {
        if (!fileMeta?.width || !fileMeta?.height) {
            return { width: 0, height: 0 }
        }
        const isSwap = Math.abs(rotate % 180) === 90
        return {
            width: isSwap ? fileMeta.height : fileMeta.width,
            height: isSwap ? fileMeta.width : fileMeta.height
        }
    }, [fileMeta, rotate])

    const pointerFrame = useMemo(() => computePointerFrame(imageBox.width, imageBox.height, targetAspect), [imageBox, targetAspect])

    useEffect(() => {
        if (!fileMeta || requirements.type === 'Document') return
        let active = true

        const payload = {
            fileId: fileMeta.fileId,
            rotate,
            zoom: 1,
            crop: null
        }

        const timer = setTimeout(async () => {
            try {
                const blob = mode === 'kb' ? await fetchPreviewKb(payload) : await fetchPreview(payload)
                if (!active) return
                const url = URL.createObjectURL(blob)
                setPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return url
                })
            } catch (err) {
                setError('Failed to load preview')
            }
        }, 180)

        return () => {
            active = false
            clearTimeout(timer)
        }
    }, [fileMeta, rotate, requirements.type])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    useEffect(() => {
        if (!viewportRef.current) return
        const observeTarget = viewportRef.current
        const updateBox = () => {
            if (!imgRef.current) return
            setImageBox({
                width: imgRef.current.clientWidth,
                height: imgRef.current.clientHeight
            })
        }
        updateBox()

        const ro = new ResizeObserver(() => updateBox())
        ro.observe(observeTarget)
        if (imgRef.current) ro.observe(imgRef.current)
        window.addEventListener('resize', updateBox)

        return () => {
            ro.disconnect()
            window.removeEventListener('resize', updateBox)
        }
    }, [previewUrl])

    useEffect(() => {
        if (!hasFrame || !pointerFrame || !imageBox.width || !imageBox.height) return
        setPan((prev) => clampPan(prev, pointerFrame, imageBox.width, imageBox.height, zoom))
    }, [hasFrame, pointerFrame, imageBox, zoom])

    useEffect(() => {
        if (!hasFrame || !pointerFrame || !imageBox.width || !imageBox.height) return
        setPan(getCenteredPan(pointerFrame, imageBox.width, imageBox.height, zoom))
    }, [hasFrame, pointerFrame, imageBox.width, imageBox.height, fileMeta?.fileId, rotate])

    useEffect(() => {
        if (activeTool !== 'preview') {
            setShowPreviewPopup(false)
        }
    }, [activeTool])

    const handleImageLoad = () => {
        if (!imgRef.current) return
        setImageBox({
            width: imgRef.current.clientWidth,
            height: imgRef.current.clientHeight
        })
    }

    const toLocalPoint = (event) => {
        if (!viewportRef.current) return null
        const rect = viewportRef.current.getBoundingClientRect()
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    const startPan = (event) => {
        if (!hasFrame || !pointerFrame) return
        const point = toLocalPoint(event)
        if (!point) return

        setDrag({
            startX: point.x,
            startY: point.y,
            startPanX: pan.x,
            startPanY: pan.y
        })

        event.currentTarget.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    const movePan = (event) => {
        if (!drag || !pointerFrame) return
        const point = toLocalPoint(event)
        if (!point) return

        const nextPan = {
            x: drag.startPanX + (point.x - drag.startX),
            y: drag.startPanY + (point.y - drag.startY)
        }

        setPan(clampPan(nextPan, pointerFrame, imageBox.width, imageBox.height, zoom))
    }

    const endPan = () => setDrag(null)

    const handleWheelZoom = (event) => {
        if (!hasFrame) return
        event.preventDefault()
        const delta = event.deltaY > 0 ? -0.08 : 0.08
        const nextZoom = clamp(Number((zoom + delta).toFixed(2)), ZOOM_MIN, ZOOM_MAX)
        setZoom(nextZoom)
    }

    const setZoomSafe = (value) => {
        setZoom(clamp(Number(value), ZOOM_MIN, ZOOM_MAX))
    }

    const resetAll = () => {
        setRotate(0)
        setZoom(1)
        if (pointerFrame && imageBox.width && imageBox.height) {
            setPan(getCenteredPan(pointerFrame, imageBox.width, imageBox.height, 1))
        } else {
            setPan({ x: 0, y: 0 })
        }
        setBw(false)
        setPreviewFilter(false)
        setBrightness(100)
        setContrast(100)
        setSaturation(100)
    }

    const previewCssFilter = useMemo(() => {
        if (!previewFilter && !bw) return 'none'
        const parts = []
        if (previewFilter) {
            parts.push(`brightness(${brightness}%)`)
            parts.push(`contrast(${contrast}%)`)
            parts.push(`saturate(${saturation}%)`)
        }
        if (bw) {
            parts.push('grayscale(1)')
        }
        return parts.join(' ')
    }, [previewFilter, bw, brightness, contrast, saturation])

    const computedCrop = useMemo(() => {
        if (!hasFrame) return null
        if (!pointerFrame || !imageBox.width || !imageBox.height || !rotatedDims.width || !rotatedDims.height) return null

        const scaleToSourceX = rotatedDims.width / imageBox.width
        const scaleToSourceY = rotatedDims.height / imageBox.height

        const left = (pointerFrame.x - pan.x) / zoom
        const top = (pointerFrame.y - pan.y) / zoom
        const width = pointerFrame.width / zoom
        const height = pointerFrame.height / zoom

        const x = Math.round(clamp(left * scaleToSourceX, 0, rotatedDims.width - 1))
        const y = Math.round(clamp(top * scaleToSourceY, 0, rotatedDims.height - 1))
        const w = Math.round(clamp(width * scaleToSourceX, 1, rotatedDims.width - x))
        const h = Math.round(clamp(height * scaleToSourceY, 1, rotatedDims.height - y))

        return { x, y, width: w, height: h }
    }, [hasFrame, pointerFrame, imageBox, rotatedDims, pan, zoom])

    const cropCoveragePct = useMemo(() => {
        if (!computedCrop || !rotatedDims.width || !rotatedDims.height) return null
        const total = rotatedDims.width * rotatedDims.height
        if (total <= 0) return null
        const part = computedCrop.width * computedCrop.height
        return Math.max(0, Math.min(100, (part / total) * 100))
    }, [computedCrop, rotatedDims])

    const previewThumb = useMemo(() => {
        if (!pointerFrame || !imageBox.width || !imageBox.height) return null
        const width = pointerFrame.width
        const height = pointerFrame.height
        return { width, height }
    }, [pointerFrame, imageBox])

    const downloadFile = async () => {
        setLoading(true)
        setError('')

        try {
            if (requirements.type === 'Document') {
                const blob = await renderDocumentImage({ fileIds })
                triggerDownload(blob, 'pan-document.jpg')
            } else if (requirements.type === 'Signature') {
                const payload = {
                    fileId: fileMeta.fileId,
                    rotate,
                    crop: hasFrame ? computedCrop : null,
                    bw
                }
                const blob = await renderSignature(payload)
                triggerDownload(blob, 'pan-signature.jpg')
            } else {
                const payload = {
                    fileId: fileMeta.fileId,
                    rotate,
                    crop: hasFrame ? computedCrop : null,
                    maxKb: requirements.maxKb
                }
                const blob = mode === 'kb' ? await renderPhotoKb(payload) : await renderPhoto(payload)
                triggerDownload(blob, 'pan-photo.jpg')
            }
        } catch (err) {
            setError('Rendering failed. Try a different crop or smaller image.')
        } finally {
            setLoading(false)
        }
    }

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

    if (!uploadResult) return null

    return (
        <div className="pan-editor-card card-surface rounded-2xl requirement-screen">
            {requirements.type !== 'Document' && (
                <>
                    <div className="pan-editor-canvas checker-bg" onWheel={handleWheelZoom}>
                        <div className="flex h-full w-full items-center justify-center">
                            {previewUrl ? (
                                <div
                                    ref={viewportRef}
                                    className={`relative max-h-full max-w-full overflow-hidden select-none touch-none ${hasFrame ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    onPointerDown={startPan}
                                    onPointerMove={movePan}
                                    onPointerUp={endPan}
                                    onPointerCancel={endPan}
                                    onPointerLeave={endPan}
                                >
                                    <img
                                        ref={imgRef}
                                        src={previewUrl}
                                        alt="Preview"
                                        onLoad={handleImageLoad}
                                        draggable={false}
                                        className="max-h-[540px] max-w-full object-contain"
                                        style={
                                            hasFrame
                                                ? {
                                                    transformOrigin: 'top left',
                                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                                    filter: previewCssFilter
                                                }
                                                : undefined
                                        }
                                    />

                                    {hasFrame && pointerFrame && (
                                        <div
                                            className="absolute pointer-events-none"
                                            style={{
                                                left: pointerFrame.x,
                                                top: pointerFrame.y,
                                                width: pointerFrame.width,
                                                height: pointerFrame.height,
                                                boxSizing: 'border-box',
                                                boxShadow: '0 0 0 2px rgba(255,255,255,0.96), 0 0 0 9999px rgba(0,0,0,0.72)'
                                            }}
                                        />
                                    )}

                                </div>
                            ) : (
                                <div className="text-slate text-sm">Preview loading...</div>
                            )}
                        </div>
                    </div>

                    <div className="pan-editor-toolbar">
                        <button type="button" className={`pan-icon-btn ${activeTool === 'zoom' ? 'pan-icon-btn-active' : ''}`} onClick={() => setActiveTool('zoom')} title="Zoom">
                            <span className="pan-icon-glyph">⊕</span>
                            <span className="pan-icon-label">Zoom</span>
                        </button>
                        <button type="button" className={`pan-icon-btn ${activeTool === 'rotate' ? 'pan-icon-btn-active' : ''}`} onClick={() => setActiveTool('rotate')} title="Rotate">
                            <span className="pan-icon-glyph">⟳</span>
                            <span className="pan-icon-label">Rotate</span>
                        </button>
                        <button type="button" className={`pan-icon-btn ${activeTool === 'filter' ? 'pan-icon-btn-active' : ''}`} onClick={() => setActiveTool('filter')} title="Filter">
                            <span className="pan-icon-glyph">◍</span>
                            <span className="pan-icon-label">Filter</span>
                        </button>
                        <button type="button" className={`pan-icon-btn ${activeTool === 'preview' ? 'pan-icon-btn-active' : ''}`} onClick={() => setActiveTool('preview')} title="Preview">
                            <span className="pan-icon-glyph">◑</span>
                            <span className="pan-icon-label">Preview</span>
                        </button>
                        <button type="button" className={`pan-icon-btn ${activeTool === 'download' ? 'pan-icon-btn-active' : ''}`} onClick={() => setActiveTool('download')} title="Download">
                            <span className="pan-icon-glyph">⬇</span>
                            <span className="pan-icon-label">Download</span>
                        </button>
                        <button type="button" className="pan-icon-btn" onClick={resetAll} title="Reset">
                            <span className="pan-icon-glyph">↺</span>
                            <span className="pan-icon-label">Reset</span>
                        </button>
                    </div>

                    <div className="pan-editor-controls">
                        <div className="pan-tool-panel">
                            {activeTool === 'zoom' && (
                                <div className="pan-tool-row">
                                    <button type="button" className="pan-back-btn" onClick={() => setZoomSafe(zoom - 0.1)}>-</button>
                                    <input
                                        type="range"
                                        min={ZOOM_MIN}
                                        max={ZOOM_MAX}
                                        step="0.05"
                                        value={zoom}
                                        onChange={(e) => setZoomSafe(e.target.value)}
                                        className="pan-zoom-slider"
                                    />
                                    <button type="button" className="pan-back-btn" onClick={() => setZoomSafe(zoom + 0.1)}>+</button>
                                </div>
                            )}

                            {activeTool === 'rotate' && (
                                <div className="pan-tool-row">
                                    <button type="button" className="pan-blue-btn" onClick={() => setRotate((prev) => prev - 90)}>Rotate Left</button>
                                    <button type="button" className="pan-blue-btn" onClick={() => setRotate((prev) => prev + 90)}>Rotate Right</button>
                                </div>
                            )}

                            {activeTool === 'filter' && (
                                <div className="pan-tool-row pan-tool-col">
                                    <button type="button" className={`pan-back-btn ${previewFilter ? 'pan-toggle-on' : ''}`} onClick={() => setPreviewFilter((prev) => !prev)}>
                                        {previewFilter ? 'Filter On' : 'Filter Off'}
                                    </button>
                                    <div className="pan-filter-grid">
                                        <label className="pan-filter-item">
                                            <span>Brightness</span>
                                            <input
                                                type="range"
                                                min="50"
                                                max="150"
                                                step="1"
                                                value={brightness}
                                                onChange={(e) => setBrightness(Number(e.target.value))}
                                                disabled={!previewFilter}
                                            />
                                        </label>
                                        <label className="pan-filter-item">
                                            <span>Contrast</span>
                                            <input
                                                type="range"
                                                min="50"
                                                max="150"
                                                step="1"
                                                value={contrast}
                                                onChange={(e) => setContrast(Number(e.target.value))}
                                                disabled={!previewFilter}
                                            />
                                        </label>
                                        <label className="pan-filter-item">
                                            <span>Saturation</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="180"
                                                step="1"
                                                value={saturation}
                                                onChange={(e) => setSaturation(Number(e.target.value))}
                                                disabled={!previewFilter}
                                            />
                                        </label>
                                    </div>
                                    {requirements.type === 'Signature' && (
                                        <button type="button" className={`pan-back-btn ${bw ? 'pan-toggle-on' : ''}`} onClick={() => setBw((prev) => !prev)}>
                                            {bw ? 'B/W On' : 'B/W Off'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {activeTool === 'preview' && (
                                <div className="pan-tool-row">
                                    <button type="button" className={`pan-back-btn ${showPreviewPopup ? 'pan-toggle-on' : ''}`} onClick={() => setShowPreviewPopup((prev) => !prev)}>
                                        {showPreviewPopup ? '👁 Hide Popup' : '👁 Show Popup'}
                                    </button>
                                </div>
                            )}

                            {activeTool === 'download' && (
                                <div className="pan-tool-row">
                                    <button type="button" className="pan-blue-btn" onClick={downloadFile} disabled={loading}>
                                        {loading ? 'Rendering...' : 'Download Now'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="pan-meta-row">
                            <span>Zoom: {Math.round(zoom * 100)}%</span>
                            <span>Rotate: {((rotate % 360) + 360) % 360}°</span>
                            {computedCrop && <span>Crop: {computedCrop.width} x {computedCrop.height}px</span>}
                        </div>

                        {error && <div className="text-sm text-ember mt-2">{error}</div>}

                        <div className="pan-bottom-row">
                            <button type="button" onClick={onBack} className="pan-back-btn">‹ Previous</button>
                        </div>
                    </div>
                </>
            )}

            {requirements.type === 'Document' && (
                <div className="p-6">
                    <div className="text-sm text-slate">Documents selected:</div>
                    <ul className="mt-2 text-sm text-ink list-disc list-inside">
                        {uploadResult.files.map((file) => (
                            <li key={file.fileId}>{file.originalName}</li>
                        ))}
                    </ul>
                    {error && <div className="text-sm text-ember mt-2">{error}</div>}
                    <div className="mt-4 flex gap-3 justify-end">
                        <button type="button" onClick={onBack} className="pan-back-btn">‹ Previous</button>
                        <button type="button" onClick={downloadFile} disabled={loading} className="pan-blue-btn">
                            {loading ? 'Rendering...' : 'Download'}
                        </button>
                    </div>
                </div>
            )}

            {activeTool === 'preview' && showPreviewPopup && computedCrop && previewThumb && (
                <div className="pan-modal-backdrop" onClick={() => setShowPreviewPopup(false)}>
                    <div className="pan-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div
                            className="pan-preview-thumb"
                            style={{ width: previewThumb.width, height: previewThumb.height }}
                        >
                            <img
                                src={previewUrl}
                                alt="Crop preview"
                                className="pan-preview-thumb-img"
                                style={{
                                    transformOrigin: 'top left',
                                    width: imageBox.width,
                                    height: imageBox.height,
                                    transform: `translate(${pan.x - pointerFrame.x}px, ${pan.y - pointerFrame.y}px) scale(${zoom})`,
                                    filter: previewCssFilter
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


