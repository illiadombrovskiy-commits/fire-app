import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

// Test actual auth.js publisher so mocks cannot silently diverge from production.
const source = await readFile(new URL("../auth.js",import.meta.url),"utf8");
const start = source.indexOf("  async function commitReadingPresence(s, profileUpdate, progressState) {");
const end = source.indexOf("\n  // друг ищется",start);
assert.ok(start>=0 && end>start,"Atomic publisher must be present in auth.js");
const writes=[],cards=[],timers=[],notices=[];
let fail=false,day="2026-11-20",cloudProfileReady=true;
const build=new Function("writes","cards","timers","notices","isFail","getReady",`
  let pubTimer=null,presenceSequence=0,presencePending=false,globeHide=false;
  let progressVerified=true,profileReady=true,lastFof="";
  const me={uid:"reader",photoURL:""},myRef="profiles/reader",myCode="ABC123",
        myFriends=[],friendData={},db={};
  const F={
    serverTimestamp:()=>({server:true}),
    doc:(_,...parts)=>parts.join("/"),
    setDoc:(ref,data)=>{cards.push({ref,data});return Promise.resolve()},
    writeBatch:()=>{
      const staged=[];
      return {
        set(ref,data){staged.push({op:"set",ref,data});return this},
        delete(ref){staged.push({op:"delete",ref});return this},
        commit(){ if(isFail())return Promise.reject(Error("offline"));
                  writes.push(staged);return Promise.resolve() }
      };
    }
  };
  const O=()=>({
    today:()=>"2026-11-20",
    toast:m=>notices.push(m),
    summary:()=>({
      heroFlameDay:"2026-11-20",
      globeSchedule:{name:"Церковь в Санкт-Петербурге",passages:[
        {ref:"Исх. 2:1–25",last:"2026-11-20",ahead:0,label:"Ветхий Завет"},
        {ref:"Мф. 20:1–16",last:"2026-11-20",ahead:0,label:"Новый Завет"}]}
    })
  });
  const globeDoc=s=>({
    name:"Илья",photo:"",lit:s.heroFlameDay,seen:"2026-11-20",
    refs:s.globeSchedule.passages.map(p=>p.label+": "+p.ref),
    plan:s.globeSchedule.name,b:3,spots:[],streak:49,fc:0
  });
  const fLit=()=>true,myName=()=>"Илья",myPhoto=()=>"";
  const setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length};
  const clearTimeout=()=>{};
  `+source.slice(start,end)+`
  return {publishSummary,hidden:v=>{globeHide=v},pending:()=>presencePending,
     ready:v=>{profileReady=v}};
`);
const pub=build(writes,cards,timers,notices,()=>fail,()=>cloudProfileReady);
const privateProgress={v:3,schedDef:{id:"spb"},nt:{read:[0],log:[]},ot:{read:[0,1],log:[]}};
const checkRefs=batch=>{
  assert.deepEqual(batch.map(x=>x.ref),["users/reader","profiles/reader","globe/reader"]);
  assert.deepEqual(batch.map(x=>x.op),["set","set","set"]);
  assert.deepEqual(batch[0].data,privateProgress);
  assert.equal(batch[1].data.globeSchedule.passages[0].ref,"Исх. 2:1–25");
  assert.equal(batch[2].data.refs[0],"Ветхий Завет: Исх. 2:1–25");
  assert.equal(batch[1].data.flameDay,"2026-11-20");
  assert.equal(batch[2].data.lit,"2026-11-20");
};
await pub.publishSummary(true,privateProgress);
assert.equal(timers.length,0,"Reading must begin cloud sync before iOS suspends the page");
assert.equal(writes.length,1);
checkRefs(writes[0]);
assert.equal(pub.pending(),false);
assert.equal(cards.length,1);

const before=writes.length;
pub.publishSummary(false);
assert.equal(writes.length,before);
assert.equal(timers.pop().ms,1200);

pub.ready(false);
pub.publishSummary(true,privateProgress);
assert.equal(writes.length,before,"Do not overwrite cloud before server profile loaded");
assert.equal(pub.pending(),true);
pub.ready(true);
await pub.publishSummary(true,privateProgress);
assert.equal(writes.length,before+1);
checkRefs(writes.at(-1));

