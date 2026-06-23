import * as metrics from './metrics'
import * as logs from './logs'
import * as alerts from './alerts'
import * as subscription from './subscription'
import * as auth from './auth'
import * as user from './user'
import * as videoUpscale from './videoUpscale'
import * as microApps from './microApps'
import url from './url'

const api = {
  metrics,
  logs,
  alerts,
  subscription,
  auth,
  user,
  videoUpscale,
  microApps,
  url
}

export * from './metrics'
export * from './logs'
export * from './alerts'
export * from './subscription'
export * from './auth'
export * from './user'
export * from './videoUpscale'
export * from './microApps'

export default api
