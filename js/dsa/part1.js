/* CodeQuest: Data Structures & Algorithms, part 1 (levels 1-4):
 * Arrays & Big-O, Searching, Hash Maps, Stacks & Queues. Every terminal, tutorial page, hint and
 * example exists in all five languages. See docs/DSA.md for the format.
 */
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { c, escapeHTML } = GD.helpers;
  const tn = (n, ctx) => Lang.testName(n, ctx.lang);
  const LANGS = ['python', 'javascript', 'cpp', 'csharp', 'java'];
  const code = (s) => `<code>${escapeHTML(s)}</code>`;
  const pre = (s) => `<pre>${escapeHTML(s)}</pre>`;
  const byLang = (f) => Object.fromEntries(LANGS.map(l => [l, f(l)]));

  // ------------------------------------------------------------ whole programs in each language
  const trim = (s) => String(s || '').replace(/^\n+|\s+$/g, '');
  const ind = (s, n) => s.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n');
  function cppIncludes(src) {
    const inc = ['iostream'];
    if (/\bstring\b/.test(src)) inc.push('string');
    if (/\bvector\s*</.test(src)) inc.push('vector');
    if (/\bmap\s*</.test(src)) inc.push('map');
    if (/\bunordered_map\s*</.test(src)) inc.push('unordered_map');
    if (/\bstack\s*</.test(src)) inc.push('stack');
    if (/\bqueue\s*</.test(src)) inc.push('queue');
    if (/\b(sort|reverse|swap|max|min)\s*\(/.test(src)) inc.push('algorithm');
    return inc.map(h => `#include <${h}>`).join('\n');
  }
  // WRAP[lang](functions, main body) -> a complete program, written the way Chapter 1 writes it
  const WRAP = {
    python: (fns, body) => [trim(fns), trim(body)].filter(Boolean).join('\n\n') + '\n',
    javascript: (fns, body) => [trim(fns), trim(body)].filter(Boolean).join('\n\n') + '\n',
    cpp: (fns, body) => {
      const top = trim(fns) ? trim(fns) + '\n\n' : '';
      return `${cppIncludes(top + body)}\nusing namespace std;\n\n${top}int main() {\n${ind(trim(body), 4)}\n    return 0;\n}\n`;
    },
    csharp: (fns, body) => [trim(fns), trim(body)].filter(Boolean).join('\n\n') + '\n',
    java: (fns, body) => {
      const all = fns + body;
      const imp = /\b(Arrays|ArrayList|List|Map|HashMap|Stack|Deque|ArrayDeque|Queue|LinkedList)\b/.test(all) ? 'import java.util.*;\n\n' : '';
      return `${imp}public class Main {\n${trim(fns) ? ind(trim(fns), 4) + '\n\n' : ''}    public static void main(String[] args) {\n${ind(trim(body), 8)}\n    }\n}\n`;
    },
  };
  // prog({ python: [functions, body], ... }) -> { python: program, ... }
  const prog = (o) => byLang(l => WRAP[l](o[l][0], o[l][1]));

  // ------------------------------------------------------------ function terminals
  const TYPES = {
    int: { cpp: 'int', csharp: 'int', java: 'int' },
    bool: { cpp: 'bool', csharp: 'bool', java: 'boolean' },
    str: { cpp: 'string', csharp: 'string', java: 'String' },
    ints: { cpp: 'vector<int>', csharp: 'int[]', java: 'int[]' },
    strs: { cpp: 'vector<string>', csharp: 'string[]', java: 'String[]' },
    bools: { cpp: 'vector<bool>', csharp: 'bool[]', java: 'boolean[]' },
  };
  const isList = (t) => /s$/.test(t);
  function header(lang, s, open) {
    const name = Lang.testName(s.fn, lang);
    const names = s.params.map(p => p[0]).join(', ');
    if (lang === 'python') return `def ${name}(${names}):`;
    if (lang === 'javascript') return `function ${name}(${names}) {`;
    const typed = s.params.map(([n, t]) => TYPES[t][lang] + ' ' + n).join(', ');
    const ret = TYPES[s.ret][lang];
    if (lang === 'cpp') return `${ret} ${name}(${typed})` + (open ? ' {' : '');
    if (lang === 'java') return `static ${ret} ${name}(${typed})` + (open ? ' {' : '');
    return `${ret} ${name}(${typed})` + (open ? '\n{' : '');
  }
  // how the function is called, as the player sees it in a description
  const sigText = (lang, s) => lang === 'python' || lang === 'javascript' ? header(lang, s).replace(/^(def|function) /, '').replace(/[:{]\s*$/, '').trim() : header(lang, s, false);
  const fnCode = (lang, s, body) => header(lang, s, true) + '\n' + trim(body) + (lang === 'python' ? '' : '\n}');
  // a value written as source code in each language
  function lit(lang, v, t) {
    if (isList(t)) {
      const et = t.slice(0, -1), items = v.map(x => lit(lang, x, et)).join(', ');
      if (lang === 'python' || lang === 'javascript') return `[${items}]`;
      if (lang === 'cpp') return `{${items}}`;
      const tyName = TYPES[et][lang];
      if (!v.length) return `new ${tyName}[0]`;
      return lang === 'csharp' ? `new ${tyName}[] { ${items} }` : `new ${tyName}[]{${items}}`;
    }
    if (t === 'str') return JSON.stringify(v);
    if (t === 'bool') return lang === 'python' ? (v ? 'True' : 'False') : String(v);
    return String(v);
  }
  // a line that calls the function and prints what it returns
  function printCall(lang, s, args) {
    const e = `${Lang.testName(s.fn, lang)}(${args.map((a, i) => lit(lang, a, s.params[i][1])).join(', ')})`;
    const list = isList(s.ret);
    if (lang === 'python') return `print(${e})`;
    if (lang === 'javascript') return `console.log(${e});`;
    if (lang === 'cpp') {
      if (list) return `for (int x : ${e}) {\n    cout << x << " ";\n}\ncout << endl;`;
      return s.ret === 'bool' ? `cout << boolalpha << ${e} << endl;` : `cout << ${e} << endl;`;
    }
    if (lang === 'csharp') return list ? `Console.WriteLine(string.Join(", ", ${e}));` : `Console.WriteLine(${e});`;
    return list ? `System.out.println(Arrays.toString(${e}));` : `System.out.println(${e});`;
  }
  const fnProgram = (lang, s, body, samples) => WRAP[lang](fnCode(lang, s, body), samples.map(a => printCall(lang, s, a)).join('\n'));
  // values in a description: lists in [ ], text in quotes, true/false the way the language writes them
  const show = (ctx, v) => Array.isArray(v) ? '[' + v.map(x => show(ctx, x)).join(', ') + ']' : typeof v === 'string' ? JSON.stringify(v) : typeof v === 'boolean' ? Lang.get(ctx.lang)[v ? 'True' : 'False'] : String(v);
  const examples = (ctx, s, tests) => pre(tests.map(([a, w]) => `${tn(s.fn, ctx)}(${a.map(x => show(ctx, x)).join(', ')})`).map((x, i, all) => x.padEnd(Math.max(...all.map(y => y.length)) + 2) + '→  ' + show(ctx, tests[i][1])).join('\n'));
  const NAMES = { python: 'a list', javascript: 'an array', cpp: 'a vector', csharp: 'an array', java: 'an array' };
  // fnT({ title, sig, desc(ctx, sig, examples), stub: {lang: body}, samples, tests: [[args, want]], hints, similar: { task, sig, body, samples }, show })
  function fnT(o) {
    return {
      title: o.title,
      desc: (ctx) => o.desc(ctx, code(sigText(ctx.lang, o.sig)), examples(ctx, o.sig, o.tests.slice(0, o.show || 3))),
      starter: byLang(l => fnProgram(l, o.sig, o.stub[l], o.samples)),
      hints: o.hints,
      similar: byLang(l => ({ task: o.similar.task, code: fnProgram(l, o.similar.sig, o.similar.body[l], o.similar.samples) })),
      callTests: o.tests.map(([args]) => ({ fn: o.sig.fn, args })),
      expectCalls: o.tests.map(t => t[1]),
      require: o.require, gate: o.gate, success: o.success,
      sig: o.sig, samples: o.samples,
    };
  }
  // the tests build reference solutions with the same program shape
  GD.dsaPart1Kit = { fnProgram, prog };

  // requirement helpers
  const NO_REVERSE = [/^(?![\s\S]*(\breverse\s*\(|\bReverse\s*\(|\[\s*:\s*:\s*-1\s*\]|reversed\s*\())/, 'Do it with your own two pointers this time, without a built-in reverse.'];
  const WHILE = [/\bwhile\b/, 'Use a <b>while</b> loop that keeps shrinking the range between low and high.'];
  const MAP = {
    python: [[/\{|dict\s*\(/, 'Use a dictionary to remember what you have counted or seen.']],
    javascript: [[/new\s+Map\b|\{\s*\}/, 'Use a <code>Map</code> (or an object) to remember what you have counted or seen.']],
    cpp: [[/map\s*</, 'Use an <code>unordered_map</code> (or <code>map</code>) to remember what you have counted or seen.']],
    csharp: [[/Dictionary\s*</, 'Use a <code>Dictionary</code> to remember what you have counted or seen.']],
    java: [[/Map\s*</, 'Use a <code>HashMap</code> to remember what you have counted or seen.']],
  };

  const ch = {};
  // ======================================================================= 1. Arrays & Big-O
  ch.dsa_arrays1 = fnT({
    title: 'The Lost Crate',
    sig: { fn: 'find_index', ret: 'int', params: [['items', 'ints'], ['target', 'int']] },
    desc: (ctx, sig, ex) => `<p>The dock workers have lost a crate. Write ${sig}: look at each item from the start, and return the <b>index</b> of the first one that equals ${c('target')}. If it isn't there, return ${c('-1')}.</p>${ex}
      <p>This is <b>linear search</b>. In the worst case it looks at every item once, so it is <b>O(n)</b>. Write the loop yourself, without a built-in search.</p>`,
    stub: {
      python: `    for i in range(len(items)):\n        pass  # if items[i] is the target, return i\n    return -1`,
      javascript: `  for (let i = 0; i < items.length; i++) {\n    // if items[i] is the target, return i\n  }\n  return -1;`,
      cpp: `    for (int i = 0; i < items.size(); i++) {\n        // if items[i] is the target, return i\n    }\n    return -1;`,
      csharp: `    for (int i = 0; i < items.Length; i++)\n    {\n        // if items[i] is the target, return i\n    }\n    return -1;`,
      java: `    for (int i = 0; i < items.length; i++) {\n        // if items[i] is the target, return i\n    }\n    return -1;`,
    },
    samples: [[[4, 8, 15, 16, 23], 15]],
    tests: [[[[4, 8, 15, 16, 23], 15], 2], [[[4, 8, 15], 4], 0], [[[1, 2, 3], 9], -1], [[[7, 3, 7], 7], 0], [[[], 5], -1], [[[5, 6, 7, 8, 9, 10], 10], 5]],
    hints: ['Inside the loop, compare items[i] with target. If they are equal, you can return right away.', 'The return -1 after the loop only runs when the loop finished without finding anything. That is exactly the "not found" case.'],
    similar: {
      task: 'Count how many times a number appears in a list.',
      sig: { fn: 'count_matches', ret: 'int', params: [['items', 'ints'], ['target', 'int']] },
      samples: [[[2, 5, 2, 2, 9], 2]],
      body: {
        python: `    count = 0\n    for x in items:\n        if x == target:\n            count += 1\n    return count`,
        javascript: `  let count = 0;\n  for (const x of items) {\n    if (x === target) {\n      count += 1;\n    }\n  }\n  return count;`,
        cpp: `    int count = 0;\n    for (int x : items) {\n        if (x == target) {\n            count += 1;\n        }\n    }\n    return count;`,
        csharp: `    int count = 0;\n    foreach (int x in items)\n    {\n        if (x == target)\n        {\n            count += 1;\n        }\n    }\n    return count;`,
        java: `    int count = 0;\n    for (int x : items) {\n        if (x == target) {\n            count += 1;\n        }\n    }\n    return count;`,
      },
    },
    require: [[/^(?![\s\S]*(\.index\s*\(|indexOf\s*\(|IndexOf\s*\(|\bfind\s*\())/, 'Write the search loop yourself instead of using a built-in search.']],
    gate: 'A',
    success: 'The crate turns up at index 2. <b>Linear search: simple, and O(n).</b>',
  });

  ch.dsa_arrays2 = fnT({
    title: 'The Thermometer',
    sig: { fn: 'min_max', ret: 'ints', params: [['nums', 'ints']] },
    desc: (ctx, sig, ex) => `<p>The harbour thermometer logged a day of readings. Write ${sig} that returns ${NAMES[ctx.lang]} of two numbers: the <b>smallest</b> reading and the <b>largest</b>, in that order. The list always has at least one number.</p>${ex}
      <p>Do it in <b>one pass</b>: keep the smallest and largest so far and update them as you go. Start both at the first item, not at 0 (the readings can be negative).</p>`,
    stub: {
      python: `    smallest = nums[0]\n    largest = nums[0]\n    for n in nums:\n        pass  # update smallest and largest\n    return [smallest, largest]`,
      javascript: `  let smallest = nums[0];\n  let largest = nums[0];\n  for (const n of nums) {\n    // update smallest and largest\n  }\n  return [smallest, largest];`,
      cpp: `    int smallest = nums[0];\n    int largest = nums[0];\n    for (int n : nums) {\n        // update smallest and largest\n    }\n    return {smallest, largest};`,
      csharp: `    int smallest = nums[0];\n    int largest = nums[0];\n    foreach (int n in nums)\n    {\n        // update smallest and largest\n    }\n    return new int[] { smallest, largest };`,
      java: `    int smallest = nums[0];\n    int largest = nums[0];\n    for (int n : nums) {\n        // update smallest and largest\n    }\n    return new int[]{smallest, largest};`,
    },
    samples: [[[3, 9, 1, 7]]],
    tests: [[[[3, 9, 1, 7]], [1, 9]], [[[5]], [5, 5]], [[[-4, -2, -9]], [-9, -2]], [[[2, 2, 8, 0, 8]], [0, 8]], [[[10, 20, 30]], [10, 30]]],
    hints: ['Two separate if checks inside the loop: one for "smaller than smallest", one for "bigger than largest".', 'Why not start at 0? For [-4, -2, -9] the largest reading is -2, and 0 would never get replaced.'],
    similar: {
      task: 'Return the longest word in a list (the first one if there is a tie).',
      sig: { fn: 'longest_word', ret: 'str', params: [['words', 'strs']] },
      samples: [[['sea', 'harbour', 'boat']]],
      body: {
        python: `    best = words[0]\n    for w in words:\n        if len(w) > len(best):\n            best = w\n    return best`,
        javascript: `  let best = words[0];\n  for (const w of words) {\n    if (w.length > best.length) {\n      best = w;\n    }\n  }\n  return best;`,
        cpp: `    string best = words[0];\n    for (string w : words) {\n        if (w.size() > best.size()) {\n            best = w;\n        }\n    }\n    return best;`,
        csharp: `    string best = words[0];\n    foreach (string w in words)\n    {\n        if (w.Length > best.Length)\n        {\n            best = w;\n        }\n    }\n    return best;`,
        java: `    String best = words[0];\n    for (String w : words) {\n        if (w.length() > best.length()) {\n            best = w;\n        }\n    }\n    return best;`,
      },
    },
    require: [[/^(?![\s\S]*(\b(min|max)\s*\(\s*nums\s*\)|\.\.\.\s*nums|\.(Min|Max)\s*\(|_element|stream\s*\(|Collections\s*\.|\bsort))/, 'Find both in your own loop, without built-in min/max or sorting.']],
    gate: 'B',
    success: 'Coldest and hottest, found in a single pass. <b>Still O(n).</b>',
  });

  ch.dsa_arrays3 = fnT({
    title: 'The Mirror Hall',
    sig: { fn: 'reverse_in_place', ret: 'ints', params: [['nums', 'ints']] },
    desc: (ctx, sig, ex) => `<p>Everything in the Mirror Hall is back to front. Write ${sig} that reverses the list <b>in place</b>: swap items inside the same list instead of building a new one, then return it.</p>${ex}
      <p>Use <b>two pointers</b>: ${c('left')} starts at the first index and ${c('right')} at the last. Swap the two items, move both pointers one step toward the middle, and stop when they meet.${ctx.lang === 'cpp' ? ` (In C++ the vector arrives as a copy, which is why you return it at the end.)` : ''}</p>`,
    stub: {
      python: `    left = 0\n    right = len(nums) - 1\n    while left < right:\n        # swap nums[left] and nums[right], then move both pointers\n        break\n    return nums`,
      javascript: `  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    // swap nums[left] and nums[right], then move both pointers\n    break;\n  }\n  return nums;`,
      cpp: `    int left = 0;\n    int right = nums.size() - 1;\n    while (left < right) {\n        // swap nums[left] and nums[right], then move both pointers\n        break;\n    }\n    return nums;`,
      csharp: `    int left = 0;\n    int right = nums.Length - 1;\n    while (left < right)\n    {\n        // swap nums[left] and nums[right], then move both pointers\n        break;\n    }\n    return nums;`,
      java: `    int left = 0;\n    int right = nums.length - 1;\n    while (left < right) {\n        // swap nums[left] and nums[right], then move both pointers\n        break;\n    }\n    return nums;`,
    },
    samples: [[[1, 2, 3, 4, 5]]],
    tests: [[[[1, 2, 3, 4, 5]], [5, 4, 3, 2, 1]], [[[1, 2]], [2, 1]], [[[7]], [7]], [[[]], []], [[[3, 1, 4, 1, 5, 9]], [9, 5, 1, 4, 1, 3]]],
    hints: [],   // per language, set below
    similar: {
      task: 'Add up the outside pairs of a list: first + last, then second + second-to-last, and so on.',
      sig: { fn: 'pair_up', ret: 'ints', params: [['nums', 'ints']] },
      samples: [[[1, 2, 3, 4, 5, 6]]],
      body: {
        python: `    sums = []\n    left = 0\n    right = len(nums) - 1\n    while left < right:\n        sums.append(nums[left] + nums[right])\n        left += 1\n        right -= 1\n    return sums`,
        javascript: `  const sums = [];\n  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    sums.push(nums[left] + nums[right]);\n    left++;\n    right--;\n  }\n  return sums;`,
        cpp: `    vector<int> sums;\n    int left = 0;\n    int right = nums.size() - 1;\n    while (left < right) {\n        sums.push_back(nums[left] + nums[right]);\n        left++;\n        right--;\n    }\n    return sums;`,
        csharp: `    var sums = new List<int>();\n    int left = 0;\n    int right = nums.Length - 1;\n    while (left < right)\n    {\n        sums.Add(nums[left] + nums[right]);\n        left++;\n        right--;\n    }\n    return sums.ToArray();`,
        java: `    int[] sums = new int[nums.length / 2];\n    int left = 0;\n    int right = nums.length - 1;\n    while (left < right) {\n        sums[left] = nums[left] + nums[right];\n        left++;\n        right--;\n    }\n    return sums;`,
      },
    },
    require: [NO_REVERSE, [/\bwhile\b/, 'Use a <b>while</b> loop that runs while <code>left &lt; right</code>.']],
    gate: 'C',
    success: 'The reflections line up. Every item moved once: <b>O(n)</b>, and no extra list needed.',
  });
  ch.dsa_arrays3.hints = {
    python: ['Take out the break first, or the loop stops after one look.', 'Python can swap two items in one line: a, b = b, a works for list items too.', 'After the swap: left goes up by one, right goes down by one.'],
    javascript: ['Take out the break first, or the loop stops after one look.', 'To swap, keep one value in a temporary variable first, then copy the other one across.', 'After the swap: left goes up by one, right goes down by one.'],
    cpp: ['Take out the break first, or the loop stops after one look.', 'swap(x, y) from <algorithm> swaps two variables, including two items of a vector.', 'After the swap: left goes up by one, right goes down by one.'],
    csharp: ['Take out the break first, or the loop stops after one look.', 'To swap, keep one value in a temporary variable first, then copy the other one across.', 'After the swap: left goes up by one, right goes down by one.'],
    java: ['Take out the break first, or the loop stops after one look.', 'To swap, keep one value in a temporary variable first, then copy the other one across.', 'After the swap: left goes up by one, right goes down by one.'],
  };

  ch.dsa_arrays4 = fnT({
    title: 'The Echo Gate',
    sig: { fn: 'is_palindrome', ret: 'bool', params: [['word', 'str']] },
    desc: (ctx, sig, ex) => `<p>The Echo Gate only opens for words that read the same forwards and backwards. Write ${sig} that returns ${c(Lang.get(ctx.lang).True)} for a palindrome and ${c(Lang.get(ctx.lang).False)} otherwise.</p>${ex}
      <p>Two pointers again: compare the first and last letters, then the second and second-to-last, and so on. As soon as one pair doesn't match you know the answer. Don't build a reversed copy.</p>`,
    stub: {
      python: `    left = 0\n    right = len(word) - 1\n    while left < right:\n        # compare word[left] and word[right]\n        left += 1\n        right -= 1\n    return False`,
      javascript: `  let left = 0;\n  let right = word.length - 1;\n  while (left < right) {\n    // compare word[left] and word[right]\n    left++;\n    right--;\n  }\n  return false;`,
      cpp: `    int left = 0;\n    int right = word.size() - 1;\n    while (left < right) {\n        // compare word[left] and word[right]\n        left++;\n        right--;\n    }\n    return false;`,
      csharp: `    int left = 0;\n    int right = word.Length - 1;\n    while (left < right)\n    {\n        // compare word[left] and word[right]\n        left++;\n        right--;\n    }\n    return false;`,
      java: `    int left = 0;\n    int right = word.length() - 1;\n    while (left < right) {\n        // compare word.charAt(left) and word.charAt(right)\n        left++;\n        right--;\n    }\n    return false;`,
    },
    samples: [['racecar'], ['lever']],
    tests: [[['racecar'], true], [['lever'], false], [['level'], true], [['a'], true], [[''], true], [['abca'], false], [['noon'], true]],
    show: 3,
    hints: ['If the two letters are different, you can return the "no" answer straight away.', 'If the loop gets all the way to the middle without finding a mismatch, what does that tell you? Change the last return.'],
    similar: {
      task: 'Count how many letter pairs (first and last, second and second-to-last, ...) do not match.',
      sig: { fn: 'count_mismatches', ret: 'int', params: [['word', 'str']] },
      samples: [['abcda']],
      body: {
        python: `    count = 0\n    left = 0\n    right = len(word) - 1\n    while left < right:\n        if word[left] != word[right]:\n            count += 1\n        left += 1\n        right -= 1\n    return count`,
        javascript: `  let count = 0;\n  let left = 0;\n  let right = word.length - 1;\n  while (left < right) {\n    if (word[left] !== word[right]) {\n      count++;\n    }\n    left++;\n    right--;\n  }\n  return count;`,
        cpp: `    int count = 0;\n    int left = 0;\n    int right = word.size() - 1;\n    while (left < right) {\n        if (word[left] != word[right]) {\n            count++;\n        }\n        left++;\n        right--;\n    }\n    return count;`,
        csharp: `    int count = 0;\n    int left = 0;\n    int right = word.Length - 1;\n    while (left < right)\n    {\n        if (word[left] != word[right])\n        {\n            count++;\n        }\n        left++;\n        right--;\n    }\n    return count;`,
        java: `    int count = 0;\n    int left = 0;\n    int right = word.length() - 1;\n    while (left < right) {\n        if (word.charAt(left) != word.charAt(right)) {\n            count++;\n        }\n        left++;\n        right--;\n    }\n    return count;`,
      },
    },
    require: [NO_REVERSE],
    gate: 'D',
    success: 'R-A-C-E-C-A-R. The gate echoes it back and swings open.',
  });

  ch.dsa_arrays5 = fnT({
    title: 'The Balance Scale',
    sig: { fn: 'pair_sum', ret: 'ints', params: [['nums', 'ints'], ['target', 'int']] },
    desc: (ctx, sig, ex) => `<p>The scale balances when two weights add up to the target. The list is <b>sorted</b> from small to big. Write ${sig} that returns the two numbers (smaller one first) that add up to ${c('target')}, or an empty list if no pair does. Each number can be used once.</p>${ex}
      <p>A loop inside a loop would try every pair: that is <b>O(n²)</b>. Because the list is sorted you can do it in <b>O(n)</b> with two pointers: if the sum is too small, move ${c('left')} up; if it's too big, move ${c('right')} down.</p>`,
    stub: {
      python: `    left = 0\n    right = len(nums) - 1\n    while left < right:\n        total = nums[left] + nums[right]\n        # too small? too big? just right?\n        break\n    return []`,
      javascript: `  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    const total = nums[left] + nums[right];\n    // too small? too big? just right?\n    break;\n  }\n  return [];`,
      cpp: `    int left = 0;\n    int right = nums.size() - 1;\n    while (left < right) {\n        int total = nums[left] + nums[right];\n        // too small? too big? just right?\n        break;\n    }\n    return {};`,
      csharp: `    int left = 0;\n    int right = nums.Length - 1;\n    while (left < right)\n    {\n        int total = nums[left] + nums[right];\n        // too small? too big? just right?\n        break;\n    }\n    return new int[0];`,
      java: `    int left = 0;\n    int right = nums.length - 1;\n    while (left < right) {\n        int total = nums[left] + nums[right];\n        // too small? too big? just right?\n        break;\n    }\n    return new int[0];`,
    },
    samples: [[[2, 4, 7, 11, 15], 18]],
    tests: [[[[2, 4, 7, 11, 15], 18], [7, 11]], [[[1, 2, 3, 9], 8], []], [[[-3, 0, 1, 5], 2], [-3, 5]], [[[5, 5], 10], [5, 5]], [[[4], 8], []], [[[1, 3, 6, 10, 14, 20], 16], [6, 10]]],
    hints: ['Three cases: total equals target (return the pair), total is smaller (left moves right), total is bigger (right moves left).', 'Why does moving left make the sum bigger? Because the list is sorted, the next item is at least as large.'],
    similar: {
      task: 'In a sorted list, count the pairs whose sum is below a limit, with two pointers.',
      sig: { fn: 'count_pairs_below', ret: 'int', params: [['nums', 'ints'], ['limit', 'int']] },
      samples: [[[1, 2, 3, 4, 5], 6]],
      body: {
        python: `    count = 0\n    left = 0\n    right = len(nums) - 1\n    while left < right:\n        if nums[left] + nums[right] < limit:\n            count += right - left\n            left += 1\n        else:\n            right -= 1\n    return count`,
        javascript: `  let count = 0;\n  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    if (nums[left] + nums[right] < limit) {\n      count += right - left;\n      left++;\n    } else {\n      right--;\n    }\n  }\n  return count;`,
        cpp: `    int count = 0;\n    int left = 0;\n    int right = nums.size() - 1;\n    while (left < right) {\n        if (nums[left] + nums[right] < limit) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;`,
        csharp: `    int count = 0;\n    int left = 0;\n    int right = nums.Length - 1;\n    while (left < right)\n    {\n        if (nums[left] + nums[right] < limit)\n        {\n            count += right - left;\n            left++;\n        }\n        else\n        {\n            right--;\n        }\n    }\n    return count;`,
        java: `    int count = 0;\n    int left = 0;\n    int right = nums.length - 1;\n    while (left < right) {\n        if (nums[left] + nums[right] < limit) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;`,
      },
    },
    require: [[/\bwhile\b/, 'Use two pointers and a <b>while</b> loop, so you only walk the list once.']],
    gate: 'E',
    success: 'The scale settles perfectly level. One pass, <b>O(n)</b>, instead of trying every pair.',
  });
  // ======================================================================= 2. Searching
  // the usual binary search loop, as a starter, in each language
  const bsStub = (python, js, cpp, cs, java) => ({ python, javascript: js, cpp, csharp: cs, java });
  ch.dsa_search1 = fnT({
    title: 'The Halving Stair',
    sig: { fn: 'halvings', ret: 'int', params: [['n', 'int']] },
    desc: (ctx, sig, ex) => `<p>Every step of this staircase is half as wide as the one before. Write ${sig}: how many times can you halve ${c('n')} (rounding down) before it reaches 1?</p>${ex}
      <p>Look at the last example: a billion-ish number only needs about 30 halvings. That's why halving algorithms are <b>O(log n)</b>.${ctx.lang === 'javascript' ? ` In JavaScript, ${code('Math.floor(n / 2)')} halves and rounds down.` : ctx.lang === 'python' ? ` In Python, ${code('n // 2')} halves and rounds down.` : ` Dividing two ${code('int')}s already rounds down.`}</p>`,
    stub: {
      python: `    count = 0\n    # halve n until it reaches 1, counting each halving\n    return count`,
      javascript: `  let count = 0;\n  // halve n until it reaches 1, counting each halving\n  return count;`,
      cpp: `    int count = 0;\n    // halve n until it reaches 1, counting each halving\n    return count;`,
      csharp: `    int count = 0;\n    // halve n until it reaches 1, counting each halving\n    return count;`,
      java: `    int count = 0;\n    // halve n until it reaches 1, counting each halving\n    return count;`,
    },
    samples: [[1000]],
    tests: [[[8], 3], [[10], 3], [[2000000000], 30], [[1], 0], [[2], 1], [[1000], 9], [[1000000], 19]],
    hints: ['A while loop fits: keep going while n is bigger than 1.', 'Each time round the loop: halve n, and add 1 to count.'],
    similar: {
      task: 'How many times do you need to double start until it is at least goal?',
      sig: { fn: 'doublings', ret: 'int', params: [['start', 'int'], ['goal', 'int']] },
      samples: [[3, 50]],
      body: {
        python: `    count = 0\n    while start < goal:\n        start = start * 2\n        count += 1\n    return count`,
        javascript: `  let count = 0;\n  while (start < goal) {\n    start = start * 2;\n    count++;\n  }\n  return count;`,
        cpp: `    int count = 0;\n    while (start < goal) {\n        start = start * 2;\n        count++;\n    }\n    return count;`,
        csharp: `    int count = 0;\n    while (start < goal)\n    {\n        start = start * 2;\n        count++;\n    }\n    return count;`,
        java: `    int count = 0;\n    while (start < goal) {\n        start = start * 2;\n        count++;\n    }\n    return count;`,
      },
    },
    require: [[/\bwhile\b|\bfor\b/, 'Use a loop that halves n again and again.']],
    gate: 'A',
    success: 'Two billion, halved 30 times, is down to 1. That is O(log n) at work.',
  });

  ch.dsa_search2 = fnT({
    title: 'The Index Card',
    sig: { fn: 'binary_search', ret: 'int', params: [['items', 'ints'], ['target', 'int']] },
    desc: (ctx, sig, ex) => `<p>The library catalogue is sorted from small to big. Write ${sig} that returns the index of ${c('target')}, or ${c('-1')} if it isn't there, using <b>binary search</b>.</p>${ex}
      <p>Keep a range ${c('low')}..${c('high')}. Look at the middle item: if it's the target you're done; if it's too small the target must be to the <b>right</b>, so move ${c('low')} past the middle; if it's too big, move ${c('high')} below it. Stop when the range is empty.</p>`,
    stub: bsStub(
      `    low = 0\n    high = len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        # is items[mid] the target? too small? too big?\n        break\n    return -1`,
      `  let low = 0;\n  let high = items.length - 1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    // is items[mid] the target? too small? too big?\n    break;\n  }\n  return -1;`,
      `    int low = 0;\n    int high = items.size() - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        // is items[mid] the target? too small? too big?\n        break;\n    }\n    return -1;`,
      `    int low = 0;\n    int high = items.Length - 1;\n    while (low <= high)\n    {\n        int mid = (low + high) / 2;\n        // is items[mid] the target? too small? too big?\n        break;\n    }\n    return -1;`,
      `    int low = 0;\n    int high = items.length - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        // is items[mid] the target? too small? too big?\n        break;\n    }\n    return -1;`),
    samples: [[[1, 3, 5, 7, 9, 11], 7]],
    tests: [[[[1, 3, 5, 7, 9, 11], 7], 3], [[[1, 3, 5, 7, 9, 11], 4], -1], [[[1, 3, 5, 7, 9, 11], 1], 0], [[[1, 3, 5, 7, 9, 11], 11], 5], [[[], 3], -1], [[[5], 5], 0], [[[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32], 26], 12]],
    hints: ['Remove the break, then write the three cases with if / else.', 'Too small means the target is further right: low = mid + 1. Too big: high = mid - 1. The +1 and -1 matter, or the loop can get stuck.'],
    similar: {
      task: 'Binary search in a list sorted from BIG to small.',
      sig: { fn: 'search_descending', ret: 'int', params: [['items', 'ints'], ['target', 'int']] },
      samples: [[[50, 40, 30, 20, 10], 20]],
      body: {
        python: `    low = 0\n    high = len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] > target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`,
        javascript: `  let low = 0;\n  let high = items.length - 1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    if (items[mid] === target) return mid;\n    if (items[mid] > target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;`,
        cpp: `    int low = 0;\n    int high = items.size() - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (items[mid] == target) return mid;\n        if (items[mid] > target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;`,
        csharp: `    int low = 0;\n    int high = items.Length - 1;\n    while (low <= high)\n    {\n        int mid = (low + high) / 2;\n        if (items[mid] == target) return mid;\n        if (items[mid] > target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;`,
        java: `    int low = 0;\n    int high = items.length - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (items[mid] == target) return mid;\n        if (items[mid] > target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;`,
      },
    },
    require: [WHILE, [/^(?![\s\S]*(\.index\s*\(|indexOf\s*\(|IndexOf\s*\(|Array\.BinarySearch|Arrays\.binarySearch|\.begin\s*\(\s*\)))/, 'Write the binary search yourself instead of using a built-in one.']],
    gate: 'B',
    success: 'The card is in drawer 3. Sixteen drawers would take at most <b>5 looks</b>.',
  });

  ch.dsa_search3 = fnT({
    title: 'The First Edition',
    sig: { fn: 'first_index', ret: 'int', params: [['items', 'ints'], ['target', 'int']] },
    desc: (ctx, sig, ex) => `<p>Some books have many copies on the sorted shelf, and the collector wants the <b>first</b> one. Write ${sig} that returns the index of the <b>first</b> ${c('target')}, or ${c('-1')}, using binary search.</p>${ex}
      <p>Plain binary search stops at whichever copy it hits. Instead, when ${c('items[mid]')} is the target, <b>remember</b> ${c('mid')} as the best answer so far and keep searching the <b>left</b> half.</p>`,
    stub: bsStub(
      `    low = 0\n    high = len(items) - 1\n    answer = -1\n    while low <= high:\n        mid = (low + high) // 2\n        # found it? remember mid, then keep looking left\n        break\n    return answer`,
      `  let low = 0;\n  let high = items.length - 1;\n  let answer = -1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    // found it? remember mid, then keep looking left\n    break;\n  }\n  return answer;`,
      `    int low = 0;\n    int high = items.size() - 1;\n    int answer = -1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        // found it? remember mid, then keep looking left\n        break;\n    }\n    return answer;`,
      `    int low = 0;\n    int high = items.Length - 1;\n    int answer = -1;\n    while (low <= high)\n    {\n        int mid = (low + high) / 2;\n        // found it? remember mid, then keep looking left\n        break;\n    }\n    return answer;`,
      `    int low = 0;\n    int high = items.length - 1;\n    int answer = -1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        // found it? remember mid, then keep looking left\n        break;\n    }\n    return answer;`),
    samples: [[[1, 2, 2, 2, 3], 2]],
    tests: [[[[1, 2, 2, 2, 3], 2], 1], [[[4, 4, 4, 4], 4], 0], [[[1, 3, 5], 2], -1], [[[1, 3, 5, 5, 7], 5], 2], [[[], 1], -1], [[[1, 1, 2, 2, 2, 2, 2, 2, 2, 9], 2], 2], [[[1, 2, 3, 4, 5, 6, 7, 8, 8], 8], 7]],
    hints: ['When items[mid] equals target: answer = mid, then high = mid - 1 to look further left.', 'The other two cases are the same as in normal binary search.'],
    similar: {
      task: 'A list holds false values and then true values. Find the index of the first true (or -1).',
      sig: { fn: 'first_true', ret: 'int', params: [['flags', 'bools']] },
      samples: [[[false, false, false, true, true]]],
      body: {
        python: `    low = 0\n    high = len(flags) - 1\n    answer = -1\n    while low <= high:\n        mid = (low + high) // 2\n        if flags[mid]:\n            answer = mid\n            high = mid - 1\n        else:\n            low = mid + 1\n    return answer`,
        javascript: `  let low = 0;\n  let high = flags.length - 1;\n  let answer = -1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    if (flags[mid]) {\n      answer = mid;\n      high = mid - 1;\n    } else {\n      low = mid + 1;\n    }\n  }\n  return answer;`,
        cpp: `    int low = 0;\n    int high = flags.size() - 1;\n    int answer = -1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (flags[mid]) {\n            answer = mid;\n            high = mid - 1;\n        } else {\n            low = mid + 1;\n        }\n    }\n    return answer;`,
        csharp: `    int low = 0;\n    int high = flags.Length - 1;\n    int answer = -1;\n    while (low <= high)\n    {\n        int mid = (low + high) / 2;\n        if (flags[mid])\n        {\n            answer = mid;\n            high = mid - 1;\n        }\n        else\n        {\n            low = mid + 1;\n        }\n    }\n    return answer;`,
        java: `    int low = 0;\n    int high = flags.length - 1;\n    int answer = -1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (flags[mid]) {\n            answer = mid;\n            high = mid - 1;\n        } else {\n            low = mid + 1;\n        }\n    }\n    return answer;`,
      },
    },
    require: [WHILE],
    gate: 'C',
    success: 'The first edition, still in its dust jacket. <b>Found in O(log n), duplicates and all.</b>',
  });

  ch.dsa_search4 = fnT({
    title: 'The Shelf Gap',
    sig: { fn: 'insert_position', ret: 'int', params: [['items', 'ints'], ['target', 'int']] },
    desc: (ctx, sig, ex) => `<p>A new book arrives. Write ${sig} that returns the index where ${c('target')} should be <b>inserted</b> so the list stays sorted. If equal numbers are already there, it goes <b>before</b> them. In other words: the index of the first item that is ${code('>= target')}, or the length of the list if there is none.</p>${ex}
      <p>This time ${c('high')} starts at the <b>length</b> (the gap after the last item is allowed), and the loop runs while ${code('low < high')}. The answer is where ${c('low')} and ${c('high')} meet.</p>`,
    stub: bsStub(
      `    low = 0\n    high = len(items)\n    while low < high:\n        mid = (low + high) // 2\n        # is items[mid] too small (answer is right of mid), or could mid be the answer?\n        break\n    return low`,
      `  let low = 0;\n  let high = items.length;\n  while (low < high) {\n    const mid = Math.floor((low + high) / 2);\n    // is items[mid] too small (answer is right of mid), or could mid be the answer?\n    break;\n  }\n  return low;`,
      `    int low = 0;\n    int high = items.size();\n    while (low < high) {\n        int mid = (low + high) / 2;\n        // is items[mid] too small (answer is right of mid), or could mid be the answer?\n        break;\n    }\n    return low;`,
      `    int low = 0;\n    int high = items.Length;\n    while (low < high)\n    {\n        int mid = (low + high) / 2;\n        // is items[mid] too small (answer is right of mid), or could mid be the answer?\n        break;\n    }\n    return low;`,
      `    int low = 0;\n    int high = items.length;\n    while (low < high) {\n        int mid = (low + high) / 2;\n        // is items[mid] too small (answer is right of mid), or could mid be the answer?\n        break;\n    }\n    return low;`),
    samples: [[[1, 3, 5, 6], 2]],
    tests: [[[[1, 3, 5, 6], 5], 2], [[[1, 3, 5, 6], 2], 1], [[[1, 3, 5, 6], 7], 4], [[[1, 3, 5, 6], 0], 0], [[[], 4], 0], [[[2, 2, 2], 2], 0], [[[10, 20, 30, 40, 50, 60, 70], 45], 4]],
    show: 4,
    hints: ['If items[mid] < target, the gap must be to the right of mid: low = mid + 1.', 'Otherwise mid itself might be the answer, so keep it in the range: high = mid (no minus one).'],
    similar: {
      task: 'Find the index of the LAST copy of target in a sorted list (or -1).',
      sig: { fn: 'last_index', ret: 'int', params: [['items', 'ints'], ['target', 'int']] },
      samples: [[[1, 2, 2, 2, 3], 2]],
      body: {
        python: `    low = 0\n    high = len(items) - 1\n    answer = -1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            answer = mid\n            low = mid + 1\n        elif items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return answer`,
        javascript: `  let low = 0;\n  let high = items.length - 1;\n  let answer = -1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    if (items[mid] === target) {\n      answer = mid;\n      low = mid + 1;\n    } else if (items[mid] < target) {\n      low = mid + 1;\n    } else {\n      high = mid - 1;\n    }\n  }\n  return answer;`,
        cpp: `    int low = 0;\n    int high = items.size() - 1;\n    int answer = -1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (items[mid] == target) {\n            answer = mid;\n            low = mid + 1;\n        } else if (items[mid] < target) {\n            low = mid + 1;\n        } else {\n            high = mid - 1;\n        }\n    }\n    return answer;`,
        csharp: `    int low = 0;\n    int high = items.Length - 1;\n    int answer = -1;\n    while (low <= high)\n    {\n        int mid = (low + high) / 2;\n        if (items[mid] == target)\n        {\n            answer = mid;\n            low = mid + 1;\n        }\n        else if (items[mid] < target)\n        {\n            low = mid + 1;\n        }\n        else\n        {\n            high = mid - 1;\n        }\n    }\n    return answer;`,
        java: `    int low = 0;\n    int high = items.length - 1;\n    int answer = -1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (items[mid] == target) {\n            answer = mid;\n            low = mid + 1;\n        } else if (items[mid] < target) {\n            low = mid + 1;\n        } else {\n            high = mid - 1;\n        }\n    }\n    return answer;`,
      },
    },
    require: [WHILE],
    gate: 'D',
    success: 'The book slides neatly into the gap. This "first item that is big enough" search shows up everywhere.',
  });

  ch.dsa_search5 = fnT({
    title: 'The Square Root Vault',
    sig: { fn: 'int_sqrt', ret: 'int', params: [['n', 'int']] },
    desc: (ctx, sig, ex) => `<p>The vault code is the square root of a huge number, rounded down. Write ${sig} that returns the biggest whole number ${c('r')} with ${code('r * r <= n')}. No built-in square root!</p>${ex}
      <p>You don't need a list to binary search. The answer is somewhere between 0 and ${c('n')}: try the middle, check if its square is too big, and halve the range again.</p>
      ${ctx.lang === 'python' || ctx.lang === 'javascript' ? '' : `<p>Careful: for big ${c('n')}, ${c('mid * mid')} and ${c('low + high')} don't fit in an ${c('int')}. Keep ${c('low')}, ${c('high')} and ${c('mid')} in a ${code(ctx.lang === 'cpp' ? 'long long' : 'long')}${ctx.lang === 'cpp' ? '' : ` and turn the answer back into an ${code('int')} with ${code('(int)')} when you return it`}.</p>`}`,
    stub: {
      python: `    low = 0\n    high = n\n    answer = 0\n    # binary search: is mid * mid small enough?\n    return answer`,
      javascript: `  let low = 0;\n  let high = n;\n  let answer = 0;\n  // binary search: is mid * mid small enough?\n  return answer;`,
      cpp: `    long long low = 0;\n    long long high = n;\n    long long answer = 0;\n    // binary search: is mid * mid small enough?\n    return answer;`,
      csharp: `    long low = 0;\n    long high = n;\n    long answer = 0;\n    // binary search: is mid * mid small enough?\n    return (int)answer;`,
      java: `    long low = 0;\n    long high = n;\n    long answer = 0;\n    // binary search: is mid * mid small enough?\n    return (int) answer;`,
    },
    samples: [[1000000]],
    tests: [[[16], 4], [[15], 3], [[2000000000], 44721], [[0], 0], [[1], 1], [[99], 9], [[1000000], 1000], [[2147395600], 46340]],
    hints: ['Loop while low <= high, with mid halfway between them.', 'If mid * mid <= n, mid is a possible answer: remember it, then try bigger (low = mid + 1). Otherwise try smaller (high = mid - 1).'],
    similar: {
      task: 'Coins are laid in a staircase: 1 in the first row, 2 in the second, and so on. How many full rows can you make?',
      sig: { fn: 'full_rows', ret: 'int', params: [['coins', 'int']] },
      samples: [[10]],
      body: {
        python: `    low = 0\n    high = coins\n    best = 0\n    while low <= high:\n        mid = (low + high) // 2\n        if mid * (mid + 1) // 2 <= coins:\n            best = mid\n            low = mid + 1\n        else:\n            high = mid - 1\n    return best`,
        javascript: `  let low = 0;\n  let high = coins;\n  let best = 0;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    if (mid * (mid + 1) / 2 <= coins) {\n      best = mid;\n      low = mid + 1;\n    } else {\n      high = mid - 1;\n    }\n  }\n  return best;`,
        cpp: `    long long low = 0;\n    long long high = coins;\n    long long best = 0;\n    while (low <= high) {\n        long long mid = (low + high) / 2;\n        if (mid * (mid + 1) / 2 <= coins) {\n            best = mid;\n            low = mid + 1;\n        } else {\n            high = mid - 1;\n        }\n    }\n    return best;`,
        csharp: `    long low = 0;\n    long high = coins;\n    long best = 0;\n    while (low <= high)\n    {\n        long mid = (low + high) / 2;\n        if (mid * (mid + 1) / 2 <= coins)\n        {\n            best = mid;\n            low = mid + 1;\n        }\n        else\n        {\n            high = mid - 1;\n        }\n    }\n    return (int)best;`,
        java: `    long low = 0;\n    long high = coins;\n    long best = 0;\n    while (low <= high) {\n        long mid = (low + high) / 2;\n        if (mid * (mid + 1) / 2 <= coins) {\n            best = mid;\n            low = mid + 1;\n        } else {\n            high = mid - 1;\n        }\n    }\n    return (int) best;`,
      },
    },
    require: [WHILE, [/^(?![\s\S]*(\bsqrt\s*\(|\.[sS]qrt\s*\(|isqrt|\*\*\s*0?\.5|\bpow\s*\(|\bPow\s*\())/, 'Find it with binary search, without a built-in square root or power.']],
    gate: 'E',
    success: 'Click. 44721 squared is just under two billion. <b>About 31 guesses for a two-billion-wide range.</b>',
  });
  // ======================================================================= 3. Hash Maps
  ch.dsa_hash1 = fnT({
    title: 'The Tally Board',
    sig: { fn: 'most_common', ret: 'str', params: [['words', 'strs']] },
    desc: (ctx, sig, ex) => `<p>The harbour keeps a tally of every ship that docks. Write ${sig} that returns the word that appears <b>most often</b>. If there's a tie, return the one that appears <b>first</b> in the list.</p>${ex}
      <p>Count first: a ${code({ python: 'dict', javascript: 'Map', cpp: 'unordered_map', csharp: 'Dictionary', java: 'HashMap' }[ctx.lang])} from word to count. Then walk the list again and keep the best word so far. Two loops one after the other are still <b>O(n)</b>.</p>`,
    stub: {
      python: `    counts = {}\n    for w in words:\n        pass  # add 1 to the count for w\n    best = words[0]\n    for w in words:\n        pass  # if w has a higher count than best, w is the new best\n    return best`,
      javascript: `  const counts = new Map();\n  for (const w of words) {\n    // add 1 to the count for w\n  }\n  let best = words[0];\n  for (const w of words) {\n    // if w has a higher count than best, w is the new best\n  }\n  return best;`,
      cpp: `    unordered_map<string, int> counts;\n    for (string w : words) {\n        // add 1 to the count for w\n    }\n    string best = words[0];\n    for (string w : words) {\n        // if w has a higher count than best, w is the new best\n    }\n    return best;`,
      csharp: `    var counts = new Dictionary<string, int>();\n    foreach (string w in words)\n    {\n        // add 1 to the count for w\n    }\n    string best = words[0];\n    foreach (string w in words)\n    {\n        // if w has a higher count than best, w is the new best\n    }\n    return best;`,
      java: `    HashMap<String, Integer> counts = new HashMap<>();\n    for (String w : words) {\n        // add 1 to the count for w\n    }\n    String best = words[0];\n    for (String w : words) {\n        // if w has a higher count than best, w is the new best\n    }\n    return best;`,
    },
    samples: [[['cat', 'dog', 'cat']]],
    tests: [[[['cat', 'dog', 'cat']], 'cat'], [[['red', 'blue', 'blue', 'red', 'green']], 'red'], [[['x', 'y', 'z', 'z']], 'z'], [[['a']], 'a'], [[['sun', 'moon', 'star', 'moon', 'star', 'star']], 'star']],
    hints: {
      python: ['counts.get(w, 0) gives the count so far, or 0 for a word you have not seen yet.', 'Use > (not >=) when comparing counts, so an earlier word keeps the win in a tie.'],
      javascript: ['counts.get(w) is undefined for a new word, so (counts.get(w) || 0) + 1 is the new count.', 'Use > (not >=) when comparing counts, so an earlier word keeps the win in a tie.'],
      cpp: ['counts[w]++ works even for a new word: a missing int starts at 0.', 'Use > (not >=) when comparing counts, so an earlier word keeps the win in a tie.'],
      csharp: ['counts.GetValueOrDefault(w, 0) gives the count so far, or 0 for a new word.', 'Use > (not >=) when comparing counts, so an earlier word keeps the win in a tie.'],
      java: ['counts.getOrDefault(w, 0) gives the count so far, or 0 for a new word.', 'Use > (not >=) when comparing counts, so an earlier word keeps the win in a tie.'],
    },
    similar: {
      task: 'Count how many different words are in a list.',
      sig: { fn: 'count_distinct', ret: 'int', params: [['words', 'strs']] },
      samples: [[['hi', 'yo', 'hi', 'hey']]],
      body: {
        python: `    seen = {}\n    for w in words:\n        seen[w] = True\n    return len(seen)`,
        javascript: `  const seen = new Map();\n  for (const w of words) {\n    seen.set(w, true);\n  }\n  return seen.size;`,
        cpp: `    unordered_map<string, bool> seen;\n    for (string w : words) {\n        seen[w] = true;\n    }\n    return seen.size();`,
        csharp: `    var seen = new Dictionary<string, bool>();\n    foreach (string w in words)\n    {\n        seen[w] = true;\n    }\n    return seen.Count;`,
        java: `    HashMap<String, Boolean> seen = new HashMap<>();\n    for (String w : words) {\n        seen.put(w, true);\n    }\n    return seen.size();`,
      },
    },
    require: MAP,
    gate: 'A',
    success: 'The tally board lights up. Counting with a map is the most useful trick in this whole course.',
  });

  ch.dsa_hash2 = fnT({
    title: 'The Letter Scales',
    sig: { fn: 'is_anagram', ret: 'bool', params: [['a', 'str'], ['b', 'str']] },
    desc: (ctx, sig, ex) => `<p>Two words are <b>anagrams</b> if they use exactly the same letters, the same number of times, in any order. Write ${sig}.</p>${ex}
      <p>Put the letters on the scales: count each letter of ${c('a')} as +1, then each letter of ${c('b')} as -1. If every count ends up at 0, they balance.</p>`,
    stub: {
      python: `    if len(a) != len(b):\n        return False\n    counts = {}\n    # count each letter of a (+1), then each letter of b (-1)\n    # if every count ends at 0, they are anagrams\n    return False`,
      javascript: `  if (a.length !== b.length) return false;\n  const counts = new Map();\n  // count each letter of a (+1), then each letter of b (-1)\n  // if every count ends at 0, they are anagrams\n  return false;`,
      cpp: `    if (a.size() != b.size()) return false;\n    unordered_map<char, int> counts;\n    // count each letter of a (+1), then each letter of b (-1)\n    // if every count ends at 0, they are anagrams\n    return false;`,
      csharp: `    if (a.Length != b.Length) return false;\n    var counts = new Dictionary<char, int>();\n    // count each letter of a (+1), then each letter of b (-1)\n    // if every count ends at 0, they are anagrams\n    return false;`,
      java: `    if (a.length() != b.length()) return false;\n    HashMap<Character, Integer> counts = new HashMap<>();\n    // count each letter of a (+1), then each letter of b (-1)\n    // if every count ends at 0, they are anagrams\n    return false;`,
    },
    samples: [['listen', 'silent']],
    tests: [[['listen', 'silent'], true], [['rat', 'car'], false], [['aab', 'abb'], false], [['', ''], true], [['abc', 'ab'], false], [['night', 'thing'], true], [['aabbcc', 'abcabc'], true]],
    hints: {
      python: ['Three loops, one after the other: count up for a, count down for b, then check every value in counts.', 'for ch in counts: loops over the keys. counts[ch] is the value.'],
      javascript: ['Three loops, one after the other: count up for a, count down for b, then check every value in counts.', 'for (const n of counts.values()) loops over the counts.'],
      cpp: ['Three loops, one after the other: count up for a, count down for b, then check every value in counts.', 'for (auto p : counts) gives pairs: p.first is the letter, p.second its count.'],
      csharp: ['Three loops, one after the other: count up for a, count down for b, then check every value in counts.', 'foreach (int n in counts.Values) loops over the counts.'],
      java: ['Three loops, one after the other: count up for a, count down for b, then check every value in counts.', 'for (int n : counts.values()) loops over the counts.'],
    },
    similar: {
      task: 'Can word be spelled using the tiles in letters? Each tile can be used once.',
      sig: { fn: 'can_build', ret: 'bool', params: [['letters', 'str'], ['word', 'str']] },
      samples: [['aabbc', 'cab']],
      body: {
        python: `    tiles = {}\n    for ch in letters:\n        tiles[ch] = tiles.get(ch, 0) + 1\n    for ch in word:\n        if tiles.get(ch, 0) == 0:\n            return False\n        tiles[ch] -= 1\n    return True`,
        javascript: `  const tiles = new Map();\n  for (const ch of letters) {\n    tiles.set(ch, (tiles.get(ch) || 0) + 1);\n  }\n  for (const ch of word) {\n    if (!tiles.get(ch)) return false;\n    tiles.set(ch, tiles.get(ch) - 1);\n  }\n  return true;`,
        cpp: `    unordered_map<char, int> tiles;\n    for (char ch : letters) {\n        tiles[ch]++;\n    }\n    for (char ch : word) {\n        if (tiles[ch] == 0) return false;\n        tiles[ch]--;\n    }\n    return true;`,
        csharp: `    var tiles = new Dictionary<char, int>();\n    foreach (char ch in letters)\n    {\n        tiles[ch] = tiles.GetValueOrDefault(ch, 0) + 1;\n    }\n    foreach (char ch in word)\n    {\n        if (tiles.GetValueOrDefault(ch, 0) == 0) return false;\n        tiles[ch]--;\n    }\n    return true;`,
        java: `    HashMap<Character, Integer> tiles = new HashMap<>();\n    for (char ch : letters.toCharArray()) {\n        tiles.put(ch, tiles.getOrDefault(ch, 0) + 1);\n    }\n    for (char ch : word.toCharArray()) {\n        if (tiles.getOrDefault(ch, 0) == 0) return false;\n        tiles.put(ch, tiles.get(ch) - 1);\n    }\n    return true;`,
      },
    },
    require: MAP,
    gate: 'B',
    success: 'Listen, silent: perfectly balanced. <b>O(n)</b>, no sorting needed.',
  });

  ch.dsa_hash3 = fnT({
    title: 'The Lone Lantern',
    sig: { fn: 'first_unique', ret: 'str', params: [['text', 'str']] },
    desc: (ctx, sig, ex) => `<p>Most lanterns on the pier come in pairs. Write ${sig} that returns the <b>first</b> character that appears <b>exactly once</b> in ${c('text')}, as a one-letter string. If there isn't one, return an empty string.</p>${ex}
      <p>Two passes: first count every character, then walk through ${c('text')} again and return the first one whose count is 1.${{ python: '', javascript: '', cpp: ` To turn a ${code('char')} into a string, use ${code('string(1, ch)')}.`, csharp: ` To turn a ${code('char')} into a string, use ${code('ch.ToString()')}.`, java: ` To turn a ${code('char')} into a string, use ${code('String.valueOf(ch)')}.` }[ctx.lang]}</p>`,
    stub: {
      python: `    counts = {}\n    # pass 1: count every character\n    # pass 2: walk through text again and return the first one with a count of 1\n    return ""`,
      javascript: `  const counts = new Map();\n  // pass 1: count every character\n  // pass 2: walk through text again and return the first one with a count of 1\n  return "";`,
      cpp: `    unordered_map<char, int> counts;\n    // pass 1: count every character\n    // pass 2: walk through text again and return the first one with a count of 1\n    return "";`,
      csharp: `    var counts = new Dictionary<char, int>();\n    // pass 1: count every character\n    // pass 2: walk through text again and return the first one with a count of 1\n    return "";`,
      java: `    HashMap<Character, Integer> counts = new HashMap<>();\n    // pass 1: count every character\n    // pass 2: walk through text again and return the first one with a count of 1\n    return "";`,
    },
    samples: [['swiss']],
    tests: [[['swiss'], 'w'], [['level'], 'v'], [['aabb'], ''], [['x'], 'x'], [['abcab'], 'c'], [[''], '']],
    hints: ['Pass 1 is the same counting loop as before.', 'In pass 2, loop over text (not over the map), so you meet the characters in their original order.'],
    similar: {
      task: 'Return the first character that shows up for a second time (or an empty string).',
      sig: { fn: 'first_repeat', ret: 'str', params: [['text', 'str']] },
      samples: [['abcbad']],
      body: {
        python: `    seen = {}\n    for ch in text:\n        if ch in seen:\n            return ch\n        seen[ch] = True\n    return ""`,
        javascript: `  const seen = new Map();\n  for (const ch of text) {\n    if (seen.has(ch)) return ch;\n    seen.set(ch, true);\n  }\n  return "";`,
        cpp: `    unordered_map<char, bool> seen;\n    for (char ch : text) {\n        if (seen.count(ch) > 0) return string(1, ch);\n        seen[ch] = true;\n    }\n    return "";`,
        csharp: `    var seen = new Dictionary<char, bool>();\n    foreach (char ch in text)\n    {\n        if (seen.ContainsKey(ch)) return ch.ToString();\n        seen[ch] = true;\n    }\n    return "";`,
        java: `    HashMap<Character, Boolean> seen = new HashMap<>();\n    for (char ch : text.toCharArray()) {\n        if (seen.containsKey(ch)) return String.valueOf(ch);\n        seen.put(ch, true);\n    }\n    return "";`,
      },
    },
    require: MAP,
    gate: 'C',
    success: 'One lantern burns alone at the end of the pier. <b>Count, then scan: O(n).</b>',
  });

  ch.dsa_hash4 = fnT({
    title: 'The Pair Lock',
    sig: { fn: 'two_sum', ret: 'ints', params: [['nums', 'ints'], ['target', 'int']] },
    desc: (ctx, sig, ex) => `<p>The famous one. Two numbers in ${c('nums')} add up to ${c('target')} (there is always exactly one such pair). Write ${sig} that returns their two <b>indexes</b>, smaller index first. The list is <b>not</b> sorted, so the two-pointer trick won't work here.</p>${ex}
      <p>Walk the list once. For each number, the partner you need is ${c('target - number')}. Keep a map from <b>number to index</b> of everything you've passed: if the partner is already in it, you've found the pair. That's <b>O(n)</b> instead of trying every pair.</p>`,
    stub: {
      python: `    seen = {}   # number -> its index\n    for i in range(len(nums)):\n        need = target - nums[i]\n        # if need is in seen, you found the pair!\n        seen[nums[i]] = i\n    return []`,
      javascript: `  const seen = new Map();   // number -> its index\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    // if need is in seen, you found the pair!\n    seen.set(nums[i], i);\n  }\n  return [];`,
      cpp: `    unordered_map<int, int> seen;   // number -> its index\n    for (int i = 0; i < nums.size(); i++) {\n        int need = target - nums[i];\n        // if need is in seen, you found the pair!\n        seen[nums[i]] = i;\n    }\n    return {};`,
      csharp: `    var seen = new Dictionary<int, int>();   // number -> its index\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int need = target - nums[i];\n        // if need is in seen, you found the pair!\n        seen[nums[i]] = i;\n    }\n    return new int[0];`,
      java: `    HashMap<Integer, Integer> seen = new HashMap<>();   // number -> its index\n    for (int i = 0; i < nums.length; i++) {\n        int need = target - nums[i];\n        // if need is in seen, you found the pair!\n        seen.put(nums[i], i);\n    }\n    return new int[0];`,
    },
    samples: [[[2, 7, 11, 15], 9]],
    tests: [[[[2, 7, 11, 15], 9], [0, 1]], [[[3, 2, 4], 6], [1, 2]], [[[3, 3], 6], [0, 1]], [[[1, 5, 9, 14, 20], 23], [2, 3]], [[[-1, 8, 4, 12], 3], [0, 2]]],
    hints: ['The check goes before seen gets the current number. Otherwise [3, 2, 4] with target 6 would pair the 3 with itself.', 'The answer is the index stored for need (the earlier one), then i.'],
    similar: {
      task: 'Is there a pair of numbers whose difference is exactly k?',
      sig: { fn: 'has_difference', ret: 'bool', params: [['nums', 'ints'], ['k', 'int']] },
      samples: [[[1, 7, 4, 10], 3]],
      body: {
        python: `    seen = {}\n    for n in nums:\n        if n - k in seen or n + k in seen:\n            return True\n        seen[n] = True\n    return False`,
        javascript: `  const seen = new Map();\n  for (const n of nums) {\n    if (seen.has(n - k) || seen.has(n + k)) return true;\n    seen.set(n, true);\n  }\n  return false;`,
        cpp: `    unordered_map<int, bool> seen;\n    for (int n : nums) {\n        if (seen.count(n - k) > 0 || seen.count(n + k) > 0) return true;\n        seen[n] = true;\n    }\n    return false;`,
        csharp: `    var seen = new Dictionary<int, bool>();\n    foreach (int n in nums)\n    {\n        if (seen.ContainsKey(n - k) || seen.ContainsKey(n + k)) return true;\n        seen[n] = true;\n    }\n    return false;`,
        java: `    HashMap<Integer, Boolean> seen = new HashMap<>();\n    for (int n : nums) {\n        if (seen.containsKey(n - k) || seen.containsKey(n + k)) return true;\n        seen.put(n, true);\n    }\n    return false;`,
      },
    },
    require: MAP,
    gate: 'D',
    success: 'The lock clicks open. Two Sum is a real interview classic, and you just solved it in <b>O(n)</b>.',
  });

  ch.dsa_hash5 = fnT({
    title: 'The Sorting Bins',
    sig: { fn: 'largest_group', ret: 'int', params: [['words', 'strs']] },
    desc: (ctx, sig, ex) => `<p>The harbour sorts its cargo labels into bins, one bin per group of <b>anagrams</b> ("eat", "tea" and "ate" share a bin). Write ${sig} that returns how many words are in the <b>biggest</b> bin (0 for an empty list).</p>${ex}
      <p>The trick is the <b>key</b>: give every word a key that all its anagrams share. Sorting the letters works: "eat", "tea" and "ate" all become "aet". Then count how many words land on each key.${{ python: ` ${code('"".join(sorted(w))')} sorts the letters of a word.`, javascript: ` ${code('w.split("").sort().join("")')} sorts the letters of a word.`, cpp: ` Copy the word and ${code('sort(key.begin(), key.end())')} sorts its letters.`, csharp: ` ${code('ToCharArray()')}, ${code('Array.Sort')} and ${code('new string(letters)')} sort the letters of a word.`, java: ` ${code('toCharArray()')}, ${code('Arrays.sort')} and ${code('new String(letters)')} sort the letters of a word.` }[ctx.lang]}</p>`,
    stub: {
      python: `    groups = {}   # key -> how many words have it\n    for w in words:\n        key = w   # change this: anagrams must get the same key\n        groups[key] = groups.get(key, 0) + 1\n    biggest = 0\n    # find the biggest count in groups\n    return biggest`,
      javascript: `  const groups = new Map();   // key -> how many words have it\n  for (const w of words) {\n    const key = w;   // change this: anagrams must get the same key\n    groups.set(key, (groups.get(key) || 0) + 1);\n  }\n  let biggest = 0;\n  // find the biggest count in groups\n  return biggest;`,
      cpp: `    unordered_map<string, int> groups;   // key -> how many words have it\n    for (string w : words) {\n        string key = w;   // change this: anagrams must get the same key\n        groups[key]++;\n    }\n    int biggest = 0;\n    // find the biggest count in groups\n    return biggest;`,
      csharp: `    var groups = new Dictionary<string, int>();   // key -> how many words have it\n    foreach (string w in words)\n    {\n        string key = w;   // change this: anagrams must get the same key\n        groups[key] = groups.GetValueOrDefault(key, 0) + 1;\n    }\n    int biggest = 0;\n    // find the biggest count in groups\n    return biggest;`,
      java: `    HashMap<String, Integer> groups = new HashMap<>();   // key -> how many words have it\n    for (String w : words) {\n        String key = w;   // change this: anagrams must get the same key\n        groups.put(key, groups.getOrDefault(key, 0) + 1);\n    }\n    int biggest = 0;\n    // find the biggest count in groups\n    return biggest;`,
    },
    samples: [[['eat', 'tea', 'tan', 'ate', 'nat', 'bat']]],
    tests: [[[['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], 3], [[['abc']], 1], [[['ab', 'ba', 'abc', 'cab', 'bca', 'xyz']], 3], [[['a', 'b', 'c']], 1], [[['listen', 'silent', 'enlist', 'google', 'gogole']], 3], [[[]], 0]],
    hints: {
      python: ['sorted("tea") gives a list of letters, and "".join(...) glues them back into "aet".', 'Then loop over groups.values() and keep the biggest.'],
      javascript: ['"tea".split("") is ["t", "e", "a"]. Sort that and join it back into one string.', 'Then loop over groups.values() and keep the biggest.'],
      cpp: ['key starts as a copy of w. Sorting key does not change w.', 'Then loop over the map: for (auto p : groups), and p.second is a count.'],
      csharp: ['Turn the word into a char array, sort the array, and build a new string from it.', 'Then loop over groups.Values and keep the biggest.'],
      java: ['Turn the word into a char array, sort the array, and build a new String from it.', 'Then loop over groups.values() and keep the biggest.'],
    },
    similar: {
      task: 'Group words by their length and return the size of the biggest group.',
      sig: { fn: 'largest_length_group', ret: 'int', params: [['words', 'strs']] },
      samples: [[['hi', 'sea', 'yo', 'sun', 'ok']]],
      body: {
        python: `    groups = {}\n    for w in words:\n        key = len(w)\n        groups[key] = groups.get(key, 0) + 1\n    biggest = 0\n    for n in groups.values():\n        biggest = max(biggest, n)\n    return biggest`,
        javascript: `  const groups = new Map();\n  for (const w of words) {\n    const key = w.length;\n    groups.set(key, (groups.get(key) || 0) + 1);\n  }\n  let biggest = 0;\n  for (const n of groups.values()) {\n    biggest = Math.max(biggest, n);\n  }\n  return biggest;`,
        cpp: `    unordered_map<int, int> groups;\n    for (string w : words) {\n        groups[w.size()]++;\n    }\n    int biggest = 0;\n    for (auto p : groups) {\n        biggest = max(biggest, p.second);\n    }\n    return biggest;`,
        csharp: `    var groups = new Dictionary<int, int>();\n    foreach (string w in words)\n    {\n        groups[w.Length] = groups.GetValueOrDefault(w.Length, 0) + 1;\n    }\n    int biggest = 0;\n    foreach (int n in groups.Values)\n    {\n        biggest = Math.Max(biggest, n);\n    }\n    return biggest;`,
        java: `    HashMap<Integer, Integer> groups = new HashMap<>();\n    for (String w : words) {\n        groups.put(w.length(), groups.getOrDefault(w.length(), 0) + 1);\n    }\n    int biggest = 0;\n    for (int n : groups.values()) {\n        biggest = Math.max(biggest, n);\n    }\n    return biggest;`,
      },
    },
    require: MAP,
    gate: 'E',
    success: 'Every label drops into the right bin. Choosing a good <b>key</b> is half of every hash map problem.',
  });
  // ======================================================================= 4. Stacks & Queues
  const STACK = {
    python: [/\.append\s*\([\s\S]*\.pop\s*\(\s*\)|\.pop\s*\(\s*\)[\s\S]*\.append\s*\(/, 'Use a list as a stack: <code>append()</code> to push and <code>pop()</code> to take the top off.'],
    javascript: [/\.push\s*\([\s\S]*\.pop\s*\(\s*\)|\.pop\s*\(\s*\)[\s\S]*\.push\s*\(/, 'Use an array as a stack: <code>push()</code> and <code>pop()</code>.'],
    cpp: [/\bstack\s*</, 'Use a <code>stack&lt;char&gt;</code> (from <code>&lt;stack&gt;</code>): <code>push</code>, <code>top</code> and <code>pop</code>.'],
    csharp: [/\bStack\s*</, 'Use a <code>Stack&lt;char&gt;</code>: <code>Push</code> and <code>Pop</code>.'],
    java: [/\b(Deque|Stack)\s*</, 'Use a stack: <code>Deque&lt;Character&gt; stack = new ArrayDeque&lt;&gt;()</code> with <code>push</code> and <code>pop</code>.'],
  };
  const QUEUE = {
    python: [[/\.pop\s*\(\s*0\s*\)/, 'Use the list as a queue: <code>pop(0)</code> takes from the front, <code>append()</code> adds at the back.']],
    javascript: [[/\.shift\s*\(\s*\)/, 'Use the array as a queue: <code>shift()</code> takes from the front, <code>push()</code> adds at the back.']],
    cpp: [[/\bqueue\s*</, 'Use a <code>queue&lt;string&gt;</code> (from <code>&lt;queue&gt;</code>).']],
    csharp: [[/\bQueue\s*</, 'Use a <code>Queue&lt;string&gt;</code>.']],
    java: [[/\b(Queue|Deque|ArrayDeque)\s*</, 'Use a queue: <code>Queue&lt;String&gt; queue = new ArrayDeque&lt;&gt;()</code>.']],
  };
  const STACK_NAMES = {
    python: `a list: ${code('append(ch)')} pushes and ${code('pop()')} takes the top off`,
    javascript: `an array: ${code('push(ch)')} pushes and ${code('pop()')} takes the top off`,
    cpp: `a ${code('stack<char>')}: ${code('push')}, ${code('top()')} to read the top and ${code('pop()')} to remove it`,
    csharp: `a ${code('Stack<char>')}: ${code('Push')} and ${code('Pop()')}`,
    java: `a ${code('Deque<Character>')}: ${code('push')} and ${code('pop()')}`,
  };

  ch.dsa_stack1 = fnT({
    title: 'The Backwards Tower',
    sig: { fn: 'reverse_word', ret: 'str', params: [['word', 'str']] },
    desc: (ctx, sig, ex) => `<p>The Stack Works builds towers letter by letter. Write ${sig} that returns the word backwards, using a <b>stack</b>: push every letter, then pop them all off. The last letter in comes out first.</p>${ex}
      <p>Your stack here is ${STACK_NAMES[ctx.lang]}. No built-in reverse this time.</p>`,
    stub: {
      python: `    stack = []\n    for ch in word:\n        stack.append(ch)\n    result = ""\n    # take letters off the top until the stack is empty\n    return result`,
      javascript: `  const stack = [];\n  for (const ch of word) {\n    stack.push(ch);\n  }\n  let result = "";\n  // take letters off the top until the stack is empty\n  return result;`,
      cpp: `    stack<char> st;\n    for (char ch : word) {\n        st.push(ch);\n    }\n    string result = "";\n    // take letters off the top until the stack is empty\n    return result;`,
      csharp: `    var stack = new Stack<char>();\n    foreach (char ch in word)\n    {\n        stack.Push(ch);\n    }\n    string result = "";\n    // take letters off the top until the stack is empty\n    return result;`,
      java: `    Deque<Character> stack = new ArrayDeque<>();\n    for (char ch : word.toCharArray()) {\n        stack.push(ch);\n    }\n    String result = "";\n    // take letters off the top until the stack is empty\n    return result;`,
    },
    samples: [['stack']],
    tests: [[['stack'], 'kcats'], [['a'], 'a'], [['Code Quest'], 'tseuQ edoC'], [[''], ''], [['level'], 'level']],
    hints: {
      python: ['while stack: keeps going as long as the list is not empty.', 'stack.pop() removes the top letter and gives it to you. Add it to the end of result.'],
      javascript: ['while (stack.length > 0) keeps going until the stack is empty.', 'stack.pop() removes the top letter and gives it to you. Add it to the end of result.'],
      cpp: ['while (!st.empty()) keeps going until the stack is empty.', 'st.top() reads the top letter, st.pop() removes it (and gives nothing back). Use both.'],
      csharp: ['while (stack.Count > 0) keeps going until the stack is empty.', 'stack.Pop() removes the top letter and gives it to you. Add it to the end of result.'],
      java: ['while (!stack.isEmpty()) keeps going until the stack is empty.', 'stack.pop() removes the top letter and gives it to you. Add it to the end of result.'],
    },
    similar: {
      task: 'Reverse a list of numbers with a stack.',
      sig: { fn: 'reverse_list', ret: 'ints', params: [['nums', 'ints']] },
      samples: [[[1, 2, 3, 4]]],
      body: {
        python: `    stack = []\n    for n in nums:\n        stack.append(n)\n    result = []\n    while stack:\n        result.append(stack.pop())\n    return result`,
        javascript: `  const stack = [];\n  for (const n of nums) {\n    stack.push(n);\n  }\n  const result = [];\n  while (stack.length > 0) {\n    result.push(stack.pop());\n  }\n  return result;`,
        cpp: `    stack<int> st;\n    for (int n : nums) {\n        st.push(n);\n    }\n    vector<int> result;\n    while (!st.empty()) {\n        result.push_back(st.top());\n        st.pop();\n    }\n    return result;`,
        csharp: `    var stack = new Stack<int>();\n    foreach (int n in nums)\n    {\n        stack.Push(n);\n    }\n    var result = new List<int>();\n    while (stack.Count > 0)\n    {\n        result.Add(stack.Pop());\n    }\n    return result.ToArray();`,
        java: `    Deque<Integer> stack = new ArrayDeque<>();\n    for (int n : nums) {\n        stack.push(n);\n    }\n    int[] result = new int[nums.length];\n    int i = 0;\n    while (!stack.isEmpty()) {\n        result[i] = stack.pop();\n        i++;\n    }\n    return result;`,
      },
    },
    require: byLang(l => [STACK[l], NO_REVERSE]),
    gate: 'A',
    success: 'K-C-A-T-S. Last in, first out: <b>that is a stack</b>.',
  });

  ch.dsa_stack2 = fnT({
    title: 'The Backspace Key',
    sig: { fn: 'backspace', ret: 'str', params: [['text', 'str']] },
    desc: (ctx, sig, ex) => `<p>The foreman's keyboard records every key, including backspace, which shows up as ${c('#')}. Write ${sig} that returns what was really typed. A ${c('#')} deletes the character before it; on an empty line it does nothing.</p>${ex}
      <p>Typing is a stack: each key pushes a character, each ${c('#')} pops the last one.${{ python: ` A list works well: ${code('"".join(stack)')} turns it back into a string.`, javascript: ` An array works well: ${code('stack.join("")')} turns it back into a string.`, cpp: ` A ${code('string')} works as a stack of characters: ${code('push_back')}, ${code('pop_back')} and ${code('empty()')}.`, csharp: ` A ${code('List<char>')} works well as the stack here (it keeps the letters in typing order): ${code('Add')}, ${code('RemoveAt(stack.Count - 1)')}, and ${code('new string(stack.ToArray())')} at the end.`, java: ` A ${code('StringBuilder')} works as a stack of characters: ${code('append')}, ${code('deleteCharAt(sb.length() - 1)')} and ${code('length()')}.` }[ctx.lang]}</p>`,
    stub: {
      python: `    stack = []\n    for ch in text:\n        pass  # a "#" removes the last character (if there is one), anything else is typed\n    return "".join(stack)`,
      javascript: `  const stack = [];\n  for (const ch of text) {\n    // a "#" removes the last character (if there is one), anything else is typed\n  }\n  return stack.join("");`,
      cpp: `    string result = "";\n    for (char ch : text) {\n        // a '#' removes the last character (if there is one), anything else is typed\n    }\n    return result;`,
      csharp: `    var stack = new List<char>();\n    foreach (char ch in text)\n    {\n        // a '#' removes the last character (if there is one), anything else is typed\n    }\n    return new string(stack.ToArray());`,
      java: `    StringBuilder sb = new StringBuilder();\n    for (char ch : text.toCharArray()) {\n        // a '#' removes the last character (if there is one), anything else is typed\n    }\n    return sb.toString();`,
    },
    samples: [['ab#c']],
    tests: [[['ab#c'], 'ac'], [['abc##'], 'a'], [['#a'], 'a'], [['a##b'], 'b'], [['code#de'], 'codde'], [['####'], ''], [['hello'], 'hello']],
    show: 4,
    hints: ['Two cases inside the loop: the character is a # or it is not.', 'For a #, only remove something when the stack is not empty. Otherwise "#a" would crash.'],
    similar: {
      task: 'Remove pairs of equal neighbours, again and again: "abbaca" becomes "ca".',
      sig: { fn: 'remove_pairs', ret: 'str', params: [['text', 'str']] },
      samples: [['abbaca']],
      body: {
        python: `    stack = []\n    for ch in text:\n        if stack and stack[-1] == ch:\n            stack.pop()\n        else:\n            stack.append(ch)\n    return "".join(stack)`,
        javascript: `  const stack = [];\n  for (const ch of text) {\n    if (stack.length > 0 && stack[stack.length - 1] === ch) {\n      stack.pop();\n    } else {\n      stack.push(ch);\n    }\n  }\n  return stack.join("");`,
        cpp: `    string result = "";\n    for (char ch : text) {\n        if (!result.empty() && result.back() == ch) {\n            result.pop_back();\n        } else {\n            result.push_back(ch);\n        }\n    }\n    return result;`,
        csharp: `    var stack = new List<char>();\n    foreach (char ch in text)\n    {\n        if (stack.Count > 0 && stack[stack.Count - 1] == ch)\n        {\n            stack.RemoveAt(stack.Count - 1);\n        }\n        else\n        {\n            stack.Add(ch);\n        }\n    }\n    return new string(stack.ToArray());`,
        java: `    Deque<Character> stack = new ArrayDeque<>();\n    for (char ch : text.toCharArray()) {\n        if (!stack.isEmpty() && stack.peek() == ch) {\n            stack.pop();\n        } else {\n            stack.push(ch);\n        }\n    }\n    String result = "";\n    while (!stack.isEmpty()) {\n        result += stack.pollLast();\n    }\n    return result;`,
      },
    },
    gate: 'B',
    success: 'The message comes out clean. Every undo button you have ever pressed works like this.',
  });

  ch.dsa_stack3 = fnT({
    title: 'The Bracket Lock',
    sig: { fn: 'is_balanced', ret: 'bool', params: [['text', 'str']] },
    desc: (ctx, sig, ex) => `<p>The vault door checks its own blueprints. Write ${sig}: are the brackets ${c('( )')}, ${c('[ ]')} and ${c('{ }')} balanced? Every opener needs a matching closer of the same kind, in the right order. Other characters don't matter.</p>${ex}
      <p>Push every opener. When a closer arrives, the <b>top</b> of the stack must be its partner, and you pop it. At the end the stack must be empty.</p>`,
    stub: {
      python: `    stack = []\n    pairs = {")": "(", "]": "[", "}": "{"}\n    for ch in text:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            pass  # the top of the stack must be pairs[ch]\n    return len(stack) == 0`,
      javascript: `  const stack = [];\n  const pairs = { ")": "(", "]": "[", "}": "{" };\n  for (const ch of text) {\n    if ("([{".includes(ch)) {\n      stack.push(ch);\n    } else if (ch in pairs) {\n      // the top of the stack must be pairs[ch]\n    }\n  }\n  return stack.length === 0;`,
      cpp: `    stack<char> st;\n    for (char ch : text) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            st.push(ch);\n        } else if (ch == ')' || ch == ']' || ch == '}') {\n            char opener = ch == ')' ? '(' : (ch == ']' ? '[' : '{');\n            // the top of the stack must be opener\n        }\n    }\n    return st.empty();`,
      csharp: `    var stack = new Stack<char>();\n    foreach (char ch in text)\n    {\n        if (ch == '(' || ch == '[' || ch == '{')\n        {\n            stack.Push(ch);\n        }\n        else if (ch == ')' || ch == ']' || ch == '}')\n        {\n            char opener = ch == ')' ? '(' : (ch == ']' ? '[' : '{');\n            // the top of the stack must be opener\n        }\n    }\n    return stack.Count == 0;`,
      java: `    Deque<Character> stack = new ArrayDeque<>();\n    for (char ch : text.toCharArray()) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            stack.push(ch);\n        } else if (ch == ')' || ch == ']' || ch == '}') {\n            char opener = ch == ')' ? '(' : (ch == ']' ? '[' : '{');\n            // the top of the stack must be opener\n        }\n    }\n    return stack.isEmpty();`,
    },
    samples: [['(a[b]{c})'], ['([)]']],
    tests: [[['(a[b]{c})'], true], [['([)]'], false], [['((('], false], [['())'], false], [[''], true], [['{[()()]}x'], true], [[']'], false]],
    show: 4,
    hints: ['A closer with an empty stack is already a "no": there is nothing for it to close.', 'If the top is the wrong opener, also "no". Otherwise pop it and carry on.'],
    similar: {
      task: 'How deep do the round brackets nest? "(a(b)(c(d)))" has a depth of 3.',
      sig: { fn: 'max_depth', ret: 'int', params: [['text', 'str']] },
      samples: [['(a(b)(c(d)))']],
      body: {
        python: `    depth = 0\n    deepest = 0\n    for ch in text:\n        if ch == "(":\n            depth += 1\n            deepest = max(deepest, depth)\n        elif ch == ")":\n            depth -= 1\n    return deepest`,
        javascript: `  let depth = 0;\n  let deepest = 0;\n  for (const ch of text) {\n    if (ch === "(") {\n      depth++;\n      deepest = Math.max(deepest, depth);\n    } else if (ch === ")") {\n      depth--;\n    }\n  }\n  return deepest;`,
        cpp: `    int depth = 0;\n    int deepest = 0;\n    for (char ch : text) {\n        if (ch == '(') {\n            depth++;\n            deepest = max(deepest, depth);\n        } else if (ch == ')') {\n            depth--;\n        }\n    }\n    return deepest;`,
        csharp: `    int depth = 0;\n    int deepest = 0;\n    foreach (char ch in text)\n    {\n        if (ch == '(')\n        {\n            depth++;\n            deepest = Math.Max(deepest, depth);\n        }\n        else if (ch == ')')\n        {\n            depth--;\n        }\n    }\n    return deepest;`,
        java: `    int depth = 0;\n    int deepest = 0;\n    for (char ch : text.toCharArray()) {\n        if (ch == '(') {\n            depth++;\n            deepest = Math.max(deepest, depth);\n        } else if (ch == ')') {\n            depth--;\n        }\n    }\n    return deepest;`,
      },
    },
    require: byLang(l => [STACK[l]]),
    gate: 'C',
    success: 'Every bracket finds its partner and the lock spins open. Compilers check your code exactly like this.',
  });
  // the starter's push alone is not a stack yet: ask for a pop too
  ch.dsa_stack3.require.python = [[/\.pop\s*\(\s*\)/, 'When a closer arrives, <code>pop()</code> its opener off the stack.']];
  ch.dsa_stack3.require.javascript = [[/\.pop\s*\(\s*\)/, 'When a closer arrives, <code>pop()</code> its opener off the stack.']];

  ch.dsa_stack4 = fnT({
    title: 'The Hot Potato',
    sig: { fn: 'hot_potato', ret: 'str', params: [['names', 'strs'], ['passes', 'int']] },
    desc: (ctx, sig, ex) => `<p>The workers play hot potato in a circle. The person at the front holds the potato. Each round it is passed ${c('passes')} times (each pass sends the front person to the back of the line), then whoever holds it is out. Write ${sig} that returns the last person left.</p>${ex}
      <p>A circle where people leave at the front and join at the back is a <b>queue</b>: first in, first out.</p>`,
    stub: {
      python: `    queue = list(names)\n    while len(queue) > 1:\n        for i in range(passes):\n            pass  # move the front person to the back\n        queue.pop(0)   # whoever holds the potato is out\n    return queue[0]`,
      javascript: `  const queue = [...names];\n  while (queue.length > 1) {\n    for (let i = 0; i < passes; i++) {\n      // move the front person to the back\n    }\n    queue.shift();   // whoever holds the potato is out\n  }\n  return queue[0];`,
      cpp: `    queue<string> q;\n    for (string n : names) {\n        q.push(n);\n    }\n    while (q.size() > 1) {\n        for (int i = 0; i < passes; i++) {\n            // move the front person to the back\n        }\n        q.pop();   // whoever holds the potato is out\n    }\n    return q.front();`,
      csharp: `    var queue = new Queue<string>(names);\n    while (queue.Count > 1)\n    {\n        for (int i = 0; i < passes; i++)\n        {\n            // move the front person to the back\n        }\n        queue.Dequeue();   // whoever holds the potato is out\n    }\n    return queue.Peek();`,
      java: `    Queue<String> queue = new ArrayDeque<>();\n    for (String n : names) {\n        queue.add(n);\n    }\n    while (queue.size() > 1) {\n        for (int i = 0; i < passes; i++) {\n            // move the front person to the back\n        }\n        queue.poll();   // whoever holds the potato is out\n    }\n    return queue.peek();`,
    },
    samples: [[['Ada', 'Bo', 'Cy', 'Di', 'Ed'], 2]],
    tests: [[[['Ada', 'Bo', 'Cy', 'Di', 'Ed'], 2], 'Di'], [[['Ada', 'Bo', 'Cy'], 0], 'Cy'], [[['Kim', 'Lee'], 1], 'Kim'], [[['Solo'], 5], 'Solo'], [[['A', 'B', 'C', 'D', 'E', 'F', 'G'], 3], 'B'], [[['Ann', 'Ben', 'Cal', 'Dot', 'Eve', 'Fin'], 7], 'Cal']],
    hints: {
      python: ['Moving the front to the back is two steps: pop(0) takes the front person, append() adds them at the back.', 'You can do both in one statement by putting the pop(0) call inside append(...).'],
      javascript: ['Moving the front to the back: shift() takes the front person, push() adds them at the back.', 'You can do both in one statement by putting the shift() call inside the push(...).'],
      cpp: ['Moving the front to the back: push a copy of q.front(), then q.pop() the front.', 'Push first, pop second: once you pop, the front is gone.'],
      csharp: ['Moving the front to the back: Dequeue() takes the front person, Enqueue() adds them at the back.', 'You can do both in one statement by putting the Dequeue() call inside Enqueue(...).'],
      java: ['Moving the front to the back: poll() takes the front person, add() puts them at the back.', 'You can do both in one statement by putting the poll() call inside add(...).'],
    },
    similar: {
      task: 'Players take turns in a queue; after a turn you go to the back. Whose turn is it after k turns?',
      sig: { fn: 'turn_after', ret: 'str', params: [['names', 'strs'], ['k', 'int']] },
      samples: [[['Ada', 'Bo', 'Cy'], 4]],
      body: {
        python: `    queue = list(names)\n    for i in range(k):\n        player = queue.pop(0)\n        queue.append(player)\n    return queue[0]`,
        javascript: `  const queue = [...names];\n  for (let i = 0; i < k; i++) {\n    const player = queue.shift();\n    queue.push(player);\n  }\n  return queue[0];`,
        cpp: `    queue<string> q;\n    for (string n : names) {\n        q.push(n);\n    }\n    for (int i = 0; i < k; i++) {\n        string player = q.front();\n        q.pop();\n        q.push(player);\n    }\n    return q.front();`,
        csharp: `    var queue = new Queue<string>(names);\n    for (int i = 0; i < k; i++)\n    {\n        string player = queue.Dequeue();\n        queue.Enqueue(player);\n    }\n    return queue.Peek();`,
        java: `    Queue<String> queue = new ArrayDeque<>();\n    for (String n : names) {\n        queue.add(n);\n    }\n    for (int i = 0; i < k; i++) {\n        String player = queue.poll();\n        queue.add(player);\n    }\n    return queue.peek();`,
      },
    },
    require: QUEUE,
    gate: 'D',
    success: 'The potato goes round and round, and one worker is left cheering. <b>First in, first out.</b>',
  });

  ch.dsa_stack5 = fnT({
    title: 'The Reverse Calculator',
    sig: { fn: 'eval_rpn', ret: 'int', params: [['tokens', 'strs']] },
    desc: (ctx, sig, ex) => `<p>The old factory calculator has no brackets. It uses <b>postfix</b> notation: the numbers come first and the operator after them, so ${c('3 4 +')} means 3 + 4, and ${c('2 3 4 * +')} means 2 + 3 × 4. Write ${sig} that works out the answer. The operators are ${c('+')}, ${c('-')} and ${c('*')}.</p>${ex}
      <p>Push numbers onto a stack. For an operator, pop the <b>two</b> top numbers, combine them and push the result. Order matters for ${c('-')}: the first number you pop is the <b>right-hand</b> side. At the end, the answer is the only number left.</p>`,
    stub: {
      python: `    stack = []\n    for t in tokens:\n        if t == "+" or t == "-" or t == "*":\n            pass  # pop two numbers, work out the answer, push it back\n        else:\n            stack.append(int(t))\n    return stack[-1]`,
      javascript: `  const stack = [];\n  for (const t of tokens) {\n    if (t === "+" || t === "-" || t === "*") {\n      // pop two numbers, work out the answer, push it back\n    } else {\n      stack.push(Number(t));\n    }\n  }\n  return stack[stack.length - 1];`,
      cpp: `    stack<int> st;\n    for (string t : tokens) {\n        if (t == "+" || t == "-" || t == "*") {\n            // pop two numbers, work out the answer, push it back\n        } else {\n            st.push(stoi(t));\n        }\n    }\n    return st.top();`,
      csharp: `    var stack = new Stack<int>();\n    foreach (string t in tokens)\n    {\n        if (t == "+" || t == "-" || t == "*")\n        {\n            // pop two numbers, work out the answer, push it back\n        }\n        else\n        {\n            stack.Push(int.Parse(t));\n        }\n    }\n    return stack.Peek();`,
      java: `    Deque<Integer> stack = new ArrayDeque<>();\n    for (String t : tokens) {\n        if (t.equals("+") || t.equals("-") || t.equals("*")) {\n            // pop two numbers, work out the answer, push it back\n        } else {\n            stack.push(Integer.parseInt(t));\n        }\n    }\n    return stack.peek();`,
    },
    samples: [[['2', '3', '4', '*', '+']]],
    tests: [[[['3', '4', '+']], 7], [[['2', '3', '4', '*', '+']], 14], [[['10', '2', '-', '3', '*']], 24], [[['7']], 7], [[['2', '3', '-']], -1], [[['5', '1', '2', '+', '4', '*', '+', '3', '-']], 14], [[['4', '13', '5', '*', '+']], 69]],
    show: 3,
    hints: ['Pop into two variables: right first, then left. Then the answer is left + right, left - right or left * right.', 'Push the answer back onto the stack, so the next operator can use it.'],
    similar: {
      task: 'A score sheet where a 0 means "cancel the last score". Add up what is left.',
      sig: { fn: 'cancel_sum', ret: 'int', params: [['scores', 'ints']] },
      samples: [[[5, 2, 0, 3]]],
      body: {
        python: `    stack = []\n    for s in scores:\n        if s == 0:\n            if stack:\n                stack.pop()\n        else:\n            stack.append(s)\n    total = 0\n    for s in stack:\n        total += s\n    return total`,
        javascript: `  const stack = [];\n  for (const s of scores) {\n    if (s === 0) {\n      if (stack.length > 0) stack.pop();\n    } else {\n      stack.push(s);\n    }\n  }\n  let total = 0;\n  for (const s of stack) total += s;\n  return total;`,
        cpp: `    stack<int> st;\n    for (int s : scores) {\n        if (s == 0) {\n            if (!st.empty()) st.pop();\n        } else {\n            st.push(s);\n        }\n    }\n    int total = 0;\n    while (!st.empty()) {\n        total += st.top();\n        st.pop();\n    }\n    return total;`,
        csharp: `    var stack = new Stack<int>();\n    foreach (int s in scores)\n    {\n        if (s == 0)\n        {\n            if (stack.Count > 0) stack.Pop();\n        }\n        else\n        {\n            stack.Push(s);\n        }\n    }\n    int total = 0;\n    while (stack.Count > 0)\n    {\n        total += stack.Pop();\n    }\n    return total;`,
        java: `    Deque<Integer> stack = new ArrayDeque<>();\n    for (int s : scores) {\n        if (s == 0) {\n            if (!stack.isEmpty()) stack.pop();\n        } else {\n            stack.push(s);\n        }\n    }\n    int total = 0;\n    while (!stack.isEmpty()) {\n        total += stack.pop();\n    }\n    return total;`,
      },
    },
    require: {
      python: [[/\.pop\s*\(\s*\)/, 'Pop the two top numbers off the stack with <code>pop()</code>.']],
      javascript: [[/\.pop\s*\(\s*\)/, 'Pop the two top numbers off the stack with <code>pop()</code>.']],
      cpp: [[/\.pop\s*\(\s*\)/, 'Read the top with <code>top()</code> and remove it with <code>pop()</code>, twice.']],
      csharp: [[/\.Pop\s*\(\s*\)/, 'Pop the two top numbers off the stack with <code>Pop()</code>.']],
      java: [[/\.pop\s*\(\s*\)/, 'Pop the two top numbers off the stack with <code>pop()</code>.']],
    },
    gate: 'E',
    success: 'The calculator whirs and prints the answer. No brackets needed, just a stack. <b>Now: something big is coming down the conveyor belt...</b>',
  });
  const levels = [];
  // ======================================================================= 1. Arrays & Big-O
  levels.push({
    id: 'dsa_arrays', name: 'Array Docks', topic: 'Arrays & Big-O',
    blurb: 'Walk a list with one loop, keep the best so far, and squeeze in from both ends with two pointers.',
    theme: 'circuit',
    intro: `<p>Something is wrong in the Data District. Programs that used to finish in a blink now take minutes, and the dock cranes freeze halfway through a lift. People blame a creature they call <b>the Big O</b>: it feeds on wasted steps.</p>
      <p>A small orange robot rolls up to you. "I'm Lin. I count steps, that's my whole job. Help me make these programs fast again?"</p>
      <p>"First lesson: speed isn't about seconds. It's about <b>how the number of steps grows</b> when the list gets bigger. One loop over a list is fine. A loop inside a loop gets very slow, very fast."</p>`,
    tutorial: [
      { title: 'Counting steps',
        body: `<p><b>Big-O</b> is a short way to say how the work grows when the input grows. If you have <b>n</b> items:</p>
          <ul><li>One loop over the list does about <b>n</b> steps. That is <b>O(n)</b>, "linear". Twice the items, twice the work.</li>
          <li>A loop inside a loop does about <b>n × n</b> steps. That is <b>O(n²)</b>. Twice the items, <b>four times</b> the work.</li></ul>
          <p>Run the code and watch what happens to each count when n doubles.</p>`,
        code: prog({
          python: [`def one_loop(n):\n    steps = 0\n    for i in range(n):\n        steps += 1\n    return steps\n\ndef loop_in_loop(n):\n    steps = 0\n    for i in range(n):\n        for j in range(n):\n            steps += 1\n    return steps`,
            `for n in [10, 20, 40]:\n    print(n, "items:", one_loop(n), "steps vs", loop_in_loop(n), "steps")`],
          javascript: [`function oneLoop(n) {\n  let steps = 0;\n  for (let i = 0; i < n; i++) {\n    steps += 1;\n  }\n  return steps;\n}\n\nfunction loopInLoop(n) {\n  let steps = 0;\n  for (let i = 0; i < n; i++) {\n    for (let j = 0; j < n; j++) {\n      steps += 1;\n    }\n  }\n  return steps;\n}`,
            `for (const n of [10, 20, 40]) {\n  console.log(n, "items:", oneLoop(n), "steps vs", loopInLoop(n), "steps");\n}`],
          cpp: [`int one_loop(int n) {\n    int steps = 0;\n    for (int i = 0; i < n; i++) {\n        steps += 1;\n    }\n    return steps;\n}\n\nint loop_in_loop(int n) {\n    int steps = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            steps += 1;\n        }\n    }\n    return steps;\n}`,
            `vector<int> sizes = {10, 20, 40};\nfor (int n : sizes) {\n    cout << n << " items: " << one_loop(n) << " steps vs " << loop_in_loop(n) << " steps" << endl;\n}`],
          csharp: [`int OneLoop(int n)\n{\n    int steps = 0;\n    for (int i = 0; i < n; i++)\n    {\n        steps += 1;\n    }\n    return steps;\n}\n\nint LoopInLoop(int n)\n{\n    int steps = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            steps += 1;\n        }\n    }\n    return steps;\n}`,
            `int[] sizes = { 10, 20, 40 };\nforeach (int n in sizes)\n{\n    Console.WriteLine(n + " items: " + OneLoop(n) + " steps vs " + LoopInLoop(n) + " steps");\n}`],
          java: [`static int oneLoop(int n) {\n    int steps = 0;\n    for (int i = 0; i < n; i++) {\n        steps += 1;\n    }\n    return steps;\n}\n\nstatic int loopInLoop(int n) {\n    int steps = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            steps += 1;\n        }\n    }\n    return steps;\n}`,
            `int[] sizes = {10, 20, 40};\nfor (int n : sizes) {\n    System.out.println(n + " items: " + oneLoop(n) + " steps vs " + loopInLoop(n) + " steps");\n}`],
        }) },
      { title: 'Linear search',
        body: `<p>The simplest way to find something is to look at every item in order until you find it. That's <b>linear search</b>.</p>
          <p>If the item is near the front it's quick, but if it's at the end (or missing) you check all <b>n</b> items. Big-O cares about that worst case, so linear search is <b>O(n)</b>.</p>
          <p>Notice the ${code('return')} inside the loop: the function stops the moment it finds a match.</p>`,
        code: prog({
          python: [`def contains(items, target):\n    for x in items:\n        if x == target:\n            return True\n    return False`, `crates = [12, 40, 7, 33, 18]\nprint(contains(crates, 33))\nprint(contains(crates, 5))`],
          javascript: [`function contains(items, target) {\n  for (const x of items) {\n    if (x === target) {\n      return true;\n    }\n  }\n  return false;\n}`, `const crates = [12, 40, 7, 33, 18];\nconsole.log(contains(crates, 33));\nconsole.log(contains(crates, 5));`],
          cpp: [`bool contains(vector<int> items, int target) {\n    for (int x : items) {\n        if (x == target) {\n            return true;\n        }\n    }\n    return false;\n}`, `vector<int> crates = {12, 40, 7, 33, 18};\ncout << boolalpha << contains(crates, 33) << endl;\ncout << contains(crates, 5) << endl;`],
          csharp: [`bool Contains(int[] items, int target)\n{\n    foreach (int x in items)\n    {\n        if (x == target)\n        {\n            return true;\n        }\n    }\n    return false;\n}`, `int[] crates = { 12, 40, 7, 33, 18 };\nConsole.WriteLine(Contains(crates, 33));\nConsole.WriteLine(Contains(crates, 5));`],
          java: [`static boolean contains(int[] items, int target) {\n    for (int x : items) {\n        if (x == target) {\n            return true;\n        }\n    }\n    return false;\n}`, `int[] crates = {12, 40, 7, 33, 18};\nSystem.out.println(contains(crates, 33));\nSystem.out.println(contains(crates, 5));`],
        }) },
      { title: 'The best so far',
        body: `<p>To find the biggest number you don't need to sort anything. Walk through once and remember the <b>best so far</b>. Whenever you see something better, replace it.</p>
          <p>Start with the <b>first item</b>, not with 0: if every number is negative, 0 would wrongly win.</p>`,
        code: prog({
          python: [`def biggest(nums):\n    best = nums[0]\n    for n in nums:\n        if n > best:\n            best = n\n    return best`, `print(biggest([4, 19, 2, 11]))\nprint(biggest([-8, -3, -5]))`],
          javascript: [`function biggest(nums) {\n  let best = nums[0];\n  for (const n of nums) {\n    if (n > best) {\n      best = n;\n    }\n  }\n  return best;\n}`, `console.log(biggest([4, 19, 2, 11]));\nconsole.log(biggest([-8, -3, -5]));`],
          cpp: [`int biggest(vector<int> nums) {\n    int best = nums[0];\n    for (int n : nums) {\n        if (n > best) {\n            best = n;\n        }\n    }\n    return best;\n}`, `cout << biggest({4, 19, 2, 11}) << endl;\ncout << biggest({-8, -3, -5}) << endl;`],
          csharp: [`int Biggest(int[] nums)\n{\n    int best = nums[0];\n    foreach (int n in nums)\n    {\n        if (n > best)\n        {\n            best = n;\n        }\n    }\n    return best;\n}`, `Console.WriteLine(Biggest(new int[] { 4, 19, 2, 11 }));\nConsole.WriteLine(Biggest(new int[] { -8, -3, -5 }));`],
          java: [`static int biggest(int[] nums) {\n    int best = nums[0];\n    for (int n : nums) {\n        if (n > best) {\n            best = n;\n        }\n    }\n    return best;\n}`, `System.out.println(biggest(new int[]{4, 19, 2, 11}));\nSystem.out.println(biggest(new int[]{-8, -3, -5}));`],
        }) },
      { title: 'Two pointers',
        body: `<p>Some problems get easier when you look at a list from <b>both ends</b> at once. Keep two indexes: ${code('left')} starts at 0 and ${code('right')} at the last index. Each time round the loop, do something with the two items, then move the pointers toward each other.</p>
          <p>The loop runs while ${code('left < right')}, so it stops when they meet in the middle. Each item is visited once: still <b>O(n)</b>.</p>`,
        code: prog({
          python: [``, `dancers = ["Ada", "Bo", "Cy", "Dee", "Eli", "Fay"]\nleft = 0\nright = len(dancers) - 1\nwhile left < right:\n    print(dancers[left], "dances with", dancers[right])\n    left += 1\n    right -= 1`],
          javascript: [``, `const dancers = ["Ada", "Bo", "Cy", "Dee", "Eli", "Fay"];\nlet left = 0;\nlet right = dancers.length - 1;\nwhile (left < right) {\n  console.log(dancers[left], "dances with", dancers[right]);\n  left++;\n  right--;\n}`],
          cpp: [``, `vector<string> dancers = {"Ada", "Bo", "Cy", "Dee", "Eli", "Fay"};\nint left = 0;\nint right = dancers.size() - 1;\nwhile (left < right) {\n    cout << dancers[left] << " dances with " << dancers[right] << endl;\n    left++;\n    right--;\n}`],
          csharp: [``, `string[] dancers = { "Ada", "Bo", "Cy", "Dee", "Eli", "Fay" };\nint left = 0;\nint right = dancers.Length - 1;\nwhile (left < right)\n{\n    Console.WriteLine(dancers[left] + " dances with " + dancers[right]);\n    left++;\n    right--;\n}`],
          java: [``, `String[] dancers = {"Ada", "Bo", "Cy", "Dee", "Eli", "Fay"};\nint left = 0;\nint right = dancers.length - 1;\nwhile (left < right) {\n    System.out.println(dancers[left] + " dances with " + dancers[right]);\n    left++;\n    right--;\n}`],
        }) },
    ],
    signs: ['Lin: "One loop over n items is O(n). A loop inside a loop is O(n squared). The Big O loves those."', 'Lin: "Two pointers: one at each end, walking toward the middle."', 'Lin: "Sorted lists are full of shortcuts. Remember that, the library is next."'],
    terminals: ['dsa_arrays1', 'dsa_arrays2', 'dsa_arrays3', 'dsa_arrays4', 'dsa_arrays5'],
    map: (B) => {
      const m = B.MapBuilder(132, 17);
      m.fill(0, 15, 131, 16, '#');
      m.put(2, 14, 'P'); m.put(5, 14, '?');
      let x = B.room(m, 7, 1, 'wall', 'A');
      x = B.TR.hills(m, x);
      x = B.room(m, x, 2, 'bridge', 'B');
      m.put(x + 1, 14, '?');
      x = B.TR.pit(m, x + 3);
      x = B.room(m, x + 1, 3, 'climb', 'C');
      m.put(x + 3, 14, 'K');
      x = B.TR.mover(m, x + 6);
      x = B.room(m, x + 1, 4, 'spikes', 'D');
      m.put(x + 2, 14, 'e'); m.put(x + 5, 10, 'w');
      x = B.TR.hills(m, x + 3);
      x = B.room(m, x, 5, 'lava', 'E');
      m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
      return m;
    },
  });
  // ======================================================================= 2. Searching
  levels.push({
    id: 'dsa_search', name: 'The Binary Library', topic: 'Searching',
    blurb: 'Binary search: halve a sorted range again and again, for exact matches, first copies, gaps and even square roots.',
    theme: 'cave',
    intro: `<p>Under the Data District lies a library with a million books, every one of them sorted. The librarians are exhausted. They search the way the Big O taught them: start at shelf one and walk.</p>
      <p>"Watch this," says Lin, and opens a book right in the middle. "Is the one we want earlier or later? Later. So the whole first half is gone, with one look."</p>
      <p>"Keep doing that and a million books take about <b>20 looks</b>. That's <b>binary search</b>. The only rule: the list has to be <b>sorted</b>."</p>`,
    tutorial: [
      { title: 'Guess the number',
        body: `<p>I'm thinking of a number from 1 to 100. The smartest guess is always the <b>middle</b> of what's left, because whatever the answer ("too low" or "too high"), half the numbers are ruled out.</p>
          <p>The code keeps the range in ${code('low')} and ${code('high')}. After each guess, one of them jumps past the middle.</p>`,
        code: prog({
          python: [``, `secret = 73\nlow = 1\nhigh = 100\nguesses = 0\nwhile low <= high:\n    guess = (low + high) // 2\n    guesses += 1\n    if guess == secret:\n        print("Got it:", guess, "in", guesses, "guesses")\n        break\n    elif guess < secret:\n        print(guess, "is too low")\n        low = guess + 1\n    else:\n        print(guess, "is too high")\n        high = guess - 1`],
          javascript: [``, `const secret = 73;\nlet low = 1;\nlet high = 100;\nlet guesses = 0;\nwhile (low <= high) {\n  const guess = Math.floor((low + high) / 2);\n  guesses++;\n  if (guess === secret) {\n    console.log("Got it:", guess, "in", guesses, "guesses");\n    break;\n  } else if (guess < secret) {\n    console.log(guess, "is too low");\n    low = guess + 1;\n  } else {\n    console.log(guess, "is too high");\n    high = guess - 1;\n  }\n}`],
          cpp: [``, `int secret = 73;\nint low = 1;\nint high = 100;\nint guesses = 0;\nwhile (low <= high) {\n    int guess = (low + high) / 2;\n    guesses++;\n    if (guess == secret) {\n        cout << "Got it: " << guess << " in " << guesses << " guesses" << endl;\n        break;\n    } else if (guess < secret) {\n        cout << guess << " is too low" << endl;\n        low = guess + 1;\n    } else {\n        cout << guess << " is too high" << endl;\n        high = guess - 1;\n    }\n}`],
          csharp: [``, `int secret = 73;\nint low = 1;\nint high = 100;\nint guesses = 0;\nwhile (low <= high)\n{\n    int guess = (low + high) / 2;\n    guesses++;\n    if (guess == secret)\n    {\n        Console.WriteLine("Got it: " + guess + " in " + guesses + " guesses");\n        break;\n    }\n    else if (guess < secret)\n    {\n        Console.WriteLine(guess + " is too low");\n        low = guess + 1;\n    }\n    else\n    {\n        Console.WriteLine(guess + " is too high");\n        high = guess - 1;\n    }\n}`],
          java: [``, `int secret = 73;\nint low = 1;\nint high = 100;\nint guesses = 0;\nwhile (low <= high) {\n    int guess = (low + high) / 2;\n    guesses++;\n    if (guess == secret) {\n        System.out.println("Got it: " + guess + " in " + guesses + " guesses");\n        break;\n    } else if (guess < secret) {\n        System.out.println(guess + " is too low");\n        low = guess + 1;\n    } else {\n        System.out.println(guess + " is too high");\n        high = guess - 1;\n    }\n}`],
        }) },
      { title: 'Why it is so fast',
        body: `<p>Each look cuts the range in half. How many halvings until one item is left? That number is called log<sub>2</sub>(n):</p>
          <table class="cheat"><tr><td>1,000 items</td><td>about 10 looks</td></tr><tr><td>1,000,000 items</td><td>about 20 looks</td></tr><tr><td>1,000,000,000 items</td><td>about 30 looks</td></tr></table>
          <p>So binary search is <b>O(log n)</b>. Linear search on a billion items could need a billion looks. The code below searches 1,000 sorted numbers both ways and counts the steps.</p>`,
        code: prog({
          python: [``, `nums = []\nfor i in range(1000):\n    nums.append(i * 3)\ntarget = 2997   # the very last number\n\nlinear = 0\nfor x in nums:\n    linear += 1\n    if x == target:\n        break\n\nbinary = 0\nlow = 0\nhigh = len(nums) - 1\nwhile low <= high:\n    binary += 1\n    mid = (low + high) // 2\n    if nums[mid] == target:\n        break\n    elif nums[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1\n\nprint("linear search:", linear, "steps")\nprint("binary search:", binary, "steps")`],
          javascript: [``, `const nums = [];\nfor (let i = 0; i < 1000; i++) {\n  nums.push(i * 3);\n}\nconst target = 2997;   // the very last number\n\nlet linear = 0;\nfor (const x of nums) {\n  linear++;\n  if (x === target) break;\n}\n\nlet binary = 0;\nlet low = 0;\nlet high = nums.length - 1;\nwhile (low <= high) {\n  binary++;\n  const mid = Math.floor((low + high) / 2);\n  if (nums[mid] === target) break;\n  else if (nums[mid] < target) low = mid + 1;\n  else high = mid - 1;\n}\n\nconsole.log("linear search:", linear, "steps");\nconsole.log("binary search:", binary, "steps");`],
          cpp: [``, `vector<int> nums;\nfor (int i = 0; i < 1000; i++) {\n    nums.push_back(i * 3);\n}\nint target = 2997;   // the very last number\n\nint linear = 0;\nfor (int x : nums) {\n    linear++;\n    if (x == target) break;\n}\n\nint binary = 0;\nint low = 0;\nint high = nums.size() - 1;\nwhile (low <= high) {\n    binary++;\n    int mid = (low + high) / 2;\n    if (nums[mid] == target) break;\n    else if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n}\n\ncout << "linear search: " << linear << " steps" << endl;\ncout << "binary search: " << binary << " steps" << endl;`],
          csharp: [``, `int[] nums = new int[1000];\nfor (int i = 0; i < 1000; i++)\n{\n    nums[i] = i * 3;\n}\nint target = 2997;   // the very last number\n\nint linear = 0;\nforeach (int x in nums)\n{\n    linear++;\n    if (x == target) break;\n}\n\nint binary = 0;\nint low = 0;\nint high = nums.Length - 1;\nwhile (low <= high)\n{\n    binary++;\n    int mid = (low + high) / 2;\n    if (nums[mid] == target) break;\n    else if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n}\n\nConsole.WriteLine("linear search: " + linear + " steps");\nConsole.WriteLine("binary search: " + binary + " steps");`],
          java: [``, `int[] nums = new int[1000];\nfor (int i = 0; i < 1000; i++) {\n    nums[i] = i * 3;\n}\nint target = 2997;   // the very last number\n\nint linear = 0;\nfor (int x : nums) {\n    linear++;\n    if (x == target) break;\n}\n\nint binary = 0;\nint low = 0;\nint high = nums.length - 1;\nwhile (low <= high) {\n    binary++;\n    int mid = (low + high) / 2;\n    if (nums[mid] == target) break;\n    else if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n}\n\nSystem.out.println("linear search: " + linear + " steps");\nSystem.out.println("binary search: " + binary + " steps");`],
        }) },
      { title: 'Low, high and mid',
        body: `<p>Binary search works on anything you can put in order, words too. Every round has three cases:</p>
          <ul><li>the middle item <b>is</b> the target: done;</li><li>it's <b>smaller</b>: everything up to mid is too small, so ${code('low = mid + 1')};</li><li>it's <b>bigger</b>: ${code('high = mid - 1')}.</li></ul>
          <p>The loop runs while ${code('low <= high')}. When the range is empty, the target isn't there. Forgetting the ${code('+ 1')} or ${code('- 1')} is the classic bug: the range stops shrinking and the loop never ends.</p>`,
        code: prog({
          python: [`def has_word(words, target):\n    low = 0\n    high = len(words) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if words[mid] == target:\n            return True\n        if words[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return False`, `shelf = ["apple", "banana", "cherry", "grape", "lemon", "mango", "peach"]\nprint(has_word(shelf, "lemon"))\nprint(has_word(shelf, "kiwi"))`],
          javascript: [`function hasWord(words, target) {\n  let low = 0;\n  let high = words.length - 1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    if (words[mid] === target) return true;\n    if (words[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return false;\n}`, `const shelf = ["apple", "banana", "cherry", "grape", "lemon", "mango", "peach"];\nconsole.log(hasWord(shelf, "lemon"));\nconsole.log(hasWord(shelf, "kiwi"));`],
          cpp: [`bool has_word(vector<string> words, string target) {\n    int low = 0;\n    int high = words.size() - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (words[mid] == target) return true;\n        if (words[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return false;\n}`, `vector<string> shelf = {"apple", "banana", "cherry", "grape", "lemon", "mango", "peach"};\ncout << boolalpha << has_word(shelf, "lemon") << endl;\ncout << has_word(shelf, "kiwi") << endl;`],
          csharp: [`bool HasWord(string[] words, string target)\n{\n    int low = 0;\n    int high = words.Length - 1;\n    while (low <= high)\n    {\n        int mid = (low + high) / 2;\n        if (words[mid] == target) return true;\n        if (words[mid].CompareTo(target) < 0) low = mid + 1;\n        else high = mid - 1;\n    }\n    return false;\n}`, `string[] shelf = { "apple", "banana", "cherry", "grape", "lemon", "mango", "peach" };\nConsole.WriteLine(HasWord(shelf, "lemon"));\nConsole.WriteLine(HasWord(shelf, "kiwi"));`],
          java: [`static boolean hasWord(String[] words, String target) {\n    int low = 0;\n    int high = words.length - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (words[mid].equals(target)) return true;\n        if (words[mid].compareTo(target) < 0) low = mid + 1;\n        else high = mid - 1;\n    }\n    return false;\n}`, `String[] shelf = {"apple", "banana", "cherry", "grape", "lemon", "mango", "peach"};\nSystem.out.println(hasWord(shelf, "lemon"));\nSystem.out.println(hasWord(shelf, "kiwi"));`],
        }) },
      { title: 'Searching for an answer',
        body: `<p>Binary search doesn't need a list at all. It works whenever a yes/no question flips <b>once</b>: "no, no, no, ..., yes, yes, yes". Here a speaker is loud from some volume upwards, and we look for the first loud volume with as few checks as possible.</p>
          <p>Notice the different shape: the loop runs while ${code('low < high')}, and when the answer is "yes" we keep ${code('mid')} in the range (${code('high = mid')}), because mid itself might be the answer.</p>`,
        code: prog({
          python: [`def is_loud(volume):\n    return volume >= 37`, `low = 1\nhigh = 100\nchecks = 0\nwhile low < high:\n    mid = (low + high) // 2\n    checks += 1\n    if is_loud(mid):\n        high = mid       # mid might be the answer, keep it\n    else:\n        low = mid + 1    # mid is too quiet\nprint("first loud volume:", low, "after", checks, "checks")`],
          javascript: [`function isLoud(volume) {\n  return volume >= 37;\n}`, `let low = 1;\nlet high = 100;\nlet checks = 0;\nwhile (low < high) {\n  const mid = Math.floor((low + high) / 2);\n  checks++;\n  if (isLoud(mid)) {\n    high = mid;       // mid might be the answer, keep it\n  } else {\n    low = mid + 1;    // mid is too quiet\n  }\n}\nconsole.log("first loud volume:", low, "after", checks, "checks");`],
          cpp: [`bool is_loud(int volume) {\n    return volume >= 37;\n}`, `int low = 1;\nint high = 100;\nint checks = 0;\nwhile (low < high) {\n    int mid = (low + high) / 2;\n    checks++;\n    if (is_loud(mid)) {\n        high = mid;       // mid might be the answer, keep it\n    } else {\n        low = mid + 1;    // mid is too quiet\n    }\n}\ncout << "first loud volume: " << low << " after " << checks << " checks" << endl;`],
          csharp: [`bool IsLoud(int volume)\n{\n    return volume >= 37;\n}`, `int low = 1;\nint high = 100;\nint checks = 0;\nwhile (low < high)\n{\n    int mid = (low + high) / 2;\n    checks++;\n    if (IsLoud(mid))\n    {\n        high = mid;       // mid might be the answer, keep it\n    }\n    else\n    {\n        low = mid + 1;    // mid is too quiet\n    }\n}\nConsole.WriteLine("first loud volume: " + low + " after " + checks + " checks");`],
          java: [`static boolean isLoud(int volume) {\n    return volume >= 37;\n}`, `int low = 1;\nint high = 100;\nint checks = 0;\nwhile (low < high) {\n    int mid = (low + high) / 2;\n    checks++;\n    if (isLoud(mid)) {\n        high = mid;       // mid might be the answer, keep it\n    } else {\n        low = mid + 1;    // mid is too quiet\n    }\n}\nSystem.out.println("first loud volume: " + low + " after " + checks + " checks");`],
        }) },
    ],
    signs: ['Lin: "Binary search only works on a sorted list. On a shuffled one it gives nonsense."', 'Lin: "low = mid + 1, high = mid - 1. Forget the plus or minus one and the loop never ends."', 'Lin: "No list? If a yes/no question flips once, you can still binary search for where it flips."'],
    terminals: ['dsa_search1', 'dsa_search2', 'dsa_search3', 'dsa_search4', 'dsa_search5'],
    map: (B) => {
      const m = B.MapBuilder(142, 17);
      m.fill(0, 15, 141, 16, '#');
      m.put(2, 14, 'P'); m.put(5, 14, '?');
      let x = B.room(m, 7, 1, 'spikes', 'A');
      x = B.TR.hills(m, x + 1);
      x = B.room(m, x, 2, 'climb', 'B');
      m.put(x + 2, 14, '?');
      x = B.TR.mover(m, x + 6);
      x = B.room(m, x + 1, 3, 'bridge', 'C');
      m.put(x + 1, 14, 'K'); m.put(x + 4, 14, 'e');
      x = B.TR.pit(m, x + 6);
      x = B.room(m, x + 1, 4, 'spring', 'D');
      x = B.TR.hills(m, x + 1);
      m.put(x + 2, 10, 'w');
      x = B.TR.tower(m, x + 1);
      x = B.room(m, x + 1, 5, 'wall', 'E');
      m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
      return m;
    },
  });
  // ======================================================================= 3. Hash Maps
  levels.push({
    id: 'dsa_hash', name: 'Hash Harbor', topic: 'Hash Maps',
    blurb: 'Look things up in one step: count, remember what you have seen, and group by a key.',
    theme: 'isle',
    intro: `<p>Hash Harbor runs on a giant board of hooks. Every crate has a label, and every label belongs on exactly one hook. A dock worker never searches: they read the label and walk straight to its hook.</p>
      <p>"That's a <b>hash map</b>," says Lin. "Python calls it a dictionary, C# a Dictionary, Java a HashMap, C++ an unordered_map, JavaScript a Map. Give it a <b>key</b>, it gives you the <b>value</b>, in about one step, however much is stored."</p>
      <p>"The Big O hates this place. Lots of slow loop-inside-a-loop programs become one loop plus a map."</p>`,
    tutorial: [
      { title: 'A lookup table',
        body: `<p>A hash map stores <b>key → value</b> pairs. It turns the key into a number (its <b>hash</b>) that says where to file the value, so finding it again takes about one step: <b>O(1)</b> on average. A list would need a linear search.</p>
          <p>Keys are unique: setting a key that already exists replaces its value. Checking "is this key in there?" is just as quick as reading it.</p>`,
        code: prog({
          python: [``, `prices = {"apple": 3, "rope": 12}\nprices["lamp"] = 9    # add a new key\nprices["apple"] = 4   # change a value\nprint(prices["rope"])\nprint("lamp" in prices)\nprint("sword" in prices)\nprint(len(prices))`],
          javascript: [``, `const prices = new Map();\nprices.set("apple", 3);\nprices.set("rope", 12);\nprices.set("lamp", 9);    // add a new key\nprices.set("apple", 4);   // change a value\nconsole.log(prices.get("rope"));\nconsole.log(prices.has("lamp"));\nconsole.log(prices.has("sword"));\nconsole.log(prices.size);`],
          cpp: [``, `unordered_map<string, int> prices;\nprices["apple"] = 3;\nprices["rope"] = 12;\nprices["lamp"] = 9;    // add a new key\nprices["apple"] = 4;   // change a value\ncout << prices["rope"] << endl;\ncout << prices.count("lamp") << endl;    // 1 means it is there\ncout << prices.count("sword") << endl;   // 0 means it is not\ncout << prices.size() << endl;`],
          csharp: [``, `var prices = new Dictionary<string, int>();\nprices["apple"] = 3;\nprices["rope"] = 12;\nprices["lamp"] = 9;    // add a new key\nprices["apple"] = 4;   // change a value\nConsole.WriteLine(prices["rope"]);\nConsole.WriteLine(prices.ContainsKey("lamp"));\nConsole.WriteLine(prices.ContainsKey("sword"));\nConsole.WriteLine(prices.Count);`],
          java: [``, `HashMap<String, Integer> prices = new HashMap<>();\nprices.put("apple", 3);\nprices.put("rope", 12);\nprices.put("lamp", 9);    // add a new key\nprices.put("apple", 4);   // change a value\nSystem.out.println(prices.get("rope"));\nSystem.out.println(prices.containsKey("lamp"));\nSystem.out.println(prices.containsKey("sword"));\nSystem.out.println(prices.size());`],
        }) },
      { title: 'Counting things',
        body: {
          python: `<p>The most common use of a map: <b>counting</b>. The key is the thing, the value is how many you've seen. ${code('counts.get(ch, 0)')} reads the count, or 0 if this is the first one.</p><p>One loop over the input, one map update per item: <b>O(n)</b>.</p>`,
          javascript: `<p>The most common use of a map: <b>counting</b>. The key is the thing, the value is how many you've seen. ${code('counts.get(ch)')} is ${code('undefined')} the first time, so ${code('(counts.get(ch) || 0) + 1')} turns that into 1.</p><p>One loop over the input, one map update per item: <b>O(n)</b>.</p>`,
          cpp: `<p>The most common use of a map: <b>counting</b>. The key is the thing, the value is how many you've seen. In C++, ${code('counts[ch]')} on a key that isn't there yet creates it with the value 0, so ${code('counts[ch]++')} just works.</p><p>One loop over the input, one map update per item: <b>O(n)</b>.</p>`,
          csharp: `<p>The most common use of a map: <b>counting</b>. The key is the thing, the value is how many you've seen. Reading ${code('counts[ch]')} for a missing key would crash, so ${code('counts.GetValueOrDefault(ch, 0)')} gives 0 the first time.</p><p>One loop over the input, one map update per item: <b>O(n)</b>.</p>`,
          java: `<p>The most common use of a map: <b>counting</b>. The key is the thing, the value is how many you've seen. ${code('counts.getOrDefault(ch, 0)')} reads the count, or 0 if this is the first one.</p><p>One loop over the input, one map update per item: <b>O(n)</b>.</p>`,
        },
        code: prog({
          python: [``, `word = "banana"\ncounts = {}\nfor ch in word:\n    counts[ch] = counts.get(ch, 0) + 1\nfor ch in "abn":\n    print(ch, counts[ch])`],
          javascript: [``, `const word = "banana";\nconst counts = new Map();\nfor (const ch of word) {\n  counts.set(ch, (counts.get(ch) || 0) + 1);\n}\nfor (const ch of "abn") {\n  console.log(ch, counts.get(ch));\n}`],
          cpp: [``, `string word = "banana";\nunordered_map<char, int> counts;\nfor (char ch : word) {\n    counts[ch]++;\n}\nstring letters = "abn";\nfor (char ch : letters) {\n    cout << ch << " " << counts[ch] << endl;\n}`],
          csharp: [``, `string word = "banana";\nvar counts = new Dictionary<char, int>();\nforeach (char ch in word)\n{\n    counts[ch] = counts.GetValueOrDefault(ch, 0) + 1;\n}\nforeach (char ch in "abn")\n{\n    Console.WriteLine(ch + " " + counts[ch]);\n}`],
          java: [``, `String word = "banana";\nHashMap<Character, Integer> counts = new HashMap<>();\nfor (char ch : word.toCharArray()) {\n    counts.put(ch, counts.getOrDefault(ch, 0) + 1);\n}\nfor (char ch : "abn".toCharArray()) {\n    System.out.println(ch + " " + counts.get(ch));\n}`],
        }) },
      { title: 'Remember what you have seen',
        body: `<p>"Have I seen this before?" With a list you'd search all the earlier items every time: a loop inside a loop, <b>O(n²)</b>. With a map it's one quick check, so the whole thing is <b>O(n)</b>.</p>
          <p>The value can be anything useful. Here it's the <b>index</b> where each word first appeared, so we can say where the repeat came from.</p>`,
        code: prog({
          python: [``, `words = ["dog", "cat", "owl", "cat", "dog"]\nfirst_seen = {}   # word -> where it first appeared\nfor i in range(len(words)):\n    w = words[i]\n    if w in first_seen:\n        print(w, "repeats: first seen at", first_seen[w], "and again at", i)\n        break\n    first_seen[w] = i`],
          javascript: [``, `const words = ["dog", "cat", "owl", "cat", "dog"];\nconst firstSeen = new Map();   // word -> where it first appeared\nfor (let i = 0; i < words.length; i++) {\n  const w = words[i];\n  if (firstSeen.has(w)) {\n    console.log(w, "repeats: first seen at", firstSeen.get(w), "and again at", i);\n    break;\n  }\n  firstSeen.set(w, i);\n}`],
          cpp: [``, `vector<string> words = {"dog", "cat", "owl", "cat", "dog"};\nunordered_map<string, int> first_seen;   // word -> where it first appeared\nfor (int i = 0; i < words.size(); i++) {\n    string w = words[i];\n    if (first_seen.count(w) > 0) {\n        cout << w << " repeats: first seen at " << first_seen[w] << " and again at " << i << endl;\n        break;\n    }\n    first_seen[w] = i;\n}`],
          csharp: [``, `string[] words = { "dog", "cat", "owl", "cat", "dog" };\nvar firstSeen = new Dictionary<string, int>();   // word -> where it first appeared\nfor (int i = 0; i < words.Length; i++)\n{\n    string w = words[i];\n    if (firstSeen.ContainsKey(w))\n    {\n        Console.WriteLine(w + " repeats: first seen at " + firstSeen[w] + " and again at " + i);\n        break;\n    }\n    firstSeen[w] = i;\n}`],
          java: [``, `String[] words = {"dog", "cat", "owl", "cat", "dog"};\nHashMap<String, Integer> firstSeen = new HashMap<>();   // word -> where it first appeared\nfor (int i = 0; i < words.length; i++) {\n    String w = words[i];\n    if (firstSeen.containsKey(w)) {\n        System.out.println(w + " repeats: first seen at " + firstSeen.get(w) + " and again at " + i);\n        break;\n    }\n    firstSeen.put(w, i);\n}`],
        }) },
      { title: 'Grouping with a key',
        body: `<p>A value can be a whole list. To <b>group</b> things, decide on a <b>key</b> that all members of a group share, and keep a list for each key. Here the key is the first letter.</p>
          <p>The first time a key shows up, give it an empty list; after that, add to it. Choosing the right key is the clever part of many map problems.</p>`,
        code: prog({
          python: [``, `words = ["apple", "bat", "avocado", "bee", "cherry", "banana"]\ngroups = {}\nfor w in words:\n    key = w[0]\n    if key not in groups:\n        groups[key] = []\n    groups[key].append(w)\nprint(", ".join(groups["a"]))\nprint(", ".join(groups["b"]))\nprint(len(groups), "groups")`],
          javascript: [``, `const words = ["apple", "bat", "avocado", "bee", "cherry", "banana"];\nconst groups = new Map();\nfor (const w of words) {\n  const key = w[0];\n  if (!groups.has(key)) {\n    groups.set(key, []);\n  }\n  groups.get(key).push(w);\n}\nconsole.log(groups.get("a").join(", "));\nconsole.log(groups.get("b").join(", "));\nconsole.log(groups.size, "groups");`],
          cpp: [``, `vector<string> words = {"apple", "bat", "avocado", "bee", "cherry", "banana"};\nunordered_map<char, vector<string>> groups;\nfor (string w : words) {\n    groups[w[0]].push_back(w);   // a new key starts as an empty vector\n}\nfor (string w : groups['a']) {\n    cout << w << " ";\n}\ncout << endl;\nfor (string w : groups['b']) {\n    cout << w << " ";\n}\ncout << endl;\ncout << groups.size() << " groups" << endl;`],
          csharp: [``, `string[] words = { "apple", "bat", "avocado", "bee", "cherry", "banana" };\nvar groups = new Dictionary<char, List<string>>();\nforeach (string w in words)\n{\n    char key = w[0];\n    if (!groups.ContainsKey(key))\n    {\n        groups[key] = new List<string>();\n    }\n    groups[key].Add(w);\n}\nConsole.WriteLine(string.Join(", ", groups['a']));\nConsole.WriteLine(string.Join(", ", groups['b']));\nConsole.WriteLine(groups.Count + " groups");`],
          java: [``, `String[] words = {"apple", "bat", "avocado", "bee", "cherry", "banana"};\nHashMap<Character, List<String>> groups = new HashMap<>();\nfor (String w : words) {\n    char key = w.charAt(0);\n    if (!groups.containsKey(key)) {\n        groups.put(key, new ArrayList<>());\n    }\n    groups.get(key).add(w);\n}\nSystem.out.println(String.join(", ", groups.get('a')));\nSystem.out.println(String.join(", ", groups.get('b')));\nSystem.out.println(groups.size() + " groups");`],
        }) },
    ],
    signs: ['Lin: "Key in, value out, about one step. That is O(1)."', 'Lin: "A map has no useful order. If order matters, walk your original list instead."', 'Lin: "Loop inside a loop? Ask yourself if a map could remember the inner loop\'s answer."'],
    terminals: ['dsa_hash1', 'dsa_hash2', 'dsa_hash3', 'dsa_hash4', 'dsa_hash5'],
    map: (B) => {
      const m = B.MapBuilder(136, 17);
      m.fill(0, 15, 135, 16, '#');
      m.put(2, 14, 'P'); m.put(5, 14, '?');
      let x = B.room(m, 7, 1, 'climb', 'A');
      x = B.TR.pit(m, x + 6);
      x = B.room(m, x + 1, 2, 'wall', 'B');
      m.put(x + 2, 14, 'e');
      x = B.TR.hills(m, x + 3);
      x = B.room(m, x, 3, 'lava', 'C');
      m.put(x + 1, 14, 'K'); m.put(x + 3, 14, '?');
      x = B.TR.tower(m, x + 5);
      x = B.room(m, x + 1, 4, 'spikes', 'D');
      m.put(x + 4, 10, 'w');
      x = B.TR.mover(m, x + 2);
      x = B.room(m, x + 1, 5, 'bridge', 'E');
      m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
      return m;
    },
  });
  // ======================================================================= 4. Stacks & Queues
  levels.push({
    id: 'dsa_stack', name: 'The Stack Works', topic: 'Stacks & Queues',
    blurb: 'Last in, first out and first in, first out: undo, brackets, a postfix calculator and taking turns.',
    theme: 'forge',
    intro: `<p>The Stack Works is a factory of conveyor belts and tall piles of crates. Two rules run the whole place.</p>
      <p>On the <b>piles</b>, you can only add or take a crate at the top. The last crate in is the first one out. That's a <b>stack</b>.</p>
      <p>On the <b>belts</b>, crates join at the back and leave at the front. First in, first out. That's a <b>queue</b>.</p>
      <p>Lin's sensors are beeping. "Something is piling up at the far end of the factory. A stack so tall it's about to fall over. Let's hurry."</p>`,
    tutorial: [
      { title: 'Last in, first out',
        body: {
          python: `<p>A <b>stack</b> only lets you touch the top. Push adds on top, pop takes the top off, peek just looks. All three are <b>O(1)</b>.</p><p>In Python a plain list is a perfect stack: ${code('append')} pushes, ${code('pop()')} pops, and ${code('[-1]')} peeks.</p>`,
          javascript: `<p>A <b>stack</b> only lets you touch the top. Push adds on top, pop takes the top off, peek just looks. All three are <b>O(1)</b>.</p><p>In JavaScript an array is a perfect stack: ${code('push')}, ${code('pop()')}, and ${code('stack[stack.length - 1]')} to peek.</p>`,
          cpp: `<p>A <b>stack</b> only lets you touch the top. Push adds on top, pop takes the top off, peek just looks. All three are <b>O(1)</b>.</p><p>C++ has ${code('stack<T>')} in ${code('<stack>')}: ${code('push')}, ${code('top()')} to peek and ${code('pop()')} to remove. Note that ${code('pop()')} gives nothing back, so read ${code('top()')} first.</p>`,
          csharp: `<p>A <b>stack</b> only lets you touch the top. Push adds on top, pop takes the top off, peek just looks. All three are <b>O(1)</b>.</p><p>C# has ${code('Stack<T>')}: ${code('Push')}, ${code('Pop()')} (which also gives you the item) and ${code('Peek()')}. ${code('Count')} says how many are on it.</p>`,
          java: `<p>A <b>stack</b> only lets you touch the top. Push adds on top, pop takes the top off, peek just looks. All three are <b>O(1)</b>.</p><p>In Java the usual stack is ${code('Deque<T> stack = new ArrayDeque<>()')}: ${code('push')}, ${code('pop()')} and ${code('peek()')}. (There is an old ${code('Stack')} class too, but ${code('ArrayDeque')} is the one to use.)</p>`,
        },
        code: prog({
          python: [``, `plates = []\nplates.append("red")\nplates.append("green")\nplates.append("blue")\nprint("top:", plates[-1])\nprint("took off:", plates.pop())\nprint("now the top is", plates[-1])\nprint(len(plates), "plates left")`],
          javascript: [``, `const plates = [];\nplates.push("red");\nplates.push("green");\nplates.push("blue");\nconsole.log("top:", plates[plates.length - 1]);\nconsole.log("took off:", plates.pop());\nconsole.log("now the top is", plates[plates.length - 1]);\nconsole.log(plates.length, "plates left");`],
          cpp: [``, `stack<string> plates;\nplates.push("red");\nplates.push("green");\nplates.push("blue");\ncout << "top: " << plates.top() << endl;\ncout << "took off: " << plates.top() << endl;\nplates.pop();\ncout << "now the top is " << plates.top() << endl;\ncout << plates.size() << " plates left" << endl;`],
          csharp: [``, `var plates = new Stack<string>();\nplates.Push("red");\nplates.Push("green");\nplates.Push("blue");\nConsole.WriteLine("top: " + plates.Peek());\nConsole.WriteLine("took off: " + plates.Pop());\nConsole.WriteLine("now the top is " + plates.Peek());\nConsole.WriteLine(plates.Count + " plates left");`],
          java: [``, `Deque<String> plates = new ArrayDeque<>();\nplates.push("red");\nplates.push("green");\nplates.push("blue");\nSystem.out.println("top: " + plates.peek());\nSystem.out.println("took off: " + plates.pop());\nSystem.out.println("now the top is " + plates.peek());\nSystem.out.println(plates.size() + " plates left");`],
        }) },
      { title: 'The undo button',
        body: `<p>Stacks are everywhere once you look. The <b>undo</b> button is one: every change pushes the old version, and undo pops the most recent one back. The browser's back button, and the way a program keeps track of which function called which, work the same way.</p>
          <p>Here each letter we type first saves the old text on a stack.</p>`,
        code: prog({
          python: [``, `text = ""\nhistory = []\nfor letter in "cat":\n    history.append(text)   # remember the old text\n    text += letter\n    print("typed:", text)\nfor i in range(2):\n    text = history.pop()   # go back one step\n    print("undo:", text)`],
          javascript: [``, `let text = "";\nconst history = [];\nfor (const letter of "cat") {\n  history.push(text);   // remember the old text\n  text += letter;\n  console.log("typed:", text);\n}\nfor (let i = 0; i < 2; i++) {\n  text = history.pop();   // go back one step\n  console.log("undo:", text);\n}`],
          cpp: [``, `string text = "";\nstack<string> history;\nstring word = "cat";\nfor (char letter : word) {\n    history.push(text);   // remember the old text\n    text += letter;\n    cout << "typed: " << text << endl;\n}\nfor (int i = 0; i < 2; i++) {\n    text = history.top();   // go back one step\n    history.pop();\n    cout << "undo: " << text << endl;\n}`],
          csharp: [``, `string text = "";\nvar history = new Stack<string>();\nforeach (char letter in "cat")\n{\n    history.Push(text);   // remember the old text\n    text += letter;\n    Console.WriteLine("typed: " + text);\n}\nfor (int i = 0; i < 2; i++)\n{\n    text = history.Pop();   // go back one step\n    Console.WriteLine("undo: " + text);\n}`],
          java: [``, `String text = "";\nDeque<String> history = new ArrayDeque<>();\nfor (char letter : "cat".toCharArray()) {\n    history.push(text);   // remember the old text\n    text += letter;\n    System.out.println("typed: " + text);\n}\nfor (int i = 0; i < 2; i++) {\n    text = history.pop();   // go back one step\n    System.out.println("undo: " + text);\n}`],
        }) },
      { title: 'First in, first out',
        body: {
          python: `<p>A <b>queue</b> is a line at a shop: join at the back, leave from the front. The first one in is the first one served.</p><p>Here a list is the queue: ${code('append')} joins at the back and ${code('pop(0)')} leaves from the front. (${code('pop(0)')} has to shift every other item along, so it is O(n). Real Python programs use ${code('collections.deque')} for big queues, but imports are switched off in this world, and lists are fine at this size.)</p>`,
          javascript: `<p>A <b>queue</b> is a line at a shop: join at the back, leave from the front. The first one in is the first one served.</p><p>Here an array is the queue: ${code('push')} joins at the back and ${code('shift()')} leaves from the front. (${code('shift()')} moves every other item along, so it is O(n), but for small queues it's fine.)</p>`,
          cpp: `<p>A <b>queue</b> is a line at a shop: join at the back, leave from the front. The first one in is the first one served.</p><p>C++ has ${code('queue<T>')} in ${code('<queue>')}: ${code('push')} joins at the back, ${code('front()')} looks at the front, and ${code('pop()')} removes it. All O(1).</p>`,
          csharp: `<p>A <b>queue</b> is a line at a shop: join at the back, leave from the front. The first one in is the first one served.</p><p>C# has ${code('Queue<T>')}: ${code('Enqueue')} joins at the back, ${code('Dequeue()')} removes (and gives you) the front, ${code('Peek()')} just looks. All O(1).</p>`,
          java: `<p>A <b>queue</b> is a line at a shop: join at the back, leave from the front. The first one in is the first one served.</p><p>In Java, ${code('Queue<T> q = new ArrayDeque<>()')}: ${code('add')} joins at the back, ${code('poll()')} removes (and gives you) the front, ${code('peek()')} just looks. All O(1).</p>`,
        },
        code: prog({
          python: [``, `line = []\nline.append("Ada")\nline.append("Bo")\nline.append("Cy")\nprint("serving", line.pop(0))\nline.append("Dee")   # joins at the back\nwhile len(line) > 0:\n    print("serving", line.pop(0))`],
          javascript: [``, `const line = [];\nline.push("Ada");\nline.push("Bo");\nline.push("Cy");\nconsole.log("serving", line.shift());\nline.push("Dee");   // joins at the back\nwhile (line.length > 0) {\n  console.log("serving", line.shift());\n}`],
          cpp: [``, `queue<string> line;\nline.push("Ada");\nline.push("Bo");\nline.push("Cy");\ncout << "serving " << line.front() << endl;\nline.pop();\nline.push("Dee");   // joins at the back\nwhile (!line.empty()) {\n    cout << "serving " << line.front() << endl;\n    line.pop();\n}`],
          csharp: [``, `var line = new Queue<string>();\nline.Enqueue("Ada");\nline.Enqueue("Bo");\nline.Enqueue("Cy");\nConsole.WriteLine("serving " + line.Dequeue());\nline.Enqueue("Dee");   // joins at the back\nwhile (line.Count > 0)\n{\n    Console.WriteLine("serving " + line.Dequeue());\n}`],
          java: [``, `Queue<String> line = new ArrayDeque<>();\nline.add("Ada");\nline.add("Bo");\nline.add("Cy");\nSystem.out.println("serving " + line.poll());\nline.add("Dee");   // joins at the back\nwhile (!line.isEmpty()) {\n    System.out.println("serving " + line.poll());\n}`],
        }) },
      { title: 'Taking turns',
        body: `<p>Queues are how computers share things fairly: print jobs, players' turns, or a processor switching between programs. Take whoever is at the front, let them do one thing, and send them to the <b>back</b> of the line.</p>
          <table class="cheat"><tr><td><b>Stack</b></td><td>last in, first out: undo, brackets, going back</td></tr><tr><td><b>Queue</b></td><td>first in, first out: waiting lines, taking turns</td></tr></table>`,
        code: prog({
          python: [``, `queue = ["Ada", "Bo", "Cy"]\nfor turn in range(5):\n    player = queue.pop(0)\n    print("turn", turn + 1, "goes to", player)\n    queue.append(player)   # back of the line`],
          javascript: [``, `const queue = ["Ada", "Bo", "Cy"];\nfor (let turn = 0; turn < 5; turn++) {\n  const player = queue.shift();\n  console.log("turn", turn + 1, "goes to", player);\n  queue.push(player);   // back of the line\n}`],
          cpp: [``, `queue<string> q;\nq.push("Ada");\nq.push("Bo");\nq.push("Cy");\nfor (int turn = 0; turn < 5; turn++) {\n    string player = q.front();\n    q.pop();\n    cout << "turn " << turn + 1 << " goes to " << player << endl;\n    q.push(player);   // back of the line\n}`],
          csharp: [``, `var queue = new Queue<string>(new string[] { "Ada", "Bo", "Cy" });\nfor (int turn = 0; turn < 5; turn++)\n{\n    string player = queue.Dequeue();\n    Console.WriteLine("turn " + (turn + 1) + " goes to " + player);\n    queue.Enqueue(player);   // back of the line\n}`],
          java: [``, `Queue<String> queue = new ArrayDeque<>();\nqueue.add("Ada");\nqueue.add("Bo");\nqueue.add("Cy");\nfor (int turn = 0; turn < 5; turn++) {\n    String player = queue.poll();\n    System.out.println("turn " + (turn + 1) + " goes to " + player);\n    queue.add(player);   // back of the line\n}`],
        }) },
    ],
    signs: ['Lin: "Stack: push on top, pop off the top. Last in, first out."', 'Lin: "Queue: join at the back, leave from the front. First in, first out."', 'Lin: "That rumbling... the stack at the end of the factory is about to overflow!"'],
    terminals: ['dsa_stack1', 'dsa_stack2', 'dsa_stack3', 'dsa_stack4', 'dsa_stack5'],
    map: (B) => {
      const m = B.MapBuilder(150, 17);
      m.fill(0, 15, 149, 16, '#');
      m.put(2, 14, 'P'); m.put(5, 14, '?');
      let x = B.room(m, 7, 1, 'bridge', 'A');
      x = B.TR.hills(m, x);
      x = B.room(m, x, 2, 'spring', 'B');
      m.put(x + 4, 14, 'e');
      x = B.TR.mover(m, x + 8);
      x = B.room(m, x + 1, 3, 'spikes', 'C');
      m.put(x + 1, 14, 'K'); m.put(x + 3, 14, '?');
      x = B.TR.pit(m, x + 5);
      x = B.room(m, x + 1, 4, 'climb', 'D');
      x = B.TR.hills(m, x + 6);
      m.put(x + 1, 10, 'w');
      x = B.TR.tower(m, x + 1);
      x = B.room(m, x + 1, 5, 'lava', 'E');
      m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
      return m;
    },
  });
  GD.addCourseLevels('dsa', { challenges: ch, levels });
})(typeof window !== 'undefined' ? window : globalThis);
