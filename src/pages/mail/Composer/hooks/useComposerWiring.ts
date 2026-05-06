import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import {
  selectIsDirty,
  selectMailTitle,
} from '@domains/mail/store/composer/composer.selectors'
import { selectCurrentMail } from '@domains/mail/store/mail.selectors'

const SAVE_DEBOUNCE_MS = 800

export function useComposerWiring() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const current = useAppSelector(selectCurrentMail)
  const isDirty = useAppSelector(selectIsDirty)
  const title = useAppSelector(selectMailTitle)
  const document = useAppSelector((s) => s.composer.document)
  const composerMailId = useAppSelector((s) => s.composer.mailId)

  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!id) return
    if (composerMailId === id) return
    if (current?.id === id) {
      dispatch(
        composerActions.loadDocument({
          mailId: current.id,
          title: current.title,
          document: current.document,
        }),
      )
    } else {
      dispatch(mailActions.fetchByIdRequest(id))
    }
  }, [id, composerMailId, current, dispatch])

  useEffect(() => {
    if (!isDirty || !composerMailId) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      dispatch(mailActions.updateRequest({ id: composerMailId, patch: { title, document } }))
      dispatch(composerActions.markSaved())
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [isDirty, composerMailId, title, document, dispatch])

  const saveNow = () => {
    if (!composerMailId) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    dispatch(mailActions.updateRequest({ id: composerMailId, patch: { title, document } }))
    dispatch(composerActions.markSaved())
  }

  const exit = () => navigate(`/mail/${composerMailId ?? ''}` || '/mail')

  return { saveNow, exit, mailId: composerMailId }
}
