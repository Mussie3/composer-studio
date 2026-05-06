import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import { mailRepository } from '@domains/mail/repository/mail.repository'
import { createMail } from '@domains/mail/factories'
import type { BusinessProfile, Mail, SenderProfile } from '@domains/mail/types'
import { mailActions } from './mail.slice'
import type { PayloadAction } from '@reduxjs/toolkit'

function* fetchListSaga() {
  try {
    const list: Mail[] = yield call(mailRepository.list)
    yield put(mailActions.fetchListSuccess(list))
  } catch (err: unknown) {
    yield put(mailActions.fetchListFailure((err as Error).message))
  }
}

function* fetchByIdSaga(action: PayloadAction<string>) {
  try {
    const mail: Mail = yield call(mailRepository.getById, action.payload)
    yield put(mailActions.fetchByIdSuccess(mail))
  } catch (err: unknown) {
    yield put(mailActions.fetchByIdFailure((err as Error).message))
  }
}

function* createSaga(action: PayloadAction<Partial<Mail>>) {
  try {
    const draft = createMail(action.payload)
    const created: Mail = yield call(mailRepository.create, draft)
    yield put(mailActions.createSuccess(created))
  } catch (err: unknown) {
    yield put(mailActions.createFailure((err as Error).message))
  }
}

function* updateSaga(action: PayloadAction<{ id: string; patch: Partial<Mail> }>) {
  try {
    const updated: Mail = yield call(
      mailRepository.update,
      action.payload.id,
      action.payload.patch,
    )
    yield put(mailActions.updateSuccess(updated))
  } catch (err: unknown) {
    yield put(mailActions.updateFailure((err as Error).message))
  }
}

function* deleteSaga(action: PayloadAction<string>) {
  try {
    yield call(mailRepository.remove, action.payload)
    yield put(mailActions.deleteSuccess(action.payload))
  } catch {
    /* swallow for the demo */
  }
}

function* sendSaga(action: PayloadAction<{ id: string; scheduledAt?: string | null }>) {
  try {
    const sent: Mail = yield call(
      mailRepository.send,
      action.payload.id,
      action.payload.scheduledAt ?? null,
    )
    yield put(mailActions.sendSuccess(sent))
  } catch (err: unknown) {
    yield put(mailActions.sendFailure((err as Error).message))
  }
}

function* submitForSendSaga(
  action: PayloadAction<{ id: string; patch: Partial<Mail>; scheduledAt: string | null }>,
) {
  try {
    const updated: Mail = yield call(
      mailRepository.update,
      action.payload.id,
      action.payload.patch,
    )
    yield put(mailActions.updateSuccess(updated))
    const sent: Mail = yield call(
      mailRepository.send,
      action.payload.id,
      action.payload.scheduledAt,
    )
    yield put(mailActions.sendSuccess(sent))
  } catch (err: unknown) {
    yield put(mailActions.sendFailure((err as Error).message))
  }
}

function* fetchSenderSaga() {
  const profile: SenderProfile = yield call(mailRepository.getSender)
  yield put(mailActions.fetchSenderSuccess(profile))
}

function* saveSenderSaga(action: PayloadAction<SenderProfile>) {
  const saved: SenderProfile = yield call(mailRepository.updateSender, action.payload)
  yield put(mailActions.saveSenderSuccess(saved))
}

function* fetchBusinessSaga() {
  const profile: BusinessProfile = yield call(mailRepository.getBusiness)
  yield put(mailActions.fetchBusinessSuccess(profile))
}

function* saveBusinessSaga(action: PayloadAction<BusinessProfile>) {
  const saved: BusinessProfile = yield call(mailRepository.updateBusiness, action.payload)
  yield put(mailActions.saveBusinessSuccess(saved))
}

export function* mailSaga() {
  yield takeLatest(mailActions.fetchListRequest.type, fetchListSaga)
  yield takeLatest(mailActions.fetchByIdRequest.type, fetchByIdSaga)
  yield takeEvery(mailActions.createRequest.type, createSaga)
  yield takeEvery(mailActions.updateRequest.type, updateSaga)
  yield takeEvery(mailActions.deleteRequest.type, deleteSaga)
  yield takeEvery(mailActions.sendRequest.type, sendSaga)
  yield takeEvery(mailActions.submitForSendRequest.type, submitForSendSaga)
  yield takeLatest(mailActions.fetchSenderRequest.type, fetchSenderSaga)
  yield takeEvery(mailActions.saveSenderRequest.type, saveSenderSaga)
  yield takeLatest(mailActions.fetchBusinessRequest.type, fetchBusinessSaga)
  yield takeEvery(mailActions.saveBusinessRequest.type, saveBusinessSaga)
}
