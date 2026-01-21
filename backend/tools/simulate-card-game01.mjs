const ACTIONS = ['attack', 'defend', 'rest']
const DELTA_MATRIX = {
  attack: {
    attack: [-2, -2],
    defend: [-1, 0],
    rest: [1, -2],
  },
  defend: {
    attack: [0, -1],
    defend: [-1, -1],
    rest: [0, 1],
  },
  rest: {
    attack: [-2, 1],
    defend: [1, 0],
    rest: [0, 0],
  },
}

const clampHp = (value) => Math.max(0, value)

const createRng = (seed) => {
  if (seed === null) {
    return Math.random
  }
  let state = Math.floor(seed) % 2147483647
  if (state <= 0) {
    state += 2147483646
  }
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

const resolveDeltas = (action1, action2) => DELTA_MATRIX[action1]?.[action2] ?? [0, 0]

const parseWeightString = (value) => {
  if (!value) {
    return null
  }
  const parts = value.split(',').map((item) => item.trim()).filter(Boolean)
  if (parts.length === 0) {
    return null
  }
  const weights = { attack: 0, defend: 0, rest: 0 }
  for (const part of parts) {
    const [rawKey, rawValue] = part.split(/[:=]/)
    if (!rawKey || rawValue === undefined) {
      throw new Error(`Invalid weight entry: "${part}". Use attack:0.3,defend:0.3,rest:0.4`)
    }
    const key = rawKey.trim().toLowerCase()
    if (!ACTIONS.includes(key)) {
      throw new Error(`Unknown action "${rawKey}". Use attack/defend/rest.`)
    }
    const num = Number(rawValue)
    if (!Number.isFinite(num) || num < 0) {
      throw new Error(`Invalid weight value for "${key}": "${rawValue}"`)
    }
    weights[key] = num
  }
  return weights
}

const normalizeWeights = (weights) => {
  const total = ACTIONS.reduce((sum, action) => sum + (weights[action] ?? 0), 0)
  if (total <= 0) {
    throw new Error('Strategy weights sum to 0. Provide positive numbers.')
  }
  return ACTIONS.reduce((acc, action) => {
    acc[action] = (weights[action] ?? 0) / total
    return acc
  }, {})
}

const sampleAction = (weights, rng) => {
  const roll = rng()
  let cursor = 0
  for (const action of ACTIONS) {
    cursor += weights[action]
    if (roll <= cursor) {
      return action
    }
  }
  return ACTIONS[ACTIONS.length - 1]
}

const parseArgs = (argv) => {
  const args = {
    games: 20000,
    rounds: 10,
    startHp: 10,
    p1: null,
    p2: null,
    seed: null,
    grid: false,
    gridStep: 0.05,
    gridTop: 10,
    gridTarget: 'p1',
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--games') {
      args.games = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--games=')) {
      args.games = Number(arg.split('=')[1])
    } else if (arg === '--rounds') {
      args.rounds = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--rounds=')) {
      args.rounds = Number(arg.split('=')[1])
    } else if (arg === '--start-hp') {
      args.startHp = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--start-hp=')) {
      args.startHp = Number(arg.split('=')[1])
    } else if (arg === '--p1') {
      args.p1 = argv[i + 1]
      i += 1
    } else if (arg.startsWith('--p1=')) {
      args.p1 = arg.split('=')[1]
    } else if (arg === '--p2') {
      args.p2 = argv[i + 1]
      i += 1
    } else if (arg.startsWith('--p2=')) {
      args.p2 = arg.split('=')[1]
    } else if (arg === '--seed') {
      args.seed = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--seed=')) {
      args.seed = Number(arg.split('=')[1])
    } else if (arg === '--grid') {
      args.grid = true
    } else if (arg.startsWith('--grid=')) {
      args.grid = true
      args.gridTarget = arg.split('=')[1] || args.gridTarget
    } else if (arg === '--grid-target') {
      args.gridTarget = argv[i + 1]
      args.grid = true
      i += 1
    } else if (arg.startsWith('--grid-target=')) {
      args.gridTarget = arg.split('=')[1]
      args.grid = true
    } else if (arg === '--grid-step') {
      args.gridStep = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--grid-step=')) {
      args.gridStep = Number(arg.split('=')[1])
    } else if (arg === '--grid-top') {
      args.gridTop = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--grid-top=')) {
      args.gridTop = Number(arg.split('=')[1])
    } else if (arg === '--help' || arg === '-h') {
      args.help = true
    }
  }
  return args
}

