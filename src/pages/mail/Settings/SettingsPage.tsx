import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ShieldCheck } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import type { BusinessProfile, SenderProfile } from '@domains/mail/types'

const senderSchema = z.object({
  senderName: z.string().min(1, 'Sender name is required'),
  senderEmail: z.string().email('Must be a valid email'),
  replyToEmail: z.string().email('Must be a valid email'),
  isVerified: z.boolean(),
})

const businessSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  businessAddress: z.string().min(1, 'Business address is required'),
  websiteUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')),
})

export default function SettingsPage() {
  const dispatch = useAppDispatch()
  const sender = useAppSelector((s) => s.mail.sender)
  const business = useAppSelector((s) => s.mail.business)

  useEffect(() => {
    dispatch(mailActions.fetchSenderRequest())
    dispatch(mailActions.fetchBusinessRequest())
  }, [dispatch])

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sender identity and business profile. These power the email "From" line and
            the footer of every email you send.
          </p>
        </header>

        <SenderForm key={sender.senderEmail} initial={sender} onSave={(v) => dispatch(mailActions.saveSenderRequest(v))} />
        <div className="h-4" />
        <BusinessForm key={business.businessName} initial={business} onSave={(v) => dispatch(mailActions.saveBusinessRequest(v))} />
      </div>
    </div>
  )
}

function SenderForm({
  initial,
  onSave,
}: {
  initial: SenderProfile
  onSave: (values: SenderProfile) => void
}) {
  const form = useForm<SenderProfile>({
    resolver: zodResolver(senderSchema),
    defaultValues: initial,
  })

  const onSubmit = (values: SenderProfile) => {
    onSave(values)
    form.reset(values)
  }

  return (
    <section className="panel p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Sender identity</h2>
          <p className="text-xs text-gray-500 mt-0.5">Shown in the From line of every email.</p>
        </div>
        {form.watch('isVerified') && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
            <ShieldCheck size={12} /> Verified
          </span>
        )}
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        <Field label="Sender name" error={form.formState.errors.senderName?.message}>
          <input className="input" {...form.register('senderName')} />
        </Field>
        <Field label="Sender email" error={form.formState.errors.senderEmail?.message}>
          <input className="input" {...form.register('senderEmail')} />
        </Field>
        <Field label="Reply-to email" error={form.formState.errors.replyToEmail?.message}>
          <input className="input" {...form.register('replyToEmail')} />
        </Field>
        <div className="col-span-2 flex items-center justify-end gap-2 mt-2">
          {form.formState.isSubmitSuccessful && !form.formState.isDirty && (
            <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
              <Check size={12} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={!form.formState.isDirty}
            className="btn-primary disabled:opacity-50"
          >
            Save sender
          </button>
        </div>
      </form>
    </section>
  )
}

function BusinessForm({
  initial,
  onSave,
}: {
  initial: BusinessProfile
  onSave: (values: BusinessProfile) => void
}) {
  const form = useForm<BusinessProfile>({
    resolver: zodResolver(businessSchema),
    defaultValues: initial,
  })

  const onSubmit = (values: BusinessProfile) => {
    onSave(values)
    form.reset(values)
  }

  return (
    <section className="panel p-6">
      <header className="mb-4">
        <h2 className="font-semibold">Business profile</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Used in email footers (legally required for marketing emails in most regions).
        </p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        <Field label="Business name" error={form.formState.errors.businessName?.message}>
          <input className="input" {...form.register('businessName')} />
        </Field>
        <Field label="Website URL" error={form.formState.errors.websiteUrl?.message}>
          <input className="input" placeholder="https://example.com" {...form.register('websiteUrl')} />
        </Field>
        <Field
          label="Mailing address"
          error={form.formState.errors.businessAddress?.message}
          full
        >
          <input className="input" {...form.register('businessAddress')} />
        </Field>
        <Field label="Logo URL (optional)" error={form.formState.errors.logoUrl?.message} full>
          <input className="input" placeholder="https://" {...form.register('logoUrl')} />
        </Field>
        <div className="col-span-2 flex items-center justify-end gap-2 mt-2">
          {form.formState.isSubmitSuccessful && !form.formState.isDirty && (
            <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
              <Check size={12} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={!form.formState.isDirty}
            className="btn-primary disabled:opacity-50"
          >
            Save business
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string
  error?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="label">{label}</label>
      {children}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  )
}
