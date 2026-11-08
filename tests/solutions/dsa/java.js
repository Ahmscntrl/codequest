module.exports = Object.assign({}, require('./part1_java.js'), (() => { try { return require('./part2_java.js'); } catch (e) { return {}; } })());
