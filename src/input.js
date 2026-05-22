import * as THREE from 'three'
import { gameState } from './gameState.js'

const CLICK_THRESHOLD_MS = 200   // 短于此为点击，长于此为长按
const DRAG_THRESHOLD_PX = 10     // 移动超过此距离视为拖拽（不触发移动）

export function initInput({ canvas, camera, terrain, player, camCtrl, bed, fragment }) {
  const raycaster = new THREE.Raycaster()
  const pointers = new Map() // pointerId -> { x, y, startX, startY, startTime }

  let isDragging = false
  let lastSingleX = 0
  let lastSingleY = 0
  let cameraDistance = 5

  // 暴露相机状态到 gameState
  if (!gameState.camera) gameState.camera = { yaw: 0, pitch: -0.4, distance: 5 }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
  }

  function tryMove(clientX, clientY, running) {
    const rect = canvas.getBoundingClientRect()
    const ndc = {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1
    }
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObject(terrain)
    if (hits.length > 0) {
      const pt = hits[0].point
      player.moveTo(pt, running ? 6 : 3)
      gameState.player.target = { x: pt.x, y: pt.y, z: pt.z }
      gameState.player.state = running ? 'running' : 'walking'
    }
  }

  // Pointer down
  canvas.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, {
      x: e.clientX, y: e.clientY,
      startX: e.clientX, startY: e.clientY,
      startTime: Date.now()
    })
    if (pointers.size === 1) {
      isDragging = false
      lastSingleX = e.clientX
      lastSingleY = e.clientY
    }
  })

  // Pointer move
  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId)
    if (!p) return

    const dx = e.clientX - p.startX
    const dy = e.clientY - p.startY

    if (pointers.size === 1) {
      // 单指：判断是否为拖拽
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
        isDragging = true
        // 旋转相机
        const moveDx = e.clientX - lastSingleX
        const moveDy = e.clientY - lastSingleY
        const newYaw = camCtrl.getYaw() - moveDx * 0.005
        const newPitch = camCtrl.getPitch() + moveDy * 0.005
        camCtrl.setRotation(newYaw, newPitch)
        gameState.camera.yaw = newYaw
        gameState.camera.pitch = newPitch
      }
      lastSingleX = e.clientX
      lastSingleY = e.clientY
    } else if (pointers.size === 2) {
      // 双指：捏合缩放
      const pts = [...pointers.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const prevDist = Math.hypot(pts[0].startX - pts[1].startX, pts[0].startY - pts[1].startY)
      const delta = (prevDist - dist) * 0.02
      cameraDistance = Math.max(3, Math.min(15, cameraDistance + delta))
      camCtrl.setDistance(cameraDistance)
      gameState.camera.distance = cameraDistance
    }

    p.x = e.clientX
    p.y = e.clientY
  })

  // Pointer up
  canvas.addEventListener('pointerup', e => {
    const p = pointers.get(e.pointerId)
    if (!p) return

    const elapsed = Date.now() - p.startTime
    const dx = e.clientX - p.startX
    const dy = e.clientY - p.startY
    const moved = Math.sqrt(dx * dx + dy * dy)

    if (pointers.size === 1 && !isDragging && moved < DRAG_THRESHOLD_PX) {
      if (gameState._inputLocked) {
        pointers.delete(e.pointerId)
        if (pointers.size === 0) isDragging = false
        return
      }
      const rect = canvas.getBoundingClientRect()
      const ndc = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      }
      raycaster.setFromCamera(ndc, camera)
      const clickables = []
      if (bed) clickables.push(bed.mesh)
      if (fragment) clickables.push(fragment.mesh)
      const clickHits = raycaster.intersectObjects(clickables)
      if (clickHits.length > 0 && clickHits[0].object.userData.onClick) {
        clickHits[0].object.userData.onClick()
      } else if (elapsed < CLICK_THRESHOLD_MS) {
        tryMove(e.clientX, e.clientY, false)
      } else {
        tryMove(e.clientX, e.clientY, true)
      }
    }

    pointers.delete(e.pointerId)
    if (pointers.size === 0) isDragging = false
  })

  // 鼠标右键拖拽旋转（桌面端）
  let rightDragging = false
  let rightLastX = 0, rightLastY = 0
  canvas.addEventListener('contextmenu', e => e.preventDefault())
  canvas.addEventListener('mousedown', e => {
    if (e.button === 2) {
      rightDragging = true
      rightLastX = e.clientX
      rightLastY = e.clientY
    }
  })
  window.addEventListener('mousemove', e => {
    if (!rightDragging) return
    const dx = e.clientX - rightLastX
    const dy = e.clientY - rightLastY
    const newYaw = camCtrl.getYaw() - dx * 0.005
    const newPitch = camCtrl.getPitch() + dy * 0.005
    camCtrl.setRotation(newYaw, newPitch)
    gameState.camera.yaw = newYaw
    gameState.camera.pitch = newPitch
    rightLastX = e.clientX
    rightLastY = e.clientY
  })
  window.addEventListener('mouseup', e => {
    if (e.button === 2) rightDragging = false
  })

  // 滚轮缩放（桌面端）
  canvas.addEventListener('wheel', e => {
    e.preventDefault()
    cameraDistance = Math.max(3, Math.min(15, cameraDistance + e.deltaY * 0.01))
    camCtrl.setDistance(cameraDistance)
    gameState.camera.distance = cameraDistance
  }, { passive: false })
}
