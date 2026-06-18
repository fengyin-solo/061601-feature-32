import type { TimeOfDay, MoodLevel, GameConfig, CharacterConfig, Reminder, ReminderType, GameEventConfig } from '../types/game'

export function getMoodLevel(mood: number): MoodLevel {
  if (mood >= 80) return 'happy'
  if (mood >= 60) return 'good'
  if (mood >= 40) return 'neutral'
  if (mood >= 20) return 'bad'
  return 'angry'
}

export function getMoodColor(mood: number): string {
  const level = getMoodLevel(mood)
  const colors: Record<MoodLevel, string> = {
    happy: '#22c55e',
    good: '#84cc16',
    neutral: '#eab308',
    bad: '#f97316',
    angry: '#ef4444'
  }
  return colors[level]
}

export function getMoodLabel(mood: number): string {
  const level = getMoodLevel(mood)
  const labels: Record<MoodLevel, string> = {
    happy: '开心',
    good: '不错',
    neutral: '一般',
    bad: '低落',
    angry: '生气'
  }
  return labels[level]
}

export function getTimeLabel(time: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    morning: '早晨',
    afternoon: '下午',
    evening: '傍晚',
    night: '深夜'
  }
  return labels[time]
}

export function getTimeIcon(time: TimeOfDay): string {
  const icons: Record<TimeOfDay, string> = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙'
  }
  return icons[time]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getAffinityColor(affinity: number, maxAffinity: number): string {
  const ratio = affinity / maxAffinity
  if (ratio >= 0.8) return '#ec4899'
  if (ratio >= 0.6) return '#f472b6'
  if (ratio >= 0.4) return '#fb923c'
  if (ratio >= 0.2) return '#fbbf24'
  if (ratio >= 0) return '#94a3b8'
  return '#64748b'
}

export function getAffinityStage(affinity: number): string {
  if (affinity >= 80) return '恋人'
  if (affinity >= 60) return '亲密'
  if (affinity >= 40) return '好友'
  if (affinity >= 20) return '朋友'
  if (affinity >= 0) return '相识'
  return '陌生'
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#94a3b8',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
  }
  return colors[rarity] || '#94a3b8'
}

export function getRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity] || '普通'
}

export function getNextTimeSlot(current: TimeOfDay, timeSlots: TimeOfDay[]): TimeOfDay {
  const index = timeSlots.indexOf(current)
  if (index < timeSlots.length - 1) {
    return timeSlots[index + 1]
  }
  return timeSlots[0]
}

export function isGiftLiked(giftId: string, character: CharacterConfig): boolean {
  return character.favoriteGifts.includes(giftId)
}

export function isGiftDisliked(giftId: string, character: CharacterConfig): boolean {
  return character.dislikedGifts.includes(giftId)
}

export function calculateChatAffinity(
  topic: string,
  character: CharacterConfig,
  mood: number,
  timeOfDay: TimeOfDay
): number {
  const topicConfig = character.chatTopics.find(t => t.topic === topic)
  let baseChange = topicConfig ? topicConfig.affinity : 0

  const moodMultiplier = 0.5 + (mood / 100)
  baseChange *= moodMultiplier

  if (timeOfDay === 'night' && character.baseMood < 50) {
    baseChange *= 0.7
  }
  if (timeOfDay === 'morning' && character.baseMood >= 60) {
    baseChange *= 1.2
  }

  return Math.round(baseChange * 10) / 10
}

export function calculateGiftAffinity(
  giftId: string,
  character: CharacterConfig,
  giftPrice: number,
  mood: number
): number {
  let baseChange = giftPrice / 10

  if (isGiftLiked(giftId, character)) {
    baseChange *= 2
  } else if (isGiftDisliked(giftId, character)) {
    baseChange *= -0.5
  }

  return Math.round(baseChange * 10) / 10
}

const BIRTHDAY_KEYWORDS = ['生日', 'birthday']
const CONFLICT_KEYWORDS = ['邀约', '同时', '冲突', '选择', '两人', '约会']

export function classifyEventType(event: GameEventConfig): ReminderType {
  const text = event.title + event.description
  if (BIRTHDAY_KEYWORDS.some(k => text.includes(k))) return 'birthday'
  if (CONFLICT_KEYWORDS.some(k => text.includes(k))) return 'conflict'
  if (event.priority >= 90) return 'story'
  return 'affinity'
}

export function getReminderTypeLabel(type: ReminderType): string {
  const labels: Record<ReminderType, string> = {
    birthday: '🎂 生日',
    conflict: '⚡ 冲突',
    story: '📖 剧情',
    affinity: '💕 好感'
  }
  return labels[type]
}

export function getReminderTypeColor(type: ReminderType): string {
  const colors: Record<ReminderType, string> = {
    birthday: '#ec4899',
    conflict: '#f59e0b',
    story: '#8b5cf6',
    affinity: '#3b82f6'
  }
  return colors[type]
}

export interface ReminderContext {
  currentDay: number
  characters: { id: string; affinity: number; unlocked: boolean }[]
  triggeredEvents: string[]
  dismissedReminderIds: string[]
  advanceDays: number
}

export function computeUpcomingReminders(
  events: GameEventConfig[],
  charactersConfig: CharacterConfig[],
  ctx: ReminderContext
): Reminder[] {
  const reminders: Reminder[] = []

  for (const event of events) {
    if (event.once && ctx.triggeredEvents.includes(event.id)) continue

    const cond = event.triggerCondition
    if (cond.minDay === undefined) continue

    const earliestDay = cond.minDay
    if (earliestDay <= ctx.currentDay) continue
    if (earliestDay > ctx.currentDay + ctx.advanceDays) continue

    if (cond.characterId) {
      const charState = ctx.characters.find(c => c.id === cond.characterId)
      if (!charState || !charState.unlocked) continue
      if (cond.minAffinity !== undefined && charState.affinity < cond.minAffinity) continue
    }

    const reminderId = `reminder_${event.id}_day${earliestDay}`
    if (ctx.dismissedReminderIds.includes(reminderId)) continue

    const type = classifyEventType(event)
    const charConfig = event.characterId
      ? charactersConfig.find(c => c.id === event.characterId)
      : null

    let title = event.title
    let description = ''

    if (type === 'birthday') {
      const name = charConfig?.name || '有人'
      title = `🎂 ${name}的生日即将到来！`
      description = `第${earliestDay}天是${name}的生日，记得提前准备惊喜哦！`
    } else if (type === 'conflict') {
      title = `⚡ 重要抉择即将来临`
      description = `第${earliestDay}天「${event.title}」— ${event.description.slice(0, 40)}...`
    } else if (type === 'story') {
      title = `📖 剧情事件即将触发`
      description = `第${earliestDay}天「${event.title}」`
    } else {
      const name = charConfig?.name || ''
      title = `💕 ${name}相关事件`
      description = `第${earliestDay}天「${event.title}」`
    }

    reminders.push({
      id: reminderId,
      type,
      title,
      description,
      targetDay: earliestDay,
      characterId: event.characterId,
      eventId: event.id,
      dismissed: false
    })
  }

  reminders.sort((a, b) => a.targetDay - b.targetDay)
  return reminders
}
