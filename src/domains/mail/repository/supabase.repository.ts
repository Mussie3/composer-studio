import { supabase, currentUserId } from '@api/supabase'
import { generateHtml } from '@domains/mail/html/generate'
import type {
  BusinessProfile,
  Mail,
  SenderProfile,
} from '@domains/mail/types'
import type { MailRepository } from './types'

const ASSET_BUCKET = 'composer-assets'

const unwrap = <T>(data: T | null, error: { message: string } | null, what: string): T => {
  if (error) throw new Error(`${what}: ${error.message}`)
  if (data === null) throw new Error(`${what}: not found`)
  return data
}

/**
 * Maps a client-side Mail patch onto table columns.
 *
 * `recipients` is deliberately absent: it lives in its own table and is written
 * through the replace_recipients RPC, so a CSV import is one transaction rather
 * than N inserts from the browser. `status`, `sentAt` and `stats` are absent
 * too -- those are the send pipeline's to set, and RLS rejects them anyway.
 */
const toColumns = (patch: Partial<Mail>): Record<string, unknown> => {
  const columns: Record<string, unknown> = {}
  if (patch.title !== undefined) columns.title = patch.title
  if (patch.subject !== undefined) columns.subject = patch.subject
  if (patch.preheader !== undefined) columns.preheader = patch.preheader
  if (patch.senderName !== undefined) columns.sender_name = patch.senderName
  if (patch.senderEmail !== undefined) columns.sender_email = patch.senderEmail
  if (patch.replyToEmail !== undefined) columns.reply_to_email = patch.replyToEmail
  if (patch.document !== undefined) columns.document = patch.document
  if (patch.templateId !== undefined) columns.template_id = patch.templateId
  if (patch.scheduledAt !== undefined) columns.scheduled_at = patch.scheduledAt
  return columns
}

const fetchMail = async (id: string): Promise<Mail> => {
  const { data, error } = await supabase.rpc('get_mail', { p_id: id })
  return unwrap(data as Mail | null, error, `loading mail ${id}`)
}

const writeRecipients = async (mailId: string, mail: Partial<Mail>): Promise<void> => {
  if (mail.recipients === undefined) return
  const { error } = await supabase.rpc('replace_recipients', {
    p_mail_id: mailId,
    p_recipients: mail.recipients,
  })
  if (error) throw new Error(`saving recipients: ${error.message}`)
}

export const supabaseRepository: MailRepository = {
  list: async () => {
    const { data, error } = await supabase.rpc('list_mails')
    return unwrap(data as Mail[] | null, error, 'loading mails')
  },

  getById: fetchMail,

  create: async (mail) => {
    const owner = await currentUserId()
    const { data, error } = await supabase
      .from('mails')
      .insert({
        // The factory already minted a uuid client-side; reusing it means the
        // redirect into the editor can happen without waiting for a round trip.
        id: mail.id,
        owner_id: owner,
        ...toColumns(mail),
        document: mail.document,
      })
      .select('id')
      .single()

    const created = unwrap(data, error, 'creating mail')
    await writeRecipients(created.id, mail)
    return fetchMail(created.id)
  },

  update: async (id, patch) => {
    const columns = toColumns(patch)
    if (Object.keys(columns).length > 0) {
      const { error } = await supabase.from('mails').update(columns).eq('id', id)
      if (error) throw new Error(`saving mail: ${error.message}`)
    }
    await writeRecipients(id, patch)
    return fetchMail(id)
  },

  remove: async (id) => {
    const { error } = await supabase.from('mails').delete().eq('id', id)
    if (error) throw new Error(`deleting mail: ${error.message}`)
  },

  send: async (id, scheduledAt) => {
    // The markup is generated here, by the same generator that powers the View
    // HTML modal, and handed to the backend as a snapshot. That is what keeps a
    // single renderer in the codebase: the Edge Function substitutes tokens and
    // rewrites links into this HTML, it never rebuilds the document itself.
    const mail = await fetchMail(id)
    const renderedHtml = generateHtml(mail.document, {
      subject: mail.subject,
      preheader: mail.preheader,
    })

    const { data, error } = await supabase.functions.invoke('send-mail', {
      body: { mailId: id, renderedHtml, subject: mail.subject, preheader: mail.preheader, scheduledAt },
    })
    if (error) throw new Error(`sending mail: ${error.message}`)
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)

    return fetchMail(id)
  },

  getSender: async () => {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('sender_profiles')
      .select('sender_name, sender_email, reply_to_email, is_verified')
      .eq('user_id', userId)
      .single()

    const row = unwrap(data, error, 'loading sender profile')
    return {
      senderName: row.sender_name,
      senderEmail: row.sender_email,
      replyToEmail: row.reply_to_email,
      isVerified: row.is_verified,
    }
  },

  updateSender: async (profile: SenderProfile) => {
    const userId = await currentUserId()
    // is_verified is intentionally not sent: the RLS policy rejects a client
    // trying to raise it, and sending it unchanged would be noise.
    const { error } = await supabase
      .from('sender_profiles')
      .update({
        sender_name: profile.senderName,
        sender_email: profile.senderEmail,
        reply_to_email: profile.replyToEmail,
      })
      .eq('user_id', userId)
    if (error) throw new Error(`saving sender profile: ${error.message}`)
    return supabaseRepository.getSender()
  },

  getBusiness: async () => {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('business_profiles')
      .select('business_name, business_address, website_url, logo_url')
      .eq('user_id', userId)
      .single()

    const row = unwrap(data, error, 'loading business profile')
    return {
      businessName: row.business_name,
      businessAddress: row.business_address,
      websiteUrl: row.website_url,
      logoUrl: row.logo_url,
    }
  },

  updateBusiness: async (profile: BusinessProfile) => {
    const userId = await currentUserId()
    const { error } = await supabase
      .from('business_profiles')
      .update({
        business_name: profile.businessName,
        business_address: profile.businessAddress,
        website_url: profile.websiteUrl,
        logo_url: profile.logoUrl,
      })
      .eq('user_id', userId)
    if (error) throw new Error(`saving business profile: ${error.message}`)
    return supabaseRepository.getBusiness()
  },

  uploadImage: async (file: File) => {
    const userId = await currentUserId()
    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    // First path segment is the user id -- that is what the storage RLS policy
    // checks, so a user can only ever write inside their own folder.
    const path = `${userId}/${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from(ASSET_BUCKET)
      .upload(path, file, { cacheControl: '31536000', upsert: false })
    if (error) throw new Error(`uploading image: ${error.message}`)

    // A public URL, not a signed one. Mail clients fetch images anonymously and
    // a signed URL would expire while the email is still sitting in an inbox.
    const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, name: file.name }
  },
}
