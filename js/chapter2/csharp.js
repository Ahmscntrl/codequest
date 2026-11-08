/* CodeQuest — Chapter 2 for C#: The Crystal Spire.
 * Properties, LINQ, interfaces & inheritance, exceptions. Runs on js/clike.js (dialect 'csharp').
 * Programs use top-level statements; classes and interfaces go after the statements, as real C# requires.
 */
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { lines, escapeHTML, nothing } = GD.helpers;
  const k = (s) => `<code>${escapeHTML(s)}</code>`;
  const pre = (s) => `<pre>${escapeHTML(s)}</pre>`;
  const sim = (task, code) => ({ task, code });
  const cheat = (rows) => '<table class="cheat">' + rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('') + '</table>';

  // Run the code once per case (each with its own game-provided variables) and compare the printed lines.
  function cases(list) {
    return {
      tests: () => list.map(t => ({ label: t.label, globals: t.globals, expect: t.expect })),
      check(runs) {
        for (let i = 0; i < runs.length; i++) {
          const t = runs.tests[i], got = lines(runs[i]);
          for (let j = 0; j < t.expect.length; j++) {
            if (got[j] !== String(t.expect[j])) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): line ${j + 1} should be ${k(String(t.expect[j]))} but it was ${k(nothing(got[j]))}.` };
          }
          if (got.length > t.expect.length) return { ok: false, msg: `Test ${i + 1} (${escapeHTML(t.label)}): expected ${t.expect.length} line${t.expect.length === 1 ? '' : 's'} of output, but you printed ${got.length}.` };
        }
        return { ok: true, msg: this.success || 'It works! <b>The way is open.</b>' };
      },
    };
  }
  const listLabel = (name, xs) => `${name} = ${xs.map(x => typeof x === 'string' ? `"${x}"` : x).join(', ') || '(empty)'}`;
  const NO_LOOPS = [/^(?![\s\S]*\b(for|foreach|while)\s*\()/, 'No loops this time! Answer each question with one LINQ method, such as <code>readings.Count(...)</code>.'];

  // ================================================================== challenges
  const challenges = {
    // ---------------------------------------------------------------- Level 1: properties
    cs2_props1: {
      title: 'The First Facet',
      desc: `<p>In Chapter 1 your classes had public <b>fields</b>. Real C# code almost always uses <b>properties</b> instead:</p>
        ${pre('public string Name { get; set; }')}
        <p>From the outside it works just like a field (${k('gem.Name = "Ruby";')}), but ${k('get')} and ${k('set')} are little doors you can control later. This short form is called an <b>auto-property</b>.</p>
        <p>Turn both fields of ${k('Gem')} into auto-properties. Then change the gem's ${k('Carats')} to <b>5</b> and print the same line again, so the output is:</p>
        ${pre('Ruby: 3 carats\nRuby: 5 carats')}`,
      starter: 'Gem gem = new Gem();\ngem.Name = "Ruby";\ngem.Carats = 3;\nConsole.WriteLine($"{gem.Name}: {gem.Carats} carats");\n// Change the carats to 5 and print the same line again\n\nclass Gem\n{\n    // Turn these fields into auto-properties: { get; set; }\n    public string Name;\n    public int Carats;\n}\n',
      hints: ['A property looks like a field where the semicolon is replaced by { get; set; }.', 'To change the carats, assign a new value to gem.Carats, then copy the Console.WriteLine line below it.'],
      similar: sim('Give a Book class the auto-properties Title and Pages, then print them.', 'Book b = new Book();\nb.Title = "Runes for Beginners";\nb.Pages = 120;\nConsole.WriteLine($"{b.Title} has {b.Pages} pages");\n\nclass Book\n{\n    public string Title { get; set; }\n    public int Pages { get; set; }\n}'),
      gate: 'A',
      require: [[/\bName\s*\{\s*get\s*;\s*set\s*;\s*\}/, 'Turn <code>Name</code> into an auto-property: <code>public string Name { get; set; }</code>'], [/\bCarats\s*\{\s*get\s*;\s*set\s*;\s*\}/, 'Turn <code>Carats</code> into an auto-property too: <code>public int Carats { get; set; }</code>']],
      expect: ['Ruby: 3 carats', 'Ruby: 5 carats'],
      success: 'The facet glows. Your first <b>properties</b>!',
    },
    cs2_props2: {
      title: 'The Sealed Lantern',
      desc: `<p>Often everyone may <b>read</b> a value, but only the class itself should <b>change</b> it. Put ${k('private')} in front of ${k('set')}:</p>
        ${pre('public int Light { get; private set; }')}
        <p>Now ${k('lantern.Light')} can be read from anywhere, but ${k('lantern.Light = 30;')} outside the class is an error. To change it, code must ask the lantern nicely by calling one of its methods.</p>
        <p>Your tasks:</p>
        <ul><li>Make the setter of ${k('Light')} private.</li>
        <li>Add a method ${k('public void Brighten(int amount)')} that adds ${k('amount')} to ${k('Light')}.</li>
        <li>Replace the direct assignment with calls to ${k('lantern.Brighten(...)')}, so the program prints <b>30</b>, then <b>60</b>, then <b>75</b>.</li></ul>`,
      starter: 'Lantern lantern = new Lantern();\nlantern.Light = 30;\nConsole.WriteLine(lantern.Light);\n// Use lantern.Brighten(...) instead, so the output is 30, 60, 75\n\nclass Lantern\n{\n    public int Light { get; set; }\n\n    // Add a method Brighten(int amount) here\n}\n',
      hints: ['Write private just before the word set inside the braces.', 'Inside Brighten, Light += amount; works, because code inside the class is allowed to use the private setter.', 'Call Brighten three times (30, 30 and 15) and print Light after each call.'],
      similar: sim('A Counter whose Count only goes up by calling Tick().', 'Counter clicks = new Counter();\nclicks.Tick();\nclicks.Tick();\nConsole.WriteLine(clicks.Count);\n\nclass Counter\n{\n    public int Count { get; private set; }\n\n    public void Tick()\n    {\n        Count += 1;\n    }\n}'),
      gate: 'B',
      require: [[/\bLight\s*\{\s*get\s*;\s*private\s+set\s*;\s*\}/, 'Make the setter private: <code>public int Light { get; private set; }</code>'], [/\bvoid\s+Brighten\s*\(\s*int\s+\w+\s*\)/, 'Add a method <code>public void Brighten(int amount)</code> to the class.'], [/\.Brighten\s*\(/, 'Call <code>lantern.Brighten(...)</code> to change the light.']],
      expect: ['30', '60', '75'],
      success: 'Only the lantern can change its light now. That is <b>encapsulation</b>.',
    },
    cs2_props3: {
      title: 'The Pressure Valve',
      desc: `<p>A property can have real code in its ${k('get')} and ${k('set')}. The value is stored in a private <b>backing field</b>, and inside ${k('set')} the special word ${k('value')} is the new value someone is trying to assign:</p>
        ${pre('private int speed;\npublic int Speed\n{\n    get { return speed; }\n    set { speed = value; }\n}')}
        <p>The shield's ${k('Energy')} must always stay between <b>0 and 100</b>. Give it a ${k('get')} and a ${k('set')} body: above 100 store 100, below 0 store 0, otherwise store ${k('value')}. Don't change the statements at the top. They should print:</p>
        ${pre('100\n0\n64')}`,
      starter: 'Shield shield = new Shield();\nshield.Energy = 150;\nConsole.WriteLine(shield.Energy);\nshield.Energy = -20;\nConsole.WriteLine(shield.Energy);\nshield.Energy = 64;\nConsole.WriteLine(shield.Energy);\n\nclass Shield\n{\n    private int energy;\n\n    // Give Energy a get body and a set body that keep it between 0 and 100\n    public int Energy { get; set; }\n}\n',
      hints: ['get { return energy; } hands back the backing field.', 'Inside set, use if / else if / else on value, and store the right number in energy (lowercase).'],
      similar: sim('A Speed property that never goes below 0.', 'Car car = new Car();\ncar.Speed = -8;\nConsole.WriteLine(car.Speed);\ncar.Speed = 30;\nConsole.WriteLine(car.Speed);\n\nclass Car\n{\n    private int speed;\n\n    public int Speed\n    {\n        get { return speed; }\n        set\n        {\n            if (value < 0)\n            {\n                speed = 0;\n            }\n            else\n            {\n                speed = value;\n            }\n        }\n    }\n}'),
      gate: 'C',
      require: [[/\bset\s*\{[\s\S]*\bvalue\b/, 'Write a <code>set { ... }</code> body that uses <code>value</code>, the number being assigned.']],
      expect: ['100', '0', '64'],
      success: 'The valve holds. A property can <b>protect</b> its value.',
    },
    cs2_props4: {
      title: 'The Mirror of Measures',
      desc: `<p>A property doesn't have to store anything. A <b>computed property</b> works out its answer every time it is read, using ${k('=>')}:</p>
        ${pre('public int Diameter => Radius * 2;')}
        <p>Each ${k('Prism')} already has a ${k('Width')} and a ${k('Height')}. Add three computed properties:</p>
        <ul><li>${k('Area')}: an ${k('int')}, width times height</li>
        <li>${k('IsSquare')}: a ${k('bool')}, true when width and height are equal</li>
        <li>${k('Label')}: a ${k('string')} like ${k('3x4')} (width, the letter x, height)</li></ul>
        <p>The loop at the top should then print:</p>
        ${pre('3x4: area 12, square: False\n5x5: area 25, square: True\n2x7: area 14, square: False')}`,
      starter: 'List<Prism> prisms = new List<Prism> { new Prism(3, 4), new Prism(5, 5), new Prism(2, 7) };\nforeach (Prism p in prisms)\n{\n    Console.WriteLine($"{p.Label}: area {p.Area}, square: {p.IsSquare}");\n}\n\nclass Prism\n{\n    public int Width { get; }\n    public int Height { get; }\n\n    public Prism(int width, int height)\n    {\n        Width = width;\n        Height = height;\n    }\n\n    // Add the computed properties Area, IsSquare and Label here (use =>)\n}\n',
      hints: ['Each one is a single line: public type Name => expression;', 'For Label, an interpolated string works well: $"{Width}x{Height}".'],
      similar: sim('A Circle with a computed Diameter and IsBig.', 'Circle c = new Circle(6);\nConsole.WriteLine(c.Diameter + " " + c.IsBig);\n\nclass Circle\n{\n    public int Radius { get; }\n    public int Diameter => Radius * 2;\n    public bool IsBig => Radius > 5;\n\n    public Circle(int radius)\n    {\n        Radius = radius;\n    }\n}'),
      gate: 'D',
      require: [[/=>/, 'Use computed properties with <code>=></code>, for example <code>public int Area => Width * Height;</code>']],
      expect: ['3x4: area 12, square: False', '5x5: area 25, square: True', '2x7: area 14, square: False'],
      success: 'The mirror measures true. <b>Computed properties</b> always stay up to date.',
    },
    cs2_props5: {
      title: 'The Crystal Bank',
      desc: `<p>Time to build a whole class out of properties! The bank of the Spire needs an ${k('Account')}:</p>
        <ul><li>${k('Owner')}: a ${k('string')} that is <b>read-only</b> (${k('{ get; }')}), set by the constructor</li>
        <li>${k('Balance')}: an ${k('int')} anyone can read, but only the class can change (${k('private set')})</li>
        <li>${k('IsRich')}: a computed ${k('bool')}, true when ${k('Balance')} is at least 100</li>
        <li>${k('Deposit(int amount)')}: adds to the balance</li>
        <li>${k('bool Withdraw(int amount)')}: if there is not enough money, change nothing and return ${k('false')}; otherwise take the money out and return ${k('true')}</li></ul>
        <p>Don't change the statements at the top. They should print:</p>
        ${pre('False\nTrue\nLumi: 100 (rich: True)')}`,
      starter: 'Account acct = new Account("Lumi");\nacct.Deposit(50);\nConsole.WriteLine(acct.Withdraw(80));\nacct.Deposit(70);\nConsole.WriteLine(acct.Withdraw(20));\nConsole.WriteLine($"{acct.Owner}: {acct.Balance} (rich: {acct.IsRich})");\n\nclass Account\n{\n    // Owner: read-only, set by the constructor\n    // Balance: anyone can read it, only the class can change it\n    // IsRich: true when Balance is at least 100\n    // the constructor, Deposit(int amount) and bool Withdraw(int amount)\n}\n',
      hints: ['Start with the constructor: public Account(string owner) { Owner = owner; }', 'Withdraw checks first: if (amount > Balance) return false; then subtracts and returns true.'],
      similar: sim('A Backpack whose Weight only changes through Pack(), with a computed IsHeavy.', 'Backpack bag = new Backpack("Ada");\nbag.Pack(12);\nbag.Pack(9);\nConsole.WriteLine($"{bag.Owner} carries {bag.Weight} (heavy: {bag.IsHeavy})");\n\nclass Backpack\n{\n    public string Owner { get; }\n    public int Weight { get; private set; }\n    public bool IsHeavy => Weight > 20;\n\n    public Backpack(string owner)\n    {\n        Owner = owner;\n    }\n\n    public void Pack(int kilos)\n    {\n        Weight += kilos;\n    }\n}'),
      gate: 'E',
      require: [[/\bOwner\s*\{\s*get\s*;\s*\}/, 'Make <code>Owner</code> read-only: <code>public string Owner { get; }</code>'], [/\bBalance\s*\{\s*get\s*;\s*private\s+set\s*;\s*\}/, 'Give <code>Balance</code> a private setter: <code>public int Balance { get; private set; }</code>'], [/\bIsRich\s*=>/, 'Make <code>IsRich</code> a computed property with <code>=></code>.']],
      expect: ['False', 'True', 'Lumi: 100 (rich: True)'],
      success: 'The bank is open! Read-only, private set and computed properties, all in one class. <b>The Facet Halls are clear.</b>',
    },

    // ---------------------------------------------------------------- Level 2: LINQ
    cs2_linq1: Object.assign({
      title: 'The Even Lens',
      desc: `<p><b>LINQ</b> lets you ask questions about a whole list in one line. ${k('Where')} keeps only the items that pass a test. The test is a <b>lambda</b>, a tiny function written with ${k('=>')}:</p>
        ${pre('var big = nums.Where(n => n > 10);')}
        <p>Read it as: "keep each ${k('n')} where ${k('n > 10')}".</p>
        <p>${k('crystals')} is a ${k('List<int>')}. Print only the <b>even</b> ones, joined with ${k('", "')}, using ${k('string.Join')} and ${k('Where')}. For 4, 7, 10, 3, 8 that is ${k('4, 10, 8')}. The list changes for each test.</p>`,
      starter: '// crystals is a List<int>, for example 4, 7, 10, 3, 8\nConsole.WriteLine(string.Join(", ", crystals));\n',
      hints: ['A number is even when n % 2 == 0.', 'Put crystals.Where(...) inside string.Join instead of the whole list.'],
      similar: sim('Print only the numbers above 10.', 'List<int> nums = new List<int> { 4, 15, 9, 22 };\nvar big = nums.Where(n => n > 10);\nConsole.WriteLine(string.Join(", ", big));'),
      gate: 'A',
      require: [[/\.Where\s*\(/, 'Use <code>crystals.Where(...)</code> to keep the even numbers.'], [/=>/, 'Give <code>Where</code> a lambda, like <code>n => n % 2 == 0</code>.']],
      success: 'Only the even crystals shine through. That is <b>Where</b>.',
    }, cases([
      { label: listLabel('crystals', [4, 7, 10, 3, 8]), globals: { crystals: [4, 7, 10, 3, 8] }, expect: ['4, 10, 8'] },
      { label: listLabel('crystals', [2, 5, 6]), globals: { crystals: [2, 5, 6] }, expect: ['2, 6'] },
      { label: listLabel('crystals', [12, 1]), globals: { crystals: [12, 1] }, expect: ['12'] },
    ])),
    cs2_linq2: Object.assign({
      title: 'The Rune Lens',
      desc: `<p>${k('Select')} <b>changes</b> every item into something new. The answer can even be a different type:</p>
        ${pre('var doubled = nums.Select(n => n * 2);\nvar lengths = words.Select(w => w.Length);')}
        <p>${k('runes')} is a ${k('List<string>')}. Print two lines:</p>
        <ol><li>every rune in UPPERCASE, joined with ${k('"-"')}</li>
        <li>the length of every rune, joined with a space ${k('" "')}</li></ol>
        <p>For fire, ice, wind that is:</p>${pre('FIRE-ICE-WIND\n4 3 4')}`,
      starter: '// runes is a List<string>, for example "fire", "ice", "wind"\nConsole.WriteLine(string.Join("-", runes));\n',
      hints: ['r.ToUpper() turns a string into capitals.', 'Use one Select for each line: runes.Select(r => ...).'],
      similar: sim('Add "!" to every word, then print the first letter of every word.', 'List<string> words = new List<string> { "go", "team" };\nConsole.WriteLine(string.Join(" ", words.Select(w => w + "!")));\nConsole.WriteLine(string.Join("", words.Select(w => w[0])));'),
      gate: 'B',
      require: [[/\.Select\s*\(/, 'Use <code>runes.Select(...)</code> to change every rune.']],
      success: 'The runes blaze in capitals. That is <b>Select</b>.',
    }, cases([
      { label: listLabel('runes', ['fire', 'ice', 'wind']), globals: { runes: ['fire', 'ice', 'wind'] }, expect: ['FIRE-ICE-WIND', '4 3 4'] },
      { label: listLabel('runes', ['glow']), globals: { runes: ['glow'] }, expect: ['GLOW', '4'] },
      { label: listLabel('runes', ['sun', 'moonlight']), globals: { runes: ['sun', 'moonlight'] }, expect: ['SUN-MOONLIGHT', '3 9'] },
    ])),
    cs2_linq3: Object.assign({
      title: 'The Order Prism',
      desc: `<p>LINQ methods can be <b>chained</b>: each one works on the answer of the one before. ${k('OrderBy')} sorts from small to large, ${k('OrderByDescending')} from large to small, and ${k('ToList()')} turns the answer back into a ${k('List')} (so you can use ${k('.Count')}).</p>
        ${pre('var top = nums.Where(n => n > 0).OrderBy(n => n).ToList();')}
        <p>${k('scores')} is a ${k('List<int>')}. A score <b>passes</b> if it is at least 50. Print the passing scores from <b>highest to lowest</b>, one per line, and then a line like ${k('3 passed')}.</p>
        <p>For 40, 90, 55, 70, 10:</p>${pre('90\n70\n55\n3 passed')}`,
      starter: '// scores is a List<int>, for example 40, 90, 55, 70, 10\nforeach (int s in scores)\n{\n    Console.WriteLine(s);\n}\n',
      hints: ['Chain Where(s => s >= 50) and then OrderByDescending(s => s), and finish with ToList().', 'Loop over your new list instead of scores, then print its Count + " passed".'],
      similar: sim('Print the short words in alphabetical order, then how many there were.', 'List<string> words = new List<string> { "pear", "fig", "kiwi", "banana" };\nvar shortOnes = words.Where(w => w.Length <= 4).OrderBy(w => w).ToList();\nforeach (string w in shortOnes)\n{\n    Console.WriteLine(w);\n}\nConsole.WriteLine(shortOnes.Count + " short words");'),
      gate: 'C',
      require: [[/\.Where\s*\(/, 'Use <code>Where</code> to keep the passing scores.'], [/\.OrderBy(Descending)?\s*\(/, 'Sort them with <code>OrderByDescending(...)</code>.']],
      success: 'The prism sorts the light. You can <b>chain</b> LINQ!',
    }, cases([
      { label: listLabel('scores', [40, 90, 55, 70, 10]), globals: { scores: [40, 90, 55, 70, 10] }, expect: ['90', '70', '55', '3 passed'] },
      { label: listLabel('scores', [50, 49, 100]), globals: { scores: [50, 49, 100] }, expect: ['100', '50', '2 passed'] },
      { label: listLabel('scores', [12, 30]), globals: { scores: [12, 30] }, expect: ['0 passed'] },
    ])),
    cs2_linq4: Object.assign({
      title: 'The Counting Crystal',
      desc: `<p>Some LINQ methods answer with a <b>single value</b> instead of a list:</p>
        <ul><li>${k('Count(n => ...)')}: how many items pass the test</li>
        <li>${k('Sum()')}, ${k('Max()')}, ${k('Min()')}, ${k('Average()')}: maths over the whole list</li>
        <li>${k('Any(n => ...)')}: is at least one item passing? ${k('All(n => ...)')}: are all of them?</li></ul>
        <p>${k('readings')} is a ${k('List<int>')}. Print four lines, <b>without any loop</b>:</p>
        <ol><li>how many readings are above 100</li><li>the total of all readings</li><li>the highest reading</li><li>whether any reading is negative (${k('True')} or ${k('False')})</li></ol>
        <p>For 120, 80, 150, -5:</p>${pre('2\n345\n150\nTrue')}`,
      starter: '// readings is a List<int>, for example 120, 80, 150, -5\nint total = 0;\nforeach (int r in readings)\n{\n    total += r;\n}\nConsole.WriteLine(total);\n',
      hints: ['Each line is one Console.WriteLine with one LINQ method inside.', 'Count and Any both take a test, like r => r > 100. Sum and Max need no test here.'],
      similar: sim('How many words are long, and is every word lowercase?', 'List<string> words = new List<string> { "crystal", "spire", "lens" };\nConsole.WriteLine(words.Count(w => w.Length > 4));\nConsole.WriteLine(words.All(w => w == w.ToLower()));\nConsole.WriteLine(words.Min(w => w.Length));'),
      gate: 'D',
      require: [NO_LOOPS, [/\.Count\s*\(/, 'Use <code>readings.Count(...)</code> for the first line.'], [/\.Sum\s*\(/, 'Use <code>readings.Sum()</code> for the total.'], [/\.Max\s*\(/, 'Use <code>readings.Max()</code> for the highest reading.'], [/\.Any\s*\(/, 'Use <code>readings.Any(...)</code> to check for negative readings.']],
      success: 'Four questions, four lines, zero loops. <b>LINQ</b> at its best.',
    }, cases([
      { label: listLabel('readings', [120, 80, 150, -5]), globals: { readings: [120, 80, 150, -5] }, expect: ['2', '345', '150', 'True'] },
      { label: listLabel('readings', [10, 200]), globals: { readings: [10, 200] }, expect: ['1', '210', '200', 'False'] },
      { label: listLabel('readings', [101, 101, 101]), globals: { readings: [101, 101, 101] }, expect: ['3', '303', '101', 'False'] },
    ])),
    cs2_linq5: {
      title: "The Oracle's Query",
      desc: `<p>A LINQ chain fits nicely inside a function. Write ${k('int OddSquareSum(List<int> nums)')}: it keeps the <b>odd</b> numbers, <b>squares</b> each one, and returns their <b>sum</b>.</p>
        <p>For example, ${k('OddSquareSum([1, 2, 3])')} keeps 1 and 3, squares them to 1 and 9, and returns <b>10</b>. An empty list gives 0.</p>
        <p><b>Careful:</b> in C#, ${k('-3 % 2')} is ${k('-1')}, not 1! So test for odd numbers with ${k('n % 2 != 0')}.</p>`,
      starter: 'int OddSquareSum(List<int> nums)\n{\n    // keep the odd numbers, square them, add them up\n    return 0;\n}\n',
      hints: ['Chain three methods: Where, then Select, then Sum.', 'Select(n => n * n) squares every number.'],
      similar: sim('Double the numbers above 10 and add them up.', 'int BigDoubleSum(List<int> nums)\n{\n    return nums.Where(n => n > 10).Select(n => n * 2).Sum();\n}\n\nConsole.WriteLine(BigDoubleSum(new List<int> { 5, 20, 30 }));'),
      gate: 'E',
      callTests: [{ fn: 'OddSquareSum', args: [[1, 2, 3]] }, { fn: 'OddSquareSum', args: [[]] }, { fn: 'OddSquareSum', args: [[5, 4, -3]] }, { fn: 'OddSquareSum', args: [[2, 4, 6]] }],
      expectCalls: [10, 0, 34, 0],
      require: [[/\.Where\s*\(/, 'Use <code>Where</code> to keep the odd numbers.'], [/\.Select\s*\(/, 'Use <code>Select</code> to square them.'], [/\.Sum\s*\(/, 'Use <code>Sum()</code> to add them up.']],
      success: 'The Oracle nods. Where, Select and Sum in one chain!',
    },
    cs2_linq6: {
      title: 'The Gem Ledger',
      desc: `<p>LINQ really shines on lists of <b>objects</b>. The lambda gets a whole object, so you can use its properties:</p>
        ${pre('var cheap = gems.Where(g => g.Value < 20);\nvar names = gems.Select(g => g.Name);\nvar best = gems.OrderByDescending(g => g.Value).First();')}
        <p>${k('First()')} gives the first item of a sequence. Use LINQ on ${k('vault')} to print four lines:</p>
        <ol><li>the names of the <b>red</b> gems, joined with ${k('", "')}</li>
        <li>the total value of all gems (${k('Sum(g => g.Value)')})</li>
        <li>the name of the most valuable gem</li>
        <li>whether <b>every</b> gem is worth more than 10 (${k('All')})</li></ol>
        ${pre('Ruby, Garnet, Jasper\n160\nRuby\nTrue')}`,
      starter: 'List<Gem> vault = new List<Gem>\n{\n    new Gem("Ruby", 50, "red"),\n    new Gem("Opal", 30, "white"),\n    new Gem("Garnet", 45, "red"),\n    new Gem("Topaz", 20, "yellow"),\n    new Gem("Jasper", 15, "red"),\n};\n\n// 1. the names of the red gems, joined with ", "\n// 2. the total value of all gems\n// 3. the name of the most valuable gem\n// 4. whether every gem is worth more than 10\n\nclass Gem\n{\n    public string Name { get; }\n    public int Value { get; }\n    public string Color { get; }\n\n    public Gem(string name, int value, string color)\n    {\n        Name = name;\n        Value = value;\n        Color = color;\n    }\n}\n',
      hints: ['Line 1 chains Where(g => g.Color == "red") and Select(g => g.Name).', 'For line 3, sort with OrderByDescending(g => g.Value), take First(), and print its .Name.'],
      similar: sim('Ask questions about a list of heroes.', 'List<Hero> team = new List<Hero> { new Hero("Ada", 7), new Hero("Linus", 4) };\nConsole.WriteLine(string.Join(" & ", team.Select(h => h.Name)));\nConsole.WriteLine(team.Average(h => h.Level));\nConsole.WriteLine(team.OrderBy(h => h.Level).First().Name);\n\nclass Hero\n{\n    public string Name { get; }\n    public int Level { get; }\n\n    public Hero(string name, int level)\n    {\n        Name = name;\n        Level = level;\n    }\n}'),
      gate: 'G',
      require: [[/\.Where\s*\(/, 'Use <code>Where</code> to find the red gems.'], [/\.Sum\s*\(/, 'Use <code>Sum(g => g.Value)</code> for the total.'], [/\.OrderByDescending\s*\(|\.Max\s*\(/, 'Find the most valuable gem with <code>OrderByDescending(...)</code> and <code>First()</code>.'], [/\.All\s*\(/, 'Use <code>All(...)</code> for the last line.']],
      expect: ['Ruby, Garnet, Jasper', '160', 'Ruby', 'True'],
      success: 'The ledger balances perfectly. <b>The Lens Gallery is clear.</b>',
    },

    // ---------------------------------------------------------------- Level 3: interfaces & inheritance
    cs2_iface1: {
      title: 'The First Promise',
      desc: `<p>An <b>interface</b> is a promise: "any class that says it is an ${k('IGlow')} <b>will</b> have a ${k('Glow()')} method". The interface only lists what is promised. The classes fill in how.</p>
        ${pre('class Torch : IGlow   // Torch promises to keep the IGlow promise')}
        <p>${k('Crystal')} made the promise but has no ${k('Glow()')} yet, so the program doesn't even run. Run it and read the error!</p>
        <ul><li>Give ${k('Crystal')} a ${k('public string Glow()')} that returns ${k('"Crystal shimmers"')}.</li>
        <li>Write a third class ${k('Firefly : IGlow')} whose ${k('Glow()')} returns ${k('"Firefly blinks"')}, and add a ${k('new Firefly()')} to the end of the list.</li></ul>
        ${pre('Torch flickers\nCrystal shimmers\nFirefly blinks')}`,
      starter: 'List<IGlow> lights = new List<IGlow> { new Torch(), new Crystal() };\nforeach (IGlow light in lights)\n{\n    Console.WriteLine(light.Glow());\n}\n\ninterface IGlow\n{\n    string Glow();\n}\n\nclass Torch : IGlow\n{\n    public string Glow()\n    {\n        return "Torch flickers";\n    }\n}\n\n// Crystal promises to be an IGlow, but it doesn\'t keep the promise yet!\nclass Crystal : IGlow\n{\n}\n',
      hints: ['Copy the Glow method from Torch into Crystal and change the text.', 'The method must be public, or it doesn\'t count as keeping the promise.', 'class Firefly : IGlow { ... } goes at the bottom, and new Firefly() goes inside the list\'s { }.'],
      similar: sim('Two classes keep the IGreet promise.', 'List<IGreet> folks = new List<IGreet> { new Knight(), new Wizard() };\nforeach (IGreet f in folks)\n{\n    Console.WriteLine(f.Greet());\n}\n\ninterface IGreet\n{\n    string Greet();\n}\n\nclass Knight : IGreet\n{\n    public string Greet() { return "Hail!"; }\n}\n\nclass Wizard : IGreet\n{\n    public string Greet() { return "Greetings."; }\n}'),
      gate: 'A',
      require: [[/class\s+Firefly\s*:\s*IGlow/, 'Write a new class: <code>class Firefly : IGlow</code>'], [/new\s+Firefly\s*\(/, 'Add <code>new Firefly()</code> to the list.']],
      expect: ['Torch flickers', 'Crystal shimmers', 'Firefly blinks'],
      success: 'Every light keeps its promise. That is an <b>interface</b>.',
    },
    cs2_iface2: {
      title: 'The Shape Choir',
      desc: `<p>Because every class that implements an interface keeps the same promise, one list can hold them all, and one loop can treat them all the same way. This list holds ${k('IShape')}s:</p>
        ${pre('interface IShape\n{\n    string Name { get; }\n    int Area();\n}')}
        <p>Interfaces can promise <b>properties</b> too. Write two classes that implement ${k('IShape')}:</p>
        <ul><li>${k('Square')}: made with one side length. Its ${k('Name')} is ${k('"Square"')} and its area is side times side.</li>
        <li>${k('Rectangle')}: made with a width and a height. Its ${k('Name')} is ${k('"Rectangle"')} and its area is width times height.</li></ul>
        <p>The statements at the top should then print:</p>
        ${pre('Square: 9\nRectangle: 10\nSquare: 4\nTotal: 23')}`,
      starter: 'List<IShape> shapes = new List<IShape> { new Square(3), new Rectangle(2, 5), new Square(2) };\nforeach (IShape s in shapes)\n{\n    Console.WriteLine($"{s.Name}: {s.Area()}");\n}\nConsole.WriteLine("Total: " + shapes.Sum(s => s.Area()));\n\ninterface IShape\n{\n    string Name { get; }\n    int Area();\n}\n\n// Write class Square : IShape and class Rectangle : IShape here\n',
      hints: ['Each class stores its numbers in private fields, set by its constructor.', 'public string Name => "Square"; keeps the property promise, and public int Area() => side * side; keeps the method promise.'],
      similar: sim('Two kinds of pet implement IPet.', 'List<IPet> pets = new List<IPet> { new Cat(), new Fish(3) };\nforeach (IPet p in pets)\n{\n    Console.WriteLine($"{p.Kind} eats {p.Food()}");\n}\n\ninterface IPet\n{\n    string Kind { get; }\n    string Food();\n}\n\nclass Cat : IPet\n{\n    public string Kind => "Cat";\n    public string Food() => "tuna";\n}\n\nclass Fish : IPet\n{\n    private int flakes;\n\n    public Fish(int flakes)\n    {\n        this.flakes = flakes;\n    }\n\n    public string Kind => "Fish";\n    public string Food() => flakes + " flakes";\n}'),
      gate: 'B',
      require: [[/class\s+Square\s*:\s*IShape/, 'Write <code>class Square : IShape</code>.'], [/class\s+Rectangle\s*:\s*IShape/, 'Write <code>class Rectangle : IShape</code>.']],
      expect: ['Square: 9', 'Rectangle: 10', 'Square: 4', 'Total: 23'],
      success: 'The shapes sing together. One list, many classes: that is <b>polymorphism</b>.',
    },
    cs2_iface3: {
      title: 'The Echo Chamber',
      desc: `<p>A class can also <b>inherit</b> from another class and get all of its members for free. A method marked ${k('virtual')} may be replaced in the child class with ${k('override')}:</p>
        ${pre('class Wolf : Creature\n{\n    public Wolf(string name) : base(name) { }\n    public override string Sound() => "Awoo";\n}')}
        <p>${k(': base(name)')} passes the name on to the ${k('Creature')} constructor. Write:</p>
        <ul><li>${k('Wolf')}, whose ${k('Sound()')} is ${k('"Awoo"')}</li>
        <li>${k('Owl')}, whose ${k('Sound()')} is ${k('"Hoot"')}, and which also overrides ${k('Speak()')} to return ${k('base.Speak()')} plus ${k('" (at night)"')}. ${k('base.Speak()')} runs the parent's version.</li></ul>
        ${pre('Fang says Awoo\nPip says Hoot (at night)\nRocky says ...')}`,
      starter: 'List<Creature> choir = new List<Creature> { new Wolf("Fang"), new Owl("Pip"), new Creature("Rocky") };\nforeach (Creature c in choir)\n{\n    Console.WriteLine(c.Speak());\n}\n\nclass Creature\n{\n    public string Name { get; }\n\n    public Creature(string name)\n    {\n        Name = name;\n    }\n\n    public virtual string Sound()\n    {\n        return "...";\n    }\n\n    public virtual string Speak()\n    {\n        return $"{Name} says {Sound()}";\n    }\n}\n\n// Write class Wolf : Creature and class Owl : Creature here\n',
      hints: ['Each child class needs a constructor that ends with : base(name).', 'In Owl: public override string Speak() => base.Speak() + " (at night)";'],
      similar: sim('A Robot that overrides a virtual method and also uses base.', 'Machine m = new Robot();\nConsole.WriteLine(m.Beep());\n\nclass Machine\n{\n    public virtual string Beep() => "beep";\n}\n\nclass Robot : Machine\n{\n    public override string Beep() => base.Beep() + " boop";\n}'),
      gate: 'C',
      require: [[/class\s+Wolf\s*:\s*Creature/, 'Write <code>class Wolf : Creature</code>.'], [/class\s+Owl\s*:\s*Creature/, 'Write <code>class Owl : Creature</code>.'], [/override\s+string\s+Sound/, 'Replace <code>Sound()</code> with <code>public override string Sound()</code>.'], [/base\s*\.\s*Speak\s*\(/, 'Owl\'s <code>Speak()</code> should use <code>base.Speak()</code>.']],
      expect: ['Fang says Awoo', 'Pip says Hoot (at night)', 'Rocky says ...'],
      success: 'The chamber echoes with every voice. <b>virtual</b> and <b>override</b> mastered!',
    },
    cs2_iface4: {
      title: 'The Golem Forge',
      desc: `<p>An ${k('abstract')} class is a blueprint with gaps. You can't make one directly (${k('new Golem(...)')} is an error), but child classes can, once they fill the gaps. An ${k('abstract')} method has no body; every child <b>must</b> override it.</p>
        <p>${k('StoneGolem')} doesn't fill the gap yet, so the program won't run. Read the error, then:</p>
        <ul><li>Give ${k('StoneGolem')} a ${k('public override int Strike()')} that returns <b>7</b>.</li>
        <li>Write ${k('IceGolem : Golem')} whose ${k('Strike()')} returns <b>4</b>.</li></ul>
        ${pre('Boulder strikes for 7\nFrost strikes for 4\nPebble strikes for 7\nTotal power: 18')}`,
      starter: 'List<Golem> army = new List<Golem> { new StoneGolem("Boulder"), new IceGolem("Frost"), new StoneGolem("Pebble") };\nforeach (Golem g in army)\n{\n    Console.WriteLine(g.Report());\n}\nConsole.WriteLine("Total power: " + army.Sum(g => g.Strike()));\n\nabstract class Golem\n{\n    public string Name { get; }\n\n    protected Golem(string name)\n    {\n        Name = name;\n    }\n\n    // Every kind of golem must say how hard it strikes\n    public abstract int Strike();\n\n    public string Report() => $"{Name} strikes for {Strike()}";\n}\n\nclass StoneGolem : Golem\n{\n    public StoneGolem(string name) : base(name) { }\n}\n\n// Write class IceGolem : Golem here\n',
      hints: ['public override int Strike() => 7; fills the gap in StoneGolem.', 'IceGolem looks just like StoneGolem, with its own name and number.'],
      similar: sim('An abstract Instrument with two kinds of instrument.', 'List<Instrument> band = new List<Instrument> { new Drum(), new Flute() };\nforeach (Instrument i in band)\n{\n    Console.WriteLine(i.Play());\n}\n\nabstract class Instrument\n{\n    public abstract string Note();\n    public string Play() => "Playing " + Note();\n}\n\nclass Drum : Instrument\n{\n    public override string Note() => "boom";\n}\n\nclass Flute : Instrument\n{\n    public override string Note() => "toot";\n}'),
      gate: 'D',
      require: [[/class\s+IceGolem\s*:\s*Golem/, 'Write <code>class IceGolem : Golem</code>.'], [/override\s+int\s+Strike/, 'Fill the gap with <code>public override int Strike()</code>.']],
      expect: ['Boulder strikes for 7', 'Frost strikes for 4', 'Pebble strikes for 7', 'Total power: 18'],
      success: 'The golems march! An <b>abstract</b> class makes sure no child forgets its job.',
    },
    cs2_iface5: {
      title: 'The Spell Library',
      desc: `<p>Let's put it to real use. Every spell implements ${k('ISpell')}: it has a ${k('Name')}, a mana ${k('Cost')} and a ${k('Cast(target)')} method. ${k('Spark')} is done already.</p>
        <ol><li>Write ${k('Frost')} (cost <b>5</b>, casting returns ${k('"Frost freezes "')} + the target) and ${k('Fireball')} (cost <b>8</b>, returns ${k('"Fireball burns "')} + the target).</li>
        <li>Go through the spells from <b>cheapest to most expensive</b> (${k('OrderBy')}). If the spell's cost fits in ${k('mana')}, print its ${k('Cast("the Wraith")')} followed by the cost in brackets, and subtract the cost from ${k('mana')}. Otherwise print ${k('Not enough mana for')} and its name.</li>
        <li>Finally print how much mana is left.</li></ol>
        ${pre('Spark zaps the Wraith (2 mana)\nFrost freezes the Wraith (5 mana)\nNot enough mana for Fireball\n3 mana left')}`,
      starter: 'List<ISpell> book = new List<ISpell> { new Fireball(), new Frost(), new Spark() };\nint mana = 10;\n\n// Cast the spells from cheapest to most expensive, while you have enough mana\n\ninterface ISpell\n{\n    string Name { get; }\n    int Cost { get; }\n    string Cast(string target);\n}\n\nclass Spark : ISpell\n{\n    public string Name => "Spark";\n    public int Cost => 2;\n    public string Cast(string target) => $"{Name} zaps {target}";\n}\n\n// Write class Frost and class Fireball here\n',
      hints: ['foreach (ISpell spell in book.OrderBy(s => s.Cost)) visits the cheapest spell first.', 'Inside the loop: if (spell.Cost <= mana) { ... } else { ... }. Print with $"{spell.Cast("the Wraith")} ({spell.Cost} mana)".'],
      similar: sim('Buy the cheapest items while the money lasts.', 'List<IItem> shop = new List<IItem> { new Sword(), new Apple() };\nint coins = 6;\nforeach (IItem item in shop.OrderBy(i => i.Price))\n{\n    if (item.Price <= coins)\n    {\n        coins -= item.Price;\n        Console.WriteLine("Bought " + item.Name);\n    }\n    else\n    {\n        Console.WriteLine("Too pricey: " + item.Name);\n    }\n}\n\ninterface IItem\n{\n    string Name { get; }\n    int Price { get; }\n}\n\nclass Sword : IItem\n{\n    public string Name => "Sword";\n    public int Price => 9;\n}\n\nclass Apple : IItem\n{\n    public string Name => "Apple";\n    public int Price => 1;\n}'),
      gate: 'E',
      require: [[/class\s+Frost\s*:\s*ISpell/, 'Write <code>class Frost : ISpell</code>.'], [/class\s+Fireball\s*:\s*ISpell/, 'Write <code>class Fireball : ISpell</code>.'], [/\.OrderBy\s*\(/, 'Go through the spells with <code>book.OrderBy(s => s.Cost)</code>.']],
      expect: ['Spark zaps the Wraith (2 mana)', 'Frost freezes the Wraith (5 mana)', 'Not enough mana for Fireball', '3 mana left'],
      success: 'The Wraith flees up the Spire! Interfaces plus LINQ: <b>the Resonance Halls are clear.</b>',
    },

    // ---------------------------------------------------------------- Level 4: exceptions (the finale)
    cs2_exc1: Object.assign({
      title: 'The Cracked Rune',
      desc: `<p>${k('int.Parse("42")')} turns text into a number. But ${k('int.Parse("x")')} can't, so it <b>throws</b> a ${k('FormatException')}, and an exception nobody catches crashes the whole program.</p>
        <p>Wrap the risky part in ${k('try')}, and handle the problem in ${k('catch')}:</p>
        ${pre('try\n{\n    int n = int.Parse(text);\n}\ncatch (FormatException)\n{\n    Console.WriteLine("That was not a number");\n}')}
        <p>${k('inputs')} is a ${k('List<string>')}. For each one, print the number <b>doubled</b>, or, if it isn't a whole number, print it followed by ${k('is not a number')}. For "4", "x", "10":</p>
        ${pre('8\nx is not a number\n20')}`,
      starter: '// inputs is a List<string>, for example "4", "x", "10"\nforeach (string s in inputs)\n{\n    int n = int.Parse(s);\n    Console.WriteLine(n * 2);\n}\n',
      hints: ['Run the starter first: it crashes on "x". That crash is the exception you need to catch.', 'Put the try { } inside the loop, around the two lines, so one bad input doesn\'t stop the others.', 'In the catch block, print $"{s} is not a number".'],
      similar: sim('Parse a list of ages, skipping the broken ones.', 'List<string> ages = new List<string> { "12", "old" };\nforeach (string a in ages)\n{\n    try\n    {\n        Console.WriteLine("Age " + int.Parse(a));\n    }\n    catch (FormatException)\n    {\n        Console.WriteLine("Skipping " + a);\n    }\n}'),
      gate: 'A',
      require: [[/\btry\b/, 'Wrap the risky code in a <code>try { }</code> block.'], [/catch\s*\(\s*FormatException/, 'Catch the right kind of exception: <code>catch (FormatException)</code>.']],
      success: 'The rune holds together. You <b>caught</b> your first exception!',
    }, cases([
      { label: listLabel('inputs', ['4', 'x', '10']), globals: { inputs: ['4', 'x', '10'] }, expect: ['8', 'x is not a number', '20'] },
      { label: listLabel('inputs', ['7']), globals: { inputs: ['7'] }, expect: ['14'] },
      { label: listLabel('inputs', ['ten', '-3', '2.5']), globals: { inputs: ['ten', '-3', '2.5'] }, expect: ['ten is not a number', '-6', '2.5 is not a number'] },
    ])),
    cs2_exc2: {
      title: 'The Safe Divider',
      desc: `<p>Dividing a whole number by zero throws a ${k('DivideByZeroException')}. A ${k('return')} inside ${k('try')} or ${k('catch')} works just like anywhere else.</p>
        <p>Write ${k('int SafeDivide(int a, int b)')}: it returns ${k('a / b')}, but if that throws a ${k('DivideByZeroException')}, it catches it and returns <b>0</b> instead.</p>
        <p>${k('SafeDivide(10, 2)')} is 5 and ${k('SafeDivide(7, 0)')} is 0.</p>`,
      starter: 'int SafeDivide(int a, int b)\n{\n    return a / b;\n}\n',
      hints: ['Put return a / b; inside a try block.', 'The catch (DivideByZeroException) block returns 0.'],
      similar: sim('Return -1 when a list index is too big.', 'int SafeGet(List<int> nums, int i)\n{\n    try\n    {\n        return nums[i];\n    }\n    catch (ArgumentOutOfRangeException)\n    {\n        return -1;\n    }\n}\n\nConsole.WriteLine(SafeGet(new List<int> { 5, 6 }, 9));'),
      gate: 'B',
      callTests: [{ fn: 'SafeDivide', args: [10, 2] }, { fn: 'SafeDivide', args: [7, 0] }, { fn: 'SafeDivide', args: [9, 3] }, { fn: 'SafeDivide', args: [-8, 0] }],
      expectCalls: [5, 0, 3, 0],
      require: [[/\btry\b/, 'Use a <code>try { }</code> block around the division.'], [/catch\s*\(\s*DivideByZeroException/, 'Catch it with <code>catch (DivideByZeroException)</code>.']],
      success: 'No more crashes from zero. Safe and sound!',
    },
    cs2_exc3: {
      title: "The Gatekeeper's Log",
      desc: `<p>One ${k('try')} can have <b>several</b> ${k('catch')} blocks, one for each kind of problem. C# runs the first one that matches. A ${k('finally')} block runs <b>every time</b>, whether there was an exception or not.</p>
        <p>${k('Open(name)')} can fail in two ways: an unknown door throws a ${k('KeyNotFoundException')}, and a locked door throws an ${k('InvalidOperationException')} with a message. Change the loop so that it prints:</p>
        ${pre('The north door swings open\nDoor checked\nLocked: The east door is locked\nDoor checked\nNo door called west\nDoor checked')}
        <p>Use one ${k('catch')} for each kind (print ${k('"Locked: "')} plus the exception's ${k('Message')}, or ${k('No door called')} plus the name) and a ${k('finally')} that prints ${k('Door checked')}.</p>`,
      starter: 'var doors = new Dictionary<string, bool> { { "north", true }, { "east", false } };\n\nstring Open(string name)\n{\n    bool unlocked = doors[name];   // an unknown door throws KeyNotFoundException\n    if (!unlocked)\n    {\n        throw new InvalidOperationException($"The {name} door is locked");\n    }\n    return $"The {name} door swings open";\n}\n\nforeach (string d in new List<string> { "north", "east", "west" })\n{\n    Console.WriteLine(Open(d));\n}\n',
      hints: ['catch (InvalidOperationException e) gives you the exception as e, so you can print e.Message.', 'The finally { } block goes after the last catch block.'],
      similar: sim('Two kinds of catch and a finally.', 'List<int> nums = new List<int> { 4 };\nforeach (int i in new List<int> { 0, 3 })\n{\n    try\n    {\n        Console.WriteLine(100 / nums[i]);\n    }\n    catch (ArgumentOutOfRangeException)\n    {\n        Console.WriteLine("No item " + i);\n    }\n    catch (DivideByZeroException)\n    {\n        Console.WriteLine("Zero!");\n    }\n    finally\n    {\n        Console.WriteLine("next");\n    }\n}'),
      gate: 'C',
      require: [[/catch\s*\(\s*KeyNotFoundException/, 'Add <code>catch (KeyNotFoundException)</code> for unknown doors.'], [/catch\s*\(\s*InvalidOperationException/, 'Add <code>catch (InvalidOperationException e)</code> for locked doors.'], [/\bfinally\b/, 'Add a <code>finally { }</code> block that prints <code>Door checked</code>.']],
      expect: ['The north door swings open', 'Door checked', 'Locked: The east door is locked', 'Door checked', 'No door called west', 'Door checked'],
      success: 'Every door logged, nothing crashed. <b>finally</b> never forgets!',
    },
    cs2_exc4: {
      title: 'The Measured Vial',
      desc: `<p>You can <b>throw</b> exceptions yourself when something is wrong. A property's ${k('set')} is a great place to refuse bad values:</p>
        ${pre('if (value < 0)\n{\n    throw new ArgumentException("Speed can\'t be negative");\n}')}
        <p>${k('throw')} stops the setter right there: the bad value is never stored. Make the vial's ${k('Dose')} setter throw an ${k('ArgumentException')} with the message ${k("Dose must be between 1 and 5")} when ${k('value')} is below 1 or above 5. Don't change the statements at the top. They should print:</p>
        ${pre('Dose set to 3\nRejected: Dose must be between 1 and 5\nRejected: Dose must be between 1 and 5\nDose set to 5')}`,
      starter: 'Vial vial = new Vial();\nforeach (int dose in new List<int> { 3, 9, 0, 5 })\n{\n    try\n    {\n        vial.Dose = dose;\n        Console.WriteLine("Dose set to " + vial.Dose);\n    }\n    catch (ArgumentException e)\n    {\n        Console.WriteLine("Rejected: " + e.Message);\n    }\n}\n\nclass Vial\n{\n    private int dose;\n\n    public int Dose\n    {\n        get { return dose; }\n        set\n        {\n            // throw an ArgumentException if value is below 1 or above 5\n            dose = value;\n        }\n    }\n}\n',
      hints: ['Check value < 1 || value > 5 before storing it.', 'throw new ArgumentException("...") with exactly the message from the task.'],
      similar: sim('A Name property that refuses empty text.', 'Pet pet = new Pet();\ntry\n{\n    pet.Name = "";\n}\ncatch (ArgumentException e)\n{\n    Console.WriteLine("Oops: " + e.Message);\n}\n\nclass Pet\n{\n    private string name = "Pixel";\n\n    public string Name\n    {\n        get { return name; }\n        set\n        {\n            if (value == "")\n            {\n                throw new ArgumentException("A pet needs a name");\n            }\n            name = value;\n        }\n    }\n}'),
      gate: 'D',
      require: [[/throw\s+new\s+ArgumentException\s*\(/, 'Refuse bad doses with <code>throw new ArgumentException("...")</code>.']],
      expect: ['Dose set to 3', 'Rejected: Dose must be between 1 and 5', 'Rejected: Dose must be between 1 and 5', 'Dose set to 5'],
      success: 'Not one drop too many. <b>throw</b> keeps bad values out.',
    },
    cs2_exc5: {
      title: 'The Custom Curse',
      desc: `<p>You can make your <b>own</b> kind of exception by inheriting from ${k('Exception')}. It can carry extra information in its own properties, and pass its message on with ${k(': base(...)')}:</p>
        ${pre('class TooHotException : Exception\n{\n    public int Degrees { get; }\n\n    public TooHotException(int degrees) : base($"{degrees} is too hot")\n    {\n        Degrees = degrees;\n    }\n}')}
        <ul><li>Write ${k('OutOfManaException : Exception')} with an ${k('int Needed')} property. Its constructor takes the mana needed and passes the message ${k('$"Need {needed} more mana"')} to ${k('base')}.</li>
        <li>In ${k('Wizard.Cast')}, if the cost is more than ${k('Mana')}, throw a ${k('new OutOfManaException(cost - Mana)')} instead of casting.</li></ul>
        ${pre('Cast! 6 mana left\nFizzle: Need 1 more mana (short by 1)\nCast! 3 mana left')}`,
      starter: 'Wizard wiz = new Wizard(10);\nforeach (int cost in new List<int> { 4, 7, 3 })\n{\n    try\n    {\n        wiz.Cast(cost);\n        Console.WriteLine($"Cast! {wiz.Mana} mana left");\n    }\n    catch (OutOfManaException e)\n    {\n        Console.WriteLine($"Fizzle: {e.Message} (short by {e.Needed})");\n    }\n}\n\nclass Wizard\n{\n    public int Mana { get; private set; }\n\n    public Wizard(int mana)\n    {\n        Mana = mana;\n    }\n\n    public void Cast(int cost)\n    {\n        // if cost is more than Mana, throw a new OutOfManaException(cost - Mana)\n        Mana -= cost;\n    }\n}\n\n// Write class OutOfManaException : Exception here\n',
      hints: ['The constructor line looks like: public OutOfManaException(int needed) : base($"Need {needed} more mana")', 'In Cast, the if (cost > Mana) check with its throw must come before Mana -= cost;'],
      similar: sim('A custom exception for a full backpack.', 'try\n{\n    throw new BagFullException(3);\n}\ncatch (BagFullException e)\n{\n    Console.WriteLine(e.Message + " / extra: " + e.Extra);\n}\n\nclass BagFullException : Exception\n{\n    public int Extra { get; }\n\n    public BagFullException(int extra) : base("The bag is full")\n    {\n        Extra = extra;\n    }\n}'),
      gate: 'E',
      require: [[/class\s+OutOfManaException\s*:\s*Exception/, 'Write <code>class OutOfManaException : Exception</code>.'], [/:\s*base\s*\(/, 'Pass the message on with <code>: base(...)</code> in the constructor.'], [/throw\s+new\s+OutOfManaException\s*\(/, 'In <code>Cast</code>, <code>throw new OutOfManaException(cost - Mana)</code> when there is not enough mana.']],
      expect: ['Cast! 6 mana left', 'Fizzle: Need 1 more mana (short by 1)', 'Cast! 3 mana left'],
      success: 'Your very own exception! Now you can throw this curse yourself.',
    },
    cs2_exc6: {
      title: "The Spire's Heart",
      desc: `<p>The Null Wraith has scrambled the sensors of the Spire's heart. Use <b>everything</b> from this chapter to restore its power.</p>
        <ol><li>Finish ${k('Crystal')}: it must keep the ${k('IPowerSource')} promise. Give it an ${k('Energy')} property with a private backing field whose ${k('set')} throws ${k('new ArgumentException("Energy can\'t be negative")')} for values below 0.</li>
        <li>For each reading such as ${k('"ruby:40"')}: split it at the ${k(':')} with ${k('Split(\':\')')}, parse the energy, and add a ${k('new Crystal(...)')} to ${k('grid')}. If parsing throws a ${k('FormatException')}, print ${k('Skipped opal: bad reading')}. If the crystal throws an ${k('ArgumentException')}, print ${k('Skipped')}, the name, a colon and the exception's message.</li>
        <li>Print the total ${k('Energy')} of the grid with LINQ, then the ${k('Name')} of the strongest source.</li>
        <li>If the total is at least 150, print ${k('The Spire shines again!')}</li></ol>
        ${pre("Skipped opal: bad reading\nSkipped onyx: Energy can't be negative\nSpire power: 165\nStrongest: jade\nThe Spire shines again!")}`,
      starter: 'List<string> readings = new List<string> { "ruby:40", "opal:x", "jade:75", "onyx:-5", "topaz:30" };\nList<IPowerSource> grid = new List<IPowerSource> { new Generator() };\n\n// 1. For each reading: split it, parse the energy, add a new Crystal to the grid.\n//    Catch FormatException and ArgumentException.\n// 2. Print "Spire power: " and the total Energy of the grid (LINQ).\n// 3. Print "Strongest: " and the Name of the source with the most Energy.\n// 4. If the total is at least 150, print "The Spire shines again!"\n\ninterface IPowerSource\n{\n    string Name { get; }\n    int Energy { get; }\n}\n\nclass Generator : IPowerSource\n{\n    public string Name => "generator";\n    public int Energy => 20;\n}\n\nclass Crystal : IPowerSource\n{\n    public string Name { get; }\n    // Add the Energy property here: a private backing field,\n    // and a set that throws an ArgumentException for values below 0\n\n    public Crystal(string name, int energy)\n    {\n        Name = name;\n        Energy = energy;\n    }\n}\n',
      hints: ['Split first, outside the try: string[] parts = r.Split(\':\'); then parts[0] is the name and parts[1] the energy text.', 'Inside try: int.Parse(parts[1]) and grid.Add(new Crystal(...)). Then catch (FormatException) and catch (ArgumentException e).', 'grid.Sum(s => s.Energy) is the total; grid.OrderByDescending(s => s.Energy).First().Name is the strongest.'],
      similar: sim('Read "name:score" lines, skip broken ones, then use LINQ.', 'List<string> lines = new List<string> { "ada:9", "bob:?", "cy:7" };\nList<int> good = new List<int>();\nforeach (string line in lines)\n{\n    string[] parts = line.Split(\':\');\n    try\n    {\n        good.Add(int.Parse(parts[1]));\n    }\n    catch (FormatException)\n    {\n        Console.WriteLine("Bad score for " + parts[0]);\n    }\n}\nConsole.WriteLine("Best: " + good.Max());'),
      gate: 'G',
      require: [[/\bset\b[\s\S]*throw\s+new\s+ArgumentException\s*\(/, 'Give <code>Energy</code> a <code>set</code> that does <code>throw new ArgumentException(...)</code> for negative values.'], [/\btry\b/, 'Wrap the parsing in a <code>try { }</code> block.'], [/catch\s*\(\s*FormatException/, 'Catch bad readings with <code>catch (FormatException)</code>.'], [/catch\s*\(\s*ArgumentException/, 'Catch negative energy with <code>catch (ArgumentException e)</code>.'], [/\.Sum\s*\(/, 'Add up the energy with LINQ: <code>grid.Sum(s => s.Energy)</code>.']],
      expect: ['Skipped opal: bad reading', "Skipped onyx: Energy can't be negative", 'Spire power: 165', 'Strongest: jade', 'The Spire shines again!'],
      success: 'The heart of the Spire blazes with light. The Null Wraith shatters into harmless sparkles. <b>The Crystal Spire is restored!</b>',
    },
  };

  // ================================================================== levels
  const levels = [
    {
      id: 'cs2_props',
      name: 'The Facet Halls',
      topic: 'Properties',
      blurb: 'Crystals that guard their own values: auto-properties, private set, validation and computed properties.',
      intro: '<p>With Segfault defeated, a tower of glittering crystal has risen at the edge of Syntaxia: <b>the Crystal Spire</b>. Every crystal in it stores a value, and its doors only open for coders who can keep those values safe.</p><p>But something is stirring at the top. A shadow called the <b>Null Wraith</b> is cracking the crystals, and wherever it passes, programs crash with strange errors.</p><p>Your first lesson is in the Facet Halls: <b>properties</b>, the C# way to let the outside world use an object\'s data without letting it break anything.</p>' + pre('public int Power { get; private set; }'),
      tutorial: [
        { title: 'From field to property',
          body: '<p>In Chapter 1 you wrote public fields like <code>public string Name;</code>. Real C# code uses <b>properties</b> instead. The short form is an <b>auto-property</b>:</p>' + pre('public string Name { get; set; }') + '<p>From the outside it is used exactly like a field. The difference is that <code>get</code> (reading) and <code>set</code> (writing) are separate little doors, and you can lock or change each one later without changing the code that uses the class. Property names start with a capital letter.</p>',
          code: 'Gem gem = new Gem();\ngem.Name = "Opal";\ngem.Carats = 2;\nConsole.WriteLine($"{gem.Name}: {gem.Carats} carats");\n\nclass Gem\n{\n    public string Name { get; set; }\n    public int Carats { get; set; }\n}' },
        { title: 'Read-only from outside: private set',
          body: '<p>Put <code>private</code> in front of <code>set</code>, and only code <b>inside</b> the class can change the property. Everyone can still read it.</p><p>The class offers methods, like <code>Charge</code> here, as the only way to change the value. That way it can make sure the value always makes sense.</p>',
          code: 'Battery b = new Battery();\nb.Charge(40);\nb.Charge(25);\nConsole.WriteLine("Level: " + b.Level);\n\nclass Battery\n{\n    public int Level { get; private set; }\n\n    public void Charge(int amount)\n    {\n        Level += amount;\n    }\n}' },
        { title: 'Common mistake: writing to a private set',
          body: '<p>Try to assign a property with a private setter from outside the class, and C# refuses: the set accessor is <b>inaccessible</b>.</p><p>Run it and read the error. Then fix it by calling <code>b.Charge(100);</code> instead.</p>',
          code: 'Battery b = new Battery();\nb.Level = 100;\nConsole.WriteLine(b.Level);\n\nclass Battery\n{\n    public int Level { get; private set; }\n\n    public void Charge(int amount)\n    {\n        Level += amount;\n    }\n}',
          expectError: true },
        { title: 'Read-only properties and starting values',
          body: '<p>A property with only <code>{ get; }</code> can be set in the <b>constructor</b> and never again. Use it for things that never change, like a name.</p><p>You can also give any auto-property a starting value with <code>= ...;</code> after the braces.</p>',
          code: 'Shard s = new Shard("Moonstone");\nConsole.WriteLine(s.Name + " is " + s.Color);\ns.Color = "silver";\nConsole.WriteLine(s.Name + " is " + s.Color);\n\nclass Shard\n{\n    public string Name { get; }\n    public string Color { get; set; } = "clear";\n\n    public Shard(string name)\n    {\n        Name = name;\n    }\n}' },
        { title: 'get and set with a body',
          body: '<p>When you need to check values, write the property out in full. The data lives in a private <b>backing field</b> (same name, lowercase). Inside <code>set</code>, the word <code>value</code> is the new value someone is assigning.</p><p>Here the setter refuses to let health go below 0.</p>',
          code: 'Hero h = new Hero();\nh.Health = 30;\nConsole.WriteLine(h.Health);\nh.Health = -10;\nConsole.WriteLine(h.Health);\n\nclass Hero\n{\n    private int health;\n\n    public int Health\n    {\n        get { return health; }\n        set\n        {\n            if (value < 0)\n            {\n                health = 0;\n            }\n            else\n            {\n                health = value;\n            }\n        }\n    }\n}' },
        { title: 'Computed properties with =>',
          body: '<p>A property can also <b>calculate</b> its answer each time it is read. Write <code>=&gt;</code> and an expression. It has no setter and stores nothing, so it can never be out of date.</p>' + cheat([[k('{ get; set; }'), 'auto-property'], [k('{ get; private set; }'), 'only the class can change it'], [k('{ get; }'), 'read-only, set in the constructor'], [k('set { x = value; }'), 'a setter with checks'], [k('=> expression;'), 'computed every time']]),
          code: 'Room r = new Room(4, 5);\nConsole.WriteLine(r.Area);\nConsole.WriteLine(r.IsBig);\n\nclass Room\n{\n    public int Width { get; }\n    public int Length { get; }\n    public int Area => Width * Length;\n    public bool IsBig => Area > 15;\n\n    public Room(int width, int length)\n    {\n        Width = width;\n        Length = length;\n    }\n}' },
      ],
      signs: [
        'Welcome to the Crystal Spire! Every terminal here works with classes, so your statements go at the top and the classes at the bottom, just like in Chapter 1.',
        'A property is used like a field: gem.Name = "Ruby"; but behind it are get and set, which you control.',
        'Well done! The Facet Halls are behind you. Next: the Lens Gallery, where one line of LINQ can do the work of a whole loop.',
      ],
      terminals: ['cs2_props1', 'cs2_props2', 'cs2_props3', 'cs2_props4', 'cs2_props5'],
      map: (B) => {
        const m = B.MapBuilder(120, 17);
        m.fill(0, 15, 119, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'wall', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'climb', 'B');
        x = B.TR.pit(m, x + 1);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 2, 3, 'spring', 'C');
        m.put(x + 1, 14, 'K');
        x = B.TR.tower(m, x + 3);
        m.put(x + 1, 14, 'e');
        x = B.room(m, x + 3, 4, 'bridge', 'D');
        x = B.TR.mover(m, x + 1);
        x = B.room(m, x + 1, 5, 'spikes', 'E');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
    {
      id: 'cs2_linq',
      name: 'The Lens Gallery',
      topic: 'LINQ',
      blurb: 'Lenses that filter, sort and transform: Where, Select, OrderBy, Count, Sum, Any and friends.',
      intro: '<p>The second floor of the Spire is a gallery of enormous <b>lenses</b>. Shine a list of crystals through one, and only the ones you asked for come out the other side: sorted, changed, or counted.</p><p>Coders call this <b>LINQ</b> (say "link"). Instead of writing a loop, you describe the answer you want:</p>' + pre('var bright = crystals.Where(c => c > 50).OrderBy(c => c);') + '<p>The Null Wraith has fogged up every lens. Clear them, and the stairs to the next floor appear.</p>',
      tutorial: [
        { title: 'Lambdas: tiny functions',
          body: '<p>LINQ needs small functions to tell it what to do. C# has a short way to write one, called a <b>lambda</b>:</p>' + pre('n => n * 2') + '<p>Read <code>=&gt;</code> as "goes to": "n goes to n times 2". The left side is the input, the right side is the answer. You can even store a lambda in a variable with <code>Func</code>. The last type in the <code>&lt; &gt;</code> is the answer type.</p>',
          code: 'Func<int, int> twice = n => n * 2;\nFunc<int, bool> isBig = n => n > 10;\nConsole.WriteLine(twice(21));\nConsole.WriteLine(isBig(5));' },
        { title: 'Where: keep what matches',
          body: '<p><code>Where</code> goes through the list and keeps only the items for which the lambda says <code>true</code>. The original list is not changed.</p><p><code>string.Join(", ", ...)</code> is a handy way to print the result on one line.</p><p>(LINQ lives in <code>System.Linq</code>. Modern C# projects include it for you, and so does CodeQuest.)</p>',
          code: 'List<int> nums = new List<int> { 4, 15, 8, 23, 16 };\nvar big = nums.Where(n => n > 10);\nConsole.WriteLine(string.Join(", ", big));\nConsole.WriteLine(string.Join(", ", nums));' },
        { title: 'Select: change every item',
          body: '<p><code>Select</code> turns every item into something new: a different number, a piece of text, a property of an object... The result always has the same number of items as the list you started with.</p>',
          code: 'List<string> names = new List<string> { "ada", "linus", "grace" };\nConsole.WriteLine(string.Join(" ", names.Select(n => n.ToUpper())));\nConsole.WriteLine(string.Join(" ", names.Select(n => n.Length)));' },
        { title: 'Chains and sorting',
          body: '<p>Each LINQ method hands its answer to the next one, so you can <b>chain</b> them. <code>OrderBy</code> sorts small to large, <code>OrderByDescending</code> large to small. Finish with <code>ToList()</code> when you want a real <code>List</code> again, for example to use <code>.Count</code>.</p>',
          code: 'List<int> nums = new List<int> { 7, 2, 9, 4, 12 };\nList<int> result = nums.Where(n => n > 3).OrderByDescending(n => n).ToList();\nforeach (int n in result)\n{\n    Console.WriteLine(n);\n}\nConsole.WriteLine(result.Count + " numbers");' },
        { title: 'One-word answers',
          body: '<p>Some methods boil a whole list down to <b>one</b> value:</p>' + cheat([[k('Count(n => ...)'), 'how many pass the test'], [k('Sum()') + ' ' + k('Max()') + ' ' + k('Min()') + ' ' + k('Average()'), 'maths over the list'], [k('Any(n => ...)'), 'does at least one pass?'], [k('All(n => ...)'), 'do all of them pass?'], [k('First(n => ...)'), 'the first item that passes']]) + '<p>Careful: <code>First</code> throws an error if no item passes.</p>',
          code: 'List<int> temps = new List<int> { 12, 25, 31, 18 };\nConsole.WriteLine(temps.Count(t => t > 20));\nConsole.WriteLine(temps.Sum());\nConsole.WriteLine(temps.Max());\nConsole.WriteLine(temps.Any(t => t > 30));\nConsole.WriteLine(temps.All(t => t > 15));\nConsole.WriteLine(temps.First(t => t > 20));' },
        { title: 'LINQ over objects',
          body: '<p>The lambda receives each whole <b>object</b>, so you can use its properties. This is where LINQ really shines: questions about lists of things become one readable line each.</p>',
          code: 'List<Pet> pets = new List<Pet> { new Pet("Pixel", 3), new Pet("Byte", 7), new Pet("Nibble", 5) };\nConsole.WriteLine(string.Join(", ", pets.Where(p => p.Age > 4).Select(p => p.Name)));\nConsole.WriteLine(pets.Sum(p => p.Age));\nConsole.WriteLine(pets.OrderBy(p => p.Age).First().Name);\n\nclass Pet\n{\n    public string Name { get; }\n    public int Age { get; }\n\n    public Pet(string name, int age)\n    {\n        Name = name;\n        Age = age;\n    }\n}' },
      ],
      signs: [
        'The lenses use lambdas: n => n > 10 means "take n, answer whether n is more than 10".',
        'Stuck? LINQ methods can be chained: list.Where(...).OrderBy(...).ToList()',
        'The gallery is clear! Next floor: the Resonance Halls, where many different classes learn to sing the same song.',
      ],
      terminals: ['cs2_linq1', 'cs2_linq2', 'cs2_linq3', 'cs2_linq4', 'cs2_linq5', 'cs2_linq6'],
      map: (B) => {
        const m = B.MapBuilder(144, 17);
        m.fill(0, 15, 143, 16, '#');
        m.put(2, 14, 'P'); m.put(4, 14, '?');
        let x = B.room(m, 6, 1, 'climb', 'A');
        x = B.TR.hills(m, x);
        x = B.room(m, x, 2, 'bridge', 'B');
        m.put(x + 2, 14, 'e');
        x = B.TR.tower(m, x + 4); m.put(x - 4, 9, 'w');
        x = B.room(m, x, 3, 'wall', 'C');
        m.put(x + 1, 14, '?');
        x = B.TR.pit(m, x + 3);
        x = B.room(m, x + 1, 4, 'lava', 'D');
        m.put(x + 1, 14, 'K');
        x = B.TR.hills(m, x + 3);
        x = B.room(m, x, 5, 'spring', 'E');
        x = B.TR.mover(m, x + 1);
        x = B.room(m, x + 1, 6, 'spikes', 'G');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
    {
      id: 'cs2_iface',
      name: 'The Resonance Halls',
      topic: 'Interfaces',
      blurb: 'Many classes, one promise: interfaces, inheritance, virtual, override and abstract classes.',
      intro: '<p>The third floor hums with music. Crystals of every shape stand in a great choir: squares, prisms, spheres. They are all different, yet they all answer the same call.</p><p>That is the idea of an <b>interface</b>: a promise that a class will have certain methods and properties. Any class that keeps the promise can join the choir, and code can work with all of them without caring which is which.</p>' + pre('interface IShape\n{\n    int Area();\n}\n\nclass Square : IShape { ... }') + '<p>The Null Wraith has knocked the choir out of tune. Restore its harmony!</p>',
      tutorial: [
        { title: 'An interface is a promise',
          body: '<p>An <b>interface</b> lists methods (and properties) without writing their code. By convention, its name starts with a capital <b>I</b>.</p><p><code>class Lamp : IGlow</code> means "Lamp keeps the IGlow promise". The class must then have every promised member, and they must be <code>public</code>.</p><p>A variable of type <code>IGlow</code> can hold any object that keeps the promise.</p>',
          code: 'IGlow light = new Lamp();\nConsole.WriteLine(light.Glow());\n\ninterface IGlow\n{\n    string Glow();\n}\n\nclass Lamp : IGlow\n{\n    public string Glow()\n    {\n        return "The lamp glows warmly";\n    }\n}' },
        { title: 'Breaking a promise',
          body: '<p>If a class says it implements an interface but is missing a member, C# won\'t even run the program. The error tells you exactly which member is missing.</p><p>Run it, then fix it by giving <code>Candle</code> a <code>public string Glow()</code> method.</p>',
          code: 'IGlow c = new Candle();\nConsole.WriteLine(c.Glow());\n\ninterface IGlow\n{\n    string Glow();\n}\n\nclass Candle : IGlow\n{\n}',
          expectError: true },
        { title: 'One list, many classes',
          body: '<p>Here is why that matters: a <code>List&lt;IShape&gt;</code> can hold squares, circles and anything else that keeps the <code>IShape</code> promise. Each object runs its <b>own</b> version of the method. This is called <b>polymorphism</b> ("many shapes").</p><p>Interfaces can promise properties too, like <code>string Name { get; }</code>.</p>',
          code: 'List<IShape> shapes = new List<IShape> { new Square(3), new Circle(2) };\nforeach (IShape s in shapes)\n{\n    Console.WriteLine(s.Name + ": " + s.Area());\n}\n\ninterface IShape\n{\n    string Name { get; }\n    double Area();\n}\n\nclass Square : IShape\n{\n    private double side;\n    public Square(double side) { this.side = side; }\n    public string Name => "Square";\n    public double Area() => side * side;\n}\n\nclass Circle : IShape\n{\n    private double radius;\n    public Circle(double radius) { this.radius = radius; }\n    public string Name => "Circle";\n    public double Area() => 3.14 * radius * radius;\n}' },
        { title: 'Inheritance: virtual and override',
          body: '<p>A class can also <b>inherit</b> from another class with the same <code>:</code> sign. The child gets all the parent\'s members. A <code>virtual</code> method may be replaced in the child with <code>override</code>.</p><p><code>: base(name)</code> runs the parent\'s constructor, and <code>base.Describe()</code> calls the parent\'s version of a method.</p>',
          code: 'Animal a = new Cat("Tom");\nConsole.WriteLine(a.Describe());\n\nclass Animal\n{\n    public string Name { get; }\n\n    public Animal(string name)\n    {\n        Name = name;\n    }\n\n    public virtual string Describe()\n    {\n        return Name + " is an animal";\n    }\n}\n\nclass Cat : Animal\n{\n    public Cat(string name) : base(name) { }\n\n    public override string Describe()\n    {\n        return base.Describe() + " that purrs";\n    }\n}' },
        { title: 'abstract: a blueprint with gaps',
          body: '<p>An <code>abstract</code> class is somewhere between an interface and a normal class. It can have real code, but also <code>abstract</code> methods with no body. Every child class <b>must</b> override those, and you can\'t create the abstract class itself with <code>new</code>.</p>' + cheat([[k('interface IX { void Do(); }'), 'only a promise, no code'], [k('class A : IX'), 'A keeps the promise'], [k('virtual') + ' / ' + k('override'), 'a child may replace a method'], [k('abstract'), 'a child must fill the gap'], [k(': base(...)') + ', ' + k('base.M()'), 'use the parent\'s version']]),
          code: 'List<Tool> tools = new List<Tool> { new Hammer(), new Saw() };\nforeach (Tool t in tools)\n{\n    Console.WriteLine(t.Use());\n}\n\nabstract class Tool\n{\n    public abstract string Sound();\n    public string Use() => "The tool goes " + Sound();\n}\n\nclass Hammer : Tool\n{\n    public override string Sound() => "bang";\n}\n\nclass Saw : Tool\n{\n    public override string Sound() => "zzzt";\n}' },
      ],
      signs: [
        'Interfaces start with a capital I, like IShape or IGlow. A class keeps the promise with class Square : IShape',
        'Remember: a method that keeps an interface promise must be public.',
        'The choir is in tune again! Only the summit remains, where the Null Wraith is waiting.',
      ],
      terminals: ['cs2_iface1', 'cs2_iface2', 'cs2_iface3', 'cs2_iface4', 'cs2_iface5'],
      map: (B) => {
        const m = B.MapBuilder(126, 17);
        m.fill(0, 15, 125, 16, '#');
        m.put(2, 14, 'P'); m.put(5, 14, '?');
        let x = B.room(m, 7, 1, 'spring', 'A');
        m.put(x + 2, 14, 'e');
        x = B.TR.pit(m, x + 4);
        x = B.room(m, x + 1, 2, 'climb', 'B');
        x = B.TR.mover(m, x + 1);
        m.put(x + 1, 14, '?');
        x = B.room(m, x + 3, 3, 'lava', 'C');
        m.put(x + 1, 14, 'K');
        x = B.TR.tower(m, x + 3); m.put(x - 4, 9, 'w');
        x = B.room(m, x, 4, 'wall', 'D');
        x = B.TR.hills(m, x);
        m.put(x + 1, 14, 'e');
        x = B.room(m, x + 3, 5, 'bridge', 'E');
        m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
    {
      id: 'cs2_exc',
      name: 'The Shattered Summit',
      topic: 'Exceptions',
      blurb: 'Face the Null Wraith: try, catch, finally, throw and your own exceptions, plus everything else from the Spire.',
      intro: '<p>At the top of the Spire, the air crackles. This is the lair of the <b>Null Wraith</b>, and its weapon is the <b>unhandled exception</b>: one bad value, and an entire program crashes.</p><p>But C# gives you a shield. Code that might fail goes in a <code>try</code> block, and a <code>catch</code> block decides what to do when it does:</p>' + pre('try\n{\n    int n = int.Parse("oops");\n}\ncatch (FormatException)\n{\n    Console.WriteLine("Not a number!");\n}') + '<p>Learn to catch, throw and even invent exceptions. Then combine everything you learned in the Spire to restore its heart.</p>',
      tutorial: [
        { title: 'When things go wrong',
          body: '<p>Some operations can fail while the program runs: turning text that isn\'t a number into an <code>int</code>, dividing by zero, using a list index that doesn\'t exist... C# then <b>throws an exception</b>. If nothing catches it, the program crashes and the rest never runs.</p><p>Run this and look at the error: it is a <code>FormatException</code>.</p>',
          code: 'Console.WriteLine("Reading the rune...");\nint power = int.Parse("ninety");\nConsole.WriteLine("Power: " + power);',
          expectError: true },
        { title: 'try and catch',
          body: '<p>Put risky code in a <code>try { }</code> block. If an exception is thrown, C# jumps straight to the matching <code>catch</code> block, and the program carries on after it.</p><p>Write a name after the type, like <code>e</code>, to use the exception. <code>e.Message</code> describes what went wrong.</p>',
          code: 'try\n{\n    int power = int.Parse("ninety");\n    Console.WriteLine("Power: " + power);\n}\ncatch (FormatException e)\n{\n    Console.WriteLine("Caught it: " + e.Message);\n}\nConsole.WriteLine("Still running!");' },
        { title: 'The right catch for the job',
          body: '<p>There are many kinds of exception, and one <code>try</code> can have several <code>catch</code> blocks. C# picks the <b>first</b> that matches, so put the specific kinds first. <code>catch (Exception)</code> matches <b>everything</b>, so it goes last, if you use it at all.</p>' + cheat([[k('FormatException'), 'int.Parse got text that isn\'t a number'], [k('DivideByZeroException'), 'a whole number divided by 0'], [k('ArgumentOutOfRangeException'), 'a list index that doesn\'t exist'], [k('KeyNotFoundException'), 'a dictionary key that doesn\'t exist'], [k('Exception'), 'any exception at all']]),
          code: 'List<int> nums = new List<int> { 10, 0 };\nforeach (int i in new List<int> { 0, 1, 5 })\n{\n    try\n    {\n        Console.WriteLine(100 / nums[i]);\n    }\n    catch (DivideByZeroException)\n    {\n        Console.WriteLine("Can\'t divide by zero");\n    }\n    catch (ArgumentOutOfRangeException)\n    {\n        Console.WriteLine("There is no item " + i);\n    }\n}' },
        { title: 'finally always runs',
          body: '<p>A <code>finally</code> block runs <b>whatever happens</b>: after the <code>try</code> finished normally, or after a <code>catch</code> handled a problem. It is the place for clean-up, such as closing a door you opened.</p>',
          code: 'foreach (string s in new List<string> { "5", "five" })\n{\n    try\n    {\n        Console.WriteLine("Got " + int.Parse(s));\n    }\n    catch (FormatException)\n    {\n        Console.WriteLine("Bad input: " + s);\n    }\n    finally\n    {\n        Console.WriteLine("Done with " + s);\n    }\n}' },
        { title: 'Throwing your own',
          body: '<p>You can <b>throw</b> an exception yourself with <code>throw new ...</code> when your code is asked to do something impossible. <code>ArgumentException</code> means "you gave me a bad value". Whoever called your code can then catch it.</p><p>A property setter or a method can throw, and the bad value is never stored.</p>',
          code: 'void Jump(int height)\n{\n    if (height > 10)\n    {\n        throw new ArgumentException("Nobody can jump that high");\n    }\n    Console.WriteLine("Jumped " + height);\n}\n\ntry\n{\n    Jump(3);\n    Jump(50);\n    Jump(4);\n}\ncatch (ArgumentException e)\n{\n    Console.WriteLine("Error: " + e.Message);\n}' },
        { title: 'Custom exceptions',
          body: '<p>For problems that belong to your own program, make your own exception class by inheriting from <code>Exception</code>. Pass the message on with <code>: base(message)</code>, and add properties for extra details. Catch it by its own name.</p>',
          code: 'try\n{\n    throw new TooHeavyException(12);\n}\ncatch (TooHeavyException e)\n{\n    Console.WriteLine(e.Message);\n    Console.WriteLine("Extra weight: " + e.Extra);\n}\n\nclass TooHeavyException : Exception\n{\n    public int Extra { get; }\n\n    public TooHeavyException(int extra) : base("The bridge can\'t hold that")\n    {\n        Extra = extra;\n    }\n}' },
      ],
      signs: [
        'The Null Wraith throws exceptions. Catch them with try and catch, and the Spire stays standing.',
        'A finally block runs every time, exception or not. And remember: you can throw exceptions too!',
        'The Wraith is gone and the Spire shines. You have mastered C#\'s properties, LINQ, interfaces and exceptions. Step into the portal, Coder!',
      ],
      terminals: ['cs2_exc1', 'cs2_exc2', 'cs2_exc3', 'cs2_exc4', 'cs2_exc5', 'cs2_exc6'],
      map: (B) => {
        const m = B.MapBuilder(160, 17);
        m.fill(0, 15, 159, 16, '#');
        m.put(2, 14, 'P'); m.put(4, 14, '?');
        let x = B.room(m, 6, 1, 'bridge', 'A');
        x = B.TR.hills(m, x);
        m.put(x + 1, 14, 'e');
        x = B.room(m, x + 3, 2, 'wall', 'B');
        x = B.TR.mover(m, x + 1);
        x = B.room(m, x + 1, 3, 'climb', 'C');
        m.put(x + 3, 14, '?');
        x = B.TR.pit(m, x + 7);
        x = B.room(m, x + 1, 4, 'spikes', 'D');
        m.put(x + 1, 14, 'K');
        x = B.TR.tower(m, x + 3); m.put(x - 4, 9, 'w');
        x = B.room(m, x, 5, 'lava', 'E');
        m.put(x + 2, 14, 'e');
        x = B.TR.hills(m, x + 4);
        x = B.room(m, x, 6, 'spring', 'G');
        x = B.TR.pit(m, x + 1);
        m.put(x + 1, 14, '?'); m.put(x + 6, 14, 'F');
        return m;
      },
    },
  ];

  GD.addChapter2('csharp', {
    title: 'The Crystal Spire',
    blurb: 'A tower of living crystal rises over Syntaxia. Learn properties, LINQ, interfaces and exceptions to drive out the Null Wraith.',
    outro: '<p>The Null Wraith is gone and the Spire is lit again. Properties, LINQ, interfaces and exceptions are what most C# programs (and Unity games) lean on.</p>',
    theme: 'crystal',
    challenges,
    levels,
  });
})(typeof window !== 'undefined' ? window : globalThis);
