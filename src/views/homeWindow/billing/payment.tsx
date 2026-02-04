import { defineComponent, ref } from 'vue'
import { NCard, NDataTable, NButton, NTag, useMessage } from 'naive-ui'

export default defineComponent({
  name: 'BillingPayment',
  setup() {
    const message = useMessage()

    const columns = [
      { title: 'Date', key: 'date' },
      { title: 'Description', key: 'description' },
      { title: 'Amount', key: 'amount' },
      {
        title: 'Status',
        key: 'status',
        render(row: any) {
          return <NTag type={row.status === 'paid' ? 'success' : 'warning'}>{row.status}</NTag>
        }
      },
      {
        title: 'Invoice',
        key: 'invoice',
        render: () => (
          <NButton size="small" text type="primary">
            Download
          </NButton>
        )
      }
    ]

    const data = [
      { key: 1, date: '2023-10-01', description: 'Pro Plan Subscription', amount: '$29.00', status: 'paid' },
      { key: 2, date: '2023-09-01', description: 'Pro Plan Subscription', amount: '$29.00', status: 'paid' },
      { key: 3, date: '2023-08-01', description: 'Pro Plan Subscription', amount: '$29.00', status: 'paid' }
    ]

    return () => (
      <div class="p-4">
        <div class="mb-6 flex justify-between items-center">
          <h3 class="text-lg font-bold">Payment Methods</h3>
          <NButton type="primary">Add Payment Method</NButton>
        </div>
        <NCard class="mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="bg-blue-100 p-2 rounded text-blue-600 font-bold">VISA</div>
              <div>
                <div class="font-bold">•••• •••• •••• 4242</div>
                <div class="text-gray-500 text-sm">Expires 12/24</div>
              </div>
            </div>
            <NTag type="success">Default</NTag>
          </div>
        </NCard>

        <h3 class="text-lg font-bold mb-4">Billing History</h3>
        <NDataTable columns={columns} data={data} />
      </div>
    )
  }
})
