import * as THREE from 'three'

export function createCamera(renderer) {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  )

  // 相机参数
  let yaw = 0
  let pitch = -0.4
  let distance = 5

  const target = new THREE.Vector3()

  function update(playerPosition) {
    target.copy(playerPosition).add(new THREE.Vector3(0, 1, 0))

    const x = target.x + distance * Math.sin(yaw) * Math.cos(pitch)
    const y = target.y + distance * Math.sin(-pitch) + 1
    const z = target.z + distance * Math.cos(yaw) * Math.cos(pitch)

    camera.position.set(x, y, z)
    camera.lookAt(target)
  }

  function setRotation(newYaw, newPitch) {
    yaw = newYaw
    pitch = Math.max(-1.4, Math.min(-0.17, newPitch))
  }

  function setDistance(d) {
    distance = Math.max(3, Math.min(15, d))
  }

  function getYaw() { return yaw }
  function getPitch() { return pitch }
  function getDistance() { return distance }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  return { camera, update, setRotation, setDistance, getYaw, getPitch, getDistance }
}
