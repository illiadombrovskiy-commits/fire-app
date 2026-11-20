import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
async function load(name){return import("data:text/javascript;base64,"+Buffer.from(await readFile(new URL("../src/"+name+".js",import.meta.url))).toString("base64"))}
globalThis.window={Ogonek:{planId:"spb",DAYS:364}};
const {fLit,fProfileReadToday,fScheduleReadToday,fLiveAhead}=await load("friend-progress");
const {createEncouragementConfig}=await load("encouragement-config");
const {createEncouragementService}=await load("encouragement-service");
const {createFriendActions}=await load("friend-actions");
const {KIND}=createEncouragementConfig();
assert.equal(fLit({heroFlameDay:"2026-11-20",globeSchedule:{passages:[{last:"2026-11-20"},{last:""}]}},"2026-11-20"),true);
assert.equal(fLit({heroFlameDay:"",globeSchedule:{passages:[{last:"2026-11-20"}]}},"2026-11-20"),false);
assert.equal(fLit({globeSchedule:{passages:[{last:"2026-11-20"},{last:""}]}},"2026-11-20"),true);
assert.equal(fLit({ntLast:"2026-11-20",otLast:""},"2026-11-20"),true);
// A reader can read a different plan, so the globe is lit although the
// currently selected schedule still points to its next unread passage.
const dayRead="2026-11-20";
const otherPlanRead={heroFlameDay:dayRead,globeSchedule:{passages:[{ref:"4 Цар. 25",last:""}]}};
assert.equal(fProfileReadToday(otherPlanRead,dayRead,""),true);
assert.equal(fScheduleReadToday(otherPlanRead.globeSchedule.passages[0],dayRead),false);
assert.equal(fProfileReadToday({heroFlameDay:"",globeSchedule:{passages:[{ref:"4 Цар. 25",last:""}]}},dayRead,dayRead),true); // globe event arrives first
assert.equal(fProfileReadToday({heroFlameDay:""},dayRead,""),false);
assert.equal(fScheduleReadToday({ref:"4 Цар. 25",last:dayRead},dayRead),true);
assert.equal(fScheduleReadToday(null,dayRead),false);
// Реальный случай: друг завершил Бытие, но в профиле остались вчерашние +9/+12.
// 101 прочитанный отрывок на 20 ноября не может означать опережение
// по обоим заветам при общем плане, начавшемся 28 сентября.
window.OgonekBibleSchedule={SPB_START:"2026-09-28"};
const ivan={plan:"spb",planName:"Церковь в Санкт-Петербурге",
  ntRead:50,otRead:51,ntDays:728,otDays:728,ntAhead:9,otAhead:12};
assert.equal(fLiveAhead(ivan,"nt","2026-11-20"),-3);
assert.equal(fLiveAhead(ivan,"ot","2026-11-20"),-2);
assert.equal(fLiveAhead(ivan,"nt","2026-11-21"),-4);
assert.equal(fLiveAhead(ivan,"ot","2026-11-21"),-3);
// Сегодняшний непрочитанный отрывок не считается просроченным до завтра.
assert.equal(fLiveAhead({...ivan,ntRead:53},"nt","2026-11-20"),0);
assert.equal(fLiveAhead({...ivan,ntRead:55},"nt","2026-11-20"),1);
// Старые опубликованные числа в главном профиле не должны перебивать календарь.
ivan.globeSchedule={name:ivan.planName,passages:[{key:"nt",ahead:9},{key:"ot",ahead:12}]};
assert.equal(fLiveAhead(ivan,"nt","2026-11-20",ivan.globeSchedule.passages[0]),-3);
// Для других ежедневных расписаний календарь и объём читаются из профиля.
const own={plan:"custom",ntRead:4,paceMeta:{asOf:"2026-11-18",start:"2026-11-18",total:20,daily:true}};
assert.equal(fLiveAhead(own,"nt","2026-11-20"),1);
const secondary={plan:"spb",planName:"Церковь",globeSchedule:{name:"Мой план",
  pace:{asOf:"2026-11-18",start:"2026-11-18",total:20,daily:true,read:{nt:4}},
  passages:[{key:"nt",ahead:3}]}};
assert.equal(fLiveAhead(secondary,"nt","2026-11-20",secondary.globeSchedule.passages[0]),1);
// У неежедневных или старых чужих планов не выдумываем опережение.
const unusual={plan:"custom",planName:"Книга служения",globeSchedule:{name:"Книга служения",
  pace:{asOf:"2026-11-19",start:"2026-11-01",total:30,daily:false,read:{nt:12}},
  passages:[{key:"nt",ahead:5}]}};
