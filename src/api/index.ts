import * as metrics from './metrics'
import * as logs from './logs'
import * as alerts from './alerts'
import * as subscription from './subscription'
import * as auth from './auth'
import * as user from './user'
import url from './url'

const api = {
  metrics,
  logs,
  alerts,
  subscription,
  auth,
  user,
  url
}

export * from './metrics'
export * from './logs'
export * from './alerts'
export * from './subscription'
export * from './auth'
export * from './user'

export default api
