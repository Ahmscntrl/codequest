// Reference solutions for Chapter 2 in Java ("The Coffee Works"): challengeId -> code.
const trim = (s) => String(s || '').replace(/^\n+|\s+$/g, '');
const ind = (s, n) => s.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n');
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
const UTIL = 'import java.util.*;';
const STREAMS = 'import java.util.*;\nimport java.util.stream.Collectors;';
const LIST = 'import java.util.ArrayList;\nimport java.util.List;';

module.exports = {
  // ---------------------------------------------------------------- 1. encapsulation & static
  java2_jar: J(`
class BeanJar {
    private int beans;

    public BeanJar(int beans) {
        this.beans = beans;
    }

    public int getBeans() {
        return beans;
    }
}`, 'BeanJar jar = new BeanJar(12);\nSystem.out.println(jar.getBeans());'),

  java2_thermo: J(`
class Thermostat {
    private int temp = 90;

    public int getTemp() {
        return temp;
    }

    public void setTemp(int temp) {
        if (temp >= 85 && temp <= 96) {
            this.temp = temp;
        } else {
            System.out.println("Rejected: " + temp);
        }
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

  java2_cups: J(`
class Cup {
    private static int made = 0;
    private int number;
    private String size;

    public Cup(String size) {
        this.size = size;
        made++;
        this.number = made;
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

  java2_scale: J(`
class Scale {
    static final int GRAMS_PER_SCOOP = 7;

    static int grams(int scoops) {
        return scoops * GRAMS_PER_SCOOP;
    }

    static int scoopsFor(int cups) {
        return cups * 2;
    }
}`, 'System.out.println(Scale.grams(3));\nSystem.out.println(Scale.grams(Scale.scoopsFor(4)));'),

  java2_card: J(`
class CoffeeCard {
    private String owner;
    private int balance;
    private static int cardsIssued = 0;

    public CoffeeCard(String owner) {
        this.owner = owner;
        cardsIssued++;
    }

    public void topUp(int amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    public boolean pay(int price) {
        if (balance >= price) {
            balance -= price;
            return true;
        }
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

  // ---------------------------------------------------------------- 2. inheritance
  java2_family: J(`
class Drink {
    String name = "a drink";

    String describe() {
        return "This is " + name;
    }
}

class Espresso extends Drink {
    Espresso() {
        name = "Espresso";
    }

    String shots() {
        return "2 shots";
    }
}`, 'Espresso e = new Espresso();\nSystem.out.println(e.describe());\nSystem.out.println(e.shots());'),

  java2_super: J(`
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
}

class Latte extends Drink {
    private boolean oat;

    Latte(int ml, boolean oat) {
        super("Latte", ml);
        this.oat = oat;
    }

    String milk() {
        return oat ? "oat milk" : "cow milk";
    }
}`, 'Latte a = new Latte(250, true);\nSystem.out.println(a.describe());\nSystem.out.println(a.milk());\nLatte b = new Latte(350, false);\nSystem.out.println(b.describe() + ", " + b.milk());'),

  java2_override: J(`
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
}

class Mocha extends Drink {
    Mocha() {
        super("Mocha");
    }

    @Override
    double price() {
        return 3.5;
    }
}

class Tea extends Drink {
    Tea() {
        super("Tea");
    }

    @Override
    double price() {
        return 1.5;
    }
}`, 'System.out.println(new Drink("House coffee").label());\nSystem.out.println(new Mocha().label());\nSystem.out.println(new Tea().label());'),

  java2_tostring: J(`
class Pastry {
    private String name;
    private int grams;

    Pastry(String name, int grams) {
        this.name = name;
        this.grams = grams;
    }

    @Override
    public String toString() {
        return name + " (" + grams + " g)";
    }
}`, 'Pastry p = new Pastry("croissant", 60);\nSystem.out.println(p);\nSystem.out.println("Today: " + new Pastry("muffin", 110));'),

  java2_foam: J(`
class Coffee {
    String recipe() {
        return "espresso";
    }
}

class Latte extends Coffee {
    @Override
    String recipe() {
        return super.recipe() + " + milk";
    }
}

class VanillaLatte extends Latte {
    @Override
    String recipe() {
        return super.recipe() + " + vanilla";
    }
}`, 'System.out.println(new Coffee().recipe());\nSystem.out.println(new Latte().recipe());\nSystem.out.println(new VanillaLatte().recipe());'),

  java2_menu: J(`
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
}`, `
List<Drink> menu = new ArrayList<>();
menu.add(new Espresso());
menu.add(new Latte());
menu.add(new Tea());

double total = 0;
for (Drink d : menu) {
    System.out.println(d);
    total += d.price();
}
System.out.println("Total: $" + total);`, { imports: LIST }),

  // ---------------------------------------------------------------- 3. interfaces & abstract classes
  java2_contract: J(`
interface Brewer {
    String brew();
}

class FrenchPress implements Brewer {
    public String brew() {
        return "Pressed coffee";
    }
}`, 'Brewer b = new FrenchPress();\nSystem.out.println(b.brew());'),

  java2_many: J(`
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
}

class MilkFrother implements Machine {
    public String name() { return "Milk Frother"; }
    public int watts() { return 500; }
}`, `
List<Machine> machines = new ArrayList<>();
machines.add(new Grinder());
machines.add(new Kettle());
machines.add(new MilkFrother());

int total = 0;
for (Machine m : machines) {
    System.out.println(m.name() + ": " + m.watts() + "W");
    total += m.watts();
}
System.out.println("Total: " + total + "W");`, { imports: LIST }),

  java2_abstract: J(`
abstract class Machine {
    private String name;

    Machine(String name) {
        this.name = name;
    }

    String getName() {
        return name;
    }

    abstract int cupsPerHour();

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
}

class EspressoMachine extends Machine {
    EspressoMachine() {
        super("Espresso Machine");
    }

    @Override
    int cupsPerHour() {
        return 60;
    }
}`, 'Machine drip = new DripMachine();\nMachine espresso = new EspressoMachine();\nSystem.out.println(drip.report());\nSystem.out.println(espresso.report());'),

  java2_twojobs: J(`
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
}

