/* CodeQuest — Chapter 2 for Java: "The Coffee Works".
 * Five levels that go deep into what makes Java itself: encapsulation & static, inheritance,
 * interfaces & abstract classes, collections & lambdas, and exceptions. Runs on js/clike.js (dialect 'java').
 * See docs/CHAPTER2.md for the format. */
(function (root) {
  'use strict';
  const GD = root.GameData;
  const { c, escapeHTML } = GD.helpers;

  // ---- helpers to build complete Java programs
  const trim = (s) => String(s || '').replace(/^\n+|\s+$/g, '');
  const ind = (s, n) => s.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n');
  // J(classes, body, { methods, imports }): classes go above Main, body goes inside main,
  // methods are static methods of Main, imports go at the very top.
  function J(classes, body, opt) {
    const o = opt || {};
    let s = '';
    if (o.imports) s += trim(o.imports) + '\n\n';
    if (classes) s += trim(classes) + '\n\n';
    s += 'public class Main {\n';
    if (o.methods) s += ind(trim(o.methods), 4) + '\n\n';
    s += '    public static void main(String[] args) {\n' + ind(trim(body), 8) + '\n    }\n}\n';
    return s;
  }
  const pre = (s) => `<pre>${escapeHTML(trim(s))}</pre>`;
  const code = (s) => c(escapeHTML(s));
  const page = (title, body, src, opt) => Object.assign({ title, body, code: src === undefined ? null : src }, opt || {});
  const cheat = (rows) => '<table class="cheat">' + rows.map(([a, b]) => `<tr><td>${code(a)}</td><td>${b}</td></tr>`).join('') + '</table>';
  const UTIL = 'import java.util.*;';
  const STREAMS = 'import java.util.*;\nimport java.util.stream.Collectors;';
  const LIST = 'import java.util.ArrayList;\nimport java.util.List;';

  const ch = {};   // challenges

  // ======================================================================= Level 1: encapsulation & static
  const JAR = `
class BeanJar {
    private int beans;

    public BeanJar(int beans) {
        this.beans = beans;
    }

    // add a public getter called getBeans() here
}`;
  ch.java2_jar = {
    title: 'The Locked Bean Jar',
    desc: `<p>The Coffee Works keeps its beans in jars with a <b>private</b> field: ${code('private int beans;')}. Only code <i>inside</i> the ${code('BeanJar')} class may touch it, so ${code('jar.beans')} in ${code('main')} is refused.</p>
      <p>Give ${code('BeanJar')} a <b>getter</b>: a public method ${code('getBeans()')} that returns ${code('beans')}. Then make ${code('main')} print ${code('jar.getBeans()')} instead. It should print <b>12</b>.</p>
      <p>Keep the field private: that is the whole point!</p>`,
    starter: J(JAR, 'BeanJar jar = new BeanJar(12);\nSystem.out.println(jar.beans);   // not allowed: beans is private!'),
    hints: ['A getter is a small public method, inside the class, whose only job is to return the private field.', 'Its return type is int, its name is getBeans, it takes no parameters. In main, call it with a dot and ().'],
    similar: { task: 'A Safe keeps a private code. Add getCode() and print it.', code: J('class Safe {\n    private int code;\n\n    public Safe(int code) {\n        this.code = code;\n    }\n\n    public int getCode() {\n        return code;\n    }\n}', 'Safe s = new Safe(4071);\nSystem.out.println(s.getCode());') },
    expect: ['12'],
    require: [[/private\s+int\s+beans/, 'Keep the field <code>private int beans;</code>. The getter is how the outside world reads it.'], [/int\s+getBeans\s*\(\s*\)\s*\{/, 'Write a method <code>public int getBeans()</code> inside <code>BeanJar</code>.'], [/\.getBeans\s*\(\s*\)/, 'In <code>main</code>, call <code>jar.getBeans()</code>.']],
    success: 'Click! The jar hands over its beans, but only through the method you wrote. <b>That is encapsulation.</b>',
    gate: 'A',
  };

  ch.java2_thermo = {
    title: 'The Careful Thermostat',
    desc: `<p>Coffee brews best between <b>85 and 96</b> degrees. The thermostat's ${code('setTemp')} setter currently accepts anything, even 120!</p>
      <p>Make ${code('setTemp(int temp)')} <b>check</b> the value first:</p>
      <ul><li>from 85 to 96 (both included): store it</li><li>anything else: print ${code('Rejected: 120')} (with the value) and keep the old temperature</li></ul>
      <p>Then the code in ${code('main')} prints <b>93</b>, <b>Rejected: 120</b>, <b>93</b>, <b>Rejected: 80</b>, <b>85</b>. This is why fields are private: the setter is the only door in, so it can guard it.</p>`,
    starter: J(`
class Thermostat {
    private int temp = 90;

    public int getTemp() {
        return temp;
    }

    public void setTemp(int temp) {
        // only allow 85 to 96, otherwise print "Rejected: " + temp
        this.temp = temp;
    }
}`, `
Thermostat t = new Thermostat();
t.setTemp(93);
System.out.println(t.getTemp());
t.setTemp(120);
System.out.println(t.getTemp());
t.setTemp(80);
t.setTemp(85);
System.out.println(t.getTemp());`),
    hints: ['Put an if / else around the line that stores the value.', 'The good range is temp >= 85 && temp <= 96. In the else part, print the rejection and do not change this.temp.'],
    similar: { task: 'A Volume knob that only accepts 0 to 10.', code: J('class Volume {\n    private int level = 5;\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int level) {\n        if (level >= 0 && level <= 10) {\n            this.level = level;\n        } else {\n            System.out.println("Too loud: " + level);\n        }\n    }\n}', 'Volume v = new Volume();\nv.setLevel(11);\nv.setLevel(7);\nSystem.out.println(v.getLevel());') },
    expect: ['93', 'Rejected: 120', '93', 'Rejected: 80', '85'],
    require: [[/private\s+int\s+temp/, 'Keep <code>temp</code> private.'], [/\bif\s*\(/, 'Use an <code>if</code> inside <code>setTemp</code> to check the value.']],
    success: 'The thermostat now guards its own temperature. <b>No more boiling coffee!</b>',
    gate: 'B',
  };

  ch.java2_cups = {
    title: 'The Cup Counter',
    desc: `<p>A normal field belongs to <b>one object</b>: every cup has its own ${code('size')}. A <b>static</b> field belongs to the <b>class itself</b>: there is only one, shared by every cup.</p>
      <p>${code('Cup')} has a static counter ${code('made')}. In the constructor, <b>add 1 to</b> ${code('made')}, then give this cup that number: ${code('this.number = made;')}. The first cup becomes #1, the second #2...</p>
      <p>The code in ${code('main')} then prints <b>Cup #1 (small)</b>, <b>Cup #3 (medium)</b> and <b>Cups made: 3</b>. Notice ${code('Cup.getMade()')} is called on the <b>class</b>, not on a cup.</p>`,
    starter: J(`
class Cup {
    private static int made = 0;   // one counter, shared by all cups
    private int number;            // each cup has its own number
    private String size;

    public Cup(String size) {
        this.size = size;
        // count this cup, then use the count as its number
    }

    public String getLabel() {
        return "Cup #" + number + " (" + size + ")";
    }

    public static int getMade() {
        return made;
    }
}`, `
Cup a = new Cup("small");
Cup b = new Cup("large");
Cup c = new Cup("medium");
System.out.println(a.getLabel());
System.out.println(c.getLabel());
System.out.println("Cups made: " + Cup.getMade());`),
    hints: ['Two lines are missing from the constructor: one that changes the shared counter, one that copies it into this cup.', 'made++; adds one. Because made is static, every new Cup sees the total so far.'],
    similar: { task: 'Each new Ticket gets the next number from a static counter.', code: J('class Ticket {\n    private static int issued = 0;\n    private int id;\n\n    public Ticket() {\n        issued++;\n        this.id = issued;\n    }\n\n    public int getId() {\n        return id;\n    }\n}', 'Ticket t1 = new Ticket();\nTicket t2 = new Ticket();\nSystem.out.println("Ticket " + t2.getId());') },
    expect: ['Cup #1 (small)', 'Cup #3 (medium)', 'Cups made: 3'],
    require: [[/static\s+int\s+made/, 'Keep the counter <code>static</code>, so all cups share one.'], [/made\s*(\+\+|\+=)|\+\+\s*made|made\s*=\s*made\s*\+/, 'Add 1 to <code>made</code> in the constructor.']],
    success: 'Every cup knows its own number, and the class knows the total. <b>Static, mastered.</b>',
    gate: 'C',
  };

  ch.java2_scale = {
    title: 'The Recipe Scale',
    desc: `<p>Some methods don't need an object at all. ${code('Math.max(3, 4)')} works without ever writing ${code('new Math()')}, because ${code('max')} is <b>static</b>.</p>
      <p>The ${code('Scale')} class has a constant ${code('GRAMS_PER_SCOOP')} (${code('static final')} means one shared value that never changes). Finish its two methods and make them <b>static</b>:</p>
      <ul><li>${code('grams(int scoops)')} returns ${code('scoops * GRAMS_PER_SCOOP')}</li><li>${code('scoopsFor(int cups)')} returns 2 scoops per cup</li></ul>
      <p>${code('main')} calls them on the class, ${code('Scale.grams(3)')}, so it should print <b>21</b> and then <b>56</b> (4 cups = 8 scoops = 56 grams). Don't create a ${code('Scale')} object.</p>`,
    starter: J(`
class Scale {
    static final int GRAMS_PER_SCOOP = 7;

    // these should be static, and return the right answers
    int grams(int scoops) {
        return 0;
    }

    int scoopsFor(int cups) {
        return 0;
    }
}`, `
System.out.println(Scale.grams(3));
System.out.println(Scale.grams(Scale.scoopsFor(4)));`),
    hints: ['A method can only be called as Scale.something(...) if the word static is in front of it.', 'grams multiplies by the constant; scoopsFor multiplies by 2.'],
    similar: { task: 'A static Temperature.toFahrenheit method, called without an object.', code: J('class Temperature {\n    static final int OFFSET = 32;\n\n    static int toFahrenheit(int celsius) {\n        return celsius * 9 / 5 + OFFSET;\n    }\n}', 'System.out.println(Temperature.toFahrenheit(100));') },
    expect: ['21', '56'],
    require: [[/static\s+int\s+grams\s*\(/, 'Make <code>grams</code> a <code>static</code> method.'], [/static\s+int\s+scoopsFor\s*\(/, 'Make <code>scoopsFor</code> a <code>static</code> method.'], [/^(?![\s\S]*new\s+Scale\s*\()/, 'No need for <code>new Scale()</code>: call the static methods on the class itself.']],
    success: 'The scale weighs beans without ever being built. <b>Static methods: class-level tools.</b>',
    gate: 'D',
  };

  ch.java2_card = {
    title: 'The Coffee Card',
    desc: `<p>Time to build a real, well-guarded class! A ${code('CoffeeCard')} has a private ${code('balance')} (starts at 0), and a static counter of how many cards were issued.</p>
      <ul>
        <li>The constructor adds 1 to ${code('cardsIssued')}.</li>
        <li>${code('topUp(int amount)')} adds the amount, but <b>only if it is more than 0</b>.</li>
        <li>${code('pay(int price)')}: if the balance is big enough, take the price off and return ${code('true')}; otherwise change nothing and return ${code('false')}.</li>
      </ul>
      <p>With the code in ${code('main')}, the output should be:</p>${pre('true\nfalse\n6\ntrue 0\nCards: 2')}`,
    starter: J(`
class CoffeeCard {
    private String owner;
    private int balance;
    private static int cardsIssued = 0;

    public CoffeeCard(String owner) {
        this.owner = owner;
        // count the new card
    }

    public void topUp(int amount) {
        // only positive amounts
    }

    public boolean pay(int price) {
        // enough money? take it and say true. Not enough? say false.
        return false;
    }

    public int getBalance() {
        return balance;
    }

    public static int getCardsIssued() {
        return cardsIssued;
    }
}`, `
CoffeeCard ada = new CoffeeCard("Ada");
CoffeeCard bob = new CoffeeCard("Bob");
ada.topUp(10);
ada.topUp(-50);
System.out.println(ada.pay(4));
System.out.println(ada.pay(7));
System.out.println(ada.getBalance());
bob.topUp(3);
System.out.println(bob.pay(3) + " " + bob.getBalance());
System.out.println("Cards: " + CoffeeCard.getCardsIssued());`),
    hints: ['Start with the constructor and topUp: each needs just one line (topUp inside an if).', 'In pay, compare balance >= price. Remember that return ends the method, so you can return true inside the if and false after it.'],
    similar: { task: 'A Locker with a private item count: store() refuses more than 3 items.', code: J('class Locker {\n    private int items = 0;\n\n    public boolean store() {\n        if (items < 3) {\n            items++;\n            return true;\n        }\n        return false;\n    }\n\n    public int getItems() {\n        return items;\n    }\n}', 'Locker l = new Locker();\nl.store();\nl.store();\nl.store();\nSystem.out.println(l.store());\nSystem.out.println(l.getItems());') },
    expect: ['true', 'false', '6', 'true 0', 'Cards: 2'],
    require: [[/private\s+int\s+balance/, 'Keep <code>balance</code> private.']],
    success: 'Nobody can set a balance to a million from outside now. <b>The Bean Vault is open!</b>',
    gate: 'E',
  };

  // ======================================================================= Level 2: inheritance
  const DRINK1 = `
class Drink {
    String name = "a drink";

    String describe() {
        return "This is " + name;
    }
}`;
  ch.java2_family = {
    title: 'The Family Recipe',
    desc: `<p><b>Inheritance</b> lets one class build on another. ${code('class Espresso extends Drink')} means: an Espresso <b>is a</b> Drink, so it gets all of Drink's fields and methods for free, and can add its own.</p>
      <p>Right now ${code('Espresso')} doesn't extend anything, so it has no ${code('name')} and no ${code('describe()')}. Add ${code('extends Drink')} to its first line.</p>
      <p>Then ${code('main')} prints <b>This is Espresso</b> (from Drink's method) and <b>2 shots</b> (Espresso's own method).</p>`,
    starter: J(DRINK1 + `

class Espresso {   // an Espresso is a Drink
    Espresso() {
        name = "Espresso";
    }

    String shots() {
        return "2 shots";
    }
}`, 'Espresso e = new Espresso();\nSystem.out.println(e.describe());\nSystem.out.println(e.shots());'),
    hints: ['Only the first line of the Espresso class needs to change.', 'The pattern is: class Child extends Parent {'],
    similar: { task: 'A Cat extends Animal and gets its breathe() method.', code: J('class Animal {\n    String breathe() {\n        return "breathing...";\n    }\n}\n\nclass Cat extends Animal {\n    String purr() {\n        return "purr";\n    }\n}', 'Cat tom = new Cat();\nSystem.out.println(tom.breathe());\nSystem.out.println(tom.purr());') },
    expect: ['This is Espresso', '2 shots'],
    require: [[/class\s+Espresso\s+extends\s+Drink/, 'Write <code>class Espresso extends Drink</code>.']],
    success: 'Espresso inherited everything Drink knows. <b>One family, less code.</b>',
    gate: 'A',
  };

  const DRINK2 = `
class Drink {
    private String name;
    private int ml;

    Drink(String name, int ml) {
        this.name = name;
        this.ml = ml;
    }

    String describe() {
        return name + " (" + ml + " ml)";
    }
}`;
  ch.java2_super = {
    title: 'Call the Parent',
    desc: `<p>This ${code('Drink')} has a constructor that needs a name and a size. A ${code('Latte')} is a Drink, so before a Latte can set up its own field, the Drink part must be built first.</p>
      <p>The very first line of a child's constructor can call the parent's constructor with ${code('super(...)')}:</p>${pre('super("Latte", ml);')}
      <p>Add it to ${code('Latte')}'s constructor. (${code('name')} and ${code('ml')} are private to Drink, so ${code('super')} is the only way to fill them.) The output should be <b>Latte (250 ml)</b>, <b>oat milk</b>, <b>Latte (350 ml), cow milk</b>.</p>`,
    starter: J(DRINK2 + `

class Latte extends Drink {
    private boolean oat;

    Latte(int ml, boolean oat) {
        // build the Drink part first
        this.oat = oat;
    }

    String milk() {
        return oat ? "oat milk" : "cow milk";
    }
}`, 'Latte a = new Latte(250, true);\nSystem.out.println(a.describe());\nSystem.out.println(a.milk());\nLatte b = new Latte(350, false);\nSystem.out.println(b.describe() + ", " + b.milk());'),
    hints: ['The error says Drink\'s constructor wants 2 things but got none. super(...) passes them.', 'The name is always "Latte"; the size is the ml parameter. super(...) must be the first line of the constructor.'],
    similar: { task: 'A Truck passes its wheel count up to Vehicle with super.', code: J('class Vehicle {\n    private int wheels;\n\n    Vehicle(int wheels) {\n        this.wheels = wheels;\n    }\n\n    int getWheels() {\n        return wheels;\n    }\n}\n\nclass Truck extends Vehicle {\n    Truck() {\n        super(6);\n    }\n}', 'System.out.println(new Truck().getWheels());') },
    expect: ['Latte (250 ml)', 'oat milk', 'Latte (350 ml), cow milk'],
    require: [[/super\s*\(/, 'Call the parent\'s constructor with <code>super(...)</code>.']],
    success: 'Parent first, then child. <b>The Latte is built properly.</b>',
    gate: 'B',
  };

  const DRINK3 = `
class Drink {
    private String name;

    Drink(String name) {
        this.name = name;
    }

    double price() {
        return 2.0;
    }

    String label() {
        return name + ": $" + price();
    }
}`;
  ch.java2_override = {
    title: 'A New Price',
    desc: `<p>A child class can <b>override</b> a method: write a method with the <b>same name and parameters</b> as the parent's, and the child's version wins. Put ${code('@Override')} on the line above it: Java then checks that you really are replacing something (a typo becomes an error instead of a silent bug).</p>
      <p>Every Drink costs $2.0. Override ${code('price()')} so a ${code('Mocha')} costs <b>3.5</b> and a ${code('Tea')} costs <b>1.5</b>.</p>
      <p>Notice that ${code('label()')} lives in Drink, but calls ${code('price()')}: Java uses the version belonging to the <i>real</i> object. Expected output: <b>House coffee: $2.0</b>, <b>Mocha: $3.5</b>, <b>Tea: $1.5</b>.</p>`,
    starter: J(DRINK3 + `

class Mocha extends Drink {
    Mocha() {
        super("Mocha");
    }

    // override price() here
}

class Tea extends Drink {
    Tea() {
        super("Tea");
    }

    // and here
}`, 'System.out.println(new Drink("House coffee").label());\nSystem.out.println(new Mocha().label());\nSystem.out.println(new Tea().label());'),
    hints: ['Copy the shape of Drink\'s price() method into each child, but return a different number.', '@Override goes on its own line, directly above the method.'],
    similar: { task: 'A Duck overrides Bird\'s sound().', code: J('class Bird {\n    String sound() {\n        return "tweet";\n    }\n}\n\nclass Duck extends Bird {\n    @Override\n    String sound() {\n        return "quack";\n    }\n}', 'Bird b = new Duck();\nSystem.out.println(b.sound());') },
    expect: ['House coffee: $2.0', 'Mocha: $3.5', 'Tea: $1.5'],
    require: [[/@Override[\s\S]*@Override/, 'Put <code>@Override</code> above <b>both</b> new <code>price()</code> methods.']],
    success: 'Same method name, different behaviour. <b>The price board updates itself.</b>',
    gate: 'C',
  };

  ch.java2_tostring = {
    title: 'Name Tags',
    desc: `<p>Every Java class secretly extends ${code('Object')}, and Object has a method ${code('toString()')}. Printing an object calls it, but Object's version only gives something like ${code('Pastry@1b6d3586')}: not very tasty.</p>
      <p>Override ${code('toString()')} in ${code('Pastry')} so it returns the name and weight like <b>croissant (60 g)</b>. It must be ${code('public String toString()')}, exactly like Object's.</p>
      <p>Then ${code('main')} prints <b>croissant (60 g)</b> and <b>Today: muffin (110 g)</b>. (Gluing an object to a String with ${code('+')} calls toString too.)</p>`,
    starter: J(`
class Pastry {
    private String name;
    private int grams;

    Pastry(String name, int grams) {
        this.name = name;
        this.grams = grams;
    }

    // override toString() here
}`, 'Pastry p = new Pastry("croissant", 60);\nSystem.out.println(p);\nSystem.out.println("Today: " + new Pastry("muffin", 110));'),
    hints: ['Run it first and look at the strange text: that is Object\'s toString.', 'Write @Override, then public String toString() that returns name, " (", grams and " g)" glued together.'],
    similar: { task: 'A Point prints itself as (x, y).', code: J('class Point {\n    private int x, y;\n\n    Point(int x, int y) {\n        this.x = x;\n        this.y = y;\n    }\n\n    @Override\n    public String toString() {\n        return "(" + x + ", " + y + ")";\n    }\n}', 'System.out.println(new Point(3, 4));') },
    expect: ['croissant (60 g)', 'Today: muffin (110 g)'],
    require: [[/public\s+String\s+toString\s*\(\s*\)/, 'Write the method as <code>public String toString()</code>.']],
    success: 'Every pastry now introduces itself nicely. <b>toString: the most overridden method in Java.</b>',
    gate: 'D',
  };

  ch.java2_foam = {
    title: 'Extra Foam',
    desc: `<p>An overriding method doesn't have to throw the parent's work away. Inside it, ${code('super.recipe()')} calls the <b>parent's</b> version, so you can add to it.</p>
      <p>Three generations of coffee: ${code('Coffee')} makes <b>espresso</b>. ${code('Latte extends Coffee')} adds <b> + milk</b>. ${code('VanillaLatte extends Latte')} adds <b> + vanilla</b>.</p>
      <p>Finish both overrides <b>using</b> ${code('super.recipe()')}, so the output is:</p>${pre('espresso\nespresso + milk\nespresso + milk + vanilla')}`,
    starter: J(`
class Coffee {
    String recipe() {
        return "espresso";
    }
}

class Latte extends Coffee {
    @Override
    String recipe() {
        return " + milk";   // start with what the parent makes!
    }
}

class VanillaLatte extends Latte {
    @Override
    String recipe() {
        return " + vanilla";
    }
}`, 'System.out.println(new Coffee().recipe());\nSystem.out.println(new Latte().recipe());\nSystem.out.println(new VanillaLatte().recipe());'),
    hints: ['super.recipe() gives back the parent\'s text. Glue the extra bit onto the end of it.', 'VanillaLatte\'s parent is Latte, so its super.recipe() already includes the milk.'],
    similar: { task: 'A LoudDog adds "!!!" to whatever a Dog says.', code: J('class Dog {\n    String bark() {\n        return "Woof";\n    }\n}\n\nclass LoudDog extends Dog {\n    @Override\n    String bark() {\n        return super.bark() + "!!!";\n    }\n}', 'System.out.println(new LoudDog().bark());') },
    expect: ['espresso', 'espresso + milk', 'espresso + milk + vanilla'],
    require: [[/super\s*\.\s*recipe\s*\(\s*\)[\s\S]*super\s*\.\s*recipe\s*\(\s*\)/, 'Use <code>super.recipe()</code> in <b>both</b> overrides instead of writing "espresso" again.']],
    success: 'Each generation builds on the last. <b>No copy-paste needed.</b>',
    gate: 'E',
  };

  const MENU = `
class Drink {
    private String name;

    Drink(String name) {
        this.name = name;
    }

    double price() {
        return 0.0;
    }

    @Override
    public String toString() {
        return name + " $" + price();
    }
}

class Espresso extends Drink {
    Espresso() { super("Espresso"); }

    @Override
    double price() { return 2.5; }
}

class Latte extends Drink {
    Latte() { super("Latte"); }

    @Override
    double price() { return 3.5; }
}

class Tea extends Drink {
    Tea() { super("Tea"); }

    @Override
    double price() { return 1.75; }
}`;
  ch.java2_menu = {
    title: 'The Menu Board',
    desc: `<p>Here is the real power of inheritance: a ${code('List<Drink>')} can hold <b>any</b> kind of Drink. Loop over it, and each object uses <b>its own</b> overridden methods. This is called <b>polymorphism</b>.</p>
      <p>Put a new ${code('Espresso')}, a ${code('Latte')} and a ${code('Tea')} into ${code('menu')} (in that order). Then loop over the menu with ${code('for (Drink d : menu)')}: print each drink, and add up ${code('d.price()')}. Finally print the total:</p>${pre('Espresso $2.5\nLatte $3.5\nTea $1.75\nTotal: $7.75')}`,
    starter: J(MENU, 'List<Drink> menu = new ArrayList<>();\n// 1. add an Espresso, a Latte and a Tea\n\n// 2. print each drink and add up the prices\ndouble total = 0;\n\nSystem.out.println("Total: $" + total);', { imports: LIST }),
    hints: ['menu.add(new Espresso()); puts one drink on the menu.', 'Inside the loop: print d, then total += d.price();'],
    similar: { task: 'A list of Animals where each makes its own sound.', code: J('class Animal {\n    String sound() { return "..."; }\n}\n\nclass Cow extends Animal {\n    @Override\n    String sound() { return "Moo"; }\n}\n\nclass Sheep extends Animal {\n    @Override\n    String sound() { return "Baa"; }\n}', 'List<Animal> farm = new ArrayList<>();\nfarm.add(new Cow());\nfarm.add(new Sheep());\nfor (Animal a : farm) {\n    System.out.println(a.sound());\n}', { imports: LIST }) },
    expect: ['Espresso $2.5', 'Latte $3.5', 'Tea $1.75', 'Total: $7.75'],
    require: [[/for\s*\(\s*Drink\s+\w+\s*:/, 'Loop over the menu with <code>for (Drink d : menu)</code>.']],
    success: 'One loop, three kinds of drink, each doing its own thing. <b>The Brew Line is running!</b>',
    gate: 'G',
  };

  // ======================================================================= Level 3: interfaces & abstract classes
  ch.java2_contract = {
    title: 'Sign the Contract',
    desc: `<p>An <b>interface</b> is a contract: a list of methods, with no code inside. ${code('interface Brewer { String brew(); }')} says "anything that is a Brewer can ${code('brew()')}".</p>
      <p>A class signs the contract with ${code('implements')}, and then must keep the promise by writing every method in it. Interface methods are always public, so the class must write them as ${code('public')} too.</p>
      <p>Make ${code('FrenchPress')} implement ${code('Brewer')}, with a ${code('brew()')} that returns <b>Pressed coffee</b>.</p>`,
    starter: J(`
interface Brewer {
    String brew();
}

class FrenchPress {
    // sign the contract, then keep the promise
}`, 'Brewer b = new FrenchPress();\nSystem.out.println(b.brew());'),
    hints: ['The first line becomes: class FrenchPress implements Brewer {', 'Then write public String brew() { ... } inside the class.'],
    similar: { task: 'A Lamp implements a Switchable contract.', code: J('interface Switchable {\n    String turnOn();\n}\n\nclass Lamp implements Switchable {\n    public String turnOn() {\n        return "Light!";\n    }\n}', 'Switchable s = new Lamp();\nSystem.out.println(s.turnOn());') },
    expect: ['Pressed coffee'],
    require: [[/class\s+FrenchPress\s+implements\s+Brewer/, 'Write <code>class FrenchPress implements Brewer</code>.']],
    success: 'Contract signed and kept. <b>The French Press joins the hall.</b>',
    gate: 'A',
  };

  const MACHINES = `
interface Machine {
    String name();
    int watts();
}

class Grinder implements Machine {
    public String name() { return "Grinder"; }
    public int watts() { return 300; }
}

class Kettle implements Machine {
    public String name() { return "Kettle"; }
    public int watts() { return 1200; }
}`;
  ch.java2_many = {
    title: 'One Contract, Many Machines',
    desc: `<p>The big win of an interface: code can work with <b>any</b> class that implements it, without knowing which one. A ${code('List<Machine>')} can hold grinders, kettles and anything else that signs the ${code('Machine')} contract.</p>
      <ol><li>Write a class ${code('MilkFrother')} that implements ${code('Machine')}: its name is <b>Milk Frother</b> and it uses <b>500</b> watts.</li>
      <li>Add one to the list.</li>
      <li>Inside the loop, also add up the watts in ${code('total')}.</li></ol>${pre('Grinder: 300W\nKettle: 1200W\nMilk Frother: 500W\nTotal: 2000W')}`,
    starter: J(MACHINES + '\n\n// write class MilkFrother here', `
List<Machine> machines = new ArrayList<>();
machines.add(new Grinder());
machines.add(new Kettle());
// add a MilkFrother here

int total = 0;
for (Machine m : machines) {
    System.out.println(m.name() + ": " + m.watts() + "W");
}
System.out.println("Total: " + total + "W");`, { imports: LIST }),
    hints: ['Copy the shape of the Kettle class, with a new name and new answers.', 'machines.add(new MilkFrother()); and inside the loop: total += m.watts();'],
    similar: { task: 'Two different classes behind one Shape interface.', code: J('interface Shape {\n    int area();\n}\n\nclass Square implements Shape {\n    public int area() { return 9; }\n}\n\nclass Strip implements Shape {\n    public int area() { return 4; }\n}', 'List<Shape> shapes = new ArrayList<>();\nshapes.add(new Square());\nshapes.add(new Strip());\nint sum = 0;\nfor (Shape s : shapes) {\n    sum += s.area();\n}\nSystem.out.println(sum);', { imports: LIST }) },
    expect: ['Grinder: 300W', 'Kettle: 1200W', 'Milk Frother: 500W', 'Total: 2000W'],
    require: [[/class\s+MilkFrother\s+implements\s+Machine/, 'Write <code>class MilkFrother implements Machine</code>.']],
    success: 'The loop never had to change to welcome a new machine. <b>That is what interfaces are for.</b>',
    gate: 'B',
  };

  const ABSTRACT = `
abstract class Machine {
    private String name;

    Machine(String name) {
        this.name = name;
    }

    String getName() {
        return name;
    }

    abstract int cupsPerHour();   // no body: each machine decides

    String report() {
        return getName() + " makes " + cupsPerHour() + " cups an hour";
    }
}

class DripMachine extends Machine {
    DripMachine() {
        super("Drip Machine");
    }

    @Override
    int cupsPerHour() {
        return 40;
    }
}`;
  ch.java2_abstract = {
    title: 'The Abstract Blueprint',
    desc: `<p>An <b>abstract class</b> sits between a class and an interface. It can have fields, constructors and finished methods like ${code('report()')}, but also <b>abstract</b> methods with no body, which every child must fill in. You can't do ${code('new Machine(...)')}: it's only half a blueprint.</p>
      <p>${code('EspressoMachine')} extends ${code('Machine')} but hasn't filled in ${code('cupsPerHour()')} yet, so Java refuses to build it. Add the missing method: an espresso machine makes <b>60</b> cups an hour.</p>${pre('Drip Machine makes 40 cups an hour\nEspresso Machine makes 60 cups an hour')}`,
    starter: J(ABSTRACT + `

class EspressoMachine extends Machine {
    EspressoMachine() {
        super("Espresso Machine");
    }

    // fill in the missing piece
}`, 'Machine drip = new DripMachine();\nMachine espresso = new EspressoMachine();\nSystem.out.println(drip.report());\nSystem.out.println(espresso.report());'),
    hints: ['Read the error message: it names the method EspressoMachine still owes.', 'Look at how DripMachine does it, and return 60 instead.'],
    similar: { task: 'An abstract Animal with an abstract legs() method.', code: J('abstract class Animal {\n    abstract int legs();\n\n    String walk() {\n        return "walking on " + legs() + " legs";\n    }\n}\n\nclass Spider extends Animal {\n    @Override\n    int legs() {\n        return 8;\n    }\n}', 'System.out.println(new Spider().walk());') },
    expect: ['Drip Machine makes 40 cups an hour', 'Espresso Machine makes 60 cups an hour'],
    require: [[/class\s+EspressoMachine\s+extends\s+Machine/, 'Keep <code>EspressoMachine extends Machine</code>.']],
    success: 'The blueprint is complete. <b>The espresso machine roars to life.</b>',
    gate: 'C',
  };

  const TWOJOBS = `
interface Brewer {
    String brew();
}

interface Cleanable {
    String clean();
}

class Kettle implements Brewer {
    public String brew() { return "Kettle: hot water"; }
}

class Dishwasher implements Cleanable {
    public String clean() { return "Dishwasher: cups sparkling"; }
}`;
  ch.java2_twojobs = {
    title: 'Two Jobs at Once',
    desc: `<p>A class can only <b>extend one</b> parent class, but it can <b>implement many</b> interfaces: ${code('class A implements B, C')}. That way one object can play several roles.</p>
      <p>The ${code('RoboBarista')} already brews. Make it ${code('Cleanable')} too, with a ${code('clean()')} that returns <b>Robo: wiping the counter</b>. It then fits in both lists:</p>${pre('Kettle: hot water\nRobo: flat white\nRobo: wiping the counter\nDishwasher: cups sparkling')}`,
    starter: J(TWOJOBS + `

class RoboBarista implements Brewer {   // it should be Cleanable too
    public String brew() {
        return "Robo: flat white";
    }
}`, `
RoboBarista robo = new RoboBarista();
List<Brewer> brewers = List.of(new Kettle(), robo);
List<Cleanable> cleaners = List.of(robo, new Dishwasher());
for (Brewer b : brewers) {
    System.out.println(b.brew());
}
for (Cleanable c : cleaners) {
    System.out.println(c.clean());
}`, { imports: LIST }),
    hints: ['List the interfaces after implements, separated by a comma.', 'Then keep the second promise: public String clean() { ... }'],
    similar: { task: 'A Phone that is both a Camera and a Caller.', code: J('interface Camera {\n    String snap();\n}\n\ninterface Caller {\n    String call();\n}\n\nclass Phone implements Camera, Caller {\n    public String snap() { return "click"; }\n    public String call() { return "ring ring"; }\n}', 'Phone p = new Phone();\nCamera cam = p;\nCaller tel = p;\nSystem.out.println(cam.snap() + " / " + tel.call());') },
    expect: ['Kettle: hot water', 'Robo: flat white', 'Robo: wiping the counter', 'Dishwasher: cups sparkling'],
    require: [[/class\s+RoboBarista\s+implements\s+(Brewer\s*,\s*Cleanable|Cleanable\s*,\s*Brewer)\b/, 'Write <code>class RoboBarista implements Brewer, Cleanable</code>.']],
    success: 'One robot, two roles. <b>Multitasking, the Java way.</b>',
    gate: 'D',
  };

  const STATIONS = `
interface Station {
    String name();
    int cupsPerHour();
    boolean broken();
}

class Brewer implements Station {
    private String name;
    private int cups;
    private boolean broken;

    Brewer(String name, int cups, boolean broken) {
        this.name = name;
        this.cups = cups;
        this.broken = broken;
    }

    public String name() { return name; }
    public int cupsPerHour() { return cups; }
    public boolean broken() { return broken; }
}

class RoastOven implements Station {
    public String name() { return "Roast Oven"; }
    public int cupsPerHour() { return 90; }
    public boolean broken() { return true; }
}`;
  ch.java2_floor = {
    title: 'The Factory Floor',
    desc: `<p>The floor manager needs a report. Finish the static method ${code('report(List<Station> stations)')}: it gets a list of <b>any</b> Stations and only uses the interface's methods.</p>
      <p>Ignore every station that is ${code('broken()')}. From the working ones, print three lines:</p>
      <ul><li>how many work: ${code('Working: 3')}</li><li>the name of the working one with the most ${code('cupsPerHour()')}: ${code('Busiest: Drip Bar')}</li><li>their cups added up: ${code('Total cups: 150')}</li></ul>
      <p>(The Roast Oven makes 90 cups, but it's broken, so it doesn't count.) Use a loop with variables that you update as you go.</p>`,
    starter: J(STATIONS, `
List<Station> floor = new ArrayList<>();
floor.add(new Brewer("Pour Over", 30, false));
floor.add(new RoastOven());
floor.add(new Brewer("Drip Bar", 70, false));
floor.add(new Brewer("Cold Brew", 60, true));
floor.add(new Brewer("Espresso Bar", 50, false));
report(floor);`, { imports: LIST, methods: `
static void report(List<Station> stations) {
    int working = 0;
    String busiest = "none";
    int most = 0;
    int total = 0;
    // loop over the stations and update the four variables

    System.out.println("Working: " + working);
    System.out.println("Busiest: " + busiest);
    System.out.println("Total cups: " + total);
}` }),
    hints: ['Inside the loop, skip broken stations first (an if with continue, or wrap the rest in if (!s.broken())).', 'For the busiest: if this station\'s cupsPerHour() is bigger than most, remember its cups in most and its name in busiest.'],
    similar: { task: 'Find the tallest of some interface-typed plants that are alive.', code: J('interface Plant {\n    int height();\n    boolean alive();\n}\n\nclass Tree implements Plant {\n    private int h;\n    private boolean ok;\n\n    Tree(int h, boolean ok) {\n        this.h = h;\n        this.ok = ok;\n    }\n\n    public int height() { return h; }\n    public boolean alive() { return ok; }\n}', 'List<Plant> garden = new ArrayList<>();\ngarden.add(new Tree(5, true));\ngarden.add(new Tree(9, false));\ngarden.add(new Tree(7, true));\nint tallest = 0;\nfor (Plant p : garden) {\n    if (p.alive() && p.height() > tallest) {\n        tallest = p.height();\n    }\n}\nSystem.out.println("Tallest: " + tallest);', { imports: LIST }) },
    expect: ['Working: 3', 'Busiest: Drip Bar', 'Total cups: 150'],
    require: [[/for\s*\(\s*Station\s+\w+\s*:|\.forEach\s*\(/, 'Loop over the stations, for example <code>for (Station s : stations)</code>.']],
    success: 'The report works for any station, past or future. <b>The Machine Hall is humming!</b>',
    gate: 'E',
  };

  // ======================================================================= Level 4: collections & lambdas
  ch.java2_rollcall = {
    title: 'Bean Roll Call',
    desc: `<p>A <b>lambda</b> is a tiny method without a name, written right where you need it: ${code('b -> System.out.println(b)')} means "given ${code('b')}, print it". The arrow ${code('->')} separates the input from what to do with it.</p>
      <p>Lists have a ${code('forEach')} method that runs a lambda once for every item. Rewrite the loop below as one line using ${code('beans.forEach(...)')} with a lambda. The output stays the same:</p>${pre('- Arabica\n- Robusta\n- Liberica')}`,
    starter: J('', 'List<String> beans = List.of("Arabica", "Robusta", "Liberica");\n\n// turn this loop into beans.forEach(...) with a lambda\nfor (String b : beans) {\n    System.out.println("- " + b);\n}', { imports: 'import java.util.List;' }),
    hints: ['The lambda takes one bean and prints it with "- " in front.', 'The shape is: beans.forEach(b -> ...);'],
    similar: { task: 'Print every number in a list doubled, with forEach.', code: J('', 'List<Integer> nums = List.of(1, 2, 3);\nnums.forEach(n -> System.out.println(n * 2));', { imports: 'import java.util.List;' }) },
    expect: ['- Arabica', '- Robusta', '- Liberica'],
    require: [[/\.forEach\s*\(/, 'Use <code>beans.forEach(...)</code>.'], [/->/, 'Give <code>forEach</code> a lambda with an arrow <code>-&gt;</code>.'], [/^(?![\s\S]*for\s*\()/, 'Remove the old <code>for</code> loop: <code>forEach</code> does the looping now.']],
    success: 'Three lines became one. <b>Welcome to lambdas.</b>',
    gate: 'A',
  };

  ch.java2_stale = {
    title: 'Toss the Stale Beans',
    desc: `<p>${code('ages')} holds how many days ago each bag of beans was roasted. Bags older than <b>14 days</b> are stale.</p>
      <p>${code('removeIf')} takes a lambda that answers true or false for each item, and removes every item where it says true:</p>${pre('nums.removeIf(n -> n < 0);   // removes all negative numbers')}
      <p>Remove the stale bags, then the program prints the list and how many bags are left:</p>${pre('[3, 8, 14, 2]\nBags left: 4')}`,
    starter: J('', 'List<Integer> ages = new ArrayList<>(List.of(3, 21, 8, 30, 14, 2));\n// remove every bag older than 14 days\n\nSystem.out.println(ages);\nSystem.out.println("Bags left: " + ages.size());', { imports: LIST }),
    hints: ['The lambda gets one age and should be true for the bags you want gone.', 'Older than 14 means age > 14 (a bag of exactly 14 days stays).'],
    similar: { task: 'Remove short words from a list.', code: J('', 'List<String> words = new ArrayList<>(List.of("a", "latte", "is", "warm"));\nwords.removeIf(w -> w.length() < 3);\nSystem.out.println(words);', { imports: LIST }) },
    expect: ['[3, 8, 14, 2]', 'Bags left: 4'],
    require: [[/\.removeIf\s*\(/, 'Use <code>ages.removeIf(...)</code> with a lambda.']],
    success: 'Only fresh beans remain. <b>No loop, no index juggling.</b>',
    gate: 'B',
  };

  const ORDER = `
class Order {
    private String drink;
    private int price;

    Order(String drink, int price) {
        this.drink = drink;
        this.price = price;
    }

    String getDrink() { return drink; }
    int getPrice() { return price; }

    @Override
    public String toString() {
        return drink + " $" + price;
    }
}`;
  ch.java2_sort = {
    title: 'Sort the Orders',
    desc: `<p>${code('list.sort(...)')} takes a <b>comparator</b>: a lambda that gets two items ${code('a')} and ${code('b')} and returns a number. <b>Negative</b> means a goes first, <b>positive</b> means b goes first. For numbers, ${code('a - b')} sorts small to big.</p>
      <p>For Strings, ${code('a.compareTo(b)')} gives exactly such a number, in alphabetical order.</p>
      <p>Sort the orders twice and print after each sort:</p>${pre('Cheapest first: [tea $2, espresso $3, latte $4, mocha $5]\nA to Z: [espresso $3, latte $4, mocha $5, tea $2]')}`,
    starter: J(ORDER, `
List<Order> orders = new ArrayList<>();
orders.add(new Order("latte", 4));
orders.add(new Order("espresso", 3));
orders.add(new Order("mocha", 5));
orders.add(new Order("tea", 2));

// sort by price, cheapest first
System.out.println("Cheapest first: " + orders);

// sort by drink name, A to Z
System.out.println("A to Z: " + orders);`, { imports: LIST }),
    hints: ['orders.sort((a, b) -> ...); where the lambda compares a.getPrice() and b.getPrice().', 'For the names, the lambda returns a.getDrink().compareTo(b.getDrink()).'],
    similar: { task: 'Sort words by length, shortest first.', code: J('', 'List<String> words = new ArrayList<>(List.of("cappuccino", "tea", "mocha"));\nwords.sort((a, b) -> a.length() - b.length());\nSystem.out.println(words);', { imports: LIST }) },
    expect: ['Cheapest first: [tea $2, espresso $3, latte $4, mocha $5]', 'A to Z: [espresso $3, latte $4, mocha $5, tea $2]'],
    require: [[/\.sort\s*\([\s\S]*->[\s\S]*\.sort\s*\(/, 'Sort the list twice with <code>orders.sort(...)</code> and a comparator lambda.']],
    success: 'The orders line up however you like. <b>Comparators: sorting by any rule.</b>',
    gate: 'C',
  };

  ch.java2_tally = {
    title: 'The Order Tally',
    desc: `<p>A ${code('HashMap<String, Integer>')} is perfect for counting. ${code('merge')} does "put this, or combine it with what's already there" in one step:</p>${pre('counts.merge(drink, 1, (old, one) -> old + one);')}
      <p>If ${code('drink')} isn't in the map yet it gets 1; otherwise the lambda adds 1 to the old count. (The shortcut ${code('Integer::sum')} does the same.)</p>
      <p>Count every order in ${code('orders')}. The given code then prints:</p>${pre('latte: 3\ntea: 2\nmocha: 1\nespresso: 0')}
      <p>Note: a HashMap doesn't keep any order, so we look the drinks up by name.</p>`,
    starter: J('', `
List<String> orders = List.of("latte", "tea", "latte", "mocha", "latte", "tea");
Map<String, Integer> counts = new HashMap<>();
// count the orders

for (String d : List.of("latte", "tea", "mocha", "espresso")) {
    System.out.println(d + ": " + counts.getOrDefault(d, 0));
}`, { imports: UTIL }),
    hints: ['Loop over orders (a for-each loop or orders.forEach) and update counts for each drink.', 'counts.merge(d, 1, ...) adds one for drink d. getOrDefault(d, 0) + 1 with put works too.'],
    similar: { task: 'Count letters in a word with a HashMap.', code: J('', 'Map<Character, Integer> letters = new HashMap<>();\nfor (char ch : "moose".toCharArray()) {\n    letters.merge(ch, 1, (a, b) -> a + b);\n}\nSystem.out.println("o: " + letters.get(\'o\'));', { imports: UTIL }) },
    expect: ['latte: 3', 'tea: 2', 'mocha: 1', 'espresso: 0'],
    require: [[/\.merge\s*\(|\.put\s*\(/, 'Store the counts in the map with <code>merge</code> (or <code>put</code>).']],
    success: 'Every order counted. <b>Maps and lambdas, working together.</b>',
    gate: 'D',
  };

  ch.java2_stream = {
    title: 'The Stream Line',
    desc: `<p>A <b>stream</b> is a conveyor belt for data. You put a list on it with ${code('.stream()')}, add stations, and collect what comes out:</p>
      <ul><li>${code('.filter(t -> ...)')} keeps only items where the lambda is true</li><li>${code('.map(t -> ...)')} turns each item into something new</li><li>${code('.collect(Collectors.toList())')} gathers the results into a new list</li><li>${code('.count()')} counts what's left</li></ul>
      <p>From ${code('temps')}, make a list of the good brewing temperatures (<b>90 to 96</b>, both included) as labels like ${code('"93C"')}. Then count the ones that are too hot (above 96):</p>${pre('[93C, 91C, 95C, 90C]\nToo hot: 2')}`,
    starter: J('', `
List<Integer> temps = List.of(88, 93, 97, 91, 85, 95, 99, 90);

List<String> good = new ArrayList<>();   // use a stream to build this
long tooHot = 0;                          // and this

System.out.println(good);
System.out.println("Too hot: " + tooHot);`, { imports: STREAMS }),
    hints: ['good = temps.stream().filter(...).map(...).collect(Collectors.toList());', 'For the map step, t + "C" turns 93 into "93C". For tooHot, a second stream with a different filter, ending in .count().'],
    similar: { task: 'Square the even numbers with a stream.', code: J('', 'List<Integer> nums = List.of(1, 2, 3, 4);\nList<Integer> squares = nums.stream()\n    .filter(n -> n % 2 == 0)\n    .map(n -> n * n)\n    .collect(Collectors.toList());\nSystem.out.println(squares);', { imports: STREAMS }) },
    expect: ['[93C, 91C, 95C, 90C]', 'Too hot: 2'],
    require: [[/\.stream\s*\(\s*\)/, 'Use <code>temps.stream()</code>.'], [/\.filter\s*\(/, 'Use <code>.filter(...)</code> to keep the right temperatures.'], [/\.map\s*\(/, 'Use <code>.map(...)</code> to turn numbers into labels.']],
    success: 'Data in, answers out, and no loop in sight. <b>The Stream Line flows!</b>',
    gate: 'E',
  };

  const SALE = `
class Sale {
    private String drink;
    private int cups;
    private int price;

    Sale(String drink, int cups, int price) {
        this.drink = drink;
        this.cups = cups;
        this.price = price;
    }

    String getDrink() { return drink; }
    int getCups() { return cups; }
    int revenue() { return cups * price; }
}`;
  ch.java2_report = {
    title: 'The Daily Report',
    desc: `<p>The owner wants today's report, and streams can answer each question in one line. Some more stream tools:</p>
      <ul><li>${code('.mapToInt(s -> s.getCups()).sum()')} adds up numbers</li><li>${code('.sorted()')} puts items in order</li><li>${code('.collect(Collectors.joining(", "))')} glues Strings together</li><li>${code('.max((a, b) -> ...)')} finds the biggest using a comparator, and ${code('.get()')} takes it out of the ${code('Optional')} box it comes in</li></ul>
      <p>Print exactly these four lines:</p>${pre('Cups sold: 15\nBig orders: espresso, latte, mocha\nRevenue: $52\nBest seller: latte')}
      <p>Big orders are sales of <b>3 or more cups</b>, sorted A to Z. The best seller is the sale with the highest ${code('revenue()')}.</p>`,
    starter: J(SALE, `
List<Sale> sales = List.of(
    new Sale("latte", 4, 4),
    new Sale("tea", 2, 2),
    new Sale("mocha", 3, 5),
    new Sale("espresso", 5, 3),
    new Sale("tea", 1, 2)
);

System.out.println("Cups sold: " + 0);
System.out.println("Big orders: " + "");
System.out.println("Revenue: $" + 0);
System.out.println("Best seller: " + "");`, { imports: STREAMS }),
    hints: ['Each line is its own stream: sales.stream() then one or two stations, then an ending like sum(), collect(...) or max(...).get().', 'Big orders: filter cups >= 3, map to the drink name, sorted(), then joining. Best seller: max by revenue, .get(), then .getDrink().'],
    similar: { task: 'Total and longest name from a list of names, with streams.', code: J('', 'List<String> names = List.of("Ada", "Grace", "Linus");\nint letters = names.stream().mapToInt(n -> n.length()).sum();\nString longest = names.stream().max((a, b) -> a.length() - b.length()).get();\nSystem.out.println(letters + " " + longest);', { imports: STREAMS }) },
    expect: ['Cups sold: 15', 'Big orders: espresso, latte, mocha', 'Revenue: $52', 'Best seller: latte'],
    require: [[/\.stream\s*\(\s*\)[\s\S]*\.stream\s*\(\s*\)[\s\S]*\.stream\s*\(\s*\)/, 'Use streams (<code>sales.stream()</code>) to answer the questions.']],
    success: 'Four questions, four streams. <b>The Bean Market\'s books are balanced!</b>',
    gate: 'G',
  };

  // ======================================================================= Level 5: exceptions (and everything together)
  ch.java2_spill = {
    title: 'Catch the Spill',
    desc: `<p>When something goes wrong while a program runs, Java <b>throws an exception</b>. If nobody catches it, the whole program crashes. Run the code and see: sharing 5 cups between 0 people is a division by zero.</p>
      <p>Wrap the two risky lines in a ${code('try')} block and add a ${code('catch (ArithmeticException e)')} block that prints <b>Cannot share between 0 people</b>. The rest of the program then carries on:</p>${pre('3\nCannot share between 0 people\nStill running!')}`,
    starter: J('', 'System.out.println(cupsEach(12, 4));\nSystem.out.println(cupsEach(5, 0));\nSystem.out.println("Still running!");', { methods: 'static int cupsEach(int cups, int people) {\n    return cups / people;\n}' }),
    hints: ['try { ...risky lines... } catch (ArithmeticException e) { ...what to do instead... }', '"Still running!" goes after the catch block, so it runs either way.'],
    similar: { task: 'Catch a list index that is too big.', code: J('', 'int[] cups = {1, 2, 3};\ntry {\n    System.out.println(cups[10]);\n} catch (ArrayIndexOutOfBoundsException e) {\n    System.out.println("No such cup!");\n}\nSystem.out.println("Done");') },
    expect: ['3', 'Cannot share between 0 people', 'Still running!'],
    require: [[/\btry\s*\{/, 'Wrap the risky lines in a <code>try { }</code> block.'], [/catch\s*\(\s*ArithmeticException\s+\w+\s*\)/, 'Catch it with <code>catch (ArithmeticException e)</code>.']],
    success: 'Spill caught, floor still dry. <b>Your program survives its first exception.</b>',
    gate: 'A',
  };

  ch.java2_valve = {
    title: 'Finally, Close the Valve',
    desc: `<p>A ${code('finally')} block runs <b>no matter what</b>: after the try finishes normally, and also when an exception flies out of it. It's where cleanup goes, like closing a steam valve.</p>
      <p>In ${code('brew')}, the valve must always close. Put the scoop line in a ${code('try')}, and the "Valve closed" line in a ${code('finally')}. (No catch needed in ${code('brew')}: ${code('main')} already catches the error.)</p>${pre('Valve open\nEach scoop: 8g\nValve closed\nValve open\nValve closed\nBrew failed: / by zero')}
      <p>See how "Valve closed" appears even though the second brew failed.</p>`,
    starter: J('', 'try {\n    brew(3);\n    brew(0);\n} catch (ArithmeticException e) {\n    System.out.println("Brew failed: " + e.getMessage());\n}', { methods: 'static void brew(int scoops) {\n    System.out.println("Valve open");\n    System.out.println("Each scoop: " + (24 / scoops) + "g");\n    System.out.println("Valve closed");   // must ALWAYS happen\n}' }),
    hints: ['A try can be followed by just a finally, with no catch.', 'try { the scoop line } finally { the valve closed line }'],
    similar: { task: 'A door that always closes, even after an error.', code: J('', 'try {\n    System.out.println("Door open");\n    System.out.println(10 / 0);\n} catch (ArithmeticException e) {\n    System.out.println("Oops");\n} finally {\n    System.out.println("Door shut");\n}') },
    expect: ['Valve open', 'Each scoop: 8g', 'Valve closed', 'Valve open', 'Valve closed', 'Brew failed: / by zero'],
    require: [[/\bfinally\s*\{/, 'Use a <code>finally { }</code> block for the valve.']],
    success: 'Whatever happens, the valve closes. <b>No more steam leaks.</b>',
    gate: 'B',
  };

  ch.java2_badorder = {
    title: 'Throw Back the Bad Order',
    desc: `<p>You can throw exceptions too! ${code('throw new IllegalArgumentException("message")')} stops the method at once and hands the problem to whoever called it.</p>
      <p>This pairs perfectly with encapsulation: a setter that refuses bad values <b>loudly</b>. Make ${code('setCups')} throw an ${code('IllegalArgumentException')} when the cups are below 1 or above 10, with the message ${code('cups must be 1 to 10, got 12')} (using the real number).</p>${pre('Order for 2 cups\nRejected: cups must be 1 to 10, got 0\nRejected: cups must be 1 to 10, got 12\nOrder for 5 cups')}`,
    starter: J(`
class Order {
    private int cups;

    public void setCups(int cups) {
        // refuse anything below 1 or above 10
        this.cups = cups;
    }

    public int getCups() {
        return cups;
    }
}`, `
int[] requests = {2, 0, 12, 5};
for (int n : requests) {
    try {
        Order o = new Order();
        o.setCups(n);
        System.out.println("Order for " + o.getCups() + " cups");
    } catch (IllegalArgumentException e) {
        System.out.println("Rejected: " + e.getMessage());
    }
}`),
    hints: ['Check the value with an if before storing it.', 'Inside the if: throw new IllegalArgumentException("cups must be 1 to 10, got " + cups);'],
    similar: { task: 'An Age setter that throws for negative ages.', code: J('class Person {\n    private int age;\n\n    public void setAge(int age) {\n        if (age < 0) {\n            throw new IllegalArgumentException("age cannot be negative");\n        }\n        this.age = age;\n    }\n}', 'try {\n    new Person().setAge(-3);\n} catch (IllegalArgumentException e) {\n    System.out.println("Error: " + e.getMessage());\n}') },
    expect: ['Order for 2 cups', 'Rejected: cups must be 1 to 10, got 0', 'Rejected: cups must be 1 to 10, got 12', 'Order for 5 cups'],
    require: [[/throw\s+new\s+IllegalArgumentException\s*\(/, 'Use <code>throw new IllegalArgumentException(...)</code>.']],
    success: 'Bad orders bounce right back with a clear reason. <b>Fail loudly, fail early.</b>',
    gate: 'C',
  };

  ch.java2_alarm = {
    title: 'The Overheat Alarm',
    desc: `<p>You can make your <b>own</b> exception class: ${code('class OverheatException extends Exception')}. Give it a constructor that takes a message and passes it to the parent with ${code('super(message)')}.</p>
      <p>Exceptions that extend ${code('Exception')} (but not ${code('RuntimeException')}) are <b>checked</b>: Java insists that a method which can throw one says so with ${code('throws')}, and that callers catch it.</p>${pre('void heat(int degrees) throws OverheatException {')}
      <ol><li>Give ${code('OverheatException')} its constructor.</li><li>Make ${code('heat')} declare ${code('throws OverheatException')}, and throw one when the temperature goes above 100, with the message ${code('Boiler at 110 degrees!')} (the real temperature).</li></ol>${pre('Temp: 60\nALARM: Boiler at 110 degrees!')}`,
    starter: J(`
class OverheatException extends Exception {
    // a constructor that takes a message and passes it to super
}

class Boiler {
    private int temp = 0;

    public void heat(int degrees) {
        temp += degrees;
        // above 100? throw an OverheatException
    }

    public int getTemp() {
        return temp;
    }
}`, `
Boiler b = new Boiler();
try {
    b.heat(60);
    System.out.println("Temp: " + b.getTemp());
    b.heat(50);
    System.out.println("Temp: " + b.getTemp());
} catch (OverheatException e) {
    System.out.println("ALARM: " + e.getMessage());
}`),
    hints: ['The constructor looks like: OverheatException(String message) { super(message); }', 'heat needs three things: throws OverheatException after its brackets, an if (temp > 100), and inside it throw new OverheatException(...).'],
    similar: { task: 'A custom checked EmptyCupException.', code: J('class EmptyCupException extends Exception {\n    EmptyCupException(String message) {\n        super(message);\n    }\n}', 'try {\n    sip(0);\n} catch (EmptyCupException e) {\n    System.out.println("Sad: " + e.getMessage());\n}', { methods: 'static void sip(int ml) throws EmptyCupException {\n    if (ml == 0) {\n        throw new EmptyCupException("the cup is empty");\n    }\n    System.out.println("sip");\n}' }) },
    expect: ['Temp: 60', 'ALARM: Boiler at 110 degrees!'],
    require: [[/class\s+OverheatException\s+extends\s+Exception/, 'Keep <code>class OverheatException extends Exception</code>.'], [/throws\s+OverheatException/, '<code>heat</code> must declare <code>throws OverheatException</code>.'], [/throw\s+new\s+OverheatException\s*\(/, 'Throw it with <code>throw new OverheatException(...)</code>.']],
    success: 'The alarm rings exactly when it should. <b>Your own exception, checked by Java itself.</b>',
    gate: 'D',
  };

  ch.java2_kinds = {
    title: 'Many Kinds of Trouble',
    desc: `<p>One ${code('try')} can have <b>several</b> ${code('catch')} blocks, one for each kind of problem. Java picks the <b>first</b> one that matches, so put the most specific ones first.</p>
      <p>Orders arrive as text. ${code('Integer.parseInt("two")')} throws a ${code('NumberFormatException')}. Finish the job:</p>
      <ol><li>In ${code('parseCups')}, throw an ${code('IllegalArgumentException("must order at least 1 cup")')} when the number is below 1.</li>
      <li>In ${code('main')}, add a second catch for ${code('IllegalArgumentException')} that prints ${code('Bad order: ')} and the message.</li></ol>${pre('2 cups\nNot a number: two\nBad order: must order at least 1 cup\n5 cups\nTotal cups: 7')}
      <p>(Fun fact: NumberFormatException is a kind of IllegalArgumentException, so its catch must come first.)</p>`,
    starter: J('', `
String[] inputs = {"2", "two", "0", "5"};
int total = 0;
for (String text : inputs) {
    try {
        int cups = parseCups(text);
        total += cups;
        System.out.println(cups + " cups");
    } catch (NumberFormatException e) {
        System.out.println("Not a number: " + text);
    }
    // add a catch for IllegalArgumentException
}
System.out.println("Total cups: " + total);`, { methods: 'static int parseCups(String text) {\n    int cups = Integer.parseInt(text);\n    // below 1? throw an IllegalArgumentException\n    return cups;\n}' }),
    hints: ['A second catch goes right after the first one\'s closing brace.', 'In parseCups: if (cups < 1) { throw new IllegalArgumentException("must order at least 1 cup"); }'],
    similar: { task: 'Two catch blocks for two different problems.', code: J('', 'String[] codes = {"7", "x"};\nfor (String s : codes) {\n    try {\n        int n = Integer.parseInt(s);\n        System.out.println(100 / (n - 7));\n    } catch (NumberFormatException e) {\n        System.out.println("bad text");\n    } catch (ArithmeticException e) {\n        System.out.println("bad maths");\n    }\n}') },
    expect: ['2 cups', 'Not a number: two', 'Bad order: must order at least 1 cup', '5 cups', 'Total cups: 7'],
    require: [[/throw\s+new\s+IllegalArgumentException\s*\(/, 'Throw an <code>IllegalArgumentException</code> in <code>parseCups</code>.'], [/catch\s*\(\s*IllegalArgumentException\s+\w+\s*\)/, 'Add <code>catch (IllegalArgumentException e)</code> in <code>main</code>.']],
    success: 'Each kind of trouble gets its own answer. <b>Robust code!</b>',
    gate: 'E',
  };

  const GRAND = `
class OutOfBeansException extends Exception {
    OutOfBeansException(String message) {
        super(message);
    }
}

interface Recipe {
    String name();
    int beansNeeded();
}

class Espresso implements Recipe {
    public String name() { return "Espresso"; }
    public int beansNeeded() { return 7; }
}

class Latte implements Recipe {
    public String name() { return "Latte"; }
    public int beansNeeded() { return 9; }
}

// 1. write class Mocha: name "Mocha", needs 10 beans

class CoffeeMachine {
    private int beans;
    private static int cupsServed = 0;

    CoffeeMachine(int beans) {
        this.beans = beans;
    }

    public void make(Recipe r) throws OutOfBeansException {
        // 2. not enough beans? throw new OutOfBeansException("Not enough beans for " + r.name())
        //    otherwise: use up the beans, count the cup, print "Made " + r.name()
    }

    public int getBeans() {
        return beans;
    }

    public static int getCupsServed() {
        return cupsServed;
    }
}`;
  ch.java2_grand = {
    title: 'The Grand Brew',
    desc: `<p>The final machine uses <b>everything</b> from this chapter: an interface, private fields, a static counter, a custom checked exception, a list and a stream.</p>
      <ol>
        <li>Write ${code('class Mocha implements Recipe')}: its name is <b>Mocha</b> and it needs <b>10</b> beans.</li>
        <li>Finish ${code('make(Recipe r)')}: if there aren't enough beans, throw ${code('new OutOfBeansException("Not enough beans for " + r.name())')}. Otherwise take the beans away, add 1 to ${code('cupsServed')}, and print ${code('Made Latte')} (the name).</li>
        <li>In ${code('main')}, make every recipe in the queue. Catch ${code('OutOfBeansException')} for each one: print ${code('Skipped: ')} plus the message, and add the recipe's name to ${code('failed')}.</li>
        <li>Print the served line, then the failed names <b>sorted A to Z</b> and joined with ", " using a stream.</li>
      </ol>${pre('Made Latte\nMade Espresso\nMade Mocha\nSkipped: Not enough beans for Latte\nSkipped: Not enough beans for Espresso\nServed: 3 cups, 4 beans left\nFailed: Espresso, Latte')}`,
    starter: J(GRAND, `
List<Recipe> queue = new ArrayList<>();
queue.add(new Latte());
queue.add(new Espresso());
queue.add(new Mocha());
queue.add(new Latte());
queue.add(new Espresso());

CoffeeMachine machine = new CoffeeMachine(30);
List<String> failed = new ArrayList<>();

// 3. make every recipe; on OutOfBeansException print "Skipped: " + the message and remember the name

System.out.println("Served: " + CoffeeMachine.getCupsServed() + " cups, " + machine.getBeans() + " beans left");
// 4. print "Failed: " + the failed names, sorted and joined with ", "`, { imports: STREAMS }),
    hints: ['Start with Mocha (copy Latte) and make(): an if (r.beansNeeded() > beans) that throws, then the three "it worked" lines.', 'In main: for (Recipe r : queue) { try { machine.make(r); } catch (OutOfBeansException e) { ... failed.add(r.name()); } }. For the last line: failed.stream().sorted().collect(Collectors.joining(", ")).'],
    similar: { task: 'A smaller version: a ticket machine with a custom exception and a stream.', code: J('class SoldOutException extends Exception {\n    SoldOutException(String message) {\n        super(message);\n    }\n}\n\nclass TicketBooth {\n    private int left = 2;\n\n    public void sell(String who) throws SoldOutException {\n        if (left == 0) {\n            throw new SoldOutException("no ticket for " + who);\n        }\n        left--;\n        System.out.println("Ticket for " + who);\n    }\n}', 'TicketBooth booth = new TicketBooth();\nList<String> sad = new ArrayList<>();\nfor (String who : List.of("Ann", "Bo", "Cy", "Al")) {\n    try {\n        booth.sell(who);\n    } catch (SoldOutException e) {\n        sad.add(who);\n    }\n}\nSystem.out.println("Missed out: " + sad.stream().sorted().collect(Collectors.joining(" & ")));', { imports: STREAMS }) },
    expect: ['Made Latte', 'Made Espresso', 'Made Mocha', 'Skipped: Not enough beans for Latte', 'Skipped: Not enough beans for Espresso', 'Served: 3 cups, 4 beans left', 'Failed: Espresso, Latte'],
    require: [[/class\s+Mocha\s+implements\s+Recipe/, 'Write <code>class Mocha implements Recipe</code>.'], [/throw\s+new\s+OutOfBeansException\s*\(/, 'In <code>make</code>, throw <code>new OutOfBeansException(...)</code> when the beans run out.'], [/catch\s*\(\s*OutOfBeansException\s+\w+\s*\)/, 'Catch <code>OutOfBeansException</code> in <code>main</code>.'], [/cupsServed\s*(\+\+|\+=)|\+\+\s*cupsServed/, 'Count each cup in the static <code>cupsServed</code>.'], [/failed\s*\.\s*stream\s*\(\s*\)/, 'Build the last line with <code>failed.stream()</code>.']],
    success: 'The Grand Brew pours perfectly, and every problem is handled. <b>You have mastered the Coffee Works!</b>',
    gate: 'G',
  };

  // ======================================================================= tutorials
  const T1 = [
    page('private: keep it inside',
      `<p>In Chapter 1, anyone could reach into an object and change its fields. That's risky: some code could set a jar's beans to -5!</p><p>Mark a field <code>private</code> and only code <b>inside its own class</b> can use it. Everything else gets an error. Run this to see it, then delete the bad line.</p>`,
      J('class Jar {\n    private int beans = 5;\n}', 'Jar j = new Jar();\nj.beans = -5;\nSystem.out.println("Changed it!");'), { expectError: true }),
    page('Getters and setters',
      `<p>To let the outside world use a private field <b>safely</b>, a class offers public methods:</p><ul><li>a <b>getter</b> like <code>getBeans()</code> returns the value</li><li>a <b>setter</b> like <code>setBeans(int b)</code> changes it, and can <b>check</b> the new value first</li></ul><p>Hiding fields and offering methods like this is called <b>encapsulation</b>. The class is in charge of its own data.</p>`,
      J('class Jar {\n    private int beans = 5;\n\n    public int getBeans() {\n        return beans;\n    }\n\n    public void setBeans(int beans) {\n        if (beans >= 0) {\n            this.beans = beans;\n        } else {\n            System.out.println("No negative beans!");\n        }\n    }\n}', 'Jar j = new Jar();\nj.setBeans(-5);\nj.setBeans(12);\nSystem.out.println(j.getBeans());')),
    page('static: one for the whole class',
      `<p>A normal field: every object has its <b>own</b> copy. A <code>static</code> field belongs to the <b>class</b>: one copy, shared by all objects. Perfect for counting how many objects were made.</p><p>A <code>static</code> method is called on the class name, like <code>Cup.getMade()</code>, without any object.</p>`,
      J('class Cup {\n    private static int made = 0;\n\n    public Cup() {\n        made++;\n    }\n\n    public static int getMade() {\n        return made;\n    }\n}', 'new Cup();\nnew Cup();\nnew Cup();\nSystem.out.println("Cups: " + Cup.getMade());')),
    page('static final: constants',
      `<p><code>final</code> means "can't be changed after it's set". Together, <code>static final</code> makes a <b>constant</b>: one shared value that never changes. Java programmers write constants in CAPITALS.</p><p>You have used static methods all along: <code>Math.max</code> and <code>Integer.parseInt</code> are called on the class, never on an object.</p>`,
      J('class Shop {\n    static final int CUP_PRICE = 3;\n\n    static int cost(int cups) {\n        return cups * CUP_PRICE;\n    }\n}', 'System.out.println(Shop.cost(4));\nSystem.out.println(Math.max(Shop.cost(2), 5));')),
    page('Cheat sheet',
      cheat([
        ['private int beans;', 'only this class can touch it'],
        ['public int getBeans()', 'a getter: returns the value'],
        ['public void setBeans(int b)', 'a setter: checks, then stores'],
        ['private static int made;', 'one shared copy for the whole class'],
        ['static int cost(int n)', 'call it as Shop.cost(4), no object needed'],
        ['static final int MAX = 10;', 'a constant'],
      ])),
  ];
  const T2 = [
    page('extends: is-a',
      `<p><code>class Latte extends Drink</code> says "a Latte <b>is a</b> Drink". Latte <b>inherits</b> every field and method of Drink, and can add new ones. Drink is the <b>parent</b> (or superclass), Latte the <b>child</b> (or subclass).</p>`,
      J('class Drink {\n    String sip() {\n        return "sip...";\n    }\n}\n\nclass Latte extends Drink {\n    String foam() {\n        return "foam!";\n    }\n}', 'Latte l = new Latte();\nSystem.out.println(l.sip());\nSystem.out.println(l.foam());')),
    page('super(...): build the parent first',
      `<p>If the parent's constructor needs values, the child's constructor must pass them up with <code>super(...)</code> on its <b>first line</b>. Private fields of the parent can only be filled this way.</p>`,
      J('class Drink {\n    private String name;\n\n    Drink(String name) {\n        this.name = name;\n    }\n\n    String getName() {\n        return name;\n    }\n}\n\nclass Tea extends Drink {\n    Tea() {\n        super("Green tea");\n    }\n}', 'System.out.println(new Tea().getName());')),
    page('@Override: replace a method',
      `<p>A child can write its own version of a parent's method (same name, same parameters). That's <b>overriding</b>. The child's version is used, even when the call happens <i>inside</i> a parent method.</p><p><code>@Override</code> asks Java to double-check that you really are overriding something. Try misspelling <code>price</code> in Mocha and run it.</p>`,
      J('class Drink {\n    double price() {\n        return 2.0;\n    }\n\n    String label() {\n        return "costs $" + price();\n    }\n}\n\nclass Mocha extends Drink {\n    @Override\n    double price() {\n        return 3.5;\n    }\n}', 'System.out.println(new Drink().label());\nSystem.out.println(new Mocha().label());')),
    page('super.method() and toString()',
      `<p>Inside an override, <code>super.method()</code> runs the parent's version, so you can build on it instead of starting over.</p><p>Every class extends <code>Object</code>, which has <code>public String toString()</code>. Printing an object calls it, so overriding it makes objects print nicely.</p>`,
      J('class Coffee {\n    String recipe() {\n        return "espresso";\n    }\n\n    @Override\n    public String toString() {\n        return "Coffee: " + recipe();\n    }\n}\n\nclass Latte extends Coffee {\n    @Override\n    String recipe() {\n        return super.recipe() + " + milk";\n    }\n}', 'System.out.println(new Coffee());\nSystem.out.println(new Latte());')),
    page('Polymorphism',
      `<p>A variable or list of the <b>parent</b> type can hold any child. When you call a method, each object uses <b>its own</b> version. One loop, many behaviours: that's <b>polymorphism</b>.</p>`,
      J('class Drink {\n    String sound() { return "..."; }\n}\n\nclass Soda extends Drink {\n    @Override\n    String sound() { return "fizz"; }\n}\n\nclass Soup extends Drink {\n    @Override\n    String sound() { return "slurp"; }\n}', 'List<Drink> drinks = new ArrayList<>();\ndrinks.add(new Soda());\ndrinks.add(new Soup());\ndrinks.add(new Drink());\nfor (Drink d : drinks) {\n    System.out.println(d.sound());\n}', { imports: LIST })),
    page('Cheat sheet',
      cheat([
        ['class Latte extends Drink', 'Latte is a Drink, and inherits from it'],
        ['super("Latte", ml);', 'call the parent constructor (first line)'],
        ['@Override', 'goes above a method that replaces the parent\'s'],
        ['super.recipe()', 'the parent\'s version of the method'],
        ['public String toString()', 'how an object prints'],
        ['List<Drink> menu', 'can hold any kind of Drink'],
      ])),
  ];
  const T3 = [
    page('An interface is a contract',
      `<p>An <code>interface</code> lists methods without bodies. A class that <code>implements</code> it promises to write all of them. Interface methods are always <b>public</b>, so the class writes them with <code>public</code>.</p>`,
      J('interface Brewer {\n    String brew();\n}\n\nclass Kettle implements Brewer {\n    public String brew() {\n        return "hot water";\n    }\n}', 'Brewer b = new Kettle();\nSystem.out.println(b.brew());')),
    page('A broken promise',
      `<p>If a class says <code>implements Brewer</code> but doesn't write <code>brew()</code>, Java refuses to run the program. Read the error, then add the missing method to fix it.</p>`,
      J('interface Brewer {\n    String brew();\n}\n\nclass Teapot implements Brewer {\n}', 'Brewer b = new Teapot();\nSystem.out.println(b.brew());'), { expectError: true }),
    page('Code that works with any of them',
      `<p>Write code against the <b>interface</b>, and it works with every class that implements it, including ones that don't exist yet. A <code>List&lt;Machine&gt;</code> doesn't care which machines are inside.</p>`,
      J('interface Machine {\n    int watts();\n}\n\nclass Grinder implements Machine {\n    public int watts() { return 300; }\n}\n\nclass Kettle implements Machine {\n    public int watts() { return 1200; }\n}', 'List<Machine> all = List.of(new Grinder(), new Kettle());\nint total = 0;\nfor (Machine m : all) {\n    total += m.watts();\n}\nSystem.out.println("Total: " + total + "W");', { imports: 'import java.util.List;' })),
    page('Abstract classes',
      `<p>An <code>abstract class</code> is half a blueprint: it can have fields, constructors and normal methods, plus <code>abstract</code> methods without a body that children must fill in. You can't create one with <code>new</code>, only its children.</p>`,
      J('abstract class Machine {\n    abstract int cupsPerHour();\n\n    String report() {\n        return cupsPerHour() + " cups an hour";\n    }\n}\n\nclass Drip extends Machine {\n    @Override\n    int cupsPerHour() {\n        return 40;\n    }\n}', 'Machine m = new Drip();\nSystem.out.println(m.report());')),
    page('One parent, many interfaces',
      `<p>A class can <code>extend</code> only <b>one</b> class, but <code>implement</code> as many interfaces as it likes, separated by commas. Rule of thumb: use an <b>abstract class</b> to share code between close relatives, and an <b>interface</b> to describe something many unrelated classes can do.</p>`,
      J('interface Brewer {\n    String brew();\n}\n\ninterface Cleanable {\n    String clean();\n}\n\nclass Robot implements Brewer, Cleanable {\n    public String brew() { return "flat white"; }\n    public String clean() { return "all shiny"; }\n}', 'Robot r = new Robot();\nSystem.out.println(r.brew() + ", " + r.clean());')),
    page('Cheat sheet',
      cheat([
        ['interface Brewer { String brew(); }', 'a contract: methods without bodies'],
        ['class K implements Brewer', 'K promises to write brew()'],
        ['public String brew() { ... }', 'interface methods are public'],
        ['abstract class Machine', 'half a blueprint, no new Machine()'],
        ['abstract int cupsPerHour();', 'children must fill this in'],
        ['class R implements A, B', 'one class, several interfaces'],
      ])),
  ];
  const T4 = [
    page('Lambdas',
      `<p>A <b>lambda</b> is a mini method with no name: inputs, an arrow <code>-&gt;</code>, then what to do. <code>x -&gt; x * 2</code> takes x and gives back x * 2. Two inputs go in brackets: <code>(a, b) -&gt; a + b</code>.</p><p><code>forEach</code> runs a lambda once for each item in a list.</p>`,
      J('', 'List<String> beans = List.of("Arabica", "Robusta");\nbeans.forEach(b -> System.out.println("I love " + b));', { imports: 'import java.util.List;' })),
    page('removeIf',
      `<p><code>removeIf</code> removes every item for which the lambda says <code>true</code>. (Removing items inside a normal for-each loop crashes with a <code>ConcurrentModificationException</code>, so this is the safe way.)</p><p><code>List.of(...)</code> makes a list that can't change, so we copy it into a <code>new ArrayList&lt;&gt;(...)</code> first.</p>`,
      J('', 'List<Integer> nums = new ArrayList<>(List.of(4, -1, 7, -3, 0));\nnums.removeIf(n -> n < 0);\nSystem.out.println(nums);', { imports: LIST })),
    page('Sorting with comparators',
      `<p><code>list.sort((a, b) -&gt; ...)</code> needs a lambda that compares two items: negative means a first, positive means b first, zero means "same". <code>a - b</code> sorts numbers up, <code>b - a</code> sorts them down, and <code>a.compareTo(b)</code> sorts Strings A to Z.</p>`,
      J('', 'List<String> drinks = new ArrayList<>(List.of("mocha", "tea", "cappuccino"));\ndrinks.sort((a, b) -> a.compareTo(b));\nSystem.out.println(drinks);\ndrinks.sort((a, b) -> a.length() - b.length());\nSystem.out.println(drinks);', { imports: LIST })),
    page('HashMap and merge',
      `<p>A <code>HashMap</code> stores key/value pairs. <code>getOrDefault(key, 0)</code> reads a value, or 0 if the key is missing. <code>merge(key, 1, (a, b) -&gt; a + b)</code> adds 1 to a count, starting it if needed.</p><p>A HashMap keeps <b>no particular order</b>, so look things up by key instead of relying on the order it prints in.</p>`,
      J('', 'Map<String, Integer> counts = new HashMap<>();\nfor (String d : List.of("tea", "latte", "tea")) {\n    counts.merge(d, 1, (a, b) -> a + b);\n}\nSystem.out.println("tea: " + counts.get("tea"));\nSystem.out.println("mocha: " + counts.getOrDefault("mocha", 0));', { imports: UTIL })),
    page('Streams',
      `<p>A stream sends a list's items through a chain of steps. <code>filter</code> keeps some, <code>map</code> changes each one, and an ending like <code>collect</code>, <code>count</code>, <code>sum</code> or <code>max</code> produces the answer. The original list is not changed.</p><p>On the last line, <code>String::valueOf</code> is a <b>method reference</b>: a shortcut for the lambda <code>t -&gt; String.valueOf(t)</code>. Likewise <code>Order::getPrice</code> means <code>o -&gt; o.getPrice()</code>.</p>`,
      J('', 'List<Integer> temps = List.of(88, 93, 97, 91);\nList<String> good = temps.stream()\n    .filter(t -> t >= 90 && t <= 96)\n    .map(t -> t + "C")\n    .collect(Collectors.toList());\nSystem.out.println(good);\nint sum = temps.stream().mapToInt(t -> t).sum();\nSystem.out.println("Sum: " + sum);\nSystem.out.println(temps.stream().map(String::valueOf).collect(Collectors.joining(" / ")));', { imports: STREAMS })),
    page('Cheat sheet',
      cheat([
        ['x -> x * 2', 'a lambda'],
        ['list.forEach(x -> ...)', 'do something with each item'],
        ['list.removeIf(x -> x < 0)', 'remove matching items'],
        ['list.sort((a, b) -> a - b)', 'sort with a comparator'],
        ['map.merge(k, 1, (a, b) -> a + b)', 'count with a HashMap'],
        ['.stream().filter(...).map(...)', 'keep some, change each'],
        ['.collect(Collectors.toList())', 'gather into a list'],
        ['.collect(Collectors.joining(", "))', 'glue Strings together'],
        ['.mapToInt(x -> ...).sum()', 'add numbers up'],
      ])),
  ];
  const T5 = [
    page('A crash',
      `<p>When something goes wrong while running, Java <b>throws an exception</b>. If nothing catches it, the program stops with a message naming the exception. Run this: the last line never prints.</p>`,
      J('', 'int people = 0;\nSystem.out.println("Sharing...");\nSystem.out.println(10 / people);\nSystem.out.println("Done");'), { expectError: true }),
    page('try and catch',
      `<p>Put risky code in a <code>try</code> block. If an exception is thrown, Java jumps straight to the matching <code>catch</code> block, and then carries on after it. <code>e.getMessage()</code> tells you what went wrong.</p>`,
      J('', 'try {\n    System.out.println("Sharing...");\n    System.out.println(10 / 0);\n    System.out.println("never printed");\n} catch (ArithmeticException e) {\n    System.out.println("Caught: " + e.getMessage());\n}\nSystem.out.println("Done");')),
    page('finally',
      `<p>A <code>finally</code> block runs <b>whatever happens</b>: after a normal finish, after a catch, even when the exception isn't caught here at all. It's for cleanup.</p>`,
      J('', 'for (int n : new int[] {2, 0}) {\n    try {\n        System.out.println(10 / n);\n    } catch (ArithmeticException e) {\n        System.out.println("bad divisor");\n    } finally {\n        System.out.println("cleaned up");\n    }\n}')),
    page('throw your own',
      `<p><code>throw new IllegalArgumentException("...")</code> stops the method right away and sends the problem to the caller. Great for refusing bad input. Several catch blocks can handle different exceptions.</p>`,
      J('', 'try {\n    System.out.println(half(10));\n    System.out.println(half(7));\n} catch (IllegalArgumentException e) {\n    System.out.println("Refused: " + e.getMessage());\n}', { methods: 'static int half(int n) {\n    if (n % 2 != 0) {\n        throw new IllegalArgumentException(n + " is odd");\n    }\n    return n / 2;\n}' })),
    page('Custom and checked exceptions',
      `<p>Make your own exception by extending <code>Exception</code>. Exceptions like this are <b>checked</b>: a method that may throw one must say <code>throws</code> in its first line, and every caller must catch it (or say <code>throws</code> too). Exceptions that extend <code>RuntimeException</code>, like IllegalArgumentException, are <b>unchecked</b> and need no <code>throws</code>.</p><p>Try deleting <code>throws EmptyException</code> and run it.</p>`,
      J('class EmptyException extends Exception {\n    EmptyException(String message) {\n        super(message);\n    }\n}', 'try {\n    pour(0);\n} catch (EmptyException e) {\n    System.out.println("Problem: " + e.getMessage());\n}', { methods: 'static void pour(int ml) throws EmptyException {\n    if (ml == 0) {\n        throw new EmptyException("the pot is empty");\n    }\n    System.out.println("Pouring " + ml + " ml");\n}' })),
    page('Cheat sheet',
      cheat([
        ['try { } catch (ArithmeticException e) { }', 'handle a problem'],
        ['e.getMessage()', 'what went wrong'],
        ['finally { }', 'always runs: cleanup'],
        ['throw new IllegalArgumentException("...")', 'refuse bad input'],
        ['class MyException extends Exception', 'your own (checked) exception'],
        ['void f() throws MyException', 'declare a checked exception'],
      ])),
  ];

  // ======================================================================= levels
  GD.addChapter2('java', {
    title: 'The Coffee Works',
    blurb: 'Deep in the hills stands the Coffee Works, a great steaming factory of Java machines, and the bugs have jammed every one of them.',
    outro: `<p>The boilers hiss, the grinders spin, and the smell of fresh coffee drifts over Syntaxia again. <b>The Coffee Works is running!</b></p>
      <p>You now know the heart of Java: <b>encapsulation</b>, <b>static</b> members, <b>inheritance</b>, <b>interfaces</b> and <b>abstract classes</b>, <b>collections</b> with <b>lambdas</b> and <b>streams</b>, and <b>exceptions</b>. That's what real Java programs are made of, from Android apps to giant servers.</p>
      <p>Pour yourself a cup. You've earned it.</p>`,
    theme: 'coffee',
    challenges: ch,
    levels: [
      {
        id: 'java2_vault', name: 'The Bean Vault', topic: 'Encapsulation',
        blurb: 'Lock fields away with private, guard them with getters and setters, and share data with static.',
        intro: `<p>Welcome to the <b>Coffee Works</b>, the oldest factory in Syntaxia. Every machine here was built in Java... and the bugs have been fiddling with them. In the Bean Vault, someone set a jar to <b>minus five beans</b>.</p>
          <p>The cure is <b>encapsulation</b>: hide an object's data with <code>private</code>, and only let it change through methods that check every value.</p>
          <pre>class Jar {\n    private int beans;\n\n    public int getBeans() {\n        return beans;\n    }\n}</pre>
          <p>You'll also meet <code>static</code>: things that belong to a whole class instead of one object.</p>`,
        tutorial: T1,
        signs: ['The Bean Vault. Fields marked private can only be touched from inside their own class.', 'A static field is shared by every object of the class. Handy for counting!', 'Well guarded! The Brew Line is next.'],
        terminals: ['java2_jar', 'java2_thermo', 'java2_cups', 'java2_scale', 'java2_card'],
        map: (B) => {
          const m = B.MapBuilder(120, 17);
          m.fill(0, 15, 119, 16, '#');
          m.put(2, 14, 'P'); m.put(5, 14, '?');
          let x = B.room(m, 7, 1, 'wall', 'A');
          x = B.TR.hills(m, x);
          x = B.room(m, x, 2, 'climb', 'B');
          m.put(x + 1, 14, '?');
          x = B.TR.tower(m, x + 3);
          m.put(x + 1, 14, 'K');
          x = B.room(m, x + 2, 3, 'bridge', 'C');
          x = B.TR.mover(m, x);
          x = B.room(m, x + 1, 4, 'spikes', 'D');
          m.put(x + 2, 14, 'e');
          x = B.TR.pit(m, x + 4);
          x = B.room(m, x + 1, 5, 'spring', 'E');
          m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
          return m;
        },
      },
      {
        id: 'java2_brewline', name: 'The Brew Line', topic: 'Inheritance',
        blurb: 'Build families of classes with extends, super and @Override, and let one loop serve every kind of drink.',
        intro: `<p>The <b>Brew Line</b> makes dozens of drinks, and they all have a lot in common. Writing every class from scratch would mean copying the same code again and again.</p>
          <p>With <b>inheritance</b>, a class can build on another one:</p>
          <pre>class Latte extends Drink {\n    @Override\n    double price() {\n        return 3.5;\n    }\n}</pre>
          <p>A Latte <b>is a</b> Drink: it gets everything Drink has, and changes only what's different.</p>`,
        tutorial: T2,
        signs: ['The Brew Line. Every drink here is a Drink, but each has its own twist.', 'super(...) builds the parent part. super.method() calls the parent\'s version.', 'One list, many kinds of drink. That is polymorphism!'],
        terminals: ['java2_family', 'java2_super', 'java2_override', 'java2_tostring', 'java2_foam', 'java2_menu'],
        map: (B) => {
          const m = B.MapBuilder(146, 17);
          m.fill(0, 15, 145, 16, '#');
          m.put(2, 14, 'P'); m.put(5, 14, '?');
          let x = B.room(m, 7, 1, 'climb', 'A');
          x = B.TR.hills(m, x);
          x = B.room(m, x, 2, 'lava', 'B');
          x = B.TR.tower(m, x + 1);
          m.put(x + 1, 14, '?');
          x = B.room(m, x + 3, 3, 'spring', 'C');
          m.put(x + 3, 14, 'K');
          x = B.TR.mover(m, x + 7);
          x = B.room(m, x + 1, 4, 'bridge', 'D');
          m.put(x + 2, 14, 'e'); m.put(x + 6, 10, 'w');
          x = B.TR.pit(m, x + 4);
          x = B.room(m, x + 1, 5, 'wall', 'E');
          x = B.TR.hills(m, x);
          x = B.room(m, x, 6, 'spikes', 'G');
          m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
          return m;
        },
      },
      {
        id: 'java2_hall', name: 'The Machine Hall', topic: 'Interfaces',
        blurb: 'Write contracts with interfaces, half-blueprints with abstract classes, and code that works with any machine.',
        intro: `<p>The <b>Machine Hall</b> is full of very different machines: grinders, kettles, frothers, robots. They share no code at all... but the factory still needs to control them all the same way.</p>
          <p>An <b>interface</b> is a contract every machine can sign:</p>
          <pre>interface Machine {\n    String name();\n    int watts();\n}\n\nclass Kettle implements Machine { ... }</pre>
          <p>Write code for the contract, and it works with every machine that signs it.</p>`,
        tutorial: T3,
        signs: ['The Machine Hall. Interfaces are promises: implements means "I will write these methods".', 'Abstract classes are half blueprints. Their children fill in the missing parts.', 'The hall is humming. Next stop: the Bean Market.'],
        terminals: ['java2_contract', 'java2_many', 'java2_abstract', 'java2_twojobs', 'java2_floor'],
        map: (B) => {
          const m = B.MapBuilder(142, 17);
          m.fill(0, 15, 141, 16, '#');
          m.put(2, 14, 'P'); m.put(5, 14, '?');
          let x = B.room(m, 7, 1, 'bridge', 'A');
          x = B.TR.tower(m, x + 1);
          x = B.room(m, x + 1, 2, 'wall', 'B');
          x = B.TR.hills(m, x);
          x = B.TR.pit(m, x + 1);
          m.put(x + 1, 14, '?');
          x = B.room(m, x + 3, 3, 'climb', 'C');
          m.put(x + 1, 14, 'K');
          x = B.TR.hills(m, x + 2);
          m.put(x + 2, 14, 'e');
          x = B.room(m, x + 3, 4, 'lava', 'D');
          x = B.TR.mover(m, x + 1);
          m.put(x + 1, 14, 'e');
          x = B.TR.hills(m, x + 3);
          x = B.room(m, x + 1, 5, 'spring', 'E');
          m.put(x + 1, 14, '?'); m.put(x + 5, 14, 'F');
          return m;
        },
      },
      {
        id: 'java2_market', name: 'The Bean Market', topic: 'Lambdas & Streams',
        blurb: 'Handle lists and maps like a pro with lambdas, removeIf, comparators and streams.',
        intro: `<p>The <b>Bean Market</b> is chaos: bags to sort, stale beans to toss, orders to count and a report due by sunset.</p>
          <p>Modern Java has a sharp tool for this: the <b>lambda</b>, a tiny method you write right where you need it.</p>
          <pre>orders.sort((a, b) -&gt; a.getPrice() - b.getPrice());\nbeans.removeIf(age -&gt; age &gt; 14);</pre>
          <p>Combine lambdas with <b>streams</b> and whole loops shrink to a single readable line.</p>`,
        tutorial: T4,
        signs: ['The Bean Market. A lambda is a mini method: input -> what to do with it.', 'Streams: filter keeps, map changes, collect gathers.', 'The market is tidy! Only the boiler room remains.'],
        terminals: ['java2_rollcall', 'java2_stale', 'java2_sort', 'java2_tally', 'java2_stream', 'java2_report'],
        map: (B) => {
          const m = B.MapBuilder(148, 17);
          m.fill(0, 15, 147, 16, '#');
          m.put(2, 14, 'P'); m.put(5, 14, '?');
          let x = B.room(m, 7, 1, 'spring', 'A');
          x = B.TR.hills(m, x);
          x = B.room(m, x + 1, 2, 'spikes', 'B');
          x = B.TR.mover(m, x + 1);
          x = B.room(m, x + 1, 3, 'climb', 'C');
          m.put(x + 1, 14, '?'); m.put(x + 3, 14, 'K');
          x = B.TR.tower(m, x + 5);
          x = B.room(m, x + 1, 4, 'bridge', 'D');
          m.put(x + 2, 14, 'e'); m.put(x + 6, 10, 'w');
          x = B.TR.pit(m, x + 4);
          x = B.room(m, x + 1, 5, 'lava', 'E');
          x = B.TR.hills(m, x + 1);
          x = B.room(m, x, 6, 'wall', 'G');
          m.put(x + 2, 14, '?'); m.put(x + 6, 14, 'F');
          return m;
        },
      },
      {
        id: 'java2_boiler', name: 'The Pressure Boiler', topic: 'Exceptions',
        blurb: 'Catch, throw and invent exceptions, then run the Grand Brew using everything from this chapter.',
        intro: `<p>At the heart of the Coffee Works sits the <b>Pressure Boiler</b>. Things go wrong down here: empty hoppers, bad orders, dangerous temperatures. And when they do, the bugs make sure everything crashes.</p>
          <p>Java's answer is <b>exceptions</b>. Code can <code>throw</code> a problem, and other code can <code>catch</code> it and recover:</p>
          <pre>try {\n    boiler.heat(50);\n} catch (OverheatException e) {\n    System.out.println("ALARM: " + e.getMessage());\n}</pre>
          <p>Master them, then fire up the <b>Grand Brew</b>: the machine that needs everything you've learned in this chapter.</p>`,
        tutorial: T5,
        signs: ['The Pressure Boiler. Exceptions are thrown when things go wrong, and caught to recover.', 'Checked exceptions (extends Exception) must be declared with throws and caught.', 'The Grand Brew awaits: interfaces, private fields, static, lists, streams and exceptions, all at once!'],
        terminals: ['java2_spill', 'java2_valve', 'java2_badorder', 'java2_alarm', 'java2_kinds', 'java2_grand'],
        map: (B) => {
          const m = B.MapBuilder(156, 17);
          m.fill(0, 15, 155, 16, '#');
          m.put(2, 14, 'P'); m.put(5, 14, '?');
          let x = B.room(m, 7, 1, 'wall', 'A');
          x = B.TR.pit(m, x + 1);
          x = B.room(m, x + 1, 2, 'bridge', 'B');
          x = B.TR.hills(m, x);
          m.put(x + 2, 14, 'e');
          x = B.room(m, x + 4, 3, 'spikes', 'C');
          m.put(x + 1, 14, '?');
          x = B.TR.tower(m, x + 3);
          m.put(x + 1, 14, 'K');
          x = B.room(m, x + 3, 4, 'climb', 'D');
          x = B.TR.mover(m, x + 1);
          m.put(x - 3, 9, 'w');
          x = B.room(m, x + 1, 5, 'spring', 'E');
          x = B.TR.pit(m, x + 1);
          m.put(x + 2, 14, 'e');
          x = B.room(m, x + 4, 6, 'lava', 'G');
          m.put(x + 2, 14, '?'); m.put(x + 7, 14, 'F');
          return m;
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
