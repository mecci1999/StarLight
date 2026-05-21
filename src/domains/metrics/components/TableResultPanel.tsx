import { defineComponent, PropType } from 'vue'
import { NCard } from 'naive-ui'
import ResultTable from '@/shared/components/ResultTable'

export default defineComponent({
  name: 'TableResultPanel',
  props: {
    columns: {
      type: Array as PropType<any[]>,
      required: true
    },
    data: {
      type: Array as PropType<any[]>,
      required: true
    },
    rowKey: {
      type: Function as PropType<(row: any) => string>,
      required: true
    }
  },
  setup(props) {
    return () => (
      <NCard title="表格结果" bordered={false} headerStyle={{ padding: '16px 0' }}>
        <ResultTable
          columns={props.columns as any}
          data={props.data as any}
          rowKey={props.rowKey}
          pagination={{ pageSize: 20 }}
        />
      </NCard>
    )
  }
})
