import { defineComponent } from 'vue'
import { NButton, NSelect, NSpace, NCard } from 'naive-ui'
import './ScopeBar.scss'

type ScopeValue = {
  service?: string | null
  env?: string | null
  region?: string | null
  team?: string | null
  tags?: string | null
}

type ScopeOption = {
  label: string
  value: string
}

export default defineComponent({
  name: 'ScopeBar',
  props: {
    value: {
      type: Object as () => ScopeValue,
      required: true
    },
    options: {
      type: Object as () => {
        services?: ScopeOption[]
        envs?: ScopeOption[]
        regions?: ScopeOption[]
        teams?: ScopeOption[]
        tags?: ScopeOption[]
      },
      default: () => ({})
    },
    mode: {
      type: String as () => 'global' | 'service',
      default: 'global'
    }
  },
  emits: ['update:value', 'change', 'reset'],
  setup(props, { emit, slots }) {
    const updateField = (key: keyof ScopeValue, fieldValue: string | null) => {
      const nextValue = {
        ...props.value,
        [key]: fieldValue
      }
      emit('update:value', nextValue)
      emit('change', nextValue)
    }

    const reset = () => {
      const nextValue = {
        service: null,
        env: null,
        region: null,
        team: null,
        tags: null
      }
      emit('update:value', nextValue)
      emit('change', nextValue)
      emit('reset')
    }

    return () => (
      <NCard bordered={false} class="scope-bar">
        <div class="scope-bar__content">
          <NSpace align="center" wrap>
            {props.options.services?.length ? (
              <NSelect
                value={props.value.service || null}
                options={props.options.services}
                style={{ width: '220px' }}
                placeholder="选择服务"
                clearable
                onUpdateValue={(value) => updateField('service', value)}
              />
            ) : null}
            {props.mode === 'global' && props.options.envs?.length ? (
              <NSelect
                value={props.value.env || null}
                options={props.options.envs}
                style={{ width: '160px' }}
                placeholder="环境"
                clearable
                onUpdateValue={(value) => updateField('env', value)}
              />
            ) : null}
            {props.mode === 'global' && props.options.regions?.length ? (
              <NSelect
                value={props.value.region || null}
                options={props.options.regions}
                style={{ width: '160px' }}
                placeholder="区域"
                clearable
                onUpdateValue={(value) => updateField('region', value)}
              />
            ) : null}
            {props.mode === 'global' && props.options.teams?.length ? (
              <NSelect
                value={props.value.team || null}
                options={props.options.teams}
                style={{ width: '160px' }}
                placeholder="团队"
                clearable
                onUpdateValue={(value) => updateField('team', value)}
              />
            ) : null}
            {props.mode === 'global' && props.options.tags?.length ? (
              <NSelect
                value={props.value.tags || null}
                options={props.options.tags}
                style={{ width: '180px' }}
                placeholder="标签"
                clearable
                onUpdateValue={(value) => updateField('tags', value)}
              />
            ) : null}
            {slots.extraFilters?.()}
          </NSpace>
          <NSpace align="center">
            {slots.actions?.()}
            <NButton size="small" quaternary onClick={reset}>
              重置筛选
            </NButton>
          </NSpace>
        </div>
      </NCard>
    )
  }
})
