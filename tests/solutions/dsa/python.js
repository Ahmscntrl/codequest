module.exports = Object.assign({}, require('./part1_python.js'), (() => { try { return require('./part2_python.js'); } catch (e) { return {}; } })());