const formatPercent = (value, digits = 2) => `${(value * 100).toFixed(digits)}%`
const formatNumber = (value, digits = 2) => value.toFixed(digits)
const formatWeights = (weights) => ACTIONS.map((action) => `${action}:${weights[action].toFixed(3)}`).join(' ')

const runSimulation = ({ games, rounds, startHp, p1Weights, p2Weights, seed, detailed }) => {
  const rng = createRng(seed === null || Number.isNaN(seed) ? null : seed)
  const actionCounts = detailed
    ? {
        p1: { attack: 0, defend: 0, rest: 0 },
        p2: { attack: 0, defend: 0, rest: 0 },
      }
    : null
  const actionOutcome = detailed
    ? {
        p1: {
          attack: { rounds: 0, wins: 0, losses: 0, draws: 0, deltaSum: 0 },
          defend: { rounds: 0, wins: 0, losses: 0, draws: 0, deltaSum: 0 },
          rest: { rounds: 0, wins: 0, losses: 0, draws: 0, deltaSum: 0 },
        },
      }
    : null
  const pairStats = detailed ? {} : null

  if (detailed) {
    for (const a1 of ACTIONS) {
      pairStats[a1] = {}
      for (const a2 of ACTIONS) {
        pairStats[a1][a2] = { rounds: 0, deltaSum: 0, wins: 0, losses: 0, draws: 0 }
      }
    }
  }

  let p1Wins = 0
  let p2Wins = 0
  let draws = 0
  let totalRounds = 0
  let totalHpDiff = 0
  let totalP1Hp = 0
  let totalP2Hp = 0

  for (let game = 0; game < games; game += 1) {
    let p1Hp = startHp
    let p2Hp = startHp
    const history = detailed ? [] : null
    let round = 0

    while (round < rounds && p1Hp > 0 && p2Hp > 0) {
      round += 1
      const a1 = sampleAction(p1Weights, rng)
      const a2 = sampleAction(p2Weights, rng)
      const [d1, d2] = resolveDeltas(a1, a2)

      p1Hp = clampHp(p1Hp + d1)
      p2Hp = clampHp(p2Hp + d2)

      if (detailed) {
        actionCounts.p1[a1] += 1
        actionCounts.p2[a2] += 1
        history.push({ a1, a2, d1 })
      }
    }

    totalRounds += round
    totalHpDiff += p1Hp - p2Hp
    totalP1Hp += p1Hp
    totalP2Hp += p2Hp

    let result = 'draw'
    if (p1Hp !== p2Hp) {
      result = p1Hp > p2Hp ? 'p1' : 'p2'
    }
    if (result === 'p1') {
      p1Wins += 1
    } else if (result === 'p2') {
      p2Wins += 1
    } else {
      draws += 1
    }

    if (!detailed) {
      continue
    }

    for (const entry of history) {
      const actionStat = actionOutcome.p1[entry.a1]
      actionStat.rounds += 1
      actionStat.deltaSum += entry.d1
      if (result === 'p1') {
        actionStat.wins += 1
      } else if (result === 'p2') {
        actionStat.losses += 1
      } else {
        actionStat.draws += 1
      }

      const pairStat = pairStats[entry.a1][entry.a2]
      pairStat.rounds += 1
      pairStat.deltaSum += entry.d1
      if (result === 'p1') {
        pairStat.wins += 1
      } else if (result === 'p2') {
        pairStat.losses += 1
      } else {
        pairStat.draws += 1
      }
    }
  }

  return {
    p1Wins,
    p2Wins,
    draws,
    totalRounds,
    totalHpDiff,
    totalP1Hp,
    totalP2Hp,
    actionCounts,
    actionOutcome,
    pairStats,
  }
}

