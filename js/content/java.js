/* CodeQuest — Java content: level intros, tutorials, terminal descriptions, starters, hints,
 * similar examples and glitch snippets. Runs on js/clike.js with dialect 'java'. */
(function (root) {
  'use strict';
  const GD = root.GameData;

  // ---- helpers to build complete Java programs
  const trim = (s) => String(s || '').replace(/^\n+|\s+$/g, '');
  const ind = (s, n) => s.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n');
  // M(body, methods, classes, imports): body goes in main, methods are static methods inside Main,
  // classes go above Main (without public), imports go at the very top.
  function M(body, methods, classes, imports) {
    let s = '';
    if (imports) s += trim(imports) + '\n\n';
    if (classes) s += trim(classes) + '\n\n';
    s += 'public class Main {\n';
    if (methods) s += ind(trim(methods), 4) + '\n\n';
    s += '    public static void main(String[] args) {\n' + ind(trim(body), 8) + '\n    }\n}\n';
    return s;
  }
  const page = (title, body, code, opt) => Object.assign({ title, body, code: code === undefined ? null : code }, opt || {});
  const cheat = (rows) => '<table class="cheat">' + rows.map(([a, b]) => `<tr><td><code>${a}</code></td><td>${b}</td></tr>`).join('') + '</table>';
  const LIST_IMPORT = 'import java.util.ArrayList;';

  // ================================================================ level intros (story pages)
  const intro = {
    hello: `<p>Welcome to <b>Syntaxia</b>, a world built from code — and slowly being eaten by <b>bugs</b>.</p><p>You are a Coder. In this world, you change things by writing <b>scripts</b>. You have chosen <b>Java</b>, the language of Android phones, big servers and Minecraft. Every programmer's journey starts with the same two words...</p>`,
    vars: `<p>A <b>variable</b> is a named box that holds a value. In Java, every box also has a <b>type</b> written in front of it, saying what kind of value it holds:</p><pre>int planks = 7;\nString name = "Ada";</pre><p>In Syntaxia, objects you pick up become variables you can use in your code! Collect the glowing boxes.</p>`,
    ifs: `<p>Code can make <b>decisions</b> with <code>if</code>:</p><pre>if (hp &lt; 3) {\n    System.out.println("Heal!");\n} else if (hp == 3) {\n    System.out.println("Okay");\n} else {\n    System.out.println("Strong!");\n}</pre><p>Notice the condition in <b>( round brackets )</b> and the code inside <b>{ curly braces }</b> — that's how Java knows what belongs inside the if.</p><p><b>Bugs</b> live here. Jump on them to squash them — if one bites you, it puts an <b>error in your code</b>!</p>`,
    loops: `<p>A <b>loop</b> repeats code so you don't have to:</p><pre>for (int i = 0; i &lt; 3; i++) {\n    System.out.println(i);   // 0, 1, 2\n}</pre><p>That little <b>i</b> is the loop's counter... Legend says a tiny creature named <b>i</b> lives in these caves. Maybe you'll find them!</p>`,
    funcs: `<p>A <b>function</b> is a named recipe. In Java, functions are called <b>methods</b>. Write one once inside <code>Main</code>, use it as often as you like:</p><pre>static int square(int x) {\n    return x * x;\n}\n\n// inside main:\nSystem.out.println(square(4));  // 16</pre><p><code>return</code> sends the answer back to whoever called the method.</p>`,
    classes: `<p>A <b>class</b> is a blueprint for making objects. Each object gets its own data (<b>fields</b>) and abilities (<b>methods</b>):</p><pre>class Dog {\n    String name;\n\n    Dog(String name) {\n        this.name = name;\n    }\n\n    String speak() {\n        return "Woof!";\n    }\n}\n\n// inside main:\nDog rex = new Dog("Rex");\nSystem.out.println(rex.speak());</pre><p>Forge a <b>weapon</b> or adopt a <b>pet</b> — or both! Master classes and you'll unlock <b>skill points</b> and the <b>open world</b>.</p>`,
    world: `<p>You've mastered the basics. Now Syntaxia is yours to explore!</p><ul><li>Find the <b>3 Core terminals</b> to open the gate to the Bug King's lair.</li><li>Earn <b>skill points</b> from cores, side quests and squashing bugs (1 SP per 3 bugs).</li><li>Spend them at the <b>Skill Shrine</b> (or press K).</li></ul>`,
    boss: `<p>The source of all the bugs. <b>Segfault</b> has corrupted the core of Syntaxia.</p><p>Use the <b>Compiler Cannon</b> terminal to blast it with loops. Hit it with your weapon when it swoops low. Jump on its head if you dare.</p><p>It will throw <b>errors</b> at you and corrupt your code. Stay calm and debug!</p>`,
  };

  // ================================================================ tutorials
  const tutorials = {
    // ------------------------------------------------------------ 1. printing
    hello: [
      page('Your first command: System.out.println',
        `<p><code>System.out.println(...)</code> makes the computer <b>show</b> something. Whatever you put inside the brackets appears in the output, on its own line.</p><p>Press <b>Run</b>. Then change the words and run it again — this box is yours to play with.</p>`,
        M('System.out.println("Hi there!");')),
      page('The shape of a Java program',
        `<p>Every Java program lives inside a <b>class</b> called <code>Main</code>, and starts running inside <code>main</code>:</p><pre>public class Main {\n    public static void main(String[] args) {\n        // your code goes here\n    }\n}</pre><p>For now, think of those lines as the frame of a picture: you write your code <b>between the inner curly braces</b>. Every <code>{</code> needs a matching <code>}</code>. Lines starting with <code>//</code> are <b>comments</b>: notes for humans that the computer skips.</p>`,
        M('// This is a comment. The computer ignores it.\nSystem.out.println("Inside main!");')),
      page('Text needs quotes',
        `<p>Text (programmers call it a <b>String</b>) must be wrapped in double quotes <code>"like this"</code>. Without quotes the computer thinks the words are names of things — and gets confused.</p><p>Run this. The second line causes an <b>error</b>. Fix it by adding quotes, then run again.</p>`,
        M('System.out.println("I am text");\nSystem.out.println(I am not text);'), { expectError: true }),
      page('Semicolons end commands',
        `<p>In Java, every command ends with a <b>semicolon</b> <code>;</code> — like a full stop at the end of a sentence. Forget one and Java refuses to run the program.</p><p>Run this to see the error, then add the missing <code>;</code> at the end of the second line.</p>`,
        M('System.out.println("One");\nSystem.out.println("Two")\nSystem.out.println("Three");'), { expectError: true }),
      page('Top to bottom',
        `<p>Code runs <b>one line at a time, from top to bottom</b>. Every <code>println</code> starts a new line of output.</p><p>Try swapping two lines and see how the output changes.</p>`,
        M('System.out.println("1. Wake up");\nSystem.out.println("2. Write code");\nSystem.out.println("3. Save the world");')),
      page('Gluing text with +',
        `<p>The <code>+</code> sign <b>glues</b> pieces of text together. It doesn't add spaces for you — if you want a space, put it inside the quotes.</p>`,
        M('System.out.println("Code" + "Quest");\nSystem.out.println("Code " + "Quest");\nSystem.out.println("Ha" + "Ha" + "Ha");')),
      page('Numbers and maths',
        `<p>Numbers <b>don't</b> use quotes. Without quotes, the computer does the maths for you:</p><ul><li><code>+</code> add &nbsp; <code>-</code> subtract</li><li><code>*</code> multiply &nbsp; <code>/</code> divide</li></ul><p>Look closely at <code>9 / 2</code>: Java shows <b>4</b>, not 4.5! Dividing two whole numbers gives a whole number (the rest is thrown away). Write <code>9.0 / 2</code> to get 4.5.</p><p>On the last line, <code>"2 + 3"</code> has quotes, so it's just text.</p>`,
        M('System.out.println(2 + 3);\nSystem.out.println(10 - 4);\nSystem.out.println(6 * 7);\nSystem.out.println(9 / 2);\nSystem.out.println(9.0 / 2);\nSystem.out.println("2 + 3");')),
      page('Brackets go first',
        `<p>Like in maths class, <code>*</code> and <code>/</code> happen <b>before</b> <code>+</code> and <code>-</code>. Brackets <code>( )</code> happen before everything.</p><p>Same numbers, different answers:</p>`,
        M('System.out.println(2 + 3 * 4);\nSystem.out.println((2 + 3) * 4);')),
      page('Text and numbers together',
        `<p>Glue text and a number with <code>+</code> and Java turns the number into text for you. Because <code>*</code> happens before <code>+</code>, the maths is done first and <i>then</i> glued on:</p><pre>"Gems: " + 3 * 4    →   Gems: 12</pre><p>Careful with adding, though: <code>"Sum: " + 2 + 3</code> glues the 2 and then the 3, giving <b>Sum: 23</b>. Put brackets around the maths to add first.</p>`,
        M('System.out.println("Level " + 1);\nSystem.out.println("Gems: " + 3 * 4);\nSystem.out.println("Sum: " + 2 + 3);\nSystem.out.println("Sum: " + (2 + 3));')),
      page('Cheat sheet',
        cheat([
          ['System.out.println("Hi");', 'show text on its own line'],
          ['"text"', 'text needs double quotes'],
          [';', 'ends every command'],
          ['// note', 'a comment (ignored)'],
          ['"a" + "b"', 'glue text → <code>ab</code>'],
          ['2 + 3 * 4', 'maths (no quotes) → 14'],
          ['(2 + 3) * 4', 'brackets first → 20'],
          ['9 / 2', 'whole numbers → 4 (use 9.0 / 2 for 4.5)'],
          ['"Lv " + 1', 'text and a number → <code>Lv 1</code>'],
        ]) + '<p>Each terminal in this level practises one of these. You can reopen this tutorial any time with the <b>Tutorial</b> button.</p>'),
    ],
    // ------------------------------------------------------------ 2. variables
    vars: [
      page('Making a variable',
        `<p>A <b>variable</b> is a labelled box that stores a value so you can use it later.</p><p>In Java you write the <b>type</b> first, then the <b>name</b>, then <code>=</code> and the value. The <code>=</code> sign means <b>"store this in the box"</b> — it's not the maths "equals".</p><pre>String name = "Ada";</pre>`,
        M('String name = "Ada";\nSystem.out.println(name);')),
      page('The name vs. the text',
        `<p>Without quotes, <code>color</code> means <b>"look inside the box called color"</b>. With quotes, <code>"color"</code> is just the word itself.</p><p>Run it and compare the two lines.</p>`,
        M('String color = "red";\nSystem.out.println(color);\nSystem.out.println("color");')),
      page('Kinds of values',
        `<p>Every box has a <b>type</b> that says what can go inside:</p><ul><li><code>String</code>: text, in quotes — <code>"Ada"</code> (capital S!)</li><li><code>int</code>: a whole number — <code>5</code></li><li><code>double</code>: a number with a decimal point — <code>2.5</code></li><li><code>boolean</code>: a yes/no value — <code>true</code> or <code>false</code> (all lowercase, no quotes)</li></ul><p>Careful: <code>"5"</code> in quotes is <i>text</i> that happens to look like a number!</p>`,
        M('String name = "Ada";\nint level = 5;\ndouble speed = 2.5;\nboolean alive = true;\nSystem.out.println(name + " " + level + " " + speed + " " + alive);')),
      page('Types are strict',
        `<p>Java checks that every value fits its box. A text value can't go into an <code>int</code> box, even if it looks like a number.</p><p>Run this to see the error, then fix it by removing the quotes around 5.</p>`,
        M('int level = "5";\nSystem.out.println(level);'), { expectError: true }),
      page('Maths with variables',
        `<p>You can do maths with the values inside boxes — and store the answer in a <b>new</b> box.</p><p>Change <code>width</code> and run again: the area updates automatically. That's the power of variables!</p>`,
        M('int width = 4;\nint height = 3;\nint area = width * height;\nSystem.out.println(area);')),
      page('Changing a variable',
        `<p>A box can get a <b>new value</b>. This line reads the old score, adds 5, and stores the result back in the same box:</p><pre>score = score + 5;</pre><p>The shortcut <code>score += 5;</code> does exactly the same thing, and <code>score++;</code> adds 1. <b>Only write the type the first time</b> — after that, the box already exists.</p>`,
        M('int score = 10;\nSystem.out.println(score);\nscore = score + 5;\nSystem.out.println(score);\nscore += 1;\nSystem.out.println(score);')),
      page('Mixing text and numbers',
        `<p>When you glue a String and a number with <code>+</code>, Java turns the number into text for you. Just remember the spaces: they only appear if you put them inside the quotes.</p>`,
        M('int coins = 7;\nString hero = "Ada";\nSystem.out.println("Coins: " + coins);\nSystem.out.println(hero + " has " + coins + " coins");')),
      page('Objects become variables',
        `<p>In Syntaxia, glowing boxes you walk into become <b>variables</b> you can use in any terminal. They appear in the <b>Variables</b> panel in the top-right corner, showing their name and what's inside.</p><p>The game has already created those boxes for you, so use them by name — <b>don't</b> write a type like <code>int</code> in front of them again.</p>`),
      page('Cheat sheet',
        cheat([
          ['int x = 5;', 'make a variable (type, name, value)'],
          ['System.out.println(x);', 'show what\'s inside'],
          ['"x"</code> vs <code>x', 'the word vs. the box'],
          ['String / int / double / boolean', 'text / whole number / decimal / true-false'],
          ['x = x + 1;</code>, <code>x += 1;</code>, <code>x++;', 'change a variable (no type!)'],
          ['"Hi " + name', 'glue text and values'],
        ])),
    ],
    // ------------------------------------------------------------ 3. conditions
    ifs: [
      page('Asking yes/no questions',
        `<p>A <b>comparison</b> asks a question and the answer is <code>true</code> or <code>false</code>.</p><ul><li><code>&gt;</code> greater than, <code>&lt;</code> less than</li><li><code>&gt;=</code> at least, <code>&lt;=</code> at most</li><li><code>==</code> equal to, <code>!=</code> not equal to</li></ul>`,
        M('int hp = 40;\nSystem.out.println(hp > 50);\nSystem.out.println(hp < 50);\nSystem.out.println(hp == 40);\nSystem.out.println(hp != 40);')),
      page('= stores, == compares',
        `<p>This trips up everyone at first:</p><ul><li><code>=</code> (one) <b>stores</b> a value in a variable</li><li><code>==</code> (two) <b>asks</b> "are these equal?"</li></ul>`,
        M('int x = 5;                    // store 5 in x\nSystem.out.println(x == 5);   // is x equal to 5?\nSystem.out.println(x == 9);   // is x equal to 9?')),
      page('if: do something only sometimes',
        `<p><code>if</code> runs code <b>only when</b> the condition is true. The condition goes in <b>( round brackets )</b> and the code inside goes between <b>{ curly braces }</b>. There's no semicolon after the <code>)</code>.</p><p>Run it, then change <code>hp</code> to 50 and run again — the warning disappears, but "Done checking" always prints.</p>`,
        M('int hp = 20;\nif (hp < 30) {\n    System.out.println("Low health!");\n}\nSystem.out.println("Done checking");')),
      page('else: otherwise...',
        `<p><code>else</code> is the plan B: it runs when the condition is <b>false</b>. Exactly one of the two blocks runs, never both.</p>`,
        M('int keys = 0;\nif (keys > 0) {\n    System.out.println("Open the door");\n} else {\n    System.out.println("Find a key");\n}')),
      page('Many choices: else if',
        `<p>Chain more checks with <code>else if</code>. They are checked <b>top to bottom</b> and only the <b>first</b> true one runs. <code>else</code> catches everything left over.</p><p>Try temp = 35, 15 and -5.</p>`,
        M('int temp = 15;\nif (temp > 30) {\n    System.out.println("Hot");\n} else if (temp > 10) {\n    System.out.println("Warm");\n} else {\n    System.out.println("Cold");\n}')),
      page('Comparing text: .equals',
        `<p>For numbers, use <code>==</code>. For <b>Strings</b>, Java programmers use <code>.equals(...)</code> instead:</p><pre>door.equals("open")</pre><p>It asks "does this text have exactly the same letters?" (capitals matter). Using <code>==</code> on text can give surprising answers in real Java programs, so get into the <code>.equals</code> habit now.</p>`,
        M('String door = "locked";\nif (door.equals("open")) {\n    System.out.println("Walk in");\n} else {\n    System.out.println("Find a key");\n}\nSystem.out.println(door.equals("Locked"));')),
      page('The remainder: %',
        `<p><code>%</code> gives the <b>remainder</b> after dividing. <code>7 % 2</code> is 1 (7 = 2+2+2, with 1 left over).</p><p>If <code>n % 2</code> is 0, nothing is left over — so <code>n</code> is <b>even</b>.</p>`,
        M('System.out.println(7 % 2);\nSystem.out.println(8 % 2);\nint n = 10;\nif (n % 2 == 0) {\n    System.out.println(n + " is even");\n}')),
      page('Combining: &&, ||, !',
        `<ul><li><code>&amp;&amp;</code> (and) — true only if <b>both</b> sides are true</li><li><code>||</code> (or) — true if <b>at least one</b> side is true</li><li><code>!</code> (not) — flips true and false</li></ul><p>Each side must be a full comparison: write <code>w.equals("rain") || w.equals("snow")</code>, not <code>w.equals("rain") || "snow"</code>.</p>`,
        M('int age = 14;\nboolean ticket = true;\nSystem.out.println(age >= 12 && ticket);\nSystem.out.println(age < 5 || ticket);\nSystem.out.println(!ticket);')),
      page('Cheat sheet',
        cheat([
          ['&gt; &lt; &gt;= &lt;= == !=', 'compare numbers → true/false'],
          ['text.equals("hi")', 'compare Strings'],
          ['if (...) { } else if (...) { } else { }', 'choose what runs'],
          ['n % 2 == 0', 'is n even?'],
          ['&amp;&amp;  ||  !', 'and, or, not'],
        ]) + '<p>Remember: condition in <code>( )</code>, code inside <code>{ }</code>.</p>'),
    ],
    // ------------------------------------------------------------ 4. loops
    loops: [
      page('Repeating code',
        `<p>A <b>for loop</b> repeats the code inside its curly braces. This one runs 3 times:</p><p>Change the 3 to 10 and run it again. One small change, ten times the work!</p>`,
        M('for (int i = 0; i < 3; i++) {\n    System.out.println("Hello!");\n}')),
      page('Meet i, the counter',
        `<p><code>for (int i = 0; i &lt; 5; i++)</code> has three parts, separated by semicolons:</p><ol><li><b>start</b>: <code>int i = 0</code> makes the counter</li><li><b>keep going while</b>: <code>i &lt; 5</code></li><li><b>after each loop</b>: <code>i++</code> adds 1</li></ol><p>So i is <b>0, 1, 2, 3, 4</b>. Start at 1 and use <code>&lt;=</code> to include the end number.</p>`,
        M('for (int i = 0; i < 5; i++) {\n    System.out.println("i is " + i);\n}\n\nfor (int i = 1; i <= 3; i++) {\n    System.out.println("from 1: " + i);\n}')),
      page('Counting down',
        `<p>To count backwards, start high, keep going while <code>i &gt;= 1</code>, and use <code>i--</code> to subtract 1 each time. Code after the loop's closing <code>}</code> runs once, when the loop is finished.</p>`,
        M('for (int i = 5; i >= 1; i--) {\n    System.out.println(i);\n}\nSystem.out.println("Blast off!");')),
      page('Looping through a list',
        `<p>A list in Java is usually an <code>ArrayList</code>. The <b>for-each</b> loop visits every item in it. Read the colon as "in": <i>for each String snack in snacks</i>.</p><pre>for (String snack : snacks) { ... }</pre><p>Each time around, <code>snack</code> holds the next item. (The <code>import</code> line at the top tells Java where ArrayList lives. The game's lists are ready to use, so you won't need it in terminals.)</p>`,
        M('ArrayList<String> snacks = new ArrayList<>();\nsnacks.add("apple");\nsnacks.add("cake");\nsnacks.add("pie");\n\nfor (String snack : snacks) {\n    System.out.println("I ate the " + snack);\n}', '', '', LIST_IMPORT)),
      page('while: repeat until...',
        `<p>A <b>while loop</b> repeats <b>as long as</b> its condition is true. Use it when you don't know in advance how many times you need.</p><p>Something inside the loop must eventually make the condition false — otherwise it runs <b>forever</b> (an infinite loop). Here, <code>fuel -= 1;</code> does that.</p>`,
        M('int fuel = 3;\nwhile (fuel > 0) {\n    System.out.println("Flying! fuel = " + fuel);\n    fuel -= 1;\n}\nSystem.out.println("Landed");')),
      page('Building up a total',
        `<p>A very common pattern: make a variable set to 0 <b>before</b> the loop, add to it <b>inside</b> the loop, and use it <b>after</b>.</p>`,
        M('int total = 0;\nfor (int i = 1; i <= 3; i++) {\n    total += i;\n    System.out.println("added " + i + " -> total is " + total);\n}\nSystem.out.println("Final: " + total);')),
      page('break: stop early',
        `<p><code>break;</code> jumps straight <b>out</b> of the loop, even if there are items left. Perfect for "stop when you find it".</p>`,
        M('for (int n = 1; n < 100; n++) {\n    if (n == 4) {\n        System.out.println("Found 4! Stopping.");\n        break;\n    }\n    System.out.println(n);\n}')),
      page('Cheat sheet',
        cheat([
          ['for (int i = 0; i &lt; 3; i++) { }', 'repeat 3 times (i = 0, 1, 2)'],
          ['for (int i = 1; i &lt;= 10; i++)', '1 to 10'],
          ['for (int i = 5; i &gt;= 1; i--)', '5 down to 1'],
          ['for (String x : myList)', 'each item in a list'],
          ['while (cond) { }', 'repeat while true'],
          ['total += x;', 'build up a total'],
          ['break;', 'leave the loop early'],
        ])),
    ],
    // ------------------------------------------------------------ 5. functions
    funcs: [
      page('Defining and calling',
        `<p>A <b>method</b> (Java's word for a function) is a named recipe. You write it inside <code>Main</code>, next to <code>main</code>, starting with <code>static</code>. <code>void</code> means "gives nothing back".</p><p><b>Defining</b> it only writes the recipe down — nothing happens until you <b>call</b> it from <code>main</code> by writing its name and <code>()</code>.</p>`,
        M('hello();\nhello();', 'static void hello() {\n    System.out.println("Hello!");\n}')),
      page('Parameters: giving it inputs',
        `<p>Names inside the brackets are <b>parameters</b>. Like any Java variable, each one needs a <b>type</b>: <code>String name</code>. When you call the method, the value you pass in gets stored in the parameter — like a variable that only exists inside the method.</p>`,
        M('greet("Ada");\ngreet("Linus");', 'static void greet(String name) {\n    System.out.println("Hi " + name);\n}')),
      page('return: sending an answer back',
        `<p><code>return</code> sends a value <b>back</b> to whoever called the method. Instead of <code>void</code>, write the <b>type</b> of the answer: <code>static int</code> gives back a whole number.</p><p>Printing only <i>shows</i> a value; returning <i>hands it over</i> so you can store it or use it. (We call it <code>doubleIt</code> because <code>double</code> is already a Java type name.)</p>`,
        M('int result = doubleIt(5);\nSystem.out.println(result);', 'static int doubleIt(int n) {\n    return n * 2;\n}')),
      page('Using returned values',
        `<p>A method call that returns a value can go anywhere a value can go — inside maths, inside <code>println</code>, even inside another call.</p>`,
        M('System.out.println(doubleIt(3) + doubleIt(4));\nSystem.out.println(doubleIt(doubleIt(2)));', 'static int doubleIt(int n) {\n    return n * 2;\n}')),
      page('if inside methods',
        `<p>Methods can use everything you know. <code>return</code> also <b>ends</b> the method immediately — so after the first return, the rest is skipped.</p>`,
        M('System.out.println(smaller(8, 3));\nSystem.out.println(smaller(2, 9));', 'static int smaller(int a, int b) {\n    if (a < b) {\n        return a;\n    }\n    return b;\n}')),
      page('Returning true or false',
        `<p>A comparison already <i>is</i> true or false, so you can return it directly. The return type is <code>boolean</code>. Methods like this are great inside an <code>if</code>.</p>`,
        M('System.out.println(positive(5));\nSystem.out.println(positive(-2));\nif (positive(3)) {\n    System.out.println("3 is positive");\n}', 'static boolean positive(int n) {\n    return n > 0;\n}')),
      page('Loops inside methods',
        `<p>Put a loop inside a method and you can reuse the whole loop with one call. Variables made inside a method stay inside it. Methods can take lists too: the parameter type is <code>ArrayList&lt;Integer&gt;</code> for a list of whole numbers.</p>`,
        M('countUp(3);\nSystem.out.println("again:");\ncountUp(2);', 'static void countUp(int n) {\n    for (int i = 1; i <= n; i++) {\n        System.out.println(i);\n    }\n}')),
      page('Cheat sheet',
        cheat([
          ['static void name() { }', 'define a method (inside Main)'],
          ['name();', 'call it (from main)'],
          ['static void f(int a, String b)', 'parameters, each with a type'],
          ['static int f(int n) { return n; }', 'send an answer back (and stop)'],
          ['static boolean f(...)', 'returns true or false'],
          ['System.out.println(f(2) + f(3));', 'use returned values'],
        ])),
    ],
    // ------------------------------------------------------------ 6. classes
    classes: [
      page('Blueprints and objects',
        `<p>A <b>class</b> is a blueprint. You write it <b>outside</b> <code>Main</code> (above it). Using it with <code>new</code> creates an <b>object</b>.</p><ul><li><b>Fields</b> are the object's data, declared with a type: <code>String name;</code></li><li>The <b>constructor</b> has the same name as the class and no return type. It runs automatically when the object is created, to set it up.</li><li><code>this</code> means "this object", so <code>this.name</code> is this object's own name.</li></ul><p>Read a field with a dot: <code>myDog.name</code>.</p>`,
        M('Dog myDog = new Dog();\nSystem.out.println(myDog.name);', '', 'class Dog {\n    String name;\n\n    Dog() {\n        this.name = "Rex";\n    }\n}')),
      page('Giving each object its own values',
        `<p>Give the constructor parameters, and every object can start with <b>different</b> values. One blueprint, many objects! The type of the variable is the class name: <code>Dog a = new Dog("Rex");</code></p>`,
        M('Dog a = new Dog("Rex");\nDog b = new Dog("Bella");\nSystem.out.println(a.name + " and " + b.name);', '', 'class Dog {\n    String name;\n\n    Dog(String name) {\n        this.name = name;\n    }\n}')),
      page('Methods: things objects can do',
        `<p>A <b>method</b> inside a class belongs to each object. It has a return type like any method (but no <code>static</code>), and it can use the object's own fields with <code>this</code>. Call it with a dot and brackets.</p>`,
        M('Dog rex = new Dog("Rex");\nSystem.out.println(rex.speak());', '', 'class Dog {\n    String name;\n\n    Dog(String name) {\n        this.name = name;\n    }\n\n    String speak() {\n        return this.name + " says woof!";\n    }\n}')),
      page('Methods that change things',
        `<p>Methods can <b>update</b> fields. The object remembers the new value. A method that only changes things and gives nothing back has the return type <code>void</code>.</p>`,
        M('Counter c = new Counter();\nc.click();\nc.click();\nSystem.out.println(c.count);', '', 'class Counter {\n    int count;\n\n    Counter() {\n        this.count = 0;\n    }\n\n    void click() {\n        this.count += 1;\n    }\n}')),
      page('Methods with inputs',
        `<p>Methods can take parameters too. Notice that each object keeps <b>its own</b> data — changing one doesn't change the other.</p>`,
        M('Tank big = new Tank();\nTank small = new Tank();\nbig.fill(50);\nsmall.fill(5);\nSystem.out.println(big.water + " " + small.water);', '', 'class Tank {\n    int water;\n\n    Tank() {\n        this.water = 0;\n    }\n\n    void fill(int amount) {\n        this.water += amount;\n    }\n}')),
      page('Handing objects to methods',
        `<p>Objects can be passed into methods just like numbers or text — the parameter's type is the class name. The method can read their fields and call their methods. (That's how <code>equip</code> and <code>adopt</code> will work!)</p>`,
        M('introduce(new Dog("Rex"));', 'static void introduce(Dog pet) {\n    System.out.println("This is " + pet.name);\n}', 'class Dog {\n    String name;\n\n    Dog(String name) {\n        this.name = name;\n    }\n}')),
      page('Cheat sheet',
        cheat([
          ['class Thing { }', 'make a blueprint (outside Main)'],
          ['int x;', 'a field (the object\'s data)'],
          ['Thing(int x) { this.x = x; }', 'constructor: set up a new object'],
          ['Thing t = new Thing(5);', 'create an object'],
          ['t.x', 'read a field'],
          ['String act() { }</code> / <code>t.act()', 'define / call a method'],
        ])),
    ],
    // ------------------------------------------------------------ 7. open world
    world: [
      page('Lists',
        `<p>An <code>ArrayList</code> keeps many values in order. The type in the angle brackets says what goes inside: <code>ArrayList&lt;String&gt;</code> holds text, <code>ArrayList&lt;Integer&gt;</code> holds whole numbers.</p><p>Each item has a position number called an <b>index</b> — and indexes start at <b>0</b>! Use <code>.get(i)</code> to read an item and <code>.size()</code> to count them. The last item is at <code>size() - 1</code>.</p>`,
        M('ArrayList<String> items = new ArrayList<>();\nitems.add("sword");\nitems.add("map");\nitems.add("apple");\nSystem.out.println(items.get(0));\nSystem.out.println(items.get(2));\nSystem.out.println(items.get(items.size() - 1));\nSystem.out.println(items.size());', '', '', LIST_IMPORT)),
      page('Changing lists',
        `<p>Lists can grow and shrink. <code>.add(x)</code> puts an item on the end, <code>.set(i, x)</code> replaces the item at index i, and <code>.remove(i)</code> takes out the item at index i. Printing a whole list shows it in square brackets.</p>`,
        M('ArrayList<String> items = new ArrayList<>();\nitems.add("sword");\nitems.add("shield");\nitems.add("map");\nSystem.out.println(items);\nitems.remove(0);\nSystem.out.println(items + " " + items.size());', '', '', LIST_IMPORT)),
      page('Text tools',
        `<p>Strings come with built-in methods:</p><ul><li><code>.toUpperCase()</code> / <code>.toLowerCase()</code></li><li><code>.length()</code> counts the letters (with brackets, unlike a list's <code>.size()</code>)</li><li><code>.charAt(0)</code> picks out one letter by index</li></ul><p>A <code>StringBuilder</code> is a String you can change. Its <code>.reverse()</code> flips the letters, and <code>.toString()</code> turns it back into a normal String.</p>`,
        M('String word = "hello";\nSystem.out.println(word.toUpperCase());\nSystem.out.println(word.length());\nSystem.out.println(word.charAt(0));\nSystem.out.println(new StringBuilder(word).reverse().toString());')),
      page('Dictionaries: HashMap',
        `<p>A <code>HashMap</code> stores values by <b>name</b> (a key) instead of by position. <code>HashMap&lt;String, Integer&gt;</code> maps text keys to whole numbers.</p><p>Store with <code>.put(key, value)</code> and look up with <code>.get(key)</code>.</p>`,
        M('HashMap<String, Integer> prices = new HashMap<>();\nprices.put("potion", 5);\nprices.put("map", 3);\nSystem.out.println(prices.get("potion"));\nprices.put("key", 7);\nSystem.out.println(prices.get("map") + prices.get("key"));', '', '', 'import java.util.HashMap;')),
      page('Putting it together',
        `<p>Most real problems combine ideas: <b>loop</b> through a list, use an <b>if</b> to pick items, and build up a result.</p>`,
        M('int[] nums = {3, 8, 1, 9};\nArrayList<Integer> big = new ArrayList<>();\nfor (int n : nums) {\n    if (n > 5) {\n        big.add(n);\n    }\n}\nSystem.out.println(big);', '', '', LIST_IMPORT)),
      page('Cheat sheet',
        cheat([
          ['list.get(0)', 'first item'],
          ['list.get(list.size() - 1)', 'last item'],
          ['list.size()', 'how many items'],
          ['list.add(x);', 'add to the end'],
          ['s.toUpperCase()', 'CAPITALS'],
          ['s.length()', 'number of letters'],
          ['new StringBuilder(s).reverse().toString()', 'text backwards'],
          ['map.get(key)</code> / <code>map.put(key, v);', 'look up / store by name'],
        ])),
    ],
    // ------------------------------------------------------------ 8. boss
    boss: [
      page('Your weapon: loops',
        `<p>The Compiler Cannon fires once each time you call <code>fire();</code> — but only bursts from a <b>loop</b> get through Segfault's shield. Here's the idea with printing:</p><p>If Segfault corrupts your code, read the error, find the line, fix it — just like the debugger. Look out for missing semicolons and braces!</p>`,
        M('for (int shot = 0; shot < 3; shot++) {\n    System.out.println("Pew!");\n}')),
    ],
  };

  // ================================================================ terminals
  const T = {};
  // ---- 1. printing
  T.hello = {
    desc: `<p>This old gate only opens for programmers. Every programmer's first words are <b>"Hello, World"</b>.</p>
      <p>In Java you show text with ${'<code>System.out.println("...");</code>'}. Write it inside <code>main</code>, between the inner curly braces, and don't forget the semicolon at the end.</p>`,
    starter: M('// Make the computer say hello!\n// Text goes inside quotes, like "this".\n'),
    hints: ['In Java you print with System.out.println and a pair of brackets.', 'Text has to go inside double quotes, and the line ends with a semicolon.'],
    similar: { task: 'Make the computer say "Good morning".', code: M('System.out.println("Good morning");') },
  };
  T.lines = {
    desc: `<p>Every <code>System.out.println(...)</code> puts its text on a <b>new line</b>. Computers run your code <b>from top to bottom</b>.</p>
      <p>Ring the bells in order. Print these three lines:</p><pre>Ready\nSet\nCode!</pre>`,
    starter: M('// One println per line. The first one is done for you:\nSystem.out.println("Ready");\n'),
    hints: ['Each println makes one line. You need one println per line.', 'Lines come out in the same order as your code.'],
    similar: { task: 'Print the words One, Two, Three on separate lines.', code: M('System.out.println("One");\nSystem.out.println("Two");\nSystem.out.println("Three");') },
  };
  T.textjoin = {
    desc: `<p>The <code>+</code> sign <b>glues</b> two pieces of text together into one:</p><pre>"Moon" + "light"   →   Moonlight</pre>
      <p>The smith wants to see the word <b>SuperCoder</b>, forged from the two pieces <code>"Super"</code> and <code>"Coder"</code>. Glue them with <code>+</code> inside <code>System.out.println(...)</code>.</p>`,
    starter: M('// Glue two pieces of text with +\nSystem.out.println("Super");\n'),
    hints: ['Put each piece in its own quotes, with + between them.', '+ adds no space. Check you don\'t have spaces inside the quotes.'],
    similar: { task: 'Print "Moonlight" by gluing "Moon" and "light".', code: M('System.out.println("Moon" + "light");') },
  };
  T.math = {
    desc: `<p>Text needs quotes, but <b>numbers don't</b>. Without quotes, the computer does the maths for you:</p>
      <pre>System.out.println(2 + 3);     // shows 5\nSystem.out.println("2 + 3");   // shows the text 2 + 3</pre>
      <p>Make the computer calculate <b>7 × 6</b> and <b>100 − 1</b>, printing each answer on its own line. (Use <code>*</code> to multiply and <code>-</code> to subtract — don't type the answers yourself!)</p>`,
    starter: M('// Maths works inside println:\nSystem.out.println(2 + 3);\n'),
    hints: ['Use * to multiply and - to subtract.', 'Don\'t put quotes around the maths, or it becomes text.'],
    similar: { task: 'Print the answers to 8 × 5 and 50 − 8.', code: M('System.out.println(8 * 5);\nSystem.out.println(50 - 8);') },
  };
  T.order = {
    desc: `<p>In Java, just like in maths class, <code>*</code> happens <b>before</b> <code>+</code>. Brackets <code>( )</code> change the order: the part inside them happens first.</p>
      <p>Print <b>(10 + 5) × 2</b> first, then <b>10 + 5 × 2</b> without brackets, each on its own line. Let the computer work out the answers.</p>`,
    starter: M('// Brackets are calculated first\n'),
    hints: ['Brackets make the part inside happen first.', 'You need two println lines: one with brackets, one without.'],
    similar: { task: 'Print (3 + 1) × 5 and then 3 + 1 × 5.', code: M('System.out.println((3 + 1) * 5);\nSystem.out.println(3 + 1 * 5);') },
  };
  T.sep = {
    desc: `<p>You can show text and a number on <b>one line</b> by gluing them with <code>+</code>. Java turns the number into text for you, and because <code>*</code> happens before <code>+</code>, the maths is done first:</p>
      <pre>System.out.println("Gems: " + 3 * 4);   // Gems: 12</pre>
      <p>Make the scoreboard show <b>Score: 100</b> by joining the text <code>"Score: "</code> (with a space before the closing quote) and the calculation <code>25 * 4</code>. Don't type 100 yourself!</p>`,
    starter: M('// Join text and a calculation with +\n'),
    hints: ['Put the text in quotes, then +, then the calculation without quotes.', 'The space after the colon has to be inside the quotes.'],
    similar: { task: 'Print "Gems: 12" by joining "Gems: " and the calculation 3 * 4.', code: M('System.out.println("Gems: " + 3 * 4);') },
  };
  // ---- 2. variables
  T.firstvar = {
    desc: `<p>A <b>variable</b> is a labelled box that stores a value. In Java you write the <b>type</b>, the <b>name</b>, an equals sign and the value:</p>
      <pre>String color = "blue";</pre>
      <p><code>String</code> means the box holds text. Make a variable called <code>color</code> holding your favourite colour (as text) inside <code>main</code>, then <b>print the variable</b>.</p>`,
    starter: M('// Type name = value;   (text values need quotes)\n'),
    hints: ['A text variable is made with: String, the name, =, the value in quotes, and a semicolon.', 'To print a variable, write its name inside println without quotes.'],
    similar: { task: 'Make a variable called food holding "pizza", then print it.', code: M('String food = "pizza";\nSystem.out.println(food);') },
  };
  T.types = {
    desc: `<p>Every Java variable has a <b>type</b>. Three of the most common:</p>
      <ul><li><code>String</code>: text, in quotes</li><li><code>int</code>: a whole number, no quotes</li><li><code>boolean</code>: <code>true</code> or <code>false</code>, no quotes</li></ul>
      <p>The scanner wants three variables inside <code>main</code>: <code>name</code> holding some <b>text</b>, <code>level</code> holding a <b>whole number</b>, and <code>alive</code> holding <code>true</code>.</p>`,
    starter: M('// text, number, and true/false\n'),
    hints: ['Each line starts with the type: String, int or boolean.', 'Text goes in quotes. Numbers and true do not, and true is all lowercase.'],
    similar: { task: 'Make pet holding text, age holding a whole number, and hungry holding false.', code: M('String pet = "cat";\nint age = 3;\nboolean hungry = false;\nSystem.out.println(pet + " " + age + " " + hungry);') },
  };
  T.bridge = {
    desc: `<p>You collected a variable! <code>planks</code> now holds the number <b>{planks}</b>.</p>
      <p>A variable is a <b>named box</b> that stores a value. Instead of typing the number, use the box's name. The game already made this box, so don't write <code>int</code> in front of it.</p>
      <p>Call <code>buildBridge(planks);</code> inside <code>main</code> to build a bridge over the lava.</p>`,
    starter: M('// planks is a variable you collected.\n// Print it to peek inside:\nSystem.out.println(planks);\n\n// Now build the bridge with it!\n'),
    hints: ['You collected a variable called planks. Pass it into the method.', 'Put the variable name (no quotes) inside the method\'s brackets, and end the line with a semicolon.'],
    similar: { task: 'You collected a variable called seeds. Show how many you are planting.', code: M('int seeds = 4;   // (pretend you collected this)\nSystem.out.println("Planting " + seeds + " seeds");') },
  };
  T.area = {
    desc: `<p>Variables can hold <b>numbers</b>, and you can do maths with them. You have <code>width</code> and <code>height</code> (both <code>int</code>) — they're <b>different for every test</b>, so you can't just type the answer.</p>
      <p>Make a new <code>int</code> variable called <code>area</code> that equals width times height, then print it.</p>`,
    starter: M('// width and height change for each test!\nSystem.out.println(width);\nSystem.out.println(height);\n'),
    hints: ['Make a new int variable and set it to width times height.', 'Print the new variable at the end.'],
    similar: { task: 'Given length and count, make total = length * count and print it.', code: M('int length = 6;\nint count = 2;\nint total = length * count;\nSystem.out.println(total);') },
  };
  T.update = {
    desc: `<p>Variables can <b>change</b>! You can give a variable a new value based on its old one:</p>
      <pre>score = score + 5;    // or the shortcut:  score += 5;</pre>
      <p>You have a variable <code>score</code> (different each test). <b>Add 5 to it</b>, then print it. <i>score already exists, so don't write <code>int</code> in front of it.</i></p>`,
    starter: M('// score already exists. Add 5 to it, then print it.\n'),
    hints: ['Use the old value of score to make the new one. No type in front: score already exists.', 'score += 5; is a shortcut for score = score + 5;'],
    similar: { task: 'lives starts at 3. Take away 1, then print it.', code: M('int lives = 3;\nlives = lives - 1;\nSystem.out.println(lives);') },
  };
  T.combine = {
    desc: `<p>Make a badge! You have a String <code>hero</code> and an int <code>coins</code>. Print one line like this:</p>
      <pre>Ada has 5 coins</pre>
      <p>Glue the pieces with <code>+</code>: the variable <code>hero</code>, the text <code>" has "</code>, the variable <code>coins</code>, and the text <code>" coins"</code>. Java turns the number into text for you. Tested with 3 heroes.</p>`,
    starter: M('System.out.println(hero);\nSystem.out.println(coins);\n'),
    hints: ['Glue the pieces together: hero, then " has ", then coins, then " coins".', 'Watch the spaces inside your quotes.'],
    similar: { task: 'Given pet and age, print "Rex is 3 years old".', code: M('String pet = "Rex";\nint age = 3;\nSystem.out.println(pet + " is " + age + " years old");') },
  };
  T.password = {
    desc: `<p>The lock needs the secret stored in your <code>password</code> variable (a String).</p>
      <p>The password is different for every adventurer, so don't type it — <b>print the variable</b>!</p>`,
    starter: M('// Print the variable password (no quotes around a variable name!)\n'),
    hints: ['"password" in quotes is just the word. Without quotes it\'s the variable.', 'Print the variable, not the word.'],
    similar: { task: 'Print the contents of a variable called secret.', code: M('String secret = "hidden treasure";\nSystem.out.println(secret);') },
  };
  // ---- 3. conditions
  T.compare = {
    desc: `<p>A <b>comparison</b> asks a yes/no question. The answer is a <code>boolean</code>: <code>true</code> or <code>false</code>.</p>
      <pre>System.out.println(5 > 3);   // true\nSystem.out.println(2 > 9);   // false</pre>
      <p>Comparisons: <code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code> <code>==</code> <code>!=</code></p>
      <p>Print whether <code>hp</code> is <b>greater than 50</b>. Tested with 3 values.</p>`,
    starter: M('// Print the answer to: is hp greater than 50?\n'),
    hints: ['Put the comparison itself inside println.', 'Greater than is >.'],
    similar: { task: 'Print whether gold is less than 10.', code: M('int gold = 4;\nSystem.out.println(gold < 10);') },
  };
  T.heal = {
    desc: `<p><code>if</code> runs code <b>only when</b> its condition is true. The condition goes in round brackets, and the code inside goes between curly braces:</p>
      <pre>if (hp &lt; 30) {\n    // runs only when hp is below 30\n}</pre>
      <p>If <code>hp</code> is <b>below 30</b>, call <code>heal();</code>. Otherwise do nothing. Tested with 4 values.</p>`,
    starter: M('if (hp < 30) {\n    // what goes here?\n}\n'),
    hints: ['Call the method only inside the if block.', 'Put the call between the curly braces, and end it with a semicolon.'],
    similar: { task: 'If fuel is below 20, print "Refuel!".', code: M('int fuel = 12;\nif (fuel < 20) {\n    System.out.println("Refuel!");\n}') },
  };
  T.guard = {
    desc: `<p>The guard bot lets friends in and keeps bugs out. The String <code>visitor</code> holds the name of whoever is at the gate, and <code>myName</code> holds <b>your</b> name.</p>
      <p>To compare two Strings in Java, use <code>.equals(...)</code>: <code>visitor.equals(myName)</code> is <code>true</code> when they have exactly the same letters.</p>
      <p>If the visitor is you, call <code>openGate();</code>. Otherwise call <code>soundAlarm();</code>. The bot will test your code with <b>3 different visitors</b>.</p>`,
    starter: M('// Compare Strings with .equals(...)\nif (visitor.equals(myName)) {\n    // what should happen here?\n} else {\n\n}\n'),
    hints: ['The comparison is already written for you.', 'One method goes inside the if braces, the other goes inside the else braces.'],
    similar: { task: 'If code equals "1234", print "Unlocked", otherwise print "Wrong code".', code: M('String code = "0000";\nif (code.equals("1234")) {\n    System.out.println("Unlocked");\n} else {\n    System.out.println("Wrong code");\n}') },
  };
  T.even = {
    desc: `<p><code>%</code> gives the <b>remainder</b> after dividing: <code>7 % 2</code> is 1, and <code>8 % 2</code> is 0.</p>
      <p>If <code>number % 2 == 0</code>, nothing is left over, so the number is even. Print <b>even</b> or <b>odd</b> for the int <code>number</code>, using <code>if</code> and <code>else</code>. Tested with 4 numbers.</p>`,
    starter: M('System.out.println(number % 2);\n'),
    hints: ['number % 2 is 0 for even numbers. Compare it with == 0.', 'Use if/else to choose which word to print.'],
    similar: { task: 'Print "fizz" if n can be divided by 3 with nothing left over, otherwise print "nope".', code: M('int n = 9;\nif (n % 3 == 0) {\n    System.out.println("fizz");\n} else {\n    System.out.println("nope");\n}') },
  };
  T.pump = {
    desc: `<p>The lava pump reads <code>temperature</code> and must react:</p>
      <ul><li>above <b>100</b> → <code>cool();</code></li><li>below <b>0</b> → <code>heat();</code></li><li>anything else → <code>wait();</code></li></ul>
      <p>Use <code>if</code>, <code>else if</code> and <code>else</code>, each with its own curly braces. It will be tested with 5 temperatures. Get it right and the lava turns to stone!</p>`,
    starter: M('if (temperature > 100) {\n    cool();\n}\n// add an else if for below 0...\n// ...and an else for everything else\n'),
    hints: ['There are three cases, so use if, else if and else.', '100 itself is not above 100.'],
    similar: { task: 'Print "big" if size > 10, "small" if size < 3, and "medium" otherwise.', code: M('int size = 5;\nif (size > 10) {\n    System.out.println("big");\n} else if (size < 3) {\n    System.out.println("small");\n} else {\n    System.out.println("medium");\n}') },
  };
  T.bouncer = {
    desc: `<p>Sometimes you need <b>two</b> things to be true. <code>&amp;&amp;</code> means "and": both sides must be true.</p>
      <p>Let the visitor in with <code>openGate();</code> only if <code>age</code> is <b>12 or more</b> AND <code>hasTicket</code> (a boolean) is true. Otherwise call <code>turnAway();</code>.</p>`,
    starter: M('if (age >= 12 && hasTicket) {\n\n} else {\n\n}\n'),
    hints: ['The condition is already written. Fill in the two blocks.', 'hasTicket is already true or false, so it can be used directly in the condition.'],
    similar: { task: 'Print "Ride!" only if height >= 120 and the person is not scared. Otherwise print "Next time".', code: M('int height = 130;\nboolean scared = false;\nif (height >= 120 && !scared) {\n    System.out.println("Ride!");\n} else {\n    System.out.println("Next time");\n}') },
  };
  T.orgate = {
    desc: `<p><code>||</code> means "or": the condition is true if <b>at least one</b> side is true.</p>
      <p>The String <code>weather</code> changes each test. If it is <b>"rain"</b> or <b>"snow"</b>, call <code>umbrella();</code>. Otherwise call <code>sunglasses();</code>.</p>
      <p>Each side of <code>||</code> needs its own full comparison, and Strings are compared with <code>.equals("...")</code>.</p>`,
    starter: M('if (weather.equals("rain")) {\n    umbrella();\n} else {\n    sunglasses();\n}\n'),
    hints: ['The condition needs two full comparisons joined by ||.', 'Write weather.equals(...) on both sides of the ||.'],
    similar: { task: 'Print "Weekend!" if day is "Sat" or "Sun", otherwise print "School day".', code: M('String day = "Sun";\nif (day.equals("Sat") || day.equals("Sun")) {\n    System.out.println("Weekend!");\n} else {\n    System.out.println("School day");\n}') },
  };
  // ---- 4. loops
  T.repeat = {
    desc: `<p>A <b>loop</b> repeats code. Your friend <b>i</b> counts each time it goes around:</p>
      <pre>for (int i = 0; i &lt; 3; i++) {\n    System.out.println("Hi");\n}</pre>
      <p>That prints "Hi" three times. Now make the machine print <b>Hooray!</b> 3 times — using a loop, not 3 separate println lines.</p>`,
    starter: M('for (int i = 0; i < 3; i++) {\n    System.out.println("Hi");\n}\n'),
    hints: ['The loop is already written. What text should go inside?', 'i < 3 controls how many times it repeats.'],
    similar: { task: 'Print "Jump!" 4 times using a loop.', code: M('for (int i = 0; i < 4; i++) {\n    System.out.println("Jump!");\n}') },
  };
  T.stairs = {
    desc: `<p>The cliff is 6 blocks high. <code>buildStep(n);</code> builds the step at position <code>n</code> (0 is the first step).</p>
      <p>You <i>could</i> write it 6 times... or let your friend <b>i</b> count for you with a <b>loop</b>!</p>
      <p><code>for (int i = 0; i &lt; 6; i++) { ... }</code> runs the code inside 6 times, with <code>i</code> = 0, 1, 2, 3, 4, 5.</p>`,
    starter: M('// i will count 0, 1, 2, 3, 4, 5 for you\nfor (int i = 0; i < 6; i++) {\n    System.out.println("i is " + i);\n    // build a step here!\n}\n'),
    hints: ['Call buildStep inside the loop\'s curly braces.', 'Pass i to it, because i is the number of the step.'],
    similar: { task: 'Use a loop to place lanterns 0 to 3 by printing "lantern 0", "lantern 1"...', code: M('for (int i = 0; i < 4; i++) {\n    System.out.println("lantern " + i);\n}') },
  };
  T.count = {
    desc: `<p>The counter <code>i</code> has a value you can use inside the loop! Print the numbers <b>1 to 10</b>, one per line.</p>
      <p>Start <code>i</code> at 1 and keep going while <code>i &lt;= 10</code>.</p>`,
    starter: M('for (int i = 0; i < 10; i++) {\n    System.out.println(i);\n}\n'),
    hints: ['Start i at 1 instead of 0.', 'Use <= to include the last number.'],
    similar: { task: 'Print the numbers 5 to 8.', code: M('for (int i = 5; i <= 8; i++) {\n    System.out.println(i);\n}') },
  };
  T.countdown = {
    desc: `<p>The launch pad needs a countdown! Print:</p><pre>5\n4\n3\n2\n1\nLiftoff!</pre>
      <p>Use a loop that counts <b>down</b>: start <code>i</code> at 5, keep going while <code>i &gt;= 1</code>, and use <code>i--</code> to subtract 1 each time.</p>`,
    starter: M('// Count down from 5 to 1, then print "Liftoff!"\n'),
    hints: ['Start at 5 and use i-- to go down.', 'Print Liftoff! after the loop\'s closing curly brace.'],
    similar: { task: 'Count down from 3 to 1, then print "Go!".', code: M('for (int i = 3; i >= 1; i--) {\n    System.out.println(i);\n}\nSystem.out.println("Go!");') },
  };
  T.listloop = {
    desc: `<p><code>loot</code> is a <b>list</b> (an <code>ArrayList&lt;String&gt;</code>) of treasure. Print every item on its own line.</p>
      <p>The <b>for-each</b> loop visits each item in turn: <code>for (String item : loot) { ... }</code>. Read the colon as "in". Tested with 3 different lists — one of them is empty!</p>`,
    starter: M('// loot is a list, e.g. [coin, gem, key]\nSystem.out.println(loot);\n'),
    hints: ['A for-each loop gives you one item at a time.', 'Print the loop variable inside the loop, not the whole list.'],
    similar: { task: 'Print each colour in a list of colours.', code: M('ArrayList<String> colours = new ArrayList<>();\ncolours.add("red");\ncolours.add("blue");\nfor (String c : colours) {\n    System.out.println(c);\n}', '', '', LIST_IMPORT) },
  };
  T.charge = {
    desc: `<p>The battery's <code>charge</code> starts at a different number each test. Keep calling <code>chargeUp();</code> <b>while</b> the charge is below 100.</p>
      <p>Each <code>chargeUp()</code> adds 10 to the real battery, but you have to keep count yourself: add 10 to <code>charge</code> inside the loop too, or the <code>while</code> loop never ends!</p>`,
    starter: M('while (charge < 100) {\n    chargeUp();\n    // don\'t forget to add 10 to charge!\n}\n'),
    hints: ['Inside the loop, charge has to go up, or the loop never ends.', 'charge += 10; adds 10.'],
    similar: { task: 'While water is below 50, print "pour" and add 20 to water.', code: M('int water = 0;\nwhile (water < 50) {\n    System.out.println("pour");\n    water += 20;\n}') },
  };
  T.sumloop = {
    desc: `<p>Add up all the whole numbers from <b>1 to n</b> and print the total. For n = 5 that's 1 + 2 + 3 + 4 + 5 = <b>15</b>.</p>
      <p>Make <code>total</code> 0 before the loop, add <code>i</code> to it inside the loop, and print it after the loop. Tested with 3 values of <code>n</code>.</p>`,
    starter: M('int total = 0;\nfor (int i = 1; i <= n; i++) {\n    // add i to total\n}\nSystem.out.println(total);\n'),
    hints: ['Inside the loop, add i to total.', 'Print the total after the loop has finished, not inside it.'],
    similar: { task: 'Add up 2 + 4 + 6 (the even numbers up to 6) and print the total.', code: M('int sum = 0;\nfor (int k = 2; k <= 6; k += 2) {\n    sum += k;\n}\nSystem.out.println(sum);') },
  };
  T.breakloop = {
    desc: `<p>The mine cart rolls along <code>rails</code>, a list of Strings. Print each piece as it goes, but if a piece is <b>"gap"</b>, print <b>Stop!</b> and leave the loop at once with <code>break;</code>.</p>
      <p>Compare Strings with <code>.equals("gap")</code>.</p>`,
    starter: M('for (String piece : rails) {\n    System.out.println(piece);\n}\n'),
    hints: ['Inside the loop, check if piece equals "gap" first.', 'If it is a gap, print Stop! and then break. Otherwise print the piece.'],
    similar: { task: 'Walk through a list of rooms, printing each one, but stop with "Danger!" at a "dragon".', code: M('ArrayList<String> rooms = new ArrayList<>();\nrooms.add("hall");\nrooms.add("kitchen");\nrooms.add("dragon");\nrooms.add("vault");\nfor (String r : rooms) {\n    if (r.equals("dragon")) {\n        System.out.println("Danger!");\n        break;\n    }\n    System.out.println(r);\n}', '', '', LIST_IMPORT) },
  };
  // ---- 5. functions
  T.cheer = {
    desc: `<p>A <b>method</b> is a named recipe. The method <code>cheer</code> is already written inside <code>Main</code>: it prints "Go team!".</p>
      <p>But defining a method doesn't run it! <b>Call</b> it twice from <code>main</code> by writing <code>cheer();</code>.</p>`,
    starter: M('// Call it twice below:\n', 'static void cheer() {\n    System.out.println("Go team!");\n}'),
    hints: ['Defining a method does not run it. You have to call it.', 'Calling it means writing its name followed by () and a semicolon, inside main.'],
    similar: { task: 'Call a method named clap three times.', code: M('clap();\nclap();\nclap();', 'static void clap() {\n    System.out.println("clap!");\n}') },
  };
  T.echo = {
    desc: `<p>Methods can take inputs, called <b>parameters</b>. Each parameter has a type: <code>static void echo(String word)</code> takes one String called <code>word</code>.</p>
      <p>Finish <code>echo</code> so it prints <code>word</code> <b>twice</b>, on two lines. It will be tested with different words.</p>`,
    starter: M('echo("hello");\n', 'static void echo(String word) {\n    // print word two times\n}'),
    hints: ['word works like a variable inside the method.', 'Print word, not "word" in quotes, two times.'],
    similar: { task: 'Write shout(word) that prints the word followed by "!!!".', code: M('shout("hey");', 'static void shout(String word) {\n    System.out.println(word + "!!!");\n}') },
  };
  T.double = {
    desc: `<p>A method can <b>return</b> an answer. Instead of <code>void</code>, write the type of the answer: <code>static int</code> means it gives back a whole number.</p>
      <p>Finish the method <code>doubleIt</code> so it takes an int <code>n</code> and returns <code>n * 2</code>. (It isn't called <code>double</code> because that word is already a Java type.) The forge will test it with several numbers, then build the bridge.</p>`,
    starter: M('System.out.println(doubleIt(4));  // should be 8\n', 'static int doubleIt(int n) {\n    // give back n times 2\n    return 0;\n}'),
    hints: ['Use return, not println.', 'Return n multiplied by something.'],
    similar: { task: 'Write triple(n) that returns n times 3.', code: M('System.out.println(triple(4));', 'static int triple(int n) {\n    return n * 3;\n}') },
  };
  T.square = {
    desc: `<p>Returned values can be used in maths! Finish <code>static int square(int n)</code> so it returns <code>n * n</code>.</p>
      <p>Then, in <code>main</code>, print <code>square(3) + square(4)</code> (which should be 9 + 16 = 25).</p>`,
    starter: M('// print square(3) + square(4) here\n', 'static int square(int n) {\n    // return n times n\n    return 0;\n}'),
    hints: ['First make square return n * n.', 'Then print the two calls added together.'],
    similar: { task: 'Write half(n) returning n / 2.0, then print half(10) + half(4).', code: M('System.out.println(half(10) + half(4));', 'static double half(int n) {\n    return n / 2.0;\n}') },
  };
  T.greet = {
    desc: `<p>This door only opens for well-mannered code. Finish <code>static String greet(String name)</code> so it returns a greeting like this:</p>
      <pre>greet("Ada")  →  "Hello, Ada!"</pre>
      <p>Glue the text and the parameter together with <code>+</code>.</p>`,
    starter: M('System.out.println(greet("Ada"));\n', 'static String greet(String name) {\n    return "Hello";\n}'),
    hints: ['Glue "Hello, " and name and "!" together, and return the result.', 'Watch the comma, the space and the exclamation mark.'],
    similar: { task: 'Write bye(name) that returns "Goodbye, NAME."', code: M('System.out.println(bye("Ada"));', 'static String bye(String name) {\n    return "Goodbye, " + name + ".";\n}') },
  };
  T.evenfn = {
    desc: `<p>Write a method that answers a yes/no question. <code>static boolean even(int n)</code> should return <code>true</code> if <code>n</code> is even and <code>false</code> if it is odd.</p>
      <p>A comparison like <code>n % 2 == 0</code> already <i>is</i> true or false, so you can return it directly.</p>`,
    starter: M('System.out.println(even(4));\n', 'static boolean even(int n) {\n    // return true or false\n    return false;\n}'),
    hints: ['n % 2 == 0 is already true or false. You can return it directly.', 'Return the value, not text in quotes.'],
    similar: { task: 'Write big(n) that returns whether n is over 100.', code: M('System.out.println(big(500));', 'static boolean big(int n) {\n    return n > 100;\n}') },
  };
  T.total = {
    desc: `<p>Write a method <code>total</code> that takes a <b>list</b> of whole numbers (an <code>ArrayList&lt;Integer&gt;</code>) and returns their sum.</p>
      <pre>total([1, 2, 3])  →  6\ntotal([])         →  0</pre>
      <p>Methods + loops = power. Start a running total at 0 and add each number.</p>`,
    starter: M('ArrayList<Integer> nums = new ArrayList<>();\nnums.add(1);\nnums.add(2);\nnums.add(3);\nSystem.out.println(total(nums));\n',
      'static int total(ArrayList<Integer> nums) {\n    int result = 0;\n    for (int n : nums) {\n        // add n to result\n    }\n    return result;\n}', '', LIST_IMPORT),
    hints: ['result += n; adds n to result.', 'The return line is already there. Only the inside of the loop is missing.'],
    similar: { task: 'Write countLong(words) that returns how many words are longer than 3 letters.', code: M('ArrayList<String> words = new ArrayList<>();\nwords.add("hi");\nwords.add("hello");\nwords.add("hey");\nwords.add("world");\nSystem.out.println(countLong(words));',
      'static int countLong(ArrayList<String> words) {\n    int count = 0;\n    for (String w : words) {\n        if (w.length() > 3) {\n            count += 1;\n        }\n    }\n    return count;\n}', '', LIST_IMPORT) },
  };
  T.biggest = {
    desc: `<p>Finish <code>static int biggest(int a, int b)</code> so it returns the <b>bigger</b> of the two numbers. If they are equal, return either one.</p>
      <p>Remember: <code>return</code> ends the method straight away, so the line after the <code>if</code> only runs when <code>a</code> was <i>not</i> bigger.</p>`,
    starter: M('System.out.println(biggest(3, 9));\n', 'static int biggest(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    // what if a is not bigger?\n    return 0;\n}'),
    hints: ['If a is not bigger, what should you return instead?', 'Change the last return line.'],
    similar: { task: 'Write smallest(a, b) that returns the smaller number.', code: M('System.out.println(smallest(4, 9));', 'static int smallest(int a, int b) {\n    if (a < b) {\n        return a;\n    }\n    return b;\n}') },
  };
  // ---- 6. classes
  T.crate = {
    desc: `<p>A <b>class</b> is a blueprint. The <code>Crate</code> class is written for you: it has a field <code>contents</code> that its constructor sets to "golden key".</p>
      <p>In <code>main</code>, create an object from the blueprint with <code>new</code>:</p><pre>Crate myCrate = new Crate();</pre>
      <p>Then print the object's <code>contents</code> field, using a dot.</p>`,
    starter: M('// 1. Make an object:   Crate myCrate = new Crate();\n// 2. Print its contents\n', '', 'class Crate {\n    String contents;\n\n    Crate() {\n        this.contents = "golden key";\n    }\n}'),
    hints: ['Create the object first with new ClassName().', 'Then read the field with a dot: object.contents'],
    similar: { task: 'Make a Chest object and print its gold field.', code: M('Chest myChest = new Chest();\nSystem.out.println(myChest.gold);', '', 'class Chest {\n    int gold;\n\n    Chest() {\n        this.gold = 50;\n    }\n}') },
  };
  T.potion = {
    desc: `<p>The <code>Potion</code> class stores an <code>int power</code>. Finish its method <code>describe()</code> so it returns text like <b>Potion of power 3</b>, using the object's own <code>this.power</code>.</p>
      <p>Then <code>brew(...)</code> a <b>second</b> potion with a different power. Make it with <code>new Potion(8)</code>.</p>`,
    starter: M('brew(new Potion(3));\n// brew a second, stronger potion\n', '', 'class Potion {\n    int power;\n\n    Potion(int power) {\n        this.power = power;\n    }\n\n    String describe() {\n        return "...";   // use this.power here\n    }\n}'),
    hints: ['describe should glue "Potion of power " and this.power together.', 'Call brew a second time with a different number.'],
    similar: { task: 'A Shield class stores strength, and label() returns "Shield +STRENGTH".', code: M('System.out.println(new Shield(2).label());\nSystem.out.println(new Shield(5).label());', '', 'class Shield {\n    int strength;\n\n    Shield(int strength) {\n        this.strength = strength;\n    }\n\n    String label() {\n        return "Shield +" + this.strength;\n    }\n}') },
  };
  T.lamp = {
    desc: `<p>The <code>Lamp</code> has a <code>boolean on</code> field and a <code>status()</code> method. Finish <code>toggle()</code> so it flips <code>this.on</code>: true becomes false, false becomes true.</p>
      <p><code>!</code> means "not", so <code>!this.on</code> is the opposite of the current value. The code in <code>main</code> should then print <b>off</b>, <b>on</b>, <b>off</b>.</p>`,
    starter: M('Lamp lamp = new Lamp();\nSystem.out.println(lamp.status());\nlamp.toggle();\nSystem.out.println(lamp.status());\nlamp.toggle();\nSystem.out.println(lamp.status());\n', '',
      'class Lamp {\n    boolean on;\n\n    Lamp() {\n        this.on = false;\n    }\n\n    String status() {\n        if (this.on) {\n            return "on";\n        }\n        return "off";\n    }\n\n    void toggle() {\n        // flip this.on\n    }\n}'),
    hints: ['toggle should set this.on to the opposite of what it is now.', '!true is false.'],
    similar: { task: 'A Door class has a method that flips its open field between true and false.', code: M('Door d = new Door();\nd.flip();\nSystem.out.println(d.open);', '', 'class Door {\n    boolean open;\n\n    Door() {\n        this.open = false;\n    }\n\n    void flip() {\n        this.open = !this.open;\n    }\n}') },
  };
  T.wallet = {
    desc: `<p>Every object keeps <b>its own</b> data. Finish the <code>Wallet</code> method <code>add(int amount)</code> so it increases <code>this.coins</code> by <code>amount</code>.</p>
      <p>The code in <code>main</code> fills two different wallets, so it should print <b>15</b> and then <b>3</b>.</p>`,
    starter: M('Wallet mine = new Wallet();\nmine.add(5);\nmine.add(10);\nSystem.out.println(mine.coins);\n\nWallet yours = new Wallet();\nyours.add(3);\nSystem.out.println(yours.coins);\n', '',
      'class Wallet {\n    int coins;\n\n    Wallet() {\n        this.coins = 0;\n    }\n\n    void add(int amount) {\n        // increase this.coins by amount\n    }\n}'),
    hints: ['Inside add, change this.coins.', 'Use += with the amount parameter.'],
    similar: { task: 'A Health class has a method damage(amount) that lowers its hp field.', code: M('Health h = new Health();\nh.damage(3);\nSystem.out.println(h.hp);', '', 'class Health {\n    int hp;\n\n    Health() {\n        this.hp = 10;\n    }\n\n    void damage(int amount) {\n        this.hp -= amount;\n    }\n}') },
  };
  T.forge = {
    desc: `<p>A <b>class</b> is a blueprint. From one blueprint you can make many <b>objects</b>.</p>
      <p>Design a weapon class with a <code>String name</code> and an <code>int damage</code> (from 1 to 5). Then create one with <code>new</code> and <code>equip(...)</code> it!</p>
      <p>Bonus: give it a method like <code>String swing()</code> that returns a battle cry.</p>`,
    starter: M('// Create a Sword object from the blueprint, then equip it\nSword mySword = new Sword();\n', '',
      'class Sword {\n    String name;\n    int damage;\n\n    Sword() {\n        this.name = "Byte Blade";\n        this.damage = 3;\n    }\n\n    String swing() {\n        return "Slash!";\n    }\n}'),
    hints: ['The class is already written, and so is the object.', 'Pass the object into equip(...).'],
    similar: { task: 'Make a Shield class with a name and armor, create one, and print its name.', code: M('Shield myShield = new Shield();\nSystem.out.println(myShield.name);', '', 'class Shield {\n    String name;\n    int armor;\n\n    Shield() {\n        this.name = "Pot Lid";\n        this.armor = 2;\n    }\n}') },
  };
  T.den = {
    desc: `<p>Lonely? Write a class for a <b>pet</b>! It needs a <code>String name</code> and a method <code>String speak()</code> that returns what it says.</p>
      <p>Optionally add a <code>species</code> like "cat", "dog", "bird", "slime" or "robot". Then <code>adopt(...)</code> your pet!</p>`,
    starter: M('// Make a pet object (pick your own name!)\nPet buddy = new Pet("Pixel", "cat");\n', '',
      'class Pet {\n    String name;\n    String species;\n\n    Pet(String name, String species) {\n        this.name = name;\n        this.species = species;\n    }\n\n    String speak() {\n        return "...";\n    }\n}'),
    hints: ['speak must return some text your pet says (not "...").', 'Pass your pet object into adopt(...).'],
    similar: { task: 'Make a Robot class whose beep() method returns "Beep boop!", and print it.', code: M('Robot r = new Robot("Bolt");\nSystem.out.println(r.beep());', '', 'class Robot {\n    String name;\n\n    Robot(String name) {\n        this.name = name;\n    }\n\n    String beep() {\n        return "Beep boop!";\n    }\n}') },
  };
  // ---- 7. open world
  T.gems = {
    desc: `<p><code>gems</code> is a <b>list</b> of gem sizes (an <code>ArrayList&lt;Integer&gt;</code>). Deposit only the <b>big</b> ones: call <code>deposit(gem);</code> for every gem <b>bigger than 5</b>, in order.</p>
      <p>Loop over the list and use an <code>if</code> inside. Tested with 3 different lists.</p>`,
    starter: M('// gems is a list, e.g. [3, 8, 1, 9, 6]\nfor (int gem : gems) {\n\n}\n'),
    hints: ['Use an if inside the loop.', 'Call deposit only when the gem is bigger than 5.'],
    similar: { task: 'Print every score in a list that is at least 50.', code: M('int[] scores = {30, 75, 50, 10};\nfor (int s : scores) {\n    if (s >= 50) {\n        System.out.println(s);\n    }\n}') },
  };
  T.decoder = {
    desc: `<p>The message in <code>secret</code> was written in a mirror — it's <b>backwards</b>! Print it the right way around.</p>
      <pre>secret = "olleh"   →   prints  hello</pre>
      <p>A <code>StringBuilder</code> has a <code>.reverse()</code> method: <code>new StringBuilder(text).reverse().toString()</code> gives the text backwards. Or build a new String with a loop that walks from the last letter (<code>charAt</code>) to the first.</p>`,
    starter: M('// secret is a backwards String\nSystem.out.println(secret);\n'),
    hints: ['Make a StringBuilder from secret, reverse it, and turn it back into a String.', 'Or loop from secret.length() - 1 down to 0 and add each charAt to a new String.'],
    similar: { task: 'Print the word "stressed" backwards.', code: M('String word = "stressed";\nSystem.out.println(new StringBuilder(word).reverse().toString());') },
  };
  T.fib = {
    desc: `<p>The vault opens with the <b>Fibonacci sequence</b>: start with 0 and 1, and each next number is the sum of the two before it.</p>
      <pre>0, 1, 1, 2, 3, 5, 8, 13, ...</pre>
      <p>Print the first <code>n</code> numbers (one per line). Tested with n = 5, 8 and 1. Tip: to move both variables along, save <code>a + b</code> in a third variable first, then update <code>a</code> and <code>b</code>.</p>`,
    starter: M('int a = 0;\nint b = 1;\n// print the first n Fibonacci numbers\n'),
    hints: ['Loop n times. Each time, print a, then work out the next pair.', 'The next a is the old b. The next b is a + b. Keep a + b in a spare variable before changing a.'],
    similar: { task: 'Print the first 5 powers of 2: 1, 2, 4, 8, 16.', code: M('int x = 1;\nfor (int i = 0; i < 5; i++) {\n    System.out.println(x);\n    x = x * 2;\n}') },
  };
  T.fizz = {
    desc: `<p>An ancient programmer ritual. Print the numbers <b>1 to 15</b>, but:</p>
      <ul><li>multiples of 3 → <b>Fizz</b></li><li>multiples of 5 → <b>Buzz</b></li><li>multiples of both → <b>FizzBuzz</b></li></ul>
      <p><code>%</code> gives the remainder: <code>9 % 3</code> is 0, so 9 is a multiple of 3.</p>`,
    starter: M('for (int i = 1; i <= 15; i++) {\n    System.out.println(i);\n}\n'),
    hints: ['Check for multiples of 15 first, then 3, then 5.', 'Use else if so only one line is printed for each number.'],
    similar: { task: 'Print 1 to 6, but print "Even" instead of the number for even numbers.', code: M('for (int i = 1; i <= 6; i++) {\n    if (i % 2 == 0) {\n        System.out.println("Even");\n    } else {\n        System.out.println(i);\n    }\n}') },
  };
  T.merchant = {
    desc: `<p>The merchant keeps prices in a <b>dictionary</b>: <code>prices</code> is a <code>HashMap&lt;String, Integer&gt;</code> that maps item names to costs. <code>cart</code> is a list of item names.</p>
      <p>Print the <b>total cost</b> of everything in the cart. Look up a price with <code>prices.get("potion")</code>.</p>`,
    starter: M('// prices = {potion=5, shield=12, ...}\n// cart = [potion, potion, ...]\n'),
    hints: ['Make a total of 0 and loop over cart.', 'For each item, look up its price with prices.get and add it to the total.'],
    similar: { task: 'Add up the ages in a HashMap for the names in a list.', code: M('HashMap<String, Integer> ages = new HashMap<>();\nages.put("ana", 10);\nages.put("bo", 12);\nString[] names = {"ana", "bo"};\nint sum = 0;\nfor (String who : names) {\n    sum += ages.get(who);\n}\nSystem.out.println(sum);', '', '', 'import java.util.HashMap;') },
  };
  T.backpack = {
    desc: `<p><code>inventory</code> is an <code>ArrayList&lt;String&gt;</code>. Print three lines:</p>
      <ol><li>the <b>first</b> item</li><li>the <b>last</b> item</li><li><b>how many</b> items there are</li></ol>
      <p>Use <code>.get(index)</code> to read an item (the first is at index 0) and <code>.size()</code> to count them.</p>`,
    starter: M('// inventory is a list, e.g. [sword, map, apple]\nSystem.out.println(inventory);\n'),
    hints: ['The first item is at index 0.', 'The last item is at index size() - 1, and .size() gives how many there are.'],
    similar: { task: 'From a list of planets, print the second one and the number of planets.', code: M('ArrayList<String> planets = new ArrayList<>();\nplanets.add("Mercury");\nplanets.add("Venus");\nplanets.add("Earth");\nSystem.out.println(planets.get(1));\nSystem.out.println(planets.size());', '', '', LIST_IMPORT) },
  };
  T.crier = {
    desc: `<p>The town crier SHOUTS everything. Print the String <code>message</code> in <b>capital letters</b>, followed by <b>!</b></p>
      <pre>message = "hello"   →   HELLO!</pre>
      <p>Strings have a method <code>.toUpperCase()</code>, and <code>+</code> glues on the "!".</p>`,
    starter: M('// message changes for each test\nSystem.out.println(message);\n'),
    hints: ['Strings have a .toUpperCase() method.', 'Glue "!" onto the end with +.'],
    similar: { task: 'Print a name in lowercase followed by "?".', code: M('String who = "ADA";\nSystem.out.println(who.toLowerCase() + "?");') },
  };
  T.bag = {
    desc: `<p><code>bag</code> is an <code>ArrayList&lt;String&gt;</code>. Put a <b>"potion"</b> in it with <code>.add(...)</code>, then print two lines:</p>
      <ol><li>how many items are in the bag now (<code>.size()</code>)</li><li>the last item in the bag</li></ol>`,
    starter: M('// bag is a list, e.g. [rope, torch]\nSystem.out.println(bag);\n'),
    hints: ['.add puts an item on the end of a list.', 'Then print bag.size(), and after that the item at index size() - 1.'],
    similar: { task: 'Add "bread" to a shopping list, then print the list.', code: M('ArrayList<String> shopping = new ArrayList<>();\nshopping.add("milk");\nshopping.add("bread");\nSystem.out.println(shopping);', '', '', LIST_IMPORT) },
  };
  // ---- 8. boss
  T.cannon = {
    desc: `<p>Each call to <code>fire();</code> launches a compiled blast at Segfault. The cannon only accepts <b>burst fire from a loop</b> — up to <b>5 shots</b> per run.</p>
      <p>After firing, it needs time to recharge. Watch out — Segfault may <b>corrupt your cannon code</b>! If it does, debug it before firing again.</p>`,
    starter: M('// Fire a burst!\nfor (int shot = 0; shot < 5; shot++) {\n    fire();\n}\n'),
    hints: ['Call fire() inside a loop.', 'Each run can fire up to 5 shots.'],
    similar: { task: 'Print "Pew!" 5 times with a loop.', code: M('for (int shot = 0; shot < 5; shot++) {\n    System.out.println("Pew!");\n}') },
  };

  // ================================================================ glitch snippets
  const snippets = {
    syntax: [
      { code: M('System.out.println("Jump power restored!")'), expect: 'Jump power restored!', hint: 'Every command ends with a semicolon.' },
      { code: 'public class Main {\n    public static void main(String[] args) {\n        if (true) {\n            System.out.println("Legs online");\n    }\n}\n', expect: 'Legs online', hint: 'Count the curly braces: every { needs a matching }.' },
      { code: M('String message = "Spring loaded;\nSystem.out.println(message);'), expect: 'Spring loaded', hint: 'A String needs a closing quote.' },
      { code: M('for (int n = 0; n < 3; n++ {\n    System.out.println(n);\n}'), expect: '0\n1\n2', hint: 'The round bracket after the for loop parts is missing.' },
    ],
    name: [
      { code: M('String direction = "forward";\nSystem.out.println(directon);'), expect: 'forward' },
      { code: M('System.out.prinln("Left is left again");'), expect: 'Left is left again' },
      { code: M('System.out.println(trun());', 'static String turn() {\n    return "right";\n}'), expect: 'right' },
      { code: M('int Score = 10;\nSystem.out.println(score);'), expect: '10', hint: 'Java cares about capitals: Score and score are different names.' },
    ],
    type: [
      { code: M('int speed = "8";\nSystem.out.println("Speed: " + speed);'), expect: 'Speed: 8', hint: 'An int box holds a number, not text in quotes.' },
      { code: M('String boost = 5;\nSystem.out.println(boost);'), expect: '5', hint: 'A String box holds text, so the value needs quotes.' },
      { code: M('boolean ready = "true";\nSystem.out.println(ready);'), expect: 'true', hint: 'A boolean is true or false without quotes.' },
      { code: M('System.out.println(run());', 'static int run(int steps) {\n    return steps * 2;\n}'), expect: '20', hint: 'run() needs a number of steps — 10 should do it.' },
    ],
  };

  GD.addLanguageContent('java', { intro, tutorials, terminals: T, snippets });
})(typeof window !== 'undefined' ? window : globalThis);
