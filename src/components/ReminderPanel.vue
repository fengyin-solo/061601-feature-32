<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { getReminderTypeLabel, getReminderTypeColor } from '../utils/gameUtils'
import type { ReminderType, Reminder } from '../types/game'

const gameStore = useGameStore()

const expanded = ref(true)
const filterType = ref<ReminderType | 'all'>('all')

const filteredReminders = computed(() => {
  const list = gameStore.upcomingReminders
  if (filterType.value === 'all') return list
  return list.filter(r => r.type === filterType.value)
})

const availableTypes = computed(() => {
  const types = new Set(gameStore.upcomingReminders.map(r => r.type))
  return Array.from(types)
})

function daysUntil(targetDay: number): number {
  return targetDay - gameStore.day
}

function daysUntilLabel(targetDay: number): string {
  const d = daysUntil(targetDay)
  if (d === 1) return '明天'
  if (d === 2) return '后天'
  return `${d}天后`
}

function dismiss(reminder: Reminder) {
  gameStore.dismissReminder(reminder.id)
}

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="reminder-panel card" :class="{ collapsed: !expanded }">
    <div class="reminder-header" @click="toggleExpand">
      <div class="header-left">
        <span class="header-icon">🔔</span>
        <span class="header-title">近期提醒</span>
        <span v-if="gameStore.activeReminderCount > 0" class="reminder-badge">
          {{ gameStore.activeReminderCount }}
        </span>
      </div>
      <span class="toggle-icon" :class="{ rotated: expanded }">▼</span>
    </div>

    <div v-if="expanded" class="reminder-body">
      <div v-if="availableTypes.length > 1" class="filter-bar">
        <button
          class="filter-btn"
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          全部
        </button>
        <button
          v-for="t in availableTypes"
          :key="t"
          class="filter-btn"
          :class="{ active: filterType === t }"
          @click="filterType = t"
        >
          {{ getReminderTypeLabel(t) }}
        </button>
      </div>

      <div v-if="filteredReminders.length > 0" class="reminder-list">
        <div
          v-for="reminder in filteredReminders"
          :key="reminder.id"
          class="reminder-item"
          :class="'type-' + reminder.type"
        >
          <div class="reminder-main">
            <div class="reminder-title-row">
              <span
                class="reminder-type-dot"
                :style="{ backgroundColor: getReminderTypeColor(reminder.type) }"
              ></span>
              <span class="reminder-title">{{ reminder.title }}</span>
            </div>
            <p class="reminder-desc">{{ reminder.description }}</p>
            <div class="reminder-meta">
              <span class="reminder-when">
                📅 第{{ reminder.targetDay }}天（{{ daysUntilLabel(reminder.targetDay) }}）
              </span>
            </div>
          </div>
          <button class="dismiss-btn" @click.stop="dismiss(reminder)" title="关闭提醒">
            ✕
          </button>
        </div>
      </div>

      <div v-else class="empty-reminder">
        <span class="empty-icon">✨</span>
        <span>暂无近期提醒</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reminder-panel {
  padding: 16px 20px;
  transition: all 0.3s;
}

.reminder-panel.collapsed {
  padding: 12px 20px;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.reminder-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;
  color: white;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.toggle-icon {
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.3s;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.reminder-body {
  margin-top: 12px;
  animation: fadeIn 0.3s ease-out;
}

.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.filter-btn.active {
  background: var(--accent-primary);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: var(--accent-light);
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reminder-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--border-color);
  transition: all 0.2s;
}

.reminder-item:hover {
  transform: translateX(2px);
}

.reminder-item.type-birthday {
  border-left-color: #ec4899;
  background: #fdf2f8;
}

[data-theme='dark'] .reminder-item.type-birthday {
  background: #500724;
}

.reminder-item.type-conflict {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

[data-theme='dark'] .reminder-item.type-conflict {
  background: #451a03;
}

.reminder-item.type-story {
  border-left-color: #8b5cf6;
  background: #faf5ff;
}

[data-theme='dark'] .reminder-item.type-story {
  background: #3b0764;
}

.reminder-item.type-affinity {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

[data-theme='dark'] .reminder-item.type-affinity {
  background: #172554;
}

.reminder-main {
  flex: 1;
  min-width: 0;
}

.reminder-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reminder-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.reminder-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.reminder-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 4px;
}

.reminder-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reminder-when {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 4px;
}

.dismiss-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.dismiss-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

[data-theme='dark'] .dismiss-btn:hover {
  background: #7f1d1d;
  color: #fca5a5;
}

.empty-reminder {
  text-align: center;
  padding: 20px 0;
  color: var(--text-muted);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.empty-icon {
  font-size: 24px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
