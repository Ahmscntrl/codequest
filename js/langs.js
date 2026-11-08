/* CodeQuest — the languages you can play in, and the naming/printing rules for each. */
(function (root) {
  'use strict';
  const snake = (n) => n;
  const camel = (n) => n.replace(/_([a-z])/g, (m, c) => c.toUpperCase());
  const pascal = (n) => { const c = camel(n); return c[0].toUpperCase() + c.slice(1); };

  const LANGS = {
    python: {
      id: 'python', label: 'Python', badge: 'Py', blurb: 'Clean and readable. A great first language.', hello: 'print("Hello")',
      fnCase: snake, varCase: snake, comment: '#', True: 'True', False: 'False', none: 'None',
      print: (x) => `print(${x})`, printName: 'print', loop: /\b(for|while)\b/, family: 'python',
      append: 'append', listAdd: (l, x) => `${l}.append(${x})`, self: 'self',
    },
    javascript: {
      id: 'javascript', label: 'JavaScript', badge: 'JS', blurb: 'The language of the web.', hello: 'console.log("Hello")',
      fnCase: camel, varCase: camel, comment: '//', True: 'true', False: 'false', none: 'undefined',
      print: (x) => `console.log(${x});`, printName: 'console.log', loop: /\b(for|while)\s*\(|\.forEach\s*\(|\.map\s*\(/, family: 'js',
      append: 'push', listAdd: (l, x) => `${l}.push(${x});`, self: 'this',
    },
    cpp: {
      id: 'cpp', label: 'C++', badge: 'C++', blurb: 'Fast and powerful. Used for games and engines.', hello: 'cout << "Hello";',
      fnCase: snake, varCase: snake, comment: '//', True: 'true', False: 'false', none: 'nothing',
      print: (x) => `cout << ${x} << endl;`, printName: 'cout', loop: /\b(for|while)\s*\(/, family: 'c',
      append: 'push_back', listAdd: (l, x) => `${l}.push_back(${x});`, self: 'this',
      testNames: { double: 'double_it' },
    },
    csharp: {
      id: 'csharp', label: 'C#', badge: 'C#', blurb: 'Clean and modern. Used for apps and Unity games.', hello: 'Console.WriteLine("Hello");',
      fnCase: pascal, varCase: camel, comment: '//', True: 'True', False: 'False', none: 'nothing',
      print: (x) => `Console.WriteLine(${x});`, printName: 'Console.WriteLine', loop: /\b(for|while|foreach)\s*\(/, family: 'c',
      append: 'Add', listAdd: (l, x) => `${l}.Add(${x});`, self: 'this',
      testNames: { double: 'DoubleIt' },
    },
    java: {
      id: 'java', label: 'Java', badge: 'Java', blurb: 'Everywhere: Android, servers and big apps.', hello: 'System.out.println("Hello");',
      fnCase: camel, varCase: camel, comment: '//', True: 'true', False: 'false', none: 'nothing',
      print: (x) => `System.out.println(${x});`, printName: 'System.out.println', loop: /\b(for|while)\s*\(/, family: 'c',
      append: 'add', listAdd: (l, x) => `${l}.add(${x});`, self: 'this',
      testNames: { double: 'doubleIt' },
    },
  };
  const ORDER = ['python', 'javascript', 'cpp', 'csharp', 'java'];

  const Lang = {
    LANGS, ORDER, camel, pascal,
    get: (id) => LANGS[id] || LANGS.python,
    // names of game functions (build_bridge -> buildBridge / BuildBridge ...)
    fnName: (n, lang) => Lang.get(lang).fnCase(n),
    // names of game-provided variables (my_name -> myName ...)
    varName: (n, lang) => Lang.get(lang).varCase(n),
    // names of the functions a terminal asks you to write (double -> doubleIt in Java, DoubleIt in C# ...)
    testName: (n, lang) => { const L = Lang.get(lang); return (L.testNames && L.testNames[n]) || L.fnCase(n); },
    stripComments(code, lang) {
      return Lang.get(lang).comment === '#' ? code.replace(/#.*$/gm, '') : code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    },
    hasLoop: (code, lang) => Lang.get(lang).loop.test(Lang.stripComments(code, lang)),
    // does the code print this variable (not the word in quotes)?
    printsVar(code, name, lang) {
      const src = Lang.stripComments(code, lang);
      if (lang === 'cpp') return new RegExp('<<\\s*' + name + '\\b').test(src);
      return new RegExp('\\(\\s*' + name + '\\s*\\)').test(src) || (lang === 'csharp' && new RegExp('\\{\\s*' + name + '\\s*\\}').test(src));
    },
    // how true/false look when printed
    boolOut(v, lang) {
      if (lang === 'python' || lang === 'csharp') return v ? 'True' : 'False';
      if (lang === 'cpp') return v ? '1' : '0';
      return v ? 'true' : 'false';
    },
    boolOutOk(text, v, lang) {
      if (!text) return false;
      const t = text.trim();
      if (lang === 'cpp') return t === (v ? '1' : '0') || t === (v ? 'true' : 'false');
      return t.toLowerCase() === String(v);
    },
  };
  root.Lang = Lang;
  if (typeof module !== 'undefined' && module.exports) module.exports = Lang;
})(typeof window !== 'undefined' ? window : globalThis);
