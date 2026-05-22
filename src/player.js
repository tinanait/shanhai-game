import * as THREE from 'three'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { gameState } from './gameState.js'

export function createPlayer(scene, spawnPoint, collisionSystem = null) {
  const group = new THREE.Group()

  const placeholderGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8)
  const placeholderMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e6, transparent: true, opacity: 0.5 })
  const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat)
  placeholder.position.y = 0.8
  placeholder.castShadow = true
  group.add(placeholder)

  // 极淡草木微光（绿色 PointLight）
  const glow = new THREE.PointLight(0x44ff88, 0.3, 3)
  glow.position.y = 0.8
  group.add(glow)

  const loader = new ThreeMFLoader()
  loader.load('/assets/Shanhai_Aicao.3mf', (object3D) => {
    group.remove(placeholder)

    // 3MF 坐标系：Z 朝上；旋转 -90° 绕 X 轴使 Z→Y（直立）
    object3D.rotation.x = -Math.PI / 2

    // 缩放：模型 Z 范围 100mm → 1.6 游戏单位
    const scale = 1.6 / 100
    object3D.scale.setScalar(scale)

    // 垂直偏移：旋转后底部在 y=-0.8，上移使脚底落在 y=0
    object3D.position.y = 0.8

    object3D.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true
        child.material = new THREE.MeshLambertMaterial({ color: 0xf0ece0 })
        child.material.transparent = true
        child.material.opacity = 1
      }
    })

    group.add(object3D)
    console.log('[player] 艾草模型加载完成')
  }, undefined, (err) => {
    console.warn('[player] 3MF 加载失败，保留占位体', err)
  })

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
