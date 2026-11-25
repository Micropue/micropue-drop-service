<template>
  <button type="button" class="traffic-badge" :aria-label="summaryLabel" :title="summaryTitle">
    <svg class="traffic-spark" viewBox="0 0 56 16" preserveAspectRatio="none" aria-hidden="true">
      <polyline :points="sparkline" />
    </svg>
    <span class="traffic-today">{{ traffic.today }}</span>
    <span class="traffic-unit">{{ unitLabel(traffic.today) }}</span>
  </button>
</template>

<script setup lang="ts">
interface TrafficDay {
  date: string
  count: number
}

interface TrafficSummary {
  today: number
  days: TrafficDay[]
  total: number
}

const props = defineProps<{
  traffic: TrafficSummary
  subject: string
  unitSingular: string
  unitPlural: string
}>()

const sparkline = computed(() => {
  const values = props.traffic.days.map(day => day.count)
  const max = Math.max(1, ...values)
  return values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 56
    const y = 16 - (value / max) * 14 - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
})

const summaryLabel = computed(() =>
  `Traffic for ${props.subject}: ${props.traffic.today} ${unitLabel(props.traffic.today)} today, ` +
  `${props.traffic.total} in the last 7 days`
)
const summaryTitle = computed(() =>
  `${props.traffic.today} today · ${props.traffic.total} in the last 7 days`
)

function unitLabel(value: number) {
  return value === 1 ? props.unitSingular : props.unitPlural
}
</script>

<style lang="scss" scoped>
.traffic-badge {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: auto;
  height: 36px;
  padding: 0 0.4rem;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--p-text-muted-color);
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: var(--p-content-hover-background);
    color: var(--p-text-color);
  }
}

.traffic-today {
  color: var(--p-text-color);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.traffic-unit {
  color: var(--p-text-muted-color);
  font-family: inherit;
  font-size: 11px;
  line-height: 1;
}

.traffic-spark {
  width: 56px;
  height: 14px;
  overflow: visible;

  polyline {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    vector-effect: non-scaling-stroke;
  }
}

@media (max-width: 760px) {
  .traffic-spark {
    display: none;
  }
}
</style>
