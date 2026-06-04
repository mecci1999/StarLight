import { computed, defineComponent, PropType } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, GaugeChart, GraphChart, HeatmapChart, MapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent,
  GraphicComponent,
  GeoComponent
} from 'echarts/components'
import { useChartTheme } from '@/hooks/useChartTheme'
import { merge } from 'lodash-es'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  MapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent,
  GraphicComponent,
  GeoComponent
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
    },
    onChartClick: {
      type: Function as PropType<(params: any) => void>,
      default: undefined
    },
    onChartDblclick: {
      type: Function as PropType<(params: any) => void>,
      default: undefined
    }
  },
  setup(props) {
    const { themeOptions, loadingOptions } = useChartTheme()
    const updateOptions = {
      notMerge: true,
      replaceMerge: ['xAxis', 'yAxis', 'series']
    }
    const stopWheelPropagation = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return
      event.stopPropagation()
    }
    const stopPointerPropagation = (event: PointerEvent) => {
      event.stopPropagation()
    }

    // Merge global theme options with props.option
    // We use a computed property to ensure reactivity
    const finalOption = computed(() => {
      // Use lodash merge to deeply merge the theme defaults with the provided option
      // provided option takes precedence
      return merge({}, themeOptions.value, props.option)
    })

    return () => (
      <div
        class="chart-shell"
        style={{ height: props.height, width: '100%', overflow: 'hidden' }}
        onWheel={stopWheelPropagation}
        onPointerdown={stopPointerPropagation}
        onPointermove={stopPointerPropagation}
        onPointerup={stopPointerPropagation}>
        <VChart
          class="chart"
          option={finalOption.value}
          updateOptions={updateOptions}
          loading={props.loading}
          loadingOptions={loadingOptions.value}
          autoresize={{ throttle: 100 }}
          style={{ width: '100%', height: '100%' }}
          onClick={props.onChartClick}
          onDblclick={props.onChartDblclick}
        />
      </div>
    )
  }
})
