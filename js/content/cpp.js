/* CodeQuest — C++ course content (descriptions, starters, tutorials, hints, similar examples, glitches).
 * Runs on js/clike.js with dialect 'cpp'. Every program is a full C++ program:
 *   #include lines, using namespace std;, functions/classes, then int main() { ... return 0; }
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- helpers
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const c = (s) => `<code>${esc(s)}</code>`;
  const block = (s) => `<pre>${esc(s)}</pre>`;
  // includes are picked from what the program uses
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
  // prog(body of main, code above main)
  function prog(body, above) {
    const top = above ? above.trim() + '\n\n' : '';
    return `${includes(top + body)}\nusing namespace std;\n\n${top}int main() {\n${indent(body.replace(/^\n+|\n+$/g, ''))}\n    return 0;\n}\n`;
  }
  const P = prog;

  // ---------------------------------------------------------------- level intros (the story page)
  const intro = {
    hello: '<p>Welcome to <b>Syntaxia</b>, a world built from code, and slowly being eaten by <b>bugs</b>.</p><p>You are a Coder. In this world, you change things by writing <b>programs</b>. You chose <b>C++</b>, the language many game engines are built with. It is fast and strict: it wants every line written just right, and it will tell you exactly when something is off.</p><p>Your first program is only two words long...</p>',
    vars: '<p>A <b>variable</b> is a named box that holds a value. In C++ every box also has a <b>type</b> that says what kind of value fits inside:</p>' +
      block('int planks = 7;\nstring name = "Ada";') +
      '<p>In Syntaxia, objects you pick up become variables you can use in your code! Collect the glowing boxes.</p>',
    ifs: '<p>Code can make <b>decisions</b> with ' + c('if') + ':</p>' +
      block('if (hp < 3) {\n    cout << "Heal!" << endl;\n} else if (hp == 3) {\n    cout << "Okay" << endl;\n} else {\n    cout << "Strong!" << endl;\n}') +
      '<p>The condition goes in <b>( round brackets )</b> and the code that belongs inside the if goes between <b>{ curly braces }</b>.</p><p><b>Bugs</b> live here. Jump on them to squash them. If one bites you, it puts an <b>error in your code</b>!</p>',
    loops: '<p>A <b>loop</b> repeats code so you don\'t have to:</p>' +
      block('for (int i = 0; i < 3; i++) {\n    cout << i << endl;   // 0, 1, 2\n}') +
      '<p>That little <b>i</b> is the loop\'s counter... Legend says a tiny creature named <b>i</b> lives in these caves. Maybe you\'ll find them!</p>',
    funcs: '<p>A <b>function</b> is a named recipe. Write it once above ' + c('main') + ', use it as often as you like:</p>' +
      block('int square(int x) {\n    return x * x;\n}\n\nint main() {\n    cout << square(4) << endl;   // 16\n    return 0;\n}') +
      '<p>The ' + c('int') + ' in front says what type of answer the function gives back, and ' + c('return') + ' sends that answer back to whoever called the function.</p>',
    classes: '<p>A <b>class</b> is a blueprint for making objects. Each object gets its own data (<b>attributes</b>) and abilities (<b>methods</b>):</p>' +
      block('class Dog {\npublic:\n    string name;\n    Dog(string n) {\n        name = n;\n    }\n    string speak() {\n        return "Woof!";\n    }\n};\n\nDog rex("Rex");\ncout << rex.speak() << endl;') +
      '<p>Forge a <b>weapon</b> or adopt a <b>pet</b>, or both. Finish this level to unlock <b>skill points</b> and the <b>open world</b>.</p>',
    world: '<p>You know the basics now, and the whole map is open.</p><ul><li>Find the <b>3 Core terminals</b> to open the gate to the Bug King\'s lair.</li><li>Earn <b>skill points</b> from cores, side quests and squashing bugs (1 SP per 3 bugs).</li><li>Spend them at the <b>Skill Shrine</b> (or press K).</li></ul><p>Out here the game hands you <b>vectors</b> (lists), <b>strings</b> and a <b>map</b>. The tutorial shows the tools for each.</p>',
    boss: '<p>The source of all the bugs. <b>Segfault</b> has corrupted the core of Syntaxia.</p><p>Use the <b>Compiler Cannon</b> terminal to blast it with loops. Hit it with your weapon when it swoops low. Jump on its head if you dare.</p><p>It will throw <b>errors</b> at you and corrupt your code. When that happens, read the error and fix it.</p>',
  };

  // ---------------------------------------------------------------- tutorials (pages after the story)
  const page = (title, body, code, opt) => Object.assign({ title, body, code: code === undefined ? null : code }, opt || {});
  const tutorials = {
    // ------------------------------------------------ 1. printing
    hello: [
      page('The shape of a C++ program',
        '<p>Every C++ program has the same frame around it:</p><ul><li>' + c('#include <iostream>') + ' brings in the tools for showing text</li><li>' + c('using namespace std;') + ' lets you write ' + c('cout') + ' instead of ' + c('std::cout') + '</li><li>' + c('int main() { ... }') + ' is where the program <b>starts</b>. Your code goes between its curly braces.</li><li>' + c('return 0;') + ' at the end means "finished, all good".</li></ul><p>Press <b>Run</b>. Then change the words and run it again. This box is yours to play with.</p>',
        P('cout << "Hi there!" << endl;')),
      page('Your first command: cout',
        '<p>' + c('cout') + ' (say "see-out") is the screen. The arrows ' + c('<<') + ' push things onto it. ' + c('endl') + ' means "end the line", so the next thing appears on a new line.</p><p>Every statement ends with a <b>semicolon</b> ' + c(';') + ', like a full stop at the end of a sentence.</p>',
        P('cout << "I am learning C++" << endl;\ncout << "and it is fun" << endl;')),
      page('Text needs quotes',
        '<p>Text (programmers call it a <b>string</b>) must be wrapped in double quotes ' + c('"like this"') + '. Without quotes the computer thinks the words are names of things, and gets confused.</p><p>Run this. The second line causes an <b>error</b>. Fix it by adding quotes, then run again.</p>',
        P('cout << "I am text" << endl;\ncout << I am not text << endl;'), { expectError: true }),
      page('Do not forget the ;',
        '<p>C++ is strict: a missing semicolon is an error, and the program won\'t run at all. The error usually points at the line <b>after</b> the one that is missing it.</p><p>Run it, read the error, add the missing ' + c(';') + ' and run again.</p>',
        P('cout << "Line one" << endl\ncout << "Line two" << endl;'), { expectError: true }),
      page('Top to bottom',
        '<p>Code runs <b>one line at a time, from top to bottom</b>. Each ' + c('endl') + ' finishes a line of output.</p><p>Try swapping two lines and see how the output changes. Then try removing an ' + c('endl') + ' and see what happens.</p>',
        P('cout << "1. Wake up" << endl;\ncout << "2. Write code" << endl;\ncout << "3. Save the world" << endl;')),
      page('Gluing text with +',
        '<p>The ' + c('+') + ' sign <b>glues</b> strings together. It doesn\'t add spaces for you: if you want a space, put it inside the quotes.</p><p>One C++ rule: two plain quoted texts can\'t be glued directly. The chain has to start with a real C++ ' + c('string') + ', so wrap the first piece: ' + c('string("Code")') + '. Then glue the rest onto it.</p>',
        P('cout << string("Code") + "Quest" << endl;\ncout << string("Code ") + "Quest" << endl;\ncout << string("Ha") + "Ha" + "Ha" << endl;')),
      page('Numbers and maths',
        '<p>Numbers <b>don\'t</b> use quotes. Without quotes, the computer does the maths for you:</p><ul><li>' + c('+') + ' add &nbsp; ' + c('-') + ' subtract</li><li>' + c('*') + ' multiply &nbsp; ' + c('/') + ' divide</li></ul><p>Watch out: dividing two <b>whole numbers</b> gives a whole number, so ' + c('9 / 2') + ' is ' + c('4') + '. Write ' + c('9.0 / 2') + ' to get ' + c('4.5') + '. And with quotes, ' + c('"2 + 3"') + ' is just text.</p>',
        P('cout << 2 + 3 << endl;\ncout << 10 - 4 << endl;\ncout << 6 * 7 << endl;\ncout << 9 / 2 << endl;\ncout << 9.0 / 2 << endl;\ncout << "2 + 3" << endl;')),
      page('Brackets go first',
        '<p>Like in maths class, ' + c('*') + ' and ' + c('/') + ' happen <b>before</b> ' + c('+') + ' and ' + c('-') + '. Brackets ' + c('( )') + ' happen before everything.</p><p>Same numbers, different answers:</p>',
        P('cout << 2 + 3 * 4 << endl;\ncout << (2 + 3) * 4 << endl;')),
      page('Several values at once',
        '<p>You can chain as many values as you like with ' + c('<<') + ', and mix text and numbers. Unlike some languages, C++ adds <b>no spaces</b> between them, so put any spaces inside the quotes.</p>',
        P('cout << "Level " << 1 << endl;\ncout << "Gems: " << 3 * 4 << endl;\ncout << "I am " << 12 << " years old" << endl;')),
      page('Cheat sheet',
        '<table class="cheat"><tr><td>' + c('int main() { ... }') + '</td><td>your code goes inside main</td></tr><tr><td>' + c('cout << "Hi" << endl;') + '</td><td>show text, then end the line</td></tr><tr><td>' + c(';') + '</td><td>ends every statement</td></tr><tr><td>' + c('"text"') + '</td><td>text needs double quotes</td></tr><tr><td>' + c('string("a") + "b"') + '</td><td>glue text: ' + c('ab') + '</td></tr><tr><td>' + c('2 + 3 * 4') + '</td><td>maths (no quotes): 14</td></tr><tr><td>' + c('(2 + 3) * 4') + '</td><td>brackets first: 20</td></tr><tr><td>' + c('cout << "Lv " << 1') + '</td><td>chain values: ' + c('Lv 1') + '</td></tr></table><p>Each terminal in this level practises one of these. You can reopen this tutorial any time with the <b>Tutorial</b> button.</p>'),
    ],
    // ------------------------------------------------ 2. variables
    vars: [
      page('Making a variable',
        '<p>A <b>variable</b> is a labelled box that stores a value so you can use it later. In C++ you write the box\'s <b>type</b> first, then its name, then ' + c('=') + ' and the value:</p>' + block('string name = "Ada";') + '<p>The ' + c('=') + ' sign means <b>"store this in the box"</b>. It is not the maths "equals".</p>',
        P('string name = "Ada";\ncout << name << endl;')),
      page('The name vs. the text',
        '<p>Without quotes, ' + c('color') + ' means <b>"look inside the box called color"</b>. With quotes, ' + c('"color"') + ' is just the word itself.</p><p>Run it and compare the two lines.</p>',
        P('string color = "red";\ncout << color << endl;\ncout << "color" << endl;')),
      page('Kinds of values',
        '<p>Each box has a <b>type</b>, and only that kind of value fits inside:</p><ul><li>' + c('string') + ': text in quotes, ' + c('"Ada"') + '</li><li>' + c('int') + ': a whole number, ' + c('5') + '</li><li>' + c('double') + ': a number with a decimal point, ' + c('2.5') + '</li><li>' + c('bool') + ': ' + c('true') + ' or ' + c('false') + ', a yes/no value</li></ul><p>C++ shows ' + c('true') + ' as ' + c('1') + ' unless you print ' + c('boolalpha') + ' first. And careful: ' + c('"5"') + ' in quotes is <i>text</i>, so ' + c('int level = "5";') + ' is an error.</p>',
        P('string name = "Ada";\nint level = 5;\ndouble speed = 2.5;\nbool alive = true;\ncout << name << " " << level << " " << speed << " " << alive << endl;\ncout << boolalpha << alive << endl;')),
      page('Maths with variables',
        '<p>You can do maths with the values inside boxes, and store the answer in a <b>new</b> box.</p><p>Change ' + c('width') + ' and run again: the area updates automatically. That\'s the power of variables!</p>',
        P('int width = 4;\nint height = 3;\nint area = width * height;\ncout << area << endl;')),
      page('Changing a variable',
        '<p>A box can get a <b>new value</b>. This line reads the old score, adds 5, and stores the result back in the same box:</p>' + block('score = score + 5;') + '<p>The shortcut ' + c('score += 5;') + ' does exactly the same thing.</p><p><b>Only write the type the first time.</b> After that, the box already exists. Writing ' + c('int') + ' again would try to make a second box with the same name.</p>',
        P('int score = 10;\ncout << score << endl;\nscore = score + 5;\ncout << score << endl;\nscore += 1;\ncout << score << endl;')),
      page('Mixing text and numbers',
        '<p>With ' + c('cout') + ' you can simply chain text and numbers with ' + c('<<') + '.</p><p>But to build one <b>string</b> with ' + c('+') + ', every piece must be text. ' + c('+') + ' can\'t glue a number onto a string. Turn the number into text first with ' + c('to_string(coins)') + '.</p>',
        P('int coins = 7;\ncout << "Coins: " << coins << endl;\nstring label = "You have " + to_string(coins) + " coins";\ncout << label << endl;')),
      page('Objects become variables',
        '<p>In Syntaxia, glowing boxes you walk into become <b>variables</b> you can use in any terminal. They appear in the <b>Variables</b> panel in the top-right corner, showing their name and what\'s inside.</p><p>The game has already made these boxes for you, so just use their names. Don\'t put a type like ' + c('int') + ' in front of them.</p>'),
      page('Cheat sheet',
        '<table class="cheat"><tr><td>' + c('int x = 5;') + '</td><td>make a variable (type first)</td></tr><tr><td>' + c('cout << x << endl;') + '</td><td>show what\'s inside</td></tr><tr><td>' + c('"x"') + ' vs ' + c('x') + '</td><td>the word vs. the box</td></tr><tr><td>' + c('string') + ' / ' + c('int') + ' / ' + c('double') + ' / ' + c('bool') + '</td><td>text / whole number / decimal / true-false</td></tr><tr><td>' + c('x = x + 1;') + ', ' + c('x += 1;') + '</td><td>change a variable (no type)</td></tr><tr><td>' + c('"Hi " + to_string(n)') + '</td><td>number into text</td></tr></table>'),
    ],
    // ------------------------------------------------ 3. conditions
    ifs: [
      page('Asking yes/no questions',
        '<p>A <b>comparison</b> asks a question and the answer is ' + c('true') + ' or ' + c('false') + '.</p><ul><li>' + c('>') + ' greater than, ' + c('<') + ' less than</li><li>' + c('>=') + ' at least, ' + c('<=') + ' at most</li><li>' + c('==') + ' equal to, ' + c('!=') + ' not equal to</li></ul><p>When you print a comparison, put it in <b>brackets</b>: ' + c('cout << (hp > 50)') + '. C++ shows ' + c('1') + ' for true and ' + c('0') + ' for false, unless you print ' + c('boolalpha') + ' first.</p>',
        P('int hp = 40;\ncout << (hp > 50) << endl;\ncout << (hp < 50) << endl;\ncout << (hp == 40) << endl;\ncout << boolalpha << (hp != 40) << endl;')),
      page('= stores, == compares',
        '<p>This trips up everyone at first:</p><ul><li>' + c('=') + ' (one) <b>stores</b> a value in a variable</li><li>' + c('==') + ' (two) <b>asks</b> "are these equal?"</li></ul>',
        P('int x = 5;                // store 5 in x\ncout << (x == 5) << endl;   // is x equal to 5?\ncout << (x == 9) << endl;   // is x equal to 9?')),
      page('if: do something only sometimes',
        '<p>' + c('if') + ' runs code <b>only when</b> the condition is true. The condition goes in <b>( brackets )</b> and the code inside goes between <b>{ curly braces }</b>. No semicolon after the ' + c(')') + '!</p><p>Run it, then change ' + c('hp') + ' to 50 and run again. The warning disappears, but "Done checking" always prints.</p>',
        P('int hp = 20;\nif (hp < 30) {\n    cout << "Low health!" << endl;\n}\ncout << "Done checking" << endl;')),
      page('else: otherwise...',
        '<p>' + c('else') + ' is the plan B: it runs when the condition is <b>false</b>. Exactly one of the two blocks runs, never both.</p><p>Strings can be compared with ' + c('==') + ' too.</p>',
        P('string door = "locked";\nif (door == "open") {\n    cout << "Walk in" << endl;\n} else {\n    cout << "Find a key" << endl;\n}')),
      page('Many choices: else if',
        '<p>Chain more checks with ' + c('else if') + '. They are checked <b>top to bottom</b> and only the <b>first</b> true one runs. ' + c('else') + ' catches everything left over.</p><p>Try temp = 35, 15 and -5.</p>',
        P('int temp = 15;\nif (temp > 30) {\n    cout << "Hot" << endl;\n} else if (temp > 10) {\n    cout << "Warm" << endl;\n} else {\n    cout << "Cold" << endl;\n}')),
      page('The remainder: %',
        '<p>' + c('%') + ' gives the <b>remainder</b> after dividing whole numbers. ' + c('7 % 2') + ' is 1 (7 = 2+2+2, with 1 left over).</p><p>If ' + c('n % 2') + ' is 0, nothing is left over, so ' + c('n') + ' is <b>even</b>.</p>',
        P('cout << 7 % 2 << endl;\ncout << 8 % 2 << endl;\nint n = 10;\nif (n % 2 == 0) {\n    cout << n << " is even" << endl;\n}')),
      page('Combining: &&, ||, !',
        '<ul><li>' + c('&&') + ' (and): true only if <b>both</b> sides are true</li><li>' + c('||') + ' (or): true if <b>at least one</b> side is true</li><li>' + c('!') + ' (not): flips true and false</li></ul><p>Each side must be a full comparison: write ' + c('w == "rain" || w == "snow"') + ', not ' + c('w == "rain" || "snow"') + '.</p>',
        P('int age = 14;\nbool ticket = true;\ncout << boolalpha;\ncout << (age >= 12 && ticket) << endl;\ncout << (age < 5 || ticket) << endl;\ncout << !ticket << endl;')),
      page('Cheat sheet',
        '<table class="cheat"><tr><td>' + c('> < >= <= == !=') + '</td><td>comparisons: true/false</td></tr><tr><td>' + c('cout << (a > b)') + '</td><td>brackets when printing (1 or 0)</td></tr><tr><td>' + c('if') + ' / ' + c('else if') + ' / ' + c('else') + '</td><td>choose what runs</td></tr><tr><td>' + c('n % 2 == 0') + '</td><td>is n even?</td></tr><tr><td>' + c('&&') + ' ' + c('||') + ' ' + c('!') + '</td><td>and, or, not</td></tr></table><p>Remember: condition in ' + c('( )') + ', code inside ' + c('{ }') + '.</p>'),
    ],
    // ------------------------------------------------ 4. loops
    loops: [
      page('Repeating code',
        '<p>A <b>for loop</b> repeats the code inside its curly braces. This one runs 3 times:</p><p>Change the 3 to 10 and run it again. One small change, ten times the work!</p>',
        P('for (int i = 0; i < 3; i++) {\n    cout << "Hello!" << endl;\n}')),
      page('Meet i, the counter',
        '<p>' + c('for (int i = 0; i < 5; i++)') + ' has three parts, separated by semicolons:</p><ul><li><b>start</b>: ' + c('int i = 0') + ' makes the counter</li><li><b>keep going while</b>: ' + c('i < 5') + '</li><li><b>after each loop</b>: ' + c('i++') + ' adds 1 to i</li></ul><p>So i is <b>0, 1, 2, 3, 4</b>. To include the end number, start at 1 and use ' + c('<=') + '.</p>',
        P('for (int i = 0; i < 5; i++) {\n    cout << "i is " << i << endl;\n}\n\nfor (int i = 1; i <= 3; i++) {\n    cout << "from 1: " << i << endl;\n}')),
      page('Counting down',
        '<p>To count backwards, start high, keep going while ' + c('i >= 1') + ', and use ' + c('i--') + ' to subtract 1 each time.</p><p>Anything after the loop\'s closing ' + c('}') + ' runs once the loop has finished.</p>',
        P('for (int i = 5; i >= 1; i--) {\n    cout << i << endl;\n}\ncout << "Blast off!" << endl;')),
      page('Looping through a vector',
        '<p>A ' + c('vector') + ' is C++\'s list: many values of one type, in order. ' + c('vector<string>') + ' holds strings.</p><p>The <b>range-for</b> loop visits every item. Each time around, ' + c('snack') + ' holds the next item. Read the colon as "in".</p>',
        P('vector<string> snacks = {"apple", "cake", "pie"};\nfor (string snack : snacks) {\n    cout << "I ate the " << snack << endl;\n}')),
      page('while: repeat until...',
        '<p>A <b>while loop</b> repeats <b>as long as</b> its condition is true. Use it when you don\'t know in advance how many times you need.</p><p>Something inside the loop must eventually make the condition false, otherwise it runs <b>forever</b> (an infinite loop). Here, ' + c('fuel -= 1;') + ' does that.</p>',
        P('int fuel = 3;\nwhile (fuel > 0) {\n    cout << "Flying! fuel = " << fuel << endl;\n    fuel -= 1;\n}\ncout << "Landed" << endl;')),
      page('Building up a total',
        '<p>A very common pattern: make a variable at 0 <b>before</b> the loop, add to it <b>inside</b> the loop, and use it <b>after</b>.</p>',
        P('int total = 0;\nfor (int i = 1; i <= 3; i++) {\n    total += i;\n    cout << "added " << i << " -> total is " << total << endl;\n}\ncout << "Final: " << total << endl;')),
      page('break: stop early',
        '<p>' + c('break;') + ' jumps straight <b>out</b> of the loop, even if there are items left. Perfect for "stop when you find it".</p>',
        P('for (int n = 1; n < 100; n++) {\n    if (n == 4) {\n        cout << "Found 4! Stopping." << endl;\n        break;\n    }\n    cout << n << endl;\n}')),
      page('Cheat sheet',
        '<table class="cheat"><tr><td>' + c('for (int i = 0; i < 3; i++)') + '</td><td>repeat 3 times (i = 0, 1, 2)</td></tr><tr><td>' + c('for (int i = 1; i <= 10; i++)') + '</td><td>1 to 10</td></tr><tr><td>' + c('for (int i = 5; i >= 1; i--)') + '</td><td>5 down to 1</td></tr><tr><td>' + c('for (string x : my_list)') + '</td><td>each item in a vector</td></tr><tr><td>' + c('while (cond) { }') + '</td><td>repeat while true</td></tr><tr><td>' + c('total += x;') + '</td><td>build up a total</td></tr><tr><td>' + c('break;') + '</td><td>leave the loop early</td></tr></table>'),
    ],
    // ------------------------------------------------ 5. functions
    funcs: [
      page('Defining and calling',
        '<p>A <b>function</b> is a named recipe. In C++ you write it <b>above</b> ' + c('main') + ': a return type, a name, brackets, and the code inside ' + c('{ }') + '. ' + c('void') + ' means "gives nothing back".</p><p><b>Defining</b> it only writes the recipe down. Nothing happens until you <b>call</b> it by writing its name and ' + c('()') + '.</p>',
        P('hello();\nhello();', 'void hello() {\n    cout << "Hello!" << endl;\n}')),
      page('Parameters: giving it inputs',
        '<p>Inside the brackets you list <b>parameters</b>, each with its type. When you call the function, the value you pass in gets stored in the parameter, like a variable that only exists inside the function.</p>',
        P('greet("Ada");\ngreet("Linus");', 'void greet(string name) {\n    cout << "Hi " << name << endl;\n}')),
      page('return: sending an answer back',
        '<p>' + c('return') + ' sends a value <b>back</b> to whoever called the function. The type in front of the name says what kind of value comes back: ' + c('int') + ' here.</p><p>Printing only <i>shows</i> a value. Returning <i>hands it over</i> so you can store it or use it.</p><p>Why ' + c('double_it') + ' and not ' + c('double') + '? Because ' + c('double') + ' is already a C++ word (the decimal number type), so it can\'t be a name.</p>',
        P('int result = double_it(5);\ncout << result << endl;', 'int double_it(int n) {\n    return n * 2;\n}')),
      page('Using returned values',
        '<p>A function call that returns a value can go anywhere a value can go: inside maths, inside ' + c('cout') + ', even inside another call.</p>',
        P('cout << double_it(3) + double_it(4) << endl;\ncout << double_it(double_it(2)) << endl;', 'int double_it(int n) {\n    return n * 2;\n}')),
      page('if inside functions',
        '<p>Functions can use everything you know. ' + c('return') + ' also <b>ends</b> the function immediately, so after the first return, the rest is skipped.</p>',
        P('cout << smaller(8, 3) << endl;\ncout << smaller(2, 9) << endl;', 'int smaller(int a, int b) {\n    if (a < b) {\n        return a;\n    }\n    return b;\n}')),
      page('Returning true or false',
        '<p>A comparison already <i>is</i> true or false, so a ' + c('bool') + ' function can return it directly. Functions like this are great inside an ' + c('if') + '.</p>',
        P('cout << boolalpha;\ncout << positive(5) << endl;\ncout << positive(-2) << endl;\nif (positive(3)) {\n    cout << "3 is positive" << endl;\n}', 'bool positive(int n) {\n    return n > 0;\n}')),
      page('Loops inside functions',
        '<p>Put a loop inside a function and you can reuse the whole loop with one call. Variables made inside a function stay inside it.</p>',
        P('count_up(3);\ncout << "again:" << endl;\ncount_up(2);', 'void count_up(int n) {\n    for (int i = 1; i <= n; i++) {\n        cout << i << endl;\n    }\n}')),
      page('Cheat sheet',
        '<table class="cheat"><tr><td>' + c('void name() { }') + '</td><td>define a function (above main)</td></tr><tr><td>' + c('name();') + '</td><td>call it</td></tr><tr><td>' + c('int f(int a, int b)') + '</td><td>parameters, each with a type</td></tr><tr><td>' + c('return x;') + '</td><td>send an answer back (and stop)</td></tr><tr><td>' + c('int') + ' / ' + c('string') + ' / ' + c('bool') + ' / ' + c('void') + '</td><td>the type of answer (void: none)</td></tr><tr><td>' + c('cout << f(2) + f(3)') + '</td><td>use returned values</td></tr></table>'),
    ],
    // ------------------------------------------------ 6. classes
    classes: [
      page('Blueprints and objects',
        '<p>A <b>class</b> is a blueprint. Using it creates an <b>object</b>. Objects carry their own data, called <b>attributes</b>, which you read with a dot: ' + c('my_dog.name') + '.</p><ul><li>' + c('public:') + ' lets code outside the class use what follows</li><li>' + c('string name;') + ' declares an attribute</li><li>' + c('Dog() { ... }') + ' is the <b>constructor</b>: it has the class\'s name and runs automatically when an object is created, to set it up</li><li>the class ends with ' + c('};') + ' (don\'t forget that semicolon!)</li></ul><p>' + c('Dog my_dog;') + ' creates an object called my_dog.</p>',
        P('Dog my_dog;\ncout << my_dog.name << endl;', 'class Dog {\npublic:\n    string name;\n\n    Dog() {\n        name = "Rex";\n    }\n};')),
      page('Giving each object its own values',
        '<p>Give the constructor parameters, and every object can start with <b>different</b> values. Pass them in brackets when you create the object. One blueprint, many objects!</p>',
        P('Dog a("Rex");\nDog b("Bella");\ncout << a.name << " and " << b.name << endl;', 'class Dog {\npublic:\n    string name;\n\n    Dog(string n) {\n        name = n;\n    }\n};')),
      page('Methods: things objects can do',
        '<p>A <b>method</b> is a function that belongs to a class. Inside it, the object\'s own attributes can be used by name. You can also write ' + c('this->name') + ': ' + c('this') + ' means "this object". Call a method with a dot and brackets.</p>',
        P('Dog rex("Rex");\ncout << rex.speak() << endl;', 'class Dog {\npublic:\n    string name;\n\n    Dog(string n) {\n        name = n;\n    }\n\n    string speak() {\n        return this->name + " says woof!";\n    }\n};')),
      page('Methods that change things',
        '<p>Methods can <b>update</b> attributes. The object remembers the new value. A method that gives nothing back has the type ' + c('void') + '.</p>',
        P('Counter c;\nc.click();\nc.click();\ncout << c.count << endl;', 'class Counter {\npublic:\n    int count;\n\n    Counter() {\n        count = 0;\n    }\n\n    void click() {\n        count += 1;\n    }\n};')),
      page('Methods with inputs',
        '<p>Methods can take parameters too. Notice that each object keeps <b>its own</b> data: changing one doesn\'t change the other.</p>',
        P('Tank big;\nTank small;\nbig.fill(50);\nsmall.fill(5);\ncout << big.water << " " << small.water << endl;', 'class Tank {\npublic:\n    int water;\n\n    Tank() {\n        water = 0;\n    }\n\n    void fill(int amount) {\n        water += amount;\n    }\n};')),
      page('Handing objects to functions',
        '<p>Objects can be passed into functions just like numbers or text. The parameter\'s type is the class name. The function can read the object\'s attributes and call its methods. (That\'s how ' + c('equip') + ' and ' + c('adopt') + ' will work!)</p><p>You can also make an object right inside a call: ' + c('introduce(Dog("Bella"));') + '</p>',
        P('Dog rex("Rex");\nintroduce(rex);\nintroduce(Dog("Bella"));', 'class Dog {\npublic:\n    string name;\n\n    Dog(string n) {\n        name = n;\n    }\n};\n\nvoid introduce(Dog pet) {\n    cout << "This is " << pet.name << endl;\n}')),
      page('Cheat sheet',
        '<table class="cheat"><tr><td>' + c('class Thing { public: ... };') + '</td><td>make a blueprint (note the ;)</td></tr><tr><td>' + c('int x;') + '</td><td>declare an attribute</td></tr><tr><td>' + c('Thing(int v) { x = v; }') + '</td><td>constructor: set up a new object</td></tr><tr><td>' + c('Thing t(5);') + ' / ' + c('Thing t;') + '</td><td>create an object</td></tr><tr><td>' + c('t.x') + '</td><td>read an attribute</td></tr><tr><td>' + c('void act() { }') + ' / ' + c('t.act();') + '</td><td>define / call a method</td></tr><tr><td>' + c('this->x') + '</td><td>this object\'s x</td></tr></table>'),
    ],
    // ------------------------------------------------ 7. open world
    world: [
      page('Vectors',
        '<p>A ' + c('vector') + ' keeps many values of one type in order. Each item has a position number called an <b>index</b>, and indexes start at <b>0</b>!</p><ul><li>' + c('items[0]') + ': the first item</li><li>' + c('items.size()') + ': how many items there are</li><li>' + c('items[items.size() - 1]') + ' or ' + c('items.back()') + ': the last item</li></ul>',
        P('vector<string> items = {"sword", "map", "apple"};\ncout << items[0] << endl;\ncout << items[2] << endl;\ncout << items.back() << endl;\ncout << items.size() << endl;')),
      page('Changing vectors',
        '<p>Vectors can grow and shrink. ' + c('.push_back(x)') + ' adds ' + c('x') + ' to the end, and ' + c('.pop_back()') + ' removes the last item.</p><p>C++ can\'t print a whole vector with ' + c('cout') + ', so loop through it to show the items.</p>',
        P('vector<string> items = {"sword"};\nitems.push_back("shield");\nitems.push_back("map");\nfor (string item : items) {\n    cout << item << endl;\n}\nitems.pop_back();\ncout << "now " << items.size() << " items" << endl;')),
      page('Text tools',
        '<p>Strings come with built-in tools. ' + c('word.length()') + ' counts the letters, and ' + c('word[0]') + ' picks out one letter (a ' + c('char') + '), just like a vector.</p><ul><li>' + c('toupper(letter)') + ' gives the capital version of one letter, so loop over the string to shout the whole word</li><li>' + c('reverse(word.begin(), word.end());') + ' flips a string in place (it needs ' + c('#include <algorithm>') + ')</li></ul>',
        P('string word = "hello";\ncout << word.length() << endl;\ncout << word[0] << endl;\nstring loud = word;\nfor (int i = 0; i < loud.length(); i++) {\n    loud[i] = toupper(loud[i]);\n}\ncout << loud << endl;\nreverse(word.begin(), word.end());\ncout << word << endl;')),
      page('Maps',
        '<p>A ' + c('map') + ' stores values by <b>name</b> (a key) instead of by position. ' + c('map<string, int>') + ' maps text keys to whole numbers. Look things up, or add new ones, with square brackets and the key.</p>',
        P('map<string, int> prices = {{"map", 3}, {"potion", 5}};\ncout << prices["potion"] << endl;\nprices["shield"] = 12;\ncout << prices["shield"] << endl;\ncout << prices.size() << " things for sale" << endl;')),
      page('Putting it together',
        '<p>Most real problems combine ideas: <b>loop</b> through a vector, use an <b>if</b> to pick items, and build up a result.</p>',
        P('vector<int> nums = {3, 8, 1, 9};\nvector<int> big;\nfor (int n : nums) {\n    if (n > 5) {\n        big.push_back(n);\n    }\n}\nfor (int n : big) {\n    cout << n << endl;\n}\ncout << big.size() << " big numbers" << endl;')),
      page('Cheat sheet',
        '<table class="cheat"><tr><td>' + c('vector<int> v = {1, 2};') + '</td><td>make a vector</td></tr><tr><td>' + c('v[0]') + ', ' + c('v.back()') + ', ' + c('v.size()') + '</td><td>first, last, how many</td></tr><tr><td>' + c('v.push_back(x);') + '</td><td>add to the end</td></tr><tr><td>' + c('for (int x : v)') + '</td><td>visit each item</td></tr><tr><td>' + c('s.length()') + ', ' + c('s[i]') + ', ' + c('toupper(c)') + '</td><td>string tools</td></tr><tr><td>' + c('reverse(s.begin(), s.end());') + '</td><td>flip a string</td></tr><tr><td>' + c('prices["key"]') + '</td><td>look up a map</td></tr></table>'),
    ],
    boss: [
      page('Your weapon: loops',
        '<p>The Compiler Cannon fires once each time you call ' + c('fire();') + ', but only bursts from a <b>loop</b> get through Segfault\'s shield. Here\'s the idea with ' + c('cout') + ':</p><p>If Segfault corrupts your code, read the error, find the line, fix it, just like in the debugger.</p>',
        P('for (int shot = 0; shot < 3; shot++) {\n    cout << "Pew!" << endl;\n}')),
    ],
  };

  // ---------------------------------------------------------------- terminals
  const T = (desc, starter, hints, task, code) => ({ desc, starter, hints, similar: { task, code } });
  const terminals = {
    // ------------------------------------------------ level 1
    hello: T(
      '<p>This old gate only opens for programmers. Every programmer\'s first words are <b>"Hello, World"</b>.</p><p>In C++ you print with ' + c('cout') + ': write ' + c('cout <<') + ', then the text in quotes, then ' + c('<< endl;') + ' to finish the line. Your code goes <b>inside main</b>, between its curly braces.</p>',
      P('// Make the computer say hello!\n// Text goes inside quotes, like "this".\n// Write your line here, inside main:\n'),
      ['In C++ you print by sending things to cout with the << arrows.', 'Text has to go inside double quotes, and the line ends with a semicolon.'],
      'Make the computer say "Good morning".',
      P('cout << "Good morning" << endl;')),
    lines: T(
      '<p>Each ' + c('endl') + ' ends a line, so every ' + c('cout') + ' line can print its own <b>new line</b>. Computers run your code <b>from top to bottom</b>.</p><p>Ring the bells in order. Print these three lines:</p><pre>Ready\nSet\nCode!</pre>',
      P('// One cout line per bell. The first one is done for you:\ncout << "Ready" << endl;\n'),
      ['Each cout line with endl makes one line of output. You need one per bell.', 'Lines come out in the same order as your code.'],
      'Print the words One, Two, Three on separate lines.',
      P('cout << "One" << endl;\ncout << "Two" << endl;\ncout << "Three" << endl;')),
    textjoin: T(
      '<p>The ' + c('+') + ' sign <b>glues strings together</b>. It doesn\'t add a space: you get exactly what you glue.</p><p>One C++ catch: two plain quoted texts can\'t be glued straight to each other. Wrap the first piece in ' + c('string(...)') + ' so the chain starts with a real C++ string, then glue the rest onto it:</p>' + block('cout << string("Ice") + "cream" << endl;   // Icecream') +
      '<p>The smith needs the name <b>SuperCoder</b>, made by joining the text ' + c('"Super"') + ' and ' + c('"Coder"') + ' with ' + c('+') + '.</p>',
      P('// Glue two pieces of text with +\ncout << "Super" << endl;\n'),
      ['Wrap the first piece in string(...) so the chain is a real C++ string, then add the next piece in its own quotes.', '+ adds no space. Check you don\'t have spaces inside the quotes.'],
      'Print "Moonlight" by gluing "Moon" and "light".',
      P('cout << string("Moon") + "light" << endl;')),
    math: T(
      '<p>Text needs quotes, but <b>numbers don\'t</b>. Without quotes, the computer does the math for you:</p>' + block('cout << 2 + 3 << endl;     // shows 5\ncout << "2 + 3" << endl;   // shows the text 2 + 3') +
      '<p>Make the computer calculate <b>7 × 6</b> and <b>100 − 1</b>, printing each answer on its own line. (Use ' + c('*') + ' to multiply and ' + c('-') + ' to subtract. Don\'t type the answers yourself!)</p>',
      P('// Math works inside cout:\ncout << 2 + 3 << endl;\n'),
      ['Use * to multiply and - to subtract.', 'Don\'t put quotes around the maths, or it becomes text. One cout line per answer.'],
      'Print the answers to 8 × 5 and 50 − 8.',
      P('cout << 8 * 5 << endl;\ncout << 50 - 8 << endl;')),
    order: T(
      '<p>Just like in maths class, the computer does ' + c('*') + ' and ' + c('/') + ' <b>before</b> ' + c('+') + ' and ' + c('-') + '. Brackets ' + c('( )') + ' go first of all.</p><p>Print the answer to <b>(10 + 5) × 2</b>, then on the next line the answer to <b>10 + 5 × 2</b>. Notice how different they are!</p>',
      P('// Brackets are calculated first\n'),
      ['Brackets make the part inside happen first.', 'You need two cout lines: one with brackets, one without.'],
      'Print (3 + 1) × 5 and then 3 + 1 × 5.',
      P('cout << (3 + 1) * 5 << endl;\ncout << 3 + 1 * 5 << endl;')),
    sep: T(
      '<p>You can send <b>several things</b> to ' + c('cout') + ' in one line by chaining them with ' + c('<<') + '. They can be different kinds of values: text and numbers mix just fine!</p>' + block('cout << "Level " << 3 << endl;   // Level 3') +
      '<p>C++ adds <b>no space</b> between the pieces, so put the space inside the quotes.</p><p>Print <b>Score: 100</b> by chaining the text ' + c('"Score: "') + ' and the calculation ' + c('25 * 4') + ' with ' + c('<<') + '.</p>',
      P('// chain several values with <<\n'),
      ['Send the text first, then use another << for the calculation.', 'The calculation has no quotes, and the space goes inside the text\'s quotes.'],
      'Print "Gems: 12" by chaining the text and the calculation 3 * 4.',
      P('cout << "Gems: " << 3 * 4 << endl;')),

    // ------------------------------------------------ level 2
    firstvar: T(
      '<p>A <b>variable</b> is a labelled box that stores a value. In C++ you write the <b>type</b> of the box first, then its name, then the value:</p>' + block('string color = "blue";') +
      '<p>' + c('string') + ' is the type for text. Make a variable called ' + c('color') + ' inside main, holding your favourite colour (as text), then <b>print the variable</b>.</p>',
      P('// type name = value;   (text values need quotes)\n'),
      ['A text variable is made with: string name = value;', 'To print a variable, write its name after cout << without quotes.'],
      'Make a variable called food holding "pizza", then print it.',
      P('string food = "pizza";\ncout << food << endl;')),
    types: T(
      '<p>Every C++ variable has a <b>type</b>, and only that kind of value fits in it:</p><ul><li>' + c('string') + ': <b>text</b>, in quotes: ' + c('"Ada"') + '</li><li>' + c('int') + ': a whole <b>number</b>, no quotes: ' + c('7') + '</li><li>' + c('bool') + ': <b>true/false</b>: ' + c('true') + ' or ' + c('false') + '</li></ul>' +
      '<p>Make three variables inside main: ' + c('name') + ' holding <b>text</b>, ' + c('level') + ' holding a <b>number</b>, and ' + c('alive') + ' holding ' + c('true') + '.</p>',
      P('// string for text, int for numbers, bool for true/false\n'),
      ['Each variable needs its type first: string, int or bool.', 'Text goes in quotes. Numbers and true don\'t. true is all lowercase.'],
      'Make pet holding text, age holding a number, and hungry holding false.',
      P('string pet = "cat";\nint age = 3;\nbool hungry = false;\ncout << pet << " " << age << " " << hungry << endl;')),
    bridge: T(
      '<p>You collected a variable! ' + c('planks') + ' now holds the number <b>{planks}</b>.</p><p>A variable is a <b>named box</b> that stores a value. Instead of typing the number, use the box\'s name. The game made this box for you, so don\'t write a type in front of it.</p><p>Call ' + c('build_bridge(planks);') + ' to build a bridge over the lava.</p>',
      P('// planks is a variable you collected.\n// Print it to peek inside:\ncout << planks << endl;\n\n// Now build the bridge with it!\n'),
      ['You collected a variable called planks. Pass it into the function.', 'Put the variable name (no quotes) inside the function\'s brackets, and end the line with a semicolon.'],
      'You collected a variable called seeds. Show how many you will plant.',
      P('int seeds = 4;   // (pretend you collected this)\ncout << "Planting " << seeds << " seeds" << endl;')),
    area: T(
      '<p>Variables can hold <b>numbers</b>, and you can do math with them. You have ' + c('width') + ' and ' + c('height') + ' (both ' + c('int') + '). They\'re <b>different for every test</b>, so you can\'t just type the answer.</p><p>Make a new ' + c('int') + ' variable ' + c('area') + ' that equals width times height, then print it.</p>',
      P('// width and height change for each test!\ncout << width << endl;\ncout << height << endl;\n'),
      ['Make a new int variable and set it to width times height.', 'Print the new variable at the end.'],
      'Given length and count, make total = length * count and print it.',
      P('int length = 6;\nint count = 2;\nint total = length * count;\ncout << total << endl;')),
    update: T(
      '<p>Variables can <b>change</b>! You can give a variable a new value based on its old one:</p>' + block('score = score + 5;    // or the shortcut:  score += 5;') +
      '<p>You have a variable ' + c('score') + ' (different each test). <b>Add 5 to it</b>, then print it. <i>score already exists, so don\'t put ' + c('int') + ' in front of it.</i></p>',
      P('// score already exists. Add 5 to it, then print it.\n'),
      ['Use the old value of score to make the new one. Don\'t write int: score already exists.', 'score += 5; is a shortcut for score = score + 5;'],
      'lives starts at 3. Take away 1, then print it.',
      P('int lives = 3;\nlives = lives - 1;\ncout << lives << endl;')),
    combine: T(
      '<p>Let\'s build a sentence out of variables. The badge machine has ' + c('hero') + ' (a ' + c('string') + ') and ' + c('coins') + ' (an ' + c('int') + '), different for each test.</p><p>Print a sentence like <b>Ada has 5 coins</b>.</p>' +
      '<p>Careful: ' + c('+') + ' can\'t glue a number onto a string in C++! Turn the number into text with ' + c('to_string(coins)') + ':</p>' + block('string msg = "I have " + to_string(3) + " lives";') +
      '<p>(Chaining the pieces with ' + c('<<') + ' works too.) Watch the spaces!</p>',
      P('cout << hero << endl;\ncout << coins << endl;\n'),
      ['Glue the pieces together: hero, then " has ", then coins, then " coins".', 'coins is a number. Wrap it in to_string(...) before gluing it with +.'],
      'Given pet and age, print "Rex is 3 years old".',
      P('string pet = "Rex";\nint age = 3;\ncout << pet + " is " + to_string(age) + " years old" << endl;')),
    password: T(
      '<p>The lock needs the secret stored in your ' + c('password') + ' variable (a ' + c('string') + ').</p><p>The password is different for every adventurer, so don\'t type it: <b>print the variable</b>!</p>',
      P('// Print the variable password (no quotes around a variable name!)\n'),
      ['"password" in quotes is just the word. Without quotes it\'s the variable.', 'Print the variable with cout, not the word.'],
      'Print the contents of a variable called secret.',
      P('string secret = "hidden treasure";\ncout << secret << endl;')),

    // ------------------------------------------------ level 3
    compare: T(
      '<p>A <b>comparison</b> asks a yes/no question. The answer is a ' + c('bool') + ': ' + c('true') + ' or ' + c('false') + '.</p>' + block('cout << (5 > 3) << endl;   // 1 (true)\ncout << (2 > 9) << endl;   // 0 (false)') +
      '<p>Comparisons: ' + c('>') + ' ' + c('<') + ' ' + c('>=') + ' ' + c('<=') + ' ' + c('==') + ' ' + c('!=') + '</p><p>Put the comparison in <b>brackets</b> when you print it. C++ shows 1 or 0 (print ' + c('boolalpha') + ' first if you want the words).</p>' +
      '<p>Print whether ' + c('hp') + ' is <b>greater than 50</b>. Tested with 3 values.</p>',
      P('// Print the answer to: is hp greater than 50?\n'),
      ['Put the comparison itself after cout <<, inside round brackets.', 'Greater than is >.'],
      'Print whether gold is less than 10.',
      P('int gold = 4;\ncout << (gold < 10) << endl;')),
    heal: T(
      '<p>' + c('if') + ' runs code <b>only when</b> its condition is true:</p>' + block('if (hp < 30) {\n    // runs only when hp is below 30\n}') +
      '<p>If ' + c('hp') + ' is <b>below 30</b>, call ' + c('heal();') + '. Otherwise do nothing. Tested with 4 values.</p>',
      P('if (hp < 30) {\n    // what goes here?\n}\n'),
      ['Call the function only inside the if block, between the curly braces.', 'Calling a function means its name, then (), then a semicolon.'],
      'If fuel is below 20, print "Refuel!".',
      P('int fuel = 12;\nif (fuel < 20) {\n    cout << "Refuel!" << endl;\n}')),
    guard: T(
      '<p>The guard bot lets friends in and keeps bugs out. The variable ' + c('visitor') + ' holds the name of whoever is at the gate, and ' + c('my_name') + ' holds <b>your</b> name.</p><p>If the visitor is you, call ' + c('open_gate();') + '. Otherwise call ' + c('sound_alarm();') + '. Compare strings with ' + c('==') + ' (two equals signs).</p><p>The bot will test your code with <b>3 different visitors</b>.</p>',
      P('// Compare with == (two equals signs)\nif (visitor == my_name) {\n    // what should happen here?\n} else {\n\n}\n'),
      ['Compare visitor with my_name using ==.', 'One function goes in the if block, the other goes in the else block.'],
      'If code equals "1234", print "Unlocked", otherwise print "Wrong code".',
      P('string code = "0000";\nif (code == "1234") {\n    cout << "Unlocked" << endl;\n} else {\n    cout << "Wrong code" << endl;\n}')),
    even: T(
      '<p>The ' + c('%') + ' operator gives the <b>remainder</b> after dividing: ' + c('7 % 2') + ' is <b>1</b>, ' + c('8 % 2') + ' is <b>0</b>.</p><p>A number is <b>even</b> when ' + c('number % 2') + ' is 0. Print <b>even</b> or <b>odd</b> for ' + c('number') + '. Tested with 4 numbers.</p>',
      P('cout << number % 2 << endl;\n'),
      ['number % 2 is 0 for even numbers. Check it with == inside an if.', 'Use if / else to choose which word to print.'],
      'Print "fizz" if n can be divided by 3 with nothing left over, otherwise print "nope".',
      P('int n = 9;\nif (n % 3 == 0) {\n    cout << "fizz" << endl;\n} else {\n    cout << "nope" << endl;\n}')),
    pump: T(
      '<p>The lava pump reads ' + c('temperature') + ' and must react:</p><ul><li>above <b>100</b>: ' + c('cool();') + '</li><li>below <b>0</b>: ' + c('heat();') + '</li><li>anything else: ' + c('wait();') + '</li></ul>' +
      '<p>Use ' + c('if') + ', ' + c('else if') + ' and ' + c('else') + '. It will be tested with 5 temperatures. Get it right and the lava turns to stone!</p>',
      P('if (temperature > 100) {\n    cool();\n}\n// add an else if for below 0...\n// ...and an else for everything else\n'),
      ['There are three cases, so use if, else if and else, each with its own curly braces.', '100 itself is not above 100.'],
      'Print "big" if size > 10, "small" if size < 3, and "medium" otherwise.',
      P('int size = 5;\nif (size > 10) {\n    cout << "big" << endl;\n} else if (size < 3) {\n    cout << "small" << endl;\n} else {\n    cout << "medium" << endl;\n}')),
    bouncer: T(
      '<p>Sometimes you need <b>two</b> things to be true. ' + c('&&') + ' means "and": both sides must be true.</p><p>Let the visitor in with ' + c('open_gate();') + ' only if ' + c('age') + ' is <b>12 or more</b> AND ' + c('has_ticket') + ' (a ' + c('bool') + ') is true. Otherwise call ' + c('turn_away();') + '.</p>',
      P('if (age >= 12 && has_ticket) {\n\n} else {\n\n}\n'),
      ['The condition is already written. Which function belongs in each block?', 'has_ticket is already true or false, so you can use it directly.'],
      'Print "Ride!" only if height >= 120 and the person is not scared. Otherwise print "Next time".',
      P('int height = 130;\nbool scared = false;\nif (height >= 120 && !scared) {\n    cout << "Ride!" << endl;\n} else {\n    cout << "Next time" << endl;\n}')),
    orgate: T(
      '<p>' + c('||') + ' means "or": the condition is true if <b>either</b> side is true.</p><p>If ' + c('weather') + ' is ' + c('"rain"') + ' <b>or</b> ' + c('"snow"') + ', call ' + c('umbrella();') + '. For any other weather, call ' + c('sunglasses();') + '.</p>',
      P('if (weather == "rain") {\n    umbrella();\n} else {\n    sunglasses();\n}\n'),
      ['The condition needs two full comparisons joined by ||.', 'Write weather == on both sides of the ||.'],
      'Print "Weekend!" if day is "Sat" or "Sun", otherwise print "School day".',
      P('string day = "Sun";\nif (day == "Sat" || day == "Sun") {\n    cout << "Weekend!" << endl;\n} else {\n    cout << "School day" << endl;\n}')),

    // ------------------------------------------------ level 4
    repeat: T(
      '<p>A <b>loop</b> repeats code. Your friend <b>i</b> counts each time it goes around:</p>' + block('for (int i = 0; i < 3; i++) {\n    cout << "Hi" << endl;\n}') +
      '<p>That prints "Hi" three times. Now make the machine print <b>Hooray!</b> 3 times, using a loop, not 3 separate lines.</p>',
      P('for (int i = 0; i < 3; i++) {\n    cout << "Hi" << endl;\n}\n'),
      ['The loop is already written. What text should go inside?', 'i < 3 controls how many times it repeats.'],
      'Print "Jump!" 4 times using a loop.',
      P('for (int i = 0; i < 4; i++) {\n    cout << "Jump!" << endl;\n}')),
    stairs: T(
      '<p>The cliff is 6 blocks high. ' + c('build_step(n);') + ' builds the step at position ' + c('n') + ' (0 is the first step).</p><p>You <i>could</i> write it 6 times... or let your friend <b>i</b> count for you with a <b>loop</b>!</p>' +
      '<p>' + c('for (int i = 0; i < 6; i++) { ... }') + ' runs the code inside 6 times, with ' + c('i') + ' = 0, 1, 2, 3, 4, 5.</p>',
      P('// i will count 0, 1, 2, 3, 4, 5 for you\nfor (int i = 0; i < 6; i++) {\n    cout << "i is " << i << endl;\n    // build a step here!\n}\n'),
      ['Call build_step inside the loop\'s curly braces.', 'Pass i to it, because i is the number of the step.'],
      'Use a loop to place lanterns 0 to 3 by printing "lantern 0", "lantern 1" and so on.',
      P('for (int i = 0; i < 4; i++) {\n    cout << "lantern " << i << endl;\n}')),
    count: T(
      '<p>The counter ' + c('i') + ' has a value you can use inside the loop! Print the numbers <b>1 to 10</b>, one per line.</p><p>Start ' + c('i') + ' at 1 and keep going while ' + c('i <= 10') + '.</p>',
      P('for (int i = 0; i < 10; i++) {\n    cout << i << endl;\n}\n'),
      ['Start i at 1 instead of 0.', 'Use <= to include the last number.'],
      'Print the numbers 5 to 8.',
      P('for (int i = 5; i <= 8; i++) {\n    cout << i << endl;\n}')),
    countdown: T(
      '<p>The launch pad needs a countdown! Print:</p><pre>5\n4\n3\n2\n1\nLiftoff!</pre><p>Use a loop that counts <b>down</b>. Hint: ' + c('i--') + ' subtracts 1. Or use a ' + c('while') + ' loop.</p>',
      P('// Count down from 5 to 1, then print "Liftoff!"\n'),
      ['Start at 5, keep going while i >= 1, and use i-- to go down.', 'Print Liftoff! after the loop\'s closing }.'],
      'Count down from 3 to 1, then print "Go!".',
      P('for (int i = 3; i >= 1; i--) {\n    cout << i << endl;\n}\ncout << "Go!" << endl;')),
    listloop: T(
      '<p>Loops can walk through a <b>vector</b> (a list) of things, one item at a time:</p>' + block('vector<string> fruits = {"apple", "pear"};\nfor (string fruit : fruits) {\n    cout << fruit << endl;\n}') +
      '<p>' + c('loot') + ' is a ' + c('vector<string>') + '. Print every item in it, one per line. The list changes for each test, and it might even be empty!</p>',
      P('// loot is a vector<string>, e.g. {"coin", "gem", "key"}\ncout << loot.size() << " items" << endl;\n'),
      ['for (string item : loot) visits each item.', 'Print the loop variable inside the loop. Don\'t print the size.'],
      'Print each colour in a vector of colours.',
      P('vector<string> colours = {"red", "blue"};\nfor (string c : colours) {\n    cout << c << endl;\n}')),
    charge: T(
      '<p>A ' + c('while') + ' loop keeps going <b>as long as</b> its condition is true. Use it when you don\'t know how many times you\'ll need.</p><p>The battery is at ' + c('charge') + ' percent. While it\'s below 100: call ' + c('charge_up();') + ' and add 10 to ' + c('charge') + '. <i>(charge already exists, so no ' + c('int') + '.)</i></p><p>If you forget to change ' + c('charge') + ', the loop never ends!</p>',
      P('while (charge < 100) {\n    charge_up();\n    // don\'t forget to add 10 to charge!\n}\n'),
      ['Inside the loop, charge has to go up, or the loop never ends.', 'charge += 10; adds 10.'],
      'While water is below 50, print "pour" and add 20 to water.',
      P('int water = 0;\nwhile (water < 50) {\n    cout << "pour" << endl;\n    water += 20;\n}')),
    sumloop: T(
      '<p>Loops can <b>build up</b> an answer. Make a total at 0 and add to it each time around.</p><p>Add up all the numbers from 1 to ' + c('n') + ' (1 + 2 + ... + n) and print the total. Tested with n = 5, 10 and 1.</p>',
      P('int total = 0;\nfor (int i = 1; i <= n; i++) {\n    // add i to total\n}\ncout << total << endl;\n'),
      ['Inside the loop, add i to total.', 'Print the total after the loop has finished, not inside it.'],
      'Add up 2 + 4 + 6 (the even numbers up to 6) and print the total.',
      P('int total = 0;\nfor (int i = 2; i <= 6; i += 2) {\n    total += i;\n}\ncout << total << endl;')),
    breakloop: T(
      '<p>' + c('break;') + ' jumps <b>out</b> of a loop early, which is handy when you find what you\'re looking for (or hit danger!).</p><p>Ride along ' + c('rails') + ' (a ' + c('vector<string>') + '): print each piece of track. If you reach a ' + c('"gap"') + ', print <b>Stop!</b> and ' + c('break') + ' out of the loop straight away.</p>',
      P('for (string piece : rails) {\n    cout << piece << endl;\n}\n'),
      ['Inside the loop, check if piece == "gap" first.', 'If it is a gap, print Stop! and then break. Otherwise print the piece.'],
      'Walk through a list of rooms, printing each one, but stop with "Danger!" at a "dragon".',
      P('vector<string> rooms = {"hall", "kitchen", "dragon", "vault"};\nfor (string r : rooms) {\n    if (r == "dragon") {\n        cout << "Danger!" << endl;\n        break;\n    }\n    cout << r << endl;\n}')),

    // ------------------------------------------------ level 5
    cheer: T(
      '<p>A <b>function</b> is a named block of code, written above ' + c('main') + '. <b>Defining</b> it doesn\'t run it: you have to <b>call</b> it by writing its name with ' + c('()') + ' and a semicolon.</p><p>The function ' + c('cheer') + ' is already defined for you. <b>Call it twice</b> inside main.</p>',
      P('// Call it twice below:\n', 'void cheer() {\n    cout << "Go team!" << endl;\n}'),
      ['Defining a function does not run it. You have to call it inside main.', 'Calling it means writing its name followed by () and a semicolon.'],
      'Call a function named clap three times.',
      P('clap();\nclap();\nclap();', 'void clap() {\n    cout << "clap!" << endl;\n}')),
    echo: T(
      '<p>Functions can take <b>inputs</b> called <b>parameters</b>. Each parameter has a type. Inside the function, the parameter works like a variable.</p>' + block('void hello(string name) {\n    cout << "Hi " << name << endl;\n}\n\n// inside main:\nhello("Ada");   // Hi Ada') +
      '<p>Write a function ' + c('echo') + ' that takes a ' + c('string word') + ' and prints it <b>twice</b> (on two lines). The chamber will test it with different words.</p>',
      P('echo("hello");\n', 'void echo(string word) {\n    // print word two times\n}'),
      ['word works like a variable inside the function.', 'Print word, not "word" in quotes, two times.'],
      'Write shout(word) that prints the word followed by "!!!".',
      P('shout("hey");', 'void shout(string word) {\n    cout << word << "!!!" << endl;\n}')),
    double: T(
      '<p>A <b>function</b> is a reusable mini-program. You give it inputs and it <b>returns</b> an answer. The type before its name says what kind of answer: ' + c('int') + ' for a whole number.</p>' +
      '<p>We can\'t call it ' + c('double') + ', because ' + c('double') + ' is already a C++ word (the type for decimal numbers). So define a function ' + c('double_it') + ' that takes an ' + c('int n') + ' and returns ' + c('n * 2') + '. The forge will test it with several numbers, then build the bridge.</p>',
      P('cout << double_it(4) << endl;  // should be 8\n', 'int double_it(int n) {\n    // give back n times 2\n    return 0;\n}'),
      ['Use the return keyword to give a value back, not cout.', 'Return n multiplied by something.'],
      'Write triple(n) that returns n times 3.',
      P('cout << triple(4) << endl;', 'int triple(int n) {\n    return n * 3;\n}')),
    square: T(
      '<p>A returned value can be <b>used</b> like any other value: stored, printed, or even added to another returned value!</p><p>Write ' + c('int square(int n)') + ' that returns ' + c('n * n') + '. Then, inside main, print ' + c('square(3) + square(4)') + ' (it should show 25).</p>',
      P('// print square(3) + square(4) here\n', 'int square(int n) {\n    // return n times n\n    return 0;\n}'),
      ['First make square return n * n.', 'Then print the two calls added together, inside main.'],
      'Write half(n) returning n / 2, then print half(10) + half(4).',
      P('cout << half(10) + half(4) << endl;', 'int half(int n) {\n    return n / 2;\n}')),
    greet: T(
      '<p>This door only opens for well-mannered code. Write a function ' + c('string greet(string name)') + ' that returns a greeting like this:</p><pre>greet("Ada")  returns  "Hello, Ada!"</pre>' +
      '<p>Tip: glue strings with ' + c('+') + '. Since ' + c('name') + ' is a real C++ string, ' + c('"Hello, " + name') + ' works fine.</p>',
      P('cout << greet("Ada") << endl;\n', 'string greet(string name) {\n    return "Hello";\n}'),
      ['Glue "Hello, " and name and "!" together with + and return it.', 'Watch the comma, the space and the exclamation mark.'],
      'Write bye(name) that returns "Goodbye, NAME."',
      P('cout << bye("Ada") << endl;', 'string bye(string name) {\n    return "Goodbye, " + name + ".";\n}')),
    evenfn: T(
      '<p>Functions can return ' + c('true') + ' or ' + c('false') + ': give them the return type ' + c('bool') + '. Then you can use them in an ' + c('if') + '!</p><p>Write ' + c('bool even(int n)') + ' that returns ' + c('true') + ' if ' + c('n') + ' is even and ' + c('false') + ' if it\'s odd. (Remember ' + c('%') + ' from the Conditions level?)</p>',
      P('cout << even(4) << endl;\n', 'bool even(int n) {\n    return false;\n}'),
      ['n % 2 == 0 is already true or false. You can return it directly.', 'Return the value, not text in quotes.'],
      'Write big(n) that returns whether n is over 100.',
      P('cout << boolalpha << big(500) << endl;', 'bool big(int n) {\n    return n > 100;\n}')),
    total: T(
      '<p>Write a function ' + c('total') + ' that takes a ' + c('vector<int>') + ' of numbers and returns their sum.</p><pre>total({1, 2, 3})  returns  6\ntotal({})         returns  0</pre><p>Functions + loops = power. Start a running total at 0 and add each number.</p>',
      P('vector<int> test = {1, 2, 3};\ncout << total(test) << endl;\n', 'int total(vector<int> nums) {\n    int result = 0;\n    for (int n : nums) {\n        // add n to result\n    }\n    return result;\n}'),
      ['Start result at 0, then add each n inside the loop.', 'result is returned after the loop has finished.'],
      'Write count_long(words) that returns how many words are longer than 3 letters.',
      P('vector<string> words = {"hi", "hello", "hey", "world"};\ncout << count_long(words) << endl;', 'int count_long(vector<string> words) {\n    int count = 0;\n    for (string w : words) {\n        if (w.length() > 3) {\n            count += 1;\n        }\n    }\n    return count;\n}')),
    biggest: T(
      '<p>Functions can use everything you\'ve learned, including ' + c('if') + '. Write a function ' + c('int biggest(int a, int b)') + ' that <b>returns</b> the larger of the two numbers.</p><pre>biggest(3, 9)   returns  9\nbiggest(10, 2)  returns  10</pre>',
      P('cout << biggest(3, 9) << endl;\n', 'int biggest(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    // what if a is not bigger?\n    return 0;\n}'),
      ['If a is not bigger, what should you return instead?', 'Change the last return line, after the if block.'],
      'Write smallest(a, b) that returns the smaller number.',
      P('cout << smallest(4, 9) << endl;', 'int smallest(int a, int b) {\n    if (a < b) {\n        return a;\n    }\n    return b;\n}')),

    // ------------------------------------------------ level 6
    crate: T(
      '<p>A <b>class</b> is a blueprint. Making something from the blueprint gives you an <b>object</b>, and objects carry data called <b>attributes</b>.</p><p>The ' + c('Crate') + ' blueprint is written for you. Inside main, create a crate object with ' + c('Crate my_crate;') + ', then print its ' + c('contents') + ' attribute using a dot: ' + c('my_crate.contents') + '.</p>',
      P('// 1. Make an object:   Crate my_crate;\n// 2. Print its contents\n', 'class Crate {\npublic:\n    string contents;\n\n    Crate() {\n        contents = "golden key";\n    }\n};'),
      ['Create the object first: the class name, then a name for your object, then a semicolon.', 'Then read the attribute with a dot: object.contents'],
      'Make a Chest object and print its gold attribute.',
      P('Chest my_chest;\ncout << my_chest.gold << endl;', 'class Chest {\npublic:\n    int gold;\n\n    Chest() {\n        gold = 50;\n    }\n};')),
    potion: T(
      '<p>The real power of classes: <b>one blueprint, many different objects</b>. The constructor can take inputs so each object gets its own values, and <b>methods</b> are functions that belong to the object.</p>' +
      '<p>Finish the ' + c('Potion') + ' class: make ' + c('describe()') + ' return text like <b>Potion of power 3</b>. ' + c('power') + ' is a number, so turn it into text with ' + c('to_string(power)') + '.</p>' +
      '<p>Then ' + c('brew') + ' <b>two</b> potions with <b>different</b> powers. You can make an object right inside the call: ' + c('brew(Potion(3));') + '</p>',
      P('brew(Potion(3));\n// brew a second, stronger potion\n', 'class Potion {\npublic:\n    int power;\n\n    Potion(int p) {\n        power = p;\n    }\n\n    string describe() {\n        return "...";   // use power here\n    }\n};'),
      ['describe should glue "Potion of power " and to_string(power) together.', 'Call brew a second time with a different number.'],
      'A Shield class stores strength, and label() returns "Shield +STRENGTH".',
      P('cout << Shield(2).label() << endl;\ncout << Shield(5).label() << endl;', 'class Shield {\npublic:\n    int strength;\n\n    Shield(int s) {\n        strength = s;\n    }\n\n    string label() {\n        return "Shield +" + to_string(strength);\n    }\n};')),
    lamp: T(
      '<p>Methods can <b>change</b> an object\'s attributes. The ' + c('Lamp') + ' class is almost done: the ' + c('toggle') + ' method should flip ' + c('on') + ' from off to on, or on to off.</p><p>' + c('!') + ' flips true/false: ' + c('!true') + ' is false. The code in main already tests it.</p>',
      P('Lamp lamp;\ncout << lamp.status() << endl;\nlamp.toggle();\ncout << lamp.status() << endl;\nlamp.toggle();\ncout << lamp.status() << endl;\n', 'class Lamp {\npublic:\n    bool on;\n\n    Lamp() {\n        on = false;\n    }\n\n    string status() {\n        return on ? "on" : "off";\n    }\n\n    void toggle() {\n        // flip on\n    }\n};'),
      ['toggle should set on to the opposite of what it is now.', '!true is false, and !false is true.'],
      'A Door class has a method that flips open between true and false.',
      P('Door d;\nd.flip();\ncout << boolalpha << d.open << endl;', 'class Door {\npublic:\n    bool open;\n\n    Door() {\n        open = false;\n    }\n\n    void flip() {\n        open = !open;\n    }\n};')),
    wallet: T(
      '<p>Methods can take <b>inputs</b> too. Finish the ' + c('add') + ' method so it increases ' + c('coins') + ' by ' + c('amount') + '.</p><p>Notice the test code makes <b>two</b> purses: each object keeps its <b>own</b> coins.</p>',
      P('Wallet mine;\nmine.add(5);\nmine.add(10);\ncout << mine.coins << endl;\n\nWallet yours;\nyours.add(3);\ncout << yours.coins << endl;\n', 'class Wallet {\npublic:\n    int coins;\n\n    Wallet() {\n        coins = 0;\n    }\n\n    void add(int amount) {\n        // increase coins by amount\n    }\n};'),
      ['Inside add, change coins.', 'Use += with the amount parameter.'],
      'A Health class has a method damage(amount) that lowers hp.',
      P('Health h;\nh.damage(3);\ncout << h.hp << endl;', 'class Health {\npublic:\n    int hp;\n\n    Health() {\n        hp = 10;\n    }\n\n    void damage(int amount) {\n        hp -= amount;\n    }\n};')),
    forge: T(
      '<p>A <b>class</b> is a blueprint. From one blueprint you can make many <b>objects</b>.</p><p>Design a weapon class with a ' + c('name') + ' (a ' + c('string') + ') and ' + c('damage') + ' (an ' + c('int') + ' from 1 to 5). Then create one and ' + c('equip(...)') + ' it!</p><p>Bonus: give it a method like ' + c('string swing()') + ' that returns a battle cry.</p>',
      P('// Create a Sword object from the blueprint, then equip it\nSword my_sword;\n', 'class Sword {\npublic:\n    string name;\n    int damage;\n\n    Sword() {\n        name = "Byte Blade";\n        damage = 3;\n    }\n\n    string swing() {\n        return "Slash!";\n    }\n};'),
      ['The class is already written, and my_sword is already created.', 'Pass the object into equip(...).'],
      'Make a Shield class with a name and armor, create one, and print its name.',
      P('Shield my_shield;\ncout << my_shield.name << endl;', 'class Shield {\npublic:\n    string name;\n    int armor;\n\n    Shield() {\n        name = "Pot Lid";\n        armor = 2;\n    }\n};')),
    den: T(
      '<p>Lonely? Write a class for a <b>pet</b>! It needs a ' + c('name') + ' and a method ' + c('string speak()') + ' that returns what it says.</p><p>Optionally add a ' + c('species') + ' like "cat", "dog", "bird", "slime" or "robot". Then ' + c('adopt(...)') + ' your pet!</p>',
      P('// Make a pet object (pick your own name!)\nPet buddy("Pixel", "cat");\n', 'class Pet {\npublic:\n    string name;\n    string species;\n\n    Pet(string n, string s) {\n        name = n;\n        species = s;\n    }\n\n    string speak() {\n        return "...";\n    }\n};'),
      ['speak must return some text your pet says (not "...").', 'Pass your pet object into adopt(...).'],
      'Make a Robot class whose beep() method returns "Beep boop!", and print it.',
      P('Robot r("Bolt");\ncout << r.beep() << endl;', 'class Robot {\npublic:\n    string name;\n\n    Robot(string n) {\n        name = n;\n    }\n\n    string beep() {\n        return "Beep boop!";\n    }\n};')),

    // ------------------------------------------------ open world
    gems: T(
      '<p>' + c('gems') + ' is a ' + c('vector<int>') + ' of gem sizes. Deposit only the <b>big</b> ones: call ' + c('deposit(gem);') + ' for every gem <b>bigger than 5</b>, in order.</p><p>Loop over the vector with ' + c('for (int gem : gems)') + ' and use an ' + c('if') + ' inside. Tested with 3 different lists.</p>',
      P('// gems is a vector<int>, e.g. {3, 8, 1, 9, 6}\nfor (int gem : gems) {\n\n}\n'),
      ['Use an if inside the loop.', 'Call deposit only when the gem is bigger than 5.'],
      'Print every score in a vector that is at least 50.',
      P('vector<int> scores = {30, 75, 50, 10};\nfor (int s : scores) {\n    if (s >= 50) {\n        cout << s << endl;\n    }\n}')),
    decoder: T(
      '<p>The message in ' + c('secret') + ' (a ' + c('string') + ') was written in a mirror: it\'s <b>backwards</b>! Print it the right way around.</p><pre>secret = "olleh"   prints  hello</pre>' +
      '<p>' + c('reverse(word.begin(), word.end());') + ' flips a string in place (from ' + c('#include <algorithm>') + '). Or build a new string with a loop that walks from the last letter to the first.</p>',
      P('// secret is a backwards string\ncout << secret << endl;\n'),
      ['reverse needs the start and the end of the string: secret.begin() and secret.end().', 'Flip it first, then print it.'],
      'Print the word "stressed" backwards.',
      P('string word = "stressed";\nreverse(word.begin(), word.end());\ncout << word << endl;')),
    fib: T(
      '<p>The vault opens with the <b>Fibonacci sequence</b>: start with 0 and 1, and each next number is the sum of the two before it.</p><pre>0, 1, 1, 2, 3, 5, 8, 13, ...</pre>' +
      '<p>Print the first ' + c('n') + ' numbers (one per line). Tested with n = 5, 8 and 1.</p><p>Tip: C++ can\'t update two variables at once, so use a third one to remember the next number: ' + c('int next = a + b;') + '</p>',
      P('int a = 0;\nint b = 1;\n// print the first n Fibonacci numbers\n'),
      ['Loop n times. Each time, print a, then work out the next pair.', 'The next a is the old b. The next b is a + b, so save a + b in a new variable before you change a.'],
      'Print the first 5 powers of 2: 1, 2, 4, 8, 16.',
      P('int x = 1;\nfor (int i = 0; i < 5; i++) {\n    cout << x << endl;\n    x = x * 2;\n}')),
    fizz: T(
      '<p>An ancient programmer ritual. Print the numbers <b>1 to 15</b>, but:</p><ul><li>multiples of 3: <b>Fizz</b></li><li>multiples of 5: <b>Buzz</b></li><li>multiples of both: <b>FizzBuzz</b></li></ul><p>' + c('%') + ' gives the remainder: ' + c('9 % 3') + ' is 0, so 9 is a multiple of 3.</p>',
      P('for (int i = 1; i <= 15; i++) {\n    cout << i << endl;\n}\n'),
      ['Check i % 15 == 0 FIRST, then 3, then 5.', 'Use else if so only one line is printed for each number.'],
      'Print 1 to 6, but print "Even" instead of the number for even numbers.',
      P('for (int i = 1; i <= 6; i++) {\n    if (i % 2 == 0) {\n        cout << "Even" << endl;\n    } else {\n        cout << i << endl;\n    }\n}')),
    merchant: T(
      '<p>The merchant keeps prices in a <b>map</b>: ' + c('prices') + ' is a ' + c('map<string, int>') + ' from item names to costs. ' + c('cart') + ' is a ' + c('vector<string>') + ' of item names.</p><p>Print the <b>total cost</b> of everything in the cart. Look up a price with ' + c('prices["potion"]') + '.</p>',
      P('// prices = {{"potion", 5}, {"shield", 12}, ...}\n// cart = {"potion", "potion", ...}\n'),
      ['Make an int total at 0 and loop over cart.', 'For each item, look up prices[item] and add it to the total.'],
      'Add up the ages in a map for the names in a vector.',
      P('map<string, int> ages = {{"ana", 10}, {"bo", 12}};\nvector<string> names = {"ana", "bo"};\nint total = 0;\nfor (string n : names) {\n    total += ages[n];\n}\ncout << total << endl;')),
    backpack: T(
      '<p>A <b>vector</b> holds many values in order. Each item has a position called an <b>index</b>, starting at <b>0</b>:</p>' + block('vector<string> items = {"sword", "map", "apple"};\nitems[0]                  // "sword"\nitems[items.size() - 1]   // "apple"  (or items.back())\nitems.size()              // 3') +
      '<p>Print 3 lines about ' + c('inventory') + ': the <b>first</b> item, the <b>last</b> item, and <b>how many</b> items there are.</p>',
      P('// inventory is a vector<string>, e.g. {"sword", "map", "apple"}\ncout << "My backpack:" << endl;\n'),
      ['The first item is at index 0.', 'The last item is at index size() - 1, and .size() gives how many there are.'],
      'From a vector of planets, print the second one and the number of planets.',
      P('vector<string> planets = {"Mercury", "Venus", "Earth"};\ncout << planets[1] << endl;\ncout << planets.size() << endl;')),
    crier: T(
      '<p>C++ strings don\'t have one button to make everything capital. Instead, ' + c('toupper(letter)') + ' (from ' + c('#include <cctype>') + ') gives the capital version of <b>one</b> letter, so you loop over the string:</p>' +
      block('string word = "hi";\nfor (int i = 0; i < word.length(); i++) {\n    word[i] = toupper(word[i]);\n}\n// word is now "HI"') +
      '<p>The crier shouts every ' + c('message') + ': print it in <b>UPPERCASE</b> with an ' + c('!') + ' on the end. ' + c('"hello"') + ' becomes <b>HELLO!</b></p>',
      P('// message changes for each test\ncout << message << endl;\n'),
      ['Loop over every position in message and replace each letter with toupper of it.', 'After the loop, print message and then "!".'],
      'Print a name in lowercase followed by "?".',
      P('string name = "ADA";\nfor (int i = 0; i < name.length(); i++) {\n    name[i] = tolower(name[i]);\n}\ncout << name << "?" << endl;')),
    bag: T(
      '<p>Vectors can <b>grow</b>! ' + c('list.push_back(x);') + ' adds ' + c('x') + ' to the end.</p><p>' + c('bag') + ' is a ' + c('vector<string>') + '. Add ' + c('"potion"') + ' to it, then print how many items it holds, and then its last item.</p>',
      P('// bag is a vector<string>, e.g. {"rope", "torch"}\ncout << "The bag has " << bag.size() << " items" << endl;\n'),
      ['.push_back adds an item to the end of a vector.', 'Then print bag.size(), and after that the last item.'],
      'Add "bread" to a shopping list, then print its size and last item.',
      P('vector<string> shopping = {"milk"};\nshopping.push_back("bread");\ncout << shopping.size() << endl;\ncout << shopping.back() << endl;')),

    // ------------------------------------------------ boss
    cannon: T(
      '<p>Each call to ' + c('fire();') + ' launches a compiled blast at Segfault. The cannon only accepts <b>burst fire from a loop</b>: up to <b>5 shots</b> per run.</p><p>After firing, it needs time to recharge. Watch out: Segfault may <b>corrupt your cannon code</b>! If it does, debug it before firing again.</p>',
      P('// Fire a burst!\nfor (int shot = 0; shot < 5; shot++) {\n    fire();\n}\n'),
      ['Call fire() inside a loop.', 'Each run can fire up to 5 shots.'],
      'Print "Pew!" 5 times with a loop.',
      P('for (int shot = 0; shot < 5; shot++) {\n    cout << "Pew!" << endl;\n}')),
  };

  // ---------------------------------------------------------------- glitch snippets
  const snippets = {
    syntax: [
      { code: P('cout << "Jump power restored!" << endl\n'), expect: 'Jump power restored!', hint: 'A line is missing its semicolon at the end.' },
      { code: P('if (true) {\n    cout << "Legs online" << endl;\n'), expect: 'Legs online', hint: 'A { was opened but never closed with }.' },
      { code: P('string message = "Spring loaded;\ncout << message << endl;\n'), expect: 'Spring loaded', hint: 'A piece of text is missing its closing quote.' },
      { code: P('for (int n = 0; n < 3; n++ {\n    cout << n << endl;\n}\n'), expect: '0\n1\n2', hint: 'The for line is missing a closing bracket ).' },
    ],
    name: [
      { code: P('string direction = "forward";\ncout << directon << endl;\n'), expect: 'forward' },
      { code: P('cuot << "Left is left again" << endl;\n'), expect: 'Left is left again' },
      { code: P('cout << trun() << endl;\n', 'string turn() {\n    return "right";\n}'), expect: 'right' },
      { code: P('int Score = 10;\ncout << score << endl;\n'), expect: '10', hint: 'C++ cares about capitals: Score and score are different names.' },
    ],
    type: [
      { code: P('int boost = "5";\ncout << boost + 5 << endl;\n'), expect: '10', hint: 'An int holds a number, but "5" in quotes is text.' },
      { code: P('int speed = 8;\nstring text = speed;\ncout << "Speed: " << text << endl;\n'), expect: 'Speed: 8', hint: 'A number can\'t go straight into a string box. Use to_string(speed).' },
      { code: P('cout << run() << endl;\n', 'int run(int steps) {\n    return steps * 2;\n}'), expect: '20', hint: 'run() needs a number of steps. 10 should do it.' },
      { code: P('vector<int> steps = {1, 2};\nsteps.push_back("3");\ncout << steps.size() << endl;\n'), expect: '3', hint: 'This vector holds ints, but "3" in quotes is text.' },
    ],
  };

  root.GameData.addLanguageContent('cpp', { intro, tutorials, terminals, snippets });
})(typeof window !== 'undefined' ? window : globalThis);
