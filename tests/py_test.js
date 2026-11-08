const P = require('../js/python.js');
const cases = [
 ['print("Hello, World")', 'Hello, World'],
 ['x = 5\ny = x * 2\nprint(x, y)', '5 10'],
 ['for i in range(3):\n    print(i)', '0\n1\n2'],
 ['n = 0\nwhile n < 3:\n    n += 1\nprint(n)', '3'],
 ['def f(a, b=2):\n    return a + b\nprint(f(1), f(1, b=5))', '3 6'],
 ['class Sword:\n    def __init__(self):\n        self.damage = 3\n    def swing(self):\n        return "Slash"\ns = Sword()\nprint(s.damage, s.swing())', '3 Slash'],
 ['class A:\n    def hi(self):\n        return "A"\nclass B(A):\n    def hi(self):\n        return "B" + super().hi()\nprint(B().hi())', 'BA'],
 ['name = "Ana"\nprint(f"Hi {name}! {1+2:.2f}")', 'Hi Ana! 3.00'],
 ['s = "hello"\nprint(s[::-1], s[1:3], s.upper())', 'olleh el HELLO'],
 ['l = [3,1,2]\nl.sort()\nprint(l, len(l), [x*2 for x in l if x > 1])', '[1, 2, 3] 3 [4, 6]'],
 ['d = {"a": 1}\nd["b"] = 2\nfor k, v in d.items():\n    print(k, v)', 'a 1\nb 2'],
 ['if 5 > 3:\n    print("yes")\nelif 1:\n    pass\nelse:\n    print("no")', 'yes'],
 ['for i in range(1, 16):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    else:\n        continue', 'Fizz\nFizz\nFizz\nFizz\nFizzBuzz'],
 ['print("a", "b", sep="-", end="!")', 'a-b!'],
 ['x = [1,2]\nprint(x == [1,2], 2 in x, "z" not in "abc")', 'True True True'],
 ['print(7 // 2, 7 % 3, 2 ** 10, -7 // 2)', '3 1 1024 -4'],
 ['try:\n    1/0\nexcept ZeroDivisionError:\n    print("caught")', 'caught'],
];
let fail = 0;
for (const [code, exp] of cases) {
  const r = P.run(code);
  const got = r.error ? `ERR ${r.error.type}: ${r.error.message} (line ${r.error.line})` : r.output.join('\n');
  if (got !== exp) { fail++; console.log('FAIL', JSON.stringify(code), '\n  got:', JSON.stringify(got), '\n  exp:', JSON.stringify(exp)); }
}
const errs = [
 'print("hi"', 'if True\n    print(1)', 'msg = "abc\nprint(msg)', 'for n in range(3):\nprint(n)', 'pirnt("x")', 'speed = 5\nprint("Speed: " + speed)', 'while True:\n    pass', 'x = 1\n  y = 2', 'print hello', 'def f():\n    return x\nf()', 'class P:\n    def speak():\n        return 1\nP().speak()'
];
for (const c of errs) { const r = P.run(c); console.log(JSON.stringify(c).slice(0,40).padEnd(42), '->', r.error ? `${r.error.type}: ${r.error.message} (line ${r.error.line})` : 'NO ERROR ' + r.output); }
// API + callTests + objects
const r = P.run('class Pet:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "Woof"\nadopt(Pet("Rex"))\ndef double(n):\n    return n * 2', {api: {adopt: () => null}, callTests: [{fn:'double', args:[4]}]});
console.log(JSON.stringify(r.actions), JSON.stringify(r.calls), r.error);
console.log(fail ? `${fail} failures` : 'all pass'); if (fail) process.exitCode = 1;
