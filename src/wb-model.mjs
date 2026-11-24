// FICTIONAL interface-test data. These are NOT SR20 specifications.
// Replace the entire profile with verified, aircraft-specific data before use.
export const DEMO = {
  emptyWeight: 2100, emptyArm: 140, fuelArm: 150, fuelDensity: 6,
  maxWeight: 3200, maxFuel: 60,
  stations: [
    { key: 'pilot', label: 'Pilot', detail: 'Front left', arm: 140, max: 350 },
    { key: 'copilot', label: 'Front passenger', detail: 'Front right', arm: 140, max: 350 },
    { key: 'rearLeft', label: 'Rear left', detail: 'Rear passenger', arm: 170, max: 350 },
    { key: 'rearRight', label: 'Rear right', detail: 'Rear passenger', arm: 170, max: 350 },
    { key: 'baggage', label: 'Baggage', detail: 'Rear compartment', arm: 195, max: 150 },
  ],
  envelope: [[138, 2100], [150, 2100], [150, 3200], [143, 3200], [138, 2600]],
}

export const INITIAL = { pilot: 180, copilot: 150, rearLeft: 0, rearRight: 0, baggage: 30, fuel: 40, burn: 15 }

// Includes points on the boundary, without rounding calculated values.
export function inEnvelope(cg, weight, polygon = DEMO.envelope) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j]
    const cross = (cg - xi) * (yj - yi) - (weight - yi) * (xj - xi)
    if (Math.abs(cross) < 1e-7 && cg >= Math.min(xi, xj) && cg <= Math.max(xi, xj) && weight >= Math.min(yi, yj) && weight <= Math.max(yi, yj)) return true
    if ((yi > weight) !== (yj > weight) && cg < (xj - xi) * (weight - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function calculate(values) {
  const limits = Object.fromEntries([...DEMO.stations.map(s => [s.key, s.max]), ['fuel', DEMO.maxFuel], ['burn', DEMO.maxFuel]])
  const data = {}
  for (const [key, max] of Object.entries(limits)) {
    const raw = values[key]
    if (raw === '' || raw === null || raw === undefined || !Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > max) {
      return { error: `Enter a value from 0 to ${max} for ${key}.` }
    }
    data[key] = Number(raw)
  }
  if (data.burn > data.fuel) return { error: 'Planned fuel burn cannot exceed departure fuel.' }
  const payload = DEMO.stations.reduce((sum, s) => sum + data[s.key], 0)
  const dryWeight = DEMO.emptyWeight + payload
  const dryMoment = DEMO.emptyWeight * DEMO.emptyArm + DEMO.stations.reduce((sum, s) => sum + data[s.key] * s.arm, 0)
  const point = fuel => {
    const weight = dryWeight + fuel * DEMO.fuelDensity
    const moment = dryMoment + fuel * DEMO.fuelDensity * DEMO.fuelArm
    const cg = moment / weight
    return { weight, moment, cg, inside: inEnvelope(cg, weight) && weight <= DEMO.maxWeight }
  }
  return { departure: point(data.fuel), landing: point(data.fuel - data.burn), payload, remaining: data.fuel - data.burn }
}
