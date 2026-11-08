// Reference solutions for Python's Chapter 2 (The Pythonic Isles). Used by the tests only.
module.exports = {
  // 1. Comprehension Cove
  py2_comp1: `doubled = [s * 2 for s in shells]\nprint(doubled)`,
  py2_comp2: `def lengths(words):\n    return [len(w) for w in words]`,
  py2_comp3: `def even_squares(nums):\n    return [n * n for n in nums if n % 2 == 0]`,
  py2_comp4: `def tide_labels(levels):\n    return ["high" if level >= 5 else "low" for level in levels]`,
  py2_comp5: `def affordable(prices, budget):\n    return {item: price for item, price in prices.items() if price <= budget}`,
  py2_comp6: `def first_letters(names):\n    return sorted({name[0].lower() for name in names})`,

  // 2. Slice Shoals
  py2_slice1: `print(message[:3])\nprint(message[-3:])`,
  py2_slice2: `def decode(secret):\n    return secret[1::2]`,
  py2_slice3: `def rotate(items, n):\n    return items[n:] + items[:n]`,
  py2_slice4: `def price_tag(item, price):\n    return f"{item}: {price:.2f} coins"`,
  py2_slice5: `def board_line(ship, crew):\n    return f"{ship:<10}|{crew:>4}"`,
  py2_slice6: `def log_entry(day, place, gold):\n    return f"Day {day:02d} | {place[:8]:<8} | {gold:>10,.2f}"`,

  // 3. Treasure Atoll
  py2_tup1: `def swap(pair):\n    a, b = pair\n    return b, a`,
  py2_tup2: `def captain_and_crew(names):\n    first, *rest = names\n    return f"Captain {first}, crew of {len(rest)}"`,
  py2_tup3: `for i, name in enumerate(crew, start=1):\n    print(f"{i}. {name}")\nprint(f"Crew: {len(crew)}")`,
  py2_tup4: `def manifest(items, counts):\n    return {item: count for item, count in zip(items, counts)}`,
  py2_tup5: `def count_birds(sightings):\n    counts = {}\n    for bird in sightings:\n        counts[bird] = counts.get(bird, 0) + 1\n    return counts`,
  py2_tup6: `def top_three(scores):\n    return sorted(scores, key=lambda name: scores[name], reverse=True)[:3]`,
  py2_tup7: `totals = {}\nfor name, gold in loot:\n    totals[name] = totals.get(name, 0) + gold\nranking = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)\nfor i, (name, gold) in enumerate(ranking, start=1):\n    print(f"{i}. {name}: {gold}")`,

  // 4. Stormy Reef
  py2_exc1: `def to_number(text):\n    try:\n        return int(text)\n    except ValueError:\n        return 0`,
  py2_exc2: `def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None`,
  py2_exc3: `def pick(items, position):\n    try:\n        return items[int(position)]\n    except ValueError:\n        return "not a number"\n    except IndexError:\n        return "no such item"`,
  py2_exc4: `checked = 0\ntotal = 0\nfor r in readings:\n    try:\n        n = int(r)\n    except ValueError:\n        print(f"Bad reading: {r}")\n    else:\n        print(f"Reading {n} ok")\n        total += n\n    finally:\n        checked += 1\nprint(f"Checked {checked}, total {total}")`,
  py2_exc5: `def set_sail(crew):\n    if crew < 3:\n        raise ValueError("A ship needs at least 3 crew")\n    return f"Setting sail with {crew} crew!"`,
  py2_exc6: `class StormWarning(Exception):\n    pass\n\ndef check_wind(speed):\n    if speed > 50:\n        raise StormWarning(f"Wind {speed} is too strong!")\n    return "Calm seas"`,
  py2_exc7: `class NotEnoughGold(Exception):\n    def __init__(self, missing):\n        super().__init__(f"missing {missing} gold")\n        self.missing = missing\n\ndef withdraw(balance, amount):\n    if amount <= 0:\n        raise ValueError("amount must be positive")\n    if amount > balance:\n        raise NotEnoughGold(amount - balance)\n    return balance - amount\n\nbalance = 100\nfor amount in requests:\n    try:\n        balance = withdraw(balance, amount)\n    except NotEnoughGold as e:\n        print(f"Denied: {e}")\n    except ValueError as e:\n        print(f"Invalid: {e}")\n    else:\n        print(f"Paid {amount}, left {balance}")\nprint(f"Final balance: {balance}")`,

  // 5. Heritage Harbour
  py2_inh1: `class Ship:\n    def __init__(self, name):\n        self.name = name\n\n    def horn(self):\n        return f"{self.name} goes TOOT!"\n\nclass Tugboat(Ship):\n    def push(self):\n        return f"{self.name} pushes the big ships"\n\ntug = Tugboat("Tuggy")\nprint(tug.horn())\nprint(tug.push())`,
  py2_inh2: `class Bird:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return "..."\n\n    def intro(self):\n        return f"{self.name} says {self.speak()}"\n\nclass Parrot(Bird):\n    def speak(self):\n        return "Pieces of eight!"\n\nfor bird in [Bird("Gull"), Parrot("Pip")]:\n    print(bird.intro())`,
  py2_inh3: `class Sailor:\n    def __init__(self, name):\n        self.name = name\n\n    def greet(self):\n        return f"Ahoy, I'm {self.name}"\n\nclass Captain(Sailor):\n    def __init__(self, name, ship):\n        super().__init__(name)\n        self.ship = ship\n\n    def order(self):\n        return f"Captain {self.name} of the {self.ship}: hoist the sails!"\n\ncap = Captain("Ada", "Kraken")\nprint(cap.greet())\nprint(cap.order())`,
  py2_inh4: `class Island:\n    def __init__(self, name, population):\n        self.name = name\n        self.population = population\n\n    def __str__(self):\n        return f"{self.name} (population {self.population})"\n\nprint(Island("Tortuga", 120))\natlas = [Island("Tortuga", 120), Island("Palm Key", 8), Island("Rocky", 0)]\nfor isle in atlas:\n    print(f"- {isle}")`,
  py2_inh5: `class Pirate:\n    def __init__(self, name):\n        self.name = name\n\n    def greet(self):\n        return f"Ahoy, I'm {self.name}"\n\nclass PirateKing(Pirate):\n    def greet(self):\n        return super().greet() + " and I rule these seas!"\n\nprint(Pirate("Bo").greet())\nprint(PirateKing("Zara").greet())`,
  py2_inh6: `class Boat:\n    def __init__(self, name):\n        self.name = name\n\nclass Sailboat(Boat):\n    pass\n\nclass Steamboat(Boat):\n    pass\n\nclass Raft:\n    def __init__(self, name):\n        self.name = name\n\nharbour = [Sailboat("Breeze"), Raft("Logs"), Steamboat("Chugger"), Sailboat("Gust"), Boat("Dinghy")]\n\nboats = len([t for t in harbour if isinstance(t, Boat)])\nsailboats = len([t for t in harbour if isinstance(t, Sailboat)])\nprint("Boats:", boats)\nprint("Sailboats:", sailboats)`,
  py2_inh7: `class InvalidTime(Exception):\n    pass\n\nclass Boat:\n    def __init__(self, name, time):\n        if time <= 0:\n            raise InvalidTime(f"{name} has an impossible time")\n        self.name = name\n        self.time = time\n\n    def kind(self):\n        return "boat"\n\n    def __str__(self):\n        return f"{self.name:<10}{self.kind():<6}{self.time:>6.2f}"\n\nclass Sailboat(Boat):\n    def kind(self):\n        return "sail"\n\nclass Steamboat(Boat):\n    def kind(self):\n        return "steam"\n\nfleet = []\nfor name, kind, time in entries:\n    try:\n        if kind == "sail":\n            fleet.append(Sailboat(name, time))\n        else:\n            fleet.append(Steamboat(name, time))\n    except InvalidTime as e:\n        print(f"Disqualified: {e}")\n\nfor place, boat in enumerate(sorted(fleet, key=lambda b: b.time), start=1):\n    print(f"{place}. {boat}")\nsails = [b.name for b in sorted(fleet, key=lambda b: b.time) if isinstance(b, Sailboat)]\nprint("Sailboats: " + ", ".join(sails))`,
};
