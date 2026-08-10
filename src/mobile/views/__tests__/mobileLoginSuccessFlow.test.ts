import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('mobile login success flow', () => {
  it('navigates after persisting the login response without waiting for profile refresh', async () => {
    const source = await readFile(new URL('../Login.tsx', import.meta.url), 'utf8')
    const navigation = source.indexOf('await router.push({ name: targetRoute })')
    const backgroundRefresh = source.indexOf('void api')

    expect(navigation).toBeGreaterThan(-1)
    expect(backgroundRefresh).toBeGreaterThan(navigation)
    expect(source).toContain('.getUserInfo(loginUserId)')
    expect(source).toContain("showMobileFeedback('success', '登录成功')")
    expect(source).toContain("showMobileFeedback('error', '登录成功，但页面跳转失败，请重试')")
    expect(source).toContain("import { mobileFeedback } from '@/mobile/services/mobileFeedback'")
    expect(source).toContain('mobileFeedback[type](message)')
    expect(source).toContain('NAVIGATION_START target=${targetRoute}')
    expect(source).toContain('NAVIGATION_FAILED target=${targetRoute}')
    expect(source).toContain('LOGIN_FLOW_FAILED stage=${state.loginDiagnostic')
    expect(source).toContain(
      '.verifyCode({ email: state.email, type: getVerifyCodeType() }, { suppressSuccessMessage: true })'
    )
    expect(source).toContain("mobileFeedback.success('验证码已发送，请查收邮箱')")
  })
})
