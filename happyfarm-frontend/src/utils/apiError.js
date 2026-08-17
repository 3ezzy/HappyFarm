/**
 * Pulls a human-readable message out of a failed axios/Laravel response.
 * The global apiClient interceptor deliberately stays silent on 422s (see
 * services/api/client.js) so each form can show the specific field error
 * inline instead of a generic toast — this is what those `onError` handlers
 * use to do that. Covers both FormRequest validation payloads
 * ({ errors: { field: [msg] } }) and manual controller error responses
 * ({ error: 'msg' }).
 */
export function apiErrorMessage(error, fallback) {
  const data = error?.response?.data
  const errors = data?.errors
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors)[0]
    const msg = firstKey ? errors[firstKey] : null
    if (msg) return Array.isArray(msg) ? msg[0] : msg
  }
  return data?.error || data?.message || fallback
}
