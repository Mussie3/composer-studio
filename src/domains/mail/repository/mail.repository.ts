import { apiClient } from '@api/client'
import type {
  BusinessProfile,
  Mail,
  SenderProfile,
} from '@domains/mail/types'

export const mailRepository = {
  list: async (): Promise<Mail[]> => {
    const res = await apiClient.get<Mail[]>('/mails')
    return res.data
  },
  getById: async (id: string): Promise<Mail> => {
    const res = await apiClient.get<Mail>(`/mails/${id}`)
    return res.data
  },
  create: async (mail: Mail): Promise<Mail> => {
    const res = await apiClient.post<Mail>('/mails', mail)
    return res.data
  },
  update: async (id: string, patch: Partial<Mail>): Promise<Mail> => {
    const res = await apiClient.patch<Mail>(`/mails/${id}`, patch)
    return res.data
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/mails/${id}`)
  },
  send: async (id: string, scheduledAt?: string | null): Promise<Mail> => {
    const res = await apiClient.post<Mail>(`/mails/${id}/send`, { scheduledAt })
    return res.data
  },
  getSender: async (): Promise<SenderProfile> => {
    const res = await apiClient.get<SenderProfile>('/sender')
    return res.data
  },
  updateSender: async (profile: SenderProfile): Promise<SenderProfile> => {
    const res = await apiClient.put<SenderProfile>('/sender', profile)
    return res.data
  },
  getBusiness: async (): Promise<BusinessProfile> => {
    const res = await apiClient.get<BusinessProfile>('/business')
    return res.data
  },
  updateBusiness: async (profile: BusinessProfile): Promise<BusinessProfile> => {
    const res = await apiClient.put<BusinessProfile>('/business', profile)
    return res.data
  },
  uploadImage: async (file: File): Promise<{ url: string; name: string }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    const res = await apiClient.post<{ url: string; name: string }>('/uploads/image', {
      dataUrl,
      name: file.name,
    })
    return res.data
  },
}
