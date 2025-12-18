import { defineComponent, ref, computed, provide, inject } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, GaugeChart, GraphChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent
])

export default defineComponent({
  name: 'BaseChart',
  props: {
    option: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  setup(props) {
    const isDark = computed(() => {
      // Simple detection or use a store if available.
      // For now, let's assume light mode default or check html attribute if possible,
      // but ECharts auto theme usually works well if we pass colors.
      // We will pass explicit colors in options.
      return document.documentElement.getAttribute('data-theme') === 'dark'
    })

    return () => (
      <div style={{ height: props.height, width: '100%' }}>
        <VChart
          class="chart"
          option={props.option}
          loading={props.loading}
          autoresize
          theme={isDark.value ? 'dark' : undefined}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    )
  }
})
