import { useCallback, useState } from 'react'
import { mailRepository } from '@domains/mail/repository/mail.repository'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export type UploadResult = { url: string; name: string }

export function useImageUpload(onUploaded: (result: UploadResult) => void) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('That file isn’t an image.')
        return
      }
      if (file.size > MAX_BYTES) {
        setError('Image is over 8 MB.')
        return
      }
      setIsUploading(true)
      try {
        const result = await mailRepository.uploadImage(file)
        onUploaded(result)
      } catch (err: unknown) {
        setError((err as Error).message ?? 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    },
    [onUploaded],
  )

  return { upload, isUploading, error }
}
