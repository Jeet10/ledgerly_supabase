'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const LOGO_SIZE = 256 // Output logo size (1:1 ratio)
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

export default function ProfileModal({ isOpen, onClose, userId, currentLogoUrl, onLogoUpdate, hasLogo = false }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isCropping, setIsCropping] = useState(false)
  const [localHasLogo, setLocalHasLogo] = useState(hasLogo)
  const fileInputRef = useRef(null)
  const imageRef = useRef(null)

  // Sync with parent's hasLogo prop
  useEffect(() => {
    console.log('ProfileModal: hasLogo prop changed to:', hasLogo)
    setLocalHasLogo(hasLogo)
  }, [hasLogo])

  // Crop image to 1:1 ratio using canvas
  const cropToSquare = useCallback((image, size) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')

    // Calculate the dimensions for center crop
    const minDimension = Math.min(image.width, image.height)
    const sx = (image.width - minDimension) / 2
    const sy = (image.height - minDimension) / 2

    // Draw the cropped image
    ctx.drawImage(image, sx, sy, minDimension, minDimension, 0, 0, size, size)

    return canvas
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please select a valid image file (PNG, JPG, or WebP)')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 2MB')
      return
    }

    setError('')
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
      setIsCropping(true)
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle crop and upload
  const handleCropAndUpload = useCallback(async () => {
    if (!selectedFile || !previewUrl) {
      setError('No file selected')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Load image
      const image = new Image()
      
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('Failed to load image'))
        image.src = previewUrl
      })

      // Crop to square
      const canvas = cropToSquare(image, LOGO_SIZE)

      // Convert to blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setError('Failed to process image')
            setIsUploading(false)
            return
          }

          // Upload to Supabase Storage
          const fileName = `${userId}/logo.png`
          const { data, error: uploadError } = await supabase.storage
            .from('org-logos')
            .upload(fileName, blob, {
              cacheControl: '3600',
              upsert: true,
            })

          if (uploadError) {
            setError(uploadError.message)
            setIsUploading(false)
            return
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('org-logos')
            .getPublicUrl(fileName)

          // Update local state and parent component
          setLocalHasLogo(true)
          if (onLogoUpdate) {
            onLogoUpdate(publicUrl)
          }

          // Reset state
          setPreviewUrl(null)
          setSelectedFile(null)
          setIsCropping(false)
          setIsUploading(false)

          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
        'image/png',
        0.9
      )
    } catch (err) {
      setError('Failed to process image: ' + err.message)
      setIsUploading(false)
    }
  }, [previewUrl, selectedFile, userId, onLogoUpdate, cropToSquare])

  // Handle remove logo
  const handleRemoveLogo = useCallback(async () => {
    if (!userId) {
      setError('User ID is required to remove logo')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const fileName = `${userId}/logo.png`
      console.log('Removing logo:', fileName)
      
      const { error: deleteError } = await supabase.storage
        .from('org-logos')
        .remove([fileName])

      if (deleteError) {
        console.error('Delete error:', deleteError)
        setError(deleteError.message)
        setIsUploading(false)
        return
      }

      console.log('Logo removed successfully')

      // Update local state and parent component
      setLocalHasLogo(false)
      if (onLogoUpdate) {
        onLogoUpdate(null)
      }

      // Reset state
      setPreviewUrl(null)
      setSelectedFile(null)
      setIsCropping(false)
      setIsUploading(false)
    } catch (err) {
      console.error('Remove logo exception:', err)
      setError('Failed to remove logo: ' + err.message)
      setIsUploading(false)
    }
  }, [userId, onLogoUpdate])

  // Handle cancel crop
  const handleCancelCrop = useCallback(() => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setIsCropping(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle close modal
  const handleClose = useCallback(() => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setIsCropping(false)
    setError('')
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay profile-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="card profile-modal">
        <div className="modal-header">
          <h2 id="profile-modal-title">Organization Logo</h2>
          <button className="secondary" type="button" onClick={handleClose} disabled={isUploading}>
            Close
          </button>
        </div>

        {error && (
          <div className="error-toast" role="status" aria-live="polite">
            <span className="error-dot">!</span>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss message">
              x
            </button>
          </div>
        )}

        <div className="profile-modal-content">
          {/* Current Logo Preview */}
          <div className="logo-preview-section">
            <div className="logo-preview-container">
              {isCropping && previewUrl ? (
                <div className="crop-preview">
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview for cropping"
                    className="crop-preview-image"
                  />
                  <div className="crop-overlay">
                    <div className="crop-guide">
                      <span>Preview (1:1) - Click "Save & Upload"</span>
                    </div>
                  </div>
                </div>
              ) : currentLogoUrl && localHasLogo ? (
                <img
                  src={currentLogoUrl}
                  alt="Organization logo"
                  className="current-logo"
                  onError={() => setLocalHasLogo(false)}
                />
              ) : (
                <div className="logo-placeholder">
                  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V5h14v14Zm-5-7l-3 3.72L9 13l-3 4h12l-4-5Z"
                    />
                  </svg>
                  <span>No logo uploaded</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="logo-actions">
            {!isCropping ? (
              <div className="logo-action-buttons">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="logo-upload-input"
                  disabled={isUploading}
                />
                <label htmlFor="logo-upload-input" className="primary upload-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z"
                    />
                  </svg>
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </label>
                {localHasLogo && (
                  <button
                    className="danger remove-btn"
                    onClick={handleRemoveLogo}
                    disabled={isUploading}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"
                      />
                    </svg>
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="crop-actions">
                <button
                  className="secondary"
                  onClick={handleCancelCrop}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  className="primary"
                  onClick={handleCropAndUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Save & Upload'}
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="logo-info">
            <p>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z"
                />
              </svg>
              <span>Upload a square image (1:1 ratio). Recommended size: 256x256 pixels. Max file size: 2MB.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}