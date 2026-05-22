import * as THREE from 'three'
import { gameState } from './gameState.js'
import { saveGame } from './storage.js'

export function createFragment(scene, fragmentPoint, onCollected) {
  const geo = new THREE.OctahedronGeometry(0.3)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x44ff88,
    emissive: 0x44ff88,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 1
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(fragmentPoint.x, fragmentPoint.y + 0.5, fragmentPoint.z)
  scene.add(mesh)

  // 提示 HUD
  const hint = document.createElement('div')
  hint.textContent = '点击拾取山神碎片'
  hint.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.6);color:#44ff88;padding:8px 16px;
    border-radius:8px;font-size:16px;font-family:sans-serif;
    display:none;z-index:15;pointer-events:none;
  `
  document.body.appendChild(hint)

  let collected = false
  let collectAnim = null

  function collect() {
    if (collected) return
    collected = true
    hint.style.display = 'none'
    // 飞向玩家动画（0.5s 插值）
    const start = mesh.position.clone()
    const startTime = performance.now()
    collectAnim = { start, startTime }
    gameState.fragments.push({ id: 'himalaya-1', name: '喜马拉雅碎片', collected: true })
    saveGame()
    // 绿色光环特效（简单：PointLight 1 秒淡出）
    const light = new THREE.PointLight(0x44ff88, 2, 5)
    light.position.copy(mesh.position)
    scene.add(light)
    let lt = 0
    const fadeLight = (delta) => {
      lt += delta
      light.intensity = Math.max(0, 2 - lt * 2)
      if (lt >= 1) scene.remove(light)
    }
    mesh.userData._fadeLight = fadeLight
    if (onCollected) onCollected()
  }

  mesh.userData.onClick = collect

  function update(delta) {
    if (collected) {
      // 飞向玩家动画
      if (collectAnim && mesh.parent) {
        const elapsed = (performance.now() - collectAnim.startTime) / 1000
        const t = Math.min(elapsed / 0.5, 1)
        const p = gameState.player
        if (p) {
          mesh.position.lerpVectors(collectAnim.start, new THREE.Vector3(p.x, p.y + 1, p.z), t)
        }
        if (t >= 1) {
          scene.remove(mesh)
          collectAnim = null
        }
      }
      if (mesh.userData._fadeLight) mesh.userData._fadeLight(delta)
      return
    }

    // 旋转
    mesh.rotation.y += 0.02

    // 距离检测
    const p = gameState.player
    if (!p) return
    const dx = p.x - fragmentPoint.x
    const dz = p.z - fragmentPoint.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    hint.style.display = dist < 1.5 ? 'block' : 'none'
  }

  return { mesh, update }
}