const buildGridCandidates = (step) => {
  const epsilon = 1e-10
  const candidates = []
  const roundWeight = (value) => Math.max(0, Math.min(1, Number(value.toFixed(10))))
  for (let attack = 0; attack <= 1 + epsilon; attack += step) {
    const safeAttack = roundWeight(attack)
    for (let defend = 0; defend <= 1 + epsilon; defend += step) {
      const safeDefend = roundWeight(defend)
      const rest = 1 - safeAttack - safeDefend
      if (rest < -epsilon) {
        continue
      }
      const safeRest = roundWeight(rest)
      if (safeRest < -epsilon) {
        continue
      }
      candidates.push(normalizeWeights({ attack: safeAttack, defend: safeDefend, rest: safeRest }))
    }
  }
  return candidates
}

const simulate = () => {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(`Usage:
  node backend/tools/simulate-card-game01.mjs --games 50000 --p1 attack:0.34,defend:0.33,rest:0.33
Options:
  --games N         number of games (default 20000)
  --rounds N        max rounds per game (default 10)
  --start-hp N      starting HP (default 10)
  --p1 spec         weights for player1 (attack:defend:rest)
  --p2 spec         weights for player2 (attack:defend:rest)
  --seed N          deterministic RNG seed
  --grid            enable grid search (default target: p1)
  --grid-target P   grid target p1 or p2 (implies --grid)
  --grid-step N     grid step size, e.g. 0.05
  --grid-top N      number of top results to print
`)
    process.exit(0)
  }

  if (!Number.isFinite(args.games) || args.games <= 0) {
    throw new Error('Invalid --games value.')
  }
  if (!Number.isFinite(args.rounds) || args.rounds <= 0) {
    throw new Error('Invalid --rounds value.')
  }
  if (!Number.isFinite(args.startHp) || args.startHp <= 0) {
    throw new Error('Invalid --start-hp value.')
  }
  if (args.grid) {
    if (!Number.isFinite(args.gridStep) || args.gridStep <= 0 || args.gridStep > 1) {
      throw new Error('Invalid --grid-step value.')
    }
    if (!Number.isFinite(args.gridTop) || args.gridTop <= 0) {
      throw new Error('Invalid --grid-top value.')
    }
    if (!['p1', 'p2'].includes(args.gridTarget)) {
      throw new Error('Invalid --grid-target. Use p1 or p2.')
    }
  }

  const p1Weights = normalizeWeights(parseWeightString(args.p1) ?? { attack: 1, defend: 1, rest: 1 })
  const p2Weights = normalizeWeights(parseWeightString(args.p2) ?? { attack: 1, defend: 1, rest: 1 })
  const baseSeed = args.seed === null || Number.isNaN(args.seed) ? null : args.seed

  if (args.grid) {
    const candidates = buildGridCandidates(args.gridStep)
    const results = candidates.map((weights, index) => {
      const p1 = args.gridTarget === 'p1' ? weights : p1Weights
      const p2 = args.gridTarget === 'p2' ? weights : p2Weights
      const seed = baseSeed === null ? null : baseSeed + index
      const summary = runSimulation({
        games: args.games,
        rounds: args.rounds,
        startHp: args.startHp,
        p1Weights: p1,
        p2Weights: p2,
        seed,
        detailed: false,
      })
      const winRate = (args.gridTarget === 'p1' ? summary.p1Wins : summary.p2Wins) / args.games
      const lossRate = (args.gridTarget === 'p1' ? summary.p2Wins : summary.p1Wins) / args.games
      const drawRate = summary.draws / args.games
      const score = winRate + drawRate * 0.5
      const hpDiff = summary.totalHpDiff / args.games
      return {
        weights,
        winRate,
        lossRate,
        drawRate,
        score,
        avgRounds: summary.totalRounds / args.games,
        avgHpDiff: args.gridTarget === 'p1' ? hpDiff : -hpDiff,
      }
    })

    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return b.avgHpDiff - a.avgHpDiff
    })

    console.log('Card Duel grid search')
    console.log(`Games: ${args.games}`)
    console.log(`Rounds: ${args.rounds}`)
    console.log(`Start HP: ${args.startHp}`)
    if (baseSeed !== null) {
      console.log(`Seed: ${baseSeed}`)
    }
    console.log(`Grid target: ${args.gridTarget.toUpperCase()}`)
    console.log(`Grid step: ${args.gridStep}`)
    console.log(`Candidates: ${results.length}`)
    console.log(`P1 strategy: ${formatWeights(p1Weights)}`)
    console.log(`P2 strategy: ${formatWeights(p2Weights)}`)
    console.log('Ranking by score = win + 0.5 * draw')
    console.log('')

    results.slice(0, args.gridTop).forEach((entry, idx) => {
      const label = `${idx + 1}. ${formatWeights(entry.weights)}`
      const line = `${label} | win ${formatPercent(entry.winRate)} | draw ${formatPercent(
        entry.drawRate,
      )} | loss ${formatPercent(entry.lossRate)} | score ${formatPercent(entry.score)} | avg ΔHP ${formatNumber(
        entry.avgHpDiff,
      )} | avg rounds ${formatNumber(entry.avgRounds)}`
      console.log(line)
    })
    return
  }

  const result = runSimulation({
    games: args.games,
    rounds: args.rounds,
    startHp: args.startHp,
    p1Weights,
    p2Weights,
    seed: baseSeed,
    detailed: true,
  })

  console.log('Card Duel simulation')
  console.log(`Games: ${args.games}`)
  console.log(`Rounds: ${args.rounds}`)
  console.log(`Start HP: ${args.startHp}`)
  if (baseSeed !== null) {
    console.log(`Seed: ${baseSeed}`)
  }
  console.log(`P1 strategy: ${formatWeights(p1Weights)}`)
  console.log(`P2 strategy: ${formatWeights(p2Weights)}`)
  console.log('')
  console.log(`P1 win rate: ${formatPercent(result.p1Wins / args.games)}`)
  console.log(`P2 win rate: ${formatPercent(result.p2Wins / args.games)}`)
  console.log(`Draw rate:   ${formatPercent(result.draws / args.games)}`)
  console.log(`Avg rounds:  ${formatNumber(result.totalRounds / args.games)}`)
  console.log(`Avg P1 HP:   ${formatNumber(result.totalP1Hp / args.games)}`)
  console.log(`Avg P2 HP:   ${formatNumber(result.totalP2Hp / args.games)}`)
  console.log(`Avg HP diff (P1-P2): ${formatNumber(result.totalHpDiff / args.games)}`)
  console.log('')
  console.log('Action frequency (per round)')
  for (const player of ['p1', 'p2']) {
    const total = ACTIONS.reduce((sum, action) => sum + result.actionCounts[player][action], 0)
    const parts = ACTIONS.map((action) => `${action}:${formatPercent(result.actionCounts[player][action] / total)}`)
    console.log(`${player.toUpperCase()}: ${parts.join(' ')}`)
  }
  console.log('')
  console.log('P1 action vs final result (per-round correlation)')
  for (const action of ACTIONS) {
    const stat = result.actionOutcome.p1[action]
    if (stat.rounds === 0) {
      continue
    }
    console.log(
      `${action} | rounds ${stat.rounds} | avg ΔHP ${formatNumber(stat.deltaSum / stat.rounds)} | win ${formatPercent(
        stat.wins / stat.rounds,
      )} | loss ${formatPercent(stat.losses / stat.rounds)} | draw ${formatPercent(stat.draws / stat.rounds)}`,
    )
  }
  console.log('')
  console.log('Action pair (P1 vs P2) -> avg ΔHP for P1, win/loss/draw')
  for (const a1 of ACTIONS) {
    for (const a2 of ACTIONS) {
      const stat = result.pairStats[a1][a2]
      if (stat.rounds === 0) {
        continue
      }
      console.log(
        `${a1} vs ${a2} | rounds ${stat.rounds} | avg ΔHP ${formatNumber(stat.deltaSum / stat.rounds)} | win ${formatPercent(
          stat.wins / stat.rounds,
        )} | loss ${formatPercent(stat.losses / stat.rounds)} | draw ${formatPercent(stat.draws / stat.rounds)}`,
      )
    }
  }
}

try {
  simulate()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
