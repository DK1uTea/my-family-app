import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'

import { PasswordChecklist } from '@/features/auth/(components)/password-checklist'
import messages from '@/messages/en.json'

/**
 * Requirement order/behaviour comes straight from `passwordRequirements`
 * (`src/shared/schemas/password.schema.ts`): each item is red when its own `test()` fails
 * and green when it passes — there is no partial/"blue" state anywhere in this component.
 */

function renderChecklist(password: string) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasswordChecklist password={password} />
    </NextIntlClientProvider>,
  )
}

function itemFor(labelText: string) {
  return screen.getByText(new RegExp(`^${labelText}`)).closest('li')!
}

describe('PasswordChecklist', () => {
  it('renders nothing when the password is empty', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PasswordChecklist password="" />
      </NextIntlClientProvider>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('marks "at least 8 characters" red for a 7-character password', () => {
    renderChecklist('Ab1@abc')

    expect(itemFor('At least 8 characters')).toHaveClass('text-destructive')
  })

  it('marks "at least 8 characters" green once the password reaches 8 characters', () => {
    renderChecklist('Ab1@abcd')

    expect(itemFor('At least 8 characters')).toHaveClass('text-green-600')
  })

  it('marks "one lowercase letter" red when the password has no lowercase letter', () => {
    renderChecklist('ABCDEFG1@')

    expect(itemFor('One lowercase letter')).toHaveClass('text-destructive')
  })

  it('marks "one lowercase letter" green when the password has a lowercase letter', () => {
    renderChecklist('aBCDEFG1@')

    expect(itemFor('One lowercase letter')).toHaveClass('text-green-600')
  })

  it('marks "one uppercase letter" red when the password has no uppercase letter', () => {
    renderChecklist('abcdefg1@')

    expect(itemFor('One uppercase letter')).toHaveClass('text-destructive')
  })

  it('marks "one uppercase letter" green when the password has an uppercase letter', () => {
    renderChecklist('Abcdefg1@')

    expect(itemFor('One uppercase letter')).toHaveClass('text-green-600')
  })

  it('marks "one number" red when the password has no digit', () => {
    renderChecklist('Abcdefgh@')

    expect(itemFor('One number')).toHaveClass('text-destructive')
  })

  it('marks "one number" green when the password has a digit', () => {
    renderChecklist('Abcdefg1@')

    expect(itemFor('One number')).toHaveClass('text-green-600')
  })

  it('marks "one special character" red when the password has none of the accepted symbols', () => {
    renderChecklist('Abcdefg1')

    expect(itemFor('One special character')).toHaveClass('text-destructive')
  })

  it('marks "one special character" green for each accepted symbol', () => {
    for (const symbol of ['@', '$', '!', '%', '*', '?', '&', '-', '+', '=', '#', '.']) {
      const { unmount } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <PasswordChecklist password={`Abcdefg1${symbol}`} />
        </NextIntlClientProvider>,
      )

      expect(itemFor('One special character')).toHaveClass('text-green-600')
      unmount()
    }
  })

  // Sheet vs implementation contradiction: the requirements sheet claims "(" and ")" are
  // among the accepted special characters for this rule. The real regex in
  // src/shared/schemas/password.schema.ts is /[@$!%*?&\-+=\#.]+/ — it contains no
  // parenthesis at all, so a password whose only "special" character is "(" or ")" is
  // (correctly, per the real implementation) marked red, not green. Flagging rather than
  // asserting a behaviour the code doesn't have.
  it.todo(
    'sheet claims "(" and ")" count as an accepted special character — the real regex ' +
      '/[@$!%*?&\\-+=\\#.]+/ in password.schema.ts has no parentheses in it; a password like ' +
      '"Abcdefg1(" stays red on this rule. Contradiction to confirm with the business, not a ' +
      'bug to silently "fix" in the schema from a QA test.',
  )

  it('shows every requirement green once all five pass, with no "must meet requirements" banner', () => {
    renderChecklist('Abcdefg1@')

    expect(itemFor('At least 8 characters')).toHaveClass('text-green-600')
    expect(itemFor('One lowercase letter')).toHaveClass('text-green-600')
    expect(itemFor('One uppercase letter')).toHaveClass('text-green-600')
    expect(itemFor('One number')).toHaveClass('text-green-600')
    expect(itemFor('One special character')).toHaveClass('text-green-600')
    expect(screen.queryByText('Password must meet all requirements')).not.toBeInTheDocument()
  })

  // Sheet vs implementation contradiction: the sheet describes a "blue" in-progress state
  // for requirements. The component (src/features/auth/(components)/password-checklist.tsx)
  // only ever applies `text-green-600`/`bg-green-500` (passed) or
  // `text-destructive`/`bg-destructive` (failed) — there is no third/blue class anywhere.
  it.todo(
    'sheet describes a "blue" requirements-met-so-far state — PasswordChecklist has only ' +
      'red (failed) and green (passed) classes, no blue state exists in the real component. ' +
      'Contradiction to confirm with the business, not something to invent a test for.',
  )
})
