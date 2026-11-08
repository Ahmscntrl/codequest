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


// ---- Chapter 2 features
const csx = (code, exp, o) => ok('csharp', code, exp, o);
ok('cpp', cppMain('vector<int> v = {5, 2, 9}; sort(v.begin(), v.end(), [](int a, int b) { return a > b; }); for (int x : v) cout << x << " "; cout << endl; cout << count_if(v.begin(), v.end(), [](int x) { return x > 3; }) << " " << accumulate(v.begin(), v.end(), 0) << " " << *max_element(v.begin(), v.end()) << endl;', '#include <algorithm>\n#include <numeric>'), '9 5 2 \n2 16 9');
ok('cpp', cppMain('int n = 1; add_one(n); add_one(n); cout << n << endl;', 'void add_one(int &x) { x++; }'), '3');
ok('cpp', cppMain('int n = 1; no_ref(n); cout << n << endl;', 'void no_ref(int x) { x++; }'), '1');
ok('cpp', cppMain('Point p = {3, 4}; cout << p.x + p.y << endl;', 'struct Point { int x; int y; };'), '7');
err('cpp', cppMain('Account a; a.balance = 100;', 'class Account {\n  int balance = 0;\npublic:\n  int get() { return balance; }\n};'), 'AccessError');
ok('cpp', cppMain('Dog d; Animal &a = d; cout << a.speak() << endl; describe(d);', 'class Animal {\npublic:\n  virtual string speak() { return "..."; }\n};\nclass Dog : public Animal {\npublic:\n  string speak() override { return "Woof"; }\n};\nvoid describe(Animal &a) { cout << "It says " << a.speak() << endl; }'), 'Woof\nIt says Woof');
ok('cpp', cppMain('try { throw runtime_error("boom"); } catch (const exception& e) { cout << "caught " << e.what() << endl; }', '#include <stdexcept>'), 'caught boom');
ok('cpp', cppMain('map<string, int> m = {{"b", 2}, {"a", 1}}; for (auto [k, v] : m) cout << k << v << " "; cout << endl;', '#include <map>'), 'a1 b2 ');
ok('cpp', cppMain('auto twice = [](int x) { return x * 2; }; cout << twice(21) << endl;'), '42');
ok('cpp', cppMain('cout << area(2) << " " << area(2, 3) << endl;', 'int area(int s) { return s * s; }\nint area(int w, int h) { return w * h; }'), '4 6');
csx('var nums = new List<int> { 5, 2, 9, 4 };\nvar big = nums.Where(n => n > 3).OrderBy(n => n).ToList();\nConsole.WriteLine(string.Join(", ", big));\nConsole.WriteLine(nums.Sum() + " " + nums.Count(n => n % 2 == 0) + " " + nums.Max() + " " + nums.Select(n => n * 10).First());', '4, 5, 9\n20 2 9 50');
csx('var h = new Hero(); h.Hp = -5; Console.WriteLine(h.Hp); h.Hp = 7; Console.WriteLine(h.Hp + " " + h.IsAlive);\nclass Hero {\n  private int hp;\n  public int Hp { get { return hp; } set { hp = Math.Max(0, value); } }\n  public bool IsAlive => hp > 0;\n}', '0\n7 True');
err('csharp', 'var a = new Account();\na.balance = 5;\nclass Account { private int balance; }', 'AccessError');
csx('IShape s = new Circle(2);\nConsole.WriteLine(s.Area());\ninterface IShape { double Area(); }\nclass Circle : IShape {\n  double r;\n  public Circle(double r) { this.r = r; }\n  public double Area() { return 3 * r * r; }\n}', '12');
csx('try { throw new ArgumentException("bad value"); }\ncatch (ArgumentException e) { Console.WriteLine("caught: " + e.Message); }\nfinally { Console.WriteLine("done"); }', 'caught: bad value\ndone');
csx('try { int z = 0; Console.WriteLine(5 / z); } catch (DivideByZeroException) { Console.WriteLine("no dividing by zero"); }', 'no dividing by zero');
err('csharp', 'throw new InvalidOperationException("nope");', 'RuntimeError');
csx('Func<int, int> sq = x => x * x;\nConsole.WriteLine(sq(5));', '25');
ok('java', 'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    List<Integer> nums = new ArrayList<>(List.of(5, 2, 9, 4));\n    nums.removeIf(n -> n < 3);\n    nums.sort((a, b) -> b - a);\n    System.out.println(nums);\n    int total = nums.stream().filter(n -> n > 4).mapToInt(n -> n).sum();\n    System.out.println(total);\n    nums.forEach(n -> System.out.print(n + " "));\n  }\n}', '[9, 5, 4]\n14\n9 5 4 ');
ok('java', 'abstract class Shape {\n  abstract double area();\n  String describe() { return "Area " + area(); }\n}\nclass Square extends Shape {\n  double side;\n  Square(double s) { side = s; }\n  @Override\n  double area() { return side * side; }\n}\npublic class Main {\n  public static void main(String[] args) {\n    Shape s = new Square(3);\n    System.out.println(s.describe());\n  }\n}', 'Area 9.0');
err('java', 'class Bank {\n  private int money = 5;\n}\npublic class Main {\n  public static void main(String[] args) {\n    Bank b = new Bank();\n    System.out.println(b.money);\n  }\n}', 'AccessError');
ok('java', javaMain('try {\n  int[] a = {1, 2};\n  System.out.println(a[5]);\n} catch (ArrayIndexOutOfBoundsException e) {\n  System.out.println("oops: " + e.getMessage());\n}'), 'oops: Index 5 out of bounds for length 2');
ok('java', 'class TooHotException extends Exception {\n  TooHotException(String msg) { super(msg); }\n}\npublic class Main {\n  static void check(int t) throws TooHotException { if (t > 100) throw new TooHotException("too hot: " + t); }\n  public static void main(String[] args) {\n    try { check(150); } catch (TooHotException e) { System.out.println(e.getMessage()); }\n  }\n}', 'too hot: 150');
ok('java', 'import java.util.*;\n' + javaMain('Map<String, Integer> m = new HashMap<>();\nm.put("a", 1); m.merge("a", 5, (x, y) -> x + y);\nfor (Map.Entry<String, Integer> e : m.entrySet()) System.out.println(e.getKey() + "=" + e.getValue());'), 'a=6');
ok('java', 'class Counter {\n  static int made = 0;\n  Counter() { made++; }\n}\npublic class Main {\n  public static void main(String[] args) {\n    new Counter(); new Counter();\n    System.out.println(Counter.made);\n  }\n}', '2');

console.log(fail ? `${fail} FAILURES` : 'all pass');
if (fail) process.exitCode = 1;
