import * as THREE from 'three'

// 计算地形高度（简单 sin/cos 起伏）
function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.1) * 2 +
    Math.cos(z * 0.15) * 1.5 +
    Math.sin((x + z) * 0.08) * 1
  )
}

export function createHimalayaScene() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xcfdce6)
  scene.fog = new THREE.Fog(0xcfdce6, 50, 200)

  // 光照
  const hemi = new THREE.HemisphereLight(0xddeeff, 0x8899aa, 0.8)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight(0xffffff, 1.0)
  sun.position.set(30, 60, 20)
  sun.castShadow = true
  sun.shadow.mapSize.width = 1024
  sun.shadow.mapSize.height = 1024
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 200
  sun.shadow.camera.left = -80
  sun.shadow.camera.right = 80
  sun.shadow.camera.top = 80
  sun.shadow.camera.bottom = -80
  scene.add(sun)

  // 地形
  const terrainGeo = new THREE.PlaneGeometry(200, 200, 50, 50)
  terrainGeo.rotateX(-Math.PI / 2)
  const positions = terrainGeo.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    positions.setY(i, terrainHeight(x, z))
  }
  terrainGeo.computeVertexNormals()
  const terrainMat = new THREE.MeshLambertMaterial({ color: 0x8aaa7a })
  const terrain = new THREE.Mesh(terrainGeo, terrainMat)
  terrain.receiveShadow = true
  terrain.name = 'terrain'
  scene.add(terrain)

  // 山脉（6 座）
  const mountainConfigs = [
    { x: -40, z: -50, r: 12, h: 35, color: 0x7a8a9a },
    { x: 30, z: -60, r: 10, h: 28, color: 0x8a9aaa },
    { x: -60, z: 20, r: 8, h: 22, color: 0x6a7a8a },
    { x: 50, z: 30, r: 9, h: 25, color: 0x7a8a9a },
    { x: -20, z: 60, r: 11, h: 30, color: 0x8a9aaa },
    { x: 60, z: -20, r: 7, h: 20, color: 0x6a7a8a }
  ]
  const mountains = []
  mountainConfigs.forEach(cfg => {
    const geo = new THREE.ConeGeometry(cfg.r, cfg.h, 6)
    const mat = new THREE.MeshLambertMaterial({ color: cfg.color })
    const mesh = new THREE.Mesh(geo, mat)
    const baseY = terrainHeight(cfg.x, cfg.z)
    mesh.position.set(cfg.x, baseY + cfg.h / 2, cfg.z)
    mesh.castShadow = true
    mesh.name = 'mountain'
    scene.add(mesh)
    mountains.push(mesh)
  })

  // 固定坐标点
  const spawnY = terrainHeight(0, 0) + 0.5
  const bedY = terrainHeight(10, 0) + 0.5
  const fragmentY = terrainHeight(-15, 5) + 0.5

  const spawnPoint = new THREE.Vector3(0, spawnY, 0)
  const bedPoint = new THREE.Vector3(10, bedY, 0)
  const fragmentPoint = new THREE.Vector3(-15, fragmentY, 5)

  // 注册山脉碰撞 AABB（根据 ConeGeometry 半径估算）
  function registerCollisions(collisionSystem) {
    mountainConfigs.forEach((cfg, i) => {
      const r = cfg.r * 0.85 // 稍小于视觉半径，避免卡墙
      collisionSystem.register(
        `mountain-${i}`,
        cfg.x - r, cfg.x + r,
        cfg.z - r, cfg.z + r
      )
    })
    // 场景边界（100x100 范围）
    collisionSystem.register('boundary-north', -100, 100, -101, -99)
    collisionSystem.register('boundary-south', -100, 100, 99, 101)
    collisionSystem.register('boundary-west', -101, -99, -100, 100)
    collisionSystem.register('boundary-east', 99, 101, -100, 100)
  }

  return { scene, terrain, mountains, spawnPoint, bedPoint, fragmentPoint, registerCollisions }
}
