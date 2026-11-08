module.exports = Object.assign({}, require('./part1_javascript.js'), (() => { try { return require('./part2_javascript.js'); } catch (e) { return {}; } })());
