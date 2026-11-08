/* CodeQuest — Data Structures & Algorithms, part 2 (levels 5–8):
 * Recursion, Sorting, Linked Lists & Trees, Graphs. Every terminal, tutorial page, hint and
 * example exists in all five languages. See docs/DSA.md for the format.
 */
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { c, escapeHTML } = GD.helpers;
  const H = GD.helpers;
  const tn = (n, ctx) => Lang.testName(n, ctx.lang);
  const LANGS = ['python', 'javascript', 'cpp', 'csharp', 'java'];
  const byLang = (f) => Object.fromEntries(LANGS.map(l => [l, f(l)]));
  const code = (s) => `<code>${escapeHTML(s)}</code>`;
  const pre = (s) => `<pre>${escapeHTML(s)}</pre>`;

  // ------------------------------------------------------------ whole programs in each language
  const trim = (s) => String(s || '').replace(/^\n+|\s+$/g, '');
  const ind = (s, n) => s.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n');
  function cppIncludes(src) {
    const inc = ['iostream'];
    if (/\bstring\b|to_string/.test(src)) inc.push('string');
    if (/\bvector\s*</.test(src)) inc.push('vector');
    if (/\bmap\s*</.test(src)) inc.push('map');
    if (/\bqueue\s*</.test(src)) inc.push('queue');
    if (/\b(max|min|swap)\s*\(/.test(src)) inc.push('algorithm');
    return inc.map(h => `#include <${h}>`).join('\n');
  }
  // C++: functions and classes above main, then the body of main
  const cpp = (above, body) => {
    const top = trim(above) ? trim(above) + '\n\n' : '';
    return `${cppIncludes(top + body)}\nusing namespace std;\n\n${top}int main() {\n${ind(trim(body), 4)}\n    return 0;\n}\n`;
  };
  // Java: static methods of Main, the body of main, and classes that go above Main
  const java = (methods, body, classes) => {
    const all = (methods || '') + body + (classes || '');
    const imp = /\b(ArrayList|List|HashMap|Queue|LinkedList)\b/.test(all) ? 'import java.util.*;\n\n' : '';
    const cls = trim(classes) ? trim(classes) + '\n\n' : '';
    return `${imp}${cls}public class Main {\n${trim(methods) ? ind(trim(methods), 4) + '\n\n' : ''}    public static void main(String[] args) {\n${ind(trim(body), 8)}\n    }\n}\n`;
  };
  // C#: top-level statements (local functions first), classes at the end
  const cs = (top, classes) => trim(top) + '\n' + (trim(classes) ? '\n' + trim(classes) + '\n' : '');
  const py = (s) => trim(s) + '\n';
  const js = py;
  // programs({ python, javascript, cpp: [above, main], csharp: [top, classes], java: [methods, main, classes] })
  const programs = (o) => ({
    python: py(o.python), javascript: js(o.javascript),
    cpp: cpp(o.cpp[0], o.cpp[1]), csharp: cs(o.csharp[0], o.csharp[1]), java: java(o.java[0], o.java[1], o.java[2]),
  });
  const sims = (task, o) => { const p = programs(o); return byLang(l => ({ task, code: p[l] })); };

  // ------------------------------------------------------------ checking helpers
  // comments removed (strings kept, so "#" in a grid row is not a comment)
  function strip(src, lang) {
    let out = '', i = 0, q = null;
    while (i < src.length) {
      const ch = src[i];
      if (q) { out += ch; if (ch === '\\') { out += src[i + 1] || ''; i += 2; continue; } if (ch === q) q = null; i++; continue; }
      if (ch === '"' || ch === "'" || (ch === '`' && lang === 'javascript')) { q = ch; out += ch; i++; continue; }
      if (lang === 'python' ? ch === '#' : (ch === '/' && src[i + 1] === '/')) { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (lang !== 'python' && ch === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
      out += ch; i++;
    }
    return out;
  }
  // the body of the function called name (null if there is no such definition)
  function bodyOf(src, name, lang) {
    if (lang === 'python') {
      const lines = src.split('\n');
      const i = lines.findIndex(l => new RegExp('^\\s*def\\s+' + name + '\\s*\\(').test(l));
      if (i < 0) return null;
      const indent = lines[i].match(/^\s*/)[0].length, out = [lines[i].replace(/^[^:]*\)\s*:/, '')];
      for (let j = i + 1; j < lines.length; j++) { const l = lines[j]; if (l.trim() && l.match(/^\s*/)[0].length <= indent) break; out.push(l); }
      return out.join('\n');
    }
    const m = new RegExp('\\b' + name + '\\s*\\([^;{}()]*\\)\\s*\\{').exec(src);
    if (!m) return null;
    let i = m.index + m[0].length, depth = 1;
    const start = i;
    while (i < src.length && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
    return src.slice(start, i - 1);
  }
  // rules: (src, ctx) -> an error message, or null when the code is fine
  const recursive = (name) => (src, ctx) => {
    const f = tn(name, ctx), body = bodyOf(src, f, ctx.lang);
    if (body === null || new RegExp('\\b' + f + '\\s*\\(').test(body)) return null;
    return `Your answers are right, but ${code(f)} never <b>calls itself</b>. This level is about recursion: solve the problem using a call to ${code(f)} on a smaller input, with no loop doing the work.`;
  };
  const SORT_CALL = /(?:^|[^\w.])(?:sorted|sort)\s*\(|\.(?:sort|Sort|OrderBy|OrderByDescending)\s*\(|Collections\s*\.\s*sort/;
  const noSort = (src) => SORT_CALL.test(src) ? 'Nice try! The built-in sort is off limits here. Move the numbers around yourself.' : null;
  const noPow = (src) => /\*\*|\bpow\s*\(|\bPow\s*\(/.test(src) ? 'No built-in power here (no <code>**</code> or <code>pow</code>). Build it out of multiplication and a recursive call.' : null;
  const bodyHas = (name, res, msg) => (src, ctx) => {
    const body = bodyOf(src, tn(name, ctx), ctx.lang);
    return body !== null && !res[ctx.lang].test(body) ? msg(ctx) : null;
  };
  const bodyLacks = (name, re, msg) => (src, ctx) => {
    const body = bodyOf(src, tn(name, ctx), ctx.lang);
    return body !== null && re.test(body) ? msg(ctx) : null;
  };
  // a function terminal: cases are [args, expected return value]
  function fnTerm(name, cases, rules, success) {
    return {
      callTests: cases.map(([args]) => ({ fn: name, args })),
      check(runs, ctx, src) {
        const r = H.checkCalls(runs[0], this.callTests, cases.map(k => k[1]), ctx, name);
        if (!r.ok) return r;
        const s = strip(src || '', ctx.lang);
        for (const rule of rules || []) { const msg = rule(s, ctx); if (msg) return { ok: false, msg }; }
        return { ok: true, msg: success || r.msg };
      },
    };
  }
  // a printing terminal: the program's output must be exactly these lines
  function outTerm(want, rules, success) {
    return {
      check(runs, ctx, src) {
        const got = H.lines(runs[0]);
        for (let i = 0; i < want.length; i++) if (got[i] !== want[i]) return { ok: false, msg: `Line ${i + 1} should be ${code(want[i])} but it was ${got[i] === undefined ? '<i>nothing</i>' : code(got[i])}.` };
        if (got.length > want.length) return { ok: false, msg: `Expected ${want.length} lines of output, but you printed ${got.length}. Keep the test lines at the bottom as they are.` };
        const s = strip(src || '', ctx.lang);
        for (const rule of rules || []) { const msg = rule(s, ctx); if (msg) return { ok: false, msg }; }
        return { ok: true, msg: success || 'It works. <b>The way is open.</b>' };
      },
    };
  }
  // the function's signature in typed languages, as a line for the description
  const sig = (ctx, s) => ctx.lang === 'python' || ctx.lang === 'javascript' ? '' : `<p>In ${Lang.get(ctx.lang).label}: ${code(s[ctx.lang])}</p>`;
  const NUL = { python: 'None', javascript: 'null', cpp: 'nullptr', csharp: 'null', java: 'null' };
  const DIV10 = { python: 'n // 10', javascript: 'Math.floor(n / 10)', cpp: 'n / 10', csharp: 'n / 10', java: 'n / 10' };

  // ================================================================ shared classes
  const NODE = {
    python: `class Node:
    def __init__(self, value):
        self.value = value
        self.next = None`,
    javascript: `class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}`,
    cpp: `class Node {
public:
    int value;
    Node* next;

    Node(int v) {
        value = v;
        next = nullptr;
    }
};`,
    csharp: `class Node
{
    public int Value;
    public Node Next;

    public Node(int value)
    {
        Value = value;
        Next = null;
    }
}`,
    java: `class Node {
    int value;
    Node next;

    Node(int value) {
        this.value = value;
        this.next = null;
    }
}`,
  };
  const TREE = {
    python: `class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None`,
    javascript: `class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}`,
    cpp: `class TreeNode {
public:
    int value;
    TreeNode* left;
    TreeNode* right;

    TreeNode(int v) {
        value = v;
        left = nullptr;
        right = nullptr;
    }
};`,
    csharp: `class TreeNode
{
    public int Value;
    public TreeNode Left;
    public TreeNode Right;

    public TreeNode(int value)
    {
        Value = value;
        Left = null;
        Right = null;
    }
}`,
    java: `class TreeNode {
    int value;
    TreeNode left;
    TreeNode right;

    TreeNode(int value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}`,
  };
  // show(head): "3 -> 8 -> 5", or "(empty)"
  const SHOW = {
    python: `def show(head):
    if head is None:
        return "(empty)"
    text = str(head.value)
    cur = head.next
    while cur is not None:
        text += " -> " + str(cur.value)
        cur = cur.next
    return text`,
    javascript: `function show(head) {
  if (head === null) {
    return "(empty)";
  }
  let text = String(head.value);
  for (let cur = head.next; cur !== null; cur = cur.next) {
    text += " -> " + cur.value;
  }
  return text;
}`,
    cpp: `string show(Node* head) {
    if (head == nullptr) {
        return "(empty)";
    }
    string text = to_string(head->value);
    for (Node* cur = head->next; cur != nullptr; cur = cur->next) {
        text += " -> " + to_string(cur->value);
    }
    return text;
}`,
    csharp: `string Show(Node head)
{
    if (head == null)
    {
        return "(empty)";
    }
    string text = head.Value.ToString();
    for (Node cur = head.Next; cur != null; cur = cur.Next)
    {
        text += " -> " + cur.Value;
    }
    return text;
}`,
    java: `static String show(Node head) {
    if (head == null) {
        return "(empty)";
    }
    String text = String.valueOf(head.value);
    for (Node cur = head.next; cur != null; cur = cur.next) {
        text += " -> " + cur.value;
    }
    return text;
}`,
  };
  // a finished append(head, value), given in later starters
  const APPEND = {
    python: `def append(head, value):
    new_node = Node(value)
    if head is None:
        return new_node
    cur = head
    while cur.next is not None:
        cur = cur.next
    cur.next = new_node
    return head`,
    javascript: `function append(head, value) {
  const newNode = new Node(value);
  if (head === null) {
    return newNode;
  }
  let cur = head;
  while (cur.next !== null) {
    cur = cur.next;
  }
  cur.next = newNode;
  return head;
}`,
    cpp: `Node* append(Node* head, int value) {
    Node* newNode = new Node(value);
    if (head == nullptr) {
        return newNode;
    }
    Node* cur = head;
    while (cur->next != nullptr) {
        cur = cur->next;
    }
    cur->next = newNode;
    return head;
}`,
    csharp: `Node Append(Node head, int value)
{
    Node newNode = new Node(value);
    if (head == null)
    {
        return newNode;
    }
    Node cur = head;
    while (cur.Next != null)
    {
        cur = cur.Next;
    }
    cur.Next = newNode;
    return head;
}`,
    java: `static Node append(Node head, int value) {
    Node newNode = new Node(value);
    if (head == null) {
        return newNode;
    }
    Node cur = head;
    while (cur.next != null) {
        cur = cur.next;
    }
    cur.next = newNode;
    return head;
}`,
  };
  // a finished BST insert, given in the last tree starter
  const INSERT = {
    python: `def insert(root, value):
    if root is None:
        return TreeNode(value)
    if value < root.value:
        root.left = insert(root.left, value)
    else:
        root.right = insert(root.right, value)
    return root`,
    javascript: `function insert(root, value) {
  if (root === null) {
    return new TreeNode(value);
  }
  if (value < root.value) {
    root.left = insert(root.left, value);
  } else {
    root.right = insert(root.right, value);
  }
  return root;
}`,
    cpp: `TreeNode* insert(TreeNode* root, int value) {
    if (root == nullptr) {
        return new TreeNode(value);
    }
    if (value < root->value) {
        root->left = insert(root->left, value);
    } else {
        root->right = insert(root->right, value);
    }
    return root;
}`,
    csharp: `TreeNode Insert(TreeNode root, int value)
{
    if (root == null)
    {
        return new TreeNode(value);
    }
    if (value < root.Value)
    {
        root.Left = Insert(root.Left, value);
    }
    else
    {
        root.Right = Insert(root.Right, value);
    }
    return root;
}`,
    java: `static TreeNode insert(TreeNode root, int value) {
    if (root == null) {
        return new TreeNode(value);
    }
    if (value < root.value) {
        root.left = insert(root.left, value);
    } else {
        root.right = insert(root.right, value);
    }
    return root;
}`,
  };
  // a finished merge(a, b), given in the merge sort starter
  const MERGE = {
    python: `def merge(a, b):
    result = []
    i = 0
    j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    while i < len(a):
        result.append(a[i])
        i += 1
    while j < len(b):
        result.append(b[j])
        j += 1
    return result`,
    javascript: `function merge(a, b) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      result.push(a[i]);
      i++;
    } else {
      result.push(b[j]);
      j++;
    }
  }
  while (i < a.length) {
    result.push(a[i]);
    i++;
  }
  while (j < b.length) {
    result.push(b[j]);
    j++;
  }
  return result;
}`,
    cpp: `vector<int> merge(vector<int> a, vector<int> b) {
    vector<int> result;
    int i = 0;
    int j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) {
            result.push_back(a[i]);
            i++;
        } else {
            result.push_back(b[j]);
            j++;
        }
    }
    while (i < a.size()) {
        result.push_back(a[i]);
        i++;
    }
    while (j < b.size()) {
        result.push_back(b[j]);
        j++;
    }
    return result;
}`,
    csharp: `List<int> Merge(List<int> a, List<int> b)
{
    List<int> result = new List<int>();
    int i = 0;
    int j = 0;
    while (i < a.Count && j < b.Count)
    {
        if (a[i] <= b[j])
        {
            result.Add(a[i]);
            i++;
        }
        else
        {
            result.Add(b[j]);
            j++;
        }
    }
    while (i < a.Count)
    {
        result.Add(a[i]);
        i++;
    }
    while (j < b.Count)
    {
        result.Add(b[j]);
        j++;
    }
    return result;
}`,
    java: `static ArrayList<Integer> merge(ArrayList<Integer> a, ArrayList<Integer> b) {
    ArrayList<Integer> result = new ArrayList<>();
    int i = 0;
    int j = 0;
    while (i < a.size() && j < b.size()) {
        if (a.get(i) <= b.get(j)) {
            result.add(a.get(i));
            i++;
        } else {
            result.add(b.get(j));
            j++;
        }
    }
    while (i < a.size()) {
        result.add(a.get(i));
        i++;
    }
    while (j < b.size()) {
        result.add(b.get(j));
        j++;
    }
    return result;
}`,
  };
  // the graph used in the graph examples
  const GRAPH = {
    python: `graph = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D", "E"],
    "D": ["B", "C", "F"],
    "E": ["C"],
    "F": ["D"],
}`,
    javascript: `const graph = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "D", "E"],
  D: ["B", "C", "F"],
  E: ["C"],
  F: ["D"],
};`,
    cpp: `map<string, vector<string>> graph = {
    {"A", {"B", "C"}},
    {"B", {"A", "D"}},
    {"C", {"A", "D", "E"}},
    {"D", {"B", "C", "F"}},
    {"E", {"C"}},
    {"F", {"D"}},
};`,
    csharp: `var graph = new Dictionary<string, List<string>>
{
    { "A", new List<string> { "B", "C" } },
    { "B", new List<string> { "A", "D" } },
    { "C", new List<string> { "A", "D", "E" } },
    { "D", new List<string> { "B", "C", "F" } },
    { "E", new List<string> { "C" } },
    { "F", new List<string> { "D" } },
};`,
    java: `HashMap<String, ArrayList<String>> graph = new HashMap<>();
graph.put("A", new ArrayList<>(List.of("B", "C")));
graph.put("B", new ArrayList<>(List.of("A", "D")));
graph.put("C", new ArrayList<>(List.of("A", "D", "E")));
graph.put("D", new ArrayList<>(List.of("B", "C", "F")));
graph.put("E", new ArrayList<>(List.of("C")));
graph.put("F", new ArrayList<>(List.of("D")));`,
  };
  // the graph used in the graph terminals' tests
  const G1 = { A: ['B', 'C'], B: ['A', 'D'], C: ['A', 'D'], D: ['B', 'C', 'E'], E: ['D'], F: ['G'], G: ['F'], H: [] };
  const TRI = { A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'] };
  // a small graph for the terminals' own test lines
  const SMALL = {
    python: `graph = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A"],
    "D": ["B"],
    "E": [],
}`,
    javascript: `const graph = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A"],
  D: ["B"],
  E: [],
};`,
    cpp: `map<string, vector<string>> graph = {
    {"A", {"B", "C"}},
    {"B", {"A", "D"}},
    {"C", {"A"}},
    {"D", {"B"}},
    {"E", {}},
};`,
    csharp: `var graph = new Dictionary<string, List<string>>
{
    { "A", new List<string> { "B", "C" } },
    { "B", new List<string> { "A", "D" } },
    { "C", new List<string> { "A" } },
    { "D", new List<string> { "B" } },
    { "E", new List<string>() },
};`,
    java: `HashMap<String, ArrayList<String>> graph = new HashMap<>();
graph.put("A", new ArrayList<>(List.of("B", "C")));
graph.put("B", new ArrayList<>(List.of("A", "D")));
graph.put("C", new ArrayList<>(List.of("A")));
graph.put("D", new ArrayList<>(List.of("B")));
graph.put("E", new ArrayList<>());`,
  };

  // ================================================================ challenges
  const challenges = {
    // ============================================================ 5. Recursion
    dsa_recur1: {
      title: 'The Factorial Echo',
      desc: (ctx) => `<p>The cave door has a lock that only opens for <b>factorials</b>. The factorial of n is n × (n − 1) × ... × 1, and the factorial of 0 is 1.</p>
        <pre>${tn('factorial', ctx)}(5) = 5 × 4 × 3 × 2 × 1 = 120</pre>
        <p>Write ${code(tn('factorial', ctx) + '(n)')} <b>recursively</b>. The base case (n is 0) is already there. For any other n, the answer is n times the factorial of n − 1.</p>
        ${sig(ctx, { cpp: 'int factorial(int n)', csharp: 'int Factorial(int n)', java: 'static int factorial(int n)' })}`,
      starter: programs({
        python: `def factorial(n):
    if n == 0:
        return 1
    # recursive case: n times the factorial of n - 1
    return 1

print(factorial(5))`,
        javascript: `function factorial(n) {
  if (n === 0) {
    return 1;
  }
  // recursive case: n times the factorial of n - 1
  return 1;
}

console.log(factorial(5));`,
        cpp: [`int factorial(int n) {
    if (n == 0) {
        return 1;
    }
    // recursive case: n times the factorial of n - 1
    return 1;
}`, `cout << factorial(5) << endl;`],
        csharp: [`int Factorial(int n)
{
    if (n == 0)
    {
        return 1;
    }
    // recursive case: n times the factorial of n - 1
    return 1;
}

Console.WriteLine(Factorial(5));`],
        java: [`static int factorial(int n) {
    if (n == 0) {
        return 1;
    }
    // recursive case: n times the factorial of n - 1
    return 1;
}`, `System.out.println(factorial(5));`],
      }),
      hints: ['The base case is done. For every other n, change the last return line.', 'factorial(5) is 5 times factorial(4). Write that with n instead of 5.'],
      similar: sims('Add up 1 + 2 + ... + n with a recursive function (the "triangle number" of n).', {
        python: `def triangle(n):
    if n == 0:
        return 0
    return n + triangle(n - 1)

print(triangle(4))`,
        javascript: `function triangle(n) {
  if (n === 0) {
    return 0;
  }
  return n + triangle(n - 1);
}

console.log(triangle(4));`,
        cpp: [`int triangle(int n) {
    if (n == 0) {
        return 0;
    }
    return n + triangle(n - 1);
}`, `cout << triangle(4) << endl;`],
        csharp: [`int Triangle(int n)
{
    if (n == 0)
    {
        return 0;
    }
    return n + Triangle(n - 1);
}

Console.WriteLine(Triangle(4));`],
        java: [`static int triangle(int n) {
    if (n == 0) {
        return 0;
    }
    return n + triangle(n - 1);
}`, `System.out.println(triangle(4));`],
      }),
      ...fnTerm('factorial', [[[0], 1], [[1], 1], [[5], 120], [[7], 5040], [[10], 3628800], [[12], 479001600]], [recursive('factorial')],
        'The lock counts down with you: 5, 4, 3, 2, 1... <b>click</b>. Your first recursive function!'),
      gate: 'A',
    },
    dsa_recur2: {
      title: 'The Digit Drill',
      desc: (ctx) => `<p>The drill needs the <b>sum of the digits</b> of a number. For 9045 that is 9 + 0 + 4 + 5 = 18.</p>
        <pre>${tn('sum_digits', ctx)}(9045)  →  18\n${tn('sum_digits', ctx)}(7)     →  7</pre>
        <p>Two tools: ${code('n % 10')} is the last digit, and ${code(DIV10[ctx.lang])} is the number without its last digit. A number below 10 is just one digit: that's your base case. Use recursion for the rest.</p>
        ${sig(ctx, { cpp: 'int sum_digits(int n)', csharp: 'int SumDigits(int n)', java: 'static int sumDigits(int n)' })}`,
      starter: programs({
        python: `def sum_digits(n):
    if n < 10:
        return n
    # recursive case: the last digit plus the digit sum of the rest
    return 0

print(sum_digits(9045))`,
        javascript: `function sumDigits(n) {
  if (n < 10) {
    return n;
  }
  // recursive case: the last digit plus the digit sum of the rest
  return 0;
}

console.log(sumDigits(9045));`,
        cpp: [`int sum_digits(int n) {
    if (n < 10) {
        return n;
    }
    // recursive case: the last digit plus the digit sum of the rest
    return 0;
}`, `cout << sum_digits(9045) << endl;`],
        csharp: [`int SumDigits(int n)
{
    if (n < 10)
    {
        return n;
    }
    // recursive case: the last digit plus the digit sum of the rest
    return 0;
}

Console.WriteLine(SumDigits(9045));`],
        java: [`static int sumDigits(int n) {
    if (n < 10) {
        return n;
    }
    // recursive case: the last digit plus the digit sum of the rest
    return 0;
}`, `System.out.println(sumDigits(9045));`],
      }),
      hints: byLang(l => [`For 9045 the last digit is 9045 % 10, which is 5. The rest of the number is ${DIV10[l].replace('n', '9045')}, which is 904.`, 'Return the last digit plus the digit sum of the rest of the number.']),
      similar: sims('Count how many digits a number has, recursively.', {
        python: `def count_digits(n):
    if n < 10:
        return 1
    return 1 + count_digits(n // 10)

print(count_digits(9045))`,
        javascript: `function countDigits(n) {
  if (n < 10) {
    return 1;
  }
  return 1 + countDigits(Math.floor(n / 10));
}

console.log(countDigits(9045));`,
        cpp: [`int count_digits(int n) {
    if (n < 10) {
        return 1;
    }
    return 1 + count_digits(n / 10);
}`, `cout << count_digits(9045) << endl;`],
        csharp: [`int CountDigits(int n)
{
    if (n < 10)
    {
        return 1;
    }
    return 1 + CountDigits(n / 10);
}

Console.WriteLine(CountDigits(9045));`],
        java: [`static int countDigits(int n) {
    if (n < 10) {
        return 1;
    }
    return 1 + countDigits(n / 10);
}`, `System.out.println(countDigits(9045));`],
      }),
      ...fnTerm('sum_digits', [[[0], 0], [[7], 7], [[123], 6], [[9045], 18], [[1000], 1], [[99999], 45]], [recursive('sum_digits')],
        'The drill spins through the digits one at a time and breaks through.'),
      gate: 'B',
    },
    dsa_recur3: {
      title: 'The Power Spiral',
      desc: (ctx) => `<p>The spiral staircase grows by powers. Write ${code(tn('power', ctx) + '(x, n)')} that returns x to the power n (x multiplied by itself n times), for n of 0 or more.</p>
        <pre>${tn('power', ctx)}(2, 10)  →  1024\n${tn('power', ctx)}(5, 3)   →  125\n${tn('power', ctx)}(7, 0)   →  1</pre>
        <p>No built-in power allowed. Use recursion: anything to the power 0 is 1, and x to the power n is x times (x to the power n − 1).</p>
        ${sig(ctx, { cpp: 'int power(int x, int n)', csharp: 'int Power(int x, int n)', java: 'static int power(int x, int n)' })}`,
      starter: programs({
        python: `def power(x, n):
    # base case: anything to the power 0 is 1
    # recursive case: x times power(x, n - 1)
    return 0

print(power(2, 10))`,
        javascript: `function power(x, n) {
  // base case: anything to the power 0 is 1
  // recursive case: x times power(x, n - 1)
  return 0;
}

console.log(power(2, 10));`,
        cpp: [`int power(int x, int n) {
    // base case: anything to the power 0 is 1
    // recursive case: x times power(x, n - 1)
    return 0;
}`, `cout << power(2, 10) << endl;`],
        csharp: [`int Power(int x, int n)
{
    // base case: anything to the power 0 is 1
    // recursive case: x times Power(x, n - 1)
    return 0;
}

Console.WriteLine(Power(2, 10));`],
        java: [`static int power(int x, int n) {
    // base case: anything to the power 0 is 1
    // recursive case: x times power(x, n - 1)
    return 0;
}`, `System.out.println(power(2, 10));`],
      }),
      hints: ['Start with the base case: if n is 0, return 1.', 'power(2, 3) is 2 times power(2, 2).'],
      similar: sims('Multiply two numbers using only addition and recursion: a times b is a plus (a times b - 1).', {
        python: `def multiply(a, b):
    if b == 0:
        return 0
    return a + multiply(a, b - 1)

print(multiply(6, 7))`,
        javascript: `function multiply(a, b) {
  if (b === 0) {
    return 0;
  }
  return a + multiply(a, b - 1);
}

console.log(multiply(6, 7));`,
        cpp: [`int multiply(int a, int b) {
    if (b == 0) {
        return 0;
    }
    return a + multiply(a, b - 1);
}`, `cout << multiply(6, 7) << endl;`],
        csharp: [`int Multiply(int a, int b)
{
    if (b == 0)
    {
        return 0;
    }
    return a + Multiply(a, b - 1);
}

Console.WriteLine(Multiply(6, 7));`],
        java: [`static int multiply(int a, int b) {
    if (b == 0) {
        return 0;
    }
    return a + multiply(a, b - 1);
}`, `System.out.println(multiply(6, 7));`],
      }),
      ...fnTerm('power', [[[2, 10], 1024], [[3, 0], 1], [[5, 3], 125], [[7, 1], 7], [[10, 6], 1000000], [[1, 50], 1]], [recursive('power'), noPow],
        'Each step of the spiral multiplies the last one. Up you go.'),
      gate: 'C',
    },
    dsa_recur4: {
      title: 'The Memo Stones',
      desc: (ctx) => `<p>The stones are carved with <b>Fibonacci numbers</b>: 0, 1, 1, 2, 3, 5, 8, 13, ... Each one is the sum of the two before it.</p>
        <pre>${tn('fib', ctx)}(0) → 0    ${tn('fib', ctx)}(1) → 1    ${tn('fib', ctx)}(10) → 55\n${tn('fib', ctx)}(75) → 2111485077978050</pre>
        <p>The plain recursive version, ${code(tn('fib', ctx) + '(n - 1) + ' + tn('fib', ctx) + '(n - 2)')}, works out the same answers again and again. For n = 75 it would run for days. Finish ${code(tn('fib', ctx) + '(n)')} using the ${code('memo')} map: check it before doing any work, and save every new answer in it.</p>
        ${sig(ctx, { cpp: 'long long fib(int n)', csharp: 'long Fib(int n)', java: 'static long fib(int n)' })}`,
      starter: programs({
        python: `memo = {}

def fib(n):
    if n <= 1:
        return n
    # 1. if n is already in memo, return the saved answer
    # 2. otherwise work it out from fib(n - 1) and fib(n - 2),
    #    save it in memo, then return it
    return 0

print(fib(10))`,
        javascript: `const memo = {};

function fib(n) {
  if (n <= 1) {
    return n;
  }
  // 1. if n is already in memo, return the saved answer
  // 2. otherwise work it out from fib(n - 1) and fib(n - 2),
  //    save it in memo, then return it
  return 0;
}

console.log(fib(10));`,
        cpp: [`map<int, long long> memo;

long long fib(int n) {
    if (n <= 1) {
        return n;
    }
    // 1. if n is already in memo, return the saved answer
    // 2. otherwise work it out from fib(n - 1) and fib(n - 2),
    //    save it in memo, then return it
    return 0;
}`, `cout << fib(10) << endl;`],
        csharp: [`Dictionary<int, long> memo = new Dictionary<int, long>();

long Fib(int n)
{
    if (n <= 1)
    {
        return n;
    }
    // 1. if n is already in memo, return the saved answer
    // 2. otherwise work it out from Fib(n - 1) and Fib(n - 2),
    //    save it in memo, then return it
    return 0;
}

Console.WriteLine(Fib(10));`],
        java: [`static HashMap<Integer, Long> memo = new HashMap<>();

static long fib(int n) {
    if (n <= 1) {
        return n;
    }
    // 1. if n is already in memo, return the saved answer
    // 2. otherwise work it out from fib(n - 1) and fib(n - 2),
    //    save it in memo, then return it
    return 0;
}`, `System.out.println(fib(10));`],
      }),
      hints: {
        python: ['Step 1 looks like: if n in memo: return memo[n]', 'Work out the answer, store it with memo[n] = ..., and return it.'],
        javascript: ['Step 1 looks like: if (n in memo) return memo[n];', 'Work out the answer, store it with memo[n] = ..., and return it.'],
        cpp: ['Step 1 looks like: if (memo.count(n)) return memo[n];', 'Work out the answer, store it with memo[n] = ..., and return it.'],
        csharp: ['Step 1 looks like: if (memo.ContainsKey(n)) return memo[n];', 'Work out the answer, store it with memo[n] = ..., and return it.'],
        java: ['Step 1 looks like: if (memo.containsKey(n)) return memo.get(n);', 'Work out the answer, store it with memo.put(n, ...), and return it.'],
      },
      similar: sims('The "tribonacci" numbers add up the three before them (0, 0, 1, 1, 2, 4, 7, ...). Work them out fast with a memo.', {
        python: `memo = {}

def trib(n):
    if n < 2:
        return 0
    if n == 2:
        return 1
    if n in memo:
        return memo[n]
    memo[n] = trib(n - 1) + trib(n - 2) + trib(n - 3)
    return memo[n]

print(trib(40))`,
        javascript: `const memo = {};

function trib(n) {
  if (n < 2) {
    return 0;
  }
  if (n === 2) {
    return 1;
  }
  if (n in memo) {
    return memo[n];
  }
  memo[n] = trib(n - 1) + trib(n - 2) + trib(n - 3);
  return memo[n];
}

console.log(trib(40));`,
        cpp: [`map<int, long long> memo;

long long trib(int n) {
    if (n < 2) {
        return 0;
    }
    if (n == 2) {
        return 1;
    }
    if (memo.count(n)) {
        return memo[n];
    }
    memo[n] = trib(n - 1) + trib(n - 2) + trib(n - 3);
    return memo[n];
}`, `cout << trib(40) << endl;`],
        csharp: [`Dictionary<int, long> memo = new Dictionary<int, long>();

long Trib(int n)
{
    if (n < 2)
    {
        return 0;
    }
    if (n == 2)
    {
        return 1;
    }
    if (memo.ContainsKey(n))
    {
        return memo[n];
    }
    memo[n] = Trib(n - 1) + Trib(n - 2) + Trib(n - 3);
    return memo[n];
}

Console.WriteLine(Trib(40));`],
        java: [`static HashMap<Integer, Long> memo = new HashMap<>();

static long trib(int n) {
    if (n < 2) {
        return 0;
    }
    if (n == 2) {
        return 1;
    }
    if (memo.containsKey(n)) {
        return memo.get(n);
    }
    memo.put(n, trib(n - 1) + trib(n - 2) + trib(n - 3));
    return memo.get(n);
}`, `System.out.println(trib(40));`],
      }),
      ...fnTerm('fib', [[[0], 0], [[1], 1], [[2], 1], [[10], 55], [[30], 832040], [[50], 12586269025], [[75], 2111485077978050]], [recursive('fib')],
        'Every stone lights up at once. Remembering answers turned days of work into a blink. That trick is called <b>memoization</b>.'),
      gate: 'D',
    },
    dsa_recur5: {
      title: 'The Grid Walker',
      desc: (ctx) => `<p>The last cave is a grid of rooms. You start in the top-left room and the exit is in the bottom-right one. You may only step <b>right</b> or <b>down</b>. How many different routes are there?</p>
        <pre>${tn('count_paths', ctx)}(2, 2)  →  2    (right then down, or down then right)\n${tn('count_paths', ctx)}(3, 3)  →  6\n${tn('count_paths', ctx)}(1, 5)  →  1</pre>
        <p>Write ${code(tn('count_paths', ctx) + '(rows, cols)')} recursively. Think about your first step: it's either right or down, and each choice leaves a smaller grid. A grid with a single row or a single column has exactly one route.</p>
        ${sig(ctx, { cpp: 'int count_paths(int rows, int cols)', csharp: 'int CountPaths(int rows, int cols)', java: 'static int countPaths(int rows, int cols)' })}`,
      starter: programs({
        python: `def count_paths(rows, cols):
    # base case: one row or one column leaves only one route
    # recursive case: your first step is either right or down
    return 0

print(count_paths(3, 3))`,
        javascript: `function countPaths(rows, cols) {
  // base case: one row or one column leaves only one route
  // recursive case: your first step is either right or down
  return 0;
}

console.log(countPaths(3, 3));`,
        cpp: [`int count_paths(int rows, int cols) {
    // base case: one row or one column leaves only one route
    // recursive case: your first step is either right or down
    return 0;
}`, `cout << count_paths(3, 3) << endl;`],
        csharp: [`int CountPaths(int rows, int cols)
{
    // base case: one row or one column leaves only one route
    // recursive case: your first step is either right or down
    return 0;
}

Console.WriteLine(CountPaths(3, 3));`],
        java: [`static int countPaths(int rows, int cols) {
    // base case: one row or one column leaves only one route
    // recursive case: your first step is either right or down
    return 0;
}`, `System.out.println(countPaths(3, 3));`],
      }),
      hints: ['Base case first: if rows is 1 or cols is 1, return 1.', 'Stepping right leaves a grid with one fewer column. Stepping down leaves one fewer row. Every route starts with one of those two steps.'],
      similar: sims('Count the ways to climb a staircase of n steps if you can take 1 or 2 steps at a time.', {
        python: `def climb(n):
    if n <= 1:
        return 1
    return climb(n - 1) + climb(n - 2)

print(climb(5))`,
        javascript: `function climb(n) {
  if (n <= 1) {
    return 1;
  }
  return climb(n - 1) + climb(n - 2);
}

console.log(climb(5));`,
        cpp: [`int climb(int n) {
    if (n <= 1) {
        return 1;
    }
    return climb(n - 1) + climb(n - 2);
}`, `cout << climb(5) << endl;`],
        csharp: [`int Climb(int n)
{
    if (n <= 1)
    {
        return 1;
    }
    return Climb(n - 1) + Climb(n - 2);
}

Console.WriteLine(Climb(5));`],
        java: [`static int climb(int n) {
    if (n <= 1) {
        return 1;
    }
    return climb(n - 1) + climb(n - 2);
}`, `System.out.println(climb(5));`],
      }),
      ...fnTerm('count_paths', [[[1, 1], 1], [[2, 2], 2], [[3, 3], 6], [[1, 7], 1], [[4, 1], 1], [[3, 4], 10], [[5, 5], 70], [[6, 6], 252]], [recursive('count_paths')],
        'Two choices at every room, and recursion counted them all. The way out of the caves is open.'),
      gate: 'E',
    },

    // ============================================================ 6. Sorting
    dsa_sort1: {
      title: 'The Order Inspector',
      desc: (ctx) => `<p>Before the forge sorts anything, the inspector checks the line. Write ${code(tn('is_sorted', ctx) + '(nums)')} that returns ${code((ctx.lang === 'python' ? 'True' : 'true'))} if every number is less than or equal to the one after it, and ${code((ctx.lang === 'python' ? 'False' : 'false'))} otherwise.</p>
        <pre>${tn('is_sorted', ctx)}([1, 2, 2, 5])  →  ${(ctx.lang === 'python' ? 'True' : 'true')}\n${tn('is_sorted', ctx)}([3, 1, 2])     →  ${(ctx.lang === 'python' ? 'False' : 'false')}\n${tn('is_sorted', ctx)}([])            →  ${(ctx.lang === 'python' ? 'True' : 'true')}</pre>
        <p>Compare each number with the one just before it. One pair in the wrong order is enough to say no.</p>
        ${sig(ctx, { cpp: 'bool is_sorted(vector<int> nums)', csharp: 'bool IsSorted(List<int> nums)', java: 'static boolean isSorted(ArrayList<Integer> nums)' })}`,
      starter: programs({
        python: `def is_sorted(nums):
    for i in range(1, len(nums)):
        # compare nums[i - 1] with nums[i]
        pass
    return True

print(is_sorted([3, 1, 2]))`,
        javascript: `function isSorted(nums) {
  for (let i = 1; i < nums.length; i++) {
    // compare nums[i - 1] with nums[i]
  }
  return true;
}

console.log(isSorted([3, 1, 2]));`,
        cpp: [`bool is_sorted(vector<int> nums) {
    for (int i = 1; i < nums.size(); i++) {
        // compare nums[i - 1] with nums[i]
    }
    return true;
}`, `cout << is_sorted({3, 1, 2}) << endl;`],
        csharp: [`bool IsSorted(List<int> nums)
{
    for (int i = 1; i < nums.Count; i++)
    {
        // compare nums[i - 1] with nums[i]
    }
    return true;
}

Console.WriteLine(IsSorted(new List<int> { 3, 1, 2 }));`],
        java: [`static boolean isSorted(ArrayList<Integer> nums) {
    for (int i = 1; i < nums.size(); i++) {
        // compare nums.get(i - 1) with nums.get(i)
    }
    return true;
}`, `System.out.println(isSorted(new ArrayList<>(List.of(3, 1, 2))));`],
      }),
      hints: ['If the number before is bigger than the number at i, the list is not sorted.', 'You can return false from inside the loop as soon as you find a bad pair.'],
      similar: sims('Count how many times a number is smaller than the one before it.', {
        python: `def count_drops(nums):
    drops = 0
    for i in range(1, len(nums)):
        if nums[i] < nums[i - 1]:
            drops += 1
    return drops

print(count_drops([5, 3, 4, 1]))`,
        javascript: `function countDrops(nums) {
  let drops = 0;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) {
      drops++;
    }
  }
  return drops;
}

console.log(countDrops([5, 3, 4, 1]));`,
        cpp: [`int count_drops(vector<int> nums) {
    int drops = 0;
    for (int i = 1; i < nums.size(); i++) {
        if (nums[i] < nums[i - 1]) {
            drops++;
        }
    }
    return drops;
}`, `cout << count_drops({5, 3, 4, 1}) << endl;`],
        csharp: [`int CountDrops(List<int> nums)
{
    int drops = 0;
    for (int i = 1; i < nums.Count; i++)
    {
        if (nums[i] < nums[i - 1])
        {
            drops++;
        }
    }
    return drops;
}

Console.WriteLine(CountDrops(new List<int> { 5, 3, 4, 1 }));`],
        java: [`static int countDrops(ArrayList<Integer> nums) {
    int drops = 0;
    for (int i = 1; i < nums.size(); i++) {
        if (nums.get(i) < nums.get(i - 1)) {
            drops++;
        }
    }
    return drops;
}`, `System.out.println(countDrops(new ArrayList<>(List.of(5, 3, 4, 1))));`],
      }),
      ...fnTerm('is_sorted', [[[[1, 2, 3]], true], [[[3, 1, 2]], false], [[[]], true], [[[5]], true], [[[2, 2, 3]], true], [[[1, 3, 2, 4]], false], [[[1, 2, 3, 0]], false]], [noSort],
        'The inspector stamps the line: in order. Now let\'s put things in order ourselves.'),
      gate: 'A',
    },
    dsa_sort2: {
      title: 'Bubble Trouble',
      desc: (ctx) => `<p>Write ${code(tn('bubble_sort', ctx) + '(nums)')} that sorts the numbers from smallest to biggest and returns the list, using <b>bubble sort</b>:</p>
        <ul><li>walk along the list and swap every pair of neighbours that is in the wrong order;</li><li>after one pass the biggest number has bubbled to the end;</li><li>repeat the pass until everything is in place.</li></ul>
        <pre>${tn('bubble_sort', ctx)}([5, 1, 4, 2, 8])  →  [1, 2, 4, 5, 8]</pre>
        <p>No built-in sort allowed.</p>
        ${sig(ctx, { cpp: 'vector<int> bubble_sort(vector<int> nums)', csharp: 'List<int> BubbleSort(List<int> nums)', java: 'static ArrayList<Integer> bubbleSort(ArrayList<Integer> nums)' })}`,
      starter: programs({
        python: `def bubble_sort(nums):
    n = len(nums)
    for done in range(n - 1):
        # walk along the list and swap any two neighbours
        # that are in the wrong order
        pass
    return nums

print(bubble_sort([5, 1, 4, 2, 8]))`,
        javascript: `function bubbleSort(nums) {
  const n = nums.length;
  for (let done = 0; done < n - 1; done++) {
    // walk along the list and swap any two neighbours
    // that are in the wrong order
  }
  return nums;
}

console.log(bubbleSort([5, 1, 4, 2, 8]).join(", "));`,
        cpp: [`vector<int> bubble_sort(vector<int> nums) {
    int n = nums.size();
    for (int done = 0; done < n - 1; done++) {
        // walk along the list and swap any two neighbours
        // that are in the wrong order
    }
    return nums;
}`, `vector<int> sorted = bubble_sort({5, 1, 4, 2, 8});
for (int x : sorted) {
    cout << x << " ";
}
cout << endl;`],
        csharp: [`List<int> BubbleSort(List<int> nums)
{
    int n = nums.Count;
    for (int done = 0; done < n - 1; done++)
    {
        // walk along the list and swap any two neighbours
        // that are in the wrong order
    }
    return nums;
}

Console.WriteLine(string.Join(", ", BubbleSort(new List<int> { 5, 1, 4, 2, 8 })));`],
        java: [`static ArrayList<Integer> bubbleSort(ArrayList<Integer> nums) {
    int n = nums.size();
    for (int done = 0; done < n - 1; done++) {
        // walk along the list and swap any two neighbours
        // that are in the wrong order
    }
    return nums;
}`, `System.out.println(bubbleSort(new ArrayList<>(List.of(5, 1, 4, 2, 8))));`],
      }),
      hints: ['Inside the loop you need a second loop over the positions i, comparing item i with item i + 1.', 'Swap with a temporary variable: hold one item, overwrite it, then put the held item in the other spot.'],
      similar: sims('Move every 0 to the end of the list, keeping the other numbers in their order, using swaps.', {
        python: `def zeros_to_end(nums):
    spot = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[spot], nums[i] = nums[i], nums[spot]
            spot += 1
    return nums

print(zeros_to_end([0, 3, 0, 1, 2]))`,
        javascript: `function zerosToEnd(nums) {
  let spot = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      const temp = nums[spot];
      nums[spot] = nums[i];
      nums[i] = temp;
      spot++;
    }
  }
  return nums;
}

console.log(zerosToEnd([0, 3, 0, 1, 2]).join(", "));`,
        cpp: [`vector<int> zeros_to_end(vector<int> nums) {
    int spot = 0;
    for (int i = 0; i < nums.size(); i++) {
        if (nums[i] != 0) {
            int temp = nums[spot];
            nums[spot] = nums[i];
            nums[i] = temp;
            spot++;
        }
    }
    return nums;
}`, `for (int x : zeros_to_end({0, 3, 0, 1, 2})) {
    cout << x << " ";
}
cout << endl;`],
        csharp: [`List<int> ZerosToEnd(List<int> nums)
{
    int spot = 0;
    for (int i = 0; i < nums.Count; i++)
    {
        if (nums[i] != 0)
        {
            int temp = nums[spot];
            nums[spot] = nums[i];
            nums[i] = temp;
            spot++;
        }
    }
    return nums;
}

Console.WriteLine(string.Join(", ", ZerosToEnd(new List<int> { 0, 3, 0, 1, 2 })));`],
        java: [`static ArrayList<Integer> zerosToEnd(ArrayList<Integer> nums) {
    int spot = 0;
    for (int i = 0; i < nums.size(); i++) {
        if (nums.get(i) != 0) {
            int temp = nums.get(spot);
            nums.set(spot, nums.get(i));
            nums.set(i, temp);
            spot++;
        }
    }
    return nums;
}`, `System.out.println(zerosToEnd(new ArrayList<>(List.of(0, 3, 0, 1, 2))));`],
      }),
      ...fnTerm('bubble_sort', [[[[5, 1, 4, 2, 8]], [1, 2, 4, 5, 8]], [[[]], []], [[[7]], [7]], [[[3, 3, 1]], [1, 3, 3]], [[[9, 7, 5, 3, 1, 2, 4, 6, 8]], [1, 2, 3, 4, 5, 6, 7, 8, 9]], [[[-2, 10, 0]], [-2, 0, 10]]], [noSort],
        'Bubble, bubble, swap. The big numbers float to the end and the line is sorted.'),
      gate: 'B',
    },
    dsa_sort3: {
      title: 'The Card Sorter',
      desc: (ctx) => `<p>Write ${code(tn('insertion_sort', ctx) + '(nums)')} using <b>insertion sort</b>, the way you'd sort playing cards in your hand:</p>
        <ul><li>the part of the list to the left of position i is already sorted;</li><li>take the number at i and slide it left, swapping it with its neighbour, while the number before it is bigger;</li><li>then move on to the next i.</li></ul>
        <pre>${tn('insertion_sort', ctx)}([4, 3, 1, 2])  →  [1, 2, 3, 4]</pre>
        <p>No built-in sort allowed. Return the sorted list.</p>
        ${sig(ctx, { cpp: 'vector<int> insertion_sort(vector<int> nums)', csharp: 'List<int> InsertionSort(List<int> nums)', java: 'static ArrayList<Integer> insertionSort(ArrayList<Integer> nums)' })}`,
      starter: programs({
        python: `def insertion_sort(nums):
    for i in range(1, len(nums)):
        # nums[0] to nums[i - 1] are already sorted.
        # Slide nums[i] to the left while the number before it is bigger.
        pass
    return nums

print(insertion_sort([4, 3, 1, 2]))`,
        javascript: `function insertionSort(nums) {
  for (let i = 1; i < nums.length; i++) {
    // nums[0] to nums[i - 1] are already sorted.
    // Slide nums[i] to the left while the number before it is bigger.
  }
  return nums;
}

console.log(insertionSort([4, 3, 1, 2]).join(", "));`,
        cpp: [`vector<int> insertion_sort(vector<int> nums) {
    for (int i = 1; i < nums.size(); i++) {
        // nums[0] to nums[i - 1] are already sorted.
        // Slide nums[i] to the left while the number before it is bigger.
    }
    return nums;
}`, `for (int x : insertion_sort({4, 3, 1, 2})) {
    cout << x << " ";
}
cout << endl;`],
        csharp: [`List<int> InsertionSort(List<int> nums)
{
    for (int i = 1; i < nums.Count; i++)
    {
        // nums[0] to nums[i - 1] are already sorted.
        // Slide nums[i] to the left while the number before it is bigger.
    }
    return nums;
}

Console.WriteLine(string.Join(", ", InsertionSort(new List<int> { 4, 3, 1, 2 })));`],
        java: [`static ArrayList<Integer> insertionSort(ArrayList<Integer> nums) {
    for (int i = 1; i < nums.size(); i++) {
        // the numbers before position i are already sorted.
        // Slide the number at i to the left while the number before it is bigger.
    }
    return nums;
}`, `System.out.println(insertionSort(new ArrayList<>(List.of(4, 3, 1, 2))));`],
      }),
      hints: ['Use a second index j that starts at i and moves left one step per swap.', 'Keep swapping item j - 1 and item j while j > 0 and item j - 1 is bigger than item j.'],
      similar: sims('Find the position where a new number belongs in a sorted list: the index of the first number bigger than it.', {
        python: `def position(nums, value):
    i = 0
    while i < len(nums) and nums[i] <= value:
        i += 1
    return i

print(position([1, 3, 7, 9], 5))`,
        javascript: `function position(nums, value) {
  let i = 0;
  while (i < nums.length && nums[i] <= value) {
    i++;
  }
  return i;
}

console.log(position([1, 3, 7, 9], 5));`,
        cpp: [`int position(vector<int> nums, int value) {
    int i = 0;
    while (i < nums.size() && nums[i] <= value) {
        i++;
    }
    return i;
}`, `cout << position({1, 3, 7, 9}, 5) << endl;`],
        csharp: [`int Position(List<int> nums, int value)
{
    int i = 0;
    while (i < nums.Count && nums[i] <= value)
    {
        i++;
    }
    return i;
}

Console.WriteLine(Position(new List<int> { 1, 3, 7, 9 }, 5));`],
        java: [`static int position(ArrayList<Integer> nums, int value) {
    int i = 0;
    while (i < nums.size() && nums.get(i) <= value) {
        i++;
    }
    return i;
}`, `System.out.println(position(new ArrayList<>(List.of(1, 3, 7, 9)), 5));`],
      }),
      ...fnTerm('insertion_sort', [[[[4, 3, 1, 2]], [1, 2, 3, 4]], [[[]], []], [[[1]], [1]], [[[2, 1]], [1, 2]], [[[1, 2, 3, 4, 5]], [1, 2, 3, 4, 5]], [[[6, 5, 9, 1, 5, 0]], [0, 1, 5, 5, 6, 9]]], [noSort],
        'Card by card, every number slides into its place.'),
      gate: 'C',
    },
    dsa_sort4: {
      title: 'The Zipper',
      desc: (ctx) => `<p>Two conveyor belts each carry numbers that are <b>already sorted</b>. Write ${code(tn('merge', ctx) + '(a, b)')} that returns one sorted list with every number from both.</p>
        <pre>${tn('merge', ctx)}([1, 4, 9], [2, 3, 10])  →  [1, 2, 3, 4, 9, 10]\n${tn('merge', ctx)}([], [5, 6])           →  [5, 6]</pre>
        <p>Keep an index into each list. Look at the two front numbers, move the smaller one into the result, and step past it. When one list runs out, add the rest of the other. No built-in sort allowed.</p>
        ${sig(ctx, { cpp: 'vector<int> merge(vector<int> a, vector<int> b)', csharp: 'List<int> Merge(List<int> a, List<int> b)', java: 'static ArrayList<Integer> merge(ArrayList<Integer> a, ArrayList<Integer> b)' })}`,
      starter: programs({
        python: `def merge(a, b):
    result = []
    i = 0
    j = 0
    # while both lists have numbers left, take the smaller front number
    # then add whatever is left over in a or in b
    return result

print(merge([1, 4, 9], [2, 3, 10]))`,
        javascript: `function merge(a, b) {
  const result = [];
  let i = 0;
  let j = 0;
  // while both lists have numbers left, take the smaller front number
  // then add whatever is left over in a or in b
  return result;
}

console.log(merge([1, 4, 9], [2, 3, 10]).join(", "));`,
        cpp: [`vector<int> merge(vector<int> a, vector<int> b) {
    vector<int> result;
    int i = 0;
    int j = 0;
    // while both lists have numbers left, take the smaller front number
    // then add whatever is left over in a or in b
    return result;
}`, `for (int x : merge({1, 4, 9}, {2, 3, 10})) {
    cout << x << " ";
}
cout << endl;`],
        csharp: [`List<int> Merge(List<int> a, List<int> b)
{
    List<int> result = new List<int>();
    int i = 0;
    int j = 0;
    // while both lists have numbers left, take the smaller front number
    // then add whatever is left over in a or in b
    return result;
}

Console.WriteLine(string.Join(", ", Merge(new List<int> { 1, 4, 9 }, new List<int> { 2, 3, 10 })));`],
        java: [`static ArrayList<Integer> merge(ArrayList<Integer> a, ArrayList<Integer> b) {
    ArrayList<Integer> result = new ArrayList<>();
    int i = 0;
    int j = 0;
    // while both lists have numbers left, take the smaller front number
    // then add whatever is left over in a or in b
    return result;
}`, `System.out.println(merge(new ArrayList<>(List.of(1, 4, 9)), new ArrayList<>(List.of(2, 3, 10))));`],
      }),
      hints: ['The first loop runs while i is inside a AND j is inside b.', 'After that loop, one list may still have numbers. Two more small loops copy what is left of a and of b.'],
      similar: sims('Zip two lists together: take one from a, then one from b, and so on. Leftovers go at the end.', {
        python: `def interleave(a, b):
    result = []
    i = 0
    while i < len(a) or i < len(b):
        if i < len(a):
            result.append(a[i])
        if i < len(b):
            result.append(b[i])
        i += 1
    return result

print(interleave([1, 2, 3], [10, 20]))`,
        javascript: `function interleave(a, b) {
  const result = [];
  for (let i = 0; i < a.length || i < b.length; i++) {
    if (i < a.length) {
      result.push(a[i]);
    }
    if (i < b.length) {
      result.push(b[i]);
    }
  }
  return result;
}

console.log(interleave([1, 2, 3], [10, 20]).join(", "));`,
        cpp: [`vector<int> interleave(vector<int> a, vector<int> b) {
    vector<int> result;
    for (int i = 0; i < a.size() || i < b.size(); i++) {
        if (i < a.size()) {
            result.push_back(a[i]);
        }
        if (i < b.size()) {
            result.push_back(b[i]);
        }
    }
    return result;
}`, `for (int x : interleave({1, 2, 3}, {10, 20})) {
    cout << x << " ";
}
cout << endl;`],
        csharp: [`List<int> Interleave(List<int> a, List<int> b)
{
    List<int> result = new List<int>();
    for (int i = 0; i < a.Count || i < b.Count; i++)
    {
        if (i < a.Count)
        {
            result.Add(a[i]);
        }
        if (i < b.Count)
        {
            result.Add(b[i]);
        }
    }
    return result;
}

Console.WriteLine(string.Join(", ", Interleave(new List<int> { 1, 2, 3 }, new List<int> { 10, 20 })));`],
        java: [`static ArrayList<Integer> interleave(ArrayList<Integer> a, ArrayList<Integer> b) {
    ArrayList<Integer> result = new ArrayList<>();
    for (int i = 0; i < a.size() || i < b.size(); i++) {
        if (i < a.size()) {
            result.add(a.get(i));
        }
        if (i < b.size()) {
            result.add(b.get(i));
        }
    }
    return result;
}`, `System.out.println(interleave(new ArrayList<>(List.of(1, 2, 3)), new ArrayList<>(List.of(10, 20))));`],
      }),
      ...fnTerm('merge', [[[[1, 4, 9], [2, 3, 10]], [1, 2, 3, 4, 9, 10]], [[[], [5, 6]], [5, 6]], [[[5], []], [5]], [[[], []], []], [[[1, 1], [1]], [1, 1, 1]], [[[2, 4, 6, 8], [1]], [1, 2, 4, 6, 8]], [[[0, 10, 20], [5, 15, 25, 35]], [0, 5, 10, 15, 20, 25, 35]]], [noSort],
        'The two belts zip into one sorted line. Hold on to that function: it\'s half of the fastest sort here.'),
      gate: 'D',
    },
    dsa_sort5: {
      title: 'Divide and Conquer',
      desc: (ctx) => `<p>Now for a fast sort. ${code(tn('merge_sort', ctx) + '(nums)')} works like this:</p>
        <ul><li>a list of 0 or 1 numbers is already sorted: return it (the base case);</li><li>otherwise split it into a left half and a right half;</li><li>sort each half <b>by calling ${code(tn('merge_sort', ctx))} on it</b>;</li><li>${code(tn('merge', ctx))} the two sorted halves and return the result.</li></ul>
        <p>Your ${code(tn('merge', ctx))} from the last terminal is already in the starter, and the list is already split for you. No built-in sort allowed.</p>
        <pre>${tn('merge_sort', ctx)}([38, 27, 43, 3, 9, 82, 10])  →  [3, 9, 10, 27, 38, 43, 82]</pre>
        ${sig(ctx, { cpp: 'vector<int> merge_sort(vector<int> nums)', csharp: 'List<int> MergeSort(List<int> nums)', java: 'static ArrayList<Integer> mergeSort(ArrayList<Integer> nums)' })}`,
      starter: programs({
        python: `${MERGE.python}

def merge_sort(nums):
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    left = nums[:mid]
    right = nums[mid:]
    # sort both halves with merge_sort, then merge them
    return nums

print(merge_sort([38, 27, 43, 3, 9, 82, 10]))`,
        javascript: `${MERGE.javascript}

function mergeSort(nums) {
  if (nums.length <= 1) {
    return nums;
  }
  const mid = Math.floor(nums.length / 2);
  const left = nums.slice(0, mid);
  const right = nums.slice(mid);
  // sort both halves with mergeSort, then merge them
  return nums;
}

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]).join(", "));`,
        cpp: [`${MERGE.cpp}

vector<int> merge_sort(vector<int> nums) {
    if (nums.size() <= 1) {
        return nums;
    }
    int mid = nums.size() / 2;
    vector<int> left(nums.begin(), nums.begin() + mid);
    vector<int> right(nums.begin() + mid, nums.end());
    // sort both halves with merge_sort, then merge them
    return nums;
}`, `for (int x : merge_sort({38, 27, 43, 3, 9, 82, 10})) {
    cout << x << " ";
}
cout << endl;`],
        csharp: [`${MERGE.csharp}

List<int> MergeSort(List<int> nums)
{
    if (nums.Count <= 1)
    {
        return nums;
    }
    int mid = nums.Count / 2;
    List<int> left = nums.GetRange(0, mid);
    List<int> right = nums.GetRange(mid, nums.Count - mid);
    // sort both halves with MergeSort, then merge them
    return nums;
}

Console.WriteLine(string.Join(", ", MergeSort(new List<int> { 38, 27, 43, 3, 9, 82, 10 })));`],
        java: [`${MERGE.java}

static ArrayList<Integer> mergeSort(ArrayList<Integer> nums) {
    if (nums.size() <= 1) {
        return nums;
    }
    int mid = nums.size() / 2;
    ArrayList<Integer> left = new ArrayList<>(nums.subList(0, mid));
    ArrayList<Integer> right = new ArrayList<>(nums.subList(mid, nums.size()));
    // sort both halves with mergeSort, then merge them
    return nums;
}`, `System.out.println(mergeSort(new ArrayList<>(List.of(38, 27, 43, 3, 9, 82, 10))));`],
      }),
      hints: byLang(l => [`Call ${Lang.testName('merge_sort', l)} on left and on right. Each call gives you back a sorted half.`, `Pass the two sorted halves to ${Lang.testName('merge', l)} and return what it gives back.`]),
      similar: sims('Find the largest number by divide and conquer: the largest of the left half or the largest of the right half.', {
        python: `def largest(nums):
    if len(nums) == 1:
        return nums[0]
    mid = len(nums) // 2
    return max(largest(nums[:mid]), largest(nums[mid:]))

print(largest([38, 27, 43, 3, 9, 82, 10]))`,
        javascript: `function largest(nums) {
  if (nums.length === 1) {
    return nums[0];
  }
  const mid = Math.floor(nums.length / 2);
  return Math.max(largest(nums.slice(0, mid)), largest(nums.slice(mid)));
}

console.log(largest([38, 27, 43, 3, 9, 82, 10]));`,
        cpp: [`int largest(vector<int> nums) {
    if (nums.size() == 1) {
        return nums[0];
    }
    int mid = nums.size() / 2;
    vector<int> left(nums.begin(), nums.begin() + mid);
    vector<int> right(nums.begin() + mid, nums.end());
    return max(largest(left), largest(right));
}`, `cout << largest({38, 27, 43, 3, 9, 82, 10}) << endl;`],
        csharp: [`int Largest(List<int> nums)
{
    if (nums.Count == 1)
    {
        return nums[0];
    }
    int mid = nums.Count / 2;
    return Math.Max(Largest(nums.GetRange(0, mid)), Largest(nums.GetRange(mid, nums.Count - mid)));
}

Console.WriteLine(Largest(new List<int> { 38, 27, 43, 3, 9, 82, 10 }));`],
        java: [`static int largest(ArrayList<Integer> nums) {
    if (nums.size() == 1) {
        return nums.get(0);
    }
    int mid = nums.size() / 2;
    ArrayList<Integer> left = new ArrayList<>(nums.subList(0, mid));
    ArrayList<Integer> right = new ArrayList<>(nums.subList(mid, nums.size()));
    return Math.max(largest(left), largest(right));
}`, `System.out.println(largest(new ArrayList<>(List.of(38, 27, 43, 3, 9, 82, 10))));`],
      }),
      ...fnTerm('merge_sort', [[[[38, 27, 43, 3, 9, 82, 10]], [3, 9, 10, 27, 38, 43, 82]], [[[]], []], [[[1]], [1]], [[[5, 4, 3, 2, 1]], [1, 2, 3, 4, 5]], [[[2, 1, 2, 1]], [1, 1, 2, 2]], [[[10, -1, 7, 3, 3, 0, 8, -5, 2]], [-5, -1, 0, 2, 3, 3, 7, 8, 10]]], [recursive('merge_sort'), noSort],
        'Split, sort, merge. That\'s <b>merge sort</b>, O(n log n): the same idea many real sorting functions use.'),
      gate: 'E',
    },

    // ============================================================ 7. Linked Lists & Trees
    dsa_nodes1: {
      title: 'Count the Lanterns',
      desc: (ctx) => `<p>The lanterns in these woods form a <b>linked list</b>: each ${code('Node')} holds a value and a link, ${code(ctx.lang === 'csharp' ? 'Next' : 'next')}, to the next node. The last node's link is ${code(NUL[ctx.lang])}.</p>
        <p>Write ${code(tn('count_nodes', ctx) + '(head)')} that returns how many nodes there are, starting from ${code('head')}. An empty list (head is ${code(NUL[ctx.lang])}) has 0.</p>
        <p>Start a pointer at the head and follow the links until you fall off the end, counting as you go. Keep the test lines at the bottom: they should print 4, 1 and 0.</p>`,
      starter: programs({
        python: `${NODE.python}

def count_nodes(head):
    count = 0
    # walk from head to the end of the list, counting nodes
    return count

head = Node(4)
head.next = Node(8)
head.next.next = Node(15)
head.next.next.next = Node(16)
print(count_nodes(head))
print(count_nodes(Node(42)))
print(count_nodes(None))`,
        javascript: `${NODE.javascript}

function countNodes(head) {
  let count = 0;
  // walk from head to the end of the list, counting nodes
  return count;
}

const head = new Node(4);
head.next = new Node(8);
head.next.next = new Node(15);
head.next.next.next = new Node(16);
console.log(countNodes(head));
console.log(countNodes(new Node(42)));
console.log(countNodes(null));`,
        cpp: [`${NODE.cpp}

int count_nodes(Node* head) {
    int count = 0;
    // walk from head to the end of the list, counting nodes
    return count;
}`, `Node* head = new Node(4);
head->next = new Node(8);
head->next->next = new Node(15);
head->next->next->next = new Node(16);
cout << count_nodes(head) << endl;
cout << count_nodes(new Node(42)) << endl;
cout << count_nodes(nullptr) << endl;`],
        csharp: [`int CountNodes(Node head)
{
    int count = 0;
    // walk from head to the end of the list, counting nodes
    return count;
}

Node head = new Node(4);
head.Next = new Node(8);
head.Next.Next = new Node(15);
head.Next.Next.Next = new Node(16);
Console.WriteLine(CountNodes(head));
Console.WriteLine(CountNodes(new Node(42)));
Console.WriteLine(CountNodes(null));`, NODE.csharp],
        java: [`static int countNodes(Node head) {
    int count = 0;
    // walk from head to the end of the list, counting nodes
    return count;
}`, `Node head = new Node(4);
head.next = new Node(8);
head.next.next = new Node(15);
head.next.next.next = new Node(16);
System.out.println(countNodes(head));
System.out.println(countNodes(new Node(42)));
System.out.println(countNodes(null));`, NODE.java],
      }),
      hints: {
        python: ['Make cur = head, then loop while cur is not None.', 'Inside the loop: add 1 to count, then move on with cur = cur.next.'],
        javascript: ['Make let cur = head, then loop while (cur !== null).', 'Inside the loop: add 1 to count, then move on with cur = cur.next.'],
        cpp: ['Make Node* cur = head, then loop while (cur != nullptr).', 'Inside the loop: add 1 to count, then move on with cur = cur->next.'],
        csharp: ['Make Node cur = head, then loop while (cur != null).', 'Inside the loop: add 1 to count, then move on with cur = cur.Next.'],
        java: ['Make Node cur = head, then loop while (cur != null).', 'Inside the loop: add 1 to count, then move on with cur = cur.next.'],
      },
      similar: sims('Add up all the values in a linked list.', {
        python: `${NODE.python}

def sum_values(head):
    total = 0
    cur = head
    while cur is not None:
        total += cur.value
        cur = cur.next
    return total

head = Node(2)
head.next = Node(5)
print(sum_values(head))`,
        javascript: `${NODE.javascript}

function sumValues(head) {
  let total = 0;
  for (let cur = head; cur !== null; cur = cur.next) {
    total += cur.value;
  }
  return total;
}

const head = new Node(2);
head.next = new Node(5);
console.log(sumValues(head));`,
        cpp: [`${NODE.cpp}

int sum_values(Node* head) {
    int total = 0;
    for (Node* cur = head; cur != nullptr; cur = cur->next) {
        total += cur->value;
    }
    return total;
}`, `Node* head = new Node(2);
head->next = new Node(5);
cout << sum_values(head) << endl;`],
        csharp: [`int SumValues(Node head)
{
    int total = 0;
    for (Node cur = head; cur != null; cur = cur.Next)
    {
        total += cur.Value;
    }
    return total;
}

Node head = new Node(2);
head.Next = new Node(5);
Console.WriteLine(SumValues(head));`, NODE.csharp],
        java: [`static int sumValues(Node head) {
    int total = 0;
    for (Node cur = head; cur != null; cur = cur.next) {
        total += cur.value;
    }
    return total;
}`, `Node head = new Node(2);
head.next = new Node(5);
System.out.println(sumValues(head));`, NODE.java],
      }),
      ...outTerm(['4', '1', '0'], [bodyHas('count_nodes', { python: /\.next\b/, javascript: /\.next\b/, cpp: /->\s*next\b/, csharp: /\.Next\b/, java: /\.next\b/ }, () => 'Walk the chain: follow the links from node to node instead of printing the numbers yourself.')],
        'Four lanterns, one lantern, no lanterns. You walked the chain.'),
      gate: 'A',
    },
    dsa_nodes2: {
      title: 'The Last Lantern',
      desc: (ctx) => `<p>New lanterns are always hung at the <b>end</b> of the chain. Write ${code(tn('append', ctx) + '(head, value)')} that adds a new node with that value after the last node and returns the head of the list.</p>
        <ul><li>If the list is empty (head is ${code(NUL[ctx.lang])}), the new node <b>is</b> the whole list: return it.</li><li>Otherwise walk to the last node (the one whose link is ${code(NUL[ctx.lang])}) and link the new node after it.</li></ul>
        <p>${code(tn('show', ctx))} is already written: it turns a list into text like ${code('3 -> 8 -> 5')}. The test lines should print ${code('3')}, ${code('3 -> 8 -> 5')} and ${code('1 -> 2')}.</p>`,
      starter: programs({
        python: `${NODE.python}

${SHOW.python}

def append(head, value):
    new_node = Node(value)
    # if the list is empty, the new node is the whole list
    # otherwise walk to the last node and link the new node after it
    return head

head = None
head = append(head, 3)
print(show(head))
head = append(head, 8)
head = append(head, 5)
print(show(head))
print(show(append(Node(1), 2)))`,
        javascript: `${NODE.javascript}

${SHOW.javascript}

function append(head, value) {
  const newNode = new Node(value);
  // if the list is empty, the new node is the whole list
  // otherwise walk to the last node and link the new node after it
  return head;
}

let head = null;
head = append(head, 3);
console.log(show(head));
head = append(head, 8);
head = append(head, 5);
console.log(show(head));
console.log(show(append(new Node(1), 2)));`,
        cpp: [`${NODE.cpp}

${SHOW.cpp}

Node* append(Node* head, int value) {
    Node* newNode = new Node(value);
    // if the list is empty, the new node is the whole list
    // otherwise walk to the last node and link the new node after it
    return head;
}`, `Node* head = nullptr;
head = append(head, 3);
cout << show(head) << endl;
head = append(head, 8);
head = append(head, 5);
cout << show(head) << endl;
cout << show(append(new Node(1), 2)) << endl;`],
        csharp: [`${SHOW.csharp}

Node Append(Node head, int value)
{
    Node newNode = new Node(value);
    // if the list is empty, the new node is the whole list
    // otherwise walk to the last node and link the new node after it
    return head;
}

Node head = null;
head = Append(head, 3);
Console.WriteLine(Show(head));
head = Append(head, 8);
head = Append(head, 5);
Console.WriteLine(Show(head));
Console.WriteLine(Show(Append(new Node(1), 2)));`, NODE.csharp],
        java: [`${SHOW.java}

static Node append(Node head, int value) {
    Node newNode = new Node(value);
    // if the list is empty, the new node is the whole list
    // otherwise walk to the last node and link the new node after it
    return head;
}`, `Node head = null;
head = append(head, 3);
System.out.println(show(head));
head = append(head, 8);
head = append(head, 5);
System.out.println(show(head));
System.out.println(show(append(new Node(1), 2)));`, NODE.java],
      }),
      hints: byLang(l => [`First handle the empty list: if head is ${NUL[l]}, return the new node.`, `To find the last node, keep moving while the current node's link is not ${NUL[l]}. Then set that last node's link to the new node.`]),
      similar: sims('Find the position of a value in a linked list (0 for the head), or -1 if it isn\'t there.', {
        python: `${NODE.python}

def find(head, target):
    index = 0
    cur = head
    while cur is not None:
        if cur.value == target:
            return index
        index += 1
        cur = cur.next
    return -1

head = Node(4)
head.next = Node(9)
print(find(head, 9))`,
        javascript: `${NODE.javascript}

function find(head, target) {
  let index = 0;
  for (let cur = head; cur !== null; cur = cur.next) {
    if (cur.value === target) {
      return index;
    }
    index++;
  }
  return -1;
}

const head = new Node(4);
head.next = new Node(9);
console.log(find(head, 9));`,
        cpp: [`${NODE.cpp}

int find(Node* head, int target) {
    int index = 0;
    for (Node* cur = head; cur != nullptr; cur = cur->next) {
        if (cur->value == target) {
            return index;
        }
        index++;
    }
    return -1;
}`, `Node* head = new Node(4);
head->next = new Node(9);
cout << find(head, 9) << endl;`],
        csharp: [`int Find(Node head, int target)
{
    int index = 0;
    for (Node cur = head; cur != null; cur = cur.Next)
    {
        if (cur.Value == target)
        {
            return index;
        }
        index++;
    }
    return -1;
}

Node head = new Node(4);
head.Next = new Node(9);
Console.WriteLine(Find(head, 9));`, NODE.csharp],
        java: [`static int find(Node head, int target) {
    int index = 0;
    for (Node cur = head; cur != null; cur = cur.next) {
        if (cur.value == target) {
            return index;
        }
        index++;
    }
    return -1;
}`, `Node head = new Node(4);
head.next = new Node(9);
System.out.println(find(head, 9));`, NODE.java],
      }),
      ...outTerm(['3', '3 -> 8 -> 5', '1 -> 2'], [],
        'A new lantern glows at the end of the chain.'),
      gate: 'B',
    },
    dsa_nodes3: {
      title: 'The Backwards Path',
      desc: (ctx) => `<p>The path through the woods has to be walked the other way. Write ${code(tn('reverse', ctx) + '(head)')} that <b>reverses</b> the list and returns the new head, so ${code('1 -> 2 -> 3 -> 4')} becomes ${code('4 -> 3 -> 2 -> 1')}.</p>
        <p>Don't make new nodes: turn the links you already have around. Walk the list with two pointers, ${code('prev')} (starting at ${code(NUL[ctx.lang])}) and ${code('cur')} (starting at the head). At each node, remember the next node, point the current node back at ${code('prev')}, then move both pointers one step forward. When ${code('cur')} falls off the end, ${code('prev')} is the new head.</p>
        <p>The test lines should print ${code('4 -> 3 -> 2 -> 1')}, ${code('7')} and ${code('(empty)')}.</p>`,
      starter: programs({
        python: `${NODE.python}

${SHOW.python}

${APPEND.python}

def reverse(head):
    prev = None
    cur = head
    # turn each link around, then step forward
    return head

head = None
for v in [1, 2, 3, 4]:
    head = append(head, v)
print(show(reverse(head)))
print(show(reverse(Node(7))))
print(show(reverse(None)))`,
        javascript: `${NODE.javascript}

${SHOW.javascript}

${APPEND.javascript}

function reverse(head) {
  let prev = null;
  let cur = head;
  // turn each link around, then step forward
  return head;
}

let head = null;
for (const v of [1, 2, 3, 4]) {
  head = append(head, v);
}
console.log(show(reverse(head)));
console.log(show(reverse(new Node(7))));
console.log(show(reverse(null)));`,
        cpp: [`${NODE.cpp}

${SHOW.cpp}

${APPEND.cpp}

Node* reverse(Node* head) {
    Node* prev = nullptr;
    Node* cur = head;
    // turn each link around, then step forward
    return head;
}`, `Node* head = nullptr;
vector<int> values = {1, 2, 3, 4};
for (int v : values) {
    head = append(head, v);
}
cout << show(reverse(head)) << endl;
cout << show(reverse(new Node(7))) << endl;
cout << show(reverse(nullptr)) << endl;`],
        csharp: [`${SHOW.csharp}

${APPEND.csharp}

Node Reverse(Node head)
{
    Node prev = null;
    Node cur = head;
    // turn each link around, then step forward
    return head;
}

Node head = null;
foreach (int v in new int[] { 1, 2, 3, 4 })
{
    head = Append(head, v);
}
Console.WriteLine(Show(Reverse(head)));
Console.WriteLine(Show(Reverse(new Node(7))));
Console.WriteLine(Show(Reverse(null)));`, NODE.csharp],
        java: [`${SHOW.java}

${APPEND.java}

static Node reverse(Node head) {
    Node prev = null;
    Node cur = head;
    // turn each link around, then step forward
    return head;
}`, `Node head = null;
int[] values = {1, 2, 3, 4};
for (int v : values) {
    head = append(head, v);
}
System.out.println(show(reverse(head)));
System.out.println(show(reverse(new Node(7))));
System.out.println(show(reverse(null)));`, NODE.java],
      }),
      hints: byLang(l => {
        const nx = l === 'cpp' ? 'cur->next' : l === 'csharp' ? 'cur.Next' : 'cur.next';
        return [`Loop while cur is not ${NUL[l]}. First save the next node: it's ${nx}.`, `Then: ${nx} = prev, prev = cur, and cur = the node you saved. Return prev at the end.`];
      }),
      similar: sims('Remove the first node that holds a given value, by linking around it.', {
        python: `${NODE.python}

def remove(head, target):
    if head is None:
        return None
    if head.value == target:
        return head.next
    cur = head
    while cur.next is not None:
        if cur.next.value == target:
            cur.next = cur.next.next
            return head
        cur = cur.next
    return head

head = Node(1)
head.next = Node(2)
head.next.next = Node(3)
head = remove(head, 2)
print(head.value, head.next.value)`,
        javascript: `${NODE.javascript}

function remove(head, target) {
  if (head === null) {
    return null;
  }
  if (head.value === target) {
    return head.next;
  }
  let cur = head;
  while (cur.next !== null) {
    if (cur.next.value === target) {
      cur.next = cur.next.next;
      return head;
    }
    cur = cur.next;
  }
  return head;
}

let head = new Node(1);
head.next = new Node(2);
head.next.next = new Node(3);
head = remove(head, 2);
console.log(head.value, head.next.value);`,
        cpp: [`${NODE.cpp}

Node* remove(Node* head, int target) {
    if (head == nullptr) {
        return nullptr;
    }
    if (head->value == target) {
        return head->next;
    }
    Node* cur = head;
    while (cur->next != nullptr) {
        if (cur->next->value == target) {
            cur->next = cur->next->next;
            return head;
        }
        cur = cur->next;
    }
    return head;
}`, `Node* head = new Node(1);
head->next = new Node(2);
head->next->next = new Node(3);
head = remove(head, 2);
cout << head->value << " " << head->next->value << endl;`],
        csharp: [`Node Remove(Node head, int target)
{
    if (head == null)
    {
        return null;
    }
    if (head.Value == target)
    {
        return head.Next;
    }
    Node cur = head;
    while (cur.Next != null)
    {
        if (cur.Next.Value == target)
        {
            cur.Next = cur.Next.Next;
            return head;
        }
        cur = cur.Next;
    }
    return head;
}

Node head = new Node(1);
head.Next = new Node(2);
head.Next.Next = new Node(3);
head = Remove(head, 2);
Console.WriteLine(head.Value + " " + head.Next.Value);`, NODE.csharp],
        java: [`static Node remove(Node head, int target) {
    if (head == null) {
        return null;
    }
    if (head.value == target) {
        return head.next;
    }
    Node cur = head;
    while (cur.next != null) {
        if (cur.next.value == target) {
            cur.next = cur.next.next;
            return head;
        }
        cur = cur.next;
    }
    return head;
}`, `Node head = new Node(1);
head.next = new Node(2);
head.next.next = new Node(3);
head = remove(head, 2);
System.out.println(head.value + " " + head.next.value);`, NODE.java],
      }),
      ...outTerm(['4 -> 3 -> 2 -> 1', '7', '(empty)'], [
        bodyLacks('reverse', /\bNode\s*\(/, () => 'The order is right, but you built new nodes. Turn the links of the nodes you already have around instead.'),
        bodyHas('reverse', { python: /\.next\s*=[^=]/, javascript: /\.next\s*=[^=]/, cpp: /->\s*next\s*=[^=]/, csharp: /\.Next\s*=[^=]/, java: /\.next\s*=[^=]/ }, () => 'Reverse the list by changing the links: point each node back at the one before it.'),
      ], 'Every link turns around and the path leads the other way. Reversing a linked list is a classic interview question, and you just did it.'),
      gate: 'C',
    },
    dsa_nodes4: {
      title: 'The Sorting Tree',
      desc: (ctx) => {
        const L = ctx.lang === 'csharp' ? 'Left' : 'left', R = ctx.lang === 'csharp' ? 'Right' : 'right';
        return `<p>A great tree keeps its values in order. Each ${code('TreeNode')} has a value and two links, ${code(L)} and ${code(R)}. It's a <b>binary search tree</b>: everything in a node's left branch is smaller than it, and everything in its right branch is bigger (or equal).</p>
        <p>Finish two functions:</p>
        <ul><li>${code(tn('insert', ctx) + '(root, value)')}: if root is ${code(NUL[ctx.lang])}, return a new node. Otherwise insert into the left branch if the value is smaller than root's value, else into the right branch, and return root. Store what the recursive call returns: ${code((ctx.lang === 'cpp' ? 'root->' : 'root.') + L + ' = ' + tn('insert', ctx) + '(...)')}.</li>
        <li>${code(tn('contains', ctx) + '(root, value)')}: walk down from the root, going left or right, and say whether the value is in the tree.</li></ul>
        <p>The tree is built from 8, 3, 10, 1, 6, 14, 4, 7, 13. The test lines should print ${code('3')}, ${code('10')}, ${code('6')}, then ${code('6 yes')}, ${code('13 yes')}, ${code('1 yes')}, ${code('5 no')} and ${code('20 no')}.</p>`;
      },
      starter: programs({
        python: `${TREE.python}

def insert(root, value):
    if root is None:
        return TreeNode(value)
    # smaller values go into the left branch, the rest into the right
    return root

def contains(root, value):
    # walk down from the root, going left or right
    return False

root = None
for v in [8, 3, 10, 1, 6, 14, 4, 7, 13]:
    root = insert(root, v)
print(root.left.value)
print(root.right.value)
print(root.left.right.value)
for target in [6, 13, 1, 5, 20]:
    print(target, "yes" if contains(root, target) else "no")`,
        javascript: `${TREE.javascript}

function insert(root, value) {
  if (root === null) {
    return new TreeNode(value);
  }
  // smaller values go into the left branch, the rest into the right
  return root;
}

function contains(root, value) {
  // walk down from the root, going left or right
  return false;
}

let root = null;
for (const v of [8, 3, 10, 1, 6, 14, 4, 7, 13]) {
  root = insert(root, v);
}
console.log(root.left.value);
console.log(root.right.value);
console.log(root.left.right.value);
for (const target of [6, 13, 1, 5, 20]) {
  console.log(target, contains(root, target) ? "yes" : "no");
}`,
        cpp: [`${TREE.cpp}

TreeNode* insert(TreeNode* root, int value) {
    if (root == nullptr) {
        return new TreeNode(value);
    }
    // smaller values go into the left branch, the rest into the right
    return root;
}

bool contains(TreeNode* root, int value) {
    // walk down from the root, going left or right
    return false;
}`, `TreeNode* root = nullptr;
vector<int> values = {8, 3, 10, 1, 6, 14, 4, 7, 13};
for (int v : values) {
    root = insert(root, v);
}
cout << root->left->value << endl;
cout << root->right->value << endl;
cout << root->left->right->value << endl;
vector<int> targets = {6, 13, 1, 5, 20};
for (int target : targets) {
    cout << target << " " << (contains(root, target) ? "yes" : "no") << endl;
}`],
        csharp: [`TreeNode Insert(TreeNode root, int value)
{
    if (root == null)
    {
        return new TreeNode(value);
    }
    // smaller values go into the left branch, the rest into the right
    return root;
}

bool Contains(TreeNode root, int value)
{
    // walk down from the root, going left or right
    return false;
}

TreeNode root = null;
foreach (int v in new int[] { 8, 3, 10, 1, 6, 14, 4, 7, 13 })
{
    root = Insert(root, v);
}
Console.WriteLine(root.Left.Value);
Console.WriteLine(root.Right.Value);
Console.WriteLine(root.Left.Right.Value);
foreach (int target in new int[] { 6, 13, 1, 5, 20 })
{
    Console.WriteLine(target + " " + (Contains(root, target) ? "yes" : "no"));
}`, TREE.csharp],
        java: [`static TreeNode insert(TreeNode root, int value) {
    if (root == null) {
        return new TreeNode(value);
    }
    // smaller values go into the left branch, the rest into the right
    return root;
}

static boolean contains(TreeNode root, int value) {
    // walk down from the root, going left or right
    return false;
}`, `TreeNode root = null;
int[] values = {8, 3, 10, 1, 6, 14, 4, 7, 13};
for (int v : values) {
    root = insert(root, v);
}
System.out.println(root.left.value);
System.out.println(root.right.value);
System.out.println(root.left.right.value);
int[] targets = {6, 13, 1, 5, 20};
for (int target : targets) {
    System.out.println(target + " " + (contains(root, target) ? "yes" : "no"));
}`, TREE.java],
      }),
      hints: byLang(l => {
        const a = l === 'cpp' ? 'root->' : 'root.', L = l === 'csharp' ? 'Left' : 'left', R = l === 'csharp' ? 'Right' : 'right', V = l === 'csharp' ? 'Value' : 'value';
        return [`In insert: if value < ${a}${V}, then ${a}${L} = ${Lang.testName('insert', l)}(${a}${L}, value). Otherwise do the same on the right.`, `In contains: ${NUL[l]} means not found. If the value equals ${a}${V} it's found; otherwise search only the left or only the right branch.`];
      }),
      similar: sims('Find the smallest value in a binary search tree: keep going left.', {
        python: `${TREE.python}

def smallest(root):
    node = root
    while node.left is not None:
        node = node.left
    return node.value

root = TreeNode(8)
root.left = TreeNode(3)
root.left.left = TreeNode(1)
print(smallest(root))`,
        javascript: `${TREE.javascript}

function smallest(root) {
  let node = root;
  while (node.left !== null) {
    node = node.left;
  }
  return node.value;
}

const root = new TreeNode(8);
root.left = new TreeNode(3);
root.left.left = new TreeNode(1);
console.log(smallest(root));`,
        cpp: [`${TREE.cpp}

int smallest(TreeNode* root) {
    TreeNode* node = root;
    while (node->left != nullptr) {
        node = node->left;
    }
    return node->value;
}`, `TreeNode* root = new TreeNode(8);
root->left = new TreeNode(3);
root->left->left = new TreeNode(1);
cout << smallest(root) << endl;`],
        csharp: [`int Smallest(TreeNode root)
{
    TreeNode node = root;
    while (node.Left != null)
    {
        node = node.Left;
    }
    return node.Value;
}

TreeNode root = new TreeNode(8);
root.Left = new TreeNode(3);
root.Left.Left = new TreeNode(1);
Console.WriteLine(Smallest(root));`, TREE.csharp],
        java: [`static int smallest(TreeNode root) {
    TreeNode node = root;
    while (node.left != null) {
        node = node.left;
    }
    return node.value;
}`, `TreeNode root = new TreeNode(8);
root.left = new TreeNode(3);
root.left.left = new TreeNode(1);
System.out.println(smallest(root));`, TREE.java],
      }),
      ...outTerm(['3', '10', '6', '6 yes', '13 yes', '1 yes', '5 no', '20 no'], [],
        'Every value finds its branch. Searching a balanced tree like this takes O(log n) steps, just like binary search.'),
      gate: 'D',
    },
    dsa_nodes5: {
      title: 'The Sorted Walk',
      desc: (ctx) => {
        const L = ctx.lang === 'csharp' ? 'Left' : 'left', R = ctx.lang === 'csharp' ? 'Right' : 'right';
        return `<p>At the heart of the woods, the great tree is built from 50, 30, 70, 20, 40, 60, 80, 35 (your ${code(tn('insert', ctx))} is in the starter). Finish two recursive functions:</p>
        <ul><li>${code(tn('in_order', ctx) + '(node)')} prints every value in the tree, one per line, in <b>sorted</b> order. The trick: print everything in the ${code(L)} branch first, then the node itself, then everything in the ${code(R)} branch. An empty tree prints nothing.</li>
        <li>${code(tn('height', ctx) + '(node)')} returns how many nodes are on the longest path from the node down to a leaf. An empty tree has height 0, a single node has height 1.</li></ul>
        <p>The test lines should print 20, 30, 35, 40, 50, 60, 70, 80, then the heights 4, 0 and 1.</p>`;
      },
      starter: programs({
        python: `${TREE.python}

${INSERT.python}

def in_order(node):
    if node is None:
        return
    # 1. the left branch, 2. this node, 3. the right branch
    print(node.value)

def height(node):
    # an empty tree has height 0
    return 0

root = None
for v in [50, 30, 70, 20, 40, 60, 80, 35]:
    root = insert(root, v)
in_order(root)
print(height(root))
print(height(None))
print(height(TreeNode(1)))`,
        javascript: `${TREE.javascript}

${INSERT.javascript}

function inOrder(node) {
  if (node === null) {
    return;
  }
  // 1. the left branch, 2. this node, 3. the right branch
  console.log(node.value);
}

function height(node) {
  // an empty tree has height 0
  return 0;
}

let root = null;
for (const v of [50, 30, 70, 20, 40, 60, 80, 35]) {
  root = insert(root, v);
}
inOrder(root);
console.log(height(root));
console.log(height(null));
console.log(height(new TreeNode(1)));`,
        cpp: [`${TREE.cpp}

${INSERT.cpp}

void in_order(TreeNode* node) {
    if (node == nullptr) {
        return;
    }
    // 1. the left branch, 2. this node, 3. the right branch
    cout << node->value << endl;
}

int height(TreeNode* node) {
    // an empty tree has height 0
    return 0;
}`, `TreeNode* root = nullptr;
vector<int> values = {50, 30, 70, 20, 40, 60, 80, 35};
for (int v : values) {
    root = insert(root, v);
}
in_order(root);
cout << height(root) << endl;
cout << height(nullptr) << endl;
cout << height(new TreeNode(1)) << endl;`],
        csharp: [`${INSERT.csharp}

void InOrder(TreeNode node)
{
    if (node == null)
    {
        return;
    }
    // 1. the left branch, 2. this node, 3. the right branch
    Console.WriteLine(node.Value);
}

int Height(TreeNode node)
{
    // an empty tree has height 0
    return 0;
}

TreeNode root = null;
foreach (int v in new int[] { 50, 30, 70, 20, 40, 60, 80, 35 })
{
    root = Insert(root, v);
}
InOrder(root);
Console.WriteLine(Height(root));
Console.WriteLine(Height(null));
Console.WriteLine(Height(new TreeNode(1)));`, TREE.csharp],
        java: [`${INSERT.java}

static void inOrder(TreeNode node) {
    if (node == null) {
        return;
    }
    // 1. the left branch, 2. this node, 3. the right branch
    System.out.println(node.value);
}

static int height(TreeNode node) {
    // an empty tree has height 0
    return 0;
}`, `TreeNode root = null;
int[] values = {50, 30, 70, 20, 40, 60, 80, 35};
for (int v : values) {
    root = insert(root, v);
}
inOrder(root);
System.out.println(height(root));
System.out.println(height(null));
System.out.println(height(new TreeNode(1)));`, TREE.java],
      }),
      hints: byLang(l => {
        const a = l === 'cpp' ? 'node->' : 'node.', L = l === 'csharp' ? 'Left' : 'left', R = l === 'csharp' ? 'Right' : 'right';
        const io = Lang.testName('in_order', l), h = Lang.testName('height', l);
        const mx = { python: 'max(a, b)', javascript: 'Math.max(a, b)', cpp: 'max(a, b)', csharp: 'Math.Max(a, b)', java: 'Math.max(a, b)' }[l];
        return [`In ${io}: call ${io}(${a}${L}) before printing and ${io}(${a}${R}) after.`, `In ${h}: if node is ${NUL[l]} return 0. Otherwise it's 1 plus the bigger of the two branch heights. ${mx} gives the bigger of two numbers.`];
      }),
      similar: sims('Add up every value in a tree, recursively.', {
        python: `${TREE.python}

def tree_sum(node):
    if node is None:
        return 0
    return node.value + tree_sum(node.left) + tree_sum(node.right)

root = TreeNode(5)
root.left = TreeNode(2)
root.right = TreeNode(9)
print(tree_sum(root))`,
        javascript: `${TREE.javascript}

function treeSum(node) {
  if (node === null) {
    return 0;
  }
  return node.value + treeSum(node.left) + treeSum(node.right);
}

const root = new TreeNode(5);
root.left = new TreeNode(2);
root.right = new TreeNode(9);
console.log(treeSum(root));`,
        cpp: [`${TREE.cpp}

int tree_sum(TreeNode* node) {
    if (node == nullptr) {
        return 0;
    }
    return node->value + tree_sum(node->left) + tree_sum(node->right);
}`, `TreeNode* root = new TreeNode(5);
root->left = new TreeNode(2);
root->right = new TreeNode(9);
cout << tree_sum(root) << endl;`],
        csharp: [`int TreeSum(TreeNode node)
{
    if (node == null)
    {
        return 0;
    }
    return node.Value + TreeSum(node.Left) + TreeSum(node.Right);
}

TreeNode root = new TreeNode(5);
root.Left = new TreeNode(2);
root.Right = new TreeNode(9);
Console.WriteLine(TreeSum(root));`, TREE.csharp],
        java: [`static int treeSum(TreeNode node) {
    if (node == null) {
        return 0;
    }
    return node.value + treeSum(node.left) + treeSum(node.right);
}`, `TreeNode root = new TreeNode(5);
root.left = new TreeNode(2);
root.right = new TreeNode(9);
System.out.println(treeSum(root));`, TREE.java],
      }),
      ...outTerm(['20', '30', '35', '40', '50', '60', '70', '80', '4', '0', '1'], [recursive('in_order')],
        'Left, middle, right: the tree reads out in perfect order. That\'s an <b>in-order traversal</b>.'),
      gate: 'E',
    },

    // ============================================================ 8. Graphs
    dsa_graph1: {
      title: 'Counting Lanes',
      desc: (ctx) => `<p>The station map is an <b>adjacency list</b>: a map from each station to a list of its neighbours. Lanes go both ways, so a lane between A and B shows up twice: B is in A's list, and A is in B's list.</p>
        <pre>{ "A": ["B", "C"], "B": ["A"], "C": ["A"] }   →   2 lanes</pre>
        <p>Write ${code(tn('count_edges', ctx) + '(graph)')} that returns how many lanes (edges) there are.</p>
        ${sig(ctx, { cpp: 'int count_edges(map<string, vector<string>> graph)', csharp: 'int CountEdges(Dictionary<string, List<string>> graph)', java: 'static int countEdges(HashMap<String, ArrayList<String>> graph)' })}`,
      starter: programs({
        python: `def count_edges(graph):
    total = 0
    # add up the length of every neighbour list
    # (each lane is counted twice, once from each end)
    return total

${SMALL.python}
print(count_edges(graph))`,
        javascript: `function countEdges(graph) {
  let total = 0;
  // add up the length of every neighbour list
  // (each lane is counted twice, once from each end)
  return total;
}

${SMALL.javascript}
console.log(countEdges(graph));`,
        cpp: [`int count_edges(map<string, vector<string>> graph) {
    int total = 0;
    // add up the size of every neighbour list
    // (each lane is counted twice, once from each end)
    return total;
}`, `${SMALL.cpp}
cout << count_edges(graph) << endl;`],
        csharp: [`int CountEdges(Dictionary<string, List<string>> graph)
{
    int total = 0;
    // add up the size of every neighbour list
    // (each lane is counted twice, once from each end)
    return total;
}

${SMALL.csharp}
Console.WriteLine(CountEdges(graph));`],
        java: [`static int countEdges(HashMap<String, ArrayList<String>> graph) {
    int total = 0;
    // add up the size of every neighbour list
    // (each lane is counted twice, once from each end)
    return total;
}`, `${SMALL.java}
System.out.println(countEdges(graph));`],
      }),
      hints: {
        python: ['for node in graph: gives you every station. len(graph[node]) is how many neighbours it has.', 'Every lane was counted twice, so divide the total by 2 at the end (use //).'],
        javascript: ['for (const node in graph) gives you every station. graph[node].length is how many neighbours it has.', 'Every lane was counted twice, so divide the total by 2 at the end.'],
        cpp: ['for (auto& entry : graph) gives you every station: entry.first is its name and entry.second its neighbour list.', 'Every lane was counted twice, so divide the total by 2 at the end.'],
        csharp: ['foreach (var entry in graph) gives you every station: entry.Key is its name and entry.Value its neighbour list.', 'Every lane was counted twice, so divide the total by 2 at the end.'],
        java: ['for (String node : graph.keySet()) gives you every station. graph.get(node).size() is how many neighbours it has.', 'Every lane was counted twice, so divide the total by 2 at the end.'],
      },
      similar: sims('Count the stations that have no lanes at all.', {
        python: `def loners(graph):
    count = 0
    for node in graph:
        if len(graph[node]) == 0:
            count += 1
    return count

${SMALL.python}
print(loners(graph))`,
        javascript: `function loners(graph) {
  let count = 0;
  for (const node in graph) {
    if (graph[node].length === 0) {
      count++;
    }
  }
  return count;
}

${SMALL.javascript}
console.log(loners(graph));`,
        cpp: [`int loners(map<string, vector<string>> graph) {
    int count = 0;
    for (auto& entry : graph) {
        if (entry.second.size() == 0) {
            count++;
        }
    }
    return count;
}`, `${SMALL.cpp}
cout << loners(graph) << endl;`],
        csharp: [`int Loners(Dictionary<string, List<string>> graph)
{
    int count = 0;
    foreach (var entry in graph)
    {
        if (entry.Value.Count == 0)
        {
            count++;
        }
    }
    return count;
}

${SMALL.csharp}
Console.WriteLine(Loners(graph));`],
        java: [`static int loners(HashMap<String, ArrayList<String>> graph) {
    int count = 0;
    for (String node : graph.keySet()) {
        if (graph.get(node).size() == 0) {
            count++;
        }
    }
    return count;
}`, `${SMALL.java}
System.out.println(loners(graph));`],
      }),
      ...fnTerm('count_edges', [[[G1], 6], [[{ A: ['B'], B: ['A'] }], 1], [[{ X: [] }], 0], [[TRI], 3], [[{}], 0]], [],
        'Six lanes on the big map. The galaxy is a graph, and you can read it.'),
      gate: 'A',
    },
    dsa_graph2: {
      title: 'Is There a Way?',
      desc: (ctx) => `<p>Some stations are cut off from others. Write ${code(tn('has_path', ctx) + '(graph, start, goal)')} that returns whether you can travel from ${code('start')} to ${code('goal')} along the lanes.</p>
        <p>Use <b>depth-first search</b> with a to-do stack: start with just ${code('start')} on it. Take the top station off. If it's the goal, you're done. If you've already seen it, skip it. Otherwise mark it as seen and push all its neighbours. If the stack runs empty, there is no way.</p>
        <pre>${tn('has_path', ctx)}(graph, "A", "E")  →  ${(ctx.lang === 'python' ? 'True' : 'true')}\n${tn('has_path', ctx)}(graph, "A", "F")  →  ${(ctx.lang === 'python' ? 'False' : 'false')}</pre>
        ${sig(ctx, { cpp: 'bool has_path(map<string, vector<string>> graph, string start, string goal)', csharp: 'bool HasPath(Dictionary<string, List<string>> graph, string start, string goal)', java: 'static boolean hasPath(HashMap<String, ArrayList<String>> graph, String start, String goal)' })}`,
      starter: programs({
        python: `def has_path(graph, start, goal):
    seen = set()
    todo = [start]
    # take a station off the top of todo:
    # the goal? return True. seen it? skip it.
    # otherwise mark it as seen and add its neighbours to todo
    return False

${SMALL.python}
print(has_path(graph, "A", "D"))`,
        javascript: `function hasPath(graph, start, goal) {
  const seen = new Set();
  const todo = [start];
  // take a station off the top of todo:
  // the goal? return true. seen it? skip it.
  // otherwise mark it as seen and add its neighbours to todo
  return false;
}

${SMALL.javascript}
console.log(hasPath(graph, "A", "D"));`,
        cpp: [`bool has_path(map<string, vector<string>> graph, string start, string goal) {
    map<string, bool> seen;
    vector<string> todo = {start};
    // take a station off the back of todo:
    // the goal? return true. seen it? skip it.
    // otherwise mark it as seen and add its neighbours to todo
    return false;
}`, `${SMALL.cpp}
cout << has_path(graph, "A", "D") << endl;`],
        csharp: [`bool HasPath(Dictionary<string, List<string>> graph, string start, string goal)
{
    Dictionary<string, bool> seen = new Dictionary<string, bool>();
    List<string> todo = new List<string> { start };
    // take a station off the end of todo:
    // the goal? return true. seen it? skip it.
    // otherwise mark it as seen and add its neighbours to todo
    return false;
}

${SMALL.csharp}
Console.WriteLine(HasPath(graph, "A", "D"));`],
        java: [`static boolean hasPath(HashMap<String, ArrayList<String>> graph, String start, String goal) {
    HashMap<String, Boolean> seen = new HashMap<>();
    ArrayList<String> todo = new ArrayList<>();
    todo.add(start);
    // take a station off the end of todo:
    // the goal? return true. seen it? skip it.
    // otherwise mark it as seen and add its neighbours to todo
    return false;
}`, `${SMALL.java}
System.out.println(hasPath(graph, "A", "D"));`],
      }),
      hints: {
        python: ['Loop while todo: and take the top station with node = todo.pop().', 'Mark it with seen.add(node), then todo.append(...) each neighbour in graph[node].'],
        javascript: ['Loop while (todo.length > 0) and take the top station with const node = todo.pop();', 'Mark it with seen.add(node), then todo.push(...) each neighbour in graph[node].'],
        cpp: ['Loop while (!todo.empty()). Take the last station with string node = todo.back(); then todo.pop_back();', 'seen.count(node) tells you if you\'ve seen it. Mark it with seen[node] = true, then push_back each neighbour in graph[node].'],
        csharp: ['Loop while (todo.Count > 0). Take the last station with string node = todo[todo.Count - 1]; then todo.RemoveAt(todo.Count - 1);', 'seen.ContainsKey(node) tells you if you\'ve seen it. Mark it with seen[node] = true, then Add each neighbour in graph[node].'],
        java: ['Loop while (!todo.isEmpty()). String node = todo.remove(todo.size() - 1); takes the last station off.', 'seen.containsKey(node) tells you if you\'ve seen it. Mark it with seen.put(node, true), then add each neighbour in graph.get(node).'],
      },
      similar: sims('Count how many stations you can reach from a start station (including the start).', {
        python: `def count_reachable(graph, start):
    seen = {start}
    todo = [start]
    while todo:
        node = todo.pop()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                todo.append(nxt)
    return len(seen)

${SMALL.python}
print(count_reachable(graph, "A"))`,
        javascript: `function countReachable(graph, start) {
  const seen = new Set([start]);
  const todo = [start];
  while (todo.length > 0) {
    const node = todo.pop();
    for (const next of graph[node]) {
      if (!seen.has(next)) {
        seen.add(next);
        todo.push(next);
      }
    }
  }
  return seen.size;
}

${SMALL.javascript}
console.log(countReachable(graph, "A"));`,
        cpp: [`int count_reachable(map<string, vector<string>> graph, string start) {
    map<string, bool> seen;
    seen[start] = true;
    vector<string> todo = {start};
    while (!todo.empty()) {
        string node = todo.back();
        todo.pop_back();
        for (string next : graph[node]) {
            if (!seen.count(next)) {
                seen[next] = true;
                todo.push_back(next);
            }
        }
    }
    return seen.size();
}`, `${SMALL.cpp}
cout << count_reachable(graph, "A") << endl;`],
        csharp: [`int CountReachable(Dictionary<string, List<string>> graph, string start)
{
    Dictionary<string, bool> seen = new Dictionary<string, bool>();
    seen[start] = true;
    List<string> todo = new List<string> { start };
    while (todo.Count > 0)
    {
        string node = todo[todo.Count - 1];
        todo.RemoveAt(todo.Count - 1);
        foreach (string next in graph[node])
        {
            if (!seen.ContainsKey(next))
            {
                seen[next] = true;
                todo.Add(next);
            }
        }
    }
    return seen.Count;
}

${SMALL.csharp}
Console.WriteLine(CountReachable(graph, "A"));`],
        java: [`static int countReachable(HashMap<String, ArrayList<String>> graph, String start) {
    HashMap<String, Boolean> seen = new HashMap<>();
    seen.put(start, true);
    ArrayList<String> todo = new ArrayList<>();
    todo.add(start);
    while (!todo.isEmpty()) {
        String node = todo.remove(todo.size() - 1);
        for (String next : graph.get(node)) {
            if (!seen.containsKey(next)) {
                seen.put(next, true);
                todo.add(next);
            }
        }
    }
    return seen.size();
}`, `${SMALL.java}
System.out.println(countReachable(graph, "A"));`],
      }),
      ...fnTerm('has_path', [[[G1, 'A', 'E'], true], [[G1, 'A', 'F'], false], [[G1, 'F', 'G'], true], [[G1, 'H', 'H'], true], [[G1, 'E', 'A'], true], [[G1, 'H', 'A'], false], [[G1, 'G', 'D'], false]], [],
        'Your search finds every way through, and knows when there is none.'),
      gate: 'B',
    },
    dsa_graph3: {
      title: 'The Fewest Hops',
      desc: (ctx) => `<p>Fuel is short. Write ${code(tn('shortest_path', ctx) + '(graph, start, goal)')} that returns the <b>fewest lanes</b> you need to travel from ${code('start')} to ${code('goal')}: 0 if they are the same station, and -1 if there is no way at all.</p>
        <p>Use <b>breadth-first search</b>: a queue that starts with ${code('start')}, and a ${code('dist')} map that says how far each station you've found is (start is 0). Take stations from the <b>front</b> of the queue. Each neighbour you haven't found yet gets a distance one bigger and goes to the back of the queue. BFS finds stations in order of distance, so the first time you reach the goal, that's the shortest way.</p>
        <pre>${tn('shortest_path', ctx)}(graph, "A", "E")  →  3\n${tn('shortest_path', ctx)}(graph, "A", "G")  →  -1</pre>
        ${sig(ctx, { cpp: 'int shortest_path(map<string, vector<string>> graph, string start, string goal)', csharp: 'int ShortestPath(Dictionary<string, List<string>> graph, string start, string goal)', java: 'static int shortestPath(HashMap<String, ArrayList<String>> graph, String start, String goal)' })}`,
      starter: programs({
        python: `def shortest_path(graph, start, goal):
    dist = {start: 0}
    queue = [start]
    # take stations from the front of the queue (queue.pop(0));
    # each neighbour that isn't in dist yet is one step further away
    return -1

${SMALL.python}
print(shortest_path(graph, "C", "D"))`,
        javascript: `function shortestPath(graph, start, goal) {
  const dist = { [start]: 0 };
  const queue = [start];
  // take stations from the front of the queue (queue.shift());
  // each neighbour that isn't in dist yet is one step further away
  return -1;
}

${SMALL.javascript}
console.log(shortestPath(graph, "C", "D"));`,
        cpp: [`int shortest_path(map<string, vector<string>> graph, string start, string goal) {
    map<string, int> dist;
    dist[start] = 0;
    queue<string> q;
    q.push(start);
    // take stations from the front of the queue (q.front(), then q.pop());
    // each neighbour that isn't in dist yet is one step further away
    return -1;
}`, `${SMALL.cpp}
cout << shortest_path(graph, "C", "D") << endl;`],
        csharp: [`int ShortestPath(Dictionary<string, List<string>> graph, string start, string goal)
{
    Dictionary<string, int> dist = new Dictionary<string, int>();
    dist[start] = 0;
    Queue<string> queue = new Queue<string>();
    queue.Enqueue(start);
    // take stations from the front of the queue (queue.Dequeue());
    // each neighbour that isn't in dist yet is one step further away
    return -1;
}

${SMALL.csharp}
Console.WriteLine(ShortestPath(graph, "C", "D"));`],
        java: [`static int shortestPath(HashMap<String, ArrayList<String>> graph, String start, String goal) {
    HashMap<String, Integer> dist = new HashMap<>();
    dist.put(start, 0);
    Queue<String> queue = new LinkedList<>();
    queue.add(start);
    // take stations from the front of the queue (queue.poll());
    // each neighbour that isn't in dist yet is one step further away
    return -1;
}`, `${SMALL.java}
System.out.println(shortestPath(graph, "C", "D"));`],
      }),
      hints: ['Loop while the queue is not empty. Take the front station. If it is the goal, return its distance.', 'For each neighbour not in dist yet: its distance is the current station\'s distance + 1, and it joins the back of the queue. If the loop ends, return -1.'],
      similar: sims('Find how far away the farthest station you can reach is.', {
        python: `def farthest(graph, start):
    dist = {start: 0}
    queue = [start]
    best = 0
    while queue:
        node = queue.pop(0)
        best = max(best, dist[node])
        for nxt in graph[node]:
            if nxt not in dist:
                dist[nxt] = dist[node] + 1
                queue.append(nxt)
    return best

${SMALL.python}
print(farthest(graph, "C"))`,
        javascript: `function farthest(graph, start) {
  const dist = { [start]: 0 };
  const queue = [start];
  let best = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    best = Math.max(best, dist[node]);
    for (const next of graph[node]) {
      if (!(next in dist)) {
        dist[next] = dist[node] + 1;
        queue.push(next);
      }
    }
  }
  return best;
}

${SMALL.javascript}
console.log(farthest(graph, "C"));`,
        cpp: [`int farthest(map<string, vector<string>> graph, string start) {
    map<string, int> dist;
    dist[start] = 0;
    queue<string> q;
    q.push(start);
    int best = 0;
    while (!q.empty()) {
        string node = q.front();
        q.pop();
        best = max(best, dist[node]);
        for (string next : graph[node]) {
            if (!dist.count(next)) {
                dist[next] = dist[node] + 1;
                q.push(next);
            }
        }
    }
    return best;
}`, `${SMALL.cpp}
cout << farthest(graph, "C") << endl;`],
        csharp: [`int Farthest(Dictionary<string, List<string>> graph, string start)
{
    Dictionary<string, int> dist = new Dictionary<string, int>();
    dist[start] = 0;
    Queue<string> queue = new Queue<string>();
    queue.Enqueue(start);
    int best = 0;
    while (queue.Count > 0)
    {
        string node = queue.Dequeue();
        best = Math.Max(best, dist[node]);
        foreach (string next in graph[node])
        {
            if (!dist.ContainsKey(next))
            {
                dist[next] = dist[node] + 1;
                queue.Enqueue(next);
            }
        }
    }
    return best;
}

${SMALL.csharp}
Console.WriteLine(Farthest(graph, "C"));`],
        java: [`static int farthest(HashMap<String, ArrayList<String>> graph, String start) {
    HashMap<String, Integer> dist = new HashMap<>();
    dist.put(start, 0);
    Queue<String> queue = new LinkedList<>();
    queue.add(start);
    int best = 0;
    while (!queue.isEmpty()) {
        String node = queue.poll();
        best = Math.max(best, dist.get(node));
        for (String next : graph.get(node)) {
            if (!dist.containsKey(next)) {
                dist.put(next, dist.get(node) + 1);
                queue.add(next);
            }
        }
    }
    return best;
}`, `${SMALL.java}
System.out.println(farthest(graph, "C"));`],
      }),
      ...fnTerm('shortest_path', [[[G1, 'A', 'E'], 3], [[G1, 'A', 'A'], 0], [[G1, 'A', 'D'], 2], [[G1, 'E', 'C'], 2], [[G1, 'A', 'G'], -1], [[G1, 'F', 'G'], 1], [[G1, 'H', 'B'], -1]], [],
        'Ring by ring, your search spreads out and finds the shortest route first. That\'s <b>BFS</b>.'),
      gate: 'C',
    },
    dsa_graph4: {
      title: 'Island Count',
      desc: (ctx) => `<p>A space map shows land ${code('#')} and void ${code('.')}. Land cells that touch up, down, left or right belong to the same island (corners don't count). Write ${code(tn('count_islands', ctx) + '(grid)')} that returns how many islands there are.</p>
        <pre>##..#\n#...#      →  3 islands\n..#..</pre>
        <p>A grid is a graph too: each cell is a node, and its neighbours are the 4 cells around it. Go over every cell. When you find land, count one island, then <b>sink</b> the whole island: a recursive ${code(tn('sink', ctx))} turns the cell into ${code('.')} and sinks its 4 neighbours, stopping at the edge or at void. Sunk land can't be counted twice. The starter makes a copy of the grid you can change.</p>
        ${sig(ctx, { cpp: 'int count_islands(vector<string> grid)', csharp: 'int CountIslands(List<string> grid)', java: 'static int countIslands(ArrayList<String> grid)' })}`,
      starter: programs({
        python: `def sink(cells, r, c):
    # stop if (r, c) is off the grid or isn't land
    # otherwise turn it into "." and sink its 4 neighbours
    return

def count_islands(grid):
    cells = [list(row) for row in grid]   # a copy you can change
    count = 0
    # look at every cell; for each "#" you find,
    # count an island and sink it
    return count

print(count_islands(["##..#", "#...#", "..#.."]))`,
        javascript: `function sink(cells, r, c) {
  // stop if (r, c) is off the grid or isn't land
  // otherwise turn it into "." and sink its 4 neighbours
}

function countIslands(grid) {
  const cells = grid.map(row => row.split(""));   // a copy you can change
  let count = 0;
  // look at every cell; for each "#" you find,
  // count an island and sink it
  return count;
}

console.log(countIslands(["##..#", "#...#", "..#.."]));`,
        cpp: [`void sink(vector<string>& cells, int r, int c) {
    // stop if (r, c) is off the grid or isn't land
    // otherwise turn it into '.' and sink its 4 neighbours
}

int count_islands(vector<string> grid) {
    vector<string> cells = grid;   // a copy you can change
    int count = 0;
    // look at every cell; for each '#' you find,
    // count an island and sink it
    return count;
}`, `cout << count_islands({"##..#", "#...#", "..#.."}) << endl;`],
        csharp: [`void Sink(char[][] cells, int r, int c)
{
    // stop if (r, c) is off the grid or isn't land
    // otherwise turn it into '.' and sink its 4 neighbours
}

int CountIslands(List<string> grid)
{
    char[][] cells = new char[grid.Count][];   // a copy you can change
    for (int r = 0; r < grid.Count; r++)
    {
        cells[r] = grid[r].ToCharArray();
    }
    int count = 0;
    // look at every cell; for each '#' you find,
    // count an island and sink it
    return count;
}

Console.WriteLine(CountIslands(new List<string> { "##..#", "#...#", "..#.." }));`],
        java: [`static void sink(char[][] cells, int r, int c) {
    // stop if (r, c) is off the grid or isn't land
    // otherwise turn it into '.' and sink its 4 neighbours
}

static int countIslands(ArrayList<String> grid) {
    char[][] cells = new char[grid.size()][];   // a copy you can change
    for (int r = 0; r < grid.size(); r++) {
        cells[r] = grid.get(r).toCharArray();
    }
    int count = 0;
    // look at every cell; for each '#' you find,
    // count an island and sink it
    return count;
}`, `System.out.println(countIslands(new ArrayList<>(List.of("##..#", "#...#", "..#.."))));`],
      }),
      hints: byLang(l => {
        const s = Lang.testName('sink', l);
        const rows = { python: 'len(cells)', javascript: 'cells.length', cpp: 'cells.size()', csharp: 'cells.Length', java: 'cells.length' }[l];
        return [`In ${s}: return straight away if r < 0, c < 0, r >= ${rows}, c is past the end of the row, or the cell isn't '#'.`, `Otherwise set the cell to '.' and call ${s} four times: (r + 1, c), (r - 1, c), (r, c + 1) and (r, c - 1).`];
      }),
      similar: sims('Find the size of the island that the cell (r, c) is part of.', {
        python: `def island_size(cells, r, c):
    if r < 0 or c < 0 or r >= len(cells) or c >= len(cells[0]):
        return 0
    if cells[r][c] != "#":
        return 0
    cells[r][c] = "."
    return 1 + island_size(cells, r + 1, c) + island_size(cells, r - 1, c) + island_size(cells, r, c + 1) + island_size(cells, r, c - 1)

cells = [list(row) for row in ["##.", "#..", "..#"]]
print(island_size(cells, 0, 0))`,
        javascript: `function islandSize(cells, r, c) {
  if (r < 0 || c < 0 || r >= cells.length || c >= cells[0].length) {
    return 0;
  }
  if (cells[r][c] !== "#") {
    return 0;
  }
  cells[r][c] = ".";
  return 1 + islandSize(cells, r + 1, c) + islandSize(cells, r - 1, c) + islandSize(cells, r, c + 1) + islandSize(cells, r, c - 1);
}

const cells = ["##.", "#..", "..#"].map(row => row.split(""));
console.log(islandSize(cells, 0, 0));`,
        cpp: [`int island_size(vector<string>& cells, int r, int c) {
    if (r < 0 || c < 0 || r >= cells.size() || c >= cells[0].size()) {
        return 0;
    }
    if (cells[r][c] != '#') {
        return 0;
    }
    cells[r][c] = '.';
    return 1 + island_size(cells, r + 1, c) + island_size(cells, r - 1, c) + island_size(cells, r, c + 1) + island_size(cells, r, c - 1);
}`, `vector<string> cells = {"##.", "#..", "..#"};
cout << island_size(cells, 0, 0) << endl;`],
        csharp: [`int IslandSize(char[][] cells, int r, int c)
{
    if (r < 0 || c < 0 || r >= cells.Length || c >= cells[0].Length)
    {
        return 0;
    }
    if (cells[r][c] != '#')
    {
        return 0;
    }
    cells[r][c] = '.';
    return 1 + IslandSize(cells, r + 1, c) + IslandSize(cells, r - 1, c) + IslandSize(cells, r, c + 1) + IslandSize(cells, r, c - 1);
}

char[][] cells = { "##.".ToCharArray(), "#..".ToCharArray(), "..#".ToCharArray() };
Console.WriteLine(IslandSize(cells, 0, 0));`],
        java: [`static int islandSize(char[][] cells, int r, int c) {
    if (r < 0 || c < 0 || r >= cells.length || c >= cells[0].length) {
        return 0;
    }
    if (cells[r][c] != '#') {
        return 0;
    }
    cells[r][c] = '.';
    return 1 + islandSize(cells, r + 1, c) + islandSize(cells, r - 1, c) + islandSize(cells, r, c + 1) + islandSize(cells, r, c - 1);
}`, `char[][] cells = { "##.".toCharArray(), "#..".toCharArray(), "..#".toCharArray() };
System.out.println(islandSize(cells, 0, 0));`],
      }),
      ...fnTerm('count_islands', [[[['##..#', '#...#', '..#..', '.....']], 3], [[['.....']], 0], [[['#']], 1], [[['#.#.#', '.#.#.', '#.#.#']], 8], [[['###', '#.#', '###']], 1], [[['##', '##']], 1], [[['#..#', '....', '.##.', '#..#']], 5]], [],
        'Every island counted once and sunk. That flood fill is <b>depth-first search</b> on a grid.'),
      gate: 'D',
    },
    dsa_graph5: {
      title: 'Escape the Big O',
      desc: (ctx) => `<p>The Big O has locked you in its maze. Write ${code(tn('escape_maze', ctx) + '(grid)')} that returns the <b>fewest steps</b> from ${code('S')} to the exit ${code('E')}, moving up, down, left or right. ${code('#')} is a wall and ${code('.')} is open floor. If the exit can't be reached, return -1.</p>
        <pre>S.#\n..#      →  4\n#.E</pre>
        <p>This takes everything at once: find the S with a loop, run <b>BFS</b> with a <b>queue</b> of cells (row and column), and keep a distance for every cell you've found (a 2D grid of distances filled with -1, or a hash map). A grid cell's neighbours are the 4 cells around it, if they are inside the grid and not a wall.</p>
        ${sig(ctx, { cpp: 'int escape_maze(vector<string> grid)', csharp: 'int EscapeMaze(List<string> grid)', java: 'static int escapeMaze(ArrayList<String> grid)' })}`,
      starter: programs({
        python: `def escape_maze(grid):
    rows = len(grid)
    cols = len(grid[0])
    # 1. find the S
    # 2. BFS from it: a queue of (row, col) cells and a dist map
    # 3. return the distance when you reach the E, or -1 if you never do
    return -1

maze = [
    "S.#",
    "..#",
    "#.E",
]
print(escape_maze(maze))`,
        javascript: `function escapeMaze(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  // 1. find the S
  // 2. BFS from it: a queue of [row, col] cells and a grid of distances
  // 3. return the distance when you reach the E, or -1 if you never do
  return -1;
}

const maze = [
  "S.#",
  "..#",
  "#.E",
];
console.log(escapeMaze(maze));`,
        cpp: [`int escape_maze(vector<string> grid) {
    int rows = grid.size();
    int cols = grid[0].size();
    // 1. find the S
    // 2. BFS from it: a queue<vector<int>> of {row, col} cells
    //    and vector<vector<int>> dist(rows, vector<int>(cols, -1))
    // 3. return the distance when you reach the E, or -1 if you never do
    return -1;
}`, `vector<string> maze = {
    "S.#",
    "..#",
    "#.E",
};
cout << escape_maze(maze) << endl;`],
        csharp: [`int EscapeMaze(List<string> grid)
{
    int rows = grid.Count;
    int cols = grid[0].Length;
    // 1. find the S
    // 2. BFS from it: a Queue<int[]> of { row, col } cells
    //    and an int[][] of distances that start at -1
    // 3. return the distance when you reach the E, or -1 if you never do
    return -1;
}

List<string> maze = new List<string>
{
    "S.#",
    "..#",
    "#.E",
};
Console.WriteLine(EscapeMaze(maze));`],
        java: [`static int escapeMaze(ArrayList<String> grid) {
    int rows = grid.size();
    int cols = grid.get(0).length();
    // 1. find the S
    // 2. BFS from it: a Queue<int[]> of {row, col} cells
    //    and an int[rows][cols] of distances that start at -1
    // 3. return the distance when you reach the E, or -1 if you never do
    return -1;
}`, `ArrayList<String> maze = new ArrayList<>(List.of(
    "S.#",
    "..#",
    "#.E"
));
System.out.println(escapeMaze(maze));`],
      }),
      hints: ['Two arrays make the 4 neighbours easy: row steps {1, -1, 0, 0} and column steps {0, 0, 1, -1}.', 'A neighbour joins the queue only if it is inside the grid, is not a wall, and has no distance yet. Its distance is the current cell\'s distance + 1.'],
      similar: sims('Count how many open cells you can reach from the top-left corner of a grid, using BFS.', {
        python: `def reachable_cells(grid):
    rows = len(grid)
    cols = len(grid[0])
    seen = {(0, 0)}
    queue = [(0, 0)]
    while queue:
        r, c = queue.pop(0)
        for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc))
    return len(seen)

print(reachable_cells(["..#", "#..", "##."]))`,
        javascript: `function reachableCells(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = grid.map(row => Array(row.length).fill(false));
  seen[0][0] = true;
  const queue = [[0, 0]];
  let count = 1;
  const dr = [1, -1, 0, 0];
  const dc = [0, 0, 1, -1];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (let i = 0; i < 4; i++) {
      const nr = r + dr[i];
      const nc = c + dc[i];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== "#" && !seen[nr][nc]) {
        seen[nr][nc] = true;
        count++;
        queue.push([nr, nc]);
      }
    }
  }
  return count;
}

console.log(reachableCells(["..#", "#..", "##."]));`,
        cpp: [`int reachable_cells(vector<string> grid) {
    int rows = grid.size();
    int cols = grid[0].size();
    vector<vector<bool>> seen(rows, vector<bool>(cols, false));
    seen[0][0] = true;
    queue<vector<int>> q;
    q.push({0, 0});
    int count = 1;
    int dr[] = {1, -1, 0, 0};
    int dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        vector<int> cell = q.front();
        q.pop();
        for (int i = 0; i < 4; i++) {
            int nr = cell[0] + dr[i];
            int nc = cell[1] + dc[i];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] != '#' && !seen[nr][nc]) {
                seen[nr][nc] = true;
                count++;
                q.push({nr, nc});
            }
        }
    }
    return count;
}`, `cout << reachable_cells({"..#", "#..", "##."}) << endl;`],
        csharp: [`int ReachableCells(List<string> grid)
{
    int rows = grid.Count;
    int cols = grid[0].Length;
    bool[][] seen = new bool[rows][];
    for (int r = 0; r < rows; r++)
    {
        seen[r] = new bool[cols];
    }
    seen[0][0] = true;
    Queue<int[]> queue = new Queue<int[]>();
    queue.Enqueue(new int[] { 0, 0 });
    int count = 1;
    int[] dr = { 1, -1, 0, 0 };
    int[] dc = { 0, 0, 1, -1 };
    while (queue.Count > 0)
    {
        int[] cell = queue.Dequeue();
        for (int i = 0; i < 4; i++)
        {
            int nr = cell[0] + dr[i];
            int nc = cell[1] + dc[i];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] != '#' && !seen[nr][nc])
            {
                seen[nr][nc] = true;
                count++;
                queue.Enqueue(new int[] { nr, nc });
            }
        }
    }
    return count;
}

Console.WriteLine(ReachableCells(new List<string> { "..#", "#..", "##." }));`],
        java: [`static int reachableCells(ArrayList<String> grid) {
    int rows = grid.size();
    int cols = grid.get(0).length();
    boolean[][] seen = new boolean[rows][cols];
    seen[0][0] = true;
    Queue<int[]> queue = new LinkedList<>();
    queue.add(new int[] {0, 0});
    int count = 1;
    int[] dr = {1, -1, 0, 0};
    int[] dc = {0, 0, 1, -1};
    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        for (int i = 0; i < 4; i++) {
            int nr = cell[0] + dr[i];
            int nc = cell[1] + dc[i];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid.get(nr).charAt(nc) != '#' && !seen[nr][nc]) {
                seen[nr][nc] = true;
                count++;
                queue.add(new int[] {nr, nc});
            }
        }
    }
    return count;
}`, `System.out.println(reachableCells(new ArrayList<>(List.of("..#", "#..", "##."))));`],
      }),
      ...fnTerm('escape_maze', [
        [[['S.#', '..#', '#.E']], 4],
        [[['SE']], 1],
        [[['S#E']], -1],
        [[['....', '.S..', '...E']], 3],
        [[['S.#..', '###..', '....E']], -1],
        [[['S...#....', '.##.#.##.', '.#..#..#.', '.#.###.#.', '.......#E']], 22],
        [[['#####', '#E..#', '###.#', '#S..#', '#####']], 6],
      ], [],
        'You walk out of the maze by the shortest route there is. Queues, hash maps, grids and BFS, all in one function. <b>The Big O is waiting.</b>'),
      gate: 'E',
    },
  };

  // ================================================================ tutorials
  const page = (title, body, codeByLang) => ({ title, body, code: codeByLang });
  const tutorials = {
    dsa_recur: [
      page('A function that calls itself',
        `<p>A <b>recursive</b> function calls itself to solve a smaller copy of the same problem. Every recursive function needs two parts:</p>
        <ul><li>a <b>base case</b>: an input so small that the answer is obvious, so the function stops right there;</li><li>a <b>recursive case</b>: the function calls itself with a smaller input.</li></ul>
        <p>Here the base case is 0. Without it the countdown would go on forever.</p>`,
        programs({
          python: `def countdown(n):
    if n == 0:
        print("Liftoff!")
        return
    print(n)
    countdown(n - 1)

countdown(3)`,
          javascript: `function countdown(n) {
  if (n === 0) {
    console.log("Liftoff!");
    return;
  }
  console.log(n);
  countdown(n - 1);
}

countdown(3);`,
          cpp: [`void countdown(int n) {
    if (n == 0) {
        cout << "Liftoff!" << endl;
        return;
    }
    cout << n << endl;
    countdown(n - 1);
}`, `countdown(3);`],
          csharp: [`void Countdown(int n)
{
    if (n == 0)
    {
        Console.WriteLine("Liftoff!");
        return;
    }
    Console.WriteLine(n);
    Countdown(n - 1);
}

Countdown(3);`],
          java: [`static void countdown(int n) {
    if (n == 0) {
        System.out.println("Liftoff!");
        return;
    }
    System.out.println(n);
    countdown(n - 1);
}`, `countdown(3);`],
        })),
      page('Answers on the way back',
        `<p>A recursive function can also <b>return</b> an answer built from the smaller answer.</p>
        <p>To work out sum_to(4), it asks for 4 + sum_to(3). That asks for 3 + sum_to(2), and so on down to sum_to(0), which simply returns 0. Then the answers add up on the way back: 0, 1, 3, 6, 10.</p>
        <p>The trick is to trust the smaller call: assume sum_to(n − 1) already works, and only think about the one step on top.</p>`,
        programs({
          python: `def sum_to(n):
    if n == 0:
        return 0
    return n + sum_to(n - 1)

print(sum_to(4))
print(sum_to(10))`,
          javascript: `function sumTo(n) {
  if (n === 0) {
    return 0;
  }
  return n + sumTo(n - 1);
}

console.log(sumTo(4));
console.log(sumTo(10));`,
          cpp: [`int sum_to(int n) {
    if (n == 0) {
        return 0;
    }
    return n + sum_to(n - 1);
}`, `cout << sum_to(4) << endl;
cout << sum_to(10) << endl;`],
          csharp: [`int SumTo(int n)
{
    if (n == 0)
    {
        return 0;
    }
    return n + SumTo(n - 1);
}

Console.WriteLine(SumTo(4));
Console.WriteLine(SumTo(10));`],
          java: [`static int sumTo(int n) {
    if (n == 0) {
        return 0;
    }
    return n + sumTo(n - 1);
}`, `System.out.println(sumTo(4));
System.out.println(sumTo(10));`],
        })),
      page('The call stack',
        `<p>Each call waits for the call it made to finish before it carries on. The waiting calls pile up on the <b>call stack</b>: the same last-in, first-out stack from the Stacks & Queues level. That's why "up" comes out in the opposite order to "down".</p>
        <p>If recursion never reaches its base case, the stack keeps growing until the program crashes with a <b>stack overflow</b> (Python calls it a RecursionError). Every call also uses a little memory, so a recursion that goes thousands of levels deep is a problem even when it is correct.</p>`,
        programs({
          python: `def dive(n):
    if n == 0:
        print("bottom")
        return
    print("down", n)
    dive(n - 1)
    print("up", n)

dive(3)`,
          javascript: `function dive(n) {
  if (n === 0) {
    console.log("bottom");
    return;
  }
  console.log("down", n);
  dive(n - 1);
  console.log("up", n);
}

dive(3);`,
          cpp: [`void dive(int n) {
    if (n == 0) {
        cout << "bottom" << endl;
        return;
    }
    cout << "down " << n << endl;
    dive(n - 1);
    cout << "up " << n << endl;
}`, `dive(3);`],
          csharp: [`void Dive(int n)
{
    if (n == 0)
    {
        Console.WriteLine("bottom");
        return;
    }
    Console.WriteLine("down " + n);
    Dive(n - 1);
    Console.WriteLine("up " + n);
}

Dive(3);`],
          java: [`static void dive(int n) {
    if (n == 0) {
        System.out.println("bottom");
        return;
    }
    System.out.println("down " + n);
    dive(n - 1);
    System.out.println("up " + n);
}`, `dive(3);`],
        })),
      page('Remembering answers',
        `<p>The Fibonacci numbers go 0, 1, 1, 2, 3, 5, 8, ...: each is the sum of the two before. The plain recursive version, fib(n − 1) + fib(n − 2), asks for the same answers over and over. Run this and look at the call counts.</p>
        <p>The fix is a <b>memo</b>: a hash map from input to answer. Check it before doing any work, and save each new answer in it. Now every fib(k) is worked out only once. This is called <b>memoization</b>, and it turns an exponential O(2ⁿ) function into an O(n) one.</p>`,
        programs({
          python: `calls = 0

def slow_fib(n):
    global calls
    calls += 1
    if n <= 1:
        return n
    return slow_fib(n - 1) + slow_fib(n - 2)

memo = {}

def fast_fib(n):
    global calls
    calls += 1
    if n <= 1:
        return n
    if n in memo:
        return memo[n]
    memo[n] = fast_fib(n - 1) + fast_fib(n - 2)
    return memo[n]

print(slow_fib(20), "took", calls, "calls")
calls = 0
print(fast_fib(20), "took", calls, "calls")`,
          javascript: `let calls = 0;

function slowFib(n) {
  calls++;
  if (n <= 1) {
    return n;
  }
  return slowFib(n - 1) + slowFib(n - 2);
}

const memo = {};

function fastFib(n) {
  calls++;
  if (n <= 1) {
    return n;
  }
  if (n in memo) {
    return memo[n];
  }
  memo[n] = fastFib(n - 1) + fastFib(n - 2);
  return memo[n];
}

console.log(slowFib(20), "took", calls, "calls");
calls = 0;
console.log(fastFib(20), "took", calls, "calls");`,
          cpp: [`int calls = 0;
map<int, int> memo;

int slow_fib(int n) {
    calls++;
    if (n <= 1) {
        return n;
    }
    return slow_fib(n - 1) + slow_fib(n - 2);
}

int fast_fib(int n) {
    calls++;
    if (n <= 1) {
        return n;
    }
    if (memo.count(n)) {
        return memo[n];
    }
    memo[n] = fast_fib(n - 1) + fast_fib(n - 2);
    return memo[n];
}`, `cout << slow_fib(20) << " took " << calls << " calls" << endl;
calls = 0;
cout << fast_fib(20) << " took " << calls << " calls" << endl;`],
          csharp: [`int calls = 0;
Dictionary<int, int> memo = new Dictionary<int, int>();

int SlowFib(int n)
{
    calls++;
    if (n <= 1)
    {
        return n;
    }
    return SlowFib(n - 1) + SlowFib(n - 2);
}

int FastFib(int n)
{
    calls++;
    if (n <= 1)
    {
        return n;
    }
    if (memo.ContainsKey(n))
    {
        return memo[n];
    }
    memo[n] = FastFib(n - 1) + FastFib(n - 2);
    return memo[n];
}

Console.WriteLine(SlowFib(20) + " took " + calls + " calls");
calls = 0;
Console.WriteLine(FastFib(20) + " took " + calls + " calls");`],
          java: [`static int calls = 0;
static HashMap<Integer, Integer> memo = new HashMap<>();

static int slowFib(int n) {
    calls++;
    if (n <= 1) {
        return n;
    }
    return slowFib(n - 1) + slowFib(n - 2);
}

static int fastFib(int n) {
    calls++;
    if (n <= 1) {
        return n;
    }
    if (memo.containsKey(n)) {
        return memo.get(n);
    }
    memo.put(n, fastFib(n - 1) + fastFib(n - 2));
    return memo.get(n);
}`, `System.out.println(slowFib(20) + " took " + calls + " calls");
calls = 0;
System.out.println(fastFib(20) + " took " + calls + " calls");`],
        })),
      page('Recursion on lists',
        `<p>Recursion works on lists too. The total of a whole list is its first item plus the total of the rest. Here the index i marks where "the rest" begins, and the base case is an empty rest (i has reached the end), which adds up to 0.</p>
        <p>Many problems split like this: one small step, plus the same problem on what's left.</p>`,
        programs({
          python: `def total(nums, i):
    if i == len(nums):
        return 0
    return nums[i] + total(nums, i + 1)

print(total([4, 8, 15, 16], 0))`,
          javascript: `function total(nums, i) {
  if (i === nums.length) {
    return 0;
  }
  return nums[i] + total(nums, i + 1);
}

console.log(total([4, 8, 15, 16], 0));`,
          cpp: [`int total(vector<int>& nums, int i) {
    if (i == nums.size()) {
        return 0;
    }
    return nums[i] + total(nums, i + 1);
}`, `vector<int> nums = {4, 8, 15, 16};
cout << total(nums, 0) << endl;`],
          csharp: [`int Total(List<int> nums, int i)
{
    if (i == nums.Count)
    {
        return 0;
    }
    return nums[i] + Total(nums, i + 1);
}

Console.WriteLine(Total(new List<int> { 4, 8, 15, 16 }, 0));`],
          java: [`static int total(int[] nums, int i) {
    if (i == nums.length) {
        return 0;
    }
    return nums[i] + total(nums, i + 1);
}`, `int[] nums = {4, 8, 15, 16};
System.out.println(total(nums, 0));`],
        })),
    ],
    dsa_sort: [
      page('Swapping two items',
        `<p>Most sorting is built from one move: <b>swapping</b> two items. You need a temporary variable to hold one of them, or it gets overwritten before you can move it.</p>`,
        programs({
          python: `nums = [9, 4, 7]
temp = nums[0]
nums[0] = nums[2]
nums[2] = temp
print(nums)

# Python can also swap in one line:
nums[0], nums[1] = nums[1], nums[0]
print(nums)`,
          javascript: `const nums = [9, 4, 7];
const temp = nums[0];
nums[0] = nums[2];
nums[2] = temp;
console.log(nums.join(", "));

// JavaScript can also swap in one line:
[nums[0], nums[1]] = [nums[1], nums[0]];
console.log(nums.join(", "));`,
          cpp: ['', `vector<int> nums = {9, 4, 7};
int temp = nums[0];
nums[0] = nums[2];
nums[2] = temp;
for (int x : nums) {
    cout << x << " ";
}
cout << endl;`],
          csharp: [`List<int> nums = new List<int> { 9, 4, 7 };
int temp = nums[0];
nums[0] = nums[2];
nums[2] = temp;
Console.WriteLine(string.Join(", ", nums));`],
          java: ['', `ArrayList<Integer> nums = new ArrayList<>(List.of(9, 4, 7));
int temp = nums.get(0);
nums.set(0, nums.get(2));
nums.set(2, temp);
System.out.println(nums);`],
        })),
      page('Bubble sort',
        `<p><b>Bubble sort</b> walks along the list comparing neighbours, and swaps any pair that is in the wrong order. This code does <b>one pass</b>. Watch the 8: the biggest number bubbles all the way to the end.</p>
        <p>After one pass the biggest number is in its final place. After a second pass, the second biggest is too. So n − 1 passes sort the whole list.</p>`,
        programs({
          python: `nums = [5, 1, 8, 4, 2]
for i in range(len(nums) - 1):
    if nums[i] > nums[i + 1]:
        nums[i], nums[i + 1] = nums[i + 1], nums[i]
    print(nums)`,
          javascript: `const nums = [5, 1, 8, 4, 2];
for (let i = 0; i < nums.length - 1; i++) {
  if (nums[i] > nums[i + 1]) {
    const temp = nums[i];
    nums[i] = nums[i + 1];
    nums[i + 1] = temp;
  }
  console.log(nums.join(", "));
}`,
          cpp: ['', `vector<int> nums = {5, 1, 8, 4, 2};
for (int i = 0; i < nums.size() - 1; i++) {
    if (nums[i] > nums[i + 1]) {
        int temp = nums[i];
        nums[i] = nums[i + 1];
        nums[i + 1] = temp;
    }
    for (int x : nums) {
        cout << x << " ";
    }
    cout << endl;
}`],
          csharp: [`List<int> nums = new List<int> { 5, 1, 8, 4, 2 };
for (int i = 0; i < nums.Count - 1; i++)
{
    if (nums[i] > nums[i + 1])
    {
        int temp = nums[i];
        nums[i] = nums[i + 1];
        nums[i + 1] = temp;
    }
    Console.WriteLine(string.Join(", ", nums));
}`],
          java: ['', `ArrayList<Integer> nums = new ArrayList<>(List.of(5, 1, 8, 4, 2));
for (int i = 0; i < nums.size() - 1; i++) {
    if (nums.get(i) > nums.get(i + 1)) {
        int temp = nums.get(i);
        nums.set(i, nums.get(i + 1));
        nums.set(i + 1, temp);
    }
    System.out.println(nums);
}`],
        })),
      page('Insertion sort',
        `<p><b>Insertion sort</b> works like sorting playing cards in your hand. The left part of the list is already sorted. Take the next card and slide it left, past every bigger card, until it fits.</p>
        <p>This code adds one card, the 4, to a sorted hand. Insertion sort does this for every card in turn. It's fast when the list is already nearly sorted, because each card only slides a little.</p>`,
        programs({
          python: `hand = [2, 5, 9]
hand.append(4)
i = len(hand) - 1
while i > 0 and hand[i - 1] > hand[i]:
    hand[i - 1], hand[i] = hand[i], hand[i - 1]
    i -= 1
    print(hand)`,
          javascript: `const hand = [2, 5, 9];
hand.push(4);
let i = hand.length - 1;
while (i > 0 && hand[i - 1] > hand[i]) {
  const temp = hand[i - 1];
  hand[i - 1] = hand[i];
  hand[i] = temp;
  i--;
  console.log(hand.join(", "));
}`,
          cpp: ['', `vector<int> hand = {2, 5, 9};
hand.push_back(4);
int i = hand.size() - 1;
while (i > 0 && hand[i - 1] > hand[i]) {
    int temp = hand[i - 1];
    hand[i - 1] = hand[i];
    hand[i] = temp;
    i--;
    for (int x : hand) {
        cout << x << " ";
    }
    cout << endl;
}`],
          csharp: [`List<int> hand = new List<int> { 2, 5, 9 };
hand.Add(4);
int i = hand.Count - 1;
while (i > 0 && hand[i - 1] > hand[i])
{
    int temp = hand[i - 1];
    hand[i - 1] = hand[i];
    hand[i] = temp;
    i--;
    Console.WriteLine(string.Join(", ", hand));
}`],
          java: ['', `ArrayList<Integer> hand = new ArrayList<>(List.of(2, 5, 9));
hand.add(4);
int i = hand.size() - 1;
while (i > 0 && hand.get(i - 1) > hand.get(i)) {
    int temp = hand.get(i - 1);
    hand.set(i - 1, hand.get(i));
    hand.set(i, temp);
    i--;
    System.out.println(hand);
}`],
        })),
      page('Two pointers',
        `<p>When two lists are both sorted, you can walk through them together with two indexes, i and j. Each step moves the index that points at the smaller number. Nothing is ever looked at twice, so it takes at most len(a) + len(b) steps.</p>
        <p>This code finds the numbers both lists share. <b>Merging</b> two sorted lists uses the same walk: compare the two front numbers and move the smaller one into the result. When one list runs out, copy what's left of the other.</p>`,
        programs({
          python: `a = [1, 3, 4, 7, 9]
b = [2, 3, 7, 8, 9]
i = 0
j = 0
while i < len(a) and j < len(b):
    if a[i] == b[j]:
        print("both have", a[i])
        i += 1
        j += 1
    elif a[i] < b[j]:
        i += 1
    else:
        j += 1`,
          javascript: `const a = [1, 3, 4, 7, 9];
const b = [2, 3, 7, 8, 9];
let i = 0;
let j = 0;
while (i < a.length && j < b.length) {
  if (a[i] === b[j]) {
    console.log("both have", a[i]);
    i++;
    j++;
  } else if (a[i] < b[j]) {
    i++;
  } else {
    j++;
  }
}`,
          cpp: ['', `vector<int> a = {1, 3, 4, 7, 9};
vector<int> b = {2, 3, 7, 8, 9};
int i = 0;
int j = 0;
while (i < a.size() && j < b.size()) {
    if (a[i] == b[j]) {
        cout << "both have " << a[i] << endl;
        i++;
        j++;
    } else if (a[i] < b[j]) {
        i++;
    } else {
        j++;
    }
}`],
          csharp: [`List<int> a = new List<int> { 1, 3, 4, 7, 9 };
List<int> b = new List<int> { 2, 3, 7, 8, 9 };
int i = 0;
int j = 0;
while (i < a.Count && j < b.Count)
{
    if (a[i] == b[j])
    {
        Console.WriteLine("both have " + a[i]);
        i++;
        j++;
    }
    else if (a[i] < b[j])
    {
        i++;
    }
    else
    {
        j++;
    }
}`],
          java: ['', `ArrayList<Integer> a = new ArrayList<>(List.of(1, 3, 4, 7, 9));
ArrayList<Integer> b = new ArrayList<>(List.of(2, 3, 7, 8, 9));
int i = 0;
int j = 0;
while (i < a.size() && j < b.size()) {
    int x = a.get(i);
    int y = b.get(j);
    if (x == y) {
        System.out.println("both have " + x);
        i++;
        j++;
    } else if (x < y) {
        i++;
    } else {
        j++;
    }
}`],
        })),
      page('Fast and slow sorts',
        `<p>Bubble sort and insertion sort compare items in pairs, about n × n steps for n items: <b>O(n²)</b>.</p>
        <p><b>Merge sort</b> is smarter. Split the list in half, sort each half (with merge sort!), then merge the two sorted halves. A list of 0 or 1 items is already sorted: that's the base case. Halving n items takes about log₂ n levels, and the merging on each level costs about n steps, so merge sort is <b>O(n log n)</b>.</p>
        <p>The code below compares the two for growing lists. At 10,000 items it's 100 million steps against about 130 thousand.</p>`,
        programs({
          python: `for n in [10, 100, 1000, 10000]:
    levels = 0
    m = n
    while m > 1:
        m = m // 2
        levels += 1
    print(n, "items:", n * n, "vs", n * levels)`,
          javascript: `for (const n of [10, 100, 1000, 10000]) {
  let levels = 0;
  for (let m = n; m > 1; m = Math.floor(m / 2)) {
    levels++;
  }
  console.log(n, "items:", n * n, "vs", n * levels);
}`,
          cpp: ['', `vector<int> sizes = {10, 100, 1000, 10000};
for (int n : sizes) {
    int levels = 0;
    for (int m = n; m > 1; m = m / 2) {
        levels++;
    }
    cout << n << " items: " << n * n << " vs " << n * levels << endl;
}`],
          csharp: [`foreach (int n in new int[] { 10, 100, 1000, 10000 })
{
    int levels = 0;
    for (int m = n; m > 1; m = m / 2)
    {
        levels++;
    }
    Console.WriteLine(n + " items: " + n * n + " vs " + n * levels);
}`],
          java: ['', `int[] sizes = {10, 100, 1000, 10000};
for (int n : sizes) {
    int levels = 0;
    for (int m = n; m > 1; m = m / 2) {
        levels++;
    }
    System.out.println(n + " items: " + n * n + " vs " + n * levels);
}`],
        })),
    ],
    dsa_nodes: [
      page('Nodes and links',
        byLang(l => `<p>A <b>linked list</b> is a chain of small objects called <b>nodes</b>. Each node stores a value and a link to the next node. The last node links to nothing (${code(NUL[l])}). The first node is the <b>head</b>: hold on to it and you can reach the whole list.</p>` +
          ({ cpp: `<p>In C++ the link is a <b>pointer</b>, ${code('Node*')}. You make nodes with ${code('new')}, follow a pointer with ${code('->')}, and ${code('nullptr')} means "points nowhere".</p>`, csharp: `<p>In C# a class variable already holds a reference to an object, so ${code('Node Next')} is a link, and ${code('null')} means "no node".</p>`, java: `<p>In Java a class variable already holds a reference to an object, so ${code('Node next')} is a link, and ${code('null')} means "no node".</p>` }[l] || '')),
        programs({
          python: `${NODE.python}

head = Node(3)
head.next = Node(8)
head.next.next = Node(5)

print(head.value)
print(head.next.value)
print(head.next.next.value)
if head.next.next.next is None:
    print("end of the list")`,
          javascript: `${NODE.javascript}

const head = new Node(3);
head.next = new Node(8);
head.next.next = new Node(5);

console.log(head.value);
console.log(head.next.value);
console.log(head.next.next.value);
if (head.next.next.next === null) {
  console.log("end of the list");
}`,
          cpp: [NODE.cpp, `Node* head = new Node(3);
head->next = new Node(8);
head->next->next = new Node(5);

cout << head->value << endl;
cout << head->next->value << endl;
cout << head->next->next->value << endl;
if (head->next->next->next == nullptr) {
    cout << "end of the list" << endl;
}`],
          csharp: [`Node head = new Node(3);
head.Next = new Node(8);
head.Next.Next = new Node(5);

Console.WriteLine(head.Value);
Console.WriteLine(head.Next.Value);
Console.WriteLine(head.Next.Next.Value);
if (head.Next.Next.Next == null)
{
    Console.WriteLine("end of the list");
}`, NODE.csharp],
          java: ['', `Node head = new Node(3);
head.next = new Node(8);
head.next.next = new Node(5);

System.out.println(head.value);
System.out.println(head.next.value);
System.out.println(head.next.next.value);
if (head.next.next.next == null) {
    System.out.println("end of the list");
}`, NODE.java],
        })),
      page('Walking a list',
        `<p>An array lets you jump straight to any index. A linked list doesn't: to reach the 100th node you start at the head and follow 99 links. So finding something is <b>O(n)</b>.</p>
        <p>The usual walk keeps a pointer ${code('cur')}: start at the head, do something with the node, move to the next one, and stop when you fall off the end.</p>`,
        programs({
          python: `${NODE.python}

head = Node(3)
head.next = Node(8)
head.next.next = Node(5)

cur = head
while cur is not None:
    print("visiting", cur.value)
    cur = cur.next
print("done")`,
          javascript: `${NODE.javascript}

const head = new Node(3);
head.next = new Node(8);
head.next.next = new Node(5);

let cur = head;
while (cur !== null) {
  console.log("visiting", cur.value);
  cur = cur.next;
}
console.log("done");`,
          cpp: [NODE.cpp, `Node* head = new Node(3);
head->next = new Node(8);
head->next->next = new Node(5);

Node* cur = head;
while (cur != nullptr) {
    cout << "visiting " << cur->value << endl;
    cur = cur->next;
}
cout << "done" << endl;`],
          csharp: [`Node head = new Node(3);
head.Next = new Node(8);
head.Next.Next = new Node(5);

Node cur = head;
while (cur != null)
{
    Console.WriteLine("visiting " + cur.Value);
    cur = cur.Next;
}
Console.WriteLine("done");`, NODE.csharp],
          java: ['', `Node head = new Node(3);
head.next = new Node(8);
head.next.next = new Node(5);

Node cur = head;
while (cur != null) {
    System.out.println("visiting " + cur.value);
    cur = cur.next;
}
System.out.println("done");`, NODE.java],
        })),
      page('Rewiring links',
        `<p>Where linked lists shine is changing the chain. To add a node at the <b>front</b>, point the new node at the old head, then make the new node the head. Two lines, however long the list is: <b>O(1)</b>. An array would have to shift every item over.</p>
        <p>Here 5, 8 and 3 are each added at the front, so they come out in the opposite order. Changing what a node's link points to is how you insert, remove and reverse.</p>`,
        programs({
          python: `${NODE.python}

head = None
for v in [5, 8, 3]:
    node = Node(v)
    node.next = head
    head = node

cur = head
while cur is not None:
    print(cur.value)
    cur = cur.next`,
          javascript: `${NODE.javascript}

let head = null;
for (const v of [5, 8, 3]) {
  const node = new Node(v);
  node.next = head;
  head = node;
}

for (let cur = head; cur !== null; cur = cur.next) {
  console.log(cur.value);
}`,
          cpp: [NODE.cpp, `Node* head = nullptr;
vector<int> values = {5, 8, 3};
for (int v : values) {
    Node* node = new Node(v);
    node->next = head;
    head = node;
}

for (Node* cur = head; cur != nullptr; cur = cur->next) {
    cout << cur->value << endl;
}`],
          csharp: [`Node head = null;
foreach (int v in new int[] { 5, 8, 3 })
{
    Node node = new Node(v);
    node.Next = head;
    head = node;
}

for (Node cur = head; cur != null; cur = cur.Next)
{
    Console.WriteLine(cur.Value);
}`, NODE.csharp],
          java: ['', `Node head = null;
int[] values = {5, 8, 3};
for (int v : values) {
    Node node = new Node(v);
    node.next = head;
    head = node;
}

for (Node cur = head; cur != null; cur = cur.next) {
    System.out.println(cur.value);
}`, NODE.java],
        })),
      page('Binary search trees',
        `<p>A <b>tree</b> node has links to <i>two</i> children: left and right. In a <b>binary search tree</b> (BST) everything in the left branch is smaller than the node, and everything in the right branch is bigger.</p>
        <p>That rule makes searching quick: at each node, go left if the target is smaller and right if it's bigger. Each step skips a whole branch, so in a balanced tree a search takes about log₂ n steps, like binary search.</p>`,
        programs({
          python: `${TREE.python}

root = TreeNode(8)
root.left = TreeNode(3)
root.right = TreeNode(10)
root.left.right = TreeNode(6)

target = 6
node = root
while node is not None:
    print("visit", node.value)
    if target == node.value:
        print("found it")
        break
    if target < node.value:
        node = node.left
    else:
        node = node.right`,
          javascript: `${TREE.javascript}

const root = new TreeNode(8);
root.left = new TreeNode(3);
root.right = new TreeNode(10);
root.left.right = new TreeNode(6);

const target = 6;
let node = root;
while (node !== null) {
  console.log("visit", node.value);
  if (target === node.value) {
    console.log("found it");
    break;
  }
  node = target < node.value ? node.left : node.right;
}`,
          cpp: [TREE.cpp, `TreeNode* root = new TreeNode(8);
root->left = new TreeNode(3);
root->right = new TreeNode(10);
root->left->right = new TreeNode(6);

int target = 6;
TreeNode* node = root;
while (node != nullptr) {
    cout << "visit " << node->value << endl;
    if (target == node->value) {
        cout << "found it" << endl;
        break;
    }
    if (target < node->value) {
        node = node->left;
    } else {
        node = node->right;
    }
}`],
          csharp: [`TreeNode root = new TreeNode(8);
root.Left = new TreeNode(3);
root.Right = new TreeNode(10);
root.Left.Right = new TreeNode(6);

int target = 6;
TreeNode node = root;
while (node != null)
{
    Console.WriteLine("visit " + node.Value);
    if (target == node.Value)
    {
        Console.WriteLine("found it");
        break;
    }
    if (target < node.Value)
    {
        node = node.Left;
    }
    else
    {
        node = node.Right;
    }
}`, TREE.csharp],
          java: ['', `TreeNode root = new TreeNode(8);
root.left = new TreeNode(3);
root.right = new TreeNode(10);
root.left.right = new TreeNode(6);

int target = 6;
TreeNode node = root;
while (node != null) {
    System.out.println("visit " + node.value);
    if (target == node.value) {
        System.out.println("found it");
        break;
    }
    if (target < node.value) {
        node = node.left;
    } else {
        node = node.right;
    }
}`, TREE.java],
        })),
      page('Recursion on trees',
        `<p>A tree is made of smaller trees, so recursion fits it perfectly. The size of a tree is 1 (the node itself) plus the size of its left branch plus the size of its right branch. An empty tree has size 0: that's the base case.</p>
        <p>The same shape answers lots of questions. The <b>height</b> is 1 plus the bigger of the two branch heights. And an <b>in-order</b> walk (left branch, then the node, then the right branch) visits a BST's values in sorted order.</p>`,
        programs({
          python: `${TREE.python}

def tree_size(node):
    if node is None:
        return 0
    return 1 + tree_size(node.left) + tree_size(node.right)

root = TreeNode(8)
root.left = TreeNode(3)
root.right = TreeNode(10)
root.left.right = TreeNode(6)
print(tree_size(root))
print(tree_size(root.left))
print(tree_size(None))`,
          javascript: `${TREE.javascript}

function treeSize(node) {
  if (node === null) {
    return 0;
  }
  return 1 + treeSize(node.left) + treeSize(node.right);
}

const root = new TreeNode(8);
root.left = new TreeNode(3);
root.right = new TreeNode(10);
root.left.right = new TreeNode(6);
console.log(treeSize(root));
console.log(treeSize(root.left));
console.log(treeSize(null));`,
          cpp: [`${TREE.cpp}

int tree_size(TreeNode* node) {
    if (node == nullptr) {
        return 0;
    }
    return 1 + tree_size(node->left) + tree_size(node->right);
}`, `TreeNode* root = new TreeNode(8);
root->left = new TreeNode(3);
root->right = new TreeNode(10);
root->left->right = new TreeNode(6);
cout << tree_size(root) << endl;
cout << tree_size(root->left) << endl;
cout << tree_size(nullptr) << endl;`],
          csharp: [`int TreeSize(TreeNode node)
{
    if (node == null)
    {
        return 0;
    }
    return 1 + TreeSize(node.Left) + TreeSize(node.Right);
}

TreeNode root = new TreeNode(8);
root.Left = new TreeNode(3);
root.Right = new TreeNode(10);
root.Left.Right = new TreeNode(6);
Console.WriteLine(TreeSize(root));
Console.WriteLine(TreeSize(root.Left));
Console.WriteLine(TreeSize(null));`, TREE.csharp],
          java: [`static int treeSize(TreeNode node) {
    if (node == null) {
        return 0;
    }
    return 1 + treeSize(node.left) + treeSize(node.right);
}`, `TreeNode root = new TreeNode(8);
root.left = new TreeNode(3);
root.right = new TreeNode(10);
root.left.right = new TreeNode(6);
System.out.println(treeSize(root));
System.out.println(treeSize(root.left));
System.out.println(treeSize(null));`, TREE.java],
        })),
    ],
    dsa_graph: [
      page('Nodes and edges',
        `<p>A <b>graph</b> is a set of <b>nodes</b> joined by <b>edges</b>. Friends on a social network, stations on a train map and pages linking to pages are all graphs.</p>
        <p>The usual way to store one is an <b>adjacency list</b>: a hash map from each node to the list of its neighbours. Here the edges go both ways, so if B is in A's list, A is also in B's list.</p>`,
        programs({
          python: `${GRAPH.python}

print("D links to", graph["D"])
for node in graph:
    print(node, "neighbours:", len(graph[node]))`,
          javascript: `${GRAPH.javascript}

console.log("D links to", graph["D"].join(", "));
for (const node in graph) {
  console.log(node, "neighbours:", graph[node].length);
}`,
          cpp: ['', `${GRAPH.cpp}

cout << "D links to";
for (string next : graph["D"]) {
    cout << " " << next;
}
cout << endl;
for (auto& entry : graph) {
    cout << entry.first << " neighbours: " << entry.second.size() << endl;
}`],
          csharp: [`${GRAPH.csharp}

Console.WriteLine("D links to " + string.Join(", ", graph["D"]));
foreach (var entry in graph)
{
    Console.WriteLine(entry.Key + " neighbours: " + entry.Value.Count);
}`],
          java: ['', `${GRAPH.java}

System.out.println("D links to " + graph.get("D"));
for (String node : graph.keySet()) {
    System.out.println(node + " neighbours: " + graph.get(node).size());
}`],
        })),
      page('Breadth-first search',
        `<p><b>Breadth-first search</b> (BFS) explores a graph in rings: first the start, then everything 1 step away, then everything 2 steps away, and so on. A <b>queue</b> keeps that order: take nodes from the front, add newly found neighbours at the back.</p>
        <p>The ${code('dist')} map does two jobs. It remembers how many steps away each node is, and it marks nodes as found so you never queue one twice. Because BFS goes ring by ring, those distances are the <b>shortest</b> possible.</p>`,
        programs({
          python: `${GRAPH.python}

dist = {"A": 0}
queue = ["A"]
while queue:
    node = queue.pop(0)
    print(node, "is at distance", dist[node])
    for nxt in graph[node]:
        if nxt not in dist:
            dist[nxt] = dist[node] + 1
            queue.append(nxt)`,
          javascript: `${GRAPH.javascript}

const dist = { A: 0 };
const queue = ["A"];
while (queue.length > 0) {
  const node = queue.shift();
  console.log(node, "is at distance", dist[node]);
  for (const next of graph[node]) {
    if (!(next in dist)) {
      dist[next] = dist[node] + 1;
      queue.push(next);
    }
  }
}`,
          cpp: ['', `${GRAPH.cpp}

map<string, int> dist;
dist["A"] = 0;
queue<string> q;
q.push("A");
while (!q.empty()) {
    string node = q.front();
    q.pop();
    cout << node << " is at distance " << dist[node] << endl;
    for (string next : graph[node]) {
        if (!dist.count(next)) {
            dist[next] = dist[node] + 1;
            q.push(next);
        }
    }
}`],
          csharp: [`${GRAPH.csharp}

var dist = new Dictionary<string, int>();
dist["A"] = 0;
var queue = new Queue<string>();
queue.Enqueue("A");
while (queue.Count > 0)
{
    string node = queue.Dequeue();
    Console.WriteLine(node + " is at distance " + dist[node]);
    foreach (string next in graph[node])
    {
        if (!dist.ContainsKey(next))
        {
            dist[next] = dist[node] + 1;
            queue.Enqueue(next);
        }
    }
}`],
          java: ['', `${GRAPH.java}

HashMap<String, Integer> dist = new HashMap<>();
dist.put("A", 0);
Queue<String> queue = new LinkedList<>();
queue.add("A");
while (!queue.isEmpty()) {
    String node = queue.poll();
    System.out.println(node + " is at distance " + dist.get(node));
    for (String next : graph.get(node)) {
        if (!dist.containsKey(next)) {
            dist.put(next, dist.get(node) + 1);
            queue.add(next);
        }
    }
}`],
        })),
      page('Depth-first search',
        `<p><b>Depth-first search</b> (DFS) does the opposite: it follows one path as far as it can, then backs up and tries the next branch. Recursion does the backing up for you (or a stack, if you write it with a loop).</p>
        <p>DFS is the tool for "can I get there at all?" and "how many separate pieces are there?". For the <i>shortest</i> route, use BFS.</p>`,
        programs({
          python: `${GRAPH.python}

def dfs(node, seen):
    seen.add(node)
    print("visit", node)
    for nxt in graph[node]:
        if nxt not in seen:
            dfs(nxt, seen)

dfs("A", set())`,
          javascript: `${GRAPH.javascript}

function dfs(node, seen) {
  seen.add(node);
  console.log("visit", node);
  for (const next of graph[node]) {
    if (!seen.has(next)) {
      dfs(next, seen);
    }
  }
}

dfs("A", new Set());`,
          cpp: [`void dfs(map<string, vector<string>>& graph, string node, map<string, bool>& seen) {
    seen[node] = true;
    cout << "visit " << node << endl;
    for (string next : graph[node]) {
        if (!seen.count(next)) {
            dfs(graph, next, seen);
        }
    }
}`, `${GRAPH.cpp}

map<string, bool> seen;
dfs(graph, "A", seen);`],
          csharp: [`${GRAPH.csharp}

void Dfs(string node, Dictionary<string, bool> seen)
{
    seen[node] = true;
    Console.WriteLine("visit " + node);
    foreach (string next in graph[node])
    {
        if (!seen.ContainsKey(next))
        {
            Dfs(next, seen);
        }
    }
}

Dfs("A", new Dictionary<string, bool>());`],
          java: [`static void dfs(HashMap<String, ArrayList<String>> graph, String node, HashMap<String, Boolean> seen) {
    seen.put(node, true);
    System.out.println("visit " + node);
    for (String next : graph.get(node)) {
        if (!seen.containsKey(next)) {
            dfs(graph, next, seen);
        }
    }
}`, `${GRAPH.java}

dfs(graph, "A", new HashMap<>());`],
        })),
      page('Grids are graphs too',
        `<p>A grid of cells is a graph in disguise: each cell is a node, and its neighbours are the cells up, down, left and right of it. Two small arrays of row and column steps make the four neighbours easy to loop over.</p>
        <p>Skip neighbours that fall off the edge of the grid or that are walls. Then BFS and DFS work on grids exactly as they do on any other graph.</p>`,
        programs({
          python: `grid = ["..#.", ".#..", "...."]
r = 1
c = 2
for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
    nr = r + dr
    nc = c + dc
    if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] != "#":
        print("can step to", nr, nc)`,
          javascript: `const grid = ["..#.", ".#..", "...."];
const r = 1;
const c = 2;
const dr = [1, -1, 0, 0];
const dc = [0, 0, 1, -1];
for (let i = 0; i < 4; i++) {
  const nr = r + dr[i];
  const nc = c + dc[i];
  if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && grid[nr][nc] !== "#") {
    console.log("can step to", nr, nc);
  }
}`,
          cpp: ['', `vector<string> grid = {"..#.", ".#..", "...."};
int r = 1;
int c = 2;
int dr[] = {1, -1, 0, 0};
int dc[] = {0, 0, 1, -1};
for (int i = 0; i < 4; i++) {
    int nr = r + dr[i];
    int nc = c + dc[i];
    if (nr >= 0 && nr < grid.size() && nc >= 0 && nc < grid[0].size() && grid[nr][nc] != '#') {
        cout << "can step to " << nr << " " << nc << endl;
    }
}`],
          csharp: [`List<string> grid = new List<string> { "..#.", ".#..", "...." };
int r = 1;
int c = 2;
int[] dr = { 1, -1, 0, 0 };
int[] dc = { 0, 0, 1, -1 };
for (int i = 0; i < 4; i++)
{
    int nr = r + dr[i];
    int nc = c + dc[i];
    if (nr >= 0 && nr < grid.Count && nc >= 0 && nc < grid[0].Length && grid[nr][nc] != '#')
    {
        Console.WriteLine("can step to " + nr + " " + nc);
    }
}`],
          java: ['', `String[] grid = {"..#.", ".#..", "...."};
int r = 1;
int c = 2;
int[] dr = {1, -1, 0, 0};
int[] dc = {0, 0, 1, -1};
for (int i = 0; i < 4; i++) {
    int nr = r + dr[i];
    int nc = c + dc[i];
    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length() && grid[nr].charAt(nc) != '#') {
        System.out.println("can step to " + nr + " " + nc);
    }
}`],
        })),
    ],
  };

  // ================================================================ levels
  const levels = [
    {
      id: 'dsa_recur', name: 'The Echo Caves', topic: 'Recursion', theme: 'cave',
      blurb: 'Functions that call themselves, base cases, the call stack, and a memo that makes slow recursion fast.',
      intro: `<p>Deep under the circuit city lie the Echo Caves. Shout into them and your voice comes back a little smaller, again and again, until it fades out.</p>
        <p>That's <b>recursion</b>: solving a problem by solving a smaller copy of the same problem. Each echo needs a point where it stops, the <b>base case</b>, or it never ends.</p>`,
      tutorial: tutorials.dsa_recur,
      signs: [
        'Every recursive function needs a base case. No base case, no way out.',
        'Trust the smaller call. Assume it works and only think about one step.',
        'Working out the same answer twice? Write it down in a memo.',
      ],
      terminals: ['dsa_recur1', 'dsa_recur2', 'dsa_recur3', 'dsa_recur4', 'dsa_recur5'],
      map: (B) => {
        const m = B.MapBuilder(130, 17);
        m.fill(0, 15, 129, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'climb', 'B');
        m.put(x + 3, 14, '?');
        x = B.TR.tower(m, x + 6);
        x = B.room(m, x, 3, 'bridge', 'C');
        m.put(x + 1, 14, 'K');
        x = B.TR.pit(m, x + 3);
        x = B.room(m, x + 1, 4, 'spikes', 'D');
        m.put(x + 2, 14, 'e');
        x = B.TR.mover(m, x + 4);
        x = B.room(m, x + 1, 5, 'lava', 'E');
        m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
        return m;
      },
    },
    {
      id: 'dsa_sort', name: 'The Sorting Forge', topic: 'Sorting', theme: 'forge',
      blurb: 'Bubble sort, insertion sort, merging, and merge sort, plus why O(n log n) beats O(n²).',
      intro: `<p>The forge turns piles of scrap numbers into neat rows. Sorted data is worth a lot: binary search only works on a sorted list, and many problems get easy once things are in order.</p>
        <p>Every language has a built-in sort, and in real code you should use it. Here you'll build your own, to see how sorting works and why some ways are much faster than others.</p>`,
      tutorial: tutorials.dsa_sort,
      signs: [
        'Bubble sort: swap neighbours that are out of order, pass after pass.',
        'Two sorted lists? Walk them together with two indexes.',
        'Split it, sort the halves, merge them back. That\'s merge sort.',
      ],
      terminals: ['dsa_sort1', 'dsa_sort2', 'dsa_sort3', 'dsa_sort4', 'dsa_sort5'],
      map: (B) => {
        const m = B.MapBuilder(132, 17);
        m.fill(0, 15, 131, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'bridge', 'A');
        x = B.TR.tower(m, x);
        x = B.room(m, x, 2, 'spring', 'B');
        m.put(x + 3, 14, '?');
        x = B.TR.hills(m, x + 6);
        x = B.room(m, x, 3, 'spikes', 'C');
        m.put(x + 1, 14, 'K');
        x = B.TR.mover(m, x + 3);
        x = B.room(m, x + 1, 4, 'climb', 'D');
        m.put(x + 3, 14, 'e');
        x = B.TR.pit(m, x + 7);
        x = B.room(m, x + 1, 5, 'wall', 'E');
        m.put(x + 2, 10, 'w');
        m.put(x + 3, 14, '?'); m.put(x + 7, 14, 'F');
        return m;
      },
    },
    {
      id: 'dsa_nodes', name: 'The Linked Woods', topic: 'Linked Lists & Trees', theme: 'wilds',
      blurb: 'Nodes joined by links: walk, grow and reverse a linked list, then build and search a binary search tree.',
      intro: `<p>In the Linked Woods nothing sits in a neat row. Each lantern only knows where the <b>next</b> one hangs. That's a <b>linked list</b>: a chain of small objects called <b>nodes</b>, each holding a value and a link to the next node.</p>
        <p>Deeper in, the paths split in two at every lantern. Those are <b>trees</b>, and if they're kept in order, they're very fast to search.</p>`,
      tutorial: tutorials.dsa_nodes,
      signs: [
        'Lost the head of the list? Then you\'ve lost the whole list.',
        'To reverse a chain, turn each link around one at a time.',
        'Smaller values to the left, bigger to the right.',
      ],
      terminals: ['dsa_nodes1', 'dsa_nodes2', 'dsa_nodes3', 'dsa_nodes4', 'dsa_nodes5'],
      map: (B) => {
        const m = B.MapBuilder(132, 17);
        m.fill(0, 15, 131, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'climb', 'A');
        m.put(x + 3, 14, '?');
        x = B.TR.hills(m, x + 6);
        x = B.room(m, x, 2, 'lava', 'B');
        x = B.TR.tower(m, x + 1);
        x = B.room(m, x, 3, 'wall', 'C');
        m.put(x + 1, 14, 'K'); m.put(x + 4, 14, 'e');
        x = B.TR.pit(m, x + 7);
        x = B.room(m, x + 1, 4, 'spikes', 'D');
        m.put(x + 3, 10, 'w');
        x = B.TR.mover(m, x + 2);
        x = B.room(m, x + 1, 5, 'bridge', 'E');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
    {
      id: 'dsa_graph', name: 'The Graph Galaxy', topic: 'Graphs', theme: 'neon',
      blurb: 'Adjacency lists, depth-first and breadth-first search, islands on a grid, and the final maze.',
      intro: `<p>The last region is a galaxy of space stations joined by lanes. Some stations link to many others, some to none. A network like this is a <b>graph</b>: <b>nodes</b> (the stations) joined by <b>edges</b> (the lanes).</p>
        <p>Graphs are everywhere: friends on a social network, roads on a map, pages linking to pages. At the centre of the galaxy waits <b>The Big O</b>, which only respects code that is both correct and fast. Everything you've learned comes together here.</p>`,
      tutorial: tutorials.dsa_graph,
      signs: [
        'A hash map of lists: every station and who it links to.',
        'BFS spreads out ring by ring. The first time it reaches a node is the shortest way there.',
        'Queues, hash maps, recursion and search. You\'ve got everything you need.',
      ],
      terminals: ['dsa_graph1', 'dsa_graph2', 'dsa_graph3', 'dsa_graph4', 'dsa_graph5'],
      map: (B) => {
        const m = B.MapBuilder(126, 17);
        m.fill(0, 15, 125, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'spikes', 'A');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 2, 'wall', 'B');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 3, 'spring', 'C');
        m.put(x + 3, 14, '?'); m.put(x + 5, 14, 'K');
        x = B.TR.tower(m, x + 7);
        x = B.room(m, x, 4, 'bridge', 'D');
        m.put(x + 2, 14, 'e');
        x = B.TR.mover(m, x + 4);
        x = B.room(m, x + 1, 5, 'climb', 'E');
        m.put(x + 3, 14, '?'); m.put(x + 8, 14, 'F');
        return m;
      },
    },
  ];

  GD.addCourseLevels('dsa', { challenges, levels });
})(typeof window !== 'undefined' ? window : globalThis);
