import * as THREE from 'three'
import { gameState } from './gameState.js'

const VISION_RADIUS = 15
const CHASE_SPEED = 4
const PATROL_SPEED = 1.5
const LOSE_DISTANCE = 25
const LOSE_SIGHT_TIME = 3

export function createHunter(scene, collisionSystem) {
  const geo = new THREE.CapsuleGeometry(0.4, 0.8, 4, 8)
  const mat = new THREE.MeshLambertMaterial({ color: 0x7a2222 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.visible = false
  scene.add(mesh)

  let state = 'patrolling'
  let spawnPos = new THREE.Vector3(20, 0, 20)
  let lostSightTimer = 0
  let active = false

  const patrolPoints = [
    new THREE.Vector3(20, 0, 20),
    new THREE.Vector3(-20, 0, 20),
    new THREE.Vector3(-20, 0, -20),
    new THREE.Vector3(20, 0, -20),
  ]
  let patrolIndex = 0

  function getTerrainY(x, z) {
    return Math.sin(x * 0.1) * 2 + Math.cos(z * 0.15) * 1.5 + Math.sin((x + z) * 0.08) * 1 + 0.5
  }

  function spawn(x, z) {
    active = true
    mesh.visible = true
    state = 'patrolling'
    lostSightTimer = 0
    spawnPos.set(x, getTerrainY(x, z), z)
    mesh.position.copy(spawnPos)
    gameState.hunter = gameState.hunter || {}
    syncState()
  }

  function checkLineOfSight(hunterPos, playerPos) {
    const dir = new THREE.Vector3().subVectors(playerPos, hunterPos).normalize()
    const dist = hunterPos.distanceTo(playerPos)
    const origin = hunterPos.clone().add(new THREE.Vector3(0, 0.5, 0))
    const raycaster = new THREE.Raycaster(origin, dir, 0.1, dist)
    const mountains = (gameState.scene && gameState.scene.mountains) || []
    const hits = raycaster.intersectObjects(mountains, false)
    return hits.length === 0
  }

  function syncState() {
    if (!gameState.hunter) gameState.hunter = {}
    const p = mesh.position
    const playerPos = gameState.player
      ? new THREE.Vector3(gameState.player.x, gameState.player.y, gameState.player.z)
      : new THREE.Vector3(0, 0, 0)
    gameState.hunter.x = p.x
    gameState.hunter.y = p.y
    gameState.hunter.z = p.z
    gameState.hunter.state = state
    gameState.hunter.distanceToPlayer = p.distanceTo(playerPos)
    gameState.hunter.hasLineOfSight = active ? checkLineOfSight(p, playerPos) : false
  }

  function update(delta) {
    if (!active) return

    const playerPos = gameState.player
      ? new THREE.Vector3(gameState.player.x, gameState.player.y, gameState.player.z)
      : null

    if (!playerPos) return

    const pos = mesh.position
    const dist = pos.distanceTo(playerPos)
    const los = checkLineOfSight(pos, playerPos)
    const isInvisible = gameState.player && gameState.player.isInvisible

    if (gameState.hunter && gameState.hunter.isElite) {
      state = 'chasing'
    }

    if (state === 'patrolling') {
      const target = patrolPoints[patrolIndex]
      const dir = new THREE.Vector3().subVectors(target, pos)
      dir.y = 0
      if (dir.length() < 0.5) {
        patrolIndex = (patrolIndex + 1) % patrolPoints.length
      } else {
        dir.normalize()
        pos.x += dir.x * PATROL_SPEED * delta
        pos.z += dir.z * PATROL_SPEED * delta
      }

      if (!isInvisible && dist < VISION_RADIUS && los) {
        state = 'chasing'
        lostSightTimer = 0
      }
    } else if (state === 'chasing') {
      const dir = new THREE.Vector3().subVectors(playerPos, pos)
      dir.y = 0
      dir.normalize()
      const speed = (gameState.hunter && gameState.hunter.isElite) ? 5 : CHASE_SPEED
      pos.x += dir.x * speed * delta
      pos.z += dir.z * speed * delta

      if (isInvisible || !los) {
        lostSightTimer += delta
      } else {
        lostSightTimer = 0
      }
      if (dist > LOSE_DISTANCE || lostSightTimer >= LOSE_SIGHT_TIME) {
        state = 'lost'
        lostSightTimer = 0
      }

      if (dist < 1.2) {
        gameState.player.stunned = true
        setTimeout(() => { if (gameState.player) gameState.player.stunned = false }, 1500)
      }
    } else if (state === 'lost') {
      const dir = new THREE.Vector3().subVectors(spawnPos, pos)
      dir.y = 0
      if (dir.length() < 0.5) {
        state = 'patrolling'
        pos.copy(spawnPos)
      } else {
        dir.normalize()
        pos.x += dir.x * PATROL_SPEED * delta
        pos.z += dir.z * PATROL_SPEED * delta
      }
    }

    pos.y = getTerrainY(pos.x, pos.z) + 0.5
    syncState()
  }

  function despawn() {
    active = false
    mesh.visible = false
    state = 'patrolling'
    if (gameState.hunter) gameState.hunter.state = 'inactive'
  }

  return { mesh, spawn, despawn, update, getState: () => state }
}
