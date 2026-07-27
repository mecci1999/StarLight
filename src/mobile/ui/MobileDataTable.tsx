import { Loading } from 'vant'
import type { VNode } from 'vue'
import './MobileUI.scss'

export interface DataTableColumn {
  key: string
  label: string
  render?: (value: unknown, row: Record<string, unknown>, index: number) => VNode
}

export interface MobileDataTableProps {
  columns: DataTableColumn[]
  data: Record<string, unknown>[]
  loading?: boolean
  onRowClick?: (row: Record<string, unknown>, index: number) => void
}

export default defineComponent({
  name: 'MobileDataTable',
  props: {
    columns: { type: Array as PropType<DataTableColumn[]>, default: () => [] },
    data: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    loading: { type: Boolean, default: false },
    onRowClick: { type: Function as PropType<(row: Record<string, unknown>, index: number) => void>, default: null }
  },
  setup(props) {
    return () => (
      <div class="mobile-data-table">
        {props.loading ? (
          <div class="mobile-data-table__loading">
            <Loading size="24px" color="var(--color-text-3)" />
          </div>
        ) : (
          <table class="mobile-data-table__table">
            <thead class="mobile-data-table__header">
              <tr>
                {props.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody class="mobile-data-table__body">
              {props.data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => props.onRowClick?.(row, rowIndex)}
                  style={{ cursor: typeof props.onRowClick === 'function' ? 'pointer' : undefined }}>
                  {props.columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row, rowIndex) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }
})
