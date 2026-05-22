import * as THREE from 'three'
import { gameState } from './gameState.js'
import { saveGame } from './storage.js'

export function createBed(scene, bedPoint) {
  // 床：棕色长方体
  const geo = new THREE.BoxGeometry(2, 0.4, 1)
  const mat = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(bedPoint.x, bedPoint.y + 0.2, bedPoint.z)
  mesh.castShadow = true
  scene.add(mesh)

  // 睡眠覆盖层
  const overlay = document.createElement('div')
  overlay.id = 'sleep-overlay'
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #000;
    opacity: 0; pointer-events: none;
    transition: opacity 1s ease; z-index: 20;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 24px; font-family: sans-serif;
  `
  document.body.appendChild(overlay)

  // 交互提示
  const hint = document.createElement('div')
  hint.id = 'bed-hint'
  hint.textContent = '点击床进入睡眠'
  hint.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.6); color: #fff; padding: 8px 16px;
    border-radius: 8px; font-size: 16px; font-family: sans-serif;
    display: none; z-index: 15; pointer-events: none;
  `
  document.body.appendChild(hint)

  let sleeping = false
  let protectionTimer = 0

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function sleep() {
    if (sleeping) return
    sleeping = true
    gameState.player.state = 'sleeping'
    gameState.isProtected = true

    // 销毁猎人
    if (window.__shanhai && window.__shanhai._hunter) {
      window.__shanhai._hunter.despawn()
    }

    // 锁定输入
    gameState._inputLocked = true

    // 渐黑
    overlay.style.pointerEvents = 'all'
    overlay.textContent = '过夜中...'
    overlay.style.opacity = '1'
    await wait(2000)

    // 过夜结算
    gameState.totalNights = (gameState.totalNights || 0) + 1
    gameState.timeOfDay = 'day'
    saveGame()

    // 渐亮
    overlay.textContent = '天亮了'
    await wait(500)
    overlay.style.opacity = '0'
    await wait(1000)
    overlay.style.pointerEvents = 'none'
    overlay.textContent = ''

    gameState.player.state = 'idle'
    gameState._inputLocked = false
    sleeping = false

    // 保护期 30 秒后解除
    protectionTimer = 30
    console.log('[bed] 过夜完成，保护期 30 秒')
  }

  function update(delta) {
    // 保护期倒计时
    if (gameState.isProtected && protectionTimer > 0) {
      protectionTimer -= delta
      if (protectionTimer <= 0) {
        gameState.isProtected = false
        protectionTimer = 0
        console.log('[bed] 保护期结束')
      }
    }

    // 检查玩家距离
    const p = gameState.player
    if (!p) return
    const dx = p.x - bedPoint.x
    const dz = p.z - bedPoint.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < 1.5 && !sleeping) {
      hint.style.display = 'block'
    } else {
      hint.style.display = 'none'
    }
  }

  // 点击床触发睡眠
  mesh.userData.onClick = () => {
    const p = gameState.player
    if (!p) return
    const dx = p.x - bedPoint.x
    const dz = p.z - bedPoint.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < 1.5) sleep()
  }

  return { mesh, update }
}
