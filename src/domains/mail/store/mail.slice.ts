import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Mail, SenderProfile, BusinessProfile } from '@domains/mail/types'

export type MailState = {
  list: Mail[]
  current: Mail | null
  sender: SenderProfile
  business: BusinessProfile
  isLoadingList: boolean
  isLoadingCurrent: boolean
  isSending: boolean
  error: string | null
}

const defaultSender: SenderProfile = {
  senderName: 'Composer Studio',
  senderEmail: 'hello@composer.studio',
  replyToEmail: 'hello@composer.studio',
  isVerified: true,
}

const defaultBusiness: BusinessProfile = {
  businessName: 'Composer Studio Inc.',
  businessAddress: '123 Builder Lane, Demo City',
  websiteUrl: 'https://composer.studio',
  logoUrl: '',
}

const initialState: MailState = {
  list: [],
  current: null,
  sender: defaultSender,
  business: defaultBusiness,
  isLoadingList: false,
  isLoadingCurrent: false,
  isSending: false,
  error: null,
}

export const mailSlice = createSlice({
  name: 'mail',
  initialState,
  reducers: {
    fetchListRequest(state) {
      state.isLoadingList = true
      state.error = null
    },
    fetchListSuccess(state, action: PayloadAction<Mail[]>) {
      state.list = action.payload
      state.isLoadingList = false
    },
    fetchListFailure(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.isLoadingList = false
    },

    fetchByIdRequest(state, _action: PayloadAction<string>) {
      state.isLoadingCurrent = true
      state.error = null
    },
    fetchByIdSuccess(state, action: PayloadAction<Mail>) {
      state.current = action.payload
      state.isLoadingCurrent = false
    },
    fetchByIdFailure(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.isLoadingCurrent = false
    },

    createRequest(state, _action: PayloadAction<Partial<Mail>>) {
      state.error = null
    },
    createSuccess(state, action: PayloadAction<Mail>) {
      state.list.unshift(action.payload)
      state.current = action.payload
    },
    createFailure(state, action: PayloadAction<string>) {
      state.error = action.payload
    },

    updateRequest(state, _action: PayloadAction<{ id: string; patch: Partial<Mail> }>) {
      state.isSending = false
    },
    updateSuccess(state, action: PayloadAction<Mail>) {
      const idx = state.list.findIndex((m) => m.id === action.payload.id)
      if (idx >= 0) state.list[idx] = action.payload
      if (state.current?.id === action.payload.id) state.current = action.payload
    },
    updateFailure(state, action: PayloadAction<string>) {
      state.error = action.payload
    },

    deleteRequest(_state, _action: PayloadAction<string>) {},
    deleteSuccess(state, action: PayloadAction<string>) {
      state.list = state.list.filter((m) => m.id !== action.payload)
      if (state.current?.id === action.payload) state.current = null
    },

    sendRequest(state, _action: PayloadAction<{ id: string; scheduledAt?: string | null }>) {
      state.isSending = true
    },
    sendSuccess(state, action: PayloadAction<Mail>) {
      state.isSending = false
      const idx = state.list.findIndex((m) => m.id === action.payload.id)
      if (idx >= 0) state.list[idx] = action.payload
      if (state.current?.id === action.payload.id) state.current = action.payload
    },
    sendFailure(state, action: PayloadAction<string>) {
      state.isSending = false
      state.error = action.payload
    },

    fetchSenderRequest(_state) {},
    fetchSenderSuccess(state, action: PayloadAction<SenderProfile>) {
      state.sender = action.payload
    },
    saveSenderRequest(_state, _action: PayloadAction<SenderProfile>) {},
    saveSenderSuccess(state, action: PayloadAction<SenderProfile>) {
      state.sender = action.payload
    },

    fetchBusinessRequest(_state) {},
    fetchBusinessSuccess(state, action: PayloadAction<BusinessProfile>) {
      state.business = action.payload
    },
    saveBusinessRequest(_state, _action: PayloadAction<BusinessProfile>) {},
    saveBusinessSuccess(state, action: PayloadAction<BusinessProfile>) {
      state.business = action.payload
    },
  },
})

export const mailActions = mailSlice.actions
export default mailSlice.reducer
