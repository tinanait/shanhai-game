import { gameState } from './gameState.js'
import { saveGame } from './storage.js'

export function initDebug() {
  window.__shanhai = {
    version: gameState.version,
    gameState,
    debug: {
      teleport(x, y, z) {
        console.log('[debug] teleport', x, y, z)
        gameState.player.x = x
        gameState.player.y = y
        gameState.player.z = z
        if (window.__shanhai._playerMesh) {
          window.__shanhai._playerMesh.position.set(x, y, z)
        }
      },
      spawnHunter() {
        const p = gameState.player || { x: 0, z: 0 }
        const angle = Math.random() * Math.PI * 2
        const x = p.x + Math.cos(angle) * 20
        const z = p.z + Math.sin(angle) * 20
        if (window.__shanhai._hunter) {
          window.__shanhai._hunter.spawn(x, z)
          console.log('[debug] 猎人已刷新在', x.toFixed(1), z.toFixed(1))
        } else {
          console.warn('[debug] 猎人未初始化，请等待场景加载完成')
        }
      },
      skipNight() {
        console.log('[debug] skipNight - TODO: T12 实现')
      },
      triggerEscape() {
        console.log('[debug] triggerEscape - TODO: T13 实现')
      },
      setChaseChance(n) {
        gameState.chaseChance = n
        console.log('[debug] chaseChance set to', n)
      },
      clearSave() {
        localStorage.removeItem('shanhai-save')
        console.log('[debug] save cleared')
      },
      save() {
        saveGame()
        console.log('[debug] 手动存档')
      },
      useSkill(name) {
        console.log('[debug] useSkill', name, '- TODO: T13 实现')
      }
    }
  }
  console.log('window.__shanhai 已挂载，版本:', gameState.version)
}
