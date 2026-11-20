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

  // Globe and profile are written separately and can briefly disagree.
  // A freshly published public flame proves that the user read today,
  // even if their profile's per-schedule dates are not yet synchronized.
  const fDayRead = (profile, globe, day) =>
    fLit(profile, day) || !!(globe &&
      (globe.lit === day ||
       (globe.seen === day && Array.isArray(globe.spots) && globe.spots.some(p => p && p.l === true))));
  // For one passage the daily check mark can reflect the public reading
  // status. Multiple passages retain independent, exact check marks.
  const fPassageRead = (p, passages, profile, globe, day) =>
    !!p && (p.last === day || ((passages || []).length === 1 && fDayRead(profile, globe, day)));

export {fKeys,fLabel,fShort,fDone,fRef,fUrl,fLit,fDayRead,fPassageRead};
