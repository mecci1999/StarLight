var a,
  r =
    (((a = r || {}).TRACE = 'trace'),
    (a.DEBUG = 'debug'),
    (a.INFO = 'info'),
    (a.WARN = 'warn'),
    (a.ERROR = 'error'),
    (a.FATAL = 'fatal'),
    a),
  s = ((a) => (
    (a.APPLICATION = 'application'),
    (a.SYSTEM = 'system'),
    (a.ACCESS = 'access'),
    (a.ERROR = 'error'),
    (a.AUDIT = 'audit'),
    a
  ))(s || {}),
  A = ((a) => ((a.JSON = 'json'), (a.CSV = 'csv'), a))(A || {})
export { r as L, s as a, A as b }
