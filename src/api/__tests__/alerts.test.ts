import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RegistryMissingAlertRule } from '@/types/monitor'

const requestGet = vi.hoisted(() => vi.fn())
const requestPost = vi.hoisted(() => vi.fn())
const requestPut = vi.hoisted(() => vi.fn())
const requestDelete = vi.hoisted(() => vi.fn())

vi.mock('@/services/request', () => ({
  default: {
    get: requestGet,
    post: requestPost,
    put: requestPut,
    delete: requestDelete
  }
}))

describe('alerts api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requestGet.mockResolvedValue([])
    requestPost.mockResolvedValue({})
    requestPut.mockResolvedValue({})
    requestDelete.mockResolvedValue({})
  })

  it('omits empty serviceId values from alert rule queries', async () => {
    const { fetchAlertRules, exportAlertRules } = await import('../alerts')

    fetchAlertRules({
      serviceId: undefined,
      scope: 'system',
      startTime: 1,
      endTime: 2
    })
    exportAlertRules({
      serviceId: 'undefined',
      scope: 'system',
      startTime: 1,
      endTime: 2
    })

    expect(requestGet).toHaveBeenNthCalledWith(1, expect.any(String), {
      scope: 'system',
      startTime: 1,
      endTime: 2
    })
    expect(requestGet).toHaveBeenNthCalledWith(2, expect.any(String), {
      scope: 'system',
      startTime: 1,
      endTime: 2
    })
  })

  it('uses the dedicated registry_missing endpoints and typed payloads', async () => {
    const {
      fetchRegistryMissingAlertRules,
      saveRegistryMissingAlertRule,
      updateRegistryMissingAlertRule,
      deleteRegistryMissingAlertRule
    } = await import('../alerts')
    const rule: RegistryMissingAlertRule = {
      ruleId: 'registry-missing-auth',
      ruleType: 'registry_missing' as const,
      name: '认证服务注册缺失',
      serviceName: 'auth',
      forSeconds: 300,
      deployGraceSeconds: 120,
      severity: 'critical',
      enabled: true,
      channels: ['InApp', 'Email'],
      emailRecipients: ['oncall@example.com'],
      notifyOnRecovery: true
    }

    fetchRegistryMissingAlertRules()
    const { ruleId: _, ...newRule } = rule
    saveRegistryMissingAlertRule(newRule)
    updateRegistryMissingAlertRule(rule)
    deleteRegistryMissingAlertRule(rule.ruleId)

    expect(requestGet).toHaveBeenCalledWith(expect.stringContaining('metrics/v1/registry-missing-alert-rules'), {})
    expect(requestPost).toHaveBeenCalledWith(
      expect.stringContaining('metrics/v1/registry-missing-alert-rules/create'),
      expect.objectContaining({ serviceName: 'auth', channels: ['InApp', 'Email'] })
    )
    expect(requestPut).toHaveBeenCalledWith(
      expect.stringContaining('metrics/v1/registry-missing-alert-rules/registry-missing-auth'),
      expect.not.objectContaining({ ruleType: 'registry_missing' })
    )
    expect(requestDelete).toHaveBeenCalledWith(
      expect.stringContaining('metrics/v1/registry-missing-alert-rules/registry-missing-auth/delete'),
      {}
    )
  })
})
