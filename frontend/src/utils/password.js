// No 0/O or 1/l/I: temporary passwords get read out loud or copied by hand.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/** A readable random temporary password, e.g. "Hk7mRtq3Xw". */
export function generatePassword(length = 10) {
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join('')
}
