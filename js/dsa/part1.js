/* CodeQuest — Data Structures & Algorithms, part 1 (levels 1–4):
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
    success: 'Two billion, halved 30 times, is down to 1. <b>That is the power of O(log n).</b>',
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
    desc: (ctx, sig, ex) => `<p>A new book arrives. Write ${sig} that returns the index where ${c('target')} should be <b>inserted</b> so the list stays sorted. If equal numbers are already there, it goes <b>before</b> them. In other words: the index of the first item that is ${c('>= target')}, or the length of the list if there is none.</p>${ex}
      <p>This time ${c('high')} starts at the <b>length</b> (the gap after the last item is allowed), and the loop runs while ${c('low < high')}. The answer is where ${c('low')} and ${c('high')} meet.</p>`,
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
    desc: (ctx, sig, ex) => `<p>The vault code is the square root of a huge number, rounded down. Write ${sig} that returns the biggest whole number ${c('r')} with ${c('r * r <= n')}. No built-in square root!</p>${ex}
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
    require: [WHILE, [/^(?![\s\S]*(sqrt|Sqrt|\*\*\s*0?\.5|\bpow\s*\(|\bPow\s*\())/, 'Find it with binary search, without a built-in square root or power.']],
    gate: 'E',
    success: 'Click. 44721 squared is just under two billion. <b>About 31 guesses for a two-billion-wide range.</b>',
  });
//@@CHALLENGES@@
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
      const m = B.MapBuilder(140, 17);
      m.fill(0, 15, 139, 16, '#');
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
//@@LEVELS@@
  GD.addCourseLevels('dsa', { challenges: ch, levels });
})(typeof window !== 'undefined' ? window : globalThis);
