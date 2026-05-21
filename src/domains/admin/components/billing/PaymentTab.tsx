import { defineComponent, ref, onMounted, watch } from 'vue'
import { NCard, NButton, NTag, NSpace } from 'naive-ui'
import ResultTable from '@/shared/components/ResultTable'
import * as api from '@/api/subscription'
import './PaymentTab.scss'

export default defineComponent({
  name: 'BillingPayment',
  setup() {
    const loading = ref(false)
    const methodsLoading = ref(false)
    const methodsError = ref(false)
    const paymentMethods = ref<api.PaymentMethodItem[]>([])
    const orderLoading = ref(false)
    const historyError = ref(false)
    const currentOrder = ref<api.PaymentOrderStatusResult | null>(null)
    const route = useRoute()

    const formatAmount = (currency?: string | null, amount?: number | null) => {
      if (typeof amount !== 'number') return '未知金额'
      return `${currency || '未知币种 '}${amount}`
    }
    const isSafeExternalUrl = (url?: string | null) => {
      if (!url) return false
      try {
        const parsed = new URL(url, window.location.origin)
        return ['http:', 'https:'].includes(parsed.protocol)
      } catch {
        return false
      }
    }
    const openExternalUrl = (url?: string | null) => {
      if (!isSafeExternalUrl(url)) return false
      window.open(new URL(url as string, window.location.origin).toString(), '_blank', 'noopener,noreferrer')
      return true
    }

    const columns = [
      { title: '日期', key: 'date' },
      { title: '说明', key: 'description' },
      { title: '金额', key: 'amount' },
      {
        title: '状态',
        key: 'status',
        render(row: any) {
          return <NTag type={row.status === 'paid' ? 'success' : 'warning'}>{row.status}</NTag>
        }
      },
      {
        title: '发票',
        key: 'invoice',
        render(row: any) {
          return isSafeExternalUrl(row.downloadUrl) ? (
            <a href={row.downloadUrl} target="_blank" rel="noopener noreferrer" class="billing-payment-tab__link">
              下载
            </a>
          ) : (
            <span class="billing-payment-tab__empty-text">暂无</span>
          )
        }
      }
    ]

    const data = ref<any[]>([])

    const fetchPendingOrder = async () => {
      const orderId = typeof route.query.orderId === 'string' ? route.query.orderId : ''
      if (!orderId) {
        currentOrder.value = null
        return
      }

      orderLoading.value = true
      try {
        currentOrder.value = await api.queryPaymentOrder({ orderId })
      } catch (error) {
        console.error('Failed to query payment order:', error)
        currentOrder.value = null
      } finally {
        orderLoading.value = false
      }
    }

    const fetchPaymentMethods = async () => {
      methodsLoading.value = true
      try {
        const res = await api.getPaymentMethods()
        paymentMethods.value = res?.methods || []
        methodsError.value = false
      } catch (error) {
        console.error('Failed to fetch payment methods:', error)
        paymentMethods.value = []
        methodsError.value = true
      } finally {
        methodsLoading.value = false
      }
    }

    const fetchBillingHistory = async () => {
      loading.value = true
      try {
        const res = await api.getBillingHistory({ limit: 20, offset: 0 })
        data.value = (res?.bills || []).map((item) => ({
          key: item.id,
          date: item.createdAt?.slice(0, 10) || '-',
          description: item.planName || item.billNumber,
          amount: formatAmount(item.currency, item.amount),
          status: item.status,
          downloadUrl: item.downloadUrl
        }))
        historyError.value = false
      } catch (error) {
        console.error('Failed to fetch billing history:', error)
        data.value = []
        historyError.value = true
      } finally {
        loading.value = false
      }
    }

    onMounted(async () => {
      await Promise.all([fetchPaymentMethods(), fetchBillingHistory(), fetchPendingOrder()])
    })

    watch(
      () => route.query.orderId,
      async () => {
        await fetchPendingOrder()
      }
    )

    return () => (
      <div class="billing-payment-tab">
        <div class="billing-payment-tab__header">
          <h3 class="billing-payment-tab__title">可用支付方式</h3>
          <NButton type="primary" secondary loading={methodsLoading.value} onClick={fetchPaymentMethods}>
            刷新支付方式
          </NButton>
        </div>

        {currentOrder.value && (
          <NCard class="billing-payment-tab__card">
            <div class="billing-payment-tab__order-header">
              <div>
                <div class="billing-payment-tab__order-title">待处理支付订单</div>
                <div class="billing-payment-tab__order-meta">
                  {currentOrder.value.order.planName} / {currentOrder.value.order.orderNumber}
                </div>
              </div>
              <NTag type={currentOrder.value.order.status === 'paid' ? 'success' : 'warning'}>
                {currentOrder.value.statusDescription}
              </NTag>
            </div>

            <NSpace vertical size={8} class="billing-payment-tab__order-actions">
              <div>支付方式：{currentOrder.value.order.paymentMethod}</div>
              <div>金额：{formatAmount(currentOrder.value.order.currency, currentOrder.value.order.amount)}</div>
              <div>过期时间：{currentOrder.value.order.expiresAt || '—'}</div>
            </NSpace>

            {currentOrder.value.nextAction?.target && (
              <div class="billing-payment-tab__order-actions">
                <NButton
                  type="primary"
                  loading={orderLoading.value}
                  onClick={() => {
                    if (!openExternalUrl(currentOrder.value?.nextAction?.target)) {
                      console.error('Unsafe payment action URL:', currentOrder.value?.nextAction?.target)
                    }
                  }}>
                  {currentOrder.value.nextAction.label}
                </NButton>
              </div>
            )}
          </NCard>
        )}

        <div class="billing-payment-tab__methods-grid">
          {(paymentMethods.value.length ? paymentMethods.value : []).map((method) => (
            <NCard>
              <div class="billing-payment-tab__method-header">
                <div>
                  <div class="billing-payment-tab__method-title">{method.displayName}</div>
                  <div class="billing-payment-tab__method-desc">{method.description || '暂无说明'}</div>
                </div>
                <NTag type={method.enabled ? 'success' : 'warning'}>{method.enabled ? '已启用' : '未启用'}</NTag>
              </div>

              <NSpace vertical size={8} class="billing-payment-tab__order-actions">
                <div>渠道标识：{method.name}</div>
                <div>支持币种：{method.supportedCurrencies?.join(' / ') || '—'}</div>
                <div>
                  手续费：
                  {typeof method.fees?.value === 'number'
                    ? `${method.fees.value}%${method.fees.fixed ? ` + ${method.fees.fixed}` : ''}`
                    : '按渠道配置'}
                </div>
              </NSpace>
            </NCard>
          ))}

          {!methodsLoading.value && methodsError.value && (
            <NCard class="billing-payment-tab__hint-card billing-payment-tab__hint-card--wide">
              <div class="billing-payment-tab__hint">支付方式暂时不可用，请稍后重试或检查后端支付渠道服务。</div>
            </NCard>
          )}

          {!methodsLoading.value && !methodsError.value && paymentMethods.value.length === 0 && (
            <NCard class="billing-payment-tab__hint-card billing-payment-tab__hint-card--wide">
              <div class="billing-payment-tab__hint">当前没有可展示的支付方式，请检查后端支付渠道配置。</div>
            </NCard>
          )}
        </div>

        <h3 class="billing-payment-tab__title billing-payment-tab__history-title">账单历史</h3>
        {historyError.value ? (
          <NCard class="billing-payment-tab__history-alert">
            <div class="billing-payment-tab__hint">账单历史暂时不可用，请稍后重试。</div>
          </NCard>
        ) : null}
        <ResultTable columns={columns} data={data.value} loading={loading.value} rowKey="key" />
      </div>
    )
  }
})
