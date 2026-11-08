// Reference solutions for every terminal, in Java (used by the tests only).
// main(body) wraps statements in the Main class; extra static methods go in `methods`,
// and other classes (declared outside Main, without `public`) go in `classes`.
const ind = (s, n) => s.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n');
const main = (body, methods = '', classes = '') =>
  (classes ? classes + '\n\n' : '') +
  'public class Main {\n' +
  (methods ? ind(methods, 4) + '\n\n' : '') +
  '    public static void main(String[] args) {\n' + ind(body, 8) + '\n    }\n}\n';

module.exports = {
  // ---- 1. Hello, World
  hello: main('System.out.println("Hello, World!");'),
  lines: main('System.out.println("Ready");\nSystem.out.println("Set");\nSystem.out.println("Code!");'),
  textjoin: main('System.out.println("Super" + "Coder");'),
  math: main('System.out.println(7 * 6);\nSystem.out.println(100 - 1);'),
  order: main('System.out.println((10 + 5) * 2);\nSystem.out.println(10 + 5 * 2);'),
  sep: main('System.out.println("Score: " + 25 * 4);'),

  // ---- 2. Variables
  firstvar: main('String color = "blue";\nSystem.out.println(color);'),
  types: main('String name = "Ada";\nint level = 5;\nboolean alive = true;'),
  bridge: main('buildBridge(planks);'),
  area: main('int area = width * height;\nSystem.out.println(area);'),
  update: main('score += 5;\nSystem.out.println(score);'),
  combine: main('System.out.println(hero + " has " + coins + " coins");'),
  password: main('System.out.println(password);'),

  // ---- 3. Conditions
  compare: main('System.out.println(hp > 50);'),
  heal: main('if (hp < 30) {\n    heal();\n}'),
  guard: main('if (visitor.equals(myName)) {\n    openGate();\n} else {\n    soundAlarm();\n}'),
  even: main('if (number % 2 == 0) {\n    System.out.println("even");\n} else {\n    System.out.println("odd");\n}'),
  pump: main('if (temperature > 100) {\n    cool();\n} else if (temperature < 0) {\n    heat();\n} else {\n    wait();\n}'),
  bouncer: main('if (age >= 12 && hasTicket) {\n    openGate();\n} else {\n    turnAway();\n}'),
  orgate: main('if (weather.equals("rain") || weather.equals("snow")) {\n    umbrella();\n} else {\n    sunglasses();\n}'),

  // ---- 4. Loops
  repeat: main('for (int i = 0; i < 3; i++) {\n    System.out.println("Hooray!");\n}'),
  stairs: main('for (int i = 0; i < 6; i++) {\n    buildStep(i);\n}'),
  count: main('for (int i = 1; i <= 10; i++) {\n    System.out.println(i);\n}'),
  countdown: main('for (int i = 5; i >= 1; i--) {\n    System.out.println(i);\n}\nSystem.out.println("Liftoff!");'),
  listloop: main('for (String item : loot) {\n    System.out.println(item);\n}'),
  charge: main('while (charge < 100) {\n    chargeUp();\n    charge += 10;\n}'),
  sumloop: main('int total = 0;\nfor (int i = 1; i <= n; i++) {\n    total += i;\n}\nSystem.out.println(total);'),
  breakloop: main('for (String piece : rails) {\n    if (piece.equals("gap")) {\n        System.out.println("Stop!");\n        break;\n    }\n    System.out.println(piece);\n}'),

  // ---- 5. Functions (static methods)
  cheer: main('cheer();\ncheer();', 'static void cheer() {\n    System.out.println("Go team!");\n}'),
  echo: main('echo("hello");', 'static void echo(String word) {\n    System.out.println(word);\n    System.out.println(word);\n}'),
  double: main('System.out.println(doubleIt(4));', 'static int doubleIt(int n) {\n    return n * 2;\n}'),
  square: main('System.out.println(square(3) + square(4));', 'static int square(int n) {\n    return n * n;\n}'),
  greet: main('System.out.println(greet("Ada"));', 'static String greet(String name) {\n    return "Hello, " + name + "!";\n}'),
  evenfn: main('System.out.println(even(4));', 'static boolean even(int n) {\n    return n % 2 == 0;\n}'),
  total: main('ArrayList<Integer> nums = new ArrayList<>();\nnums.add(1);\nnums.add(2);\nnums.add(3);\nSystem.out.println(total(nums));',
    'static int total(ArrayList<Integer> nums) {\n    int result = 0;\n    for (int n : nums) {\n        result += n;\n    }\n    return result;\n}'),
  biggest: main('System.out.println(biggest(3, 9));', 'static int biggest(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    return b;\n}'),

  // ---- 6. Classes
  crate: main('Crate myCrate = new Crate();\nSystem.out.println(myCrate.contents);', '',
    'class Crate {\n    String contents;\n\n    Crate() {\n        this.contents = "golden key";\n    }\n}'),
  potion: main('brew(new Potion(3));\nbrew(new Potion(8));', '',
    'class Potion {\n    int power;\n\n    Potion(int power) {\n        this.power = power;\n    }\n\n    String describe() {\n        return "Potion of power " + this.power;\n    }\n}'),
  lamp: main('Lamp lamp = new Lamp();\nSystem.out.println(lamp.status());\nlamp.toggle();\nSystem.out.println(lamp.status());\nlamp.toggle();\nSystem.out.println(lamp.status());', '',
    'class Lamp {\n    boolean on;\n\n    Lamp() {\n        this.on = false;\n    }\n\n    String status() {\n        return this.on ? "on" : "off";\n    }\n\n    void toggle() {\n        this.on = !this.on;\n    }\n}'),
  wallet: main('Wallet mine = new Wallet();\nmine.add(5);\nmine.add(10);\nSystem.out.println(mine.coins);\n\nWallet yours = new Wallet();\nyours.add(3);\nSystem.out.println(yours.coins);', '',
    'class Wallet {\n    int coins;\n\n    Wallet() {\n        this.coins = 0;\n    }\n\n    void add(int amount) {\n        this.coins += amount;\n    }\n}'),
  forge: main('Sword mySword = new Sword();\nequip(mySword);', '',
    'class Sword {\n    String name;\n    int damage;\n\n    Sword() {\n        this.name = "Byte Blade";\n        this.damage = 3;\n    }\n\n    String swing() {\n        return "Slash!";\n    }\n}'),
  den: main('Pet buddy = new Pet("Pixel", "cat");\nadopt(buddy);', '',
    'class Pet {\n    String name;\n    String species;\n\n    Pet(String name, String species) {\n        this.name = name;\n        this.species = species;\n    }\n\n    String speak() {\n        return "Meow!";\n    }\n}'),

  // ---- 7. Open world
  gems: main('for (int gem : gems) {\n    if (gem > 5) {\n        deposit(gem);\n    }\n}'),
  decoder: main('String result = new StringBuilder(secret).reverse().toString();\nSystem.out.println(result);'),
  fib: main('int a = 0;\nint b = 1;\nfor (int i = 0; i < n; i++) {\n    System.out.println(a);\n    int next = a + b;\n    a = b;\n    b = next;\n}'),
  fizz: main('for (int i = 1; i <= 15; i++) {\n    if (i % 15 == 0) {\n        System.out.println("FizzBuzz");\n    } else if (i % 3 == 0) {\n        System.out.println("Fizz");\n    } else if (i % 5 == 0) {\n        System.out.println("Buzz");\n    } else {\n        System.out.println(i);\n    }\n}'),
  merchant: main('int total = 0;\nfor (String item : cart) {\n    total += prices.get(item);\n}\nSystem.out.println(total);'),
  backpack: main('System.out.println(inventory.get(0));\nSystem.out.println(inventory.get(inventory.size() - 1));\nSystem.out.println(inventory.size());'),
  crier: main('System.out.println(message.toUpperCase() + "!");'),
  bag: main('bag.add("potion");\nSystem.out.println(bag.size());\nSystem.out.println(bag.get(bag.size() - 1));'),

  // ---- 8. Boss
  cannon: main('// Fire a burst!\nfor (int shot = 0; shot < 5; shot++) {\n    fire();\n}'),
};
