const TECH_TREE_ORIGIN_X = 118
const TECH_TREE_ORIGIN_Y = 188
const TECH_TREE_COL_WIDTH = 228
const TECH_TREE_ROW_HEIGHT = 92
const TECH_TREE_EDGES = [
  { from: 'speed', to: 'tractor' },
  { from: 'speed', to: 'fuel' },
  { from: 'speed', to: 'grapple' },
  { from: 'health', to: 'scanner' },
  { from: 'health', to: 'repair' },
  { from: 'health', to: 'nanobots' },
  { from: 'health', to: 'cargo' },
  { from: 'tractor', to: 'explosive' },
  { from: 'tractor', to: 'drill' },
  { from: 'drill', to: 'drillYield' },
  { from: 'scanner', to: 'endGirder' },
  { from: 'scanner', to: 'battery' },
  { from: 'battery', to: 'supercap' }
]
const TECH_TREE_LAYOUT = {
  speed: { col: 0, row: 0 },
  health: { col: 0, row: 1 },
  tractor: { col: 1, row: 0 },
  scanner: { col: 1, row: 1 },
  repair: { col: 1, row: 2 },
  nanobots: { col: 0, row: 2 },
  explosive: { col: 2, row: 0 },
  endGirder: { col: 2, row: 1 },
  grapple: { col: 2, row: 2 },
  fuel: { col: 3, row: 0 },
  battery: { col: 3, row: 1 },
  supercap: { col: 4, row: 1 },
  drill: { col: 3, row: 2 },
  drillYield: { col: 4, row: 2 },
  cargo: { col: 3, row: 3 }
}

export {
  TECH_TREE_ORIGIN_X,
  TECH_TREE_ORIGIN_Y,
  TECH_TREE_COL_WIDTH,
  TECH_TREE_ROW_HEIGHT,
  TECH_TREE_EDGES,
  TECH_TREE_LAYOUT
}
