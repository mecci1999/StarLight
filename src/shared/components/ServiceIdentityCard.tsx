import { defineComponent } from 'vue'
import { NSpace, NTag } from 'naive-ui'
import ServiceHealthBadge, { type ServiceHealthStatus } from '@/shared/components/ServiceHealthBadge'
import './ServiceIdentityCard.scss'

type ServiceIdentityModel = {
  id?: string
  name: string
  displayName?: string
  owner?: string
  team?: string
  env?: string
  region?: string
  runtime?: string
  appKey?: string
  tags?: string[]
  repoUrl?: string
  runbookUrl?: string
  healthStatus?: ServiceHealthStatus
}

export default defineComponent({
  name: 'ServiceIdentityCard',
  props: {
    service: {
      type: Object as () => ServiceIdentityModel,
      required: true
    },
    compact: { type: Boolean, default: false }
  },
  emits: ['ownerClick', 'teamClick', 'tagClick'],
  setup(props, { emit, slots }) {
    return () => (
      <div
        class={[
          'service-identity-card',
          props.compact ? 'service-identity-card--compact' : 'service-identity-card--default'
        ]}>
        <div class="service-identity-card__content">
          <div class="service-identity-card__main">
            <div class="service-identity-card__heading">
              <h3 class="service-identity-card__title">{props.service.displayName || props.service.name}</h3>
              <ServiceHealthBadge status={props.service.healthStatus || 'unknown'} size="sm" />
            </div>
            <div class="service-identity-card__name">{props.service.name}</div>
            <div class="service-identity-card__tags">
              {props.service.owner && (
                <span class="service-identity-card__tag-action" onClick={() => emit('ownerClick', props.service.owner)}>
                  <NTag size="small" bordered={false}>
                    Owner: {props.service.owner}
                  </NTag>
                </span>
              )}
              {props.service.team && (
                <span class="service-identity-card__tag-action" onClick={() => emit('teamClick', props.service.team)}>
                  <NTag size="small" bordered={false}>
                    Team: {props.service.team}
                  </NTag>
                </span>
              )}
              {props.service.env && (
                <NTag size="small" bordered={false}>
                  Env: {props.service.env}
                </NTag>
              )}
              {props.service.region && (
                <NTag size="small" bordered={false}>
                  Region: {props.service.region}
                </NTag>
              )}
              {props.service.appKey && (
                <NTag size="small" bordered={false}>
                  AppKey: {props.service.appKey}
                </NTag>
              )}
              {props.service.runtime && (
                <NTag size="small" bordered={false}>
                  Runtime: {props.service.runtime}
                </NTag>
              )}
              {props.service.tags?.map((tag) => (
                <span class="service-identity-card__tag-action" key={tag} onClick={() => emit('tagClick', tag)}>
                  <NTag size="small" bordered={false}>
                    {tag}
                  </NTag>
                </span>
              ))}
            </div>
          </div>
          <NSpace vertical size="small" align="end" class="service-identity-card__links">
            {props.service.repoUrl && (
              <a class="service-identity-card__link" href={props.service.repoUrl} target="_blank">
                仓库
              </a>
            )}
            {props.service.runbookUrl && (
              <a class="service-identity-card__link" href={props.service.runbookUrl} target="_blank">
                Runbook
              </a>
            )}
            {slots.actions?.()}
          </NSpace>
        </div>
        {slots.footer?.()}
      </div>
    )
  }
})
