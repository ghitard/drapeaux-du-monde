"""Régénère tests/fixtures/fsrs-ref.json à partir de l'implémentation de référence.
   pip install fsrs==6.3.2 && python3 tests/fixtures/gen_fsrs_ref.py
À ne relancer que si l'on change volontairement de version de FSRS (et alors adapter src/engine.js)."""
import json, os, random
from datetime import datetime, timedelta, timezone
from fsrs import Scheduler, Card, Rating

random.seed(7)
sched = Scheduler(enable_fuzzing=False, desired_retention=0.9)
cases = []
t0 = datetime(2026, 1, 1, 9, 0, tzinfo=timezone.utc)
for case in range(400):
    card = Card()
    t = t0
    steps = []
    for k in range(random.randint(1, 12)):
        gap = random.choice([0, 0, 0.002, 0.01, 0.3, 0.9, 1.2, 2, 3.5, 7, 15, 40, 120])
        if k > 0:
            t = t + timedelta(days=gap)
        g = random.choices([1, 2, 3, 4], weights=[2, 1, 5, 1])[0]
        card, _ = sched.review_card(card, Rating(g), review_datetime=t)
        steps.append({'ms': int(t.timestamp() * 1000), 'g': g, 's': card.stability, 'd': card.difficulty})
    cases.append(steps)

extra = {
    'retr': [[t, s, (1 + sched._FACTOR * t / s) ** sched._DECAY] for t, s in [(1, 1), (3, 2.3), (10, 4), (30, 50), (100, 20)]],
    'ivl': {str(r): [[s, Scheduler(desired_retention=r, enable_fuzzing=False)._next_interval(stability=s)] for s in [0.2, 1, 2.3, 8.3, 15, 47.2, 200, 5000]] for r in [0.8, 0.85, 0.9, 0.95]},
}
out = os.path.join(os.path.dirname(__file__), 'fsrs-ref.json')
json.dump({'cases': cases, 'extra': extra}, open(out, 'w'))
print('écrit', out, len(cases), 'cas')
