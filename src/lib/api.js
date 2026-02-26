const API_BASE = import.meta.env.VITE_API_BASE || 'https://pancardresizebackend-production.up.railway.app'

export async function uploadFiles(files) {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: form
    })
    if (!res.ok) {
        throw new Error('Upload failed')
    }
    return res.json()
}

export async function uploadFilesKb(files) {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    const res = await fetch(`${API_BASE}/api/kb/upload`, {
        method: 'POST',
        body: form
    })
    if (!res.ok) {
        throw new Error('Upload failed')
    }
    return res.json()
}

export async function fetchPreview(payload) {
    const res = await fetch(`${API_BASE}/api/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Preview failed')
    }
    return res.blob()
}

export async function fetchPreviewKb(payload) {
    const res = await fetch(`${API_BASE}/api/kb/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Preview failed')
    }
    return res.blob()
}

export async function renderPhoto(payload) {
    const res = await fetch(`${API_BASE}/api/render/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Render failed')
    }
    return res.blob()
}

export async function renderPhotoKb(payload) {
    const res = await fetch(`${API_BASE}/api/kb/render/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Render failed')
    }
    return res.blob()
}

export async function fetchKbSize(payload, signal) {
    const res = await fetch(`${API_BASE}/api/kb/size/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Size check failed')
    }
    return res.json()
}

export async function renderSignature(payload) {
    const res = await fetch(`${API_BASE}/api/render/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Render failed')
    }
    return res.blob()
}

export async function renderDocuments(payload) {
    const res = await fetch(`${API_BASE}/api/render/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Render failed')
    }
    return res.blob()
}

export async function renderDocumentImage(payload) {
    const res = await fetch(`${API_BASE}/api/render/document-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        throw new Error('Render failed')
    }
    return res.blob()
}

export async function renderDocumentsPdf(payload) {
    const res = await fetch(`${API_BASE}/api/pdf/render/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        let msg = 'Render failed'
        try {
            const data = await res.json()
            if (data?.message) msg = data.message
        } catch (e) {
        }
        throw new Error(msg)
    }
    return res.blob()
}
