export type Token = {
  key: string
  description: string
  example: string
}

export const TOKENS: Token[] = [
  {
    key: 'firstName',
    description: 'Recipient first name',
    example: 'Alex',
  },
  {
    key: 'lastName',
    description: 'Recipient last name',
    example: 'Park',
  },
  {
    key: 'email',
    description: 'Recipient email',
    example: 'alex@example.com',
  },
  {
    key: 'businessName',
    description: 'Your business name (from Settings)',
    example: 'Composer Studio Inc.',
  },
  {
    key: 'unsubscribeUrl',
    description: 'Unsubscribe link inserted by the sender',
    example: 'https://…/unsubscribe',
  },
]

export const renderToken = (key: string) => `{{${key}}}`

export const replaceTokensForPreview = (
  html: string,
  values: Record<string, string>,
): string => {
  return html.replace(/\{\{(\w+)\}\}/g, (m, key: string) => values[key] ?? m)
}
