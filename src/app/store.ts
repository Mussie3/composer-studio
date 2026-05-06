import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { all } from 'redux-saga/effects'
import composerReducer from '@domains/mail/store/composer/composer.slice'
import mailReducer from '@domains/mail/store/mail.slice'
import { mailSaga } from '@domains/mail/store/mail.saga'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    composer: composerReducer,
    mail: mailReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      thunk: false,
      serializableCheck: {
        ignoredActionPaths: ['payload.dataUrl'],
      },
    }).concat(sagaMiddleware),
})

function* rootSaga() {
  yield all([mailSaga()])
}

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
