import { gameState } from './gameState.js'

export function createSkillSystem(playerMesh) {
  const INVIS_DURATION = 2   // 秒
  const INVIS_CD = 10        // 秒

  let cdTimer = 0
  let activeTimer = 0
  let active = false

  // 技能 HUD 按钮（右下角）
  const btn = document.createElement('div')
  btn.id = 'skill-btn'
  btn.innerHTML = '隐身'
  btn.style.cssText = `
    position:fixed;right:20px;bottom:20px;width:60px;height:60px;
    background:rgba(0,100,200,0.7);border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-size:13px;font-family:sans-serif;
    cursor:pointer;z-index:20;user-select:none;
    border:2px solid rgba(255,255,255,0.4);
  `
  document.body.appendChild(btn)

  // CD 倒计时文字
  const cdLabel = document.createElement('div')
  cdLabel.style.cssText = `
    position:fixed;right:20px;bottom:85px;
    color:#fff;font-size:12px;font-family:sans-serif;
    text-align:center;width:60px;z-index:20;display:none;
  `
  document.body.appendChild(cdLabel)

  function useSkill() {
    if (!gameState.skills.invisibility || !gameState.skills.invisibility.unlocked) return
    if (cdTimer > 0 || active) return
    active = true
    activeTimer = INVIS_DURATION
    gameState.player.isInvisible = true
    if (playerMesh) {
      playerMesh.traverse(child => {
        if (child.isMesh) {
          child.material.transparent = true
          child.material.opacity = 0.2
        }
      })
    }
    console.log('[skills] 隐身激活')
  }

  btn.addEventListener('click', useSkill)
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); useSkill() }, { passive: false })

  // 空格键触发
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault()
      useSkill()
    }
  })

  // debug 接口
  if (window.__shanhai) {
    window.__shanhai.debug = window.__shanhai.debug || {}
    window.__shanhai.debug.useSkill = (name) => {
      if (name === 'invisibility') useSkill()
    }
  }

  function update(delta) {
    const unlocked = gameState.skills.invisibility && gameState.skills.invisibility.unlocked
    btn.style.display = unlocked ? 'flex' : 'none'

    if (active) {
      activeTimer -= delta
      if (activeTimer <= 0) {
        active = false
        activeTimer = 0
        cdTimer = INVIS_CD
        gameState.player.isInvisible = false
        if (playerMesh) {
          playerMesh.traverse(child => {
            if (child.isMesh) child.material.opacity = 1
          })
        }
        console.log('[skills] 隐身结束，CD 开始')
      }
    }

    if (cdTimer > 0) {
      cdTimer -= delta
      cdLabel.style.display = 'block'
      cdLabel.textContent = `CD ${Math.ceil(cdTimer)}s`
      btn.style.opacity = '0.4'
      if (cdTimer <= 0) {
        cdTimer = 0
        cdLabel.style.display = 'none'
        btn.style.opacity = '1'
      }
    }
  }

  return { update, useSkill }
}
