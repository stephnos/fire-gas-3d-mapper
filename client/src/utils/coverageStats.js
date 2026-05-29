/** Detector coverage radii in metres (matches Scene.jsx). */
export const COVERAGE_BY_TYPE = {
  fire: 6,
  gas: 8,
}

const FLOOR_HALF = 20
const SAMPLE_STEP = 1

/**
 * @param {number} x
 * @param {number} z
 * @param {Array<{type:'fire'|'gas',x:number,y:number,z:number}>} detectors
 * @param {'fire'|'gas'|null} type
 */
function isFloorPointCovered(x, z, detectors, type) {
  const relevant = type ? detectors.filter((d) => d.type === type) : detectors

  return relevant.some((detector) => {
    const radius = COVERAGE_BY_TYPE[detector.type]
    const distance = Math.hypot(x - detector.x, -detector.y, z - detector.z)
    return distance <= radius
  })
}

/**
 * Estimates floor coverage by sampling the 40×40 m floor on a 1 m grid.
 * @param {Array<{type:'fire'|'gas',x:number,y:number,z:number}>} detectors
 */
export function computeFloorCoverageSummary(detectors) {
  let totalSamples = 0
  let coveredAny = 0
  let coveredFire = 0
  let coveredGas = 0

  for (let x = -FLOOR_HALF; x <= FLOOR_HALF; x += SAMPLE_STEP) {
    for (let z = -FLOOR_HALF; z <= FLOOR_HALF; z += SAMPLE_STEP) {
      totalSamples += 1
      if (isFloorPointCovered(x, z, detectors, null)) coveredAny += 1
      if (isFloorPointCovered(x, z, detectors, 'fire')) coveredFire += 1
      if (isFloorPointCovered(x, z, detectors, 'gas')) coveredGas += 1
    }
  }

  const blindSpots = totalSamples - coveredAny
  const toPercent = (covered) =>
    totalSamples === 0 ? 0 : Math.round((covered / totalSamples) * 100)

  return {
    floorPercent: toPercent(coveredAny),
    firePercent: toPercent(coveredFire),
    gasPercent: toPercent(coveredGas),
    blindSpots,
    totalSamples,
  }
}
