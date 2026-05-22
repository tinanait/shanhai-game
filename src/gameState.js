// 全局游戏状态 - 所有模块共享此对象
export const gameState = {
  version: '0.1.0',
  sceneId: 'himalaya',
  timeOfDay: 'day',
  fps: 0,
  isProtected: false,
  chaseChance: 0.05,
  player: {
    x: 0, y: 0, z: 0,
    state: 'idle',
    isInvisible: false
  },
  hunter: {
    x: 0, y: 0, z: 0,
    state: 'patrolling',
    distanceToPlayer: 999,
    hasLineOfSight: false,
    isActive: false,
    isElite: false
  },
  fragments: [],
  skills: {
    invisibility: { unlocked: false, cooldown: 10, duration: 2, active: false, cdRemaining: 0 }
  },
  scene: {
    points: {
      spawn: { x: 0, y: 0, z: 0 },
      bed: { x: 10, y: 0, z: 0 },
      fragment: { x: -15, y: 0, z: 5 }
    }
  },
  totalNights: 0,
  escapeMode: false,
  _inputLocked: false
}
