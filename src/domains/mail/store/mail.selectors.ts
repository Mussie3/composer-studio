import type { RootState } from '@app/store'

export const selectMails = (s: RootState) => s.mail.list
export const selectIsLoadingList = (s: RootState) => s.mail.isLoadingList
export const selectIsLoadingCurrent = (s: RootState) => s.mail.isLoadingCurrent
export const selectIsSending = (s: RootState) => s.mail.isSending
export const selectCurrentMail = (s: RootState) => s.mail.current
export const selectMailById = (id: string | undefined) => (s: RootState) =>
  id ? s.mail.list.find((m) => m.id === id) ?? null : null
