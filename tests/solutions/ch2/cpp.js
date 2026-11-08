// Reference C++ solutions for Chapter 2, The Iron Forge (used by the tests only).
function includes(src) {
  const inc = ['iostream'];
  if (/\bstring\b|to_string/.test(src)) inc.push('string');
  if (/\bvector\b/.test(src)) inc.push('vector');
  if (/\b(sort|reverse|count_if|count|find_if|find|max_element|min_element|transform|for_each|any_of|all_of|none_of)\s*\(/.test(src)) inc.push('algorithm');
  if (/\baccumulate\s*\(/.test(src)) inc.push('numeric');
  return inc.map(h => `#include <${h}>`).join('\n');
}
const indent = (s) => s.split('\n').map(l => (l.trim() ? '    ' + l : '')).join('\n');
function P(body, above) {
  const top = above ? above.trim() + '\n\n' : '';
  return `${includes(top + body)}\nusing namespace std;\n\n${top}int main() {\n${indent(body.trim())}\n    return 0;\n}\n`;
}

const GOLEM_BASE = `class Golem {
public:
    string name;
    int hp;

    Golem(string n, int h) : name(n), hp(h) {}

    string walk() const {
        return name + " walks";
    }
};`;

module.exports = {
  // ---- level 1: references
  cpp2_refs1: P(`
int forge = 20;
heat(forge);
cout << forge << endl;`, `
void heat(int &temp) {
    temp += 100;
}`),
  cpp2_refs2: P(`
int left = 3;
int right = 8;
swap_ingots(left, right);
cout << left << " " << right << endl;

int big = 7;
int small = 50;
swap_ingots(big, small);
cout << big << " " << small << endl;`, `
void swap_ingots(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}`),
  cpp2_refs3: P(`
int bars = 0;
int leftover = 0;

split_ore(23, bars, leftover);
cout << "23 kg: " << bars << " bars, " << leftover << " left" << endl;
split_ore(10, bars, leftover);
cout << "10 kg: " << bars << " bars, " << leftover << " left" << endl;
split_ore(4, bars, leftover);
cout << "4 kg: " << bars << " bars, " << leftover << " left" << endl;`, `
void split_ore(int total, int &bars, int &leftover) {
    bars = total / 5;
    leftover = total % 5;
}`),
  cpp2_refs4: P(`
vector<int> blades = {100, 250, 75};

for (int &b : blades) {
    b += 50;
    if (b > 280) {
        b = 280;
    }
}

for (int b : blades) {
    cout << b << endl;
}`),
  cpp2_refs5: P(`
vector<int> carts;
cout << heaviest(carts) << endl;

add_cart(carts, 40);
add_cart(carts, 95);
add_cart(carts, 60);
cout << carts.size() << " carts" << endl;
cout << "heaviest: " << heaviest(carts) << endl;`, `
void add_cart(vector<int> &carts, int weight) {
    carts.push_back(weight);
}

int heaviest(const vector<int> &carts) {
    int best = 0;
    for (int w : carts) {
        if (w > best) {
            best = w;
        }
    }
    return best;
}`),

  // ---- level 2: structs & encapsulation
  cpp2_enc1: P(`
Ingot a = {"iron", 12};
Ingot b = {"gold", 30};
b.weight += 5;

cout << a.metal << " " << a.weight << endl;
cout << b.metal << " " << b.weight << endl;
cout << "total: " << a.weight + b.weight << endl;`, `
struct Ingot {
    string metal;
    int weight;
};`),
  cpp2_enc2: P(`
Furnace f;
f.add_heat(50);
f.add_heat(-40);
f.add_heat(25);
cout << f.get_heat() << endl;`, `
class Furnace {
private:
    int heat = 0;

public:
    void add_heat(int amount) {
        if (amount > 0) {
            heat += amount;
        }
    }

    int get_heat() const {
        return heat;
    }
};`),
  cpp2_enc3: P(`
Blade a("Ember Edge", 7);
Blade b("Frost Fang", 4);
cout << a.describe() << endl;
cout << b.describe() << endl;`, `
class Blade {
private:
    string name;
    int sharpness;

public:
    Blade(string n, int s) : name(n), sharpness(s) {}

    string describe() const {
        return name + " (sharpness " + to_string(sharpness) + ")";
    }
};`),
  cpp2_enc4: P(`
Vault v(100);
cout << boolalpha;
cout << v.withdraw(30) << endl;
cout << v.withdraw(500) << endl;
v.deposit(-20);
v.deposit(15);
cout << v.withdraw(0) << endl;
cout << v.balance() << endl;`, `
class Vault {
private:
    int gold;

public:
    Vault(int start) : gold(start) {}

    void deposit(int n) {
        if (n > 0) {
            gold += n;
        }
    }

    bool withdraw(int n) {
        if (n <= 0 || n > gold) {
            return false;
        }
        gold -= n;
        return true;
    }

    int balance() const {
        return gold;
    }
};`),
  cpp2_enc5: P(`
Crucible pot(3);
cout << boolalpha;
cout << pot.add("iron") << endl;
cout << pot.add("copper") << endl;
cout << pot.add("tin") << endl;
cout << pot.add("gold") << endl;
cout << pot.count() << " metals" << endl;
cout << pot.contents() << endl;`, `
class Crucible {
private:
    vector<string> metals;
    int capacity;

public:
    Crucible(int cap) : capacity(cap) {}

    bool add(const string &metal) {
        if (metals.size() >= capacity) {
            return false;
        }
        metals.push_back(metal);
        return true;
    }

    int count() const {
        return metals.size();
    }

    string contents() const {
        string out = "";
        for (int i = 0; i < metals.size(); i++) {
            if (i > 0) {
                out += " + ";
            }
            out += metals[i];
        }
        return out;
    }
};`),

  // ---- level 3: STL & lambdas
  cpp2_stl1: P(`
vector<int> parts = {42, 7, 19, 3, 25};

sort(parts.begin(), parts.end());
for (int p : parts) {
    cout << p << " ";
}
cout << endl;

reverse(parts.begin(), parts.end());
for (int p : parts) {
    cout << p << " ";
}
cout << endl;`),
  cpp2_stl2: P(`
vector<int> weights = {12, 75, 3, 51, 50, 8, 99};

int heavy = count_if(weights.begin(), weights.end(), [](int w) { return w > 50; });
int light = count_if(weights.begin(), weights.end(), [](int w) { return w < 10; });

cout << "heavy: " << heavy << endl;
cout << "light: " << light << endl;`),
  cpp2_stl3: P(`
vector<Blade> rack = {{"Frost Fang", 4}, {"Moonsplitter", 9}, {"Old Rusty", 1}, {"Ember Edge", 7}};

sort(rack.begin(), rack.end(), [](const Blade &a, const Blade &b) { return a.sharpness > b.sharpness; });

for (const Blade &b : rack) {
    cout << b.name << " " << b.sharpness << endl;
}`, `
struct Blade {
    string name;
    int sharpness;
};`),
  cpp2_stl4: P(`
inspect({30, 45, 12, 60, 8});
inspect({20, 99, 41});
inspect({5});`, `
void inspect(const vector<int> &blades) {
    auto it = find_if(blades.begin(), blades.end(), [](int s) { return s < 20; });
    if (it != blades.end()) {
        cout << "weak blade: " << *it << " at position " << (it - blades.begin()) << endl;
    } else {
        cout << "all blades pass" << endl;
    }
}`),
  cpp2_stl5: P(`
vector<int> prices = {10, 25, 40, 100};

transform(prices.begin(), prices.end(), prices.begin(), [](int p) { return p + 5; });

for (int p : prices) {
    cout << p << " ";
}
cout << endl;

int total = accumulate(prices.begin(), prices.end(), 0);
cout << "total: " << total << endl;`),
  cpp2_stl6: P(`
vector<Order> orders = {{"nails", 50, 1}, {"hinge", 4, 15}, {"crown", 1, 120}, {"chain", 10, 5}};
int budget = 55;

int total = accumulate(orders.begin(), orders.end(), 0, [](int sum, const Order &o) { return sum + o.qty * o.price; });
cout << "total: " << total << endl;

int over = count_if(orders.begin(), orders.end(), [budget](const Order &o) { return o.qty * o.price > budget; });
cout << "over budget: " << over << endl;

auto best = max_element(orders.begin(), orders.end(), [](const Order &a, const Order &b) { return a.price < b.price; });
cout << "priciest: " << best->item << endl;`, `
struct Order {
    string item;
    int qty;
    int price;
};`),

  // ---- level 4: overloading
  cpp2_over1: P(`
cout << ring(3) << endl;
cout << ring("iron") << endl;
cout << ring(12) << endl;`, `
string ring(int n) {
    return "bell " + to_string(n);
}

string ring(string word) {
    return "word: " + word;
}`),
  cpp2_over2: P(`
cout << cost(3) << endl;
cout << cost(3, 2) << endl;
cout << cost(0, 4) << endl;`, `
int cost(int bars) {
    return bars * 10;
}

int cost(int bars, int gems) {
    return cost(bars) + gems * 25;
}`),
  cpp2_over3: P(`
vector<int> loads = {4, 8, 15};
show(7);
show("anvil");
show(loads);
show(0);`, `
void show(int x) {
    cout << "number: " << x << endl;
}

void show(string s) {
    cout << "text: " << s << endl;
}

void show(const vector<int> &v) {
    cout << "list of " << v.size() << ":";
    for (int x : v) {
        cout << " " << x;
    }
    cout << endl;
}`),
  cpp2_over4: P(`
Weapon a;
Weapon b("Hammer");
Weapon c("Great Axe", 12);
cout << a.info() << endl;
cout << b.info() << endl;
cout << c.info() << endl;`, `
class Weapon {
private:
    string name;
    int damage;

public:
    Weapon() : name("stick"), damage(1) {}
    Weapon(string n) : name(n), damage(5) {}
    Weapon(string n, int d) : name(n), damage(d) {}

    string info() const {
        return name + " deals " + to_string(damage);
    }
};`),
  cpp2_over5: P(`
vector<int> heap = {5, 21, 13, 8};
vector<int> cold = {-7, -2, -9};
cout << biggest(4, 9) << endl;
cout << biggest(12, 3, 7) << endl;
cout << biggest(heap) << endl;
cout << biggest(cold) << endl;`, `
int biggest(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

int biggest(int a, int b, int c) {
    return biggest(a, biggest(b, c));
}

int biggest(const vector<int> &v) {
    int best = v[0];
    for (int x : v) {
        best = biggest(best, x);
    }
    return best;
}`),

  // ---- level 5: inheritance & virtual
  cpp2_virt1: P(`
StoneGolem g("Boulder");
cout << g.walk() << endl;
cout << g.hp << endl;
cout << g.smash() << endl;`, GOLEM_BASE + `

class StoneGolem : public Golem {
public:
    StoneGolem(string n) : Golem(n, 200) {}

    string smash() const {
        return this->name + " smashes!";
    }
};`),
  cpp2_virt2: P(`
IronGolem guard("Anvil", 8);
cout << guard.status() << endl;
cout << guard.defense() << endl;`, `
class Golem {
protected:
    string name;
    int hp;

public:
    Golem(string n, int h) : name(n), hp(h) {}
};

class IronGolem : public Golem {
private:
    int armor;

public:
    IronGolem(string n, int a) : Golem(n, 150), armor(a) {}

    int defense() const {
        return hp / 10 + armor;
    }

    string status() const {
        return name + ": " + to_string(hp) + " hp, armor " + to_string(armor);
    }
};`),
  cpp2_virt3: P(`
Golem plain;
ClayGolem clay;
IronGolem iron;
wake(plain, "Golem");
wake(clay, "Clay");
wake(iron, "Iron");`, `
class Golem {
public:
    virtual string speak() const {
        return "...";
    }
};

class ClayGolem : public Golem {
public:
    string speak() const override {
        return "squelch";
    }
};

class IronGolem : public Golem {
public:
    string speak() const override {
        return "clang";
    }
};

void wake(const Golem &g, string who) {
    cout << who << " says " << g.speak() << endl;
}`),
  cpp2_virt4: P(`
Golem pebble("Pebble");
LavaGolem magma("Magma");
announce(pebble);
announce(magma);`, `
class Golem {
protected:
    string name;

public:
    Golem(string n) : name(n) {}
    virtual ~Golem() {}

    virtual string describe() const {
        return name + " the golem";
    }
};

class LavaGolem : public Golem {
public:
    LavaGolem(string n) : Golem(n) {}

    string describe() const override {
        return Golem::describe() + ", hot to the touch";
    }
};

void announce(const Golem &g) {
    cout << g.describe() << endl;
}`),
  cpp2_virt5: P(`
Gear big(12);
Plate lid(3, 4);
Gear small(5);
vector<Part*> parts = {&big, &lid, &small};
for (Part *p : parts) {
    cout << p->label() << " " << p->weight() << endl;
}
cout << "total: " << total_weight(parts) << endl;`, `
class Part {
public:
    virtual ~Part() {}
    virtual int weight() const = 0;
    virtual string label() const = 0;
};

class Gear : public Part {
private:
    int teeth;

public:
    Gear(int t) : teeth(t) {}

    int weight() const override {
        return teeth * 2;
    }

    string label() const override {
        return "gear";
    }
};

class Plate : public Part {
private:
    int w;
    int h;

public:
    Plate(int width, int height) : w(width), h(height) {}

    int weight() const override {
        return w * h;
    }

    string label() const override {
        return "plate";
    }
};

int total_weight(const vector<Part*> &parts) {
    int total = 0;
    for (Part *p : parts) {
        total += p->weight();
    }
    return total;
}`),
  cpp2_virt6: P(`
IronGolem anvil("Anvil", 5);
FireGolem ember("Ember", 12);
IronGolem bolt("Bolt", 40);
FireGolem spark("Spark", 4);
vector<Golem*> army = {&anvil, &ember, &bolt, &spark};
int threshold = 20;

sort(army.begin(), army.end(), [](const Golem *a, const Golem *b) { return a->power() > b->power(); });

report(army);

int strong = count_if(army.begin(), army.end(), [threshold](const Golem *g) { return g->power() > threshold; });
cout << "strong golems: " << strong << endl;`, `
class Golem {
protected:
    string name;
    int hp;

public:
    Golem(string n, int h) : name(n), hp(h) {}
    virtual ~Golem() {}

    virtual int power() const = 0;

    virtual string describe() const {
        return name + " (hp " + to_string(hp) + ")";
    }
};

class IronGolem : public Golem {
private:
    int armor;

public:
    IronGolem(string n, int a) : Golem(n, 120), armor(a) {}

    int power() const override {
        return 10 + armor;
    }
};

class FireGolem : public Golem {
private:
    int heat;

public:
    FireGolem(string n, int h) : Golem(n, 80), heat(h) {}

    int power() const override {
        return heat * 3;
    }

    string describe() const override {
        return Golem::describe() + " [fire]";
    }
};

void report(const Golem &g) {
    cout << g.describe() << ": power " << g.power() << endl;
}

void report(const vector<Golem*> &army) {
    for (const Golem *g : army) {
        report(*g);
    }
}`),
};
