<template>
  <div class="traffic-dialog">
    <div class="traffic-summary">
      <div>
        <strong>{{ traffic.today }}</strong>
        <small>{{ unitLabel(traffic.today) }} today</small>
      </div>
      <div>
        <strong>{{ traffic.total }}</strong>
        <small>{{ unitLabel(traffic.total) }} · last 7 days</small>
      </div>
      <span class="traffic-item-name">{{ itemName }}</span>
    </div>

    <svg class="traffic-chart" viewBox="0 0 560 190" role="img" :aria-label="chartLabel">
      <line v-for="tick in ticks" :key="tick.value" x1="36" :y1="tick.y" x2="548" :y2="tick.y" class="grid" />
      <text v-for="tick in ticks" :key="`label-${tick.value}`" x="30" :y="tick.y + 3" text-anchor="end"
        class="axis">{{ tick.value }}</text>
      <polyline :points="pointsString" class="line" />
      <circle v-for="(point, index) in points" :key="index" :cx="point[0]" :cy="point[1]" r="3" class="dot">
        <title>{{ pointTitle(index) }}</title>
      </circle>
      <text v-for="(day, index) in traffic.days" :key="day.date" :x="xPosition(index)" y="184"
        :text-anchor="labelAnchor(index)" class="axis">{{ pointLabel(day.date, index) }}</text>
    </svg>

    <p class="traffic-hint">{{ hint }}</p>
  </div>
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
  itemName: string
  unitSingular: string
  unitPlural: string
  hint: string
}>()

const max = computed(() => Math.max(1, ...props.traffic.days.map(day => day.count)))
const ticks = computed(() => {
  const values = [...new Set([max.value, Math.round(max.value / 2), 0])]
  return values.map(value => ({
    value,
    y: 16 + 152 - (value / max.value) * 152
  }))
})
const points = computed(() => props.traffic.days.map((day, index) => [
  xPosition(index),
  16 + 152 - (day.count / max.value) * 152
]))
const pointsString = computed(() => points.value.map(point => point.join(',')).join(' '))
const chartLabel = computed(() =>
  `${props.unitPlural} over the last 7 days for ${props.itemName}`
)

function xPosition(index: number) {
  return 36 + (index / Math.max(1, props.traffic.days.length - 1)) * 512
}

function unitLabel(value: number) {
  return value === 1 ? props.unitSingular : props.unitPlural
}

function pointTitle(index: number) {
  const day = props.traffic.days[index]
  return day ? `${dayLabel(day.date)}: ${day.count} ${unitLabel(day.count)}` : ''
}

function pointLabel(date: string, index: number) {
  return index === props.traffic.days.length - 1 ? 'Today' : dayLabel(date)
}

function labelAnchor(index: number) {
  return index === props.traffic.days.length - 1 ? 'end' : 'middle'
}

function dayLabel(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
}
</script>

<style lang="scss" scoped>
.traffic-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.traffic-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1.5rem;

  div {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }

  strong {
    font-size: 1.5rem;
  }

  small {
    color: var(--p-text-muted-color);
    font-size: 0.75rem;
  }
}

.traffic-item-name {
  margin-left: auto;
  overflow: hidden;
  max-width: 100%;
  color: var(--p-text-muted-color);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.traffic-chart {
  width: 100%;
  height: auto;

  .grid {
    stroke: var(--p-content-border-color);
    stroke-width: 1;
  }

  .axis {
    fill: var(--p-text-muted-color);
    font-family: var(--font-code);
    font-size: 10px;
  }

  .line {
    fill: none;
    stroke: var(--p-primary-color);
    stroke-width: 2;
  }

  .dot {
    fill: var(--p-primary-color);
  }
}

.traffic-hint {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
  line-height: 1.5;
}

@media (max-width: 560px) {
  .traffic-summary {
    gap: 0.9rem 1.2rem;
  }

  .traffic-item-name {
    flex-basis: 100%;
    margin-left: 0;
  }
}
</style>
