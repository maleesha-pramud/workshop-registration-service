import { useState } from 'react'
import { useToast } from './useToast'

/**
 * Shared submit handling for forms that call the API.
 * Field-level validation errors are returned in `errors` (to show under inputs);
 * anything else lands in `formError` (to show in an alert).
 *
 *   const { errors, formError, submitting, submit } = useFormSubmit(onDone, 'Account created')
 *   submit(() => usersApi.create(form))
 *
 * `mapError(err)` can turn specific API error codes into field errors, e.g.
 *   (err) => (err.code === 'EMAIL_TAKEN' ? { email: err.message } : {})
 */
export function useFormSubmit(onDone, successMessage, mapError) {
  const { notify } = useToast()
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (action) => {
    setSubmitting(true)
    setErrors({})
    setFormError(null)
    try {
      await action()
      if (successMessage) notify(successMessage)
      onDone()
    } catch (err) {
      const fieldErrors = { ...(err.fieldErrors?.() ?? {}), ...(mapError?.(err) ?? {}) }
      setErrors(fieldErrors)
      if (!Object.keys(fieldErrors).length) setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return { errors, formError, submitting, submit }
}
