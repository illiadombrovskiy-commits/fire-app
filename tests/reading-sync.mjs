import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

// Execute the real publisher from auth.js with a fake Firestore SDK.
// A 1.2s debounce in this path previously lost reading updates when iOS
// suspended the PWA immediately after tapping "Прочитано".
const source=await readFile(new URL("../auth.js",import.meta.url),"utf8");
const start=source.indexOf("  function publishSummary(immediate = false) {");
const end=source.indexOf("\n  // друг ищется",start);
assert.ok(start>=0&&end>start,"Production publisher must be locatable");
const writes=[],timers=[],day="2026-11-20";
const build=new Function("writes","timers","day",`
  let pubTimer=null,presenceSequence=0,presencePending=false;
  let progressVerified=true,profileReady=true,lastFof="";
  const me={uid:"reader"},myRef="profiles/reader",myCode="ABC123",myFriends=[],friendData={},db={};
  const F={
    serverTimestamp:()=>({server:true}),
    doc:(_,...parts)=>parts.join("/"),
    setDoc:(ref,data)=>{writes.push({ref,data});return Promise.resolve()}
  };
  const O=()=>({
    today:()=>day,
    toast:()=>{},
    summary:()=>({
      heroFlameDay:day,
      globeSchedule:{name:"Церковь в Санкт-Петербурге",passages:[
        {ref:"Исх. 2:1–25",last:day,ahead:0},
        {ref:"Мф. 20:1–16",last:day,ahead:0}
      ]}
    })
  });
  const fLit=()=>true,myName=()=>"Илья",myPhoto=()=>"",
    publishGlobe=()=>Promise.resolve(true);
  const setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length;};
  const clearTimeout=()=>{};
  `+source.slice(start,end)+`
  return {
    publishSummary,
    ready:v=>{profileReady=v},
    pending:()=>presencePending
  };
`);
const pub=build(writes,timers,day);
pub.publishSummary(true);
assert.equal(timers.length,0,"A user's reading cannot wait for a timer");
assert.equal(writes.length,2,"Profile and reader card are enqueued synchronously");
assert.equal(writes[0].ref,"profiles/reader");
assert.equal(writes[0].data.globeSchedule.passages[0].ref,"Исх. 2:1–25");
assert.equal(writes[0].data.flameDay,day);
await Promise.resolve();await Promise.resolve();await Promise.resolve();
assert.equal(pub.pending(),false);

const before=writes.length;
pub.publishSummary(false);
assert.equal(writes.length,before,"Non-reading edits can still be debounced");
assert.equal(timers.pop().ms,1200);

pub.ready(false);
pub.publishSummary(true);
assert.equal(writes.length,before,"Failed profile initialization must not publish unverified data");
assert.equal(pub.pending(),true);
pub.ready(true);
pub.publishSummary(true);
assert.equal(writes.length,before+2,"Deferred reading is published when profile access returns");

assert.match(source,/O\(\)\.onSave\s*=\s*\(\)\s*=>\s*\{[^}]*publishSummary\(true\)/,
  "Reading onSave must use immediate publication");
assert.match(source,/async function openProfile[\s\S]*?getDocFromServer\(ref\)/,
  "Friend profile must be verified against Firestore server");
console.log("PASS immediate profile publication and server-first friend profile");