class RoboBarista implements Brewer, Cleanable {
    public String brew() {
        return "Robo: flat white";
    }

    public String clean() {
        return "Robo: wiping the counter";
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

  java2_floor: J(`
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
}`, `
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
    for (Station s : stations) {
        if (s.broken()) {
            continue;
        }
        working++;
        total += s.cupsPerHour();
        if (s.cupsPerHour() > most) {
            most = s.cupsPerHour();
            busiest = s.name();
        }
    }

    System.out.println("Working: " + working);
    System.out.println("Busiest: " + busiest);
    System.out.println("Total cups: " + total);
}` }),

  // ---------------------------------------------------------------- 4. collections & lambdas
  java2_rollcall: J('', 'List<String> beans = List.of("Arabica", "Robusta", "Liberica");\nbeans.forEach(b -> System.out.println("- " + b));', { imports: 'import java.util.List;' }),

  java2_stale: J('', 'List<Integer> ages = new ArrayList<>(List.of(3, 21, 8, 30, 14, 2));\nages.removeIf(age -> age > 14);\nSystem.out.println(ages);\nSystem.out.println("Bags left: " + ages.size());', { imports: LIST }),

  java2_sort: J(`
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
}`, `
List<Order> orders = new ArrayList<>();
orders.add(new Order("latte", 4));
orders.add(new Order("espresso", 3));
orders.add(new Order("mocha", 5));
orders.add(new Order("tea", 2));

orders.sort((a, b) -> a.getPrice() - b.getPrice());
System.out.println("Cheapest first: " + orders);

orders.sort((a, b) -> a.getDrink().compareTo(b.getDrink()));
System.out.println("A to Z: " + orders);`, { imports: LIST }),

  java2_tally: J('', `
List<String> orders = List.of("latte", "tea", "latte", "mocha", "latte", "tea");
Map<String, Integer> counts = new HashMap<>();
for (String d : orders) {
    counts.merge(d, 1, Integer::sum);
}

for (String d : List.of("latte", "tea", "mocha", "espresso")) {
    System.out.println(d + ": " + counts.getOrDefault(d, 0));
}`, { imports: UTIL }),

  java2_stream: J('', `
List<Integer> temps = List.of(88, 93, 97, 91, 85, 95, 99, 90);

List<String> good = temps.stream()
    .filter(t -> t >= 90 && t <= 96)
    .map(t -> t + "C")
    .collect(Collectors.toList());
long tooHot = temps.stream().filter(t -> t > 96).count();

System.out.println(good);
System.out.println("Too hot: " + tooHot);`, { imports: STREAMS }),

