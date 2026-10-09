/** Joins class names, skipping falsy values: cx('a', cond && 'b') */
export const cx = (...classes) => classes.filter(Boolean).join(' ')
