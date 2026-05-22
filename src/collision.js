import { gameState } from './gameState.js'

// AABB 碰撞系统
// 每个障碍物：{ id, minX, maxX, minZ, maxZ }
const obstacles = []

export function createCollisionSystem() {
  // 初始化 gameState.obstacles
  gameState.obstacles = obstacles

  function register(id, minX, maxX, minZ, maxZ) {
    // 移除同 id 的旧记录
    const idx = obstacles.findIndex(o => o.id === id)
    if (idx !== -1) obstacles.splice(idx, 1)
    obstacles.push({ id, minX, maxX, minZ, maxZ })
  }

  // 检查点 (x, z) 是否在任何障碍物内
  function isBlocked(x, z) {
    for (const o of obstacles) {
      if (x > o.minX && x < o.maxX && z > o.minZ && z < o.maxZ) {
        return true
      }
    }
    return false
  }

  // 将点推出最近的障碍物外
  function resolve(x, z) {
    for (const o of obstacles) {
      if (x > o.minX && x < o.maxX && z > o.minZ && z < o.maxZ) {
        // 找最近的边并推出
        const dLeft = x - o.minX
        const dRight = o.maxX - x
        const dTop = z - o.minZ
        const dBottom = o.maxZ - z
        const minD = Math.min(dLeft, dRight, dTop, dBottom)
        if (minD === dLeft) x = o.minX - 0.1
        else if (minD === dRight) x = o.maxX + 0.1
        else if (minD === dTop) z = o.minZ - 0.1
        else z = o.maxZ + 0.1
      }
    }
    return { x, z }
  }

  return { register, isBlocked, resolve }
}
