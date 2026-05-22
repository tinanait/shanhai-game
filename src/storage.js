import { gameState } from './gameState.js'

const SAVE_KEY = 'shanhai-save'

// 只持久化关键数据（不保存坐标/追击状态）
export function saveGame() {
  const data = {
    fragments: gameState.fragments,
    skills: gameState.skills,
    totalNights: gameState.totalNights,
    visitedScenes: gameState.visitedScenes || []
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    console.log('[storage] 存档已保存')
  } catch (e) {
    console.warn('[storage] 存档失败:', e)
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) {
      console.log('[storage] 无存档，使用默认值')
      return
    }
    const data = JSON.parse(raw)
    if (data.fragments) gameState.fragments = data.fragments
    if (data.skills) Object.assign(gameState.skills, data.skills)
    if (typeof data.totalNights === 'number') gameState.totalNights = data.totalNights
    if (data.visitedScenes) gameState.visitedScenes = data.visitedScenes
    console.log('[storage] 存档已加载，碎片数:', gameState.fragments.length)
  } catch (e) {
    console.warn('[storage] 加载存档失败:', e)
  }
}
