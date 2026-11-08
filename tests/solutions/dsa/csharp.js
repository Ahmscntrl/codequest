module.exports = Object.assign({}, require('./part1_csharp.js'), (() => { try { return require('./part2_csharp.js'); } catch (e) { return {}; } })());
