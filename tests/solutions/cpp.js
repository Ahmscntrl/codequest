// Reference C++ solutions for every terminal (used by the tests only).
function includes(src) {
  const inc = ['iostream'];
  if (/\bstring\b|to_string|stoi/.test(src)) inc.push('string');
  if (/\bvector\b/.test(src)) inc.push('vector');
  if (/\bmap\s*</.test(src)) inc.push('map');
  if (/\breverse\s*\(|\bsort\s*\(/.test(src)) inc.push('algorithm');
  if (/\btoupper\b|\btolower\b/.test(src)) inc.push('cctype');
  return inc.map(h => `#include <${h}>`).join('\n');
}
const indent = (s) => s.split('\n').map(l => (l.trim() ? '    ' + l : '')).join('\n');
function P(body, above) {
  const top = above ? above.trim() + '\n\n' : '';
  return `${includes(top + body)}\nusing namespace std;\n\n${top}int main() {\n${indent(body.trim())}\n    return 0;\n}\n`;
}

module.exports = {
  // ---- level 1
  hello: P('cout << "Hello, World" << endl;'),
  lines: P('cout << "Ready" << endl;\ncout << "Set" << endl;\ncout << "Code!" << endl;'),
  textjoin: P('cout << string("Super") + "Coder" << endl;'),
  math: P('cout << 7 * 6 << endl;\ncout << 100 - 1 << endl;'),
  order: P('cout << (10 + 5) * 2 << endl;\ncout << 10 + 5 * 2 << endl;'),
  sep: P('cout << "Score: " << 25 * 4 << endl;'),
  // ---- level 2
  firstvar: P('string color = "blue";\ncout << color << endl;'),
  types: P('string name = "Ada";\nint level = 5;\nbool alive = true;'),
  bridge: P('build_bridge(planks);'),
  area: P('int area = width * height;\ncout << area << endl;'),
  update: P('score += 5;\ncout << score << endl;'),
  combine: P('cout << hero + " has " + to_string(coins) + " coins" << endl;'),
  password: P('cout << password << endl;'),
  // ---- level 3
  compare: P('cout << (hp > 50) << endl;'),
  heal: P('if (hp < 30) {\n    heal();\n}'),
  guard: P('if (visitor == my_name) {\n    open_gate();\n} else {\n    sound_alarm();\n}'),
  even: P('if (number % 2 == 0) {\n    cout << "even" << endl;\n} else {\n    cout << "odd" << endl;\n}'),
  pump: P('if (temperature > 100) {\n    cool();\n} else if (temperature < 0) {\n    heat();\n} else {\n    wait();\n}'),
  bouncer: P('if (age >= 12 && has_ticket) {\n    open_gate();\n} else {\n    turn_away();\n}'),
  orgate: P('if (weather == "rain" || weather == "snow") {\n    umbrella();\n} else {\n    sunglasses();\n}'),
  // ---- level 4
  repeat: P('for (int i = 0; i < 3; i++) {\n    cout << "Hooray!" << endl;\n}'),
  stairs: P('for (int i = 0; i < 6; i++) {\n    build_step(i);\n}'),
  count: P('for (int i = 1; i <= 10; i++) {\n    cout << i << endl;\n}'),
  countdown: P('for (int i = 5; i >= 1; i--) {\n    cout << i << endl;\n}\ncout << "Liftoff!" << endl;'),
  listloop: P('for (string item : loot) {\n    cout << item << endl;\n}'),
  charge: P('while (charge < 100) {\n    charge_up();\n    charge += 10;\n}'),
  sumloop: P('int total = 0;\nfor (int i = 1; i <= n; i++) {\n    total += i;\n}\ncout << total << endl;'),
  breakloop: P('for (string piece : rails) {\n    if (piece == "gap") {\n        cout << "Stop!" << endl;\n        break;\n    }\n    cout << piece << endl;\n}'),
  // ---- level 5
  cheer: P('cheer();\ncheer();', 'void cheer() {\n    cout << "Go team!" << endl;\n}'),
  echo: P('echo("hello");', 'void echo(string word) {\n    cout << word << endl;\n    cout << word << endl;\n}'),
  double: P('cout << double_it(4) << endl;', 'int double_it(int n) {\n    return n * 2;\n}'),
  square: P('cout << square(3) + square(4) << endl;', 'int square(int n) {\n    return n * n;\n}'),
  greet: P('cout << greet("Ada") << endl;', 'string greet(string name) {\n    return "Hello, " + name + "!";\n}'),
  evenfn: P('cout << even(4) << endl;', 'bool even(int n) {\n    return n % 2 == 0;\n}'),
  total: P('vector<int> test = {1, 2, 3};\ncout << total(test) << endl;', 'int total(vector<int> nums) {\n    int result = 0;\n    for (int n : nums) {\n        result += n;\n    }\n    return result;\n}'),
  biggest: P('cout << biggest(3, 9) << endl;', 'int biggest(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    return b;\n}'),
  // ---- level 6
  crate: P('Crate my_crate;\ncout << my_crate.contents << endl;', 'class Crate {\npublic:\n    string contents;\n\n    Crate() {\n        contents = "golden key";\n    }\n};'),
  potion: P('brew(Potion(3));\nbrew(Potion(8));', 'class Potion {\npublic:\n    int power;\n\n    Potion(int p) {\n        power = p;\n    }\n\n    string describe() {\n        return "Potion of power " + to_string(power);\n    }\n};'),
  lamp: P('Lamp lamp;\ncout << lamp.status() << endl;\nlamp.toggle();\ncout << lamp.status() << endl;\nlamp.toggle();\ncout << lamp.status() << endl;', 'class Lamp {\npublic:\n    bool on;\n\n    Lamp() {\n        on = false;\n    }\n\n    string status() {\n        return on ? "on" : "off";\n    }\n\n    void toggle() {\n        on = !on;\n    }\n};'),
  wallet: P('Wallet mine;\nmine.add(5);\nmine.add(10);\ncout << mine.coins << endl;\n\nWallet yours;\nyours.add(3);\ncout << yours.coins << endl;', 'class Wallet {\npublic:\n    int coins;\n\n    Wallet() {\n        coins = 0;\n    }\n\n    void add(int amount) {\n        coins += amount;\n    }\n};'),
  forge: P('Sword my_sword;\nequip(my_sword);', 'class Sword {\npublic:\n    string name;\n    int damage;\n\n    Sword() {\n        name = "Byte Blade";\n        damage = 3;\n    }\n\n    string swing() {\n        return "Slash!";\n    }\n};'),
  den: P('Pet buddy("Pixel", "cat");\nadopt(buddy);', 'class Pet {\npublic:\n    string name;\n    string species;\n\n    Pet(string n, string s) {\n        name = n;\n        species = s;\n    }\n\n    string speak() {\n        return "Meow!";\n    }\n};'),
  // ---- open world
  gems: P('for (int gem : gems) {\n    if (gem > 5) {\n        deposit(gem);\n    }\n}'),
  decoder: P('reverse(secret.begin(), secret.end());\ncout << secret << endl;'),
  fib: P('int a = 0;\nint b = 1;\nfor (int i = 0; i < n; i++) {\n    cout << a << endl;\n    int next = a + b;\n    a = b;\n    b = next;\n}'),
  fizz: P('for (int i = 1; i <= 15; i++) {\n    if (i % 15 == 0) {\n        cout << "FizzBuzz" << endl;\n    } else if (i % 3 == 0) {\n        cout << "Fizz" << endl;\n    } else if (i % 5 == 0) {\n        cout << "Buzz" << endl;\n    } else {\n        cout << i << endl;\n    }\n}'),
  merchant: P('int total = 0;\nfor (string item : cart) {\n    total += prices[item];\n}\ncout << total << endl;'),
  backpack: P('cout << inventory[0] << endl;\ncout << inventory[inventory.size() - 1] << endl;\ncout << inventory.size() << endl;'),
  crier: P('for (int i = 0; i < message.length(); i++) {\n    message[i] = toupper(message[i]);\n}\ncout << message << "!" << endl;'),
  bag: P('bag.push_back("potion");\ncout << bag.size() << endl;\ncout << bag.back() << endl;'),
  // ---- boss
  cannon: P('// Fire a burst!\nfor (int shot = 0; shot < 5; shot++) {\n    fire();\n}'),
};
