const isProd = process.env.NODE_ENV === 'production'

function jsonLine(level: string, msg: string, extra?: unknown) {
  console.log(
    JSON.stringify({
      level,
      msg,
      ts: new Date().toISOString(),
      ...(extra !== undefined ? { extra } : {}),
    })
  )
}

export const log = {
  debug: isProd ? () => {} : (msg: string, extra?: unknown) => console.log(msg, extra ?? ''),
  info: (msg: string, extra?: unknown) =>
    isProd ? jsonLine('info', msg, extra) : console.log('[info]', msg, extra ?? ''),
  warn: (msg: string, extra?: unknown) =>
    isProd ? jsonLine('warn', msg, extra) : console.warn('[warn]', msg, extra ?? ''),
  error: (msg: string, extra?: unknown) =>
    isProd ? jsonLine('error', msg, extra) : console.error('[error]', msg, extra ?? ''),
}
