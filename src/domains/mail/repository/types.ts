import type { BusinessProfile, Mail, SenderProfile } from '@domains/mail/types'

/**
 * The seam between the app and whatever is storing its data.
 *
 * The mock (axios + localStorage) and the Supabase implementation both satisfy
 * this, which is why swapping backends is one env var and touches no component,
 * slice, or saga.
 */
export type MailRepository = {
  list(): Promise<Mail[]>
  getById(id: string): Promise<Mail>
  create(mail: Mail): Promise<Mail>
  update(id: string, patch: Partial<Mail>): Promise<Mail>
  remove(id: string): Promise<void>
  send(id: string, scheduledAt?: string | null): Promise<Mail>
  getSender(): Promise<SenderProfile>
  updateSender(profile: SenderProfile): Promise<SenderProfile>
  getBusiness(): Promise<BusinessProfile>
  updateBusiness(profile: BusinessProfile): Promise<BusinessProfile>
  uploadImage(file: File): Promise<{ url: string; name: string }>
}
