"""Огонёк: вечернее напоминание в 22:00 тем, кто сегодня ещё ничего не прочитал.

Запускается каждый час из GitHub Actions (.github/workflows/remind.yml).
Берёт подписки из Firestore (коллекция push/{uid}: tokens, tz, on, lastSent),
смотрит прогресс в profiles/{uid} (ntLast, otLast, streak, friends) и шлёт push через Firebase Cloud Messaging.
Нужен секрет репозитория FIREBASE_SERVICE_ACCOUNT — JSON ключа сервисного аккаунта Firebase.
"""
import datetime as dt
import json
import os
import random
import re
import sys

HOUR = 22
SITE = "https://bible-fire.ru/"
PLAN_START = dt.date(2026, 9, 28)


def plural(n, one, few, many):
    a, b = n % 10, n % 100
    if a == 1 and b != 11:
        return one
    if 2 <= a <= 4 and not 12 <= b <= 14:
        return few
    return many


def load_plan():
    try:
        html = open(os.path.join(os.path.dirname(__file__), "..", "..", "index.html"), encoding="utf-8").read()
        m = re.search(r"const PLAN=(\[.*?\]\]);", html, re.S)
        return json.loads(m.group(1)) if m else []
    except Exception:
        return []


def todays_refs(plan, day):
    i = (day - PLAN_START).days
    if not plan or i < 0 or i >= len(plan):
        return None
    d = plan[i]
    return f"{d[0]} {d[1]}", f"{d[2]} {d[3]}"


def pick_message(streak_at_risk, streak, refs, friends_read, rnd=random):
    """Возвращает (заголовок, текст). Варианты чередуются случайно."""
    opts = []
    if streak_at_risk and streak > 0:
        dn = f"{streak} {plural(streak, 'день', 'дня', 'дней')}"
        opts += [
            ("Не дай угаснуть пламени 🔥", f"Серия {dn} подряд. Прочитай сегодняшний отрывок — до полуночи ещё есть время."),
            ("Огонёк ещё тлеет", f"{dn} подряд — не прерывай серию. Подкинь дров: всего 10 минут чтения."),
            ("Ещё успеваешь!", f"До конца дня пара часов. Прочитай хотя бы один отрывок — и серия {dn} сохранится."),
        ]
    else:
        opts += [
            ("Пора зажечь огонь 🔥", "Сегодняшние отрывки ждут тебя — всего 10 минут."),
            ("Огонёк ждёт тебя", "Открой сегодняшнее чтение — и пламя снова загорится."),
            ("Вечер со Словом", "Пара коротких отрывков из Нового и Ветхого Завета — и огонёк загорится."),
        ]
    if refs:
        opts.append(("Слово на сегодня", f"{refs[0]} и {refs[1]} — 10 минут, и огонёк горит."))
    if friends_read:
        names = friends_read[:1]
        more = len(friends_read) - 1
        who = names[0] + (f" и ещё {more}" if more else "")
        opts.append(("Друзья уже читают", f"{who} уже читали сегодня — присоединяйся!" if more else f"{who} уже читает сегодня — присоединяйся!"))
    return rnd.choice(opts)


def decide(push, profile, now_utc):
    """Нужно ли слать сейчас. Возвращает (send: bool, local_day, at_risk, streak)."""
    tz = int(push.get("tz", 180))
    local = now_utc + dt.timedelta(minutes=tz)
    day = local.date()
    if not push.get("on") or not push.get("tokens"):
        return False, day, False, 0
    if local.hour < int(push.get("hour", HOUR)):
        return False, day, False, 0
    if push.get("lastSent") == day.isoformat():
        return False, day, False, 0
    p = profile or {}
    today = day.isoformat()
    if p.get("ntLast") == today or p.get("otLast") == today:
        return False, day, False, 0
    last = max(p.get("ntLast") or "", p.get("otLast") or "")
    at_risk = last == (day - dt.timedelta(days=1)).isoformat()
    return True, day, at_risk, int(p.get("streak") or 0)


def main():
    import firebase_admin
    from firebase_admin import credentials, firestore, messaging

    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "")
    if not raw:
        print("Нет секрета FIREBASE_SERVICE_ACCOUNT")
        sys.exit(1)
    firebase_admin.initialize_app(credentials.Certificate(json.loads(raw)))
    db = firestore.client()
    force = os.environ.get("FORCE") == "true"
    now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    plan = load_plan()
    sent = skipped = 0
    for snap in db.collection("push").where("on", "==", True).stream():
        uid, push = snap.id, snap.to_dict()
        prof_snap = db.collection("profiles").document(uid).get()
        profile = prof_snap.to_dict() if prof_snap.exists else {}
        ok, day, at_risk, streak = decide(push, profile, now)
        if force:
            ok, title, body = True, "Проверка напоминания", "Так будет выглядеть напоминание в 22:00 🔥"
        if not ok:
            skipped += 1
            continue
        if not force:
            friends_read = []
            for fid in (profile.get("friends") or [])[:30]:
                f = db.collection("profiles").document(fid).get()
                fd = f.to_dict() if f.exists else {}
                if day.isoformat() in (fd.get("ntLast"), fd.get("otLast")):
                    friends_read.append((fd.get("name") or "Друг").split(" ")[0])
            title, body = pick_message(at_risk, streak, todays_refs(plan, day), friends_read)
        dead = []
        for tok in push.get("tokens", []):
            msg = messaging.Message(
                token=tok,
                data={"title": title, "body": body, "url": SITE, "tag": "remind"},
                webpush=messaging.WebpushConfig(headers={"Urgency": "high", "TTL": "7200"}),
            )
            try:
                messaging.send(msg)
                sent += 1
            except (messaging.UnregisteredError, messaging.SenderIdMismatchError):
                dead.append(tok)
            except Exception as e:  # noqa: BLE001
                print("ошибка отправки", uid, type(e).__name__, e)
        patch = {} if force else {"lastSent": day.isoformat()}
        if dead:
            patch["tokens"] = firestore.ArrayRemove(dead)
        if patch:
            snap.reference.update(patch)
    print(f"отправлено: {sent}, пропущено: {skipped}")


if __name__ == "__main__":
    main()
