import type { FooterBlock } from '@domains/mail/types'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import { selectSelection } from '@domains/mail/store/composer/composer.selectors'
import { cx } from '@shared/utils/cx'

type Props = { footer: FooterBlock }

export default function CanvasFooter({ footer }: Props) {
  const dispatch = useAppDispatch()
  const selection = useAppSelector(selectSelection)
  const isSelected = selection?.kind === 'footer'

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        dispatch(composerActions.setSelection({ kind: 'footer' }))
      }}
      className={cx(
        'cursor-pointer transition',
        isSelected && 'outline outline-2 outline-brand-500 -outline-offset-2',
        !isSelected && 'hover:outline hover:outline-1 hover:outline-brand-500/30 hover:-outline-offset-1',
      )}
      style={{
        background: footer.background,
        color: footer.textColor,
        padding: '24px 32px',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: 8 }}>{footer.helperText}</div>
      <div style={{ marginBottom: 12, opacity: 0.8 }}>
        {footer.businessName} · {footer.businessAddress}
      </div>
      {footer.showUnsubscribe && (
        <div>
          <a
            href="#unsubscribe"
            style={{ color: 'inherit', textDecoration: 'underline' }}
            onClick={(e) => e.preventDefault()}
          >
            {footer.unsubscribeLabel}
          </a>
        </div>
      )}
    </div>
  )
}
