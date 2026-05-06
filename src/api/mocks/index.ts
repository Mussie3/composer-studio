import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '@api/client'
import { storage } from '@api/storage'
import type { Mail, SenderProfile, BusinessProfile } from '@domains/mail/types'
import { buildSeedMails } from './seed'

const KEYS = {
  mails: 'mails',
  sender: 'sender',
  business: 'business',
}

const ensureSeeded = () => {
  if (storage.read<Mail[] | null>(KEYS.mails, null) === null) {
    storage.write(KEYS.mails, buildSeedMails())
  }
  if (storage.read<SenderProfile | null>(KEYS.sender, null) === null) {
    storage.write<SenderProfile>(KEYS.sender, {
      senderName: 'Composer Studio',
      senderEmail: 'hello@composer.studio',
      replyToEmail: 'hello@composer.studio',
      isVerified: true,
    })
  }
  if (storage.read<BusinessProfile | null>(KEYS.business, null) === null) {
    storage.write<BusinessProfile>(KEYS.business, {
      businessName: 'Composer Studio Inc.',
      businessAddress: '123 Builder Lane, Demo City',
      websiteUrl: 'https://composer.studio',
      logoUrl: '',
    })
  }
}

const readMails = () => storage.read<Mail[]>(KEYS.mails, [])
const writeMails = (mails: Mail[]) => storage.write(KEYS.mails, mails)

export const installMockApi = () => {
  ensureSeeded()
  const mock = new MockAdapter(apiClient, { delayResponse: 220 })

  mock.onGet('/mails').reply(() => [200, readMails()])

  mock.onGet(/\/mails\/.+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const mail = readMails().find((m) => m.id === id)
    return mail ? [200, mail] : [404, { error: 'not_found' }]
  })

  mock.onPost('/mails').reply((config) => {
    const body = JSON.parse(config.data) as Mail
    const list = readMails()
    list.unshift(body)
    writeMails(list)
    return [201, body]
  })

  mock.onPatch(/\/mails\/.+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const patch = JSON.parse(config.data) as Partial<Mail>
    const list = readMails()
    const idx = list.findIndex((m) => m.id === id)
    if (idx < 0) return [404, { error: 'not_found' }]
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() }
    writeMails(list)
    return [200, list[idx]]
  })

  mock.onDelete(/\/mails\/.+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const list = readMails()
    writeMails(list.filter((m) => m.id !== id))
    return [204]
  })

  mock.onPost(/\/mails\/.+\/send/).reply((config) => {
    const id = config.url!.split('/')[2]
    const body = JSON.parse(config.data || '{}') as { scheduledAt?: string | null }
    const list = readMails()
    const idx = list.findIndex((m) => m.id === id)
    if (idx < 0) return [404, { error: 'not_found' }]
    const now = new Date().toISOString()
    const scheduled = body.scheduledAt && new Date(body.scheduledAt) > new Date()
    list[idx] = {
      ...list[idx],
      status: scheduled ? 'scheduled' : 'sent',
      scheduledAt: scheduled ? body.scheduledAt! : null,
      sentAt: scheduled ? null : now,
      updatedAt: now,
      stats: scheduled
        ? null
        : {
            recipientCount: list[idx].recipients.length || 100,
            deliveredCount: list[idx].recipients.length || 100,
            openCount: 0,
            clickCount: 0,
            unsubscribeCount: 0,
            bounceCount: 0,
          },
    }
    writeMails(list)
    return [200, list[idx]]
  })

  mock.onGet('/sender').reply(() => [200, storage.read<SenderProfile>(KEYS.sender, {} as SenderProfile)])
  mock.onPut('/sender').reply((config) => {
    const body = JSON.parse(config.data) as SenderProfile
    storage.write(KEYS.sender, body)
    return [200, body]
  })

  mock.onGet('/business').reply(() => [200, storage.read<BusinessProfile>(KEYS.business, {} as BusinessProfile)])
  mock.onPut('/business').reply((config) => {
    const body = JSON.parse(config.data) as BusinessProfile
    storage.write(KEYS.business, body)
    return [200, body]
  })

  mock.onPost('/uploads/image').reply((config) => {
    const body = JSON.parse(config.data) as { dataUrl: string; name: string }
    return [200, { url: body.dataUrl, name: body.name }]
  })

  return mock
}