  java2_report: J(`
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
}`, `
List<Sale> sales = List.of(
    new Sale("latte", 4, 4),
    new Sale("tea", 2, 2),
    new Sale("mocha", 3, 5),
    new Sale("espresso", 5, 3),
    new Sale("tea", 1, 2)
);

int cups = sales.stream().mapToInt(s -> s.getCups()).sum();
String big = sales.stream()
    .filter(s -> s.getCups() >= 3)
    .map(Sale::getDrink)
    .sorted()
    .collect(Collectors.joining(", "));
int revenue = sales.stream().mapToInt(Sale::revenue).sum();
Sale best = sales.stream().max((a, b) -> a.revenue() - b.revenue()).get();

System.out.println("Cups sold: " + cups);
System.out.println("Big orders: " + big);
System.out.println("Revenue: $" + revenue);
System.out.println("Best seller: " + best.getDrink());`, { imports: STREAMS }),

  // ---------------------------------------------------------------- 5. exceptions
  java2_spill: J('', 'try {\n    System.out.println(cupsEach(12, 4));\n    System.out.println(cupsEach(5, 0));\n} catch (ArithmeticException e) {\n    System.out.println("Cannot share between 0 people");\n}\nSystem.out.println("Still running!");', { methods: 'static int cupsEach(int cups, int people) {\n    return cups / people;\n}' }),

  java2_valve: J('', 'try {\n    brew(3);\n    brew(0);\n} catch (ArithmeticException e) {\n    System.out.println("Brew failed: " + e.getMessage());\n}', { methods: 'static void brew(int scoops) {\n    System.out.println("Valve open");\n    try {\n        System.out.println("Each scoop: " + (24 / scoops) + "g");\n    } finally {\n        System.out.println("Valve closed");\n    }\n}' }),

  java2_badorder: J(`
class Order {
    private int cups;

    public void setCups(int cups) {
        if (cups < 1 || cups > 10) {
            throw new IllegalArgumentException("cups must be 1 to 10, got " + cups);
        }
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

  java2_alarm: J(`
class OverheatException extends Exception {
    OverheatException(String message) {
        super(message);
    }
}

class Boiler {
    private int temp = 0;

    public void heat(int degrees) throws OverheatException {
        temp += degrees;
        if (temp > 100) {
            throw new OverheatException("Boiler at " + temp + " degrees!");
        }
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

  java2_kinds: J('', `
String[] inputs = {"2", "two", "0", "5"};
int total = 0;
for (String text : inputs) {
    try {
        int cups = parseCups(text);
        total += cups;
        System.out.println(cups + " cups");
    } catch (NumberFormatException e) {
        System.out.println("Not a number: " + text);
    } catch (IllegalArgumentException e) {
        System.out.println("Bad order: " + e.getMessage());
    }
}
System.out.println("Total cups: " + total);`, { methods: 'static int parseCups(String text) {\n    int cups = Integer.parseInt(text);\n    if (cups < 1) {\n        throw new IllegalArgumentException("must order at least 1 cup");\n    }\n    return cups;\n}' }),

  java2_grand: J(`
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

class Mocha implements Recipe {
    public String name() { return "Mocha"; }
    public int beansNeeded() { return 10; }
}

class CoffeeMachine {
    private int beans;
    private static int cupsServed = 0;

    CoffeeMachine(int beans) {
        this.beans = beans;
    }

    public void make(Recipe r) throws OutOfBeansException {
        if (r.beansNeeded() > beans) {
            throw new OutOfBeansException("Not enough beans for " + r.name());
        }
        beans -= r.beansNeeded();
        cupsServed++;
        System.out.println("Made " + r.name());
    }

    public int getBeans() {
        return beans;
    }

    public static int getCupsServed() {
        return cupsServed;
    }
}`, `
List<Recipe> queue = new ArrayList<>();
queue.add(new Latte());
queue.add(new Espresso());
queue.add(new Mocha());
queue.add(new Latte());
queue.add(new Espresso());

CoffeeMachine machine = new CoffeeMachine(30);
List<String> failed = new ArrayList<>();

for (Recipe r : queue) {
    try {
        machine.make(r);
    } catch (OutOfBeansException e) {
        System.out.println("Skipped: " + e.getMessage());
        failed.add(r.name());
    }
}

System.out.println("Served: " + CoffeeMachine.getCupsServed() + " cups, " + machine.getBeans() + " beans left");
System.out.println("Failed: " + failed.stream().sorted().collect(Collectors.joining(", ")));`, { imports: STREAMS }),
};