assert.equal(fLiveAhead(unusual,"nt","2026-11-20",unusual.globeSchedule.passages[0]),null);
assert.equal(fLiveAhead(unusual,"nt","2026-11-19",unusual.globeSchedule.passages[0]),5);
assert.equal(fLiveAhead({plan:"custom",ntAhead:9},"nt","2026-11-20"),null);
// Old globe spots had no date check: yesterday's fire must go out today.
const profileUnread={heroFlameDay:"",globeSchedule:{passages:[{ref:"4 Цар. 25",last:""}]}};
assert.equal(fProfileReadToday(profileUnread,dayRead,{lit:dayRead,seen:dayRead,spots:[{l:true}]}),true);
assert.equal(fProfileReadToday(profileUnread,dayRead,{lit:"",seen:dayRead,spots:[{l:true}]}),true);
assert.equal(fProfileReadToday(profileUnread,dayRead,{lit:"2026-11-19",seen:"2026-11-19",spots:[{l:true}]}),false);
assert.equal(fScheduleReadToday(profileUnread.globeSchedule.passages[0],dayRead),false);
let day="2026-11-20", lit=true, profile={}, fail=false, peerRead=false, peerUnavailable=false, peerGlobeRead=false, peerGlobeSpot=false;
const writes=[], messages=[], storage=new Map();
const O=()=>({today:()=>day,summary:()=>({lit:lit?day:""}),toast:m=>messages.push(m)});
const F={doc:(_, ...p)=>p.join("/"),serverTimestamp:()=>123,setDoc:async(p,d,o)=>{if(fail&&p.startsWith("cheers/"))throw Object.assign(new Error("test rejection"),{code:"permission-denied"});writes.push([p,d,o])},updateDoc:async(p,d)=>writes.push([p,d]),arrayUnion:x=>["union",x],arrayRemove:x=>["remove",x],getDoc:async()=>({exists:()=>true,data:()=>({following:[]})}),getDocFromServer:async(path)=>{if(peerUnavailable)throw new Error("offline");return {exists:()=>true,data:()=>path.startsWith("globe/")?{lit:peerGlobeRead?day:"",seen:day,spots:peerGlobeSpot?[{b:0,l:true}]:[]}:{lit:peerRead?day:""}}}};
const s=createEncouragementService({KIND,lsGet:k=>storage.get(k),lsSet:(k,v)=>storage.set(k,v),O,F,db:null,fLit:(d,t)=>d.lit===t,getProfile:()=>profile,setProfile:v=>profile=v,getRef:()=>"profiles/a",getMe:()=>({uid:"a"}),myName:()=>"A",myPhoto:()=>"",fProfileReadToday});
assert.equal(s.left("cheer"),2);
assert.equal(await s.sendMsg("b",0,"cheer"),true);
assert.deepEqual(writes[0],["profiles/a",{flameDay:day},{merge:true}]);
assert.equal(writes[1][0],"cheers/b/inbox/a_"+day);
assert.equal(s.sentToday("b","cheer"),true);
assert.equal(s.left("cheer"),1);
profile.cheer.u.push("c");
assert.equal(s.left("cheer"),0);
day="2026-11-21";
assert.equal(s.left("cheer"),2);
peerRead=true;
assert.equal(await s.sendMsg("b",0,"cheer"),false);
assert.equal(s.sentToday("b","cheer"),false);
peerRead=false;peerUnavailable=true;
assert.equal(await s.sendMsg("b",0,"cheer"),false);
peerUnavailable=false;peerGlobeRead=true;
assert.equal(await s.sendMsg("b",0,"cheer"),false); // flame arrived before profile summary
peerGlobeRead=false;peerGlobeSpot=true;
assert.equal(await s.sendMsg("b",0,"cheer"),false); // legacy per-book flame, today's date
assert.equal(s.sentToday("b","cheer"),false);
peerGlobeSpot=false;
lit=false;
assert.equal(await s.sendMsg("b",0,"cheer"),false);
assert.equal(s.sentToday("b","cheer"),false);
lit=true;fail=true;
assert.equal(await s.sendMsg("b",0,"cheer"),false);
assert.equal(s.sentToday("b","cheer"),false);
fail=false;lit=false;
assert.equal(await s.sendMsg("b",0,"invite"),true);
assert.ok(writes.some(([p,d])=>p==="cheers/b/inbox/a_"+day+"_inv"&&d.kind==="invite"));
const context={me:{uid:"a"},myRef:"profiles/a",myFriends:[],myFollowing:[]};
const f=createFriendActions({F,db:null,O,getContext:()=>context});
assert.equal(await f.addFriendUid("a"),false);
assert.equal(await f.addFriendUid("b"),true);
await f.acceptRequest("b");
await f.removeFriend("b");
assert.ok(writes.some(([p,d])=>p==="profiles/b"&&JSON.stringify(d.friends)==='["remove","a"]'));
console.log("PASS social service regression (mock Firebase)");
