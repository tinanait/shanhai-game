import * as THREE from 'three'
import { gameState } from './gameState.js'

export function createEscapeSystem(scene, hunter) {
  let active = false
  let timer = 30
  let hitCount = 0
  let targetPos = null
  let targetMesh = null

  // 倒计时 HUD
  const hud = document.createElement('div')
  hud.id = 'escape-hud'
  hud.style.cssText = `
    position:fixed;top:60px;left:50%;transform:translateX(-50%);
    background:rgba(200,0,0,0.7);color:#fff;padding:8px 20px;
    border-radius:8px;font-size:20px;font-family:sans-serif;
    display:none;z-index:20;pointer-events:none;
  `
  document.body.appendChild(hud)

  // 结果提示
  const result = document.createElement('div')
  result.id = 'escape-result'
  result.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(0,0,0,0.8);color:#fff;padding:20px 40px;
    border-radius:12px;font-size:28px;font-family:sans-serif;
    display:none;z-index:30;text-align:center;
  `
  document.body.appendChild(result)

  function start(playerPos, playerDir) {
    if (active) return
    active = true
    timer = 30
    hitCount = 0
    gameState.escapeMode = true

    // 目标点：玩家前方 50 单位
    const dir = playerDir ? playerDir.clone().normalize() : new THREE.Vector3(1, 0, 0)
    targetPos = new THREE.Vector3(
      playerPos.x + dir.x * 50,
      playerPos.y,
      playerPos.z + dir.z * 50
    )
    // 蓝色光柱
    const geo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.6 })
    targetMesh = new THREE.Mesh(geo, mat)
    targetMesh.position.set(targetPos.x, targetPos.y + 4, targetPos.z)
    scene.add(targetMesh)

    // 精英猎人（在玩家身后 15 单位）
    const ex = playerPos.x - dir.x * 15
    const ez = playerPos.z - dir.z * 15
    hunter.spawn(ex, ez)
    // 提升速度（临时修改 gameState 标志）
    gameState.hunter.isElite = true

    hud.style.display = 'block'
    console.log('[escape] 逃亡关卡开始！目标:', targetPos)
  }

  function succeed() {
    active = false
    gameState.escapeMode = false
    gameState.isProtected = true
    hud.style.display = 'none'
    if (targetMesh) {
      scene.remove(targetMesh)
      targetMesh = null
    }
    hunter.despawn()
    gameState.hunter.isElite = false
    result.textContent = '🎉 逃亡成功！'
    result.style.display = 'block'
    setTimeout(() => { result.style.display = 'none' }, 3000)
    setTimeout(() => { gameState.isProtected = false }, 5000)
    console.log('[escape] 逃亡成功')
  }

  function fail() {
    active = false
    gameState.escapeMode = false
    hud.style.display = 'none'
    if (targetMesh) {
      scene.remove(targetMesh)
      targetMesh = null
    }
    hunter.despawn()
    gameState.hunter.isElite = false
    // 重置玩家到出生点
    if (gameState.player) {
      gameState.player.x = 0
      gameState.player.z = 0
    }
    if (window.__shanhai && window.__shanhai._playerMesh) {
      window.__shanhai._playerMesh.position.set(0, 1, 0)
    }
    result.textContent = '💀 逃亡失败，重新开始'
    result.style.display = 'block'
    setTimeout(() => { result.style.display = 'none' }, 3000)
    console.log('[escape] 逃亡失败，重置位置')
  }

  function update(delta) {
    if (!active) return

    timer -= delta
    hud.textContent = `逃亡倒计时：${Math.ceil(timer)}s`

    const p = gameState.player
    if (!p || !targetPos) return

    // 检查到达目标
    const dx = p.x - targetPos.x
    const dz = p.z - targetPos.z
    if (Math.sqrt(dx * dx + dz * dz) < 2) {
      succeed()
      return
    }

    // 精英猎人接触（hitCount 由 hunter 触发 stunned 时累加）
    if (gameState.player.stunned && gameState.hunter.isElite) {
      hitCount++
      gameState.player.stunned = false
      console.log('[escape] 被击中', hitCount, '次')
      if (hitCount >= 5) {
        fail()
        return
      }
    }

    // 超时失败
    if (timer <= 0) fail()
  }

  return { start, update }
}
