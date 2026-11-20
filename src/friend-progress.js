const O=()=>window.Ogonek;
  const fKeys = (d) => (Array.isArray(d.keys) && d.keys.length ? d.keys : ["nt", "ot"]);
  const fLabel = (d, k) => d[k + "Label"] || (k === "nt" ? "Новый Завет" : "Ветхий Завет");
  const fShort = (d, k) => ({ "Новый Завет": "НЗ", "Ветхий Завет": "ВЗ" })[fLabel(d, k)] || fLabel(d, k);
  const fDone = (d, k) => (d[k + "Next"] || 0) >= (d[k + "Days"] || ((d.plan || "spb") === O().planId ? O().DAYS : 364));
  const fRef = (d, k) => (typeof d[k + "Ref"] === "string" ? d[k + "Ref"] : O().refOfPlan(d.plan || "spb", k, d[k + "Next"] || 0) || "—");
  const fUrl = (d, k) => d[k + "Url"] || O().urlOfPlan(d.plan || "spb", k, d[k + "Next"] || 0) || "#";
  const fLit = (d, t) => {
    const p = d.globeSchedule && d.globeSchedule.passages;
    if (Array.isArray(p) && p.length) return p.every(x => x && x.last === t);
    return fKeys(d).every(k => d[k + "Last"] === t);
  };

export {fKeys,fLabel,fShort,fDone,fRef,fUrl,fLit};
