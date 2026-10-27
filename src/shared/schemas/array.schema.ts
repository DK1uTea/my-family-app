import { z } from 'zod'
import { getValidationMessage } from '@/lib/field-error'
import { zString } from './string.schema'

type ArrayRule = 'required' | `min:${number}`

export const zStringArray = (rules: ArrayRule[] = []) =>
  z.array(zString()).superRefine((value, ctx) => {
    for (const rule of rules) {
      if (rule === 'required' && value.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: getValidationMessage('fieldErrors.required'),
        })
        return
      }

      if (rule.startsWith('min:')) {
        const min = Number(rule.split(':')[1])
        if (value.length < min) {
          ctx.addIssue({
            code: 'custom',
            message: getValidationMessage('fieldErrors.minItems', { min }),
          })
          return
        }
      }
    }
  })
