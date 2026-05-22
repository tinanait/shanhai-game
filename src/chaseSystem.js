import { gameState } from './gameState.js'

export function createChaseSystem(hunter) {
  // chaseChance 默认 0.05（5%/秒）
  if (typeof gameState.chaseChance !== 'number') {
    gameState.chaseChance = 0.05
  }

  let timer = 0

  function update(delta) {
    // 保护期内不触发
    if (gameState.isProtected) return
    // 已有活跃猎人时不重复刷新
    if (gameState.hunter && gameState.hunter.state === 'chasing') return

    timer += delta
    if (timer >= 1.0) {
      timer = 0
      if (Math.random() < gameState.chaseChance) {
        // 刷猎人
        const p = gameState.player || { x: 0, z: 0 }
        const angle = Math.random() * Math.PI * 2
        const x = p.x + Math.cos(angle) * 20
        const z = p.z + Math.sin(angle) * 20
        hunter.spawn(x, z)
        console.log('[chaseSystem] 猎人触发！概率:', gameState.chaseChance.toFixed(2))
      }
    }
  }

  // 碎片解锁时调用，提升概率
  function onFragmentCollected() {
    gameState.chaseChance = Math.min(gameState.chaseChance + 0.02, 0.5)
    console.log('[chaseSystem] 碎片解锁，追击概率提升至:', gameState.chaseChance.toFixed(2))
  }

  return { update, onFragmentCollected }
}
