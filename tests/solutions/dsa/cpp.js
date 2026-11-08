module.exports = Object.assign({}, require('./part1_cpp.js'), (() => { try { return require('./part2_cpp.js'); } catch (e) { return {}; } })());
