"""Check reminder decisions without Firebase credentials or network calls."""
import datetime as dt
import runpy
from pathlib import Path
import unittest


remind = runpy.run_path(
    str(Path(__file__).resolve().parents[1] / ".github" / "scripts" / "remind.py")
)


class RemindersTest(unittest.TestCase):
    def setUp(self):
        self.push = {"on": True, "tokens": ["test-token"], "tz": 180}
        self.day = dt.date(2026, 9, 29)

    def decide(self, utc_hour, profile=None, **settings):
        now = dt.datetime.combine(self.day, dt.time(utc_hour))
        return remind["decide"]({**self.push, **settings}, profile, now)

    def test_empty_hours_disable_reminders_and_old_subscriptions_use_defaults(self):
        self.assertEqual(remind["hours_of"]({}), [14, 22])
        self.assertEqual(remind["hours_of"]({"hours": [22, 14, 22, 25, -1, "8"]}), [14, 22])
        self.assertEqual(self.decide(11, hours=[]), (False, self.day, False, 0, None))
        self.assertEqual(self.decide(11, on=False), (False, self.day, False, 0, None))
        self.assertEqual(self.decide(11, tokens=[]), (False, self.day, False, 0, None))

    def test_reminders_use_local_date_and_latest_due_slot(self):
        next_day = self.day + dt.timedelta(days=1)
        self.assertEqual(self.decide(22, hours=[0, 14]), (True, next_day, False, 0, 0))
        self.assertEqual(self.decide(10), (False, self.day, False, 0, None))
        self.assertEqual(self.decide(12), (True, self.day, False, 0, 14))
        self.assertEqual(self.decide(13), (False, self.day, False, 0, 14))

    def test_same_slot_is_not_sent_twice(self):
        self.assertEqual(
            self.decide(11, lastSlot="2026-09-29@14"), (False, self.day, False, 0, 14)
        )
        self.assertEqual(
            self.decide(19, lastSlot="2026-09-29@14"), (True, self.day, False, 0, 22)
        )
        self.assertEqual(
            self.decide(19, lastSent="2026-09-29"), (False, self.day, False, 0, 22)
        )

    def test_reading_either_testament_suppresses_reminder(self):
        for key in ("ntLast", "otLast"):
            with self.subTest(key=key):
                self.assertEqual(
                    self.decide(11, {key: self.day.isoformat()}),
                    (False, self.day, False, 0, 14),
                )

    def test_yesterday_reading_marks_streak_at_risk(self):
        self.assertEqual(
            self.decide(19, {"ntLast": "2026-09-28", "streak": 4}),
            (True, self.day, True, 4, 22),
        )
        self.assertEqual(
            self.decide(19, {"ntLast": "2026-09-27", "streak": 4}),
            (True, self.day, False, 4, 22),
        )

    def test_plan_refs_match_first_day_and_return_none_out_of_range(self):
        plan = remind["load_plan"]()
        start = remind["PLAN_START"]
        self.assertEqual(remind["todays_refs"](plan, start), ("Мф. 1:1–2", "Быт. 1:1–5"))
        self.assertIsNone(remind["todays_refs"](plan, start - dt.timedelta(days=1)))
        self.assertIsNone(remind["todays_refs"](plan, start + dt.timedelta(days=len(plan))))


if __name__ == "__main__":
    unittest.main()
