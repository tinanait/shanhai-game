import { gameState } from './gameState.js'

export function createEffects(camera) {
  // 创建暗角覆盖层
  const vignette = document.createElement('div')
  vignette.id = 'vignette'
  vignette.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(60,0,80,0.85) 100%);
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: 10;
  `
  document.body.appendChild(vignette)

  let shakeTimer = 0
  const shakeOrigin = { x: 0, y: 0, z: 0 }

  function update(delta) {
    const hunter = gameState.hunter
    if (!hunter || hunter.state === 'inactive') {
      vignette.style.opacity = '0'
      return
    }

    const dist = hunter.distanceToPlayer || 999

    // 暗角强度：距离 10 以内线性增强，最大 0.85
    if (hunter.state === 'chasing' && dist < 10) {
      const intensity = Math.max(0, (10 - dist) / 10) * 0.85
      vignette.style.opacity = String(intensity.toFixed(2))
    } else {
      vignette.style.opacity = '0'
    }

    // 保护期：强制渐隐
    if (gameState.isProtected) {
      vignette.style.opacity = '0'
    }

    // 镜头抖动（仅追击时）
    if (hunter.state === 'chasing' && dist < 10 && camera) {
      shakeTimer += delta
      if (shakeTimer > 0.05) {
        shakeTimer = 0
        const amp = 0.05 * Math.max(0, (10 - dist) / 10)
        camera.position.x += (Math.random() - 0.5) * amp
        camera.position.y += (Math.random() - 0.5) * amp * 0.5
      }
    }
  }

  return { update }
}
