import * as THREE from 'three'
import { gameState } from './gameState.js'
import { initDebug } from './debug.js'
import { loadGame } from './storage.js'
import { initDebugHUD } from './ui/debugHUD.js'
import { createHimalayaScene } from './scenes/himalaya.js'
import { createCollisionSystem } from './collision.js'
import { createPlayer } from './player.js'
import { createCamera } from './camera.js'
import { initInput } from './input.js'
import { createHunter } from './hunter.js'
import { createChaseSystem } from './chaseSystem.js'
import { createEffects } from './effects.js'
import { createBed } from './bed.js'
import { createFragment } from './fragments.js'
import { createSkillSystem } from './skills.js'
import { createEscapeSystem } from './escape.js'

console.log('《山海》启动')

initDebug()
loadGame()
initDebugHUD()

const canvas = document.getElementById('game')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const { scene, terrain, mountains, spawnPoint, bedPoint, fragmentPoint, registerCollisions } = createHimalayaScene()
const collisionSystem = createCollisionSystem()
registerCollisions(collisionSystem)
gameState.scene.points.spawn = { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z }
gameState.scene.points.bed = { x: bedPoint.x, y: bedPoint.y, z: bedPoint.z }
gameState.scene.points.fragment = { x: fragmentPoint.x, y: fragmentPoint.y, z: fragmentPoint.z }
gameState.scene.mountains = mountains

const player = createPlayer(scene, spawnPoint, collisionSystem)
const camCtrl = createCamera(renderer)
const hunter = createHunter(scene, collisionSystem)
window.__shanhai._hunter = hunter
gameState.hunter = {}

const chaseSystem = createChaseSystem(hunter)
window.__shanhai._chaseSystem = chaseSystem

const effects = createEffects(camCtrl.camera)
const bed = createBed(scene, bedPoint)
const escapeSystem = createEscapeSystem(scene, hunter)

const fragment = createFragment(scene, fragmentPoint, () => {
  // 解锁隐身技能
  if (!gameState.skills.invisibility) gameState.skills.invisibility = {}
  gameState.skills.invisibility.unlocked = true
  // 提升追击概率
  if (window.__shanhai._chaseSystem) window.__shanhai._chaseSystem.onFragmentCollected()
  // 1 秒后进入逃亡模式
  setTimeout(() => {
    const p = gameState.player
    const playerPos = new THREE.Vector3(p.x, p.y, p.z)
    const playerDir = new THREE.Vector3(0, 0, -1)
    escapeSystem.start(playerPos, playerDir)
  }, 1000)
})

const skillSystem = createSkillSystem(window.__shanhai._playerMesh)

initInput({ canvas, camera: camCtrl.camera, terrain, player, camCtrl, bed, fragment })

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gameState._paused = true
  } else {
    gameState._paused = false
  }
})

const clock = new THREE.Clock()
let lastFpsTime = performance.now()
let frameCount = 0

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()

  if (gameState._paused) return

  frameCount++
  const now = performance.now()
  if (now - lastFpsTime >= 1000) {
    gameState.fps = frameCount
    frameCount = 0
    lastFpsTime = now
  }

  player.update(delta)
  bed.update(delta)
  fragment.update(delta)
  skillSystem.update(delta)
  escapeSystem.update(delta)
  chaseSystem.update(delta)
  hunter.update(delta)
  effects.update(delta)
  camCtrl.update(player.mesh.position)

  renderer.render(scene, camCtrl.camera)
}
animate()
