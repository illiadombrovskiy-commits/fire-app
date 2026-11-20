import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

// Exercise the real publishing path, not a copy of its decision logic.
const source = await readFile(new URL("../auth.js", import.meta.url), "utf8");
const begin = source.indexOf("  async function commitReadingPresence(s, profileUpdate) {");
const end = source.indexOf("\n  // друг ищется", begin);
assert.ok(begin >= 0 && end > begin, "Production reading publisher must be present");
const committed = [], cards = [], timers = [], notices = [];
let fail = false;
const build = new Function("committed", "cards", "timers", "notices", "getFail", `
  let pubTimer = null, presenceSequence = 0, presencePending = false, globeHide = false;
  let progressVerified = true, profileReady = true, lastFof = "";
  const day = "2026-11-20";
  const me = { uid: "reader", photoURL: "" }, myRef = "profiles/reader",
        myCode = "ABC123", myFriends = [], friendData = {}, db = {};
  const F = {
    serverTimestamp: () => ({ server: true }),
    doc: (_, ...parts) => parts.join("/"),
    setDoc: (ref, data) => { cards.push({ref,data}); return Promise.resolve(); },
    writeBatch: () => {
      const staged = [];
      return {
        set(ref, data) { staged.push({op:"set",ref,data}); return this; },
        delete(ref) { staged.push({op:"delete",ref}); return this; },
        commit() {
          // Mimic Firestore's all-or-nothing transaction on server.
          if (getFail()) return Promise.reject(new Error("offline or denied"));
          committed.push(staged);
          return Promise.resolve();
        }
      };
    }
  };
  const O = () => ({
    today: () => day,
    toast: m => notices.push(m),
    summary: () => ({
      heroFlameDay: day,
      globeSchedule: { name: "Церковь в Санкт-Петербурге", passages: [
        { ref:"Исх. 2:1–25", label:"Ветхий Завет", last:day, ahead:0 },
        { ref:"Мф. 20:1–16", label:"Новый Завет", last:day, ahead:0 }
      ] }
    })
  });
  const globeDoc = s => ({
    name:"Илья",photo:"",lit:s.heroFlameDay,seen:day,
    refs:s.globeSchedule.passages.map(p=>p.label+": "+p.ref),
    b:1,spots:[],plan:s.globeSchedule.name,streak:49,fc:0
  });
  const fLit = () => true, myName = () => "Илья", myPhoto = () => "";
  const setTimeout = (fn,ms) => { timers.push({fn,ms}); return timers.length; };
  const clearTimeout = () => {};
  ` + source.slice(begin,end) + `
  return {
    publishSummary, ready:v=>{profileReady=v},
    pending:()=>presencePending, hidden:v=>{globeHide=v}
  };
`);
const pub = build(committed,cards,timers,notices,()=>fail);
pub.publishSummary(true);
assert.equal(timers.length,0,"Reading must not wait for a timer on iPhone");
assert.equal(committed.length,1,"Profile and globe should commit together");
assert.deepEqual(committed[0].map(x=>x.ref),["profiles/reader","globe/reader"]);
assert.equal(committed[0][0].data.globeSchedule.passages[0].ref,"Исх. 2:1–25");
assert.equal(committed[0][1].data.refs[0],"Ветхий Завет: Исх. 2:1–25");
assert.equal(committed[0][0].data.flameDay,"2026-11-20");
assert.equal(committed[0][1].data.lit,"2026-11-20");
assert.equal(cards.length,1);
await new Promise(setImmediate);
assert.equal(pub.pending(),false);

const baseline=committed.length;
pub.publishSummary(false);
assert.equal(committed.length,baseline,"Debounced non-reading updates remain supported");
assert.equal(timers.pop().ms,1200);
pub.ready(false);
pub.publishSummary(true);
assert.equal(committed.length,baseline,"Unverified profiles must not be published");
assert.equal(pub.pending(),true);
pub.ready(true);
pub.publishSummary(true);
await new Promise(setImmediate);
assert.equal(committed.length,baseline+1);

pub.hidden(true);
pub.publishSummary(true);
assert.deepEqual(committed.at(-1).map(x=>x.op),["set","delete"],
  "Hidden readers must not appear on the globe");
await new Promise(setImmediate);
pub.hidden(false);

fail=true;
const prior=committed.length;
pub.publishSummary(true);
await new Promise(setImmediate);
assert.equal(committed.length,prior,
  "Failed profile write must never leave a successful flame write behind");
assert.equal(pub.pending(),true);
assert.ok(notices.length>=1,"Show sync failure, not a false success");
fail=false;
pub.publishSummary(true);
await new Promise(setImmediate);
assert.equal(committed.length,prior+1,"Retry writes both documents atomically");
assert.equal(pub.pending(),false);
assert.match(source,/O\(\)\.onSave\s*=\s*\(\)\s*=>\s*\{[^}]*publishSummary\(true\)/,
  "Reading onSave must publish immediately");
assert.match(source,/async function openProfile[\s\S]*?getDocFromServer\(ref\)/,
  "A friend's profile must be checked against the server");
console.log("PASS atomic reading profile/globe synchronization and live friend view");
