import * as THREE from 'three'
import { gameState } from './gameState.js'

export function createPlayer(scene, spawnPoint, collisionSystem = null) {
  const group = new THREE.Group()

  // 身体：米白色斗篷（头身比 1:4，总高约 1.2，身体 0.9）
  const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.3
  body.castShadow = true
  group.add(body)

  // 头部：浅棕短发
  const headGeo = new THREE.SphereGeometry(0.25, 8, 6)
  const headMat = new THREE.MeshLambertMaterial({ color: 0xc9a98a })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.05
  head.castShadow = true
  group.add(head)

  // 极淡草木微光（绿色 PointLight）
  const glow = new THREE.PointLight(0x44ff88, 0.3, 3)
  glow.position.y = 1.3
  group.add(glow)

  // 放置到出生点
  group.position.copy(spawnPoint)
  group.name = 'player'
  scene.add(group)

  function syncState() {
    gameState.player.x = group.position.x
    gameState.player.y = group.position.y
    gameState.player.z = group.position.z
  }
  syncState()

  if (window.__shanhai) {
    window.__shanhai._playerMesh = group
  }

  let moveTarget = null
  let moveSpeed = 3

  function moveTo(target, speed = 3) {
    moveTarget = target.clone()
    moveSpeed = speed
  }

  function update(delta) {
    if (moveTarget && gameState.player.state !== 'sleeping') {
      const pos = group.position
      const dir = new THREE.Vector3(
        moveTarget.x - pos.x,
        0,
        moveTarget.z - pos.z
      )
      const dist = dir.length()

      if (dist < 0.1) {
        moveTarget = null
        gameState.player.state = 'idle'
      } else {
        dir.normalize()
        const step = Math.min(moveSpeed * delta, dist)
        pos.x += dir.x * step
        pos.z += dir.z * step
        // 碰撞解析
        if (collisionSystem) {
          const resolved = collisionSystem.resolve(pos.x, pos.z)
          pos.x = resolved.x
          pos.z = resolved.z
        }
        group.lookAt(pos.x + dir.x, pos.y, pos.z + dir.z)
      }
    }
    syncState()
  }

  return {
    mesh: group,
    moveTo,
    update,
    syncState,
    setPosition(x, y, z) {
      group.position.set(x, y, z)
      syncState()
    }
  }
}
