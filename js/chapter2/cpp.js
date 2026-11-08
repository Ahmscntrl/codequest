/* CodeQuest — Chapter 2 for C++: The Iron Forge.
 * References, encapsulation, STL algorithms with lambdas, overloading, and inheritance with virtual functions.
 * Every program is a full C++ program (#include lines, using namespace std;, int main()) that a real compiler accepts.
 * See docs/CHAPTER2.md for the format.
 */
(function (root) {
  'use strict';
  const GD = root.GameData;
  const H = GD.helpers;

  // ---------------------------------------------------------------- helpers
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const c = (s) => `<code>${esc(s)}</code>`;
  const block = (s) => `<pre>${esc(s)}</pre>`;
  // the #include lines a program needs, picked from what it uses
  function includes(src) {
    const inc = ['iostream'];
    if (/\bstring\b|to_string/.test(src)) inc.push('string');
    if (/\bvector\b/.test(src)) inc.push('vector');
    if (/\b(sort|reverse|count_if|count|find_if|find|max_element|min_element|transform|for_each|any_of|all_of|none_of)\s*\(/.test(src)) inc.push('algorithm');
    if (/\baccumulate\s*\(/.test(src)) inc.push('numeric');
    return inc.map(h => `#include <${h}>`).join('\n');
  }
  const indent = (s) => s.split('\n').map(l => (l.trim() ? '    ' + l : '')).join('\n');
  // P(body of main, code above main): a whole C++ program
  function P(body, above) {
    const top = above ? above.trim() + '\n\n' : '';
    return `${includes(top + body)}\nusing namespace std;\n\n${top}int main() {\n${indent(body.replace(/^\n+|\n+$/g, ''))}\n    return 0;\n}\n`;
  }
  const page = (title, body, code, opt) => Object.assign({ title, body, code: code === undefined ? null : code }, opt || {});
  // check the printed lines, then the results of calling the player's function directly
  function linesThenCalls(want, wantCalls, fnName, success) {
    return function (runs, ctx) {
      const got = H.lines(runs[0]);
      for (let i = 0; i < want.length; i++) if (got[i] !== String(want[i])) return { ok: false, msg: `Line ${i + 1} should be ${c(want[i])} but it was ${c(H.nothing(got[i]))}.` };
      if (got.length > want.length) return { ok: false, msg: `Expected ${want.length} lines of output, but you printed ${got.length}.` };
      const r = H.checkCalls(runs[0], this.callTests, wantCalls, ctx, fnName);
      return r.ok ? { ok: true, msg: success } : r;
    };
  }
  // the member `name` is declared where outside code can't reach it: after private:, or before any public: in a class
  const hidden = (cls, decl) => new RegExp(`private\\s*:(?:(?!public\\s*:)[^])*?${decl}|class\\s+${cls}\\s*\\{(?:(?!public\\s*:)[^])*?${decl}`);

  // ================================================================ level 1: references
  const GOLEM_BASE = `class Golem {
public:
    string name;
    int hp;

    Golem(string n, int h) : name(n), hp(h) {}

    string walk() const {
        return name + " walks";
    }
};`;

  const challenges = {
    // ---------------------------------------------------------------- level 1: references
    cpp2_refs1: {
      title: 'The Cold Furnace',
      desc: '<p>The furnace gauge reads <b>20</b>. The function ' + c('heat') + ' is supposed to add 100 to it, but the gauge never moves!</p>' +
        '<p>That\'s because ' + c('heat') + ' gets a <b>copy</b> of ' + c('forge') + '. It warms up the copy, and the copy is thrown away when the function ends.</p>' +
        '<p>Make the parameter a <b>reference</b>, so the function changes the caller\'s own variable. The program should print <b>120</b>. You only need to add one character.</p>',
      starter: P('int forge = 20;\nheat(forge);\ncout << forge << endl;', 'void heat(int temp) {\n    temp += 100;\n}'),
      hints: ['A parameter written as int temp is a brand-new box that holds a copy of the value.', 'Put an & between the type and the name of the parameter.'],
      similar: { task: 'A function that doubles the caller\'s coins.', code: P('int coins = 4;\ndouble_coins(coins);\ncout << coins << endl;', 'void double_coins(int &n) {\n    n *= 2;\n}') },
      gate: 'A',
      expect: ['120'],
      require: [[/void\s+heat\s*\(\s*int\s*&\s*\w+\s*\)/, 'Make the parameter of ' + c('heat') + ' a reference: ' + c('int &temp') + '.'], [/heat\s*\(\s*forge\s*\)/, 'Keep the call ' + c('heat(forge);') + ' in main.']],
      success: 'The gauge jumps to <b>120</b>. The furnace roars to life!',
    },
    cpp2_refs2: {
      title: 'The Twin Anvils',
      desc: '<p>Two anvils hold each other\'s ingots. Write ' + c('void swap_ingots(int &a, int &b)') + ' that <b>swaps</b> the values of the two variables passed in.</p>' +
        '<p>main is already written. It should print:</p><pre>8 3\n50 7</pre>' +
        '<p>Both parameters must be references, or you would only swap two copies. You will need a third, temporary variable to hold one value while you move the other.</p>',
      starter: P('int left = 3;\nint right = 8;\nswap_ingots(left, right);\ncout << left << " " << right << endl;\n\nint big = 7;\nint small = 50;\nswap_ingots(big, small);\ncout << big << " " << small << endl;', 'void swap_ingots(int a, int b) {\n    // swap a and b here\n}'),
      hints: ['First save a in a temporary variable, then copy b into a, then the saved value into b.', 'The parameters need & so the swap reaches the caller\'s variables.'],
      similar: { task: 'Turn two variables into their sum and their difference.', code: P('int x = 10;\nint y = 4;\nsum_and_diff(x, y);\ncout << x << " " << y << endl;', 'void sum_and_diff(int &a, int &b) {\n    int sum = a + b;\n    int diff = a - b;\n    a = sum;\n    b = diff;\n}') },
      gate: 'B',
      expect: ['8 3', '50 7'],
      require: [[/swap_ingots\s*\(\s*int\s*&\s*\w+\s*,\s*int\s*&\s*\w+\s*\)\s*\{/, 'Both parameters of ' + c('swap_ingots') + ' need to be references: ' + c('int &a, int &b') + '.']],
      success: 'Clang! The ingots trade places. The twin anvils ring in harmony.',
    },
    cpp2_refs3: {
      title: 'The Ore Splitter',
      desc: '<p>The splitter melts ore into <b>bars of 5 kg</b>. Whatever is left over goes back into the bin.</p>' +
        '<p>A function can only ' + c('return') + ' one value, but reference parameters let it hand back as many as you like. Write:</p>' +
        block('void split_ore(int total, int &bars, int &leftover)') +
        '<p>It sets ' + c('bars') + ' to how many whole 5 kg bars fit in ' + c('total') + ', and ' + c('leftover') + ' to the kilograms that remain. main should print:</p>' +
        '<pre>23 kg: 4 bars, 3 left\n10 kg: 2 bars, 0 left\n4 kg: 0 bars, 4 left</pre>' +
        '<p>Notice that ' + c('total') + ' is a normal parameter: the function only reads it.</p>',
      starter: P('int bars = 0;\nint leftover = 0;\n\nsplit_ore(23, bars, leftover);\ncout << "23 kg: " << bars << " bars, " << leftover << " left" << endl;\nsplit_ore(10, bars, leftover);\ncout << "10 kg: " << bars << " bars, " << leftover << " left" << endl;\nsplit_ore(4, bars, leftover);\ncout << "4 kg: " << bars << " bars, " << leftover << " left" << endl;',
        'void split_ore(int total, int &bars, int &leftover) {\n    // fill in bars and leftover\n}'),
      hints: ['Whole-number division / tells you how many bars fit. The remainder % tells you what is left.', 'Inside the function just assign to the references: bars = ...; and leftover = ...;'],
      similar: { task: 'Split minutes into hours and minutes.', code: P('int h = 0;\nint m = 0;\nsplit_time(135, h, m);\ncout << h << "h " << m << "min" << endl;', 'void split_time(int minutes, int &hours, int &mins) {\n    hours = minutes / 60;\n    mins = minutes % 60;\n}') },
      gate: 'C',
      expect: ['23 kg: 4 bars, 3 left', '10 kg: 2 bars, 0 left', '4 kg: 0 bars, 4 left'],
      require: [[/split_ore\s*\(\s*int\s+\w+\s*,\s*int\s*&\s*\w+\s*,\s*int\s*&\s*\w+\s*\)\s*\{/, 'Keep the function as ' + c('void split_ore(int total, int &bars, int &leftover)') + '.']],
      success: 'Bars stack up neatly and the leftovers slide back into the bin. Two answers from one function!',
    },
    cpp2_refs4: {
      title: 'The Tempering Line',
      desc: '<p>A rack of blades rolls past the fire. ' + c('blades') + ' holds the heat of each one. Every blade must get <b>50 degrees hotter</b>, but none may go <b>above 280</b>: if adding 50 would take it higher, set it to exactly 280.</p>' +
        '<p>The first loop in the starter code does nothing, because ' + c('int b') + ' is a copy of each item. Give the loop a <b>reference</b> variable so it changes the items in the vector:</p>' +
        block('for (int &b : blades) { ... }') +
        '<p>The second loop prints the result. It should show <b>150</b>, <b>280</b> and <b>125</b>.</p>',
      starter: P('vector<int> blades = {100, 250, 75};\n\nfor (int b : blades) {\n    b += 50;\n}\n\nfor (int b : blades) {\n    cout << b << endl;\n}'),
      hints: ['Add & to the first loop\'s variable so b is the item itself, not a copy.', 'After adding 50, check whether b went over 280, and if so set it back to 280.'],
      similar: { task: 'Halve every score in a vector, in place.', code: P('vector<int> scores = {10, 7, 40};\nfor (int &s : scores) {\n    s /= 2;\n}\nfor (int s : scores) {\n    cout << s << endl;\n}') },
      gate: 'D',
      expect: ['150', '280', '125'],
      require: [[/for\s*\(\s*(int|auto)\s*&\s*\w+\s*:\s*blades\s*\)/, 'Change the blades with a reference loop: ' + c('for (int &b : blades)') + '.']],
      success: 'Hiss! The blades glow evenly, and not one of them cracks.',
    },
    cpp2_refs5: {
      title: 'The Weighbridge',
      desc: '<p>The weighbridge keeps a log of cart weights in a ' + c('vector<int>') + '. Write two functions:</p>' +
        '<ul><li>' + c('void add_cart(vector<int> &carts, int weight)') + ' adds ' + c('weight') + ' to the end of the vector.</li>' +
        '<li>' + c('int heaviest(const vector<int> &carts)') + ' returns the biggest weight, or 0 if the vector is empty.</li></ul>' +
        '<p>' + c('add_cart') + ' changes the vector, so it needs a reference. ' + c('heaviest') + ' only looks at it, so it takes a <b>const reference</b>: no slow copy, and no way to change it by accident.</p>' +
        '<p>main should print:</p><pre>0\n3 carts\nheaviest: 95</pre><p>The weighbridge will also test ' + c('heaviest') + ' with some vectors of its own.</p>',
      starter: P('vector<int> carts;\ncout << heaviest(carts) << endl;\n\nadd_cart(carts, 40);\nadd_cart(carts, 95);\nadd_cart(carts, 60);\ncout << carts.size() << " carts" << endl;\ncout << "heaviest: " << heaviest(carts) << endl;',
        'void add_cart(vector<int> carts, int weight) {\n    carts.push_back(weight);\n}\n\nint heaviest(vector<int> carts) {\n    // return the biggest weight (0 if there are none)\n    return 0;\n}'),
      hints: ['add_cart already pushes the weight, but onto a copy. One & fixes it.', 'For heaviest, start a variable at 0 and loop over the carts, keeping the biggest you have seen.'],
      similar: { task: 'Add a name to a guest list, and count the long names.', code: P('vector<string> guests;\ninvite(guests, "Ada");\ninvite(guests, "Linus");\ncout << long_names(guests) << endl;', 'void invite(vector<string> &list, string name) {\n    list.push_back(name);\n}\n\nint long_names(const vector<string> &list) {\n    int n = 0;\n    for (const string &g : list) {\n        if (g.length() > 3) {\n            n++;\n        }\n    }\n    return n;\n}') },
      gate: 'E',
      callTests: [{ fn: 'heaviest', args: [[3, 9, 2]] }, { fn: 'heaviest', args: [[]] }, { fn: 'heaviest', args: [[7]] }, { fn: 'heaviest', args: [[12, 40, 40, 8]] }],
      check: linesThenCalls(['0', '3 carts', 'heaviest: 95'], [9, 0, 7, 40], 'heaviest', 'The needle settles on <b>95</b>. The weighbridge log is safe and sound.'),
      require: [[/add_cart\s*\(\s*vector\s*<\s*int\s*>\s*&/, c('add_cart') + ' has to change the caller\'s vector, so it needs ' + c('vector<int> &carts') + '.'], [/heaviest\s*\(\s*const\s+vector\s*<\s*int\s*>\s*&/, c('heaviest') + ' should take a const reference: ' + c('const vector<int> &carts') + '.']],
    },

    // ---------------------------------------------------------------- level 2: structs & encapsulation
    cpp2_enc1: {
      title: 'The Ingot Rack',
      desc: '<p>A ' + c('struct') + ' bundles several values into one new type. Every member of a struct is <b>public</b>, so you can reach it with a dot.</p>' +
        '<p>Fill in the struct ' + c('Ingot') + ' with two members: a ' + c('string metal') + ' and an ' + c('int weight') + ' (in that order, so ' + c('{"iron", 12}') + ' fills them). main is already written and should print:</p>' +
        '<pre>iron 12\ngold 35\ntotal: 47</pre>',
      starter: P('Ingot a = {"iron", 12};\nIngot b = {"gold", 30};\nb.weight += 5;\n\ncout << a.metal << " " << a.weight << endl;\ncout << b.metal << " " << b.weight << endl;\ncout << "total: " << a.weight + b.weight << endl;', 'struct Ingot {\n    // add the members here\n};'),
      hints: ['Inside the struct, declare members like variables: a type, a name and a semicolon.', 'The order matters: {"iron", 12} fills the first member, then the second.'],
      similar: { task: 'A struct for a point on a map.', code: P('Point p = {3, 4};\np.x += 1;\ncout << p.x << ", " << p.y << endl;', 'struct Point {\n    int x;\n    int y;\n};') },
      gate: 'A',
      expect: ['iron 12', 'gold 35', 'total: 47'],
      require: [[/struct\s+Ingot\s*\{/, 'Keep the ' + c('struct Ingot') + '.']],
      success: 'The ingots slot into the rack, labelled and weighed.',
    },
    cpp2_enc2: {
      title: 'The Locked Furnace',
      desc: '<p>Anyone can reach into this furnace and set its ' + c('heat') + ' to anything, even a negative number! Lock it down:</p>' +
        '<ol><li>Make ' + c('heat') + ' <b>private</b>, so only the class\'s own methods can touch it.</li>' +
        '<li>Add a public method ' + c('void add_heat(int amount)') + ' that adds ' + c('amount') + ', but <b>ignores</b> amounts of 0 or less.</li>' +
        '<li>Add a public method ' + c('int get_heat() const') + ' that returns the heat.</li></ol>' +
        '<p>main is already written. It should print <b>75</b> (the -40 is ignored).</p>',
      starter: P('Furnace f;\nf.add_heat(50);\nf.add_heat(-40);\nf.add_heat(25);\ncout << f.get_heat() << endl;', 'class Furnace {\npublic:\n    int heat = 0;\n};'),
      hints: ['Write private: above heat, and public: above the methods.', 'In add_heat, only add when amount > 0.'],
      similar: { task: 'A lamp whose brightness can only go up to 10.', code: P('Lamp l;\nl.brighten(4);\nl.brighten(9);\ncout << l.get_level() << endl;', 'class Lamp {\nprivate:\n    int level = 0;\npublic:\n    void brighten(int n) {\n        level += n;\n        if (level > 10) {\n            level = 10;\n        }\n    }\n    int get_level() const {\n        return level;\n    }\n};') },
      gate: 'B',
      expect: ['75'],
      require: [[hidden('Furnace', '\\bint\\s+heat\\b'), 'Make ' + c('heat') + ' private: put it under ' + c('private:') + '.']],
      success: 'Click. The furnace door locks, and the heat can only rise the safe way.',
    },
    cpp2_enc3: {
      title: 'The Blade Smith',
      desc: '<p>A constructor can set the members with an <b>initializer list</b>: a colon after the brackets, then each member with its starting value:</p>' +
        block('Torch(int f) : fuel(f), lit(false) {}') +
        '<p>Write the constructor ' + c('Blade(string n, int s)') + ' for the class ' + c('Blade') + '. Use an initializer list to set ' + c('name') + ' to ' + c('n') + ' and ' + c('sharpness') + ' to ' + c('s') + '. Then make ' + c('describe()') + ' return the name and sharpness like this:</p>' +
        '<pre>Ember Edge (sharpness 7)\nFrost Fang (sharpness 4)</pre>' +
        '<p>Tip: ' + c('to_string(sharpness)') + ' turns the number into text.</p>',
      starter: P('Blade a("Ember Edge", 7);\nBlade b("Frost Fang", 4);\ncout << a.describe() << endl;\ncout << b.describe() << endl;', 'class Blade {\nprivate:\n    string name;\n    int sharpness;\n\npublic:\n    // write the constructor here\n\n    string describe() const {\n        return "?";\n    }\n};'),
      hints: ['The constructor has the class name and no return type: Blade(string n, int s) : ... {}', 'describe can glue text with +: name + " (sharpness " + ... + ")"'],
      similar: { task: 'A Shield with an initializer list.', code: P('Shield s("Oak", 3);\ncout << s.info() << endl;', 'class Shield {\nprivate:\n    string wood;\n    int layers;\n\npublic:\n    Shield(string w, int l) : wood(w), layers(l) {}\n\n    string info() const {\n        return wood + " shield, " + to_string(layers) + " layers";\n    }\n};') },
      gate: 'C',
      expect: ['Ember Edge (sharpness 7)', 'Frost Fang (sharpness 4)'],
      require: [[/Blade\s*\(\s*string\s+\w+\s*,\s*int\s+\w+\s*\)\s*:\s*\w+\s*\(/, 'Write the constructor with an initializer list: ' + c('Blade(string n, int s) : name(n), sharpness(s) {}') + '.']],
      success: 'Two fine blades leave the anvil, each with its name engraved.',
    },
    cpp2_enc4: {
      title: 'The Guarded Vault',
      desc: '<p>The forge keeps its gold in a ' + c('Vault') + '. The gold is private, and every change goes through a method that checks it first. Finish the class:</p>' +
        '<ul><li>' + c('Vault(int start)') + ' sets the gold to ' + c('start') + ' (use an initializer list).</li>' +
        '<li>' + c('void deposit(int n)') + ' adds ' + c('n') + ', but only if it is more than 0.</li>' +
        '<li>' + c('bool withdraw(int n)') + ' takes ' + c('n') + ' out and returns ' + c('true') + '. If ' + c('n') + ' is 0 or less, or more than the gold inside, it changes nothing and returns ' + c('false') + '.</li>' +
        '<li>' + c('int balance() const') + ' returns the gold.</li></ul>' +
        '<p>main should print:</p><pre>true\nfalse\nfalse\n85</pre>',
      starter: P('Vault v(100);\ncout << boolalpha;\ncout << v.withdraw(30) << endl;\ncout << v.withdraw(500) << endl;\nv.deposit(-20);\nv.deposit(15);\ncout << v.withdraw(0) << endl;\ncout << v.balance() << endl;',
        'class Vault {\nprivate:\n    int gold;\n\npublic:\n    Vault(int start) : gold(start) {}\n\n    void deposit(int n) {\n        gold += n;\n    }\n\n    bool withdraw(int n) {\n        gold -= n;\n        return true;\n    }\n\n    int balance() const {\n        return gold;\n    }\n};'),
      hints: ['In withdraw, check the bad cases first and return false straight away. Only then subtract and return true.', 'deposit needs an if around the +=.'],
      similar: { task: 'A potion bag that refuses to give out potions it doesn\'t have.', code: P('Bag b(2);\ncout << boolalpha << b.take() << " " << b.take() << " " << b.take() << endl;', 'class Bag {\nprivate:\n    int potions;\n\npublic:\n    Bag(int p) : potions(p) {}\n\n    bool take() {\n        if (potions == 0) {\n            return false;\n        }\n        potions--;\n        return true;\n    }\n};') },
      gate: 'D',
      expect: ['true', 'false', 'false', '85'],
      require: [[hidden('Vault', '\\bint\\s+gold\\b'), 'Keep ' + c('gold') + ' private.']],
      success: 'The vault refuses every bad request. Not one coin goes missing.',
    },
    cpp2_enc5: {
      title: 'The Crucible',
      desc: '<p>A crucible melts metals together, but it only holds so many. Write the class ' + c('Crucible') + ' with:</p>' +
        '<ul><li>private members ' + c('vector<string> metals') + ' and ' + c('int capacity') + '</li>' +
        '<li>a constructor ' + c('Crucible(int cap)') + ' that sets the capacity</li>' +
        '<li>' + c('bool add(const string &metal)') + ': if the crucible is full, return ' + c('false') + '. Otherwise add the metal to the vector and return ' + c('true') + '.</li>' +
        '<li>' + c('int count() const') + ': how many metals are inside</li>' +
        '<li>' + c('string contents() const') + ': the metals joined with ' + c('" + "') + ', like ' + c('iron + copper + tin') + '</li></ul>' +
        '<p>main is already written and should print:</p><pre>true\ntrue\ntrue\nfalse\n3 metals\niron + copper + tin</pre>',
      starter: P('Crucible pot(3);\ncout << boolalpha;\ncout << pot.add("iron") << endl;\ncout << pot.add("copper") << endl;\ncout << pot.add("tin") << endl;\ncout << pot.add("gold") << endl;\ncout << pot.count() << " metals" << endl;\ncout << pot.contents() << endl;',
        'class Crucible {\nprivate:\n    vector<string> metals;\n    int capacity;\n\npublic:\n    Crucible(int cap) : capacity(cap) {}\n\n    // write add, count and contents here\n};'),
      hints: ['The crucible is full when metals.size() has reached capacity.', 'For contents, build a string in a loop. Put " + " before every metal except the first one.'],
      similar: { task: 'A key ring that holds at most 2 keys.', code: P('KeyRing r;\ncout << boolalpha << r.add("red") << r.add("blue") << r.add("gold") << endl;\ncout << r.list() << endl;', 'class KeyRing {\nprivate:\n    vector<string> keys;\n\npublic:\n    bool add(const string &k) {\n        if (keys.size() >= 2) {\n            return false;\n        }\n        keys.push_back(k);\n        return true;\n    }\n\n    string list() const {\n        string out = "";\n        for (const string &k : keys) {\n            out += "[" + k + "]";\n        }\n        return out;\n    }\n};') },
      gate: 'E',
      expect: ['true', 'true', 'true', 'false', '3 metals', 'iron + copper + tin'],
      require: [[hidden('Crucible', 'vector\\s*<\\s*string\\s*>\\s*metals\\b'), 'Keep ' + c('metals') + ' private.'], [/bool\s+add\s*\(\s*const\s+string\s*&/, 'Write ' + c('add') + ' as ' + c('bool add(const string &metal)') + '.']],
      success: 'The metals swirl together into a shining alloy. Your first fully guarded class!',
    },

    // ---------------------------------------------------------------- level 3: STL algorithms & lambdas
    cpp2_stl1: {
      title: 'The Sorting Belt',
      desc: '<p>Parts arrive on the belt in a jumble. Use the STL instead of writing your own sorting loop:</p>' +
        block('sort(parts.begin(), parts.end());     // smallest first\nreverse(parts.begin(), parts.end());  // flip the order') +
        '<p>Sort ' + c('parts') + ' and print it, then reverse it and print it again. The starter already has the printing loops. The output should be:</p>' +
        '<pre>3 7 19 25 42\n42 25 19 7 3</pre>',
      starter: P('vector<int> parts = {42, 7, 19, 3, 25};\n\n// sort here\nfor (int p : parts) {\n    cout << p << " ";\n}\ncout << endl;\n\n// reverse here\nfor (int p : parts) {\n    cout << p << " ";\n}\ncout << endl;'),
      hints: ['sort and reverse both take a range: parts.begin() and parts.end().', 'They change the vector in place. Call them right before each printing loop.'],
      similar: { task: 'Sort a vector of names alphabetically.', code: P('vector<string> names = {"Linus", "Ada", "Grace"};\nsort(names.begin(), names.end());\nfor (const string &n : names) {\n    cout << n << endl;\n}') },
      gate: 'A',
      expect: ['3 7 19 25 42', '42 25 19 7 3'],
      require: [[/\bsort\s*\(\s*parts\s*\.\s*begin\s*\(\s*\)/, 'Use ' + c('sort(parts.begin(), parts.end());') + '.']],
      success: 'The parts line up from smallest to biggest, and back again.',
    },
    cpp2_stl2: {
      title: 'The Heavy Counter',
      desc: '<p>' + c('count_if') + ' counts the items for which a test is true. The test is a <b>lambda</b>, a small function written right where you need it:</p>' +
        block('int n = count_if(v.begin(), v.end(), [](int x) { return x > 3; });') +
        '<p>Count the crates in ' + c('weights') + ' that are <b>heavier than 50</b>, and the ones that are <b>lighter than 10</b>. Use ' + c('count_if') + ' for both. Print:</p>' +
        '<pre>heavy: 3\nlight: 2</pre>',
      starter: P('vector<int> weights = {12, 75, 3, 51, 50, 8, 99};\n\nint heavy = 0;\nint light = 0;\n// use count_if for each\n\ncout << "heavy: " << heavy << endl;\ncout << "light: " << light << endl;'),
      hints: ['The lambda takes one crate weight and returns true when it should be counted.', 'Exactly 50 is not heavier than 50, so use > not >=.'],
      similar: { task: 'Count the even numbers.', code: P('vector<int> v = {1, 2, 3, 4, 6};\nint evens = count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });\ncout << evens << endl;') },
      gate: 'B',
      expect: ['heavy: 3', 'light: 2'],
      require: [[/count_if\s*\([^;]*\[[^\]]*\]\s*\([^]*count_if\s*\([^;]*\[[^\]]*\]\s*\(/, 'Use ' + c('count_if') + ' with a lambda for <b>both</b> counts.']],
      success: 'Three heavy crates to the crane, two light ones to the shelf.',
    },
    cpp2_stl3: {
      title: 'The Ranking Press',
      desc: '<p>' + c('sort') + ' can take a third argument: a lambda that answers <b>"should a come before b?"</b></p>' +
        block('sort(v.begin(), v.end(), [](int a, int b) { return a > b; });   // biggest first') +
        '<p>Sort the ' + c('Blade') + ' structs in ' + c('rack') + ' from <b>sharpest to bluntest</b>, then print each name and sharpness. Expected output:</p>' +
        '<pre>Moonsplitter 9\nEmber Edge 7\nFrost Fang 4\nOld Rusty 1</pre>' +
        '<p>The lambda gets two blades. Taking them as ' + c('const Blade &') + ' avoids copying them.</p>',
      starter: P('vector<Blade> rack = {{"Frost Fang", 4}, {"Moonsplitter", 9}, {"Old Rusty", 1}, {"Ember Edge", 7}};\n\n// sort the rack here\n\nfor (const Blade &b : rack) {\n    cout << b.name << " " << b.sharpness << endl;\n}', 'struct Blade {\n    string name;\n    int sharpness;\n};'),
      hints: ['The comparator is [](const Blade &a, const Blade &b) { return ...; }', 'Return true when a should come first, which is when a is sharper than b.'],
      similar: { task: 'Sort potions from cheapest to most expensive.', code: P('vector<Potion> shop = {{"heal", 30}, {"speed", 12}};\nsort(shop.begin(), shop.end(), [](const Potion &a, const Potion &b) { return a.price < b.price; });\nfor (const Potion &p : shop) {\n    cout << p.name << endl;\n}', 'struct Potion {\n    string name;\n    int price;\n};') },
      gate: 'C',
      expect: ['Moonsplitter 9', 'Ember Edge 7', 'Frost Fang 4', 'Old Rusty 1'],
      require: [[/sort\s*\(\s*rack\s*\.\s*begin\s*\(\s*\)\s*,\s*rack\s*\.\s*end\s*\(\s*\)\s*,\s*\[/, 'Sort with a lambda: ' + c('sort(rack.begin(), rack.end(), [](const Blade &a, const Blade &b) { ... });') + '.']],
      success: 'The press stamps a rank on every blade. The sharpest leads the line!',
    },
    cpp2_stl4: {
      title: 'The Quality Gate',
      desc: '<p>' + c('find_if') + ' looks for the <b>first</b> item that passes a test. It returns an <b>iterator</b> (a marker pointing at that item), or ' + c('end()') + ' if nothing passed:</p>' +
        block('auto it = find_if(v.begin(), v.end(), [](int x) { return x < 0; });\nif (it != v.end()) {\n    cout << *it << " at position " << (it - v.begin()) << endl;\n}') +
        '<p>Write ' + c('void inspect(const vector<int> &blades)') + '. Use ' + c('find_if') + ' to find the first blade with strength <b>below 20</b>, and print ' + c('weak blade: S at position P') + '. If there is none, print ' + c('all blades pass') + '.</p>' +
        '<p>main inspects three racks and should print:</p><pre>weak blade: 12 at position 2\nall blades pass\nweak blade: 5 at position 0</pre>',
      starter: P('inspect({30, 45, 12, 60, 8});\ninspect({20, 99, 41});\ninspect({5});', 'void inspect(const vector<int> &blades) {\n    // use find_if here\n}'),
      hints: ['Compare the iterator with blades.end() to know whether something was found.', '*it is the value it points at. it - blades.begin() is its position.'],
      similar: { task: 'Find the first word that starts with "b".', code: P('vector<string> words = {"anvil", "bellows", "brick"};\nauto it = find_if(words.begin(), words.end(), [](const string &w) { return w[0] == \'b\'; });\nif (it != words.end()) {\n    cout << *it << endl;\n}') },
      gate: 'D',
      expect: ['weak blade: 12 at position 2', 'all blades pass', 'weak blade: 5 at position 0'],
      require: [[/find_if\s*\(/, 'Use ' + c('find_if') + ' to search.'], [/\.end\s*\(\s*\)/, 'Check whether ' + c('find_if') + ' returned ' + c('blades.end()') + '.']],
      success: 'The gate flags every weak blade and lets the strong ones through.',
    },
    cpp2_stl5: {
      title: 'The Tally Machine',
      desc: '<p>Two more tools from the STL:</p>' +
        block('transform(v.begin(), v.end(), v.begin(), [](int x) { return x * 2; });  // change every item\nint total = accumulate(v.begin(), v.end(), 0);                         // add them all up (from <numeric>)') +
        '<p>Every price in ' + c('prices') + ' needs <b>5 coins of forge tax</b> added. Use ' + c('transform') + ' to add it to every price, print the new prices on one line, then use ' + c('accumulate') + ' to print the total:</p>' +
        '<pre>15 30 45 105\ntotal: 195</pre>',
      starter: P('vector<int> prices = {10, 25, 40, 100};\n\n// add the tax with transform\n\nfor (int p : prices) {\n    cout << p << " ";\n}\ncout << endl;\n\nint total = 0;   // use accumulate\ncout << "total: " << total << endl;'),
      hints: ['transform writes its results back into prices if the third argument is prices.begin().', 'accumulate(prices.begin(), prices.end(), 0) starts at 0 and adds every item.'],
      similar: { task: 'Square every number, then add them up.', code: P('vector<int> v = {1, 2, 3};\ntransform(v.begin(), v.end(), v.begin(), [](int x) { return x * x; });\ncout << accumulate(v.begin(), v.end(), 0) << endl;') },
      gate: 'E',
      expect: ['15 30 45 105', 'total: 195'],
      require: [[/transform\s*\(/, 'Add the tax with ' + c('transform') + '.'], [/accumulate\s*\(/, 'Add up the prices with ' + c('accumulate') + '.']],
      success: 'Ka-ching! The tally machine prints a perfect receipt.',
    },
    cpp2_stl6: {
      title: 'The Order Board',
      desc: '<p>The order board lists every order as an ' + c('Order') + ' struct. A lambda can use variables from outside if you list them in its <b>capture</b> brackets: ' + c('[budget]') + ' gives it a copy, ' + c('[&total]') + ' lets it change ' + c('total') + '.</p>' +
        '<p>Using STL algorithms with lambdas, print:</p><ol>' +
        '<li>the total cost of all orders (' + c('qty * price') + ' each), with ' + c('accumulate') + ' and a lambda ' + c('[](int sum, const Order &o) { ... }') + '</li>' +
        '<li>how many orders cost more than ' + c('budget') + ', with ' + c('count_if') + ' and a lambda that captures ' + c('budget') + '</li>' +
        '<li>the item of the order with the highest price per piece, with ' + c('max_element') + ' and a comparator lambda (it returns an iterator, so use ' + c('it->item') + ')</li></ol>' +
        '<pre>total: 280\nover budget: 2\npriciest: crown</pre>',
      starter: P('vector<Order> orders = {{"nails", 50, 1}, {"hinge", 4, 15}, {"crown", 1, 120}, {"chain", 10, 5}};\nint budget = 55;\n\nint total = 0;\ncout << "total: " << total << endl;\n\nint over = 0;\ncout << "over budget: " << over << endl;\n\ncout << "priciest: " << "?" << endl;', 'struct Order {\n    string item;\n    int qty;\n    int price;\n};'),
      hints: ['The accumulate lambda gets the sum so far and one order, and returns the new sum. Start it at 0.', 'For count_if, write [budget](const Order &o) { return o.qty * o.price > budget; }. For max_element, return a.price < b.price.'],
      similar: { task: 'Count scores above a pass mark, and add up all the scores.', code: P('vector<int> scores = {40, 75, 90, 55};\nint pass = 60;\nint passed = count_if(scores.begin(), scores.end(), [pass](int s) { return s >= pass; });\nint sum = accumulate(scores.begin(), scores.end(), 0, [](int acc, int s) { return acc + s; });\ncout << passed << " passed, total " << sum << endl;') },
      gate: 'G',
      expect: ['total: 280', 'over budget: 2', 'priciest: crown'],
      require: [[/accumulate\s*\(/, 'Work out the total with ' + c('accumulate') + '.'], [/count_if\s*\([^;]*\[\s*(=|&|&?\s*budget)\s*\]/, 'Count with ' + c('count_if') + ' and a lambda that captures ' + c('budget') + ', like ' + c('[budget]') + '.'], [/max_element\s*\(/, 'Find the priciest order with ' + c('max_element') + '.']],
      success: 'Every order is totalled, checked and ranked. The assembly line runs itself now!',
    },

    // ---------------------------------------------------------------- level 4: overloading
    cpp2_over1: {
      title: 'The Echo Bells',
      desc: '<p>In C++ two functions can have the <b>same name</b> as long as their parameters are different. The compiler looks at what you pass in and picks the matching one. This is called <b>overloading</b>.</p>' +
        '<p>' + c('string ring(int n)') + ' is already written. Add a second ' + c('ring') + ' that takes a ' + c('string word') + ' and returns ' + c('"word: "') + ' followed by the word. main should print:</p>' +
        '<pre>bell 3\nword: iron\nbell 12</pre>',
      starter: P('cout << ring(3) << endl;\ncout << ring("iron") << endl;\ncout << ring(12) << endl;', 'string ring(int n) {\n    return "bell " + to_string(n);\n}\n\n// write ring(string word) here'),
      hints: ['Copy the shape of the first function, but change the parameter type to string.', 'Both functions are called ring. Only the parameter is different.'],
      similar: { task: 'Overload twice for numbers and for text.', code: P('cout << twice(4) << endl;\ncout << twice(string("ha")) << endl;', 'int twice(int n) {\n    return n * 2;\n}\n\nstring twice(string s) {\n    return s + s;\n}') },
      gate: 'A',
      expect: ['bell 3', 'word: iron', 'bell 12'],
      require: [[/string\s+ring\s*\(\s*int\s+\w+\s*\)[^]*string\s+ring\s*\(\s*(const\s+)?string\s*&?\s*\w+\s*\)|string\s+ring\s*\(\s*(const\s+)?string\s*&?\s*\w+\s*\)[^]*string\s+ring\s*\(\s*int\s+\w+\s*\)/, 'Keep both functions named ' + c('ring') + ': one taking an ' + c('int') + ', one taking a ' + c('string') + '.']],
      success: 'Ding and dong! Each bell answers in its own voice.',
    },
    cpp2_over2: {
      title: 'The Price Scales',
      desc: '<p>Overloads can also differ in <b>how many</b> parameters they take.</p>' +
        '<p>' + c('int cost(int bars)') + ' prices iron bars at 10 coins each. Add another ' + c('cost') + ' that takes ' + c('int bars, int gems') + ': bars are still 10 coins each, and gems are 25 coins each. main should print:</p>' +
        '<pre>30\n80\n100</pre>' +
        '<p>Bonus: the new version can call the old one for the bars part.</p>',
      starter: P('cout << cost(3) << endl;\ncout << cost(3, 2) << endl;\ncout << cost(0, 4) << endl;', 'int cost(int bars) {\n    return bars * 10;\n}'),
      hints: ['The second function is also called cost, with two int parameters.', 'cost(3, 2) is 3 bars and 2 gems: 30 + 50.'],
      similar: { task: 'Area of a square or of a rectangle.', code: P('cout << area(4) << endl;\ncout << area(2, 5) << endl;', 'int area(int side) {\n    return side * side;\n}\n\nint area(int w, int h) {\n    return w * h;\n}') },
      gate: 'B',
      expect: ['30', '80', '100'],
      require: [[/int\s+cost\s*\(\s*int\s+\w+\s*\)[^]*int\s+cost\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)|int\s+cost\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)[^]*int\s+cost\s*\(\s*int\s+\w+\s*\)/, 'Keep ' + c('cost(int bars)') + ' and add ' + c('cost(int bars, int gems)') + '.']],
      success: 'The scales balance for every kind of order.',
    },
    cpp2_over3: {
      title: 'The Measuring Bench',
      desc: '<p>The bench can measure anything you put on it. Write three overloads of ' + c('show') + ':</p>' +
        '<ul><li>' + c('void show(int x)') + ' prints ' + c('number: 7') + '</li>' +
        '<li>' + c('void show(string s)') + ' prints ' + c('text: anvil') + '</li>' +
        '<li>' + c('void show(const vector<int> &v)') + ' prints how many items there are and then the items: ' + c('list of 3: 4 8 15') + '</li></ul>' +
        '<p>main should print:</p><pre>number: 7\ntext: anvil\nlist of 3: 4 8 15\nnumber: 0</pre>',
      starter: P('vector<int> loads = {4, 8, 15};\nshow(7);\nshow("anvil");\nshow(loads);\nshow(0);', 'void show(int x) {\n    cout << "number: " << x << endl;\n}'),
      hints: ['Each overload is a separate function called show, with a different parameter type.', 'For the vector version, print "list of " and v.size() and ":" first, then each item with a space before it.'],
      similar: { task: 'Overload describe for a number and for a list of numbers.', code: P('vector<int> v = {1, 2};\ndescribe(5);\ndescribe(v);', 'void describe(int n) {\n    cout << "one value: " << n << endl;\n}\n\nvoid describe(const vector<int> &v) {\n    cout << v.size() << " values" << endl;\n}') },
      gate: 'C',
      expect: ['number: 7', 'text: anvil', 'list of 3: 4 8 15', 'number: 0'],
      require: [[/void\s+show\s*\(\s*(const\s+)?string\s*&?\s*\w+\s*\)/, 'Write ' + c('void show(string s)') + '.'], [/void\s+show\s*\(\s*const\s+vector\s*<\s*int\s*>\s*&\s*\w+\s*\)/, 'Write ' + c('void show(const vector<int> &v)') + '.']],
      success: 'The bench reads out every load, whatever its shape.',
    },
    cpp2_over4: {
      title: 'The Armory Constructors',
      desc: '<p>Constructors can be overloaded too, so an object can be built in more than one way. Give the class ' + c('Weapon') + ' three constructors:</p>' +
        '<ul><li>' + c('Weapon()') + ': a ' + c('"stick"') + ' with damage 1</li>' +
        '<li>' + c('Weapon(string n)') + ': named ' + c('n') + ', with damage 5</li>' +
        '<li>' + c('Weapon(string n, int d)') + ': named ' + c('n') + ', with damage ' + c('d') + ' (already written)</li></ul>' +
        '<p>main should print:</p><pre>stick deals 1\nHammer deals 5\nGreat Axe deals 12</pre>',
      starter: P('Weapon a;\nWeapon b("Hammer");\nWeapon c("Great Axe", 12);\ncout << a.info() << endl;\ncout << b.info() << endl;\ncout << c.info() << endl;',
        'class Weapon {\nprivate:\n    string name;\n    int damage;\n\npublic:\n    Weapon(string n, int d) : name(n), damage(d) {}\n\n    string info() const {\n        return name + " deals " + to_string(damage);\n    }\n};'),
      hints: ['Each constructor is written like the one that is there: the class name, its own parameters, an initializer list and {}.', 'Weapon() has no parameters at all: Weapon() : name("stick"), damage(1) {}'],
      similar: { task: 'A Torch that can start with default fuel or a chosen amount.', code: P('Torch t1;\nTorch t2(9);\ncout << t1.fuel << " " << t2.fuel << endl;', 'struct Torch {\n    int fuel;\n    Torch() : fuel(3) {}\n    Torch(int f) : fuel(f) {}\n};') },
      gate: 'D',
      expect: ['stick deals 1', 'Hammer deals 5', 'Great Axe deals 12'],
      require: [[/Weapon\s*\(\s*\)/, 'Add a constructor with no parameters: ' + c('Weapon()') + '.'], [/Weapon\s*\(\s*string\s+\w+\s*\)/, 'Add a constructor that takes only a name: ' + c('Weapon(string n)') + '.']],
      success: 'Three weapons, three ways to forge them. The armory is stocked!',
    },
    cpp2_over5: {
      title: 'The Max Machine',
      desc: '<p>The Max Machine finds the biggest number in whatever you feed it. Write three overloads of ' + c('biggest') + ':</p>' +
        '<ul><li>' + c('int biggest(int a, int b)') + '</li>' +
        '<li>' + c('int biggest(int a, int b, int c)') + ': it can simply call the two-number version twice</li>' +
        '<li>' + c('int biggest(const vector<int> &v)') + ': the biggest item of a vector that is never empty</li></ul>' +
        '<p>main should print:</p><pre>9\n12\n21\n-2</pre>',
      starter: P('vector<int> heap = {5, 21, 13, 8};\nvector<int> cold = {-7, -2, -9};\ncout << biggest(4, 9) << endl;\ncout << biggest(12, 3, 7) << endl;\ncout << biggest(heap) << endl;\ncout << biggest(cold) << endl;', '// write the three versions of biggest here'),
      hints: ['biggest(a, biggest(b, c)) reuses the two-number version.', 'For the vector, start with the first item v[0] (not 0, or negative numbers break it) and loop over the rest.'],
      similar: { task: 'Overloads that find the smallest of two numbers or of a vector.', code: P('vector<int> v = {4, 2, 8};\ncout << smallest(3, 1) << " " << smallest(v) << endl;', 'int smallest(int a, int b) {\n    if (a < b) {\n        return a;\n    }\n    return b;\n}\n\nint smallest(const vector<int> &v) {\n    int best = v[0];\n    for (int x : v) {\n        best = smallest(best, x);\n    }\n    return best;\n}') },
      gate: 'E',
      expect: ['9', '12', '21', '-2'],
      require: [[/int\s+biggest\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/, 'Write ' + c('int biggest(int a, int b)') + '.'], [/int\s+biggest\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/, 'Write ' + c('int biggest(int a, int b, int c)') + '.'], [/int\s+biggest\s*\(\s*const\s+vector\s*<\s*int\s*>\s*&\s*\w+\s*\)/, 'Write ' + c('int biggest(const vector<int> &v)') + '.']],
      success: 'Whatever goes in, the biggest comes out. Overloading mastered!',
    },

    // ---------------------------------------------------------------- level 5: inheritance & virtual
    cpp2_virt1: {
      title: 'The First Golem',
      desc: '<p>A class can be built <b>on top of</b> another class. It gets all of the base class\'s members for free, and can add its own:</p>' +
        block('class Dog : public Animal { ... };   // a Dog is an Animal, plus extra') +
        '<p>' + c('Golem') + ' is already written. ' + c('StoneGolem') + ' is almost done: it calls the Golem constructor in its initializer list and adds a ' + c('smash()') + ' method. But it doesn\'t inherit from Golem yet!</p>' +
        '<p>Make ' + c('StoneGolem') + ' inherit from ' + c('Golem') + '. main should print:</p><pre>Boulder walks\n200\nBoulder smashes!</pre>',
      starter: P('StoneGolem g("Boulder");\ncout << g.walk() << endl;\ncout << g.hp << endl;\ncout << g.smash() << endl;', GOLEM_BASE + '\n\n// make StoneGolem inherit from Golem\nclass StoneGolem {\npublic:\n    StoneGolem(string n) : Golem(n, 200) {}\n\n    string smash() const {\n        return this->name + " smashes!";\n    }\n};'),
      hints: ['After the class name, add a colon, the word public, and the base class name.', 'walk() and hp come from Golem: StoneGolem doesn\'t need to write them again.'],
      similar: { task: 'A Cat class built on an Animal class.', code: P('Cat c("Tom");\ncout << c.name << " " << c.purr() << endl;', 'class Animal {\npublic:\n    string name;\n    Animal(string n) : name(n) {}\n};\n\nclass Cat : public Animal {\npublic:\n    Cat(string n) : Animal(n) {}\n    string purr() const {\n        return "purr";\n    }\n};') },
      gate: 'A',
      expect: ['Boulder walks', '200', 'Boulder smashes!'],
      require: [[/class\s+StoneGolem\s*:\s*public\s+Golem\b/, 'Write ' + c('class StoneGolem : public Golem') + '.']],
      success: 'The stone golem rumbles awake. It walks like any golem, and smashes like no other!',
    },
    cpp2_virt2: {
      title: 'The Iron Guard',
      desc: '<p>Here ' + c('Golem') + ' keeps ' + c('name') + ' and ' + c('hp') + ' <b>protected</b>: hidden from the outside world, but open to classes that inherit from it.</p>' +
        '<p>Write the class ' + c('IronGolem') + ', which inherits from ' + c('Golem') + ' and has:</p>' +
        '<ul><li>its own private ' + c('int armor') + '</li>' +
        '<li>a constructor ' + c('IronGolem(string n, int a)') + ' that passes ' + c('n') + ' and <b>150</b> hp to the Golem constructor, and sets ' + c('armor') + ' to ' + c('a') + ', all in the initializer list</li>' +
        '<li>' + c('int defense() const') + ': ' + c('hp / 10 + armor') + '</li>' +
        '<li>' + c('string status() const') + ': like ' + c('Anvil: 150 hp, armor 8') + '</li></ul>' +
        '<p>main should print:</p><pre>Anvil: 150 hp, armor 8\n23</pre>',
      starter: P('IronGolem guard("Anvil", 8);\ncout << guard.status() << endl;\ncout << guard.defense() << endl;', 'class Golem {\nprotected:\n    string name;\n    int hp;\n\npublic:\n    Golem(string n, int h) : name(n), hp(h) {}\n};\n\n// write IronGolem here'),
      hints: ['The initializer list can call the base constructor and set your own member: : Golem(n, 150), armor(a)', 'Inside IronGolem you can use name and hp directly, because they are protected (not private) in Golem.'],
      similar: { task: 'A Knight that builds on a Person and adds a title.', code: P('Knight k("Ada", "Sir");\ncout << k.greet() << endl;', 'class Person {\nprotected:\n    string name;\npublic:\n    Person(string n) : name(n) {}\n};\n\nclass Knight : public Person {\nprivate:\n    string title;\npublic:\n    Knight(string n, string t) : Person(n), title(t) {}\n    string greet() const {\n        return title + " " + name;\n    }\n};') },
      gate: 'B',
      expect: ['Anvil: 150 hp, armor 8', '23'],
      require: [[/class\s+IronGolem\s*:\s*public\s+Golem\b/, 'Write ' + c('class IronGolem : public Golem') + '.'], [/:\s*Golem\s*\(\s*\w+\s*,\s*150\s*\)/, 'Call the base constructor in the initializer list: ' + c(': Golem(n, 150), armor(a)') + '.']],
      success: 'The iron guard takes its post. Its armour gleams.',
    },
    cpp2_virt3: {
      title: 'The Speaking Stones',
      desc: '<p>' + c('wake') + ' takes any golem as a ' + c('const Golem &') + ' and asks it to speak. But every golem just says ' + c('...') + '!</p>' +
        '<p>Through a base-class reference, C++ calls the <b>base</b> version of a method, unless the method is <b>virtual</b>. Then it looks at the real object and calls <i>its</i> version.</p>' +
        '<ol><li>Mark ' + c('speak') + ' in ' + c('Golem') + ' as ' + c('virtual') + '.</li>' +
        '<li>Mark the ' + c('speak') + ' methods in ' + c('ClayGolem') + ' and ' + c('IronGolem') + ' with ' + c('override') + ' (after the ' + c('const') + '). It asks the compiler to check that they really replace a virtual method.</li></ol>' +
        '<p>main should print:</p><pre>Golem says ...\nClay says squelch\nIron says clang</pre>',
      starter: P('Golem plain;\nClayGolem clay;\nIronGolem iron;\nwake(plain, "Golem");\nwake(clay, "Clay");\nwake(iron, "Iron");',
        'class Golem {\npublic:\n    string speak() const {\n        return "...";\n    }\n};\n\nclass ClayGolem : public Golem {\npublic:\n    string speak() const {\n        return "squelch";\n    }\n};\n\nclass IronGolem : public Golem {\npublic:\n    string speak() const {\n        return "clang";\n    }\n};\n\nvoid wake(const Golem &g, string who) {\n    cout << who << " says " << g.speak() << endl;\n}'),
      hints: ['Write virtual in front of string speak() const in the Golem class.', 'In the derived classes it reads: string speak() const override { ... }'],
      similar: { task: 'Animals that make their own sound through an Animal reference.', code: P('Dog d;\nhear(d);', 'class Animal {\npublic:\n    virtual string sound() const {\n        return "?";\n    }\n};\n\nclass Dog : public Animal {\npublic:\n    string sound() const override {\n        return "woof";\n    }\n};\n\nvoid hear(const Animal &a) {\n    cout << a.sound() << endl;\n}') },
      gate: 'C',
      expect: ['Golem says ...', 'Clay says squelch', 'Iron says clang'],
      require: [[/virtual\s+string\s+speak\s*\(/, 'Make ' + c('speak') + ' virtual in ' + c('Golem') + ': ' + c('virtual string speak() const') + '.'], [/speak\s*\(\s*\)\s*const\s+override[^]*speak\s*\(\s*\)\s*const\s+override/, 'Mark both derived ' + c('speak') + ' methods with ' + c('override') + '.']],
      success: 'Each stone speaks in its own voice. That is what virtual does.',
    },
    cpp2_virt4: {
      title: 'The Echo of the Base',
      desc: '<p>An overriding method can still use the base version and add to it. Call it with the base class name and ' + c('::') + ':</p>' +
        block('string describe() const override {\n    return Animal::describe() + " and barks";\n}') +
        '<p>Write ' + c('LavaGolem') + ' (inheriting from ' + c('Golem') + ') with a constructor ' + c('LavaGolem(string n)') + ' that passes ' + c('n') + ' to Golem, and override ' + c('describe()') + ' so it returns the Golem description followed by ' + c('", hot to the touch"') + '.</p>' +
        '<p>main should print:</p><pre>Pebble the golem\nMagma the golem, hot to the touch</pre>',
      starter: P('Golem pebble("Pebble");\nLavaGolem magma("Magma");\nannounce(pebble);\nannounce(magma);',
        'class Golem {\nprotected:\n    string name;\n\npublic:\n    Golem(string n) : name(n) {}\n    virtual ~Golem() {}\n\n    virtual string describe() const {\n        return name + " the golem";\n    }\n};\n\n// write LavaGolem here\n\nvoid announce(const Golem &g) {\n    cout << g.describe() << endl;\n}'),
      hints: ['class LavaGolem : public Golem, with a constructor LavaGolem(string n) : Golem(n) {}', 'Inside describe, Golem::describe() gives you "Magma the golem". Glue the extra text onto it.'],
      similar: { task: 'A Shout that builds on a Message.', code: P('Shout s;\ncout << s.text() << endl;', 'class Message {\npublic:\n    virtual string text() const {\n        return "hello";\n    }\n};\n\nclass Shout : public Message {\npublic:\n    string text() const override {\n        return Message::text() + "!!!";\n    }\n};') },
      gate: 'D',
      expect: ['Pebble the golem', 'Magma the golem, hot to the touch'],
      require: [[/class\s+LavaGolem\s*:\s*public\s+Golem\b/, 'Write ' + c('class LavaGolem : public Golem') + '.'], [/Golem\s*::\s*describe\s*\(\s*\)/, 'Reuse the base version with ' + c('Golem::describe()') + '.']],
      success: 'Magma steams gently. It is a golem first, and lava second.',
    },
    cpp2_virt5: {
      title: 'The Blueprint Vault',
      desc: '<p>A method ending in ' + c('= 0') + ' is <b>pure virtual</b>: it has no body at all. A class with one is <b>abstract</b>, a blueprint for other classes. You can\'t make a ' + c('Part') + ' object, only objects of classes that override every pure virtual method.</p>' +
        '<p>' + c('Part') + ' is written. Finish ' + c('Gear') + ' and ' + c('Plate') + ':</p>' +
        '<ul><li>' + c('Gear(int t)') + ' stores the number of teeth. Its ' + c('weight()') + ' is ' + c('teeth * 2') + ' and its ' + c('label()') + ' is ' + c('"gear"') + '.</li>' +
        '<li>' + c('Plate(int w, int h)') + ' stores width and height. Its ' + c('weight()') + ' is ' + c('w * h') + ' and its ' + c('label()') + ' is ' + c('"plate"') + '.</li></ul>' +
        '<p>Then write ' + c('int total_weight(const vector<Part*> &parts)') + ' that adds up the weight of every part (each one is a pointer, so use ' + c('p->weight()') + '). main should print:</p>' +
        '<pre>gear 24\nplate 12\ngear 10\ntotal: 46</pre>',
      starter: P('Gear big(12);\nPlate lid(3, 4);\nGear small(5);\nvector<Part*> parts = {&big, &lid, &small};\nfor (Part *p : parts) {\n    cout << p->label() << " " << p->weight() << endl;\n}\ncout << "total: " << total_weight(parts) << endl;',
        'class Part {\npublic:\n    virtual ~Part() {}\n    virtual int weight() const = 0;\n    virtual string label() const = 0;\n};\n\nclass Gear : public Part {\nprivate:\n    int teeth;\n\npublic:\n    Gear(int t) : teeth(t) {}\n    // override weight and label\n};\n\nclass Plate : public Part {\n    // members, constructor, weight and label\n};\n\nint total_weight(const vector<Part*> &parts) {\n    return 0;\n}'),
      hints: ['Each override looks like: int weight() const override { return ...; }', 'In total_weight, loop with for (Part *p : parts) and add p->weight() to a running total.'],
      similar: { task: 'Shapes with a pure virtual area().', code: P('Square s(3);\nShape &sh = s;\ncout << sh.area() << endl;', 'class Shape {\npublic:\n    virtual ~Shape() {}\n    virtual int area() const = 0;\n};\n\nclass Square : public Shape {\nprivate:\n    int side;\npublic:\n    Square(int s) : side(s) {}\n    int area() const override {\n        return side * side;\n    }\n};') },
      gate: 'E',
      expect: ['gear 24', 'plate 12', 'gear 10', 'total: 46'],
      require: [[/class\s+Plate\s*:\s*public\s+Part\b/, 'Keep ' + c('class Plate : public Part') + '.'], [/total_weight\s*\(\s*const\s+vector\s*<\s*Part\s*\*\s*>\s*&/, 'Keep ' + c('int total_weight(const vector<Part*> &parts)') + '.']],
      success: 'Every blueprint becomes a real part. The vault weighs them to the gram.',
    },
    cpp2_virt6: {
      title: 'The Golem Army',
      desc: '<p>The final terminal of the forge! Everything you learned comes together to command the golem army. ' + c('Golem') + ' (abstract, with a pure virtual ' + c('power()') + ') and ' + c('IronGolem') + ' are written. Your jobs:</p>' +
        '<ol><li><b>Inheritance:</b> write ' + c('FireGolem : public Golem') + ' with a private ' + c('int heat') + ' and a constructor ' + c('FireGolem(string n, int h)') + ' that gives the Golem <b>80</b> hp. Its ' + c('power()') + ' is ' + c('heat * 3') + ', and it overrides ' + c('describe()') + ' to add ' + c('" [fire]"') + ' after the Golem description.</li>' +
        '<li><b>Overloading and references:</b> ' + c('report(const Golem &g)') + ' is written. Add an overload ' + c('report(const vector<Golem*> &army)') + ' that reports every golem in the army.</li>' +
        '<li><b>STL and lambdas:</b> in main, ' + c('sort') + ' the army from strongest to weakest with a lambda, and use ' + c('count_if') + ' with a lambda that captures ' + c('threshold') + ' to count the golems whose power is above it.</li></ol>' +
        '<p>main should print:</p><pre>Bolt (hp 120): power 50\nEmber (hp 80) [fire]: power 36\nAnvil (hp 120): power 15\nSpark (hp 80) [fire]: power 12\nstrong golems: 2</pre>',
      starter: P('IronGolem anvil("Anvil", 5);\nFireGolem ember("Ember", 12);\nIronGolem bolt("Bolt", 40);\nFireGolem spark("Spark", 4);\nvector<Golem*> army = {&anvil, &ember, &bolt, &spark};\nint threshold = 20;\n\n// 3. sort the army, strongest first\n\nreport(army);\n\nint strong = 0;   // 3. count_if with a lambda that captures threshold\ncout << "strong golems: " << strong << endl;',
        'class Golem {\nprotected:\n    string name;\n    int hp;\n\npublic:\n    Golem(string n, int h) : name(n), hp(h) {}\n    virtual ~Golem() {}\n\n    virtual int power() const = 0;\n\n    virtual string describe() const {\n        return name + " (hp " + to_string(hp) + ")";\n    }\n};\n\nclass IronGolem : public Golem {\nprivate:\n    int armor;\n\npublic:\n    IronGolem(string n, int a) : Golem(n, 120), armor(a) {}\n\n    int power() const override {\n        return 10 + armor;\n    }\n};\n\n// 1. write FireGolem here\n\nvoid report(const Golem &g) {\n    cout << g.describe() << ": power " << g.power() << endl;\n}\n\n// 2. write report(const vector<Golem*> &army) here'),
      hints: ['FireGolem(string n, int h) : Golem(n, 80), heat(h) {}. Its describe returns Golem::describe() + " [fire]".', 'The army holds pointers, so the sort lambda takes two Golem pointers: [](const Golem *a, const Golem *b) { return a->power() > b->power(); }. In report(army), call report(*g) for each g.'],
      similar: { task: 'Sort a team of heroes by level and count the veterans.', code: P('Mage m("Ada", 7);\nMage n("Linus", 3);\nvector<Hero*> team = {&n, &m};\nsort(team.begin(), team.end(), [](const Hero *a, const Hero *b) { return a->level() > b->level(); });\nint min_level = 5;\nint veterans = count_if(team.begin(), team.end(), [min_level](const Hero *h) { return h->level() >= min_level; });\ncout << team[0]->name() << " leads, " << veterans << " veteran" << endl;',
        'class Hero {\npublic:\n    virtual ~Hero() {}\n    virtual int level() const = 0;\n    virtual string name() const = 0;\n};\n\nclass Mage : public Hero {\nprivate:\n    string n;\n    int lv;\npublic:\n    Mage(string name, int l) : n(name), lv(l) {}\n    int level() const override {\n        return lv;\n    }\n    string name() const override {\n        return n;\n    }\n};') },
      gate: 'G',
      expect: ['Bolt (hp 120): power 50', 'Ember (hp 80) [fire]: power 36', 'Anvil (hp 120): power 15', 'Spark (hp 80) [fire]: power 12', 'strong golems: 2'],
      require: [
        [/class\s+FireGolem\s*:\s*public\s+Golem\b/, 'Write ' + c('class FireGolem : public Golem') + '.'],
        [/Golem\s*::\s*describe\s*\(\s*\)/, 'FireGolem\'s ' + c('describe()') + ' should build on ' + c('Golem::describe()') + '.'],
        [/void\s+report\s*\(\s*const\s+vector\s*<\s*Golem\s*\*\s*>\s*&/, 'Add the overload ' + c('void report(const vector<Golem*> &army)') + '.'],
        [/\bsort\s*\([^;]*\[/, 'Sort the army with ' + c('sort') + ' and a lambda.'],
        [/count_if\s*\([^;]*\[\s*(=|&|&?\s*threshold)\s*\]/, 'Count with ' + c('count_if') + ' and a lambda that captures ' + c('threshold') + '.'],
      ],
      success: 'The army marches out of the forge in perfect order, strongest at the front. <b>You have mastered the Iron Forge!</b>',
    },
  };

  // ================================================================ levels
  const levels = [
    {
      id: 'cpp2_refs', name: 'The Bellows Hall', topic: 'References',
      blurb: 'Hand functions the real thing instead of a copy, with & and const & references.',
      intro: '<p>Welcome to the <b>Iron Forge</b>, the oldest workshop in Syntaxia. Here the broken weapons of the bug army are melted down and forged into something better, and every machine in the place runs on C++.</p>' +
        '<p>The first lesson every smith learns: when you hand a value to a function, C++ gives the function a <b>copy</b>. The function can change the copy all it likes, and your original stays exactly the same.</p>' +
        block('void heat(int t)  { t += 100; }   // warms a copy\nvoid heat(int &t) { t += 100; }   // warms YOUR variable') +
        '<p>That little ' + c('&') + ' makes a <b>reference</b>: another name for the very same box. Light the bellows and see!</p>',
      tutorial: [
        page('Functions get copies',
          '<p>A normal parameter is a <b>new box</b>. When you call ' + c('heat(forge)') + ', the value of ' + c('forge') + ' is copied into ' + c('temp') + '. Changing ' + c('temp') + ' changes only the copy.</p><p>Run it: inside the function the value is 120, but outside it is still 20.</p>',
          P('int forge = 20;\nheat(forge);\ncout << "outside: " << forge << endl;', 'void heat(int temp) {\n    temp += 100;\n    cout << "inside: " << temp << endl;\n}')),
        page('A & makes a reference',
          '<p>Put ' + c('&') + ' between the type and the name, and the parameter becomes a <b>reference</b>: not a new box, but a second name for the caller\'s box. Whatever the function does to ' + c('temp') + ' happens to ' + c('forge') + '.</p><p>Because a reference needs a box to point at, you must pass a <b>variable</b>. ' + c('heat(5)') + ' would not compile: there is no box called 5 to change.</p>',
          P('int forge = 20;\nheat(forge);\ncout << "outside: " << forge << endl;', 'void heat(int &temp) {\n    temp += 100;\n    cout << "inside: " << temp << endl;\n}')),
        page('Handing back two answers',
          '<p>' + c('return') + ' can only send back one value. Reference parameters let a function fill in <b>several</b> answers. The caller makes the boxes, and the function fills them.</p>',
          P('int h = 0;\nint m = 0;\nsplit_time(135, h, m);\ncout << h << " hours and " << m << " minutes" << endl;', 'void split_time(int minutes, int &hours, int &mins) {\n    hours = minutes / 60;\n    mins = minutes % 60;\n}')),
        page('Changing every item in a vector',
          '<p>A range-for loop also copies: in ' + c('for (int x : v)') + ', ' + c('x') + ' is a copy of each item. Write ' + c('int &x') + ' and ' + c('x') + ' <b>is</b> each item, so you can change the vector directly.</p><p>Compare the two loops below.</p>',
          P('vector<int> v = {1, 2, 3};\nfor (int x : v) {\n    x *= 10;        // changes copies only\n}\ncout << v[0] << " " << v[1] << " " << v[2] << endl;\n\nfor (int &x : v) {\n    x *= 10;        // changes the items\n}\ncout << v[0] << " " << v[1] << " " << v[2] << endl;')),
        page('const references: look, don\'t touch',
          '<p>Copying a big vector or a long string every time you call a function is slow. A reference avoids the copy, and ' + c('const') + ' in front promises the function will <b>only read</b> it.</p><p>' + c('const vector<int> &v') + ' is the usual way to hand a vector to a function that just looks at it.</p>',
          P('vector<int> loads = {40, 95, 60};\ncout << total(loads) << endl;', 'int total(const vector<int> &v) {\n    int sum = 0;\n    for (int x : v) {\n        sum += x;\n    }\n    return sum;\n}')),
        page('Common mistake: changing a const',
          '<p>The compiler holds you to the promise. Changing a ' + c('const') + ' reference is an error. Run this to see it, then remove the line that changes ' + c('name') + '.</p>',
          P('string hero = "Ada";\ngreet(hero);', 'void greet(const string &name) {\n    name = "Bob";\n    cout << "Hello, " << name << endl;\n}'), { expectError: true }),
      ],
      signs: [
        'Without a &, a function only ever gets a copy. Watch what happens to the furnace temperature.',
        'A reference is another name for the same box. Change one, and you change both.',
        'const & means: look, but do not touch. As fast as a reference, as safe as a copy.',
      ],
      terminals: ['cpp2_refs1', 'cpp2_refs2', 'cpp2_refs3', 'cpp2_refs4', 'cpp2_refs5'],
      map: (B) => {
        const m = B.MapBuilder(128, 17);
        m.fill(0, 15, 127, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 2, 'climb', 'B');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 3, 'bridge', 'C');
        m.put(x + 1, 14, 'K');
        x = B.TR.mover(m, x + 3);
        x = B.room(m, x + 1, 4, 'spring', 'D');
        m.put(x + 2, 14, 'e');
        x = B.TR.hills(m, x + 4);
        x = B.room(m, x, 5, 'lava', 'E');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
    {
      id: 'cpp2_enc', name: 'The Sealed Vaults', topic: 'Encapsulation',
      blurb: 'Bundle data with struct, then guard it with private members, public methods and constructors.',
      intro: '<p>Below the forge lie the <b>Sealed Vaults</b>, where the forge keeps its gold, its fire and its secrets.</p>' +
        '<p>In Chapter 1 every attribute was public: anyone could reach in and change anything. Real C++ programs protect their data. They keep it <b>private</b>, and offer <b>public methods</b> that check every change before it happens. This is called <b>encapsulation</b>.</p>' +
        block('class Vault {\nprivate:\n    int gold = 0;          // nobody outside can touch this\npublic:\n    void deposit(int n) {  // ...but anyone can ask nicely\n        if (n > 0) gold += n;\n    }\n};') +
        '<p>Bugs have been sneaking into the vaults and setting values they shouldn\'t. Time to lock things down.</p>',
      tutorial: [
        page('struct: a bundle of data',
          '<p>A ' + c('struct') + ' makes a new type out of several values. You can fill one with braces, in the order the members are listed, and reach each member with a dot.</p><p>Every member of a struct is <b>public</b> unless you say otherwise.</p>',
          P('Ingot bar = {"iron", 12};\nbar.weight += 3;\ncout << bar.metal << " weighs " << bar.weight << endl;', 'struct Ingot {\n    string metal;\n    int weight;\n};')),
        page('class: private until you say public',
          '<p>' + c('class') + ' and ' + c('struct') + ' are almost the same thing. The one difference: in a class, members are <b>private</b> until you write ' + c('public:') + '.</p><p>Private members can only be used by the class\'s own methods. Programmers use ' + c('struct') + ' for simple bundles of data, and ' + c('class') + ' when the data needs guarding.</p>',
          P('Furnace f;\nf.add_heat(50);\nf.add_heat(-40);\ncout << f.get_heat() << endl;', 'class Furnace {\nprivate:\n    int heat = 0;\n\npublic:\n    void add_heat(int amount) {\n        if (amount > 0) {\n            heat += amount;\n        }\n    }\n\n    int get_heat() const {\n        return heat;\n    }\n};')),
        page('Common mistake: touching private data',
          '<p>Code outside the class can\'t read or change a private member. The compiler stops it. Run this to see the error, then change the line to use ' + c('add_heat') + ' instead.</p>',
          P('Furnace f;\nf.heat = 9999;\ncout << f.get_heat() << endl;', 'class Furnace {\nprivate:\n    int heat = 0;\n\npublic:\n    void add_heat(int amount) {\n        if (amount > 0) {\n            heat += amount;\n        }\n    }\n\n    int get_heat() const {\n        return heat;\n    }\n};'), { expectError: true }),
        page('Constructors with an initializer list',
          '<p>After the constructor\'s brackets, a colon starts the <b>initializer list</b>: each member, with its starting value in brackets. The members are set before the body ' + c('{ }') + ' even runs, so the body is often empty.</p>',
          P('Blade a("Ember Edge", 7);\ncout << a.describe() << endl;', 'class Blade {\nprivate:\n    string name;\n    int sharpness;\n\npublic:\n    Blade(string n, int s) : name(n), sharpness(s) {}\n\n    string describe() const {\n        return name + " (sharpness " + to_string(sharpness) + ")";\n    }\n};')),
        page('Methods that guard the data',
          '<p>Because only the methods can change private data, they can <b>check</b> every change. Here ' + c('withdraw') + ' refuses to take out more gold than there is, and tells the caller whether it worked by returning a ' + c('bool') + '.</p>',
          P('Vault v(100);\ncout << boolalpha;\ncout << v.withdraw(30) << endl;\ncout << v.withdraw(500) << endl;\ncout << v.balance() << endl;', 'class Vault {\nprivate:\n    int gold;\n\npublic:\n    Vault(int start) : gold(start) {}\n\n    bool withdraw(int n) {\n        if (n <= 0 || n > gold) {\n            return false;\n        }\n        gold -= n;\n        return true;\n    }\n\n    int balance() const {\n        return gold;\n    }\n};')),
        page('const methods',
          '<p>' + c('const') + ' after a method\'s brackets is a promise: this method <b>won\'t change</b> the object. Getters like ' + c('balance() const') + ' should always say so.</p><p>It matters, because through a ' + c('const') + ' reference you may only call const methods.</p>',
          P('Vault v(250);\nshow(v);', 'class Vault {\nprivate:\n    int gold;\n\npublic:\n    Vault(int start) : gold(start) {}\n\n    int balance() const {\n        return gold;\n    }\n};\n\nvoid show(const Vault &v) {\n    cout << "The vault holds " << v.balance() << " gold" << endl;\n}')),
      ],
      signs: [
        'In a struct everything is public. In a class everything is private until you write public:.',
        'Private data can only be changed by the class\'s own methods, so they can check every change.',
        'An initializer list sets each member before the constructor body runs: Blade(string n) : name(n) {}',
      ],
      terminals: ['cpp2_enc1', 'cpp2_enc2', 'cpp2_enc3', 'cpp2_enc4', 'cpp2_enc5'],
      map: (B) => {
        const m = B.MapBuilder(134, 17);
        m.fill(0, 15, 133, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'climb', 'A');
        x = B.TR.tower(m, x + 1);
        x = B.room(m, x + 1, 2, 'spikes', 'B');
        m.put(x + 1, 14, '?');
        x = B.TR.pit(m, x + 3);
        x = B.room(m, x + 1, 3, 'wall', 'C');
        m.put(x + 2, 14, 'e');
        x = B.TR.hills(m, x + 4);
        m.put(x + 1, 14, 'K');
        x = B.room(m, x + 3, 4, 'bridge', 'D');
        x = B.TR.mover(m, x + 1);
        m.put(x - 5, 10, 'w');
        x = B.room(m, x + 1, 5, 'spring', 'E');
        m.put(x + 2, 14, '?'); m.put(x + 7, 14, 'F');
        return m;
      },
    },
    {
      id: 'cpp2_stl', name: 'The Assembly Line', topic: 'STL & Lambdas',
      blurb: 'Let the Standard Library do the looping: sort, count_if, find_if, transform and accumulate with lambdas.',
      intro: '<p>The forge\'s <b>Assembly Line</b> moves thousands of parts a day. Writing a new loop for every job gets old fast, and every hand-written loop is one more place for a bug to hide.</p>' +
        '<p>C++ comes with the <b>Standard Template Library</b> (the STL): ready-made, well-tested algorithms like ' + c('sort') + ', ' + c('count_if') + ' and ' + c('find_if') + '. You tell them <i>what</i> to do with a tiny function written right on the spot, a <b>lambda</b>:</p>' +
        block('sort(v.begin(), v.end());\nint big = count_if(v.begin(), v.end(), [](int x) { return x > 10; });') +
        '<p>Most of them live in ' + c('#include <algorithm>') + '. Start the belts!</p>',
      tutorial: [
        page('sort, reverse, and begin/end',
          '<p>STL algorithms work on a <b>range</b>, given as two markers: ' + c('v.begin()') + ' (the first item) and ' + c('v.end()') + ' (just past the last one). Pass both, and ' + c('sort') + ' puts everything in between in order.</p><p>' + c('reverse') + ' flips the order. Both change the vector in place.</p>',
          P('vector<int> v = {42, 7, 19, 3};\nsort(v.begin(), v.end());\nfor (int x : v) {\n    cout << x << " ";\n}\ncout << endl;\nreverse(v.begin(), v.end());\nfor (int x : v) {\n    cout << x << " ";\n}\ncout << endl;')),
        page('Lambdas: functions without a name',
          '<p>A <b>lambda</b> is a small function written right where you need it:</p>' + block('[](int x) { return x * 2; }') + '<p>' + c('[]') + ' starts it (more on the brackets later), then come the parameters and the body. You can store one in a variable and call it like any function. Its type has no simple name, so write ' + c('auto') + ' and let C++ work it out. Mostly, though, you hand lambdas straight to STL algorithms.</p>',
          P('auto twice = [](int x) { return x * 2; };\nauto is_big = [](int x) { return x > 100; };\ncout << twice(21) << endl;\ncout << boolalpha << is_big(twice(60)) << endl;')),
        page('count_if and find_if',
          '<p>' + c('count_if') + ' counts the items for which your lambda returns ' + c('true') + '.</p><p>' + c('find_if') + ' finds the <b>first</b> such item. It returns an <b>iterator</b>, a marker pointing at it. If nothing matched, the iterator equals ' + c('end()') + '. Use ' + c('*it') + ' to get the value, and ' + c('it - v.begin()') + ' for its position.</p>',
          P('vector<int> v = {12, 75, 3, 51, 8};\nint big = count_if(v.begin(), v.end(), [](int x) { return x > 50; });\ncout << big << " big ones" << endl;\n\nauto it = find_if(v.begin(), v.end(), [](int x) { return x < 10; });\nif (it != v.end()) {\n    cout << "first small one: " << *it << " at position " << (it - v.begin()) << endl;\n}')),
        page('Your own sort order',
          '<p>Give ' + c('sort') + ' a third argument: a lambda that takes two items and returns ' + c('true') + ' when the first should come <b>before</b> the second. That lets you sort biggest first, or sort structs by any member you like.</p>',
          P('vector<Tool> tools = {{"hammer", 8}, {"tongs", 3}, {"anvil", 90}};\nsort(tools.begin(), tools.end(), [](const Tool &a, const Tool &b) { return a.weight > b.weight; });\nfor (const Tool &t : tools) {\n    cout << t.name << " " << t.weight << endl;\n}', 'struct Tool {\n    string name;\n    int weight;\n};')),
        page('transform and accumulate',
          '<p>' + c('transform') + ' runs a lambda on every item and writes the results somewhere. Write them back to ' + c('v.begin()') + ' to change the vector in place.</p><p>' + c('accumulate') + ' (from ' + c('#include <numeric>') + ') adds everything up, starting from the value you give it. Give it a lambda as a fourth argument to combine items your own way.</p>',
          P('vector<int> v = {1, 2, 3, 4};\ntransform(v.begin(), v.end(), v.begin(), [](int x) { return x * 10; });\nfor (int x : v) {\n    cout << x << " ";\n}\ncout << endl;\ncout << accumulate(v.begin(), v.end(), 0) << endl;\ncout << accumulate(v.begin(), v.end(), 0, [](int sum, int x) { return sum + x * 2; }) << endl;')),
        page('Captures: using outside variables',
          '<p>A lambda can\'t see the local variables around it unless you list them in its <b>capture</b> brackets:</p><ul><li>' + c('[limit]') + ' gives the lambda its own copy of ' + c('limit') + '</li><li>' + c('[&total]') + ' lets the lambda use (and change) the real ' + c('total') + '</li><li>' + c('[=]') + ' copies everything it uses, ' + c('[&]') + ' shares everything</li></ul><p>With empty ' + c('[]') + ', using ' + c('limit') + ' inside would be an error.</p>',
          P('vector<int> temps = {35, 80, 52, 41, 90};\nint limit = 50;\nint hot = count_if(temps.begin(), temps.end(), [limit](int t) { return t > limit; });\ncout << hot << " are above " << limit << endl;\n\nint total = 0;\nfor_each(temps.begin(), temps.end(), [&total](int t) { total += t; });\ncout << "total: " << total << endl;')),
      ],
      signs: [
        'begin() and end() mark where a range starts and stops. Most STL algorithms take that pair.',
        'A lambda is written [](parameters) { body }. The [ ] lists which outside variables it may use.',
        'find_if hands back an iterator. If it equals end(), nothing was found.',
      ],
      terminals: ['cpp2_stl1', 'cpp2_stl2', 'cpp2_stl3', 'cpp2_stl4', 'cpp2_stl5', 'cpp2_stl6'],
      map: (B) => {
        const m = B.MapBuilder(152, 17);
        m.fill(0, 15, 151, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'bridge', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'wall', 'B');
        m.put(x + 1, 14, '?');
        x = B.TR.mover(m, x + 3);
        x = B.room(m, x + 1, 3, 'climb', 'C');
        m.put(x + 2, 14, 'e');
        x = B.TR.pit(m, x + 4);
        m.put(x + 1, 14, 'K');
        x = B.room(m, x + 3, 4, 'lava', 'D');
        x = B.TR.tower(m, x + 1);
        m.put(x - 3, 10, 'w');
        x = B.room(m, x + 1, 5, 'spikes', 'E');
        m.put(x + 1, 14, '?');
        x = B.TR.hills(m, x + 3);
        m.put(x + 1, 14, 'e');
        x = B.room(m, x + 3, 6, 'spring', 'G');
        m.put(x + 6, 14, 'F');
        return m;
      },
    },
    {
      id: 'cpp2_over', name: 'The Hall of Twin Hammers', topic: 'Overloading',
      blurb: 'Give several functions and constructors the same name, and let C++ pick the right one.',
      intro: '<p>In the <b>Hall of Twin Hammers</b>, pairs of hammers hang side by side. Each pair has the same name, but they are made for different jobs: one for nails, one for horseshoes.</p>' +
        '<p>C++ functions can be like that too. Several functions may share one name, as long as their <b>parameters</b> are different. When you call it, the compiler looks at what you passed and picks the matching one. This is called <b>overloading</b>.</p>' +
        block('int area(int side)         { return side * side; }\nint area(int w, int h)     { return w * h; }\n\narea(4);      // 16, the first one\narea(2, 5);   // 10, the second one') +
        '<p>You\'ve already used overloads without knowing it: ' + c('cout <<') + ' works for numbers, text and more.</p>',
      tutorial: [
        page('Same name, different types',
          '<p>Here are three functions all called ' + c('describe') + '. One takes an ' + c('int') + ', one a ' + c('double') + ', one a ' + c('string') + '. C++ picks the one whose parameter matches the value you pass.</p><p>Notice that ' + c('7') + ' is an ' + c('int') + ' and ' + c('7.5') + ' is a ' + c('double') + '.</p>',
          P('cout << describe(7) << endl;\ncout << describe(7.5) << endl;\ncout << describe(string("seven")) << endl;', 'string describe(int n) {\n    return "a whole number";\n}\n\nstring describe(double d) {\n    return "a decimal number";\n}\n\nstring describe(string s) {\n    return "some text: " + s;\n}')),
        page('Same name, different counts',
          '<p>Overloads can also take a different <b>number</b> of parameters. One overload can even call another, so the work is only written once.</p>',
          P('cout << biggest(4, 9) << endl;\ncout << biggest(12, 3, 7) << endl;', 'int biggest(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    return b;\n}\n\nint biggest(int a, int b, int c) {\n    return biggest(a, biggest(b, c));\n}')),
        page('What counts as different',
          '<p>Only the <b>parameters</b> tell overloads apart: their types, their number or their order. The return type alone is not enough: ' + c('int roll()') + ' and ' + c('double roll()') + ' could not both exist, because a call ' + c('roll()') + ' wouldn\'t say which one you mean.</p><p>Overloads can mix plain values, references and vectors freely.</p>',
          P('vector<int> v = {3, 1, 4};\nshow(42);\nshow(v);', 'void show(int x) {\n    cout << "one number: " << x << endl;\n}\n\nvoid show(const vector<int> &v) {\n    cout << v.size() << " numbers, starting with " << v[0] << endl;\n}')),
        page('Overloaded constructors',
          '<p>A class can have several constructors, so objects can be built in different ways. The one with no parameters runs when you write ' + c('Torch t;') + ' with no brackets.</p>',
          P('Torch plain;\nTorch bright(10);\ncout << plain.info() << endl;\ncout << bright.info() << endl;', 'class Torch {\nprivate:\n    int fuel;\n\npublic:\n    Torch() : fuel(3) {}\n    Torch(int f) : fuel(f) {}\n\n    string info() const {\n        return "fuel: " + to_string(fuel);\n    }\n};')),
        page('Overloaded methods',
          '<p>Methods inside a class can be overloaded just like free functions. Here a scale can weigh one load or a whole vector of them.</p>',
          P('Scale s;\ns.add(5);\ns.add(vector<int>{10, 20});\ncout << s.total() << endl;', 'class Scale {\nprivate:\n    int sum = 0;\n\npublic:\n    void add(int w) {\n        sum += w;\n    }\n\n    void add(const vector<int> &ws) {\n        for (int w : ws) {\n            add(w);\n        }\n    }\n\n    int total() const {\n        return sum;\n    }\n};')),
        page('A shortcut: default values',
          '<p>Sometimes the only difference between two overloads is a value you would usually leave out. A <b>default argument</b> does that job with one function: if the caller leaves it out, the default is used.</p><p>Don\'t write an overload ' + c('greet(string)') + ' as well, or the call ' + c('greet("Ada")') + ' would be ambiguous.</p>',
          P('greet("Ada");\ngreet("Linus", "Welcome back");', 'void greet(string name, string word = "Hello") {\n    cout << word << ", " << name << "!" << endl;\n}')),
      ],
      signs: [
        'Two functions may share a name if their parameter lists are different.',
        'The return type alone is not enough. The parameters must differ.',
        'Constructors can be overloaded too: one class, many ways to build it.',
      ],
      terminals: ['cpp2_over1', 'cpp2_over2', 'cpp2_over3', 'cpp2_over4', 'cpp2_over5'],
      map: (B) => {
        const m = B.MapBuilder(140, 17);
        m.fill(0, 15, 139, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'spikes', 'A');
        x = B.TR.pit(m, x + 1);
        x = B.room(m, x + 1, 2, 'climb', 'B');
        m.put(x + 1, 14, '?');
        m.put(x + 4, 14, 'e');
        x = B.TR.hills(m, x + 6);
        x = B.room(m, x, 3, 'lava', 'C');
        m.put(x + 1, 14, 'K');
        x = B.TR.mover(m, x + 3);
        x = B.room(m, x + 1, 4, 'wall', 'D');
        x = B.TR.tower(m, x + 1);
        m.put(x + 1, 14, 'e');
        x = B.room(m, x + 3, 5, 'bridge', 'E');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
    {
      id: 'cpp2_virt', name: 'The Golem Works', topic: 'Inheritance',
      blurb: 'Build classes on other classes, override virtual methods, and command a whole army through one base class.',
      intro: '<p>In the heart of the forge stands the <b>Golem Works</b>, where the smiths build golems to guard Syntaxia: stone golems, iron golems, fire golems...</p>' +
        '<p>Every golem shares the same core, so the smiths write it once as a <b>base class</b>. Each kind of golem is a <b>derived class</b> that builds on that core and adds its own twist.</p>' +
        block('class IronGolem : public Golem {\n    // everything a Golem has, plus more\n};') +
        '<p>With <b>virtual</b> methods, one loop can command an entire army without knowing which kind each golem is. Bring together everything you learned in the forge, and build the army that will push the bugs back for good!</p>',
      tutorial: [
        page('A class built on another',
          '<p>' + c('class ClayGolem : public Golem') + ' means: a ClayGolem <b>is a</b> Golem, plus extra. It inherits all of Golem\'s members (' + c('name') + ', ' + c('hp') + ', ' + c('walk()') + ') and adds its own ' + c('mold()') + '.</p><p>Its constructor sets up the Golem part by calling the Golem constructor in the initializer list: ' + c(': Golem(n, 40)') + '.</p>',
          P('ClayGolem c("Mudge");\ncout << c.walk() << endl;\ncout << c.hp << endl;\ncout << c.mold() << endl;', GOLEM_BASE + '\n\nclass ClayGolem : public Golem {\npublic:\n    ClayGolem(string n) : Golem(n, 40) {}\n\n    string mold() const {\n        return name + " reshapes itself";\n    }\n};')),
        page('protected: for the family only',
          '<p>A <b>private</b> member can\'t be used even by derived classes. When the family needs it, make it <b>protected</b>: derived classes can use it, but outside code still can\'t.</p>',
          P('IronGolem g("Anvil", 8);\ncout << g.status() << endl;', 'class Golem {\nprotected:\n    string name;\n    int hp;\n\npublic:\n    Golem(string n, int h) : name(n), hp(h) {}\n};\n\nclass IronGolem : public Golem {\nprivate:\n    int armor;\n\npublic:\n    IronGolem(string n, int a) : Golem(n, 150), armor(a) {}\n\n    string status() const {\n        return name + ": " + to_string(hp) + " hp, armor " + to_string(armor);\n    }\n};')),
        page('virtual and override',
          '<p>A derived class can give its own version of a method. Mark the base version ' + c('virtual') + ', and the derived one ' + c('override') + '.</p><p>Now a function that takes any ' + c('const Golem &') + ' calls the right version for the real object it was given.</p>',
          P('Golem g;\nIronGolem i;\nwake(g);\nwake(i);', 'class Golem {\npublic:\n    virtual string speak() const {\n        return "...";\n    }\n};\n\nclass IronGolem : public Golem {\npublic:\n    string speak() const override {\n        return "clang";\n    }\n};\n\nvoid wake(const Golem &g) {\n    cout << g.speak() << endl;\n}')),
        page('Why virtual matters',
          '<p>Without ' + c('virtual') + ', a call through a base-class reference uses the <b>base</b> version, because that is all the compiler knows about. With ' + c('virtual') + ', C++ checks the real object while the program runs.</p><p>Here ' + c('name()') + ' is not virtual but ' + c('speak()') + ' is. Look at what each prints for the iron golem.</p>',
          P('IronGolem i;\nGolem &g = i;\ncout << g.name() << " / " << g.speak() << endl;\ncout << i.name() << " / " << i.speak() << endl;', 'class Golem {\npublic:\n    string name() const {\n        return "golem";\n    }\n    virtual string speak() const {\n        return "...";\n    }\n};\n\nclass IronGolem : public Golem {\npublic:\n    string name() const {\n        return "iron golem";\n    }\n    string speak() const override {\n        return "clang";\n    }\n};')),
        page('Pure virtual: abstract classes',
          '<p>Write ' + c('= 0') + ' instead of a body, and the method is <b>pure virtual</b>. Its class is <b>abstract</b>: a blueprint that every derived class must fill in.</p><p>To keep different kinds of parts in one vector, store <b>pointers</b>. A pointer holds the address of an object: ' + c('Part*') + ' is a pointer to a Part, and ' + c('&gear') + ' is the address of ' + c('gear') + '. Call methods through a pointer with ' + c('->') + ' instead of a dot. Since the methods are virtual, each part answers for itself.</p>',
          P('Gear gear(12);\nPlate lid(3, 4);\nvector<Part*> parts = {&gear, &lid};\nfor (Part *p : parts) {\n    cout << p->label() << " weighs " << p->weight() << endl;\n}', 'class Part {\npublic:\n    virtual ~Part() {}\n    virtual int weight() const = 0;\n    virtual string label() const = 0;\n};\n\nclass Gear : public Part {\nprivate:\n    int teeth;\npublic:\n    Gear(int t) : teeth(t) {}\n    int weight() const override {\n        return teeth * 2;\n    }\n    string label() const override {\n        return "gear";\n    }\n};\n\nclass Plate : public Part {\nprivate:\n    int w, h;\npublic:\n    Plate(int width, int height) : w(width), h(height) {}\n    int weight() const override {\n        return w * h;\n    }\n    string label() const override {\n        return "plate";\n    }\n};')),
        page('Common mistake: building a blueprint',
          '<p>An abstract class has a method with no body, so you can\'t make an object of it. Run this to see the error. Only classes that override every pure virtual method can be created.</p><p>(The ' + c('virtual ~Part() {}') + ' line is a <b>virtual destructor</b>. Base classes with virtual methods should always have one, so objects are cleaned up properly.)</p>',
          P('Part p;\ncout << p.weight() << endl;', 'class Part {\npublic:\n    virtual ~Part() {}\n    virtual int weight() const = 0;\n};'), { expectError: true }),
      ],
      signs: [
        'class IronGolem : public Golem means: an IronGolem IS a Golem, plus extra.',
        'Mark a method virtual in the base class and override in the derived class, and calls through a base reference reach the real object.',
        'A method ending in = 0 has no body. Its class is abstract: a blueprint for other classes.',
        'The Golem Army terminal needs everything you learned in the forge. Good luck, smith!',
      ],
      terminals: ['cpp2_virt1', 'cpp2_virt2', 'cpp2_virt3', 'cpp2_virt4', 'cpp2_virt5', 'cpp2_virt6'],
      map: (B) => {
        const m = B.MapBuilder(170, 17);
        m.fill(0, 15, 169, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'spring', 'B');
        m.put(x + 2, 14, 'e');
        x = B.TR.pit(m, x + 4);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 3, 'climb', 'C');
        x = B.TR.mover(m, x + 6);
        x = B.room(m, x + 1, 4, 'lava', 'D');
        m.put(x + 1, 14, 'K');
        x = B.TR.tower(m, x + 3);
        m.put(x - 4, 9, 'w');
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 5, 'spikes', 'E');
        m.put(x + 2, 14, 'e');
        x = B.TR.hills(m, x + 4);
        m.put(x + 1, 14, 'e');
        m.put(x + 4, 14, '?');
        x = B.room(m, x + 6, 6, 'bridge', 'G');
        m.put(x + 3, 14, 'F');
        return m;
      },
    },
  ];

  GD.addChapter2('cpp', {
    title: 'The Iron Forge',
    blurb: 'Deep in the Iron Forge, learn what makes C++ C++: references, guarded classes, the STL with lambdas, overloading and virtual inheritance.',
    outro: '<p>The last golem marches out of the forge. References, private members, the STL with lambdas, overloading and virtual functions are now part of your toolkit.</p>',
    theme: 'forge',
    challenges,
    levels,
  });
})(typeof window !== 'undefined' ? window : globalThis);
