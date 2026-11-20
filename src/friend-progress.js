const O=()=>window.Ogonek;
  const fKeys = (d) => (Array.isArray(d.keys) && d.keys.length ? d.keys : ["nt", "ot"]);
  const fLabel = (d, k) => d[k + "Label"] || (k === "nt" ? "Новый Завет" : "Ветхий Завет");
  const fShort = (d, k) => ({ "Новый Завет": "НЗ", "Ветхий Завет": "ВЗ" })[fLabel(d, k)] || fLabel(d, k);
  const fDone = (d, k) => (d[k + "Next"] || 0) >= (d[k + "Days"] || ((d.plan || "spb") === O().planId ? O().DAYS : 364));
  const fRef = (d, k) => (typeof d[k + "Ref"] === "string" ? d[k + "Ref"] : O().refOfPlan(d.plan || "spb", k, d[k + "Next"] || 0) || "—");
  const fUrl = (d, k) => d[k + "Url"] || O().urlOfPlan(d.plan || "spb", k, d[k + "Next"] || 0) || "#";
  // The home flame is lit after reading any passage today. Friends must use
  // the same canonical marker, not require every testament to be finished.
  const fLit = (d, t) => {
    if (!d) return false;
    if (typeof d.heroFlameDay === "string") return d.heroFlameDay === t;
    if (d.flameDay === t) return true; // legacy profiles
    const p = d.globeSchedule && d.globeSchedule.passages;
    if (Array.isArray(p) && p.length) return p.some(x => x && x.last === t);
    return fKeys(d).some(k => d[k + "Last"] === t);
  };
  // The globe's live flame can arrive before the profile's reading summary.
  // Present a single day-level status without marking the *next* passage read.
  const fGlobeReadToday = (globe, day) => {
    if (typeof globe === "string") return globe === day; // old callers
    return !!(globe && (globe.lit === day ||
      (globe.seen === day && Array.isArray(globe.spots) && globe.spots.some(p => p && p.l === true))));
  };
  const fProfileReadToday = (d, day, globe) => fLit(d, day) || fGlobeReadToday(globe, day);
  const fScheduleReadToday = (passage, day) => !!passage && passage.last === day;
  // Отставание от календаря меняется каждый день, даже когда друг не открывает приложение.
  // Не показываем вчерашний сохранённый "+9" как сегодняшнее опережение.
  const dayNumber = value => {
    if (typeof value !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return NaN;
    const t = Date.parse(value + "T00:00:00Z");
    return Number.isFinite(t) ? Math.floor(t / 86400000) : NaN;
  };
  const paceByCount = (read, start, total, today) => {
    const startDay = dayNumber(start), currentDay = dayNumber(today);
    if (!Number.isInteger(read) || read < 0 || !Number.isInteger(total) || total <= 0
        || !Number.isFinite(startDay) || !Number.isFinite(currentDay)) return null;
    const elapsed = currentDay - startDay;
    const due = Math.max(0, Math.min(total, elapsed + 1));
    // Текущий непрочитанный отрывок станет просроченным только завтра.
    const dueYesterday = Math.max(0, Math.min(total, elapsed));
    return read - (read < due ? dueYesterday : due);
  };
  const fLiveAhead = (d, k, today, passage = null) => {
    if (!d || !k) return null;
    if (passage) {
      const meta = d.globeSchedule && d.globeSchedule.pace;
      if (meta && meta.daily === true && meta.read && Number.isInteger(meta.read[k])) {
        return paceByCount(meta.read[k], meta.start, meta.total, today);
      }
      // Для нестандартного графика не угадываем число пропущенных рабочих дней.
      if (meta && meta.asOf === today && Number.isFinite(passage.ahead)) return passage.ahead;
      const primary = (d.plan || "spb") === "spb"
        && d.globeSchedule && (!d.planName || d.globeSchedule.name === d.planName)
        && (!passage.key || passage.key === k);
      return primary ? fLiveAhead(d, k, today) : null;
    }
    const meta = d.paceMeta;
    if (meta && meta.daily === true)
      return paceByCount(d[k + "Read"], meta.start, meta.total, today);
    // Старые профили общего плана ещё не имеют paceMeta. Исправляем их сразу,
    // используя уже опубликованное число уникальных прочитанных отрывков.
    if ((d.plan || "spb") === "spb" && Number.isInteger(d[k + "Read"])) {
      const start = window.OgonekBibleSchedule && window.OgonekBibleSchedule.SPB_START;
      return paceByCount(d[k + "Read"], start, d[k + "Days"] || 728, today);
    }
    if (meta && meta.asOf === today && Number.isFinite(d[k + "Ahead"])) return d[k + "Ahead"];
    return null;
  };

export {fKeys,fLabel,fShort,fDone,fRef,fUrl,fLit,fGlobeReadToday,fProfileReadToday,fScheduleReadToday,fLiveAhead};