pub.hidden(true);
await pub.publishSummary(true,privateProgress);
assert.deepEqual(writes.at(-1).map(x=>x.ref),["users/reader","profiles/reader","globe/reader"]);
assert.deepEqual(writes.at(-1).map(x=>x.op),["set","set","delete"]);
pub.hidden(false);

fail=true;
const prior=writes.length;
assert.equal(await pub.publishSummary(true,privateProgress),false);
assert.equal(writes.length,prior,"Network failure cannot leave globe newer than private progress");
assert.equal(pub.pending(),true);
assert.ok(notices.some(n=>n.includes("синхрониз")));
fail=false;
assert.equal(await pub.publishSummary(true,privateProgress),true);
assert.equal(writes.length,prior+1);
assert.equal(pub.pending(),false);

assert.match(source,/O\(\)\.setRemote\(\(progressSnapshot\)\s*=>\s*\{/,
  "Private reading save must use atomic publisher");
assert.doesNotMatch(source,/chain\.then\(\(\)\s*=>\s*F\.setDoc\(ref,\s*s\)\)/,
  "An old queued /users write can no longer revert to Genesis");
assert.match(source,/getDocFromServer\(ref\)/,"Friend read must come from server");

// Test the real local-vs-cloud recovery decision.
const helperStart=source.indexOf("  // A locally completed Exodus passage");
const helperEnd=source.indexOf("  // имя, которое видят друзья:",helperStart);
assert.ok(helperStart>=0&&helperEnd>helperStart);
const storage=new Map(),get=k=>storage.get(k)||null;
const choose=new Function("lsGet","day",`
  const O=()=>({today:()=>day});
  `+source.slice(helperStart,helperEnd)+`
  return preferLocalProgress;
`)(get,"2026-11-20");
const old={schedDef:{id:"spb"},nt:{read:[0],log:[]},ot:{read:[0],log:[]}};
const newState={schedDef:{id:"spb"},nt:{read:[0],log:[]},ot:{read:[0,1],log:[{d:"2026-11-20",p:1}]}};
assert.equal(choose(newState,old,"reader"),true,"Protect newer Exodus reading from old Genesis cloud");
assert.equal(choose(old,newState,"reader"),false,"Never overwrite newer cloud with stale device");
assert.equal(choose({...newState,schedDef:{id:"my-other"}},old,"reader"),false);
storage.set("ogonek-reading-pending-reader","1");
assert.equal(choose(newState,old,"reader"),true,"Retry known unsynced local progress");
// Read-only self-check: diagnose if /users, /profiles or /globe still
// reports Genesis when this device has already reached Exodus.
const diagnosticStart=source.indexOf("  function nextPassagesFromState(state) {");
const diagnosticEnd=source.indexOf("  function toggleUserMenu()",diagnosticStart);
assert.ok(diagnosticStart>=0&&diagnosticEnd>diagnosticStart);
const diagnostic=source.slice(diagnosticStart,diagnosticEnd);
const helperEnd=diagnostic.indexOf("  function profilePassages(data) {");
const helper=new Function("window",diagnostic.slice(0,helperEnd)+";return nextPassagesFromState")({
  OgonekBibleSchedule:{buildSched:()=>({
    keys:["nt","ot"],plan:[
      ["Мф.","19:16–30","Быт.","50:1–26"],
      ["Мф.","20:1–16","Исх.","1:1–22"]
    ]
  })}
});
const local={nt:{read:[0]},ot:{read:[0],skip:[]}};
const oldCloud={nt:{read:[]},ot:{read:[],skip:[]}};
assert.match(helper(local),/ВЗ: Исх\. 1:1–22 \(1 отметок\)/);
assert.match(helper(oldCloud),/ВЗ: Быт\. 50:1–26 \(0 отметок\)/);
assert.match(diagnostic,/F\.getDocFromServer\(F\.doc\(db,name,uid\)\)/);
assert.doesNotMatch(diagnostic,/(?:F\.setDoc|F\.writeBatch|F\.deleteDoc)\(/,
  "Sync diagnosis must never change user data");
console.log("PASS read-only diagnosis compares Genesis/Exodus without changing progress");
console.log("PASS atomic 3-way reading sync and recovery of locally newer passage");
