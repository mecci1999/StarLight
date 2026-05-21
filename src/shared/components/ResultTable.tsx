import { defineComponent } from 'vue'
import { NDataTable } from 'naive-ui'
import './ResultTable.scss'

export default defineComponent({
  name: 'ResultTable',
  props: {
    columns: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      default: () => []
    },
    loading: { type: Boolean, default: false },
    rowKey: {
      type: [String, Function],
      default: 'id'
    },
    density: {
      type: String as () => 'compact' | 'default' | 'loose',
      default: 'default'
    },
    pagination: {
      type: [Object, Boolean],
      default: false
    },
    flexHeight: { type: Boolean, default: true },
    singleLine: { type: Boolean, default: false },
    bordered: { type: Boolean, default: false },
    rowClassName: {
      type: [String, Function],
      default: undefined
    },
    rowProps: {
      type: Function,
      default: undefined
    }
  },
  emits: ['rowClick', 'update:checkedRowKeys'],
  setup(props, { emit }) {
    const getSize = () => {
      switch (props.density) {
        case 'compact':
          return 'small'
        case 'loose':
          return 'large'
        default:
          return 'medium'
      }
    }

    return () => (
      <NDataTable
        class="result-table"
        flexHeight={props.flexHeight}
        loading={props.loading}
        columns={props.columns as any}
        data={props.data as any}
        pagination={props.pagination as any}
        bordered={props.bordered}
        singleLine={props.singleLine}
        rowKey={props.rowKey as any}
        rowClassName={props.rowClassName as any}
        size={getSize() as any}
        rowProps={
          props.rowProps
            ? (props.rowProps as any)
            : (row: any) => ({
                onClick: () => emit('rowClick', row)
              })
        }
        onUpdateCheckedRowKeys={(keys: (string | number)[]) => emit('update:checkedRowKeys', keys)}
      />
    )
  }
})
