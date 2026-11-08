// Tests for the C++ / C# / Java interpreter.
const C = require('../js/clike.js');
let fail = 0;
function ok(dialect, code, expect, opts) {
  const r = C.run(code, Object.assign({ dialect }, opts || {}));
  const got = r.error ? `ERR ${r.error.type}: ${r.error.message} (line ${r.error.line})` : r.output.join('\n');
  if (got !== expect) { fail++; console.log(`FAIL [${dialect}]`, JSON.stringify(code).slice(0, 90), '\n   got:', JSON.stringify(got), '\n   exp:', JSON.stringify(expect)); }
  return r;
}
function err(dialect, code, type, opts) {
  const r = C.run(code, Object.assign({ dialect }, opts || {}));
  if (!r.error || r.error.type !== type) { fail++; console.log(`FAIL-ERR [${dialect}]`, JSON.stringify(code).slice(0, 90), '->', r.error ? r.error.type + ': ' + r.error.message : 'no error, output ' + r.output); }
  else console.log(`  ${dialect.padEnd(6)} ${type.padEnd(12)} line ${r.error.line}: ${r.error.message.split('\n')[0]}`);
  return r;
}
const cppMain = (body, pre = '') => `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n${pre}\nint main() {\n${body}\n    return 0;\n}`;
const javaMain = (body, pre = '') => `public class Main {\n${pre}\n    public static void main(String[] args) {\n${body}\n    }\n}`;

// ---- C++
ok('cpp', cppMain('cout << "Hello, World" << endl;'), 'Hello, World');
ok('cpp', cppMain('int a = 7; int b = 2; cout << a / b << " " << a % b << " " << 7.0 / 2 << endl;'), '3 1 3.5');
ok('cpp', cppMain('string s = "Super"; s = s + "Coder"; cout << s << " " << s.length() << endl;'), 'SuperCoder 10');
ok('cpp', cppMain('for (int i = 0; i < 3; i++) { cout << i << endl; }'), '0\n1\n2');
ok('cpp', cppMain('vector<int> v = {3, 8, 1}; v.push_back(9); int t = 0; for (int x : v) t += x; cout << t << " " << v.size() << " " << v[1] << endl;'), '21 4 8');
ok('cpp', cppMain('cout << (5 > 3) << " " << boolalpha << (5 > 3) << endl;'), '1 true');
ok('cpp', cppMain('cout << doubleIt(4) << endl;', 'int doubleIt(int n) { return n * 2; }'), '8');
ok('cpp', cppMain('Sword s; cout << s.name << " " << s.damage << " " << s.swing() << endl;', 'class Sword {\npublic:\n  string name;\n  int damage;\n  Sword() { name = "Byte Blade"; damage = 3; }\n  string swing() { return "Slash!"; }\n};'), 'Byte Blade 3 Slash!');
ok('cpp', cppMain('Pet p("Rex"); cout << p.speak() << endl;', 'class Pet {\npublic:\n  string name;\n  Pet(string n) : name(n) {}\n  string speak() { return name + " says woof"; }\n};'), 'Rex says woof');
ok('cpp', cppMain('string s = "hello"; reverse(s.begin(), s.end()); cout << s << endl; string u = "hi"; for (int i = 0; i < u.length(); i++) u[i] = toupper(u[i]); cout << u << endl;'), 'olleh\nHI');
ok('cpp', cppMain('map<string, int> prices = {{"potion", 5}, {"map", 3}}; cout << prices["potion"] + prices["map"] << endl;', '#include <map>'), '8');
ok('cpp', cppMain('int n = 5; while (n > 0) { n -= 2; } cout << n << endl;'), '-1');
ok('cpp', cppMain('cout << to_string(5) + " coins" << endl;'), '5 coins');
ok('cpp', cppMain('build_bridge(planks);'), '', { globals: { planks: 7 }, api: { build_bridge: () => null } });
err('cpp', cppMain('cout << "hi" << endl'), 'SyntaxError');
err('cpp', cppMain('cout << score << endl;'), 'NameError');
err('cpp', cppMain('int x = "hello";'), 'TypeError');
err('cpp', cppMain('string s = "Coins: " + 5;'), 'TypeError');
err('cpp', 'cout << "hi";', 'SyntaxError');
err('cpp', cppMain('while (true) {}'), 'TimeoutError');

