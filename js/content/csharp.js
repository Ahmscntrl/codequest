/* CodeQuest — C# content: level intros, tutorials, terminal descriptions, starters, hints,
 * "similar problem" examples and glitch snippets. C# runs on js/clike.js (dialect 'csharp').
 * Programs use top-level statements; classes go after the statements, as real C# requires.
 */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const c = (s) => `<code>${esc(s)}</code>`;
  const pre = (s) => `<pre>${esc(s)}</pre>`;
  const page = (title, body, code, opt) => Object.assign({ title, body, code: code === undefined ? null : code }, opt || {});
  const cheat = (rows) => '<table class="cheat">' + rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('') + '</table>';

  // ================================================================ level intros (story page)
  const intro = {
    hello: '<p>Welcome to <b>Syntaxia</b>, a world built from code, and slowly being eaten by <b>bugs</b>.</p><p>You are a Coder. In this world, you change things by writing <b>scripts</b>. You will write them in <b>C#</b> (say "C sharp"), the language behind many apps and Unity games.</p><p>Every programmer\'s journey starts with the same two words...</p>',
    vars: '<p>A <b>variable</b> is a named box that holds a value. In C# you say what <b>type</b> of value goes in the box:</p>' + pre('int planks = 7;\nstring name = "Ada";') + '<p>In Syntaxia, objects you pick up become variables you can use in your code! Collect the glowing boxes.</p>',
    ifs: '<p>Code can make <b>decisions</b> with <code>if</code>:</p>' + pre('if (hp < 3)\n{\n    Console.WriteLine("Heal!");\n}\nelse if (hp == 3)\n{\n    Console.WriteLine("Okay");\n}\nelse\n{\n    Console.WriteLine("Strong!");\n}') + '<p>The condition goes in <b>( brackets )</b> and the code that belongs to it goes between <b>{ curly braces }</b>.</p><p><b>Bugs</b> live here. Jump on them to squash them. If one bites you, it puts an <b>error in your code</b>!</p>',
    loops: '<p>A <b>loop</b> repeats code so you don\'t have to:</p>' + pre('for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine(i);   // 0, 1, 2\n}') + '<p>That little <b>i</b> is the loop\'s counter... Legend says a tiny creature named <b>i</b> lives in these caves. Maybe you\'ll find them!</p>',
    funcs: '<p>A <b>function</b> is a named recipe. Write it once, use it as often as you like. In C# the function\'s name starts with a capital letter, and the word in front says what kind of answer it gives back:</p>' + pre('int Square(int x)\n{\n    return x * x;\n}\n\nConsole.WriteLine(Square(4));   // 16') + '<p><code>return</code> sends the answer back to whoever called the function.</p>',
    classes: '<p>A <b>class</b> is a blueprint for making objects. Each object gets its own data (<b>fields</b>) and abilities (<b>methods</b>):</p>' + pre('Dog rex = new Dog("Rex");\nConsole.WriteLine(rex.Speak());\n\nclass Dog\n{\n    public string Name;\n\n    public Dog(string name)\n    {\n        Name = name;\n    }\n\n    public string Speak()\n    {\n        return "Woof!";\n    }\n}') + '<p>Your statements come first and the class goes at the bottom. Forge a <b>weapon</b> or adopt a <b>pet</b>, or both! Master classes and you\'ll unlock <b>skill points</b> and the <b>open world</b>.</p>',
    world: '<p>You\'ve mastered the basics. Now Syntaxia is yours to explore!</p><ul><li>Find the <b>3 Core terminals</b> to open the gate to the Bug King\'s lair.</li><li>Earn <b>skill points</b> from cores, side quests and squashing bugs (1 SP per 3 bugs).</li><li>Spend them at the <b>Skill Shrine</b> (or press K).</li></ul><p>Out here you will meet C# <b>lists</b> (<code>List&lt;T&gt;</code>), <b>dictionaries</b> and <b>string methods</b>.</p>',
    boss: '<p>The source of all the bugs. <b>Segfault</b> has corrupted the core of Syntaxia.</p><p>Use the <b>Compiler Cannon</b> terminal to blast it with loops. Hit it with your weapon when it swoops low. Jump on its head if you dare.</p><p>It will throw <b>errors</b> at you and corrupt your code. Stay calm and debug!</p>',
  };

  // ================================================================ tutorials (pages after the story)
  const tutorials = {
    // ------------------------------------------------------------ 1. Console.WriteLine
    hello: [
      page('Your first command: Console.WriteLine',
        '<p><code>Console.WriteLine(...)</code> makes the computer <b>show</b> something on the screen (the "console"). Whatever you put inside the brackets appears in the output.</p><p>Every instruction in C# ends with a <b>semicolon</b> <code>;</code>, like a full stop at the end of a sentence. Capital letters matter too: <code>Console</code> and <code>WriteLine</code> start with capitals.</p><p>Press <b>Run</b>. Then change the words and run it again. This box is yours to play with.</p>',
        'Console.WriteLine("Hi there!");'),
      page('Text needs quotes',
        '<p>Text (programmers call it a <b>string</b>) must be wrapped in double quotes <code>"like this"</code>. Without quotes the computer thinks the words are names of things, and gets confused.</p><p>Run this. The second line causes an <b>error</b>. Fix it by adding quotes, then run again.</p>',
        'Console.WriteLine("I am text");\nConsole.WriteLine(I am not text);', { expectError: true }),
      page('Don\'t forget the ;',
        '<p>Forgetting the semicolon is the most common C# mistake of all. The computer tells you exactly where it expected one: <b>; expected</b>.</p><p>Run this, read the error, then add the missing <code>;</code> at the end of the first line.</p>',
        'Console.WriteLine("Line one")\nConsole.WriteLine("Line two");', { expectError: true }),
      page('Top to bottom',
        '<p>Code runs <b>one line at a time, from top to bottom</b>. Every <code>Console.WriteLine</code> starts a new line of output.</p><p>Try swapping two lines and see how the output changes.</p>',
        'Console.WriteLine("1. Wake up");\nConsole.WriteLine("2. Write code");\nConsole.WriteLine("3. Save the world");'),
      page('Gluing text with +',
        '<p>The <code>+</code> sign <b>glues</b> pieces of text together. It doesn\'t add spaces for you. If you want a space, put it inside the quotes.</p>',
        'Console.WriteLine("Code" + "Quest");\nConsole.WriteLine("Code " + "Quest");\nConsole.WriteLine("Ha" + "Ha" + "Ha");'),
      page('Numbers and maths',
        '<p>Numbers <b>don\'t</b> use quotes. Without quotes, the computer does the maths for you:</p><ul><li><code>+</code> add &nbsp; <code>-</code> subtract</li><li><code>*</code> multiply &nbsp; <code>/</code> divide</li></ul><p>Careful: dividing two <b>whole numbers</b> gives a whole number in C#, so <code>9 / 2</code> is <b>4</b> (the leftover is dropped). Write <code>9.0 / 2</code> to get 4.5.</p><p>The last line has quotes, so <code>"2 + 3"</code> is just text and is shown as-is.</p>',
        'Console.WriteLine(2 + 3);\nConsole.WriteLine(10 - 4);\nConsole.WriteLine(6 * 7);\nConsole.WriteLine(9 / 2);\nConsole.WriteLine(9.0 / 2);\nConsole.WriteLine("2 + 3");'),
      page('Brackets go first',
        '<p>Like in maths class, <code>*</code> and <code>/</code> happen <b>before</b> <code>+</code> and <code>-</code>. Brackets <code>( )</code> happen before everything.</p><p>Same numbers, different answers:</p>',
        'Console.WriteLine(2 + 3 * 4);\nConsole.WriteLine((2 + 3) * 4);'),
      page('Text and numbers on one line',
        '<p><code>Console.WriteLine</code> shows <b>one</b> value. To show text and a number together, glue them with <code>+</code>: the number is turned into text for you. The maths on the right of <code>+</code> still happens first, because <code>*</code> comes before <code>+</code>.</p><p>There is also a handy shortcut, the <b>interpolated string</b>: put a <code>$</code> before the quotes and drop values into <code>{curly brackets}</code>.</p>',
        'Console.WriteLine("Level " + 1);\nConsole.WriteLine("Gems: " + 3 * 4);\nConsole.WriteLine($"I am {6 + 6} years old");'),
      page('Cheat sheet',
        cheat([
          [c('Console.WriteLine("Hi");'), 'show text'],
          [c('"text"'), 'text needs double quotes'],
          [c(';'), 'every instruction ends with one'],
          [c('"a" + "b"'), 'glue text, gives ' + c('ab')],
          [c('2 + 3 * 4'), 'maths (no quotes) gives 14'],
          [c('(2 + 3) * 4'), 'brackets first gives 20'],
          [c('"Lv " + 1'), 'text and a number: ' + c('Lv 1')],
          [c('$"Lv {1 + 1}"'), 'interpolated string: ' + c('Lv 2')],
        ]) + '<p>Each terminal in this level practises one of these. You can reopen this tutorial any time with the <b>Tutorial</b> button.</p>'),
    ],
    // ------------------------------------------------------------ 2. variables
    vars: [
      page('Making a variable',
        '<p>A <b>variable</b> is a labelled box that stores a value so you can use it later.</p><p>In C# you write the <b>type</b> of the box first, then its name, then <code>=</code> and the value. Here <code>string</code> means "this box holds text".</p><p>The <code>=</code> sign means <b>"store this in the box"</b>. It\'s not the maths "equals".</p>',
        'string name = "Ada";\nConsole.WriteLine(name);'),
      page('The name vs. the text',
        '<p>Without quotes, <code>color</code> means <b>"look inside the box called color"</b>. With quotes, <code>"color"</code> is just the word itself.</p><p>Run it and compare the two lines.</p>',
        'string color = "red";\nConsole.WriteLine(color);\nConsole.WriteLine("color");'),
      page('Kinds of values',
        '<p>Boxes hold different <b>types</b> of value:</p><ul><li><code>string</code>: text, in quotes, like <code>"Ada"</code></li><li><code>int</code>: a whole number, like <code>5</code></li><li><code>double</code>: a number with a decimal point, like <code>2.5</code></li><li><code>bool</code>: a yes/no value, <code>true</code> or <code>false</code> (lowercase in your code, but C# prints them as <b>True</b> and <b>False</b>)</li></ul><p>If you don\'t want to write the type, <code>var</code> lets C# work it out from the value.</p>',
        'string name = "Ada";\nint level = 5;\ndouble speed = 2.5;\nbool alive = true;\nvar coins = 10;   // C# works out that this is an int\nConsole.WriteLine(name);\nConsole.WriteLine(level);\nConsole.WriteLine(speed);\nConsole.WriteLine(alive);\nConsole.WriteLine(coins);'),
      page('A box keeps its type',
        '<p>Once a box is made for one type, it only takes that type. An <code>int</code> box can\'t hold text, even text that looks like a number such as <code>"6"</code>.</p><p>Run it to see the error, then fix it by storing the number <code>6</code> (no quotes).</p>',
        'int level = 5;\nlevel = "6";\nConsole.WriteLine(level);', { expectError: true }),
      page('Maths with variables',
        '<p>You can do maths with the values inside boxes, and store the answer in a <b>new</b> box.</p><p>Change <code>width</code> and run again: the area updates automatically. That\'s the power of variables!</p>',
        'int width = 4;\nint height = 3;\nint area = width * height;\nConsole.WriteLine(area);'),
      page('Changing a variable',
        '<p>A box can get a <b>new value</b>. This line reads the old score, adds 5, and stores the result back in the same box:</p>' + pre('score = score + 5;') + '<p>The shortcut <code>score += 5;</code> does exactly the same thing. <b>Only write the type the first time</b>: after that, the box already exists.</p>',
        'int score = 10;\nConsole.WriteLine(score);\nscore = score + 5;\nConsole.WriteLine(score);\nscore += 1;\nConsole.WriteLine(score);'),
      page('Mixing text and numbers',
        '<p>In C#, <code>+</code> with text and a number glues them together. The <b>interpolated string</b> is often easier to read: put <code>$</code> before the quotes and the variable in <code>{curly brackets}</code>.</p>',
        'int coins = 7;\nstring hero = "Ada";\nConsole.WriteLine("Coins: " + coins);\nConsole.WriteLine($"{hero} has {coins} coins");'),
      page('Objects become variables',
        '<p>In Syntaxia, glowing boxes you walk into become <b>variables</b> you can use in any terminal, without declaring them yourself. They appear in the <b>Variables</b> panel in the top-right corner, showing their name and what\'s inside.</p>'),
      page('Cheat sheet',
        cheat([
          [c('int x = 5;'), 'make a variable (type, name, value)'],
          [c('string s = "hi";'), 'a text variable'],
          [c('Console.WriteLine(x);'), 'show what\'s inside'],
          [c('"x"') + ' vs ' + c('x'), 'the word vs. the box'],
          [c('string') + ' / ' + c('int') + ' / ' + c('double') + ' / ' + c('bool'), 'text / whole number / decimal / true-false'],
          [c('var x = 5;'), 'let C# work out the type'],
          [c('x = x + 1;') + ', ' + c('x += 1;'), 'change a variable (no type this time)'],
          [c('$"Hi {name}"') + ' or ' + c('"Hi " + name'), 'text + values'],
        ])),
    ],
    // ------------------------------------------------------------ 3. conditions
    ifs: [
      page('Asking yes/no questions',
        '<p>A <b>comparison</b> asks a question and the answer is a <code>bool</code>: <b>True</b> or <b>False</b>.</p><ul><li><code>&gt;</code> greater than, <code>&lt;</code> less than</li><li><code>&gt;=</code> at least, <code>&lt;=</code> at most</li><li><code>==</code> equal to, <code>!=</code> not equal to</li></ul>',
        'int hp = 40;\nConsole.WriteLine(hp > 50);\nConsole.WriteLine(hp < 50);\nConsole.WriteLine(hp == 40);\nConsole.WriteLine(hp != 40);'),
      page('= stores, == compares',
        '<p>This trips up everyone at first:</p><ul><li><code>=</code> (one) <b>stores</b> a value in a variable</li><li><code>==</code> (two) <b>asks</b> "are these equal?"</li></ul>',
        'int x = 5;                  // store 5 in x\nConsole.WriteLine(x == 5);  // is x equal to 5?\nConsole.WriteLine(x == 9);  // is x equal to 9?'),
      page('if: do something only sometimes',
        '<p><code>if</code> runs code <b>only when</b> the condition is true. The condition goes in <b>( brackets )</b> and the code inside goes between <b>{ curly braces }</b>. There is no semicolon after the <code>if (...)</code> line.</p><p>Run it, then change <code>hp</code> to 50 and run again. The warning disappears, but "Done checking" always prints.</p>',
        'int hp = 20;\nif (hp < 30)\n{\n    Console.WriteLine("Low health!");\n}\nConsole.WriteLine("Done checking");'),
      page('else: otherwise...',
        '<p><code>else</code> is the plan B: it runs when the condition is <b>false</b>. Exactly one of the two blocks runs, never both.</p>',
        'string door = "locked";\nif (door == "open")\n{\n    Console.WriteLine("Walk in");\n}\nelse\n{\n    Console.WriteLine("Find a key");\n}'),
      page('Many choices: else if',
        '<p>Chain more checks with <code>else if</code>. They are checked <b>top to bottom</b> and only the <b>first</b> true one runs. <code>else</code> catches everything left over.</p><p>Try temp = 35, 15 and -5.</p>',
        'int temp = 15;\nif (temp > 30)\n{\n    Console.WriteLine("Hot");\n}\nelse if (temp > 10)\n{\n    Console.WriteLine("Warm");\n}\nelse\n{\n    Console.WriteLine("Cold");\n}'),
      page('The remainder: %',
        '<p><code>%</code> gives the <b>remainder</b> after dividing. <code>7 % 2</code> is 1 (7 = 2+2+2, with 1 left over).</p><p>If <code>n % 2</code> is 0, nothing is left over, so <code>n</code> is <b>even</b>.</p>',
        'Console.WriteLine(7 % 2);\nConsole.WriteLine(8 % 2);\nint n = 10;\nif (n % 2 == 0)\n{\n    Console.WriteLine(n + " is even");\n}'),
      page('Combining: &&, ||, !',
        '<ul><li><code>&amp;&amp;</code> means <b>and</b>: true only if <b>both</b> sides are true</li><li><code>||</code> means <b>or</b>: true if <b>at least one</b> side is true</li><li><code>!</code> means <b>not</b>: it flips true and false</li></ul><p>Each side must be a full comparison: write <code>w == "rain" || w == "snow"</code>, not <code>w == "rain" || "snow"</code>.</p>',
        'int age = 14;\nbool ticket = true;\nConsole.WriteLine(age >= 12 && ticket);\nConsole.WriteLine(age < 5 || ticket);\nConsole.WriteLine(!ticket);'),
      page('Cheat sheet',
        cheat([
          [c('> < >= <= == !='), 'comparisons give True/False'],
          [c('if (...) { }'), 'run code only when true'],
          [c('else if (...) { }') + ' / ' + c('else { }'), 'more choices / otherwise'],
          [c('n % 2 == 0'), 'is n even?'],
          [c('&&') + ' ' + c('||') + ' ' + c('!'), 'and, or, not'],
        ]) + '<p>Remember: condition in <code>( )</code>, code inside <code>{ }</code>, and <code>==</code> to compare.</p>'),
    ],
    // ------------------------------------------------------------ 4. loops
    loops: [
      page('Repeating code',
        '<p>A <b>for loop</b> repeats the code inside its <code>{ }</code>. This one runs 3 times:</p><p>Change the 3 to 10 and run it again. One small change, ten times the work!</p>',
        'for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine("Hello!");\n}'),
      page('Meet i, the counter',
        '<p><code>for (int i = 0; i &lt; 5; i++)</code> has three parts, separated by semicolons:</p><ul><li><b>start</b>: <code>int i = 0</code> makes the counter</li><li><b>keep going while</b>: <code>i &lt; 5</code></li><li><b>after each loop</b>: <code>i++</code> adds 1 to i</li></ul><p>So i is <b>0, 1, 2, 3, 4</b>. Start at 1 and use <code>&lt;=</code> to include the end number.</p>',
        'for (int i = 0; i < 5; i++)\n{\n    Console.WriteLine("i is " + i);\n}\n\nfor (int i = 1; i <= 3; i++)\n{\n    Console.WriteLine("from 1: " + i);\n}'),
      page('Counting down',
        '<p>To count backwards, start high, keep going while <code>i &gt;= 1</code>, and use <code>i--</code> to subtract 1 each time.</p>',
        'for (int i = 5; i >= 1; i--)\n{\n    Console.WriteLine(i);\n}\nConsole.WriteLine("Blast off!");'),
      page('Looping through a list: foreach',
        '<p>A <code>List&lt;string&gt;</code> holds many strings in order. <code>foreach</code> visits every item: each time around, the loop variable holds the next item.</p><p>Read it as: "for each <b>string</b> called <b>snack</b> in <b>snacks</b>".</p>',
        'List<string> snacks = new List<string> { "apple", "cake", "pie" };\nforeach (string snack in snacks)\n{\n    Console.WriteLine("I ate the " + snack);\n}'),
      page('while: repeat until...',
        '<p>A <b>while loop</b> repeats <b>as long as</b> its condition is true. Use it when you don\'t know in advance how many times you need.</p><p>Something inside the loop must eventually make the condition false, otherwise it runs <b>forever</b> (an infinite loop). Here, <code>fuel -= 1;</code> does that.</p>',
        'int fuel = 3;\nwhile (fuel > 0)\n{\n    Console.WriteLine("Flying! fuel = " + fuel);\n    fuel -= 1;\n}\nConsole.WriteLine("Landed");'),
      page('Building up a total',
        '<p>A very common pattern: make a variable starting at 0 <b>before</b> the loop, add to it <b>inside</b> the loop, and use it <b>after</b>.</p>',
        'int total = 0;\nfor (int i = 1; i <= 3; i++)\n{\n    total += i;\n    Console.WriteLine($"added {i}, total is {total}");\n}\nConsole.WriteLine("Final: " + total);'),
      page('break: stop early',
        '<p><code>break;</code> jumps straight <b>out</b> of the loop, even if there are items left. Perfect for "stop when you find it".</p>',
        'for (int n = 1; n < 100; n++)\n{\n    if (n == 4)\n    {\n        Console.WriteLine("Found 4! Stopping.");\n        break;\n    }\n    Console.WriteLine(n);\n}'),
      page('Cheat sheet',
        cheat([
          [c('for (int i = 0; i < 3; i++)'), 'repeat 3 times (i = 0, 1, 2)'],
          [c('for (int i = 1; i <= 10; i++)'), '1 to 10'],
          [c('for (int i = 5; i >= 1; i--)'), '5 down to 1'],
          [c('foreach (string x in myList)'), 'each item in a list'],
          [c('while (cond) { }'), 'repeat while true'],
          [c('total += x;'), 'build up a total'],
          [c('break;'), 'leave the loop early'],
        ])),
    ],
    // ------------------------------------------------------------ 5. functions
    funcs: [
      page('Defining and calling',
        '<p>A <b>function</b> is a named recipe. In C# you write what it gives back (<code>void</code> means "nothing"), a name starting with a capital letter, brackets, and the code inside <code>{ }</code>.</p><p><b>Defining</b> it only writes the recipe down. Nothing happens until you <b>call</b> it by writing its name and <code>();</code>.</p>',
        'void Hello()\n{\n    Console.WriteLine("Hello!");\n}\n\nHello();\nHello();'),
      page('Parameters: giving it inputs',
        '<p>Names inside the brackets are <b>parameters</b>. Like any C# variable, each one has a type. When you call the function, the value you pass in gets stored in the parameter, a variable that only exists inside the function.</p>',
        'void Greet(string name)\n{\n    Console.WriteLine("Hi " + name);\n}\n\nGreet("Ada");\nGreet("Linus");'),
      page('return: sending an answer back',
        '<p><code>return</code> sends a value <b>back</b> to whoever called the function. The word in front of the name says what type comes back: here <code>int</code>.</p><p>Printing only <i>shows</i> a value; returning <i>hands it over</i> so you can store it or use it.</p><p>(The name is <code>DoubleIt</code> because <code>double</code> is already a C# word for decimal numbers.)</p>',
        'int DoubleIt(int n)\n{\n    return n * 2;\n}\n\nint result = DoubleIt(5);\nConsole.WriteLine(result);'),
      page('Using returned values',
        '<p>A function call that returns a value can go anywhere a value can go: inside maths, inside <code>Console.WriteLine</code>, even inside another call.</p>',
        'int DoubleIt(int n)\n{\n    return n * 2;\n}\n\nConsole.WriteLine(DoubleIt(3) + DoubleIt(4));\nConsole.WriteLine(DoubleIt(DoubleIt(2)));'),
      page('if inside functions',
        '<p>Functions can use everything you know. <code>return</code> also <b>ends</b> the function immediately, so after the first return, the rest is skipped.</p><p>C# checks that every path through the function returns something, so the last line needs a <code>return</code> too.</p>',
        'int Smaller(int a, int b)\n{\n    if (a < b)\n    {\n        return a;\n    }\n    return b;\n}\n\nConsole.WriteLine(Smaller(8, 3));\nConsole.WriteLine(Smaller(2, 9));'),
      page('Returning true or false',
        '<p>A comparison already <i>is</i> true or false, so a <code>bool</code> function can return it directly. Functions like this are great inside an <code>if</code>.</p>',
        'bool Positive(int n)\n{\n    return n > 0;\n}\n\nConsole.WriteLine(Positive(5));\nConsole.WriteLine(Positive(-2));\nif (Positive(3))\n{\n    Console.WriteLine("3 is positive");\n}'),
      page('Loops inside functions',
        '<p>Put a loop inside a function and you can reuse the whole loop with one call. Variables made inside a function stay inside it.</p>',
        'void CountUp(int n)\n{\n    for (int i = 1; i <= n; i++)\n    {\n        Console.WriteLine(i);\n    }\n}\n\nCountUp(3);\nConsole.WriteLine("again:");\nCountUp(2);'),
      page('Cheat sheet',
        cheat([
          [c('void Name() { }'), 'define a function that gives nothing back'],
          [c('Name();'), 'call it'],
          [c('void F(int a, string b)'), 'parameters (inputs), each with a type'],
          [c('int F(int n) { return n; }'), 'return an int (and stop)'],
          [c('bool / string / int'), 'the type of answer, written first'],
          [c('Console.WriteLine(F(2) + F(3));'), 'use returned values'],
        ])),
    ],
    // ------------------------------------------------------------ 6. classes
    classes: [
      page('Blueprints and objects',
        '<p>A <b>class</b> is a blueprint. <code>new</code> uses it to create an <b>object</b>. Objects carry their own data, called <b>fields</b>, which you read with a dot: <code>myDog.Name</code>.</p><p><code>public</code> means code outside the class may use the field. In C# your statements come first and the class goes <b>at the bottom</b> of the file.</p>',
        'Dog myDog = new Dog();\nConsole.WriteLine(myDog.Name);\n\nclass Dog\n{\n    public string Name = "Rex";\n}'),
      page('Constructors: giving each object its own values',
        '<p>A <b>constructor</b> is a special method with the <b>same name as the class</b> and no return type. It runs automatically when <code>new</code> creates an object. Give it parameters, and every object can start with <b>different</b> values. One blueprint, many objects!</p>',
        'Dog a = new Dog("Rex");\nDog b = new Dog("Bella");\nConsole.WriteLine(a.Name + " and " + b.Name);\n\nclass Dog\n{\n    public string Name;\n\n    public Dog(string name)\n    {\n        Name = name;\n    }\n}'),
      page('Methods: things objects can do',
        '<p>A <b>method</b> is a function that belongs to a class. Inside it you can use the object\'s own fields by name (or write <code>this.Name</code>, where <code>this</code> means "this object"). Call it with a dot and brackets.</p>',
        'Dog rex = new Dog("Rex");\nConsole.WriteLine(rex.Speak());\n\nclass Dog\n{\n    public string Name;\n\n    public Dog(string name)\n    {\n        Name = name;\n    }\n\n    public string Speak()\n    {\n        return Name + " says woof!";\n    }\n}'),
      page('Methods that change things',
        '<p>Methods can <b>update</b> fields. The object remembers the new value. A method that gives nothing back is <code>void</code>.</p>',
        'Counter c = new Counter();\nc.Click();\nc.Click();\nConsole.WriteLine(c.Count);\n\nclass Counter\n{\n    public int Count = 0;\n\n    public void Click()\n    {\n        Count += 1;\n    }\n}'),
      page('Properties: { get; set; }',
        '<p>C# programmers often use <b>properties</b> instead of plain fields. <code>public string Name { get; set; }</code> works just like a field: you can read it (<b>get</b>) and change it (<b>set</b>) with a dot.</p>',
        'Hero h = new Hero("Ada");\nh.Level = 2;\nConsole.WriteLine($"{h.Name} is level {h.Level}");\n\nclass Hero\n{\n    public string Name { get; set; }\n    public int Level { get; set; }\n\n    public Hero(string name)\n    {\n        Name = name;\n        Level = 1;\n    }\n}'),
      page('Methods with inputs',
        '<p>Methods can take parameters too. Notice that each object keeps <b>its own</b> data: filling one tank doesn\'t change the other.</p>',
        'Tank big = new Tank();\nTank small = new Tank();\nbig.Fill(50);\nsmall.Fill(5);\nConsole.WriteLine(big.Water + " " + small.Water);\n\nclass Tank\n{\n    public int Water = 0;\n\n    public void Fill(int amount)\n    {\n        Water += amount;\n    }\n}'),
      page('Handing objects to functions',
        '<p>Objects can be passed into functions just like numbers or text. The parameter\'s type is the class name. The function can read the object\'s fields and call its methods. (That\'s how <code>Equip</code> and <code>Adopt</code> will work!)</p>',
        'void Introduce(Dog pet)\n{\n    Console.WriteLine("This is " + pet.Name);\n}\n\nIntroduce(new Dog("Rex"));\n\nclass Dog\n{\n    public string Name;\n\n    public Dog(string name)\n    {\n        Name = name;\n    }\n}'),
      page('Cheat sheet',
        cheat([
          [c('class Thing { }'), 'make a blueprint (at the bottom of the file)'],
          [c('public int X;'), 'a field'],
          [c('public int X { get; set; }'), 'a property'],
          [c('public Thing(int x) { X = x; }'), 'constructor: sets up a new object'],
          [c('Thing t = new Thing(5);'), 'create an object'],
          [c('t.X'), 'read a field'],
          [c('public void Act() { }') + ' / ' + c('t.Act();'), 'define / call a method'],
        ])),
    ],
    // ------------------------------------------------------------ 7. open world
    world: [
      page('Lists',
        '<p>A <b>list</b> keeps many values in order. In C# you say what type the items are: <code>List&lt;string&gt;</code> is a list of strings. Each item has a position number called an <b>index</b>, and indexes start at <b>0</b>!</p><p><code>.Count</code> tells you how many items there are, so the last item is at <code>Count - 1</code>.</p>',
        'List<string> items = new List<string> { "sword", "map", "apple" };\nConsole.WriteLine(items[0]);\nConsole.WriteLine(items[2]);\nConsole.WriteLine(items[items.Count - 1]);\nConsole.WriteLine(items.Count);'),
      page('Changing lists',
        '<p>Lists can grow and shrink. <code>.Add(x)</code> adds to the end, and <code>.Remove(x)</code> takes an item out.</p><p>Printing a list directly only shows its type, so use <code>string.Join(", ", items)</code> to see the items.</p>',
        'List<string> items = new List<string> { "sword" };\nitems.Add("shield");\nitems.Add("map");\nConsole.WriteLine(string.Join(", ", items));\nitems.Remove("sword");\nConsole.WriteLine(string.Join(", ", items) + " (" + items.Count + " items)");'),
      page('Text tools',
        '<p>Strings come with built-in tools (methods): <code>ToUpper()</code>, <code>ToLower()</code>, <code>Length</code> and more. You can pick out single letters by index, just like a list.</p><p>To reverse a string, turn it into an array of letters, reverse the array, and build a new string from it.</p>',
        'string word = "hello";\nConsole.WriteLine(word.ToUpper());\nConsole.WriteLine(word.Length);\nConsole.WriteLine(word[0]);\nchar[] letters = word.ToCharArray();\nArray.Reverse(letters);\nConsole.WriteLine(new string(letters));'),
      page('Dictionaries',
        '<p>A <b>dictionary</b> stores values by <b>name</b> (a key) instead of by position. <code>Dictionary&lt;string, int&gt;</code> has text keys and number values. Look things up with square brackets and the key.</p>',
        'Dictionary<string, int> prices = new Dictionary<string, int>\n{\n    { "potion", 5 },\n    { "map", 3 }\n};\nConsole.WriteLine(prices["potion"]);\nprices["key"] = 7;\nConsole.WriteLine(prices.Count);\nConsole.WriteLine(prices.ContainsKey("key"));'),
      page('Putting it together',
        '<p>Most real problems combine ideas: <b>loop</b> through a list, use an <b>if</b> to pick items, and build up a result.</p>',
        'List<int> nums = new List<int> { 3, 8, 1, 9 };\nList<int> big = new List<int>();\nforeach (int n in nums)\n{\n    if (n > 5)\n    {\n        big.Add(n);\n    }\n}\nConsole.WriteLine(string.Join(", ", big));'),
      page('Cheat sheet',
        cheat([
          [c('List<int> l = new List<int> { 1, 2 };'), 'make a list'],
          [c('l[0]') + ', ' + c('l[l.Count - 1]'), 'first item, last item'],
          [c('l.Count') + ', ' + c('l.Add(x)'), 'how many, add to the end'],
          [c('string.Join(", ", l)'), 'show all the items'],
          [c('s.ToUpper()') + ', ' + c('s.Length'), 'string tools'],
          [c('d["key"]'), 'look up a dictionary value'],
        ])),
    ],
    boss: [
      page('Your weapon: loops',
        '<p>The Compiler Cannon fires once each time you call <code>Fire();</code>, but only bursts from a <b>loop</b> get through Segfault\'s shield. Here\'s the idea with WriteLine:</p><p>If Segfault corrupts your code, read the error, find the line, fix it, just like the debugger.</p>',
        'for (int shot = 0; shot < 3; shot++)\n{\n    Console.WriteLine("Pew!");\n}'),
    ],
  };

  // ================================================================ terminals
  const sim = (task, code) => ({ task, code });
  const terminals = {
    // ------------------------------------------------------------ Level 1
    hello: {
      desc: `<p>This old gate only opens for programmers. Every programmer's first words are <b>"Hello, World"</b>.</p>
        <p>Use ${c('Console.WriteLine(...);')} to make the computer say it. Text goes in double quotes, and the line ends with a semicolon.</p>`,
      starter: '// Make the computer say hello!\n// Text goes inside quotes, like "this".\n\n',
      hints: ['In C# you show things with Console.WriteLine(...), with capital C and capital W and L.', 'Text has to go inside double quotes, and the line ends with ;'],
      similar: sim('Make the computer say "Good morning".', 'Console.WriteLine("Good morning");'),
    },
    lines: {
      desc: `<p>Every ${c('Console.WriteLine(...)')} puts its text on a <b>new line</b>. Computers run your code <b>from top to bottom</b>.</p>
        <p>Ring the bells in order. Print these three lines:</p><pre>Ready\nSet\nCode!</pre>`,
      starter: '// One Console.WriteLine per line. The first one is done for you:\nConsole.WriteLine("Ready");\n',
      hints: ['Each Console.WriteLine makes one line. You need one per line.', 'Lines come out in the same order as your code. Don\'t forget the semicolons.'],
      similar: sim('Print the words One, Two, Three on separate lines.', 'Console.WriteLine("One");\nConsole.WriteLine("Two");\nConsole.WriteLine("Three");'),
    },
    textjoin: {
      desc: `<p>The ${c('+')} sign <b>glues text together</b>. It doesn't add a space: you get exactly what you glue.</p>
        <p>The smith needs the name <b>SuperCoder</b>, made by joining the text ${c('"Super"')} and ${c('"Coder"')} with ${c('+')}.</p>`,
      starter: '// Glue two pieces of text with +\nConsole.WriteLine("Super");\n',
      hints: ['Put each piece in its own quotes, with + between them, all inside the brackets.', '+ adds no space. Check you don\'t have spaces inside the quotes.'],
      similar: sim('Print "Moonlight" by gluing "Moon" and "light".', 'Console.WriteLine("Moon" + "light");'),
    },
    math: {
      desc: `<p>Text needs quotes, but <b>numbers don't</b>. Without quotes, the computer does the maths for you:</p>
        ${pre('Console.WriteLine(2 + 3);     // shows 5\nConsole.WriteLine("2 + 3");   // shows the text 2 + 3')}
        <p>Make the computer calculate <b>7 &times; 6</b> and <b>100 &minus; 1</b>, printing each answer on its own line. (Use ${c('*')} to multiply and ${c('-')} to subtract. Don't type the answers yourself!)</p>`,
      starter: '// Maths works inside Console.WriteLine:\nConsole.WriteLine(2 + 3);\n',
      hints: ['Use * to multiply and - to subtract.', 'Don\'t put quotes around the maths, or it becomes text. One Console.WriteLine per answer.'],
      similar: sim('Print the answers to 8 x 5 and 50 - 8.', 'Console.WriteLine(8 * 5);\nConsole.WriteLine(50 - 8);'),
    },
    order: {
      desc: `<p>Just like in maths class, the computer does ${c('*')} and ${c('/')} <b>before</b> ${c('+')} and ${c('-')}. Brackets ${c('( )')} go first of all.</p>
        <p>Print the answer to <b>(10 + 5) &times; 2</b>, then on the next line the answer to <b>10 + 5 &times; 2</b>. Notice how different they are!</p>`,
      starter: '// Brackets are calculated first\n',
      hints: ['Brackets make the part inside happen first.', 'You need two Console.WriteLine lines: one with brackets, one without.'],
      similar: sim('Print (3 + 1) x 5 and then 3 + 1 x 5.', 'Console.WriteLine((3 + 1) * 5);\nConsole.WriteLine(3 + 1 * 5);'),
    },
    sep: {
      desc: `<p>${c('Console.WriteLine')} shows <b>one</b> value. To put text and a number on the same line, glue them with ${c('+')}. The number is turned into text for you:</p>
        ${pre('Console.WriteLine("Level " + 3);     // Level 3')}
        <p>The maths still happens first, because ${c('*')} comes before ${c('+')}. (Or use an interpolated string: ${c('$"Level {1 + 2}"')}.)</p>
        <p>Print <b>Score: 100</b> by joining the text ${c('"Score: "')} and the calculation ${c('25 * 4')}.</p>`,
      starter: '// Join text and a number with +\nConsole.WriteLine("Level " + 3);\n',
      hints: ['Put the text first, then +, then the calculation without quotes.', 'The space after the colon has to be inside the quotes.'],
      similar: sim('Print "Gems: 12" by joining "Gems: " and the calculation 3 * 4.', 'Console.WriteLine("Gems: " + 3 * 4);'),
    },
    // ------------------------------------------------------------ Level 2
    firstvar: {
      desc: `<p>A <b>variable</b> is a labelled box that stores a value. In C# you write the <b>type</b>, the name, an equals sign and the value:</p>
        ${pre('string color = "blue";')}
        <p>${c('string')} means the box holds text. Make a variable called ${c('color')} holding your favourite colour, then <b>print the variable</b>.</p>`,
      starter: '// type name = value;   (text values need quotes)\n',
      hints: ['A text variable is made with: string, then its name, then = and the value in quotes, then ;', 'To print a variable, write its name without quotes inside Console.WriteLine.'],
      similar: sim('Make a variable called food holding "pizza", then print it.', 'string food = "pizza";\nConsole.WriteLine(food);'),
    },
    types: {
      desc: `<p>Every C# variable has a <b>type</b> that says what it holds:</p>
        <ul><li>${c('string')}: text, in quotes, like ${c('"Ada"')}</li><li>${c('int')}: a whole number, no quotes, like ${c('7')}</li><li>${c('bool')}: ${c('true')} or ${c('false')}, all lowercase, no quotes</li></ul>
        <p>Make three variables: ${c('name')} holding <b>text</b>, ${c('level')} holding a <b>number</b>, and ${c('alive')} holding ${c('true')}.</p>`,
      starter: '// a string, an int and a bool\n',
      hints: ['Write the type first: string for text, int for a number, bool for true/false.', 'true is all lowercase and has no quotes.'],
      similar: sim('Make pet holding text, age holding a number, and hungry holding false.', 'string pet = "cat";\nint age = 3;\nbool hungry = false;\nConsole.WriteLine(pet + " " + age + " " + hungry);'),
    },
    bridge: {
      desc: `<p>You collected a variable! ${c('planks')} now holds the number <b>{planks}</b>.</p>
        <p>A variable is a <b>named box</b> that stores a value. Instead of typing the number, use the box's name.</p>
        <p>Call ${c('BuildBridge(planks);')} to build a bridge over the lava. Game functions in C# start with a capital letter.</p>`,
      starter: '// planks is a variable you collected.\n// Print it to peek inside:\nConsole.WriteLine(planks);\n\n// Now build the bridge with it!\n',
      hints: ['You collected a variable called planks. Pass it into the BuildBridge function.', 'Put the variable name (no quotes) inside the function\'s brackets, and end the line with ;'],
      similar: sim('You collected a variable called seeds. Show how many you are planting.', 'int seeds = 4;   // (pretend you collected this)\nConsole.WriteLine("Planting " + seeds + " seeds");'),
    },
    area: {
      desc: `<p>Variables can hold <b>numbers</b>, and you can do maths with them. You have ${c('width')} and ${c('height')} (both ${c('int')}). They're <b>different for every test</b>, so you can't just type the answer.</p>
        <p>Make a new ${c('int')} variable ${c('area')} that equals width times height, then print it.</p>`,
      starter: '// width and height change for each test!\nConsole.WriteLine(width);\nConsole.WriteLine(height);\n',
      hints: ['Make a new int variable and set it to width times height.', 'Print the new variable at the end.'],
      similar: sim('Given length and count, make total = length * count and print it.', 'int length = 6;\nint count = 2;\nint total = length * count;\nConsole.WriteLine(total);'),
    },
    update: {
      desc: `<p>Variables can <b>change</b>! You can give a variable a new value based on its old one:</p>
        ${pre('score = score + 5;    // or the shortcut:  score += 5;')}
        <p>You have a variable ${c('score')} (different each test). <b>Add 5 to it</b>, then print it. <i>score already exists, so don't write <code>int</code> in front of it.</i></p>`,
      starter: '// score already exists. Add 5 to it, then print it.\nConsole.WriteLine(score);\n',
      hints: ['Use the old value of score to make the new one. Don\'t write int: score already exists.', 'score += 5; is a shortcut for score = score + 5; and the print goes after the change.'],
      similar: sim('lives starts at 3. Take away 1, then print it.', 'int lives = 3;\nlives = lives - 1;\nConsole.WriteLine(lives);'),
    },
    combine: {
      desc: `<p>Let's build a sentence out of variables. The badge machine has ${c('hero')} (a string) and ${c('coins')} (an int), different for each test.</p>
        <p>Print a sentence like <b>Ada has 5 coins</b>.</p>
        <p>Tip: ${c('+')} glues text and numbers in C#, or use an interpolated string: ${c('$"{hero} has ..."')}.</p>`,
      starter: 'Console.WriteLine(hero);\nConsole.WriteLine(coins);\n',
      hints: ['Glue the pieces together: hero, then " has ", then coins, then " coins".', 'Watch the spaces inside your quotes. With $"..." the variables go in curly brackets.'],
      similar: sim('Given pet and age, print "Rex is 3 years old".', 'string pet = "Rex";\nint age = 3;\nConsole.WriteLine($"{pet} is {age} years old");'),
    },
    password: {
      desc: `<p>The lock needs the secret stored in your ${c('password')} variable.</p>
        <p>The password is different for every adventurer, so don't type it. <b>Print the variable</b>!</p>`,
      starter: '// Print the variable password (no quotes around a variable name!)\n',
      hints: ['"password" in quotes is just the word. Without quotes it\'s the variable.', 'Print the variable, not the word.'],
      similar: sim('Print the contents of a variable called secret.', 'string secret = "hidden treasure";\nConsole.WriteLine(secret);'),
    },
    // ------------------------------------------------------------ Level 3
    compare: {
      desc: `<p>A <b>comparison</b> asks a yes/no question. The answer is a ${c('bool')}, which C# prints as <b>True</b> or <b>False</b>.</p>
        ${pre('Console.WriteLine(5 > 3);   // True\nConsole.WriteLine(2 > 9);   // False')}
        <p>Comparisons: ${c('>')} ${c('<')} ${c('>=')} ${c('<=')} ${c('==')} ${c('!=')}</p>
        <p>Print whether ${c('hp')} is <b>greater than 50</b>. Tested with 3 values.</p>`,
      starter: '// Print the answer to: is hp greater than 50?\nConsole.WriteLine(hp);\n',
      hints: ['Put the comparison itself inside Console.WriteLine( ).', 'Greater than is >.'],
      similar: sim('Print whether gold is less than 10.', 'int gold = 4;\nConsole.WriteLine(gold < 10);'),
    },
    heal: {
      desc: `<p>${c('if')} runs code <b>only when</b> its condition is true:</p>
        ${pre('if (hp < 30)\n{\n    // runs only when hp is below 30\n}')}
        <p>If ${c('hp')} is <b>below 30</b>, call ${c('Heal();')}. Otherwise do nothing. Tested with 4 values.</p>`,
      starter: 'if (hp < 30)\n{\n    // what goes here?\n}\n',
      hints: ['Call the function only inside the if block, between the { }.', 'A call is the name, brackets and a semicolon.'],
      similar: sim('If fuel is below 20, print "Refuel!".', 'int fuel = 12;\nif (fuel < 20)\n{\n    Console.WriteLine("Refuel!");\n}'),
    },
    guard: {
      desc: `<p>The guard bot lets friends in and keeps bugs out. The variable ${c('visitor')} holds the name of whoever is at the gate, and ${c('myName')} holds <b>your</b> name.</p>
        <p>If the visitor is you, call ${c('OpenGate();')}. Otherwise call ${c('SoundAlarm();')}. Compare strings with ${c('==')}.</p>
        <p>The bot will test your code with <b>3 different visitors</b>.</p>`,
      starter: '// Compare with == (two equals signs)\nif (visitor == myName)\n{\n    // what should happen here?\n}\nelse\n{\n\n}\n',
      hints: ['The comparison is already written. Now fill in the two blocks.', 'One function goes in the if block, the other goes in the else block.'],
      similar: sim('If code equals "1234", print "Unlocked", otherwise print "Wrong code".', 'string code = "0000";\nif (code == "1234")\n{\n    Console.WriteLine("Unlocked");\n}\nelse\n{\n    Console.WriteLine("Wrong code");\n}'),
    },
    even: {
      desc: `<p>The ${c('%')} operator gives the <b>remainder</b> after dividing: ${c('7 % 2')} is <b>1</b>, ${c('8 % 2')} is <b>0</b>.</p>
        <p>A number is <b>even</b> when ${c('number % 2')} is 0. Print <b>even</b> or <b>odd</b> for ${c('number')}. Tested with 4 numbers.</p>`,
      starter: 'Console.WriteLine(number % 2);\n',
      hints: ['number % 2 is 0 for even numbers. Compare it with == 0.', 'Use if/else to choose which word to print.'],
      similar: sim('Print "fizz" if n can be divided by 3 with nothing left over, otherwise print "nope".', 'int n = 9;\nif (n % 3 == 0)\n{\n    Console.WriteLine("fizz");\n}\nelse\n{\n    Console.WriteLine("nope");\n}'),
    },
    pump: {
      desc: `<p>The lava pump reads ${c('temperature')} and must react:</p>
        <ul><li>above <b>100</b>: ${c('Cool();')}</li><li>below <b>0</b>: ${c('Heat();')}</li><li>anything else: ${c('Wait();')}</li></ul>
        <p>Use ${c('if')}, ${c('else if')} and ${c('else')}. It will be tested with 5 temperatures. Get it right and the lava turns to stone!</p>`,
      starter: 'if (temperature > 100)\n{\n    Cool();\n}\n// add an else if for below 0...\n// ...and an else for everything else\n',
      hints: ['There are three cases, so use if, else if and else, each with its own { }.', '100 itself is not above 100.'],
      similar: sim('Print "big" if size > 10, "small" if size < 3, and "medium" otherwise.', 'int size = 5;\nif (size > 10)\n{\n    Console.WriteLine("big");\n}\nelse if (size < 3)\n{\n    Console.WriteLine("small");\n}\nelse\n{\n    Console.WriteLine("medium");\n}'),
    },
    bouncer: {
      desc: `<p>Sometimes you need <b>two</b> things to be true. ${c('&&')} means "and": both sides must be true.</p>
        <p>Let the visitor in with ${c('OpenGate();')} only if ${c('age')} is <b>12 or more</b> AND ${c('hasTicket')} is true. Otherwise call ${c('TurnAway();')}.</p>`,
      starter: 'if (age >= 12 && hasTicket)\n{\n\n}\nelse\n{\n\n}\n',
      hints: ['The condition is already written. Fill in what happens in each block.', 'hasTicket is already a bool, so you can use it directly.'],
      similar: sim('Print "Ride!" only if height >= 120 and the person is not scared. Otherwise print "Next time".', 'int height = 130;\nbool scared = false;\nif (height >= 120 && !scared)\n{\n    Console.WriteLine("Ride!");\n}\nelse\n{\n    Console.WriteLine("Next time");\n}'),
    },
    orgate: {
      desc: `<p>${c('||')} means "or": the condition is true if <b>either</b> side is true.</p>
        <p>If ${c('weather')} is ${c('"rain"')} <b>or</b> ${c('"snow"')}, call ${c('Umbrella();')}. For any other weather, call ${c('Sunglasses();')}.</p>`,
      starter: 'if (weather == "rain")\n{\n    Umbrella();\n}\nelse\n{\n    Sunglasses();\n}\n',
      hints: ['The condition needs two full comparisons joined by ||.', 'Write weather == on both sides of the ||.'],
      similar: sim('Print "Weekend!" if day is "Sat" or "Sun", otherwise print "School day".', 'string day = "Sun";\nif (day == "Sat" || day == "Sun")\n{\n    Console.WriteLine("Weekend!");\n}\nelse\n{\n    Console.WriteLine("School day");\n}'),
    },
    // ------------------------------------------------------------ Level 4
    repeat: {
      desc: `<p>A <b>loop</b> repeats code. Your friend <b>i</b> counts each time it goes around:</p>
        ${pre('for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine("Hi");\n}')}
        <p>That prints "Hi" three times. Now make the machine print <b>Hooray!</b> 3 times, using a loop, not 3 separate lines.</p>`,
      starter: 'for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine("Hi");\n}\n',
      hints: ['The loop is already written. What text should go inside?', 'i < 3 controls how many times it repeats.'],
      similar: sim('Print "Jump!" 4 times using a loop.', 'for (int i = 0; i < 4; i++)\n{\n    Console.WriteLine("Jump!");\n}'),
    },
    stairs: {
      desc: `<p>The cliff is 6 blocks high. ${c('BuildStep(n);')} builds the step at position ${c('n')} (0 is the first step).</p>
        <p>You <i>could</i> write it 6 times... or let your friend <b>i</b> count for you with a <b>loop</b>!</p>
        <p>${c('for (int i = 0; i < 6; i++) { ... }')} runs the code inside 6 times, with ${c('i')} = 0, 1, 2, 3, 4, 5.</p>`,
      starter: '// i will count 0, 1, 2, 3, 4, 5 for you\nfor (int i = 0; i < 6; i++)\n{\n    Console.WriteLine("i is " + i);\n    // build a step here!\n}\n',
      hints: ['Call BuildStep inside the loop, between the { }.', 'Pass i to it, because i is the number of the step.'],
      similar: sim('Use a loop to place lanterns 0 to 3 by printing "lantern 0", "lantern 1"...', 'for (int i = 0; i < 4; i++)\n{\n    Console.WriteLine("lantern " + i);\n}'),
    },
    count: {
      desc: `<p>The counter ${c('i')} has a value you can use inside the loop! Print the numbers <b>1 to 10</b>, one per line.</p>
        <p>Start ${c('i')} at 1 and keep going while ${c('i <= 10')}.</p>`,
      starter: 'for (int i = 0; i < 10; i++)\n{\n    Console.WriteLine(i);\n}\n',
      hints: ['Start i at 1 instead of 0.', 'Use <= to include the last number.'],
      similar: sim('Print the numbers 5 to 8.', 'for (int i = 5; i <= 8; i++)\n{\n    Console.WriteLine(i);\n}'),
    },
    countdown: {
      desc: `<p>The launch pad needs a countdown! Print:</p><pre>5\n4\n3\n2\n1\nLiftoff!</pre>
        <p>Use a loop that counts <b>down</b>: start at 5, keep going while ${c('i >= 1')}, and use ${c('i--')} to subtract 1 each time.</p>`,
      starter: '// Count down from 5 to 1, then print "Liftoff!"\n',
      hints: ['Start at 5 and use i-- to go down.', 'Print Liftoff! after the loop\'s closing }.'],
      similar: sim('Count down from 3 to 1, then print "Go!".', 'for (int i = 3; i >= 1; i--)\n{\n    Console.WriteLine(i);\n}\nConsole.WriteLine("Go!");'),
    },
    listloop: {
      desc: `<p>Loops can walk through a <b>list</b> of things, one item at a time, with ${c('foreach')}:</p>
        ${pre('List<string> fruits = new List<string> { "apple", "pear" };\nforeach (string fruit in fruits)\n{\n    Console.WriteLine(fruit);\n}')}
        <p>${c('loot')} is a ${c('List<string>')}. Print every item in it, one per line. The list changes for each test. It might even be empty!</p>`,
      starter: '// loot is a List<string>, e.g. coin, gem, key\nConsole.WriteLine(loot.Count + " items");\n',
      hints: ['foreach (string item in loot) visits each item.', 'Print the loop variable inside the loop, not the whole list.'],
      similar: sim('Print each colour in a list of colours.', 'List<string> colours = new List<string> { "red", "blue" };\nforeach (string colour in colours)\n{\n    Console.WriteLine(colour);\n}'),
    },
    charge: {
      desc: `<p>A ${c('while')} loop keeps going <b>as long as</b> its condition is true, perfect when you don't know how many times you'll need.</p>
        <p>The battery is at ${c('charge')} percent. While it's below 100: call ${c('ChargeUp();')} and add 10 to ${c('charge')}. <i>(charge already exists, so no <code>int</code>.)</i></p>
        <p>If you forget to change ${c('charge')}, the loop never ends!</p>`,
      starter: 'while (charge < 100)\n{\n    ChargeUp();\n    // don\'t forget to add 10 to charge!\n}\n',
      hints: ['Inside the loop, charge has to go up, or the loop never ends.', 'The += shortcut adds a number to a variable.'],
      similar: sim('While water is below 50, print "pour" and add 20 to water.', 'int water = 0;\nwhile (water < 50)\n{\n    Console.WriteLine("pour");\n    water += 20;\n}'),
    },
    sumloop: {
      desc: `<p>Loops can <b>build up</b> an answer. Start a total at 0 and add to it each time around.</p>
        <p>Add up all the numbers from 1 to ${c('n')} (1 + 2 + ... + n) and print the total. Tested with n = 5, 10 and 1.</p>`,
      starter: 'int total = 0;\nfor (int i = 1; i <= n; i++)\n{\n    // add i to total\n}\nConsole.WriteLine(total);\n',
      hints: ['Inside the loop, add i to total.', 'Print the total after the loop has finished, not inside it.'],
      similar: sim('Add up 2 + 4 + 6 (the even numbers up to 6) and print the total.', 'int total = 0;\nfor (int i = 2; i <= 6; i += 2)\n{\n    total += i;\n}\nConsole.WriteLine(total);'),
    },
    breakloop: {
      desc: `<p>${c('break;')} jumps <b>out</b> of a loop early, handy when you find what you're looking for (or hit danger!).</p>
        <p>Ride along ${c('rails')} (a ${c('List<string>')}): print each piece of track. If you reach a ${c('"gap"')}, print <b>Stop!</b> and ${c('break')} out of the loop straight away.</p>`,
      starter: 'foreach (string piece in rails)\n{\n    Console.WriteLine(piece);\n}\n',
      hints: ['Inside the loop, check if piece == "gap" first, before printing it.', 'If it is a gap, print Stop! and then break. Otherwise print the piece.'],
      similar: sim('Walk through a list of rooms, printing each one, but stop with "Danger!" at a "dragon".', 'List<string> rooms = new List<string> { "hall", "kitchen", "dragon", "vault" };\nforeach (string room in rooms)\n{\n    if (room == "dragon")\n    {\n        Console.WriteLine("Danger!");\n        break;\n    }\n    Console.WriteLine(room);\n}'),
    },
    // ------------------------------------------------------------ Level 5
    cheer: {
      desc: `<p>A <b>function</b> is a named block of code. <b>Defining</b> it doesn't run it. You have to <b>call</b> it by writing its name with ${c('();')}.</p>
        <p>The function ${c('Cheer')} is already defined for you (${c('void')} means it gives nothing back). <b>Call it twice</b>.</p>`,
      starter: 'void Cheer()\n{\n    Console.WriteLine("Go team!");\n}\n\n// Call it twice below:\n',
      hints: ['Defining a function does not run it. You have to call it.', 'Calling it means writing its name followed by (); and you need two calls.'],
      similar: sim('Call a function named Clap three times.', 'void Clap()\n{\n    Console.WriteLine("clap!");\n}\n\nClap();\nClap();\nClap();'),
    },
    echo: {
      desc: `<p>Functions can take <b>inputs</b> called <b>parameters</b>. In C# each parameter has a type. Inside the function, the parameter works like a variable.</p>
        ${pre('void Hello(string name)\n{\n    Console.WriteLine("Hi " + name);\n}\n\nHello("Ada");   // Hi Ada')}
        <p>Write a function ${c('Echo')} that takes a ${c('string word')} and prints it <b>twice</b> (on two lines). The chamber will test it with different words.</p>`,
      starter: 'void Echo(string word)\n{\n    // print word two times\n}\n\nEcho("hello");\n',
      hints: ['word works like a variable inside the function.', 'Print word, not "word" in quotes, two times.'],
      similar: sim('Write Shout(word) that prints the word followed by "!!!".', 'void Shout(string word)\n{\n    Console.WriteLine(word + "!!!");\n}\n\nShout("hey");'),
    },
    double: {
      desc: `<p>A <b>function</b> is a reusable mini-program. You give it inputs and it <b>returns</b> an answer. The type in front of its name says what kind of answer: ${c('int')} for a whole number.</p>
        <p>Write a function ${c('DoubleIt')} that takes an ${c('int n')} and returns ${c('n * 2')}. (It can't be called ${c('double')}, because that word already means "decimal number" in C#.) The forge will test it with several numbers, then build the bridge.</p>`,
      starter: 'int DoubleIt(int n)\n{\n    // give back n times 2\n    return 0;\n}\n\nConsole.WriteLine(DoubleIt(4));   // should be 8\n',
      hints: ['Use return to give a value back. Right now it always returns 0.', 'Return n multiplied by something.'],
      similar: sim('Write Triple(n) that returns n times 3.', 'int Triple(int n)\n{\n    return n * 3;\n}\n\nConsole.WriteLine(Triple(4));'),
    },
    square: {
      desc: `<p>A returned value can be <b>used</b> like any other value: stored, printed, or even added to another returned value!</p>
        <p>Write ${c('Square')} that returns ${c('n * n')}. Then print ${c('Square(3) + Square(4)')} (it should show 25).</p>`,
      starter: 'int Square(int n)\n{\n    // return n times n\n    return 0;\n}\n',
      hints: ['First make Square return n times n.', 'Then print the two calls added together, inside one Console.WriteLine.'],
      similar: sim('Write Half(n) returning n / 2, then print Half(10) + Half(4).', 'int Half(int n)\n{\n    return n / 2;\n}\n\nConsole.WriteLine(Half(10) + Half(4));'),
    },
    greet: {
      desc: `<p>This door only opens for well-mannered code. Write a function ${c('Greet')} that takes a ${c('string name')} and returns a ${c('string')} greeting like this:</p>
        <pre>Greet("Ada")  gives  "Hello, Ada!"</pre>
        <p>Tip: join text with ${c('+')} or use an interpolated string <code>$"Hello, &#123;name&#125;!"</code>.</p>`,
      starter: 'string Greet(string name)\n{\n    return "Hello";\n}\n\nConsole.WriteLine(Greet("Ada"));\n',
      hints: ['Glue "Hello, " and name and "!" together and return the result.', 'Watch the comma, the space and the exclamation mark.'],
      similar: sim('Write Bye(name) that returns "Goodbye, NAME."', 'string Bye(string name)\n{\n    return "Goodbye, " + name + ".";\n}\n\nConsole.WriteLine(Bye("Ada"));'),
    },
    evenfn: {
      desc: `<p>Functions can return ${c('true')} or ${c('false')}: their type is ${c('bool')}. Then you can use them in an ${c('if')}!</p>
        <p>Write ${c('Even')} that takes an ${c('int n')} and returns ${c('true')} if it's even, ${c('false')} if it's odd. (Remember ${c('%')} from the Conditions level?)</p>`,
      starter: 'bool Even(int n)\n{\n    return false;\n}\n\nConsole.WriteLine(Even(4));\n',
      hints: ['n % 2 == 0 is already true or false. You can return it directly.', 'Return the value itself, not text in quotes.'],
      similar: sim('Write Big(n) that returns whether n is over 100.', 'bool Big(int n)\n{\n    return n > 100;\n}\n\nConsole.WriteLine(Big(500));'),
    },
    total: {
      desc: `<p>Write a function ${c('Total')} that takes a ${c('List<int>')} of numbers and returns their sum.</p>
        <pre>Total([1, 2, 3])  gives  6\nTotal([])         gives  0</pre>
        <p>Functions + loops = power. Start a running total at 0 and add each number.</p>`,
      starter: 'int Total(List<int> nums)\n{\n    int result = 0;\n    foreach (int n in nums)\n    {\n        // add n to result\n    }\n    return result;\n}\n\nConsole.WriteLine(Total(new List<int> { 1, 2, 3 }));\n',
      hints: ['Inside the loop, add each n to result.', 'Return result after the loop has finished.'],
      similar: sim('Write CountLong(words) that returns how many words are longer than 3 letters.', 'int CountLong(List<string> words)\n{\n    int count = 0;\n    foreach (string w in words)\n    {\n        if (w.Length > 3)\n        {\n            count += 1;\n        }\n    }\n    return count;\n}\n\nConsole.WriteLine(CountLong(new List<string> { "hi", "hello", "hey", "world" }));'),
    },
    biggest: {
      desc: `<p>Functions can use everything you've learned, including ${c('if')}. Write a function ${c('Biggest')} that takes two ${c('int')}s ${c('a')} and ${c('b')} and <b>returns</b> the larger one.</p>
        <pre>Biggest(3, 9)   gives  9\nBiggest(10, 2)  gives  10</pre>`,
      starter: 'int Biggest(int a, int b)\n{\n    if (a > b)\n    {\n        return a;\n    }\n    // what if a is not bigger?\n    return 0;\n}\n',
      hints: ['If a is not bigger, what should you return instead of 0?', 'The last return runs only when the if did not.'],
      similar: sim('Write Smallest(a, b) that returns the smaller number.', 'int Smallest(int a, int b)\n{\n    if (a < b)\n    {\n        return a;\n    }\n    return b;\n}\n\nConsole.WriteLine(Smallest(4, 9));'),
    },
    // ------------------------------------------------------------ Level 6
    crate: {
      desc: `<p>A <b>class</b> is a blueprint. Making something from the blueprint with ${c('new')} gives you an <b>object</b>, and objects carry data called <b>fields</b>.</p>
        <p>The ${c('Crate')} blueprint is written for you at the bottom. Create a crate object with ${c('Crate myCrate = new Crate();')}, then print its ${c('contents')} field using a dot: ${c('myCrate.contents')}.</p>`,
      starter: '// 1. Make an object:   Crate myCrate = new Crate();\n// 2. Print its contents\n\nclass Crate\n{\n    public string contents = "golden key";\n}\n',
      hints: ['Create the object first with new, above the class.', 'Then read the field with a dot: the object\'s name, a dot, then contents.'],
      similar: sim('Make a Chest object and print its gold field.', 'Chest myChest = new Chest();\nConsole.WriteLine(myChest.Gold);\n\nclass Chest\n{\n    public int Gold = 50;\n}'),
    },
    potion: {
      desc: `<p>The real power of classes: <b>one blueprint, many different objects</b>. The <b>constructor</b> (the method named like the class) can take inputs so each object gets its own values, and <b>methods</b> are functions that belong to the object.</p>
        <p>Finish the ${c('Potion')} class: it stores ${c('Power')}, and ${c('Describe()')} should return text like <b>Potion of power 3</b>.</p>
        <p>Then ${c('Brew')} <b>two</b> potions with <b>different</b> powers.</p>`,
      starter: 'Brew(new Potion(3));\n// brew a second, stronger potion\n\nclass Potion\n{\n    public int Power;\n\n    public Potion(int power)\n    {\n        Power = power;\n    }\n\n    public string Describe()\n    {\n        return "...";   // use Power here\n    }\n}\n',
      hints: ['Describe should use Power inside the text it returns.', 'Call Brew a second time with a different number.'],
      similar: sim('A Shield class stores Strength, and Label() returns "Shield +STRENGTH".', 'Console.WriteLine(new Shield(2).Label());\nConsole.WriteLine(new Shield(5).Label());\n\nclass Shield\n{\n    public int Strength;\n\n    public Shield(int strength)\n    {\n        Strength = strength;\n    }\n\n    public string Label()\n    {\n        return $"Shield +{Strength}";\n    }\n}'),
    },
    lamp: {
      desc: `<p>Methods can <b>change</b> an object's fields. The ${c('Lamp')} class is almost done: the ${c('Toggle')} method should flip ${c('On')} from off to on, or on to off.</p>
        <p>${c('!')} flips true/false: ${c('!true')} is false. The code at the top already tests it.</p>`,
      starter: 'Lamp lamp = new Lamp();\nConsole.WriteLine(lamp.Status());\nlamp.Toggle();\nConsole.WriteLine(lamp.Status());\nlamp.Toggle();\nConsole.WriteLine(lamp.Status());\n\nclass Lamp\n{\n    public bool On = false;\n\n    public string Status()\n    {\n        return On ? "on" : "off";\n    }\n\n    public void Toggle()\n    {\n        // flip On\n    }\n}\n',
      hints: ['Toggle should set On to the opposite of what it is now.', '!true is false, and !false is true.'],
      similar: sim('A Door class has a method that flips Open between true and false.', 'Door d = new Door();\nd.Flip();\nConsole.WriteLine(d.Open);\n\nclass Door\n{\n    public bool Open = false;\n\n    public void Flip()\n    {\n        Open = !Open;\n    }\n}'),
    },
    wallet: {
      desc: `<p>Methods can take <b>inputs</b> too. Finish the ${c('Add')} method so it increases ${c('Coins')} by ${c('amount')}.</p>
        <p>Notice the test code makes <b>two</b> purses: each object keeps its <b>own</b> coins.</p>`,
      starter: 'Wallet mine = new Wallet();\nmine.Add(5);\nmine.Add(10);\nConsole.WriteLine(mine.Coins);\n\nWallet yours = new Wallet();\nyours.Add(3);\nConsole.WriteLine(yours.Coins);\n\nclass Wallet\n{\n    public int Coins = 0;\n\n    public void Add(int amount)\n    {\n        // increase Coins by amount\n    }\n}\n',
      hints: ['Inside Add, change Coins.', 'Use += with the amount parameter.'],
      similar: sim('A Health class has a method Damage(amount) that lowers Hp.', 'Health h = new Health();\nh.Damage(3);\nConsole.WriteLine(h.Hp);\n\nclass Health\n{\n    public int Hp = 10;\n\n    public void Damage(int amount)\n    {\n        Hp -= amount;\n    }\n}'),
    },
    forge: {
      desc: `<p>A <b>class</b> is a blueprint. From one blueprint you can make many <b>objects</b>.</p>
        <p>Design a weapon class with a ${c('Name')} (a string) and ${c('Damage')} (an int from 1 to 5). Then create one with ${c('new')} and ${c('Equip(...)')} it!</p>
        <p>Bonus: give it a method like ${c('public string Swing()')} that returns a battle cry.</p>`,
      starter: '// Create a Sword object from the blueprint, then equip it\nSword mySword = new Sword();\n\nclass Sword\n{\n    public string Name;\n    public int Damage;\n\n    public Sword()\n    {\n        Name = "Byte Blade";\n        Damage = 3;\n    }\n\n    public string Swing()\n    {\n        return "Slash!";\n    }\n}\n',
      hints: ['The class is already written, and an object is already made from it.', 'Pass the object into Equip(...).'],
      similar: sim('Make a Shield class with a Name and Armor, create one, and print its name.', 'Shield myShield = new Shield();\nConsole.WriteLine(myShield.Name);\n\nclass Shield\n{\n    public string Name = "Pot Lid";\n    public int Armor = 2;\n}'),
    },
    den: {
      desc: `<p>Lonely? Write a class for a <b>pet</b>! It needs a ${c('Name')} and a method ${c('public string Speak()')} that returns what it says.</p>
        <p>Optionally add a ${c('Species')} like "cat", "dog", "bird", "slime" or "robot". Then ${c('Adopt(...)')} your pet!</p>`,
      starter: '// Make a pet object (pick your own name!)\nPet buddy = new Pet("Pixel", "cat");\n\nclass Pet\n{\n    public string Name { get; set; }\n    public string Species { get; set; }\n\n    public Pet(string name, string species)\n    {\n        Name = name;\n        Species = species;\n    }\n\n    public string Speak()\n    {\n        return "...";\n    }\n}\n',
      hints: ['Speak must return some text your pet says (not "...").', 'Pass your pet object into Adopt(...).'],
      similar: sim('Make a Robot class whose Beep() method returns "Beep boop!", and print it.', 'Robot r = new Robot("Bolt");\nConsole.WriteLine(r.Beep());\n\nclass Robot\n{\n    public string Name;\n\n    public Robot(string name)\n    {\n        Name = name;\n    }\n\n    public string Beep()\n    {\n        return "Beep boop!";\n    }\n}'),
    },
    // ------------------------------------------------------------ Open world
    gems: {
      desc: `<p>${c('gems')} is a ${c('List<int>')} of gem sizes. Deposit only the <b>big</b> ones: call ${c('Deposit(gem);')} for every gem <b>bigger than 5</b>, in order.</p>
        <p>Loop over the list with ${c('foreach')} and use an ${c('if')} inside. Tested with 3 different lists.</p>`,
      starter: '// gems is a List<int>, e.g. 3, 8, 1, 9, 6\nforeach (int gem in gems)\n{\n\n}\n',
      hints: ['Use an if inside the loop.', 'Call Deposit only when the gem is bigger than 5.'],
      similar: sim('Print every score in a list that is at least 50.', 'List<int> scores = new List<int> { 30, 75, 50, 10 };\nforeach (int s in scores)\n{\n    if (s >= 50)\n    {\n        Console.WriteLine(s);\n    }\n}'),
    },
    decoder: {
      desc: `<p>The message in ${c('secret')} was written in a mirror: it's <b>backwards</b>! Print it the right way around.</p>
        <pre>secret = "olleh"   prints  hello</pre>
        <p>C# strings can't be reversed directly, but an array of letters can: ${c('secret.ToCharArray()')} gives a ${c('char[]')}, ${c('Array.Reverse(letters);')} flips it, and ${c('new string(letters)')} turns it back into text. Or build a new string with a loop.</p>`,
      starter: '// secret is a backwards string\nConsole.WriteLine(secret);\n',
      hints: ['Turn the string into an array of letters, reverse the array, and build a new string from it.', 'Or loop over the letters and add each one to the front of a new string.'],
      similar: sim('Print the word "stressed" backwards.', 'string word = "stressed";\nstring backwards = "";\nforeach (char letter in word)\n{\n    backwards = letter + backwards;\n}\nConsole.WriteLine(backwards);'),
    },
    fib: {
      desc: `<p>The vault opens with the <b>Fibonacci sequence</b>: start with 0 and 1, and each next number is the sum of the two before it.</p>
        <pre>0, 1, 1, 2, 3, 5, 8, 13, ...</pre>
        <p>Print the first ${c('n')} numbers (one per line). Tested with n = 5, 8 and 1. Tip: use a temporary variable to update two variables at once: ${c('int next = a + b;')}, then move the values along.</p>`,
      starter: 'int a = 0;\nint b = 1;\n// print the first n Fibonacci numbers\n',
      hints: ['Loop n times. Each time, print a, then work out the next pair.', 'The next a is the old b. The next b is the old a + b, so save a + b before you change a.'],
      similar: sim('Print the first 5 powers of 2: 1, 2, 4, 8, 16.', 'int x = 1;\nfor (int i = 0; i < 5; i++)\n{\n    Console.WriteLine(x);\n    x = x * 2;\n}'),
    },
    fizz: {
      desc: `<p>An ancient programmer ritual. Print the numbers <b>1 to 15</b>, but:</p>
        <ul><li>multiples of 3: <b>Fizz</b></li><li>multiples of 5: <b>Buzz</b></li><li>multiples of both: <b>FizzBuzz</b></li></ul>
        <p>${c('%')} gives the remainder: ${c('9 % 3')} is 0, so 9 is a multiple of 3.</p>`,
      starter: 'for (int i = 1; i <= 15; i++)\n{\n    Console.WriteLine(i);\n}\n',
      hints: ['Check for multiples of 15 first, then 3, then 5.', 'Use else if so only one line is printed for each number.'],
      similar: sim('Print 1 to 6, but print "Even" instead of the number for even numbers.', 'for (int i = 1; i <= 6; i++)\n{\n    if (i % 2 == 0)\n    {\n        Console.WriteLine("Even");\n    }\n    else\n    {\n        Console.WriteLine(i);\n    }\n}'),
    },
    merchant: {
      desc: `<p>The merchant keeps prices in a <b>dictionary</b>: ${c('prices')} is a ${c('Dictionary<string, int>')} that maps item names to costs. ${c('cart')} is a ${c('List<string>')} of item names.</p>
        <p>Print the <b>total cost</b> of everything in the cart. Look up a price with ${c('prices["potion"]')}.</p>`,
      starter: '// prices: "potion" is 5, "shield" is 12, ...\n// cart: "potion", "potion", ...\nConsole.WriteLine(cart.Count + " items in the cart");\n',
      hints: ['Start an int total at 0 and loop over cart.', 'For each item, look up its price in prices and add it to the total. Print the total after the loop.'],
      similar: sim('Add up the ages in a dictionary for the names in a list.', 'Dictionary<string, int> ages = new Dictionary<string, int>\n{\n    { "ana", 10 },\n    { "bo", 12 }\n};\nList<string> names = new List<string> { "ana", "bo" };\nint sum = 0;\nforeach (string person in names)\n{\n    sum += ages[person];\n}\nConsole.WriteLine(sum);'),
    },
    backpack: {
      desc: `<p>A <b>list</b> holds many values in order. Each item has a position called an <b>index</b>, starting at <b>0</b>:</p>
        ${pre('List<string> items = new List<string> { "sword", "map", "apple" };\nitems[0]                  // "sword"\nitems[items.Count - 1]    // "apple"\nitems.Count               // 3')}
        <p>Print 3 lines about ${c('inventory')}: the <b>first</b> item, the <b>last</b> item, and <b>how many</b> items there are.</p>`,
      starter: '// inventory is a List<string>, e.g. sword, map, apple\nConsole.WriteLine(string.Join(", ", inventory));\n',
      hints: ['The first item is at index 0.', 'The last item is at index Count - 1, and .Count gives how many there are.'],
      similar: sim('From a list of planets, print the second one and the number of planets.', 'List<string> planets = new List<string> { "Mercury", "Venus", "Earth" };\nConsole.WriteLine(planets[1]);\nConsole.WriteLine(planets.Count);'),
    },
    crier: {
      desc: `<p>Strings (text) come with built-in <b>methods</b>, tools you call with a dot:</p>
        ${pre('"hi".ToUpper()   // "HI"\n"HI".ToLower()   // "hi"')}
        <p>The crier shouts every ${c('message')}: print it in <b>UPPERCASE</b> with an ${c('!')} on the end. ${c('"hello"')} becomes <b>HELLO!</b></p>`,
      starter: '// message changes for each test\nConsole.WriteLine(message);\n',
      hints: ['Strings have a ToUpper() method.', 'Glue "!" onto the end with +.'],
      similar: sim('Print a name in lowercase followed by "?".', 'string name = "ADA";\nConsole.WriteLine(name.ToLower() + "?");'),
    },
    bag: {
      desc: `<p>Lists can <b>grow</b>! ${c('list.Add(x);')} adds ${c('x')} to the end, and ${c('list.Count')} tells you how many items there are.</p>
        <p>Add ${c('"potion"')} to ${c('bag')}, then print how many items it holds, and then its last item.</p>`,
      starter: '// bag is a List<string>, e.g. rope, torch\nConsole.WriteLine(string.Join(", ", bag));\n',
      hints: ['.Add puts an item on the end of a list.', 'Then print bag.Count, and after that the item at index Count - 1.'],
      similar: sim('Add "bread" to a shopping list, then print the list.', 'List<string> shopping = new List<string> { "milk" };\nshopping.Add("bread");\nConsole.WriteLine(string.Join(", ", shopping));'),
    },
    // ------------------------------------------------------------ Boss
    cannon: {
      desc: `<p>Each call to ${c('Fire();')} launches a compiled blast at Segfault. The cannon only accepts <b>burst fire from a loop</b>, up to <b>5 shots</b> per run.</p>
        <p>After firing, it needs time to recharge. Watch out: Segfault may <b>corrupt your cannon code</b>! If it does, debug it before firing again.</p>`,
      starter: '// Fire a burst!\nfor (int shot = 0; shot < 5; shot++)\n{\n    Fire();\n}\n',
      hints: ['Call Fire(); inside a loop.', 'Each run can fire up to 5 shots.'],
      similar: sim('Print "Pew!" 5 times with a loop.', 'for (int shot = 0; shot < 5; shot++)\n{\n    Console.WriteLine("Pew!");\n}'),
    },
  };

  // ================================================================ glitch snippets
  const snippets = {
    syntax: [
      { code: 'Console.WriteLine("Jump power restored!";', expect: 'Jump power restored!' },
      { code: 'if (true)\n{\n    Console.WriteLine("Legs online");\n', expect: 'Legs online' },
      { code: 'string message = "Spring loaded;\nConsole.WriteLine(message);', expect: 'Spring loaded' },
      { code: 'for (int n = 0; n < 3; n++\n{\n    Console.WriteLine(n);\n}', expect: '0\n1\n2' },
    ],
    name: [
      { code: 'string direction = "forward";\nConsole.WriteLine(directon);', expect: 'forward' },
      { code: 'Console.WriteLin("Left is left again");', expect: 'Left is left again' },
      { code: 'string Turn()\n{\n    return "right";\n}\n\nConsole.WriteLine(Trun());', expect: 'right' },
      { code: 'int Score = 10;\nConsole.WriteLine(score);', expect: '10' },
    ],
    type: [
      { code: 'int speed = "8";\nConsole.WriteLine("Speed: " + speed);', expect: 'Speed: 8', hint: 'An int holds a number, not text in quotes.' },
      { code: 'int boost = "5" + 5;\nConsole.WriteLine(boost);', expect: '10', hint: '"5" in quotes is text. Use the number 5.' },
      { code: 'int Run(int steps)\n{\n    return steps * 2;\n}\n\nConsole.WriteLine(Run());', expect: '20', hint: 'Run() needs a number of steps. 10 should do it.' },
      { code: 'int run = 20;\nConsole.WriteLine(run());', expect: '20', hint: 'run is a number, not a function, so it has no ().' },
    ],
  };

  root.GameData.addLanguageContent('csharp', { intro, tutorials, terminals, snippets });
})(typeof window !== 'undefined' ? window : globalThis);
