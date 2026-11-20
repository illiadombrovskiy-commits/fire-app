/* ===== Костёр — группа «Читаем вместе» (до 4 человек) — ДЕМО: данные группы локально ===== */
(function(){
const O=()=>window.Ogonek, GK="ogonek-fires-demo6";
/* DEMO — только демо-страница (вымышленные друзья, всё в браузере). На сайте группы живут в Firestore (groups/{КОД}), сеть подключает auth.js через window.ogGroupsNet */
const DEMO=!!window.__ogDemo;
let NET=null, MYUID=null, NAMES={}, PHOTOS={};
const PAL=["#2f9e6b","#d05a8c","#c98a12","#3f7fd6","#7a5cc4","#d9532c","#1f8a9e","#8a6d3b"];
function colorOf(id){let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return PAL[h%PAL.length]}
const uidOf=id=>id==="me"?MYUID:id, idOf=u=>u===MYUID?"me":u;
function put(patch){if(DEMO||!NET||!G)return Promise.resolve();return NET.update(G.code,patch).catch(e=>{console.warn(e);try{O().toast("Не удалось сохранить в группе. Проверьте интернет.")}catch(_){}})}
/* документ Firestore → внутренний вид группы */
function fromDoc(d){
  const t=today(),fresh=d.day===t,reads=fresh?(d.reads||{}):{},vs=fresh?(d.verses||{}):{};
  Object.assign(NAMES,d.names||{});Object.assign(PHOTOS,d.photos||{});
  const prev=FIRES.find(f=>f.code===d.code)||{};
  const L=d.live&&(d.live.in||[]).length&&Date.now()-d.live.t<90*6e4?{by:idOf(d.live.by),t:d.live.t,in:(d.live.in||[]).map(idOf)}:null;
  const ch=fresh&&d.cheers&&d.cheers[MYUID];
  return {code:d.code,name:d.name||"Жизненная группа",owner:idOf(d.owner),plan:d.plan||{kind:"church"},size:d.size||4,meet:d.meet||null,link:d.link||"",
    created:d.created||t,streak:0,made:true,live:L,
    members:(d.members||[]).map(u=>({id:idOf(u),st:"in",read:u===MYUID?null:(reads[u]||null),react:{fire:[],pray:[]}})),
    verses:Object.fromEntries(Object.entries(vs).filter(([u])=>u!==MYUID)),
    inbox:ch?[{from:idOf(ch.from),t:ch.txt}]:[],
    cheered:Object.fromEntries(Object.entries(fresh?(d.cheers||{}):{}).filter(([u,c])=>c&&c.from===MYUID).map(([u])=>[idOf(u),true])),
    cel:prev.cel||"",day:t,myReact:{},myTime:fresh&&reads[MYUID]||null,_doc:d};
}
const MAX=()=>G&&G.size||4;
const $c=document.getElementById("groupCard"); if(!$c)return;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const today=()=>O().today();
const hm=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const pl=(n,a,b,c)=>O().plural(n,a,b,c).replace(/^\d+\s*/,"");
const FRIENDS=[
  {id:"tolya",name:"Анатолий",c:"#2f9e6b",g:"m"},
  {id:"lada",name:"Лада",c:"#d05a8c",g:"f"},
  {id:"lusya",name:"Люся",c:"#c98a12",g:"f"},
  {id:"ruslan",name:"Руслан",c:"#3f7fd6",g:"m"},
  {id:"mark",name:"Марк",c:"#7a5cc4",g:"m"}
];
const DEMO_READ={tolya:"07:12",lada:"08:40",lusya:"09:05",ruslan:null};
const PHR=["Ждём тебя 🙂 Сегодня совсем короткий отрывок","Без тебя группа не в сборе 🔥","Помолился(лась) за тебя. Почитаем вместе?"];
/* ---------- книги служения (из MSB основного скрипта) ---------- */
const MSURL="https://ministrybooks.online/?mb=";
function bookInfo(id){try{return msBook(id)}catch(e){return null}}
function bookList(){
  const out=[];try{
    MSB.ls.forEach(x=>{const t=bookInfo(x[0]);if(t&&t.m&&t.m.length>1)out.push({id:x[0],t:t.t,a:"Уитнесс Ли",n:t.m.length,ls:1})});
    MSB.other.forEach(x=>{const t=bookInfo(x[0]);if(t&&t.m&&t.m.length>1)out.push({id:x[0],t:x[1],a:x[2],n:t.m.length})});
  }catch(e){}
  return out;
}
const POPULAR=[559,236,268,619,160,161];
function weekStart(d){const t=new Date((d||today())+"T12:00:00");t.setDate(t.getDate()-((t.getDay()+6)%7));return t}
function bookWeek(B){return Math.max(0,Math.round((weekStart()-weekStart(B.start))/(7*864e5)))}
function bookNow(B){const t=bookInfo(B.ms);if(!t)return null;const w=bookWeek(B),a=w*B.pw,list=[];
  for(let i=a;i<Math.min(a+B.pw,t.m.length);i++)list.push({i,part:t.m[i][0],title:t.m[i][1]});
  return {t,w,list,total:t.m.length,doneAll:a>=t.m.length}}
function chName(t){return t.ls?t.t:"«"+t.t+"»"}
/* ---------- стихи друзей (из сегодняшних отрывков) ---------- */
function todayRefs(){
  const out={};try{const st=O().getState(),sm=O().summary(),t=today();
    ["nt","ot"].forEach(k=>{const l=((st[k]||{}).log||[]).filter(x=>x.d===t);const p=l.length?l[0].p:sm[k+"Next"];out[k]=O().refOf(k,p)})}catch(e){}
  return out;
}
function verses(){
  if(!DEMO)return Object.fromEntries(Object.entries((G&&G.verses)||{}).map(([u,v])=>[idOf(u),v]));
  if(G&&G.plan&&G.plan.kind==="ms")return {};
  if(G&&G.plan&&G.plan.kind==="bible"){const r=(planToday().refs[0]||"");const m=/^(.+?) (\d+)/.exec(r);const v=m?m[1]+" "+m[2]+":":"";
    return v?{tolya:{v:v+5,w:"Этот стих прямо для меня сегодня."},lada:{v:v+12,w:"Помолилась этим стихом — стало спокойно."},lusya:{v:v+3,w:"Записала себе на весь день."},ruslan:{v:v+8,w:"Прочитал и помолился."}}:{}}
  const s=todayRefs(), nt=s.nt||"", ot=s.ot||"";
  if(/^Мф\. 13:3/.test(nt)) return {
    tolya:{v:"Мф. 13:8",w:"Хочу, чтобы моё сердце было доброй землёй, а не дорогой и не камнями."},
    lada:{v:"Быт. 31:3",w:"Бог обещал быть с ним в дороге. Значит, и со мной сегодня, в этой неделе."},
    lusya:{v:"Мф. 13:12",w:"Хочу каждый день получать от Господа всё больше."},
    ruslan:{v:"Мф. 13:9",w:"Спасибо, что подбодрили! Хочу не просто читать, а слышать."}};
  const one=(r,d)=>{const m=/^(.+? \d+):(\d+)/.exec(r);return m?m[1]+":"+(+m[2]+d):r};
  return {tolya:{v:one(nt,2),w:"Этот стих прямо для меня сегодня."},lada:{v:one(ot,2),w:"Помолилась этим стихом утром — стало спокойно."},
    lusya:{v:one(nt,4),w:"Записала себе на весь день."},ruslan:{v:one(nt,1),w:"Спасибо, что подбодрили! Прочитал и помолился."}};
}
/* ---------- состояние ---------- */
function seed(){
  const st=weekStart();st.setDate(st.getDate()-14);
  const s=st.getFullYear()+"-"+String(st.getMonth()+1).padStart(2,"0")+"-"+String(st.getDate()).padStart(2,"0");
  return {name:"Утренняя группа",owner:"me",plan:{kind:"bible",def:{id:"fire-7KQ2FD",custom:true,name:"Утренняя группа",emb:"flame",start:today(),books:["Мф."],mode:"seq",by:"chapters",amount:2}},code:"7KQ2FD",created:"2026-10-26",streak:6,
    size:4,
    members:[
      {id:"me",st:"in"},
      {id:"tolya",st:"in",read:"07:12",react:{fire:["lada"],pray:[]}},
      {id:"lada",st:"in",read:"08:40",react:{fire:["tolya"],pray:["tolya"]}},
      {id:"ruslan",st:"in",read:null,react:{fire:[],pray:[]}}],
    inbox:[{from:"lada",t:"Ждём тебя 🙂 Сегодня Мф. 13 — про семя и землю"}],
    cheered:{},cel:"",day:today(),myReact:{}};
}
let G=null, FIRES=[];
function dayReset(f){if(!f.owner)f.owner="me";if(f.day!==today()){f.members.forEach(m=>{if(m.id!=="me"){m.read=m.st==="in"?null:m.read;m.react={fire:[],pray:[]}}});f.cheered={};f.inbox=[];f.day=today();f.myTime=null}}
function seed2(){
  const code="J7PX2A",def={id:"fire-"+code,custom:true,name:"Вечерний огонь",emb:"flame",start:today(),books:["Ин."],mode:"seq",by:"chapters",amount:1};
  return {name:"Вечерний огонь",owner:"tolya",plan:{kind:"bible",def},size:4,meet:{days:[1,3],time:"21:00"},code,created:today(),streak:0,made:true,
    members:[{id:"tolya",st:"in",read:"07:12",react:{fire:[],pray:[]}},{id:"lada",st:"in",read:"08:40",react:{fire:["tolya"],pray:[]}},{id:"me",st:"in"}],inbox:[],cheered:{},cel:"",day:today(),myReact:{}};
}
function load(){
  if(!DEMO){FIRES=[];G=null;return}
  try{FIRES=JSON.parse(localStorage.getItem(GK)||"[]")||[]}catch(e){FIRES=[]}
  if(!Array.isArray(FIRES))FIRES=[];
  if(/nogroup/.test(location.hash))FIRES=FIRES.filter(f=>f.made);
  if(!FIRES.length&&location.hash.indexOf("full")>=0){FIRES=[seed(),seed2()];setTimeout(()=>{try{window.ogPlanAdd(FIRES[0].plan.def);window.ogPlanAdd(FIRES[1].plan.def)}catch(e){}},300)}
  FIRES.forEach(dayReset);G=FIRES[0]||null;
}
function store(){if(!DEMO)return;try{localStorage.setItem(GK,JSON.stringify(FIRES))}catch(e){}}
function pick(code){const f=FIRES.find(x=>x.code===code);if(f)G=f;return f}
function who(id){if(id==="me")return {id:"me",name:"Вы",c:"var(--flame)",photo:DEMO?"":(PHOTOS[MYUID]||"")};const f=DEMO&&FRIENDS.find(f=>f.id===id);if(f)return f;return {id,name:String(NAMES[id]||"Друг").split(" ")[0],c:colorOf(id),photo:PHOTOS[id]||""}}
const joined=()=>G.members.filter(m=>m.st==="in"), invited=()=>G.members.filter(m=>m.st==="inv");
function myRead(){let s={};try{s=O().summary()}catch(e){}const t=today();return (s.ntLast===t||s.otLast===t)}
function myNote(){try{const n=(O().getState().notes||[]).filter(x=>x.d===today()&&!x.m);return n[0]||null}catch(e){return null}}
function readOf(m){return m.id==="me"?(planToday().any?(G.myTime||"сегодня"):null):(m.st==="in"?m.read:null)}
function av(id,cls){const w=who(id);const ini=id==="me"?"Я":(w.name[0]||"?");return `<span class="rgav ${cls||""}" style="background:${w.c}">${w.photo?`<img src="${esc(w.photo)}" alt="" referrerpolicy="no-referrer">`:ini}</span>`}
const FL=`<path d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z" fill="#ff7a1a"/><path d="M32 40c4 8 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 6-12 0 4 2 7 5 7-2-5-2-11-1-16z" fill="#ffc94a"/>`;
function miniFlame(on){return `<svg viewBox="0 0 64 80">${on?FL:'<path d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z" fill="none" stroke="#b8bdcc" stroke-width="5"/>'}</svg>`}
function campfire(n,tot,big){
  const r=tot?n/tot:0, s=n?0.35+0.65*r:0;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
   <defs><radialGradient id="gg${big?"b":""}"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><circle class="rgglow" cx="50" cy="62" r="46" fill="url(#gg${big?"b":""})" opacity="${n===tot&&tot?1:r*.6}"/>
   <g class="rgfl ${n?"anim":""}" style="--s:${s};transform:scale(${s})" opacity="${n?1:0}"><g transform="translate(18 -2)">${FL}</g></g>
   ${n?"":'<g fill="#b8bdcc" opacity=".7"><circle cx="46" cy="52" r="3"/><circle cx="54" cy="44" r="4"/><circle cx="48" cy="34" r="5"/></g>'}
   <g stroke-linecap="round"><path d="M18 88 L82 74" stroke="#8a5a32" stroke-width="9"/><path d="M18 74 L82 88" stroke="#6e4426" stroke-width="9"/></g>
   ${Array.from({length:tot},(_,i)=>`<circle cx="${50+(i-(tot-1)/2)*14}" cy="96" r="3.4" fill="${i<n?"#ff7a1a":"#c9cddb"}"/>`).join("")}
  </svg>`;
}
function weekHtml(){
  const t=new Date(today()+"T12:00:00"), dow=(t.getDay()+6)%7, names=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const cr=new Date((G.created||today())+"T12:00:00"), J=joined();
  return names.map((nm,i)=>{const d=new Date(t);d.setDate(t.getDate()-dow+i);let cls="",ic="";
    if(i<dow&&d>=cr&&G.streak>=dow-i){cls="full";ic=miniFlame(true)}
    else if(i===dow){const n=J.filter(readOf).length;cls="now"+(n===J.length?" full":"");ic=n===J.length?miniFlame(true):`<b style="font-size:.7rem;color:var(--ink)">${n}/${J.length}</b>`}
    return `<div class="rgday ${cls}"><span class="rgd">${ic}</span>${nm}</div>`}).join("");
}
/* ---------- звонок: у каждого костра своя комната ---------- */
/* в настоящем приложении — Google Meet API (spaces.create) через вход Google; в демо ссылка-пример */
function meetCode(){const s=(G.code+"ogonekfire").toLowerCase().replace(/[^a-z]/g,"x");return s.slice(0,3)+"-"+s.slice(3,7)+"-"+s.slice(7,10)}
function svcName(u){u=String(u||"");return /telemost|yandex/i.test(u)?"Яндекс Телемост":/vk\.(com|ru)|calls\.vk/i.test(u)?"VK Звонки":/meet\.google/i.test(u)?"Google Meet":/zoom\.(us|com)/i.test(u)?"Zoom":"звонок по ссылке"}
function roomUrl(){return DEMO?"https://meet.google.com/"+meetCode():(G.link||"")}
function callLive(){const L=G.live;return L&&(L.in||[]).length&&Date.now()-L.t<90*6e4?L:null}
const inCall=()=>{const L=callLive();return !!(L&&(L.in||[]).includes("me"))};
/* выйти из звонка; ушёл последний — звонок закончен, снова «📞 Позвонить» */
function leaveCall(F){
  const k=G;G=F;const L=callLive();
  if(L){const rest=(L.in||[]).filter(x=>x!=="me");
    if(DEMO||!rest.length){F.live=null;if(!DEMO)put({live:NET.del()})}
    else{F.live=Object.assign({},L,{in:rest});put({"live.in":rest.map(uidOf)})}
    store()}
  if(callAway&&callAway.code===F.code)callAway=null;
  G=k;render();
}
function callSheet(){
  const F=G,L=callLive(),rest=(L.in||[]).filter(x=>x!=="me"),url=esc(roomUrl()||"#");
  sheet("Звонок",`<p class="rghint">Вы в звонке группы «${esc(F.name)}»${rest.length?" · ещё "+rest.map(id=>esc(who(id).name)).join(", "):""}.</p>
    <a class="rgbtn" href="${url}" target="_blank" rel="noopener" data-back>📞 Вернуться в звонок</a>
    <button class="rgbtn sec" type="button" data-end>${rest.length?"Я вышел из звонка":"Звонок закончился"}</button>`,(el,close)=>{
    el.querySelector("[data-back]").onclick=()=>{callAway={code:F.code};close()};
    el.querySelector("[data-end]").onclick=()=>{close();leaveCall(F);try{O().toast(rest.length?"Вы вышли из звонка":"Звонок завершён")}catch(_){}}});
}
/* вернулись в Огонёк из Google Meet — спросить, закончился ли звонок (сам Огонёк Meet не видит) */
let callAway=null;
document.addEventListener("visibilitychange",()=>{
  const c=callAway;if(!c)return;
  if(document.hidden){c.away=true;c.at=Date.now();return}
  if(!c.away)return;c.away=false;if(Date.now()-c.at<8000)return;
  const F=FIRES.find(f=>f.code===c.code);if(!F){callAway=null;return}
  const k=G;G=F;const on=inCall();G=k;if(!on){callAway=null;return}
  setTimeout(()=>{if(document.hidden||document.querySelector(".rgmodal"))return;
    sheet("Звонок закончился?",`<p class="rghint">Если вы уже вышли из звонка (${esc(svcName(F.link))}), нажмите «Да» — и в группе снова будет «📞 Позвонить».</p>
      <button class="rgbtn" type="button" data-y>Да, звонок закончился</button>
      <button class="rgbtn sec" type="button" data-n>Нет, я ещё в звонке</button>`,(el,close)=>{
      el.querySelector("[data-y]").onclick=()=>{close();leaveCall(F)};
      el.querySelector("[data-n]").onclick=close})},400);
});
/* ---------- созвоны по расписанию ---------- */
const DOWN=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
function meetDays(M){const d=(M.days||[]).slice().sort();return d.length===7?"каждый день":d.join()==="0,1,2,3,4"?"по будням":d.map(i=>DOWN[i]).join(", ")}
function meetState(){const M=G.meet;if(!M||!(M.days||[]).length)return null;
  const now=new Date(),dw=(now.getDay()+6)%7,[h,mi]=(M.time||"21:00").split(":").map(Number);
  if(M.days.includes(dw)){const st=new Date();st.setHours(h,mi||0,0,0);const df=(now-st)/6e4;
    if(df>=-10&&df<=60)return {now:true,txt:"Общение сейчас"};if(df<-10)return {txt:"Общение сегодня в "+M.time}}
  for(let i=1;i<=7;i++){const k=(dw+i)%7;if(M.days.includes(k))return {txt:"Общение "+(i===1?"завтра":DOWN[k].toLowerCase())+" в "+M.time}}
  return null}
function callHtml(){
  const L=callLive(),url=esc(roomUrl()||"#");
  if(L&&!(L.in||[]).includes("me"))return `<a class="rgcall2 ring" href="${url}" target="_blank" rel="noopener" data-go="call">📞 Войти</a>`;
  if(L){const ins=L.in||[];return `<a class="rgcall2 live" href="${url}" target="_blank" rel="noopener" data-go="call"><span class="rgdot"></span>Звонок · ${ins.length}<span class="rgcallav">${ins.slice(0,4).map(id=>av(id)).join("")}</span></a>`}
  const S=meetState();if(S&&S.now)return `<a class="rgcall2 ring" href="${url}" target="_blank" rel="noopener" data-go="call">📞 Общение сейчас</a>`;
  return `<a class="rgcall2" href="${url}" target="_blank" rel="noopener" data-go="call">📞 Позвонить</a>`;
}
function callNote(){
  const L=callLive();
  if(L&&L.by!=="me"&&!(L.in||[]).includes("me"))return `<div class="rgring"><span class="rgdot"></span><b>${esc(who(L.by).name)} зовёт читать вместе</b><span>сейчас</span></div>`;
  const S=meetState();return S&&!L?`<div class="rgmeetline">🗓 ${esc(S.txt)} · ${esc(meetDays(G.meet))}</div>`:"";
}
/* что видит друг, когда ему звонят: уведомление на телефоне + окно в приложении «В Слове» */
function incoming(F,by){
  const k=G;G=F;const T=planToday(),url=roomUrl();G=k;
  const n=document.createElement("div");n.className="rgpush";
  n.innerHTML=`<span class="rgpico">${miniFlame(true)}</span><div><b>В Слове · ${esc(F.name)}</b><span>📞 ${esc(who(by).name)} зовёт читать вместе — присоединяйтесь</span></div><small>сейчас</small>`;
  document.body.appendChild(n);setTimeout(()=>n.classList.add("in"),30);
  const open=()=>{n.remove();
    sheet("",`<div class="rgincall">${av(by)}<h3>${esc(who(by).name)} зовёт читать вместе</h3><p>Жизненная группа «${esc(F.name)}»${T.refs.length?" · сегодня "+esc(T.refs.join(", ")):""}</p>
      <div class="rgcallav big">${(F.live&&F.live.in||[by]).map(id=>av(id)).join("")}</div><small>${(F.live&&F.live.in||[by]).length} уже в звонке · ${esc(svcName(F.link))}</small></div>
      <a class="rgbtn rggo" href="${esc(url)}" target="_blank" rel="noopener" data-join>📞 Войти в звонок</a>
      <button class="rgbtn sec" type="button" data-later>Не сейчас</button>`,(el,close)=>{
      el.querySelector("[data-join]").onclick=()=>{G=F;callAway={code:F.code};const L=F.live;if(L&&!L.in.includes("me")){L.in.push("me");put({"live.in":L.in.map(uidOf)})}store();close();render()};
      el.querySelector("[data-later]").onclick=close;})};
  n.onclick=open;setTimeout(()=>{if(n.isConnected){n.classList.remove("in");setTimeout(open,300)}},3200);
}
function startCall(){
  callAway={code:G.code};
  if(!DEMO){
    if(!G.link){O().toast(G.owner==="me"?"Добавьте ссылку на звонок: «Расписания» → ваша группа → «Настроить группу»":"Создатель группы ещё не добавил ссылку на звонок");return}
    const L=callLive();
    if(L){if(!L.in.includes("me"))put({"live.in":(L.in.concat("me")).map(uidOf)})}
    else{put({live:{by:MYUID,t:Date.now(),in:[MYUID]}});try{O().toast("Друзья в группе увидят «📞 Войти» у себя в приложении «В Слове»")}catch(e){}}
    return}
  const L=callLive();
  if(L){if(!(L.in||[]).includes("me"))L.in=(L.in||[]).concat("me");store();setTimeout(render,300);return}
  G.live={by:"me",t:Date.now(),in:["me"]};store();setTimeout(render,300);
  try{O().toast("Друзьям у костра пришло: «Зовут читать вместе — присоединяйтесь»")}catch(e){}
  /* демо: друзья подключаются */
  const others=joined().filter(m=>m.id!=="me").map(m=>m.id),F=G;
  others.slice(0,2).forEach((id,i)=>setTimeout(()=>{const l=F.live&&Date.now()-F.live.t<90*6e4?F.live:null;if(l&&!l.in.includes(id)){l.in.push(id);store();render();try{O().toast(`${who(id).name} в звонке`)}catch(e){}}},4000+i*4500));
}
function demoRing(){
  /* демо: Анатолий звонит в первом костре, где он есть (или в первом костре) */
  const F=FIRES.find(f=>f.members.some(m=>m.id==="tolya"&&m.st==="in"))||FIRES[0];if(!F)return;
  const by=F.members.find(m=>m.id!=="me"&&m.st==="in");const id=by?by.id:"tolya";
  F.live={by:id,t:Date.now(),in:[id]};store();render();incoming(F,id);
}
/* ---------- чтение костра = обычное расписание «В Слове» ---------- */
function planId(){return G.plan&&G.plan.kind!=="church"?"fire-"+G.code:"spb"}
function planToday(){
  if(!G.plan||G.plan.kind==="church"){const r=window.ogChurchToday?window.ogChurchToday():null;return r||{refs:[],urls:[],any:myRead()}}
  const r=window.ogPlanToday?window.ogPlanToday(planId()):null;return r||{refs:[],urls:[],any:false};
}
function planDesc(P){
  if(!P||P.kind==="church")return "Расписание церкви — вся Библия за 2 года";
  if(P.kind==="ms"){const t=bookInfo(P.def.ms),d=P.def;
    const pace=d.by==="pages"?d.ppd+" "+pl(d.ppd,"страница","страницы","страниц")+" в день":d.by==="end"&&d.end?"до "+new Date(d.end+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long"}):d.pw+" "+pl(d.pw,"сообщение","сообщения","сообщений")+" в неделю";
    return (t?t.t:"Книга служения")+" · "+pace}
  const B=window.ogBooks?window.ogBooks().books:[];const names=(P.def.books||[]).map(a=>{const b=B.find(x=>x.a===a);return b?b.n.replace(/^Евангелие по /,"По "):a});
  const bk=names.length===66?"Вся Библия":names.length<=2?names.join(", "):names[0]+" … "+names[names.length-1]+" ("+names.length+" "+pl(names.length,"книга","книги","книг")+")";
  const d=P.def,pace=d.by==="chapters"?d.amount+" "+pl(d.amount,"глава","главы","глав")+" в день":d.by==="verses"?d.amount+" "+pl(d.amount,"стих","стиха","стихов")+" в день":d.end?"до "+new Date(d.end+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"}):"";
  return bk+(pace?" · "+pace:"");
}
function planBook(P){
  if(!P||P.kind==="church")return "Расписание церкви";
  if(P.kind==="ms"){const t=bookInfo(P.def.ms);return t?t.t:"Книга служения"}
  const B=window.ogBooks?window.ogBooks().books:[];const names=(P.def.books||[]).map(a=>{const b=B.find(x=>x.a===a);return b?b.n:a});
  return names.length===66?"Вся Библия":names.length<=2?names.join(", "):names[0]+" … "+names[names.length-1];
}
function planRow(){
  const T=planToday();
  const links=T.refs.length?T.refs.map((r,i)=>`<a class="rglink2" href="${esc((T.urls||[])[i]||"#")}" target="_blank" rel="noopener">${esc(r)}</a>`).join(""):`<span class="rgnone">${T.rest?"сегодня отдых":"прочитано всё 🎉"}</span>`;
  const btn=!T.refs.length?"":T.any?`<span class="rgdone">✓ Прочитано<button class="rgundo" type="button" data-go="undo">Отмена</button></span>`:`<button class="rgmark" type="button" data-go="mark">Прочитал(а)</button>`;
  let nx="";
  if(T.any&&G.plan&&G.plan.kind!=="church"&&window.ogPlanNext){const N=window.ogPlanNext(planId());
    if(N)nx=`<div class="rgnext"><span class="rglbl2">Дальше</span><div class="rglinks">${N.refs.map((r,i)=>`<a class="rglink2" href="${esc(N.urls[i]||"#")}" target="_blank" rel="noopener">${esc(r)}</a>`).join("")}</div><button class="rgmark2" type="button" data-go="next">Прочитал(а)</button></div>`}
  return `<div class="rgtoday2 ${T.any?"done":""}"><span class="rglbl2">Сегодня</span><div class="rglinks">${links}</div>${btn}</div>${nx}`;
}
function markNext(){try{window.ogPlanMarkNext(planId())}catch(e){}store();renderAll()}
function markRead(){
  if(G.plan.kind==="church"){try{window.ogChurchMark()}catch(e){}}else{try{window.ogPlanMark(planId())}catch(e){}}
  G.myTime=hm();store();syncRead(G);renderAll();
}
/* моя отметка и мой стих — в документ группы, чтобы видели друзья */
function syncRead(F){
  if(DEMO||!NET||!F||!F._doc)return;const k=G;G=F;
  const any=planToday().any,d=F._doc,t=today(),fresh=d.day===t,mine=fresh&&d.reads&&d.reads[MYUID];
  const nt=any&&F.plan.kind!=="ms"?myNote():null,mv=fresh&&d.verses&&d.verses[MYUID];
  let patch=null;
  if(any&&!mine)patch=fresh?{["reads."+MYUID]:F.myTime||hm()}:{day:t,reads:{[MYUID]:F.myTime||hm()},verses:{},cheers:{}};
  if(!any&&mine)patch={["reads."+MYUID]:NET.del()};
  if(nt&&(!mv||mv.v!==nt.v||mv.w!==(nt.w||""))){patch=patch||{};if(patch.day)patch.verses={[MYUID]:{v:nt.v,w:nt.w||""}};else if(fresh)patch["verses."+MYUID]={v:nt.v,w:nt.w||""}}
  if(patch&&Object.keys(patch).length)put(patch);G=k;
}
function undoRead(){
  if(G.plan.kind==="church"){try{window.ogChurchUndo()}catch(e){}}else{try{window.ogPlanUndo(planId())}catch(e){}}
  G.myTime=null;store();syncRead(G);renderAll();try{O().toast("Отметка снята")}catch(e){}
}
function postsToday(){const V=verses(),out=[];joined().forEach(m=>{if(!readOf(m))return;let p=null;if(m.id==="me"){const nt=myNote();if(nt)p={v:nt.v,w:nt.w||""}}else p=V[m.id];if(p&&p.v)out.push({m,p})});return out}
function versesRow(){
  const P=postsToday();
  if(G.plan&&G.plan.kind==="ms")return "";
  if(!P.length)return planToday().any?`<button class="rgrow" data-go="verse" type="button"><span class="rgri">❞</span><span><b>Какой стих затронул вас?</b><small>Поделитесь — друзья в группе увидят</small></span><em>›</em></button>`:"";
  return `<button class="rgrow" data-go="feed" type="button"><span class="rgri">❞</span><span><b>${P.length} ${pl(P.length,"стих","стиха","стихов")} сегодня</b><small>${P.map(x=>esc(x.m.id==="me"?"Вы":who(x.m.id).name)+": "+esc(x.p.v)).join(" · ")}</small></span><em>›</em></button>`;
}
function feedSheet(){
  const draw=()=>postsToday().map(({m,p})=>{const re=m.react||{fire:[],pray:[]},mr=G.myReact[m.id]||{};const fc=(re.fire||[]).length+(mr.fire?1:0),pc=(re.pray||[]).length+(mr.pray?1:0);
    return `<div class="rgpost">${av(m.id)}<div class="rgpb"><div class="rgpt"><b>${esc(who(m.id).name)}</b></div><span class="rgpv">❞ ${esc(p.v)}</span>${p.w?`<div class="rgpw">${esc(p.w)}</div>`:""}
    ${m.id==="me"||!DEMO?"":`<div class="rgpr"><button class="rgre ${mr.fire?"on":""}" data-re="fire" data-id="${m.id}" type="button">🔥 ${fc||""}</button><button class="rgre ${mr.pray?"on":""}" data-re="pray" data-id="${m.id}" type="button">🙏 ${pc||""}</button></div>`}</div></div>`}).join("");
  sheet("Что затронуло сегодня",`<p class="rghint">Видят только друзья в группе</p><div class="rgfeed" data-f>${draw()}</div>${myRead()&&!myNote()?'<button class="rgbtn" type="button" data-my>❞ Поделиться своим стихом</button>':""}`,(el,close)=>{
    el.addEventListener("click",e=>{const b=e.target.closest("[data-re]");if(b){const id=b.dataset.id,k=b.dataset.re;G.myReact[id]=G.myReact[id]||{};G.myReact[id][k]=!G.myReact[id][k];store();el.querySelector("[data-f]").innerHTML=draw()}
      if(e.target.closest("[data-my]")){close();try{window.ogAskVerse()}catch(_){}}});
  });
}
/* ---------- карточка ---------- */
function renderAll(){
  if(!FIRES.length){renderEmpty();return}
  $c.hidden=false;const keep=G;
  /* не пересоздаём карточки, если их набор не поменялся — только содержимое */
  const codes=FIRES.map(f=>f.code).join();
  if($c.dataset.codes!==codes){$c.innerHTML=FIRES.map(f=>`<section class="card grp" data-fire="${esc(f.code)}"></section>`).join("");$c.dataset.codes=codes}
  FIRES.forEach(f=>{G=f;const el=$c.querySelector(`[data-fire="${f.code}"]`);if(el)el.innerHTML=cardHtml()});
  G=FIRES.includes(keep)?keep:FIRES[0];
}
const render=renderAll;
function cardHtml(){
  const J=joined(), tot=J.length, n=J.filter(readOf).length, all=tot>1&&n===tot;
  const streak=G.streak+(all?1:0);
  const people=G.members.map(m=>{const w=who(m.id);
    if(m.st==="inv")return `<div class="rgp">${av(m.id,"off inv")}<span>${esc(w.name)}</span></div>`;
    const r=readOf(m),can=!r&&m.id!=="me"&&!G.cheered[m.id];
    return `<button class="rgp ${r?"on":""}" type="button" data-p="${m.id}">${av(m.id,r?"":"off")}${r?'<i class="rgck">✓</i>':""}<span>${esc(w.name)}</span></button>`}).join("")
    +(G.members.length<MAX()&&G.owner==="me"?`<button class="rgp" type="button" data-go="invite"><span class="rgseat">＋</span><span>Позвать</span></button>`:"");

  maybeCelebrate(all,streak);
  return `
   <div class="rgkind">Жизненная группа</div>
   <div class="rgtop2">${campfire(n,Math.max(tot,1))}<div class="rgttl"><h2>${esc(G.name)}</h2><div class="rgbookln">📖 ${esc(planBook(G.plan))}</div></div>${callHtml()}</div>
   ${callNote()}
   ${G.inbox&&G.inbox.length&&!readOf(G.members.find(m=>m.id==="me")||{id:"me"})?G.inbox.map(x=>`<div class="rgcheerln">💬 <b>${esc(who(x.from).name)}:</b> «${esc(x.t)}»</div>`).join(""):""}
   ${planRow()}
   <div class="rgpeople3">${people}</div>
   ${versesRow()?`<div class="rgrows">${versesRow()}</div>`:""}`;
}
function renderEmpty(){
  /* пока костра нет — на главной ничего; создать можно во вкладке «Расписания» */
  $c.hidden=true;$c.innerHTML="";$c.dataset.codes="";
}
/* ---------- окна ---------- */
function sheet(title,body,onMount){
  const m=document.createElement("div");m.className="rgmodal";
  m.innerHTML=`<div class="rgsheet" role="dialog" aria-label="${esc(title)}"><div class="rgsh"><h3>${title}</h3><button class="rgx" type="button" aria-label="Закрыть">✕</button></div>${body}</div>`;
  document.body.appendChild(m);
  const close=()=>m.remove();
  m.addEventListener("click",e=>{if(e.target===m||e.target.closest(".rgx"))close()});
  onMount&&onMount(m.querySelector(".rgsheet"),close);return close;
}
function cheer(id){
  const w=who(id);let pick=0;
  sheet(`Подбодрить: ${esc(w.name)}`,`
    <div style="display:flex;gap:10px;align-items:center">${av(id,"off")}<span style="color:var(--muted);font-size:.92rem">${esc(w.name)} получит уведомление на телефон. Подбодрить можно раз в день.</span></div>
    <div class="rgphr">${PHR.map((p,i)=>`<button type="button" data-i="${i}" class="${i?"":"on"}">${esc(p)}</button>`).join("")}</div>
    <input class="rginput" id="rgCheerTxt" maxlength="120" placeholder="или напишите своё…">
    <button class="rgbtn" type="button" data-send>Отправить</button>`,(el,close)=>{
    const inp=el.querySelector(".rginput");
    el.querySelectorAll(".rgphr button").forEach(b=>b.onclick=()=>{pick=+b.dataset.i;inp.value="";el.querySelectorAll(".rgphr button").forEach(x=>x.classList.toggle("on",x===b))});
    inp.oninput=()=>el.querySelectorAll(".rgphr button").forEach(x=>x.classList.toggle("on",!inp.value&&+x.dataset.i===pick));
    el.querySelector("[data-send]").onclick=()=>{
      const F=G,txt=(inp.value.trim()||PHR[pick]).slice(0,120);G.cheered[id]=true;store();close();render();
      if(!DEMO){const d=F._doc,fresh=d&&d.day===today();put(fresh?{["cheers."+uidOf(id)]:{from:MYUID,txt}}:{day:today(),reads:{},verses:{},cheers:{[uidOf(id)]:{from:MYUID,txt}}});try{O().toast(`${w.name} увидит у себя: «${txt}»`)}catch(e){}return}
      try{O().toast(`${w.name} получит: «${txt}»`)}catch(e){}
      setTimeout(()=>{const m=F.members.find(x=>x.id===id);if(m&&m.st==="in"&&!m.read){m.read=hm();store();render();try{O().toast(`🔥 ${w.name} ${/а$|я$/.test(w.name)?"прочитала":"прочитал"} — спасибо, что подбодрили!`)}catch(e){}}},5000);
    };
  });
}
/* --- позвать друзей (только создатель костра) --- */
const IK="ogonek-ginv";
function invLoad(){try{return JSON.parse(localStorage.getItem(IK)||"{}")}catch(e){return {}}}
function invSave(o){try{localStorage.setItem(IK,JSON.stringify(o))}catch(e){}}
function ogFriends(){
  const mg=(window.ogGender&&window.ogGender())||"",same=f=>!mg||!f.g||f.g===mg; // только свой пол — остальных в списке просто нет
  if(DEMO)return FRIENDS.filter(same).map(f=>({id:f.id,name:f.name}));
  let l=[];try{l=NET&&NET.friends?NET.friends():[]}catch(e){}
  return l.filter(same).map(f=>{NAMES[f.uid]=NAMES[f.uid]||f.name;if(f.photo&&!PHOTOS[f.uid])PHOTOS[f.uid]=f.photo;return {id:idOf(f.uid),name:f.name}});
}
function invite(){
  const F=G,sent=invLoad();
  /* мои ещё не принятые приглашения: не в группе и письмо у друга ещё лежит */
  let pend=DEMO?null:((sent[F.code]||[]).filter(id=>!F.members.some(m=>m.id===id)));
  const pending=()=>DEMO?F.members.filter(m=>m.st==="inv").map(m=>m.id):pend;
  const free=()=>{G=F;return MAX()-F.members.filter(m=>m.st!=="inv").length-pending().length};
  const saveSent=()=>{sent[F.code]=pend.slice();invSave(sent)};
  sheet("Позвать друзей",`
    <p class="rghint" data-free></p>
    <div class="rglbl">Друзья в «В Слове»</div>
    <div class="rgpick" data-list></div>
    <div class="rglbl">Или отправьте ссылку</div>
    <button class="rgbtn sec" type="button" data-copy>🔗 Скопировать ссылку на группу</button>
    ${!DEMO&&navigator.share?`<button class="rgbtn sec" type="button" data-share>📤 Отправить через…</button>`:""}
    <p class="rghint">Друг откроет ссылку, нажмёт «Присоединиться» — и чтение группы появится у него в приложении «В Слове».</p>
    <button class="rgbtn" type="button" data-done>Готово</button>`,(el,close)=>{
    const draw=()=>{G=F;const fr_=free(),P=pending();
      el.querySelector("[data-free]").textContent=(fr_>0?`Свободно ${fr_} ${pl(fr_,"место","места","мест")} из ${MAX()-1}.`:fr_<0?`Приглашений больше, чем мест — отзовите лишние.`:P.length?`Все места разобраны приглашениями. Отзовите приглашение, чтобы позвать другого.`:`Все места заняты — в группе ${MAX()} ${pl(MAX(),"человек","человека","человек")}.`)
        +(P.length?` Ждём ответа: ${P.length}.`:"");
      const fr=ogFriends(),L=el.querySelector("[data-list]");
      if(!fr.length){L.innerHTML=`<p class="rghint">Пока нет друзей в приложении «В Слове». Добавьте их во вкладке «Друзья» — и они появятся здесь.</p>`;return}
      L.innerHTML=fr.map(f=>{const m=F.members.find(x=>x.id===f.id&&x.st==="in"),was=P.includes(f.id);
        const b=m?`<span class="rgok">в группе</span>`:was?`<span class="rgwait">приглашён</span><button class="rgre" type="button" data-un="${esc(f.id)}">Отозвать</button>`:(fr_>0?`<button class="rgre" type="button" data-inv="${esc(f.id)}">Пригласить</button>`:`<span class="rgok" style="color:var(--muted)">нет мест</span>`);
        return `<div class="rgli2">${av(f.id)}<span>${esc(who(f.id).name)}</span>${b}</div>`}).join("");
    };
    draw();
    /* проверить, какие приглашения ещё ждут (друг мог отказаться или уже вступить) */
    if(!DEMO&&pend.length&&NET&&NET.invAlive)Promise.all(pend.map(id=>NET.invAlive(uidOf(id),F.code).catch(()=>true))).then(r=>{pend=pend.filter((id,i)=>r[i]);saveSent();if(el.isConnected)draw()});
    el.addEventListener("click",e=>{
      const i=e.target.closest("[data-inv]"),u=e.target.closest("[data-un]");G=F;
      if(i&&free()>0){const id=i.dataset.inv;
        if(!DEMO){i.disabled=true;i.textContent="…";
          NET.invite(uidOf(id),F.code,F.name).then(()=>{if(!pend.includes(id))pend.push(id);saveSent();draw();try{O().toast(`${who(id).name} увидит приглашение в приложении «В Слове»`)}catch(_){}})
            .catch(err=>{console.warn(err);i.disabled=false;i.textContent="Пригласить";O().toast("Не удалось отправить приглашение. Проверьте интернет.")});return}
        F.members.push({id,st:"inv",read:DEMO_READ[id],react:{fire:[],pray:[]}});store();draw();render();
        /* демо: друг принимает через 6 с (если приглашение не отозвали) */
        setTimeout(()=>{const m=F.members.find(x=>x.id===id);if(m&&m.st==="inv"){m.st="in";store();render();if(el.isConnected)draw();try{O().toast(`🔥 ${who(id).name} теперь в вашей группе`)}catch(e){}}},6000+Math.random()*2500);return}
      if(u){const id=u.dataset.un;
        if(DEMO){F.members=F.members.filter(x=>!(x.id===id&&x.st==="inv"));store();draw();render();try{O().toast(`Приглашение ${who(id).name} отозвано`)}catch(_){}return}
        u.disabled=true;u.textContent="…";
        NET.revoke(uidOf(id),F.code).then(()=>{pend=pend.filter(x=>x!==id);saveSent();draw();try{O().toast(`Приглашение ${who(id).name} отозвано`)}catch(_){}})
          .catch(err=>{console.warn(err);u.disabled=false;u.textContent="Отозвать";O().toast("Не удалось отозвать. Проверьте интернет.")})}
    });
    const url=location.origin+location.pathname+"?group="+F.code, gname=F.name;
    el.querySelector("[data-copy]").onclick=e=>{try{navigator.clipboard.writeText(url).catch(()=>{})}catch(_){}e.target.textContent="✓ Ссылка скопирована"};
    const sh=el.querySelector("[data-share]");if(sh)sh.onclick=()=>{try{navigator.share({title:"В Слове · "+gname,text:"Читаем Библию вместе в жизненной группе «"+gname+"». Присоединяйся:",url}).catch(()=>{})}catch(_){}};
    el.querySelector("[data-done]").onclick=close;
  });
}
/* --- создать / настроить костёр (один экран, шаги) --- */
function setup(edit){
  if(edit&&G&&G.owner!=="me")return O().toast("Менять группу может только тот, кто её создал");
  const E=edit?G:null;
  let size=E?E.size||4:4, kind=E&&E.plan&&E.plan.kind!=="church"?E.plan.kind:"", defs={bible:null,ms:null};
  let bname=E?E.name:"";
  if(E&&E.plan&&E.plan.def)defs[E.plan.kind]=E.plan.def;
  const minSize=E?E.members.length:1;
  let meet=E&&E.meet?{days:(E.meet.days||[]).slice(),time:E.meet.time||"21:00"}:null;
  let link=E&&E.link||"";
  const msName=d=>{const t=d&&bookInfo(d.ms);return t?t.t:"Книга служения"};
  sheet(edit?"Настроить группу":"Новая жизненная группа",`
    <div class="rglbl">Что читаем</div>
    <div class="rgkind two">${[["bible","Библия"],["ms","Книга служения"]].map(([k,t])=>`<button type="button" data-k="${k}" class="${kind===k?"on":""}">${t}</button>`).join("")}</div>
    <div data-what></div>
    <div class="rglbl">Сколько человек</div>
    <div class="rgpace rgsize">${[2,4,6].map(n=>`<button type="button" data-sz="${n}" class="${size===n?"on":""}" ${n<minSize?"disabled":""}>${n}</button>`).join("")}</div>
    ${DEMO?"":`<div class="rglbl">Звонок в Zoom</div>
    <div class="rgbox"><input class="rginput" id="rgLink" inputmode="url" placeholder="https://zoom.us/j/…" value="${esc(link)}">
      <div class="rgtips">
        <p>Чтобы ссылка была вечной:</p>
        <ol><li>Откройте приложение Zoom.</li>
        <li>Начните новую конференцию — галочка <b>«Использовать идентификатор персональной конференции»</b> должна стоять. Скопируйте ссылку приглашения и вставьте сюда.</li>
        <li>Когда заканчиваете, нажимайте <b>«Выйти из конференции»</b>, а не «Завершить конференцию для всех».</li></ol>
        <a href="https://zoom.us/profile" target="_blank" rel="noopener">Моя ссылка в Zoom ›</a></div></div>`}
    <div class="rglbl">Общение <span style="font-weight:500;color:var(--muted)">— по желанию</span></div>
    <div data-meet></div>
    <button class="rgbtn" type="button" data-make>${edit?"Сохранить":"Создать группу"}</button>
    ${edit?"":`<p class="rghint" style="text-align:center">Потом вы отправите друзьям ссылку — они просто присоединятся.</p>`}`,(el,close)=>{
    const modal=el.closest(".rgmodal"), W=el.querySelector("[data-what]"), mk=el.querySelector("[data-make]");
    el.querySelectorAll("[data-sz]").forEach(b=>b.onclick=()=>{size=+b.dataset.sz;el.querySelectorAll("[data-sz]").forEach(x=>x.classList.toggle("on",x===b))});
    const MX=el.querySelector("[data-meet]");
    const drawMeet=()=>{
      if(!meet){MX.innerHTML=`<button class="rgopt" type="button" data-mon><span>🗓</span><span><b>Общаться в определённое время</b><small>Например, по вторникам и четвергам в 21:00 — всем придёт напоминание</small></span><em>＋</em></button>`;return}
      MX.innerHTML=`<div class="rgbox"><div class="rgdays">${DOWN.map((d,i)=>`<button type="button" data-d="${i}" class="${meet.days.includes(i)?"on":""}">${d}</button>`).join("")}</div>
        <label class="rgtime">Во сколько <input type="time" id="rgMeetTime" value="${esc(meet.time)}"></label>
        <p class="rghint">За 10 минут всем в группе придёт напоминание, а на карточке появится «📞 Общение сейчас».</p>
        <button class="rglink" type="button" data-moff>Без общения по расписанию</button></div>`;
      MX.querySelector("#rgMeetTime").onchange=e=>{meet.time=e.target.value||"21:00"}};
    drawMeet();
    MX.addEventListener("click",e=>{
      if(e.target.closest("[data-mon]")){meet={days:[1,3],time:"21:00"};drawMeet();return}
      if(e.target.closest("[data-moff]")){meet=null;drawMeet();return}
      const d=e.target.closest("[data-d]");if(d){const i=+d.dataset.d;meet.days=meet.days.includes(i)?meet.days.filter(x=>x!==i):meet.days.concat(i);d.classList.toggle("on")}});
    /* книги выбираются в тех же окнах, что и «Своё расписание» / «Книга служения» */
    const openEd=k=>{if(!window.ogOpenEditor)return;modal.style.display="none";
      const back=()=>{modal.style.display=""};
      window.ogOpenEditor(k,defs[k],d=>{defs[k]=d;kind=k;back();draw()},back)};
    el.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{kind=b.dataset.k;draw();if(!defs[kind])openEd(kind)});
    function draw(){
      el.querySelectorAll("[data-k]").forEach(x=>x.classList.toggle("on",x.dataset.k===kind));
      if(!kind){W.innerHTML=`<p class="rghint">Выберите книги Библии или книгу служения — так же, как в своём расписании.</p>`;mk.disabled=true;return}
      const d=defs[kind];
      if(!d){W.innerHTML=`<button class="rgopt" type="button" data-ed><span>${kind==="ms"?"📖":"📜"}</span><span><b>${kind==="ms"?"Выбрать книгу служения":"Выбрать книги Библии"}</b><small>Откроется окно, как при создании расписания</small></span><em>›</em></button>`;mk.disabled=true;return}
      const p=window.ogPlanPreview?window.ogPlanPreview(d):null;
      const sel=`<div class="rgprev rgsel"><b>${esc(planDesc({kind,def:d}))}</b>${p?`<span>${esc(p.sum)}</span><span>Первый день: ${esc(p.first)}</span>`:""}<button class="rgre" type="button" data-ed>Изменить</button></div>`;
      const nameBox=`<label class="rglbl" for="rgName">Название жизненной группы</label><div class="rgname" data-nbox><input class="rginput" id="rgName" maxlength="30" placeholder="Например: Братья с Петроградки" value="${esc(bname)}"><small data-nh>Придумайте сами — его увидят друзья. Что читаете, будет написано ниже названия.</small></div>`;
      W.innerHTML=sel+nameBox;mk.disabled=false;
      const nm=W.querySelector("#rgName");if(nm)nm.oninput=()=>{bname=nm.value;if(nm.value.trim()){W.querySelector("[data-nbox]").classList.remove("need");W.querySelector("[data-nh]").textContent="Придумайте сами — его увидят друзья. Что читаете, будет написано ниже названия."}};
    }
    draw();
    W.addEventListener("click",e=>{if(e.target.closest("[data-ed]"))openEd(kind)});
    mk.onclick=()=>{
      const li=el.querySelector("#rgLink");if(li){link=li.value.trim();if(link&&!/^https:\/\/\S+\.\S+/.test(link)){li.classList.add("bad");li.focus();O().toast("Вставьте ссылку целиком, начиная с https://");return}}
      let name;
      {name=(bname||"").trim();
        if(!name){const nbox=W.querySelector("[data-nbox]"),nh=W.querySelector("[data-nh]"),nm=W.querySelector("#rgName");nbox.classList.remove("need");void nbox.offsetWidth;nbox.classList.add("need");nh.textContent="👆 Напишите название группы";nm.focus();nbox.scrollIntoView({block:"center",behavior:"smooth"});return}}
      const code=E?E.code:"K"+Math.random().toString(36).slice(2,7).toUpperCase();
      const d=Object.assign({},defs[kind],{id:"fire-"+code,name,emb:"flame"});
      const plan={kind,def:d};
      if(edit){
        const strip=x=>x&&Object.assign({},x,{name:0,id:0,emb:0});
        const changed=G.plan.kind!==kind||JSON.stringify(strip(G.plan.def))!==JSON.stringify(strip(d));
        if(changed&&!mk.dataset.arm){mk.dataset.arm=1;mk.classList.add("warn");mk.textContent="Чтение начнётся заново у всех — нажмите ещё раз";return}
        if(changed&&G.plan.kind!=="church")try{window.ogPlanRemove(planId())}catch(_){}
        G.name=name;G.size=size;G.meet=meet&&meet.days.length?meet:null;G.link=link;if(changed)G.plan=plan;else if(G.plan.def)G.plan.def.name=name;
        put({name,size,meet:G.meet,link,plan:G.plan});
        try{window.ogPlanAdd(G.plan.def)}catch(_){}
        store();close();render();try{window.ogRefresh&&window.ogRefresh()}catch(_){}try{O().toast(changed?"Сохранено — у друзей тоже обновится":"Сохранено")}catch(e){}return}
      if(!DEMO){
        if(!NET){O().toast("Войдите через Google, чтобы создать жизненную группу");return}
        mk.disabled=true;mk.textContent="Создаём…";
        NET.create(Object.assign({name,size,meet:meet&&meet.days.length?meet:null,link,plan:{kind,def:Object.assign({},d,{id:""})},created:today()},(window.ogGender&&window.ogGender())?{g:window.ogGender()}:{})).then(code=>{
          const dd=Object.assign({},d,{id:"fire-"+code});NET.update(code,{"plan.def.id":dd.id}).catch(()=>{});
          try{window.ogPlanAdd(dd)}catch(_){}
          close();try{window.ogSetPage&&window.ogSetPage("home")}catch(e){}
          try{O().toast(`Группа «${name}» создана — теперь отправьте ссылку друзьям`)}catch(e){}
          const wait=(n)=>{const F=FIRES.find(f=>f.code===code);if(F){G=F;render();const c=$c.querySelector(`[data-fire="${code}"]`);if(c)c.scrollIntoView({block:"center",behavior:"smooth"});invite()}else if(n<20)setTimeout(()=>wait(n+1),250)};wait(0);
        }).catch(e=>{console.warn(e);mk.disabled=false;mk.textContent="Создать группу";O().toast("Не получилось создать группу. Проверьте интернет.")});
        return}
      G={name,owner:"me",plan,size,meet:meet&&meet.days.length?meet:null,code,created:today(),streak:0,made:true,members:[{id:"me",st:"in"}],inbox:[],cheered:{},cel:"",day:today(),myReact:{}};FIRES.push(G);
      try{window.ogPlanAdd(d)}catch(_){}
      store();close();render();try{window.ogRefresh&&window.ogRefresh()}catch(_){}try{window.ogSetPage&&window.ogSetPage("home")}catch(e){}
      try{O().toast(`Группа «${name}» создана — теперь отправьте ссылку друзьям`)}catch(e){}
      const F=G;setTimeout(()=>{G=F;const c=$c.querySelector(`[data-fire="${F.code}"]`)||$c;c.scrollIntoView({block:"center",behavior:"smooth"});invite()},500);
    };
  });
}
function menu(){
  const own=G.owner==="me";
  sheet(esc(G.name),`
    <p class="rghint">Читаем: ${esc(planDesc(G.plan))}</p>
    <div class="rglist">${G.members.map(m=>`<div class="rgli">${av(m.id,m.st==="inv"?"off":"")}<span><b>${esc(who(m.id).name)}</b>${m.id===G.owner?' <small style="color:var(--muted);font-weight:500">· создал(а) группу</small>':""}</span><small>${m.st==="inv"?"приглашён":readOf(m)?"сегодня ✓":"сегодня ещё нет"}</small></div>`).join("")}</div>
    ${own?`<button class="rgbtn" type="button" data-set>Настроить группу</button>`:""}
    ${own&&G.members.length<MAX()?`<button class="rgbtn sec" type="button" data-inv>Отправить ссылку друзьям</button>`:""}
    ${own?"":`<p class="rghint">Менять группу может только ${esc(who(G.owner).name)} — тот, кто её создал.</p>`}
    <button class="rgbtn sec" type="button" data-leave style="color:#c0392b">Выйти из группы</button>
    ${own?`<button class="rgbtn sec" type="button" data-del style="color:#c0392b">Удалить группу</button>`:""}`,(el,close)=>{
    const del=el.querySelector("[data-del]");if(del)del.onclick=()=>{
      if(!del.dataset.arm){del.dataset.arm=1;del.textContent="Удалить группу у всех участников? Нажмите ещё раз";return}
      const F=G;if(F.plan.kind!=="church")try{window.ogPlanRemove(planId())}catch(_){}
      if(!DEMO&&NET)NET.remove(F.code).catch(e=>{console.warn(e);O().toast("Не получилось удалить группу. Проверьте интернет.")});
      FIRES=FIRES.filter(f=>f!==F);G=FIRES[0]||null;store();close();render();try{window.ogRefresh&&window.ogRefresh()}catch(_){}
      try{O().toast("Группа «"+F.name+"» удалена")}catch(_){}};
    const on=(s,f)=>{const b=el.querySelector(s);if(b)b.onclick=f};
    on("[data-set]",()=>{close();setup(true)});
    on("[data-inv]",()=>{close();invite()});
    const lv=el.querySelector("[data-leave]");lv.onclick=()=>{if(!lv.dataset.arm){lv.dataset.arm=1;lv.textContent="Точно выйти? Прочитанное сохранится. Нажмите ещё раз";return}
      if(G.plan.kind!=="church")try{window.ogPlanRemove(planId())}catch(_){}
      if(!DEMO&&NET){const F=G;NET.leave(F.code,F._doc).catch(e=>{console.warn(e);O().toast("Не получилось выйти. Проверьте интернет.")})}
      FIRES=FIRES.filter(f=>f!==G);G=FIRES[0]||null;store();close();render();try{window.ogRefresh&&window.ogRefresh()}catch(_){}};
  });
}
function how(){}
/* --- присоединиться по ссылке: друг видит приглашение и одну кнопку --- */
function joinReal(code,inv){
  if(!NET)return;
  const drop=()=>{if(inv&&NET&&NET.dropInvite)NET.dropInvite(code)};
  NET.get(code).then(d=>{
    if(!d){if(inv){drop();return}O().toast("Группа не найдена — возможно, её удалили");return}
    if((d.members||[]).includes(MYUID)){if(inv){drop();return}O().toast("Вы уже в группе «"+d.name+"»");return}
    // новая группа только для своего пола (у старых смешанных групп поля g нет — туда можно)
    const mg=(window.ogGender&&window.ogGender())||"";
    if(d.g&&!mg){const again=()=>{window.removeEventListener("og-gender",again);setTimeout(()=>joinReal(code,inv),300)};window.addEventListener("og-gender",again);try{window.ogAskGender&&window.ogAskGender()}catch(e){}return}
    if(d.g&&d.g!==mg){drop();O().toast("Эта группа недоступна");return}
    Object.assign(NAMES,d.names||{});Object.assign(PHOTOS,d.photos||{});
    const full=(d.members||[]).length>=(d.size||4),k=G;G={plan:d.plan,code:d.code};const pv=d.plan&&d.plan.def&&window.ogPlanPreview?window.ogPlanPreview(Object.assign({},d.plan.def,{id:"fire-"+code})):null;G=k;
    sheet("Приглашение в жизненную группу",`
      <div class="rginvite">${campfire((d.members||[]).length,(d.size||4))}<h3>${esc(d.name)}</h3><p>${esc(inv&&inv.name?String(inv.name).split(" ")[0]:who(d.owner).name)} зовёт вас читать вместе</p></div>
      <div class="rgplan"><small>Читаем</small><b>${esc(planDesc(d.plan))}</b>${pv?`<small>${esc(pv.sum)}</small>`:""}</div>
      <div class="rgpeople2">${(d.members||[]).map(u=>`<div class="rgp">${av(u)}<span>${esc(who(u).name)}</span></div>`).join("")}</div>
      ${full?`<p class="rghint" style="text-align:center">В группе уже ${d.size} ${pl(d.size,"человек","человека","человек")} — мест нет.</p>`:`<button class="rgbtn" type="button" data-j>Присоединиться</button>`}
      ${inv?`<button class="rgbtn sec" type="button" data-no>Не сейчас</button>`:""}`,(el,close)=>{
      if(inv){const md=el.closest(".rgmodal");if(md)md.dataset.inv=code}
      const no=el.querySelector("[data-no]");if(no)no.onclick=()=>{drop();close()};
      if(full)drop();
      const b=el.querySelector("[data-j]");if(b)b.onclick=()=>{b.disabled=true;b.textContent="Присоединяемся…";
        NET.join(code).then(ok=>{if(!ok){b.textContent="Мест нет";drop();return}drop();
          if(d.plan&&d.plan.def)try{window.ogPlanAdd(Object.assign({},d.plan.def,{id:"fire-"+code}))}catch(_){}
          close();try{window.ogSetPage&&window.ogSetPage("home")}catch(e){}
          O().toast("Вы в группе «"+d.name+"» — чтение появилось на главной");
        }).catch(e=>{console.warn(e);b.disabled=false;b.textContent="Присоединиться";O().toast("Не получилось присоединиться. Проверьте интернет.")})}});
  }).catch(e=>{console.warn(e);O().toast("Не получилось открыть приглашение. Проверьте интернет.")});
}
function join(){
  const BB=window.ogBooks?window.ogBooks():{books:[]};
  const code="J7PX2A", def={id:"fire-"+code,custom:true,name:"Вечерний огонь",emb:"flame",start:today(),books:["Ин."],mode:"seq",by:"chapters",amount:1};
  const inv={name:"Вечерний огонь",owner:"tolya",plan:{kind:"bible",def},size:4,code,created:today(),streak:0,made:true,
    members:[{id:"tolya",st:"in",read:"07:12",react:{fire:[],pray:[]}},{id:"lada",st:"in",read:"08:40",react:{fire:["tolya"],pray:[]}}],inbox:[],cheered:{},cel:"",day:today(),myReact:{}};
  const pv=window.ogPlanPreview?window.ogPlanPreview(def):null;
  sheet("Приглашение в жизненную группу",`
    <div class="rginvite">${campfire(2,3)}<h3>${esc(inv.name)}</h3><p>${esc(who("tolya").name)} зовёт вас читать вместе</p></div>
    <div class="rgplan"><small>Читаем</small><b>${esc(planDesc(inv.plan))}</b>${pv?`<small>${esc(pv.sum)}</small>`:""}</div>
    <div class="rgpeople2">${inv.members.map(m=>`<div class="rgp">${av(m.id)}<span>${esc(who(m.id).name)}</span></div>`).join("")}<div class="rgp"><span class="rgseat" style="border-color:var(--flame);color:var(--flame)">Я</span><span>Вы</span></div><div class="rgp"><span class="rgseat">·</span><span style="color:var(--muted)">место</span></div></div>
    <button class="rgbtn" type="button" data-j>Присоединиться</button>`,(el,close)=>{el.querySelector("[data-j]").onclick=()=>{
      FIRES=FIRES.filter(f=>f.code!==inv.code);G=inv;G.members.push({id:"me",st:"in"});FIRES.push(G);try{window.ogPlanAdd(def)}catch(_){}store();close();render();try{window.ogRefresh&&window.ogRefresh()}catch(_){}try{window.ogSetPage&&window.ogSetPage("home")}catch(e){}
      setTimeout(()=>{const c=$c.querySelector(`[data-fire="${inv.code}"]`)||$c;c.scrollIntoView({block:"center",behavior:"smooth"})},300);try{O().toast("Вы в группе «Вечерний огонь» — чтение появилось на главной")}catch(e){}}});
}
function goRead(){
  /* к карточке этого чтения на главной (у своего расписания костра — название костра) */
  const want=G.name;let el=null;
  document.querySelectorAll("#app .xcard, #app .card").forEach(c=>{if(!el&&!c.closest("#groupCard")&&!c.hidden&&want&&c.textContent.includes(want))el=c});
  (el||document.getElementById("testaments")||$c).scrollIntoView({behavior:"smooth",block:"center"});
}
/* ---------- праздник: прочитали все ---------- */
let celWait=null;
function overlayOpen(){const c=document.getElementById("celebrate"),ch=document.getElementById("chest");
  return (c&&!c.hidden)||(ch&&!ch.hidden)||!!document.querySelector(".fmodal,.bkcel,.celov,.rgmodal,.rgcel")}
function maybeCelebrate(all,streak){
  if(!all||G.cel===today())return;
  clearInterval(celWait);
  const F=G;let t0=Date.now();celWait=setInterval(()=>{if(Date.now()-t0<2600||overlayOpen())return;clearInterval(celWait);if(F.cel===today())return;F.cel=today();store();const k=G;G=F;celebrate(streak);G=k},700);
}
function celebrate(streak){
  const J=joined(),d=document.createElement("div");d.className="rgcel";
  d.innerHTML=`<div>${campfire(J.length,J.length,1)}<h2>Сегодня прочитали все!</h2>
    <p>${esc(G.name)}: ${streak} ${pl(streak,"день","дня","дней")} вместе</p>
    <div class="rgcp">${J.map((m,i)=>av(m.id).replace('style="','style="animation-delay:'+(0.15+i*.15)+'s;')).join("")}</div>
    <button class="rgbtn" type="button">Отлично! 🎉</button></div>`;
  document.body.appendChild(d);
  try{const r=d.querySelector("svg").getBoundingClientRect();O().burst(r.left+r.width/2,r.top+r.height/2,40)}catch(e){}
  try{O().vibrate&&O().vibrate([30,40,60])}catch(e){}
  d.querySelector("button").onclick=()=>d.remove();
}
/* ---------- события ---------- */
$c.addEventListener("click",e=>{
  const card=e.target.closest("[data-fire]");if(!card||!pick(card.dataset.fire))return;
  const pp=e.target.closest("[data-p]");if(pp){const id=pp.dataset.p,m=G.members.find(x=>x.id===id);
    if(id==="me"){if(!readOf(m))goRead();else if(!myNote()&&G.plan.kind!=="ms")try{window.ogAskVerse()}catch(_){};return}
    if(!readOf(m)){if(G.cheered[id])return O().toast("Вы уже подбодрили сегодня");return cheer(id)}
    return O().toast(`${who(id).name} ${/а$|я$/.test(who(id).name)?"прочитала":"прочитал"} сегодня в ${readOf(m)}`)}
  const b=e.target.closest("[data-cheer],[data-go],[data-re]");if(!b)return;
  if(b.dataset.cheer)return cheer(b.dataset.cheer);
  if(b.dataset.re){const id=b.dataset.id,k=b.dataset.re;G.myReact[id]=G.myReact[id]||{};G.myReact[id][k]=!G.myReact[id][k];store();render();return}
  const g=b.dataset.go;
  if(g==="read")return goRead();
  if(g==="mark")return markRead();
  if(g==="next")return markNext();
  if(g==="undo")return undoRead();
  if(g==="verse"){try{(window.ogAskVerse||function(){})()}catch(_){};return}
  if(g==="menu")return menu();
  if(g==="new")return setup(false);
  if(g==="addbook")return setup(true);
  if(g==="invite")return G.owner==="me"?invite():O().toast("Позвать друзей может тот, кто создал группу");
  if(g==="call"){if(inCall()){e.preventDefault();return callSheet()}return startCall()}
  if(g==="join")return join();
});
/* вход из вкладки «Расписания» */
window.ogFireList=()=>FIRES.map(f=>{G=f;return {code:f.code,name:f.name,n:joined().length,inv:invited().length,size:MAX(),own:f.owner==="me",what:planDesc(f.plan)}});
window.ogFireMenu=code=>{if(pick(code))menu()};
window.ogFireNew=()=>{if(!DEMO&&!NET){O().toast("Войдите через Google (кнопка вверху), чтобы создать жизненную группу");const b=document.getElementById("loginTop");if(b&&!b.hidden)b.click();return}setup(false)};
window.ogFireInfo=()=>FIRES.length?{n:FIRES.length}:null;
window.ogFireSettings=()=>setup(false);
window.ogFireOpen=()=>setup(false);
let wasRead=null;
/* сеть: auth.js после входа отдаёт net, при выходе — null */
let seenCall={};
window.ogGroupsNet=function(net,joinCode){
  if(DEMO)return;
  if(NET&&NET.stop)try{NET.stop()}catch(e){}
  NET=net;MYUID=net?net.uid:null;FIRES=[];G=null;
  if(!net){render();try{window.ogRefresh&&window.ogRefresh()}catch(e){}return}
  NAMES[net.uid]=net.name();PHOTOS[net.uid]=net.photo||"";
  NET.stop=net.watchMine(docs=>{
    const keep=G&&G.code,was=FIRES.map(f=>({code:f.code,name:f.name}));FIRES=docs.map(fromDoc);
    /* группу удалил создатель (или меня в ней больше нет) — убрать её чтение */
    was.forEach(w=>{if(!docs.some(d=>d.code===w.code)){try{window.ogPlanRemove("fire-"+w.code)}catch(e){}}});G=FIRES.find(f=>f.code===keep)||FIRES[0]||null;
    /* расписание группы у меня — такое же, как у создателя */
    FIRES.forEach(f=>{const id="fire-"+f.code;
      if(f.plan&&f.plan.def&&f.plan.kind!=="church"){const want=Object.assign({},f.plan.def,{id});try{window.ogPlanAdd(want)}catch(e){}}
      else try{window.ogPlanRemove(id)}catch(e){}
      /* мне звонят */
      const L=f.live;if(L&&L.by!=="me"&&!L.in.includes("me")&&!seenCall[f.code+L.t]&&Date.now()-L.t<10*6e4){seenCall[f.code+L.t]=1;incoming(f,L.by)}});
    FIRES.forEach(f=>syncRead(f));
    render();try{window.ogRefresh&&window.ogRefresh()}catch(e){}
  });
  if(joinCode)setTimeout(()=>joinReal(joinCode),600);
  /* приглашения от друзей из «В Слове» */
  if(net.watchInv){const shown={};net.watchInv(list=>{
    /* приглашение отозвали — закрыть его окно, если открыто */
    const have=new Set(list.map(i=>i&&i.group));Object.keys(shown).forEach(c=>{if(!have.has(c)){delete shown[c];document.querySelectorAll(`.rgmodal[data-inv="${c}"]`).forEach(m=>m.remove())}});
    list.forEach(i=>{if(!i||!i.group||shown[i.group])return;shown[i.group]=1;
    const go=n=>{if(document.querySelector(".rgmodal,.fmodal")&&n<40)return setTimeout(()=>go(n+1),1500);joinReal(i.group,i)};setTimeout(()=>go(0),900)})})}
};
window.ogGroupRender=function(){
  /* время своей отметки — для каждого костра своё */
  const keep=G;FIRES.forEach(f=>{G=f;const any=planToday().any;if(any&&!f.myTime)f.myTime=hm();if(!any)f.myTime=null;syncRead(f)});G=keep;store();render()};
load();if(DEMO&&location.hash.indexOf("call")>=0)setTimeout(demoRing,1800);if(DEMO&&location.hash.indexOf("join")>=0)setTimeout(()=>{if(!FIRES.some(f=>f.code==="J7PX2A"))join()},900);render();
})();
