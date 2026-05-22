import { gameState } from '../gameState.js'

let hudEl = null

export function initDebugHUD() {
  if (!import.meta.env.DEV) return

  hudEl = document.createElement('div')
  hudEl.id = 'debug-hud'
  hudEl.style.cssText = `
    position: fixed;
    top: 8px;
    left: 8px;
    background: rgba(0,0,0,0.6);
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 8px 12px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 9999;
    line-height: 1.6;
    min-width: 200px;
  `
  document.body.appendChild(hudEl)
  updateHUD()
}

function updateHUD() {
  if (!hudEl) return
  const p = gameState.player
  const h = gameState.hunter
  hudEl.innerHTML = `
    <b>山海 Debug</b><br>
    坐标: (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})<br>
    状态: ${p.state}<br>
    碎片: ${gameState.fragments.length}<br>
    追击概率: ${(gameState.chaseChance * 100).toFixed(0)}%<br>
    猎人: ${h.state} (距离: ${(h.distanceToPlayer ?? 0).toFixed(1)})<br>
    保护期: ${gameState.isProtected}<br>
    FPS: ${gameState.fps}
  `
  requestAnimationFrame(updateHUD)
}
