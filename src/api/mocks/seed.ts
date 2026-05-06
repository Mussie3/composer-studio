import { createMail, createSeedDocument } from '@domains/mail/factories'
import type { Mail } from '@domains/mail/types'

export const buildSeedMails = (): Mail[] => {
  const today = new Date()
  const daysAgo = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - days)
    return d.toISOString()
  }

  return [
    createMail({
      title: 'March product update',
      status: 'sent',
      subject: 'See what we shipped this month',
      preheader: 'New canvas, faster preview, and smarter templates.',
      senderName: 'Composer Studio',
      senderEmail: 'team@composer.studio',
      replyToEmail: 'team@composer.studio',
      document: createSeedDocument(),
      createdAt: daysAgo(14),
      updatedAt: daysAgo(7),
      sentAt: daysAgo(7),
      stats: {
        recipientCount: 1240,
        deliveredCount: 1230,
        openCount: 612,
        clickCount: 142,
        unsubscribeCount: 4,
        bounceCount: 10,
      },
    }),
    createMail({
      title: 'Welcome series · day 1',
      status: 'sent',
      subject: 'Welcome to Composer Studio',
      preheader: 'A quick tour to help you get started.',
      senderName: 'Composer Studio',
      senderEmail: 'team@composer.studio',
      replyToEmail: 'team@composer.studio',
      document: createSeedDocument(),
      createdAt: daysAgo(30),
      updatedAt: daysAgo(28),
      sentAt: daysAgo(28),
      stats: {
        recipientCount: 320,
        deliveredCount: 318,
        openCount: 240,
        clickCount: 86,
        unsubscribeCount: 1,
        bounceCount: 2,
      },
    }),
    createMail({
      title: 'Spring promo (draft)',
      status: 'draft',
      subject: '',
      senderName: 'Composer Studio',
      senderEmail: 'team@composer.studio',
      document: createSeedDocument(),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    }),
  ]
}