// ---- Java
ok('java', javaMain('System.out.println("Hello, World");'), 'Hello, World');
ok('java', javaMain('int a = 7; double d = 7.0 / 2; System.out.println(a / 2 + " " + d + " " + (a > 3));'), '3 3.5 true');
ok('java', javaMain('String s = "hi"; System.out.println(s.toUpperCase() + s.length() + s.charAt(0));'), 'HI2h');
ok('java', javaMain('System.out.println(doubleIt(5));', 'static int doubleIt(int n) { return n * 2; }'), '10');
ok('java', javaMain('ArrayList<String> l = new ArrayList<>(); l.add("a"); l.add("b"); System.out.println(l + " " + l.size() + " " + l.get(1));'), '[a, b] 2 b');
ok('java', javaMain('int[] a = {1, 2, 3}; int t = 0; for (int x : a) t += x; System.out.println(t + " " + a.length);'), '6 3');
ok('java', 'class Dog {\n  String name;\n  Dog(String name) { this.name = name; }\n  String speak() { return name + " says woof"; }\n}\npublic class Main {\n  public static void main(String[] args) {\n    Dog d = new Dog("Rex");\n    System.out.println(d.speak());\n  }\n}', 'Rex says woof');
ok('java', javaMain('String s = "stressed"; System.out.println(new StringBuilder(s).reverse().toString());'), 'desserts');
ok('java', javaMain('double x = 5; System.out.println(x);'), '5.0');
ok('java', javaMain('for (String g : gems) System.out.println(g);'), 'a\nb', { globals: { gems: ['a', 'b'] } });
ok('java', javaMain('int total = 0; for (String c : cart) total += prices.get(c); System.out.println(total);'), '8', { globals: { cart: ['potion', 'map'], prices: { potion: 5, map: 3 } } });
err('java', javaMain('System.out.println("hi")'), 'SyntaxError');
err('java', javaMain('int x = 5.5;'), 'TypeError');
err('java', javaMain('System.out.println(scroe);'), 'NameError');
err('java', 'System.out.println("hi");', 'SyntaxError');

// ---- C#
ok('csharp', 'Console.WriteLine("Hello, World");', 'Hello, World');
ok('csharp', 'int coins = 5; string hero = "Ada"; Console.WriteLine($"{hero} has {coins} coins"); Console.WriteLine(7 > 3);', 'Ada has 5 coins\nTrue');
ok('csharp', 'int DoubleIt(int n) { return n * 2; }\nConsole.WriteLine(DoubleIt(6));', '12');
ok('csharp', 'var list = new List<string> { "a" }; list.Add("b"); Console.WriteLine(list.Count + " " + list[1]);', '2 b');
ok('csharp', 'class Dog {\n  public string Name;\n  public Dog(string name) { Name = name; }\n  public string Speak() { return Name + " says woof"; }\n}\nclass Program {\n  static void Main() {\n    var d = new Dog("Rex");\n    Console.WriteLine(d.Speak());\n  }\n}', 'Rex says woof');
ok('csharp', 'string s = "abc"; char[] arr = s.ToCharArray(); Array.Reverse(arr); Console.WriteLine(new string(arr) + " " + s.ToUpper() + " " + s.Length);', 'cba ABC 3');
ok('csharp', 'double x = 5; Console.WriteLine(x); Console.WriteLine(9 / 2); Console.WriteLine(9.0 / 2);', '5\n4\n4.5');
ok('csharp', 'foreach (var g in gems) { if (g > 5) Deposit(g); }', '', { globals: { gems: [3, 8] }, api: { deposit: () => null } });
const r = ok('csharp', 'class Pet { public string Name; public Pet(string n) { Name = n; } public string Speak() { return "Meow!"; } }\nAdopt(new Pet("Pixel"));', '', { api: { adopt: () => null } });
console.log('  adopt normalised:', JSON.stringify(r.actions[0].args[0]));
const r2 = ok('csharp', 'int Square(int n) { return n * n; }', '', { callTests: [{ fn: 'Square', args: [5] }] });
console.log('  callTests:', JSON.stringify(r2.calls));
err('csharp', 'Console.WriteLine("hi")', 'SyntaxError');
err('csharp', 'int x = "hi";', 'TypeError');
err('csharp', 'Console.WriteLine(scroe);', 'NameError');

console.log(fail ? `${fail} FAILURES` : 'all pass');
if (fail) process.exitCode = 1;
