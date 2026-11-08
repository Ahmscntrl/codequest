// Reference solutions for JavaScript Chapter 2 (The Neon Grid).
const T = "// tests (don't change these)\n";
module.exports = {
  // ---- Lambda Lanes
  js2_arrow: 'const triple = (n) => n * 3;\n',
  js2_map: 'function shoutAll(words) {\n  return words.map((w) => w.toUpperCase());\n}\n',
  js2_filter: 'function fastOnly(speeds) {\n  return speeds.filter((s) => s > 60);\n}\n',
  js2_reduce: 'function totalPower(cells) {\n  return cells.reduce((total, c) => total + c, 0);\n}\n',
  js2_find: 'function findCourier(couriers, lane) {\n  const found = couriers.find((c) => c.lane === lane);\n  if (found === undefined) {\n    return "nobody";\n  }\n  return found.name;\n}\n',
  js2_scan: 'function gridStatus(lights) {\n  if (lights.every((l) => l > 0)) {\n    return "ALL ON";\n  }\n  if (!lights.some((l) => l > 0)) {\n    return "DARK";\n  }\n  return "FLICKER";\n}\n',
  js2_highway: 'function stockValue(cart) {\n  return cart\n    .filter((item) => item.inStock)\n    .map((item) => item.price * item.qty)\n    .reduce((sum, v) => sum + v, 0);\n}\n',
  // ---- Unpacking Docks
  js2_tmpl: 'function banner(name, place) {\n  return `${name} finished in place ${place}!`;\n}\n',
  js2_swap: 'function flip(point) {\n  const [x, y] = point;\n  return [y, x];\n}\n',
  js2_objd: 'function scan({ name, bike, lane }) {\n  return `${name} rides a ${bike} in lane ${lane}`;\n}\n',
  js2_defaults: 'function rig(settings) {\n  const { color, power = 100 } = settings;\n  return `${color} at ${power}%`;\n}\n',
  js2_rest: 'function collect(...coins) {\n  return coins.reduce((t, c) => t + c, 0);\n}\n',
  js2_merge: 'const defaults = { theme: "dark", volume: 5, music: true };\nconst saved = { volume: 9, theme: "neon" };\nconst songs = ["Pulse", "Glow"];\nconst newSongs = ["Static", "Drift"];\n\nconst settings = { ...defaults, ...saved };\nconsole.log(settings);\nconst playlist = [...songs, ...newSongs];\nconsole.log(playlist);\nconst { theme, volume } = settings;\nconst [firstSong] = playlist;\nconsole.log(`Theme ${theme}, volume ${volume}, now playing ${firstSong}`);\n\n' + T + 'console.log(defaults.volume);\n',
  // ---- JSON Vault
  js2_keys: 'function fieldList(record) {\n  return Object.keys(record).join(", ");\n}\n',
  js2_entries: 'const inventory = { chips: 3, cables: 5, fuses: 2 };\nlet total = 0;\nfor (const [item, count] of Object.entries(inventory)) {\n  console.log(`${item}: ${count}`);\n  total += count;\n}\nconsole.log(`total: ${total}`);\n',
  js2_surge: 'function surge(prices) {\n  return Object.fromEntries(Object.entries(prices).map(([name, price]) => [name, price * 2]));\n}\n',
  js2_json: 'const save = { hero: "Ada", level: 3, items: ["visor", "key"] };\nconst oldCrystal = \'{"hero":"Bo","level":5}\';\nconsole.log(JSON.stringify(save));\nconst old = JSON.parse(oldCrystal);\nconsole.log(`${old.hero} is level ${old.level}`);\n',
  js2_optional: 'function cityOf(user) {\n  return user?.address?.city ?? "unknown";\n}\n',
  js2_leaders: 'function leaders(json) {\n  const players = JSON.parse(json);\n  return Object.fromEntries(players.filter((p) => p.score >= 50).map(({ name, score }) => [name, score]));\n}\n',
  // ---- Echo Arcade
  js2_pass: 'function applyTwice(fn, x) {\n  const once = fn(x);\n  return fn(once);\n}\n\n' + T + 'console.log(applyTwice((n) => n + 3, 10));\nconsole.log(applyTwice((n) => n * n, 3));\nconsole.log(applyTwice((s) => s + "!", "go"));\n',
  js2_mymap: 'function myMap(arr, fn) {\n  const result = [];\n  for (const item of arr) {\n    result.push(fn(item));\n  }\n  return result;\n}\n\n' + T + 'console.log(myMap([1, 2, 3], (n) => n * 10));\nconsole.log(myMap(["a", "b"], (s) => s.toUpperCase()));\nconsole.log(myMap([], (n) => n + 1));\n',
  js2_booster: 'function makeBooster(amount) {\n  return (speed) => speed + amount;\n}\n\n' + T + 'const turbo = makeBooster(50);\nconst nudge = makeBooster(1);\nconsole.log(turbo(10));\nconsole.log(nudge(10));\nconsole.log(turbo(nudge(0)));\n',
  js2_counter: 'function makeCounter() {\n  let count = 0;\n  return () => {\n    count += 1;\n    return count;\n  };\n}\n\n' + T + 'const north = makeCounter();\nconst south = makeCounter();\nconsole.log(north());\nconsole.log(north());\nconsole.log(south());\nconsole.log(north());\n',
  js2_locker: 'function makeLocker() {\n  let coins = 0;\n  return {\n    deposit(amount) {\n      coins += amount;\n    },\n    balance() {\n      return coins;\n    },\n  };\n}\n\n' + T + 'const locker = makeLocker();\nlocker.deposit(5);\nlocker.deposit(20);\nconsole.log(locker.balance());\nconsole.log(locker.coins);\nconst other = makeLocker();\nconsole.log(other.balance());\n',
  js2_events: 'function makeBoard() {\n  const listeners = [];\n  return {\n    on(fn) {\n      listeners.push(fn);\n    },\n    emit(message) {\n      listeners.forEach((fn) => fn(message));\n    },\n  };\n}\n\n' + T + 'const board = makeBoard();\nboard.on((msg) => console.log("Screen: " + msg));\nboard.emit("doors open");\nboard.on((msg) => console.log("Speaker: " + msg.toUpperCase()));\nboard.emit("high score!");\nconst quiet = makeBoard();\nquiet.emit("nobody hears this");\n',
  // ---- Core Tower
  js2_extends: 'class Robot {\n  constructor(name) {\n    this.name = name;\n  }\n  hello() {\n    return `Beep, I am ${this.name}`;\n  }\n}\n\nclass Drone extends Robot {\n  fly() {\n    return `${this.name} takes off!`;\n  }\n}\n\n' + T + 'const d = new Drone("Lumen");\nconsole.log(d.hello());\nconsole.log(d.fly());\nconsole.log(d instanceof Robot);\n',
  js2_super: 'class Bike {\n  constructor(name) {\n    this.name = name;\n    this.speed = 10;\n  }\n}\n\nclass Racer extends Bike {\n  constructor(name, boost) {\n    super(name);\n    this.boost = boost;\n  }\n  topSpeed() {\n    return this.speed + this.boost;\n  }\n}\n\n' + T + 'const zip = new Racer("Zip", 5);\nconsole.log(zip);\nconsole.log(zip.topSpeed());\n',
  js2_override: 'class Robot {\n  constructor(name) {\n    this.name = name;\n  }\n  describe() {\n    return `${this.name} is a robot.`;\n  }\n}\n\nclass Guard extends Robot {\n  describe() {\n    return super.describe() + " Keep out!";\n  }\n}\n\n' + T + 'console.log(new Robot("Bolt").describe());\nconsole.log(new Guard("Rex").describe());\n',
  js2_thermo: 'class Thermostat {\n  constructor() {\n    this._temp = 20;\n  }\n  get temp() {\n    return this._temp;\n  }\n  set temp(value) {\n    this._temp = Math.min(30, Math.max(10, value));\n  }\n}\n\n' + T + 'const t = new Thermostat();\nconsole.log(t.temp);\nt.temp = 25;\nconsole.log(t.temp);\nt.temp = 50;\nconsole.log(t.temp);\nt.temp = -5;\nconsole.log(t.temp);\n',
  js2_static: 'class Unit {\n  static built = 0;\n  constructor(name) {\n    this.name = name;\n    Unit.built += 1;\n    this.id = Unit.built;\n  }\n  static report() {\n    return `${Unit.built} units built`;\n  }\n}\n\n' + T + 'const a = new Unit("alpha");\nconst b = new Unit("beta");\nconst c = new Unit("gamma");\nconsole.log(a.id, b.id, c.id);\nconsole.log(Unit.report());\nconsole.log(a.built);\n',
  js2_shapes: 'class Shape {\n  constructor(name) {\n    this.name = name;\n  }\n  area() {\n    return 0;\n  }\n  describe() {\n    return `${this.name}: ${this.area()}`;\n  }\n}\n\nclass Rect extends Shape {\n  constructor(width, height) {\n    super("rect");\n    this.width = width;\n    this.height = height;\n  }\n  area() {\n    return this.width * this.height;\n  }\n}\n\nclass Square extends Rect {\n  constructor(side) {\n    super(side, side);\n    this.name = "square";\n  }\n}\n\nclass Triangle extends Shape {\n  constructor(base, height) {\n    super("triangle");\n    this.base = base;\n    this.height = height;\n  }\n  area() {\n    return this.base * this.height / 2;\n  }\n}\n\n' + T + 'const shapes = [new Rect(2, 5), new Square(3), new Triangle(4, 6)];\nshapes.forEach((s) => console.log(s.describe()));\n\nconst total = shapes.map((s) => s.area()).reduce((t, a) => t + a, 0);\nconsole.log(`total: ${total}`);\n',
  js2_final: `const teamData = '[{"type":"knight","name":"Ada","hp":12,"power":3},{"type":"mage","name":"Bo","hp":0,"power":5},{"type":"mage","name":"Cy","hp":7},{"type":"knight","name":"Dee","hp":4}]';

class Hero {
  constructor(data) {
    const { name, hp, power = 1 } = data;
    this.name = name;
    this.hp = hp;
    this.power = power;
  }
  attack() {
    return this.power * 10;
  }
  get alive() {
    return this.hp > 0;
  }
  static from(data) {
    if (data.type === "mage") {
      return new Mage(data);
    }
    return new Hero(data);
  }
}

class Mage extends Hero {
  attack() {
    return super.attack() * 2;
  }
}

const team = JSON.parse(teamData).map((d) => Hero.from(d));
const damage = team.filter((h) => h.alive).reduce((sum, h) => sum + h.attack(), 0);

// final strike (don't change anything below)
for (const hero of team) {
  console.log(\`\${hero.name} (\${hero.constructor.name}): alive \${hero.alive}, attack \${hero.attack()}\`);
}
console.log(\`Total damage: \${damage}\`);
if (damage >= 60) {
  console.log("The Undefined is defeated!");
} else {
  console.log("Not enough power. The Undefined laughs.");
}
`,
};
