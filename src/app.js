(function(){
const {PLAN_SPB,BOOKS,BOOK,STORE_KEY,SECTIONS,SECCOL,ALLSEC,OTSEC,NTSEC,TEMPLATES,SPB_START,sd,refOfSpan,splitBooks,chapParts,readingDates,countDates,buildSched}=window.OgonekBibleSchedule;
const {ICO,EMBLEMS}=window.OgonekIcons;
const icoEl=k=>{const s=el("span","ico");s.innerHTML=ICO[k]||"";return s};
// выбор эмблемы своего расписания
function embPicker(get,set){const w=el("div","embs");w.setAttribute("role","radiogroup");w.setAttribute("aria-label","Значок");
  const draw=()=>{w.textContent="";EMBLEMS.forEach(k=>{const b=el("button","emb"+(get()===k?" on":""));b.type="button";b.setAttribute("role","radio");b.setAttribute("aria-checked",String(get()===k));b.append(icoEl(k));b.addEventListener("click",()=>{set(k);draw()});w.append(b)})};draw();return w}
function myEmb(d){return d&&d.emb&&ICO[d.emb]?d.emb:"book"}
const {iso,parse,add,today,dayNo,plural,daysWord}=window.OgonekDates;
const {fixAbbr}=window.OgonekStateSchema;
const SCHED=(()=>{let s=null;try{s=fixAbbr(JSON.parse(localStorage.getItem(STORE_KEY)))}catch(e){}
  try{return buildSched(s&&s.schedDef)}catch(e){console.warn(e);return buildSched({id:"spb"})}})();

/* Вопросы по тексту: день плана церкви → {nt:[вопрос, верный, неверный, неверный], ot:[...]}; в своих расписаниях их нет */
const QUIZ=SCHED.spb&&window.QUIZ_D||{}; // данные вопросов — в data.js
const QUIZ2=SCHED.spb&&window.QUIZ2_D||{};
var QCH=window.QCH||{}; // «В какой главе…» — в data.js
const XP_QUIZ=5;
const PLAN=SCHED.plan;
const DAYS=PLAN.length;
const FULL=Object.fromEntries(BOOKS.map(b=>[b.a,b.n]));
/* Адреса глав на bible.recoveryversion.ru: https://bible.recoveryversion.ru/<код>/<глава>.
   «gen» и «matt» подтверждены; остальные — по сокращениям Восстановительного перевода, поправьте здесь, если какой-то не открывается. */
const SLUG=Object.fromEntries(BOOKS.map(b=>[b.a,b.u]));
const BIBLE="https://bible.recoveryversion.ru/";
const WEEKDAYS=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const T={nt:{label:SCHED.labels.nt,short:SCHED.short.nt,bi:0,ri:1},ot:{label:SCHED.labels.ot,short:SCHED.short.ot,bi:2,ri:3}};
const KEYS=SCHED.keys;
const XP_PART=10, XP_BOTH=10, XP_ANSWER=15;
function part(k,p){const d=PLAN[Math.min(p,DAYS-1)];return {book:d[T[k].bi],ref:d[T[k].ri],url:d[4],title:d[5]}}
function refStr(x){return x.book+" "+x.ref}
function chapterUrl(x){ // открывает с первого стиха отрывка: /matt/1/3
  if(x.url)return x.url; // книга служения — страница на ministrybooks.online
  const m=/^(\d+)(?::(\d+))?/.exec(x.ref)||[], ch=m[1]||1, v=m[2]||1;
  return SLUG[x.book]?BIBLE+SLUG[x.book]+"/"+ch+"/"+v:BIBLE;
}
const PLAN_START=SCHED.start;
// дни чтения: каждый день или только выбранные дни недели
const WD=SCHED.wd, SDATES=SCHED.dates;
const planDate=p=>!WD?sd.add(PLAN_START,p):p<SDATES.length?SDATES[Math.max(0,p)]:sd.add(SDATES[SDATES.length-1],Math.ceil((p-SDATES.length+1)*7/WD.filter(Boolean).length));
function datesBefore(d){if(!WD)return Math.round((sd.parse(d)-sd.parse(PLAN_START))/864e5);let lo=0,hi=SDATES.length;while(lo<hi){const m=(lo+hi)>>1;if(SDATES[m]<d)lo=m+1;else hi=m}return d>SDATES[SDATES.length-1]?SDATES.length+Math.floor(Math.round((sd.parse(d)-sd.parse(SDATES[SDATES.length-1]))/864e5-1)*WD.filter(Boolean).length/7):lo}
const todayP=()=>datesBefore(iso(new Date()));
// сколько отрывков должно быть прочитано к концу дня d
const dueBy=d=>Math.max(0,Math.min(DAYS,datesBefore(sd.add(d,1))));
const isOffDay=d=>!!WD&&!WD[sd.dow(d)];
function shortDay(p){return ruFmt(planDate(p),1)}
function dayLabel(p){return ruFmt(planDate(p),2)}
function startDay(k,book){return PLAN.findIndex(d=>d[T[k].bi]===book)}
const BOOKSTARTS=[];KEYS.forEach(k=>PLAN.forEach((d,i)=>{if(!i||PLAN[i-1][T[k].bi]!==d[T[k].bi])BOOKSTARTS.push({i,k,book:d[T[k].bi]})}));

const QUESTIONS=["Что в сегодняшнем чтении больше всего коснулось вас?","Что этот отрывок открывает о Боге?","Какой стих вы хотели бы запомнить сегодня? Почему?","Есть ли здесь обещание, которое можно взять для себя?","Что вы узнали о человеке и его отношениях с Богом?","За что из прочитанного можно поблагодарить Господа?","Какой вопрос возник у вас при чтении?","Есть ли в отрывке пример, которому стоит последовать?","Как прочитанное связано с вашим сегодняшним днём?","Как связаны сегодняшние отрывки из Нового и Ветхого Завета?","О чём вы хотите помолиться после этого чтения?","Что в тексте показывает Христа?","Чему этот отрывок учит о жизни церкви?","Какую одну мысль вы расскажете сегодня другому человеку?"];

/* ---------- dates ---------- */

/* ---------- state ---------- */
const KEY=STORE_KEY;
const {fresh,migrate}=window.OgonekStateSchema.create(KEYS);
function score(s){s=migrate(s);return confScore(s)+s.nt.read.length+s.ot.read.length+Object.values(s.plans||{}).reduce((a,x)=>a+((x.nt&&x.nt.read)||[]).length+((x.ot&&x.ot.read)||[]).length,0)+Object.keys(s.answers).length+Object.keys(s.quiz||{}).length+((s.gems&&s.gems.used)||[]).length}
const readSet=k=>new Set(state[k].read);
function nextP(k){const r=readSet(k);let p=0;while(p<DAYS&&r.has(p))p++;return p}
let state=fresh();
try{state=migrate(JSON.parse(localStorage.getItem(KEY)||"null"))}catch(e){}
let remoteSave=null;
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}
  const p=remoteSave?remoteSave(JSON.parse(JSON.stringify(state))):null;
  if(window.Ogonek&&window.Ogonek.onSave)try{window.Ogonek.onSave()}catch(e){}
  if(window.ogGroupRender)try{window.ogGroupRender()}catch(e){}
  return p;
}

const datesOf=k=>new Set(state[k].log.map(x=>x.d));
// завет «участвует» в дне, если в расписании на этот день есть его отрывок (в своём расписании может быть только один завет)
function keyHasPart(k,d){const i=planIdx(d);return i<0||!!part(k,Math.max(0,Math.min(i,DAYS-1))).book}
function activeKeys(){const t=today();return KEYS.filter(k=>datesOf(k).has(t)||keyHasPart(k,t))}
function bothSet(){const sets=KEYS.map(datesOf),all=new Set(sets.flatMap(x=>[...x]));return new Set([...all].filter(d=>KEYS.every((k,i)=>sets[i].has(d)||!keyHasPart(k,d))))}
/* Пропущенный день «закрывается» лишним прочитанным отрывком (сверх одного в день), но только в течение 7 дней
   и если подряд пропущено не больше 7 дней. Иначе серия начинается заново (рекорд сохраняется). */
const REPAIR_WIN=7,REPAIR_MAX=7;
let _rpK="",_rpV=new Set();
function repaidDays(){
  const cnt={};const addLog=lg=>{const c={};(lg||[]).forEach(x=>{c[x.d]=(c[x.d]||0)+1});for(const d in c)cnt[d]=Math.max(cnt[d]||0,c[d])};
  KEYS.forEach(k=>addLog(state[k].log));
  try{Object.values(state.plans||{}).forEach(p=>["nt","ot"].forEach(k=>p&&p[k]&&addLog(p[k].log)))}catch(e){}
  const t=today(),key=t+"|"+JSON.stringify(cnt)+"|"+(state.frzDays||[]).length+"|"+(state.hist||[]).length;if(key===_rpK)return _rpV;
  const lit=new Set(Object.keys(cnt).concat(state.hist||[])),days=[...lit].sort();const paid=new Set();
  if(days.length){const base=new Set(state.frzDays||[]);let q=[],run=[],dead=false,d=days[0];
    while(d<=t){
      const miss=!lit.has(d)&&d<t&&!base.has(d)&&!(WD&&isOffDay(d));
      if(miss){run.push(d);if(run.length>REPAIR_MAX){dead=true;q=q.filter(x=>!run.includes(x))}else if(!dead)q.push(d)}
      else if(!base.has(d)&&!(WD&&isOffDay(d))){run=[];dead=false}
      if(lit.has(d)){const dn=dayNo(d);q=q.filter(x=>dn-dayNo(x)<=REPAIR_WIN);let extra=(cnt[d]||1)-1;while(extra>0&&q.length){paid.add(q.pop());extra--}}
      d=add(d,1)}}
  _rpK=key;_rpV=paid;return paid}
// сколько пропущенных дней перед текущей серией ещё не закрыто (до 60 дней назад)
function streakGap(){const s=withFrozen(anySet()),t=today();let cur=s.has(t)?t:add(t,-1),after=0;
  while(s.has(cur)){after++;cur=add(cur,-1)}
  const gap=[];while(!s.has(cur)&&gap.length<60){gap.push(cur);cur=add(cur,-1)}
  if(!gap.length||!s.has(cur))return null;
  let before=0;while(s.has(cur)){before++;cur=add(cur,-1)}
  gap.reverse();const due=add(gap[0],REPAIR_WIN),ok=gap.length<=REPAIR_MAX&&due>=t;
  return {gap,after,before,todayRead:s.has(t),ok,due}}
function withFrozen(set){const s=new Set(set);state.frzDays.forEach(d=>s.add(d));try{repaidDays().forEach(d=>s.add(d))}catch(e){}
  if(WD){let d=PLAN_START<today()?PLAN_START:today();const t=today();while(d<=t){if(isOffDay(d))s.add(d);d=add(d,1)}} // выходные дни расписания не прерывают серию
  return s}
function streakOf(set){let cur=today();if(!set.has(cur))cur=add(cur,-1);let n=0;while(set.has(cur)){n++;cur=add(cur,-1)}return n}
// серия дней растёт, если в день прочитан хотя бы один завет (горит хотя бы маленький огонёк)
function anySet(){const s=new Set(KEYS.flatMap(k=>[...datesOf(k)]).concat(state.hist||[]));
  try{Object.values(state.plans||{}).forEach(p=>["nt","ot"].forEach(k=>((p&&p[k]&&p[k].log)||[]).forEach(x=>s.add(x.d))));((state.conf&&state.conf.log)||[]).forEach(x=>s.add(x.d))}catch(e){}
  return s}
const streak=k=>streakOf(withFrozen(k?datesOf(k):anySet()));
/* заморозки = на сколько дней вы впереди плана (по обоим заветам).
   Пропущенный день сохраняет серию, если к концу этого дня оба завета были прочитаны по плану включительно. */
/* заморозки = на сколько дней вы впереди плана (по обоим заветам).
   Пропущенный день сохраняет серию, если к концу этого дня оба завета были прочитаны по плану включительно. */
const planIdx=d=>dueBy(d)-1;
function readBy(k,d){return state[k].log.filter(x=>x.d<=d).length}
function freezesNow(){const t=today(),tp=Math.max(0,todayP());
  // сегодняшний отрывок считается «должным», только когда вы уже читали сегодня — так число не прыгает в течение дня
  return Math.max(0,Math.min(...KEYS.map(k=>state[k].log.length-Math.min(DAYS,tp+(datesOf(k).has(t)?1:0)))))}
function coveredDay(d){const due=Math.min(DAYS,planIdx(d)+1);return due>0&&KEYS.every(k=>readBy(k,d)>=due)}
function applyFreezes(){
  const s=withFrozen(anySet());if(!s.size)return 0;
  const last=[...s].sort().pop(), y=add(today(),-1);
  if(last>=y)return 0;
  const gap=[];let d=add(last,1);while(d<=y){gap.push(d);d=add(d,1)}
  if(gap.every(coveredDay)){state.frzDays.push(...gap);save();return gap.length}
  return 0;
}
function level(xp){let k=1;while(xp>=50*k*(k+1))k++;const lo=50*(k-1)*k,hi=50*k*(k+1);return {k,pct:(xp-lo)/(hi-lo)*100}}

/* (awards are defined after the reaction helpers below) */

/* ---------- render ---------- */
const $=id=>document.getElementById(id);
const {FLAME,reduceMotion,vibrate,burst,ignite}=window.OgonekProgressVisual;
const {iceSound,fireSound}=window.OgonekSounds;
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}

const ahead={nt:false,ot:false}; // «следующий отрывок» открыт, но ещё не отмечен
function renderTestament(k){
  const t=today(), st=state[k], np=nextP(k);
  if(np>=DAYS)ahead[k]=false;
  const isAhead=ahead[k], doneToday=datesOf(k).has(t), s=streak(k);
  const todays=st.log.filter(x=>x.d===t);
  const lit=doneToday&&!isAhead;
  const viewP=(doneToday&&!isAhead)?todays[todays.length-1].p:Math.min(np,DAYS-1);
  const x=part(k,viewP);
  const card=el("div","tcard");
  const head=el("div","thead");
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 64 80");svg.setAttribute("class","flame"+(lit?"":" off"));svg.id="flame-"+k;svg.innerHTML=FLAME;
  const hb=el("div");hb.className="tht";hb.append(el("b",null,T[k].label)); // одна общая серия — в огоньке наверху, у заветов отдельной нет
  // огонёк за каждый прочитанный сегодня отрывок
  if(todays.length){
    const mm=el("div","minis");mm.id="minis-"+k;mm.title="Отрывков прочитано сегодня: "+todays.length;
    todays.slice(-8).forEach(()=>{const f=document.createElementNS("http://www.w3.org/2000/svg","svg");f.setAttribute("viewBox","0 0 64 80");f.setAttribute("class","flame mini");f.innerHTML=FLAME;mm.append(f)});
    if(todays.length>8)mm.append(el("span","minimore","+"+(todays.length-8)));
    hb.append(mm);
  }
  head.append(svg,hb);try{if(x&&x.book)head.append(verseBtn(k,viewP,x))}catch(e){}
  // слева — сегодняшний отрывок, справа — следующий
  const cols=el("div","tcols"), left=el("div","tcol"), right=el("div","tcol");
  const a=el("a","tlink");a.href=chapterUrl(x);a.target="_blank";a.rel="noopener";
  const tp=todayP(), lab=lit?"Прочитано сегодня":viewP===tp?"Сегодня":viewP<tp?"Догнать":"Заранее";
  a.append(el("span","label",lab),el("span","name",refStr(x)),el("span","sub",dayLabel(viewP)));
  const btn=el("button","tbtn");btn.type="button";
  if(np>=DAYS&&!doneToday){btn.textContent="Завет пройден!";btn.classList.add("done");btn.disabled=true}
  else if(doneToday&&!isAhead){btn.textContent="Прочитано ✓";btn.classList.add("done");btn.disabled=true}
  else{btn.textContent="Прочитал(а)";if(!doneToday)btn.classList.add("nudge");confirmTap(btn,"Нажмите ещё раз",()=>complete(k))} // огонёк ещё не горит — кнопка мигает
  left.append(a,btn);
  if(lit){const u=el("button","linkbtn undolink","Отменить");u.type="button";u.addEventListener("click",()=>undoMark(k,viewP));left.append(u)}
  if(lit&&np<DAYS){
    const nx=part(k,np), box=el("div","nextbox");
    const a2=el("a","nextlink");a2.href=chapterUrl(nx);a2.target="_blank";a2.rel="noopener";
    a2.append(el("span","label","Следующий"),el("span","name",refStr(nx)),el("span","sub",dayLabel(np)));
    const b2=el("button","tbtn nextmark");b2.type="button";
    b2.innerHTML='<svg viewBox="0 0 64 80" aria-hidden="true">'+FLAME+'</svg>';
    b2.append(document.createTextNode("Прочитал(а)"));
    confirmTap(b2,"Нажмите ещё раз",()=>{ahead[k]=true;complete(k,np)});
    const fh=el("span","frzhint");fh.innerHTML='<svg class="snow" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5v19M8.8 4.6L12 7.2l3.2-2.6M8.8 19.4l3.2-2.6 3.2 2.6"/><g transform="rotate(60 12 12)"><path d="M12 2.5v19M8.8 4.6L12 7.2l3.2-2.6M8.8 19.4l3.2-2.6 3.2 2.6"/></g><g transform="rotate(120 12 12)"><path d="M12 2.5v19M8.8 4.6L12 7.2l3.2-2.6M8.8 19.4l3.2-2.6 3.2 2.6"/></g><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></g></svg>';fh.append(document.createTextNode("+1 заморозка"));fh.title="Прочитайте отрывки следующего дня в обоих заветах — получите заморозку";
    box.append(a2,b2,fh);right.append(box);
  }else if(!lit&&np+1<DAYS&&part(k,np+1).ref){
    const nx=part(k,np+1), a3=el("a","nextlink later");a3.href=chapterUrl(nx);a3.target="_blank";a3.rel="noopener";
    a3.append(el("span","label","Потом"),el("span","name",refStr(nx)),el("span","sub",dayLabel(np+1)));
    right.append(a3);
  }
  cols.append(left,right);card.append(head,cols);
  return card;
}

function render(){
  try{noteFinished()}catch(e){console.warn(e)}
  const t=today(), st=streak(), both=bothSet().has(t), lv=level(state.xp);
  $("streak").textContent=st; $("streakWord").textContent=plural(st,"день подряд","дня подряд","дней подряд");
  const AK=activeKeys(), nDone=AK.filter(k=>datesOf(k).has(t)).length;
  // 0 заветов — огонёк погас; часть — внутри загорается маленький огонёк; все отрывки дня — горит полностью.
  // Если в расписании один завет, огонёк сразу горит полностью.
  // огонёк в полную силу — когда прочитана вся Библия на сегодня (основное расписание и свои расписания по Библии);
  // книги служения, Жизнеизучение и челлендж на силу огонька не влияют, но тоже зажигают его и держат серию
  let xd=0,xt=0;try{const c=xCount(true);xd=c[0];xt=c[1]}catch(e){}
  const litAny=nDone+xd>0||anySet().has(t);
  $("heroFlame").classList.toggle("off",!litAny);$("heroFlame").classList.toggle("half",litAny&&nDone+xd<AK.length+xt);
  $("heroSub").textContent="";
  // огонёк горит не полностью — подскажем, что ещё осталось сегодня по Библии
  if(litAny&&nDone+xd<AK.length+xt){const left=AK.filter(k=>!datesOf(k).has(t)).map(k=>(SCHED.spb?"":"«"+SCHED.name+"»: ")+T[k].label).concat((xCount.left||[]).map(n=>n.startsWith("челлендж")?n:"«"+n+"»"));
    if(left.length)$("heroSub").textContent="Чтобы огонёк разгорелся полностью, сегодня осталось: "+left.join(", ")}
  const fz=freezesNow();$("freezeText").textContent="Заморозки: "+fz;$("freezeText").parentNode.title="Заморозка — день, прочитанный заранее. Если пропустите день, она сохранит серию.";

  const tg=$("testaments");tg.textContent="";KEYS.forEach(k=>tg.append(renderTestament(k)));

  $("planNow").textContent=SCHED.name; $("planStartLbl").textContent=(PLAN_START<=t?"Расписание началось ":"Расписание начнётся ")+parse(PLAN_START).toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
  $("quizCard").hidden=!SCHED.spb;
  renderSchedule();
  renderPath();
  renderGems();
  renderQuiz();
  renderPace();

  // calendar: 5 weeks ending this week (Mon first)
  const cal=$("cal");cal.textContent="";
  ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(w=>cal.append(el("div","wd",w)));
  const now=parse(t), dow=(now.getDay()+6)%7, startD=add(t,-dow-28), bs=bothSet(), any=anySet(), frz=new Set(state.frzDays);
  for(let i=0;i<35;i++){
    const d=add(startD,i),e=el("div","cell",parse(d).getDate());
    if(bs.has(d))e.classList.add("done");else if(any.has(d))e.classList.add("half");else if(frz.has(d))e.classList.add("frozen");
    if(d===t)e.classList.add("today"); if(d>t)e.classList.add("future");
    e.title=d; cal.append(e);
  }
  $("calMonth").textContent=now.toLocaleDateString("ru-RU",{month:"long",year:"numeric"});

  {const n=booksSummary().length;$("booksOpen").textContent="📚 Моя библиотека · Библия "+n+" из 66";
    let ls=0,mo=0;try{const m=msShelf();ls=m.filter(o=>o.B.k==="ls").length;mo=m.length-ls}catch(e){}
    $("libSub").textContent="Жизнеизучение: начато "+ls+" · книги служения: "+mo;const lb=$("libBarI");if(lb)lb.style.width=Math.max(n?3:0,Math.round(n/66*100))+"%";const lnn=$("libBarN");if(lnn)lnn.textContent="Библия · "+n+" из 66"}
  const pr=$("prog");pr.textContent="";
  KEYS.forEach(k=>{
    const a=state[k].read.length, cur=part(k,nextP(k));
    const row=el("div","prog-row");
    const v=el("span","num",a+" / "+DAYS+" дн.");
    const bar=el("div","bar");const i=el("i");i.style.width=(a/DAYS*100).toFixed(1)+"%";bar.append(i);
    row.append(el("span",null,T[k].label+(nextP(k)<DAYS?" · сейчас: "+(FULL[cur.book]||cur.book):"")),v,bar);pr.append(row);
  });

  const bg=$("badges");bg.textContent="";
  const aw=awards(); $("awardsCount").textContent=aw.filter(a=>a.ok).length+" из "+aw.length;
  aw.forEach(a=>{
    const e=el("div","badge"+(a.ok?"":" locked"));e.title=a.desc+(a.ok?"":" (ещё не получена)");
    const m=el("div","medalsvg");m.innerHTML=medalSvg(a,56);
    e.append(m,el("b",null,a.name),el("span","bdesc",a.desc));bg.append(e);
  });
  try{renderExtras()}catch(e){console.warn(e)}
  try{applyNoPlan()}catch(e){console.warn(e)}
}

/* ---------- pace: days ahead of / behind the plan ---------- */
const SVGNS="http://www.w3.org/2000/svg";
function sv(tag,attrs,text){const e=document.createElementNS(SVGNS,tag);for(const a in attrs)e.setAttribute(a,attrs[a]);if(text!=null)e.textContent=text;return e}
function fmtAhead(n){return n>0?"+"+n:n<0?"−"+Math.abs(n):"0"}
function paceWords(n){return n>0?n+" "+daysWord(n)+" впереди":n<0?"отставание "+Math.abs(n)+" "+daysWord(Math.abs(n)):"точно по графику"}
// for each date since the plan start: passages read by that date minus passages due by that date
function paceSeries(){
  const t=today(), start=PLAN_START<=t?PLAN_START:t, n=dayNo(t)-dayNo(start)+1;
  const dates=[];for(let i=0;i<n;i++)dates.push(add(start,i));
  const out={dates,nt:[],ot:[]};
  KEYS.forEach(k=>{
    // считаем прочитанные отрывки (каждый один раз), а не записи журнала: повторные отметки не дают «опережения», а отрывок, отмеченный прочитанным без записи в журнале (после синхронизации с другого устройства), не даёт ложного «отставания»
    const first={};state[k].log.forEach(x=>{if(x.p!=null&&(!(x.p in first)||x.d<first[x.p]))first[x.p]=x.d});
    state[k].read.forEach(p=>{if(!(p in first))first[p]=start});
    const counts={};let run=0;Object.values(first).forEach(d=>{if(d<start)run++;else counts[d]=(counts[d]||0)+1});
    dates.forEach((d,i)=>{
      run+=counts[d]||0;
      let v=run-dueBy(d);
      if(d===t&&v<0)v=run-dueBy(add(d,-1)); // today's passage isn't overdue until the day ends
      out[k].push(v);
    });
  });
  return out;
}
function niceStep(range){const raw=range/4;const m=Math.pow(10,Math.floor(Math.log10(raw||1)));for(const f of [1,2,5,10])if(f*m>=raw)return f*m;return 10*m}
const shortDate=d=>parse(d).toLocaleDateString("ru-RU",{day:"numeric",month:"short"});
function renderPace(){

  const S=paceSeries(), last=S.dates.length-1;
  const tiles=$("paceTiles");tiles.textContent="";
  KEYS.forEach(k=>{
    const v=S[k][last], pill=el("span","pacepill"+(v>0?" ahead":v<0?" behind":""));
    const key=el("span","pacekey");key.style.background="var(--s-"+k+")";
    pill.append(key,el("span","pk",T[k].short),el("b",null,v===0?"по плану":fmtAhead(v)+" "+daysWord(Math.abs(v))));
    pill.title=T[k].label+": "+paceWords(v);
    tiles.append(pill);
  });
  const leg=$("paceLegend");leg.textContent="";
  KEYS.forEach(k=>{const s=el("span");const i=el("i");i.style.cssText="height:2px;width:16px;border-radius:2px;background:var(--s-"+k+")";s.append(i,document.createTextNode(T[k].label));leg.append(s)});
  const tb=$("paceTable");tb.textContent="";const table=el("table");
  const hr=el("tr");["Дата","Новый Завет","Ветхий Завет"].forEach(h=>hr.append(el("th",null,h)));table.append(hr);
  for(let i=last;i>=Math.max(0,last-13);i--){const r=el("tr");r.append(el("td",null,shortDate(S.dates[i])),el("td",null,fmtAhead(S.nt[i])),el("td",null,fmtAhead(S.ot[i])));table.append(r)}
  tb.append(table);
  drawPace(S);
}
function drawPace(S){
  const box=$("paceChart");box.textContent="";
  if(!$("paceCard").open)return;
  const W=Math.max(260,box.clientWidth||320), H=200, m={l:40,r:58,t:12,b:26};
  const n=S.dates.length, all=[0,...S.nt,...S.ot];
  let lo=Math.min(...all), hi=Math.max(...all); if(hi-lo<4){hi+=2;lo-=2}
  const step=niceStep(hi-lo); lo=Math.floor(lo/step)*step; hi=Math.ceil(hi/step)*step;
  const pw=W-m.l-m.r, x=i=>m.l+(n<=1?pw/2:i*pw/(n-1)), y=v=>m.t+(hi-v)*(H-m.t-m.b)/(hi-lo);
  const svg=sv("svg",{width:W,height:H,viewBox:"0 0 "+W+" "+H,class:"pacesvg"});
  for(let v=lo;v<=hi;v+=step){
    svg.append(sv("line",{x1:m.l,x2:W-m.r,y1:y(v),y2:y(v),class:v===0?"zero":"grid"}));
    svg.append(sv("text",{x:m.l-6,y:y(v)+4,"text-anchor":"end",class:"tick"},v===0?"план":fmtAhead(v)));
  }
  svg.append(sv("text",{x:x(0),y:H-6,"text-anchor":n<=1?"middle":"start",class:"tick"},shortDate(S.dates[0])));
  if(n>1)svg.append(sv("text",{x:x(n-1),y:H-6,"text-anchor":"end",class:"tick"},shortDate(S.dates[n-1])));
  const ends=[];
  KEYS.forEach(k=>{
    const pts=S[k].map((v,i)=>x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ");
    if(n>1)svg.append(sv("polyline",{points:pts,fill:"none",stroke:"var(--s-"+k+")","stroke-width":2,"stroke-linejoin":"round","stroke-linecap":"round"}));
    const v=S[k][n-1];ends.push({k,v,y:y(v)});
    svg.append(sv("circle",{cx:x(n-1),cy:y(v),r:4.5,fill:"var(--s-"+k+")",stroke:"var(--surface)","stroke-width":2}));
  });
  ends.sort((a,b)=>a.y-b.y); if(ends[1].y-ends[0].y<14){const mid=(ends[0].y+ends[1].y)/2;ends[0].y=mid-7;ends[1].y=mid+7}
  ends.forEach(e=>svg.append(sv("text",{x:x(n-1)+9,y:e.y+4,class:"endlab"},T[e.k].short+" "+fmtAhead(e.v))));
  const cross=sv("line",{y1:m.t,y2:H-m.b,class:"cross",visibility:"hidden"});svg.append(cross);
  const hit=sv("rect",{x:m.l-8,y:0,width:pw+16,height:H,fill:"transparent",tabindex:0,"aria-label":"Показать значения по дням (стрелки влево и вправо)"});svg.append(hit);
  const tip=el("div","pacetip");tip.hidden=true;
  function show(i){
    i=Math.max(0,Math.min(n-1,i));const cx=x(i);cross.setAttribute("x1",cx);cross.setAttribute("x2",cx);cross.setAttribute("visibility","visible");
    tip.textContent="";tip.append(el("div","tipdate",shortDate(S.dates[i])+" · день плана "+Math.min(DAYS,i+1)));
    KEYS.forEach(k=>{const r=el("div","tiprow");const key=el("span","tipkey");key.style.background="var(--s-"+k+")";r.append(key,el("b",null,fmtAhead(S[k][i])),el("span",null,T[k].label));tip.append(r)});
    tip.hidden=false;tip.style.left=Math.min(Math.max(cx-80,0),W-160)+"px";
  }
  const hide=()=>{tip.hidden=true;cross.setAttribute("visibility","hidden")};
  const toIdx=ev=>{const r=svg.getBoundingClientRect();return n<=1?0:Math.round((ev.clientX-r.left-m.l)/(pw/(n-1)))};
  hit.addEventListener("pointermove",ev=>show(toIdx(ev)));
  hit.addEventListener("pointerdown",ev=>show(toIdx(ev)));
  hit.addEventListener("pointerleave",hide);
  let fi=n-1;hit.addEventListener("focus",()=>show(fi));hit.addEventListener("blur",hide);
  hit.addEventListener("keydown",ev=>{if(ev.key==="ArrowLeft"){fi=Math.max(0,fi-1);show(fi);ev.preventDefault()}if(ev.key==="ArrowRight"){fi=Math.min(n-1,fi+1);show(fi);ev.preventDefault()}});
  box.append(svg,tip);
  if(n===1)box.append(el("p","hint","Линии появятся, когда пройдёт хотя бы один день плана. Дату начала можно изменить выше."));
}
$("paceCard").addEventListener("toggle",()=>{const o=$("paceCard").open;$("paceBody").hidden=!o;if(o)drawPace(paceSeries())});
let rz;window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{drawPace(paceSeries());renderPath()},150)});


/* ---------- quiz: questions answered strictly from the passage ---------- */
function viewDay(k){const t=today(),todays=state[k].log.filter(x=>x.d===t);return todays.length?todays[todays.length-1].p:Math.min(nextP(k),DAYS-1)}
function shuffled(arr,seed){const a=arr.slice();let x=seed*9301+49297;for(let i=a.length-1;i>0;i--){x=(x*9301+49297)%233280;const j=Math.floor(x/233280*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// state.quiz[id] = {ok: solved, first: solved on the first try, wrong: [wrong picks]}
function quizRes(id){
  const r=state.quiz[id]; if(!r)return null;
  if(r.pick!==undefined&&r.wrong===undefined)return {ok:r.ok,first:!!r.ok,wrong:r.ok?[]:[r.pick]}; // older format
  return r;
}
const CHECK_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
/* questions for every read passage, oldest first; answered today stay visible */
let quizShow=6;
function quizCard(k,p){
  const x=part(k,p), q=QUIZ[p]&&QUIZ[p][k], id=k+"-"+p, ki=KEYS.indexOf(k);
  const card=el("div","qcard");card.dataset.id=id;
  card.append(el("div","qref",T[k].label+" · "+refStr(x)+" · "+dayLabel(p)));
  card.append(el("div","qtext",q[0]));
  const res=quizRes(id), solved=!!(res&&res.ok), wrong=(res&&res.wrong)||[], opts=el("div","qopts");
  shuffled([q[1],q[2],q[3]],p*2+ki+1).forEach(o=>{
    const b=el("button","qopt");b.type="button";
    const mark=el("span","qmark");b.append(el("span",null,o),mark);
    if(solved&&o===q[1]){b.classList.add("right");mark.innerHTML=CHECK_SVG}
    if(wrong.includes(o)){b.classList.add("wrong");mark.innerHTML=CROSS_SVG}
    if(solved||wrong.includes(o))b.disabled=true;
    else b.addEventListener("click",()=>answerQuiz(k,p,o,q));
    opts.append(b);
  });
  card.append(opts);
  const badge=el("div","qverdict");badge.hidden=true;card.append(badge);
  return card;
}
let quizPinned=null, quizTimer=null; // answered question stays 2 s, then the next one takes its place
function pendingQuiz(){
  const items=[];
  KEYS.forEach(k=>state[k].read.forEach(p=>{
    if(!(QUIZ[p]&&QUIZ[p][k]))return;
    const r=quizRes(k+"-"+p); if(!r||!r.ok)items.push({k,p});
  }));
  return items.sort((a,b)=>a.p-b.p||KEYS.indexOf(a.k)-KEYS.indexOf(b.k));
}
function renderQuiz(){
  if(!state.quiz)state.quiz={};
  const box=$("quiz"), items=pendingQuiz();
  $("quizCount").textContent=items.length?"Осталось: "+items.length:"";
  const cur=quizPinned||items[0];
  const key=cur?cur.k+"-"+cur.p:"none";
  const fresh=box.dataset.cur!==key; box.dataset.cur=key; box.textContent="";
  if(!cur){const any=state.nt.read.length+state.ot.read.length;box.append(el("p","hint",any?"Все вопросы отвечены. Новый вопрос появится после следующего прочитанного отрывка.":"Вопросы появятся после того, как вы прочитаете отрывок."));return}
  const card=quizCard(cur.k,cur.p); if(fresh)card.classList.add("qin"); box.append(card);
}
function quizReaction(id,ok){
  const card=document.querySelector('#quiz .qcard[data-id="'+id+'"]'); if(!card)return;
  const v=card.querySelector(".qverdict");
  v.className="qverdict "+(ok?"ok":"no");v.textContent="";
  const ic=el("span","qvicon");ic.innerHTML=ok?CHECK_SVG:CROSS_SVG;
  v.append(ic,el("span",null,ok?"Правильно!":"Неправильно"));v.hidden=false;
  card.classList.remove("flash-ok","shake");void card.offsetWidth;card.classList.add(ok?"flash-ok":"shake");
  if(ok){const r=card.getBoundingClientRect();burst(r.left+r.width/2,r.top+40,36)}
  setTimeout(()=>{v.hidden=true},1800);
}
function answerQuiz(k,p,pick,q){
  const id=k+"-"+p, prev=quizRes(id)||{ok:false,first:false,wrong:[]};
  if(prev.ok||prev.wrong.includes(pick))return;
  const ok=pick===q[1], firstTry=prev.wrong.length===0;
  const next={ok,first:ok&&firstTry,wrong:ok?prev.wrong:prev.wrong.concat([pick])};if(ok)next.d=today();
  state.quiz[id]=next;
  if(next.first)state.xp+=XP_QUIZ;
  vibrate(ok?[40,30,40]:[160]);
  if(ok){clearTimeout(quizTimer);quizPinned={k,p};quizTimer=setTimeout(()=>{quizPinned=null;renderQuiz()},2000)}
  save();render();quizReaction(id,ok);

  checkAwards();
}

/* ---------- path: everyone walks the same zigzag trail of plan days ---------- */
let pathPeople=[]; // friends: {id,name,photo,nt,ot}
let pathZoom=1, pathKeep=null; const pathOpen=new Set();
try{pathZoom=Math.min(3,Math.max(0.5,Number(localStorage.getItem("ogonek-path-zoom"))||1))}catch(e){}
function setPathZoom(z){
  z=Math.min(3,Math.max(0.5,Math.round(z*100)/100)); if(z===pathZoom)return;
  const pb=$("pathBox"); if(pb&&pb.scrollWidth)pathKeep={x:(pb.scrollLeft+pb.clientWidth/2)/pb.scrollWidth,y:(pb.scrollTop+pb.clientHeight/2)/pb.scrollHeight};
  pathZoom=z; try{localStorage.setItem("ogonek-path-zoom",String(z))}catch(e){}
  $("pzLevel").textContent=Math.round(z*100)+"%"; renderPath();
}
const PCOL=["#3d93e2","#34a874","#8a6cf2","#e0475b","#2bb3b1","#c7559c","#5b6bd6"];
function hashCol(id){let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))|0;return PCOL[Math.abs(h)%PCOL.length]}
// день церковного плана, в который читается эта книга и глава (для друзей со своим расписанием)
function spbDayOfRef(s){const m=/^(.*\S)\s+(\d[\d:–—\-]*)$/.exec(s||"");if(!m||!BOOK[m[1]])return null;const book=m[1],[c]=chapRange(m[2]),bi=BOOK[book].t==="nt"?0:2;
  let first=-1;for(let i=0;i<PLAN_SPB.length;i++){const d=PLAN_SPB[i];if(d[bi]!==book)continue;if(first<0)first=i;const [a,z]=chapRange(d[bi+1]);if(c>=a&&c<=z)return i}
  return null}
const RU_DF={1:new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short"}),2:new Intl.DateTimeFormat("ru-RU",{weekday:"short",day:"numeric",month:"long"})},RU_DC=new Map();
function ruFmt(ds,kind){const key=kind+ds;let v=RU_DC.get(key);if(v===undefined){v=RU_DF[kind].format(parse(ds));if(kind===2)v=v.charAt(0).toUpperCase()+v.slice(1);RU_DC.set(key,v)}return v}
function renderDayPath(){
  const box=$("path"); if(!box)return;
  // путь всегда идёт по общему расписанию церкви (как раньше), даже если вы сейчас читаете по своему
  const P=PLAN_SPB, DAYS=P.length, PLAN_START=SPB_START;
  const planDate=i=>add(SPB_START,i), todayP=()=>dayNo(today())-dayNo(SPB_START);
  const shortDay=i=>ruFmt(planDate(i),1);
  const dayLabel=i=>ruFmt(planDate(i),2);
  const part=(k,i)=>{const d=P[Math.max(0,Math.min(i,DAYS-1))],bi=k==="nt"?0:2;return {book:d[bi],ref:d[bi+1]}};
  const BOOKSTARTS=[];["nt","ot"].forEach(k=>{const bi=k==="nt"?0:2;P.forEach((d,i)=>{if(!i||P[i-1][bi]!==d[bi])BOOKSTARTS.push({i,k,book:d[bi]})})});
  const readSet=k=>SCHED.spb?new Set(state[k].read):new Set();
  let myRef="";
  const mePos=SCHED.spb?Math.floor((nextP("nt")+nextP("ot"))/2):(()=>{const ps=[];KEYS.forEach(k=>{const np=nextP(k);if(np>=SCHED.plan.length)return;const r=refStr({book:PLAN[np][T[k].bi],ref:PLAN[np][T[k].ri]});myRef+=(myRef?" и ":"")+r;const x=spbDayOfRef(r);if(x!=null)ps.push(x)});return ps.length?Math.floor(ps.reduce((a,b)=>a+b,0)/ps.length):0})();
  // друзья на церковном расписании — по дню плана; на своём расписании — по книге и главе, которые они сейчас читают
  const people=[{id:"me",name:"Вы",photo:state.photo||"",pos:mePos,me:true,ref:myRef}].concat(pathPeople.map(f=>{
    if((f.plan||"spb")==="spb")return {id:f.id,name:f.name||"Друг",photo:f.photo||"",pos:Math.floor(((f.nt||0)+(f.ot||0))/2)};
    const ks=Array.isArray(f.keys)&&f.keys.length?f.keys:["nt","ot"], ps=[], refs=[];
    ks.forEach((k,j)=>{const r=f.refs&&f.refs[j];if(!r)return;refs.push(r);const p=spbDayOfRef(r);if(p!=null)ps.push(p)});
    if(!ps.length)return null;
    return {id:f.id,name:f.name||"Друг",photo:f.photo||"",pos:Math.floor(ps.reduce((a,b)=>a+b,0)/ps.length),ref:refs.join(" и ")};
  }).filter(Boolean));
  const tp=Math.min(DAYS-1,Math.max(0,todayP()));
  const lo=0, hi=DAYS-1; // весь путь года — можно пролистать и увидеть, где начинается каждая книга
  const W=Math.max(280,box.clientWidth||320), gap=58, padT=40, padB=lo===0?160:40, n=hi-lo+1, H=padT+padB+(n-1)*gap, cx=W/2, A=Math.min(90,W*0.26);
  const X=i=>cx+A*Math.sin((i-lo)*Math.PI/3.5), Y=i=>padT+(hi-i)*gap;
  const posXY=pos=>{const a=Math.floor(pos),b=Math.min(hi,a+1),t=pos-a;return [X(a)+(X(b)-X(a))*t,Y(a)+(Y(b)-Y(a))*t]};
  const rn=readSet("nt"),ro=readSet("ot");let rs=0;rn.forEach(x=>rs+=x+1);ro.forEach(x=>rs+=(x+1)*7);
  const ckey=[W,H,tp,mePos,rn.size,ro.size,rs,lo,hi,DAYS].join("|"),PC=renderDayPath.c;let svg;
  if(PC&&PC.k===ckey)svg=PC.svg.cloneNode(true);else{
  svg=sv("svg",{width:W,height:H,viewBox:"0 0 "+W+" "+H,class:"pathsvg",role:"img","aria-label":"Путь чтения: где вы и ваши друзья по плану"});
  let d="";for(let i=lo;i<=hi;i++)d+=(i===lo?"M":"L")+X(i).toFixed(1)+" "+Y(i).toFixed(1);
  svg.append(sv("path",{d,fill:"none",stroke:"var(--trail)","stroke-width":8,"stroke-linecap":"round","stroke-linejoin":"round"}));
  const doneTo=Math.min(hi,mePos);let dd="";for(let i=lo;i<=Math.floor(doneTo);i++)dd+=(i===lo?"M":"L")+X(i).toFixed(1)+" "+Y(i).toFixed(1);
  if(doneTo>lo){const [ex,ey]=posXY(doneTo);dd+="L"+ex.toFixed(1)+" "+ey.toFixed(1);svg.append(sv("path",{d:dd,fill:"none",stroke:"var(--flame)","stroke-width":4,"stroke-linecap":"round","stroke-linejoin":"round","stroke-dasharray":"2 8"}))}
  for(let i=lo;i<=hi;i++){
    const both=rn.has(i)&&ro.has(i), one=rn.has(i)||ro.has(i);
    const g=sv("g",{class:"pnode"+(both?" both":one?" one":"")});
    g.append(sv("circle",{cx:X(i),cy:Y(i),r:15}));
    if(i!==tp)g.append(sv("text",{x:X(i),y:Y(i)+4,"text-anchor":"middle"},String(parse(planDate(i)).getDate()))); // у дня «по плану» дата подписана справа
    // подсказка <title> у каждого из 728 дней убрана: на телефоне её не видно, а это ~800 лишних элементов
    svg.append(g);
    if(i%7===0){const left=X(i)<=cx;{const wt=sv("text",{x:left?X(i)-22:X(i)+22,y:Y(i)-28,"text-anchor":left?"end":"start",class:"pweek"});wt.append(sv("tspan",{x:left?X(i)-22:X(i)+22},"Неделя "+(i/7+1)),sv("tspan",{x:left?X(i)-22:X(i)+22,dy:13,class:"pweekd"},shortDay(i)));svg.append(wt)}}
  }
  if(DAYS>364&&hi>=363&&lo<=363)svg.append(sv("text",{x:X(363),y:Y(363)-24,"text-anchor":"middle",class:"pweek"},"Конец 1-го года · дальше 2-й год"));if(hi>=DAYS-1)svg.append(sv("text",{x:X(DAYS-1),y:Y(DAYS-1)-24,"text-anchor":"middle",class:"pweek"},DAYS>364?"Финиш · вся Библия прочитана":"Конец 1-го года · дальше 2-й год"));
  // книги Библии: табличка там, где начинается новая книга
  {const byDay={};BOOKSTARTS.forEach(b=>{(byDay[b.i]=byDay[b.i]||[]).push(b)});
   Object.entries(byDay).forEach(([di,list])=>{
     const i=+di, nx=X(i), right=nx<=cx, fs=W<360?11.5:12.5;
     const bwOf=b=>{const name=FULL[b.book]||b.book,lab=b.k==="nt"?"Новый Завет":"Ветхий Завет";return Math.ceil(Math.max(name.length*fs*0.56,lab.length*5.6)+40)};
     const tot=list.reduce((a,b)=>a+bwOf(b),0)+8*(list.length-1); let x0=(W-tot)/2;
     list.forEach((b,j)=>{
       const name=FULL[b.book]||b.book, lab=b.k==="nt"?"Новый Завет":"Ветхий Завет";
       const bw=Math.ceil(Math.max(name.length*fs*0.56,lab.length*5.6)+40), bh=36;
       const first=i===0; // первые книги — под флажком «Старт», рядом друг с другом
       const by=first?Y(0)+102:Y(i)-bh/2+(i===tp?-40:0);
       const bx=first?x0:(right?W-8-bw:8); if(first)x0+=bw+8;
       const g=sv("g",{class:"pbook "+b.k});g.style.setProperty("--c","var(--s-"+b.k+")");
       if(!first)g.append(sv("line",{x1:right?bx:bx+bw,y1:by+bh/2,x2:nx+(right?17:-17),y2:Y(i),class:"pbookln"}));
       g.append(sv("rect",{x:bx,y:by,width:bw,height:bh,rx:10}));
       g.append(sv("rect",{x:bx+8,y:by+8,width:6,height:bh-16,rx:2,class:"pbookspine"}));
       g.append(sv("text",{x:bx+22,y:by+14,class:"pbooklab"},lab));
       g.append(sv("text",{x:bx+22,y:by+29,class:"pbookname","font-size":fs},name));
       g.append(sv("title",{},"С "+shortDay(i)+" — "+name+" ("+lab+")"));
       svg.append(g);
     });
   });}
  // старт: все начинают читать в один день
  if(lo===0){const sx=X(0), sy=Y(0), g=sv("g",{class:"pstart"}), tx=Math.min(W-95,Math.max(95,sx));
    g.append(sv("line",{x1:sx,y1:sy+36,x2:sx,y2:sy+60}));
    g.append(sv("path",{d:"M"+sx+" "+(sy+36)+"h22l-6 6 6 6h-22z"}));
    g.append(sv("text",{x:tx,y:sy+76,"text-anchor":"middle"},"Старт · "+parse(PLAN_START).toLocaleDateString("ru-RU",{day:"numeric",month:"long"})));
    g.append(sv("text",{x:tx,y:sy+90,"text-anchor":"middle",class:"pstartsub"},"все начинают отсюда"));
    svg.append(g)}
  renderDayPath.c={k:ckey,svg:svg.cloneNode(true)}}
  // где по плану нужно быть сегодня: пунктир через весь путь и флажок
  {const ty=Y(tp), tx=X(tp), left=tx>cx;
   svg.insertBefore(sv("line",{x1:6,x2:W-6,y1:ty,y2:ty,class:"pplanline"}),svg.firstChild);
   svg.append(sv("circle",{cx:tx,cy:ty,r:20,class:"pplanring"}));
    // подпись — в левом верхнем углу окна пути (на линии её закрывали люди); нажатие — к линии
    const pb0=$("pathBox");let lg=$("pathLegend");
    if(pb0&&!lg){lg=el("div","plegend");lg.id="pathLegend";const b=el("button","plegbtn");b.type="button";b.append(el("i"),el("span"));lg.append(b);pb0.before(lg)}
    if(lg){lg.hidden=false;const b=lg.querySelector("button");{const sp=b.querySelector("span");sp.textContent="";sp.append(el("b",null,"По плану"),el("small",null,shortDay(tp)))}b.setAttribute("aria-label","По плану сегодня — "+shortDay(tp)+". Показать на пути");
      b.onclick=()=>{const pb=$("pathBox");if(pb){pb.dataset.touched="1";pb.scrollTo({top:Math.max(0,ty*pathZoom-pb.clientHeight/2),behavior:"smooth"})}}}}
  let psig="";try{psig=ckey+"#"+pathZoom+"#"+[...pathOpen].join(",")+"#"+JSON.stringify(people.map(p=>{let v="";try{v=(freshNotes(p)[0]||{}).v||""}catch(e){}return [p.id,p.pos,p.photo,p.name,p.ref,v]}))}catch(e){}
  if(psig&&renderDayPath.s===psig&&renderDayPath.el&&box.firstChild===renderDayPath.el&&!pathKeep)return;
  renderDayPath.s=psig;
  // people: grouped by position so avatars on the same spot sit side by side
  const groups={};people.forEach(pp=>{const k=pp.pos.toFixed(2);(groups[k]=groups[k]||[]).push(pp)});
  let meY=0;
  const drawPerson=(pp,x,y,j,crowd)=>{
    const col=pp.me?"var(--flame)":hashCol(pp.id), cid="pc"+pp.id.replace(/[^a-zA-Z0-9]/g,"")+j;
    const g=sv("g",{class:"pperson"+(pp.me?" me":"")});
    g.append(sv("circle",{cx:x,cy:y,r:16,fill:col,stroke:"var(--surface)","stroke-width":3}));
    if(pp.photo){const cp=sv("clipPath",{id:cid});cp.append(sv("circle",{cx:x,cy:y,r:13}));g.append(cp);
      g.append(sv("image",{href:pp.photo,x:x-13,y:y-13,width:26,height:26,"clip-path":"url(#"+cid+")",preserveAspectRatio:"xMidYMid slice",referrerpolicy:"no-referrer"}))}
    else g.append(sv("text",{x,y:y+5,"text-anchor":"middle",class:"pinit"},(pp.name||"?").trim().charAt(0).toUpperCase()));
    // в толпе имена показываются при приближении (от 150%), иначе только по наведению
    if(!crowd||pathZoom>=1.5){let nm=pp.me?"Вы":(pp.name||"").split(" ")[0];if(crowd&&nm.length>7)nm=nm.slice(0,6)+"…";g.append(sv("text",{x,y:y+30,"text-anchor":"middle",class:"pname"+(crowd?" small":"")},nm))}
    g.append(sv("title",{},(pp.me?"Вы":pp.name)+" · "+(pp.ref?(pp.me?"ваше расписание, читаете ":"своё расписание, читает ")+pp.ref:dayLabel(Math.min(DAYS-1,Math.floor(pp.pos))))));
    if(window.Ogonek&&window.Ogonek.onPersonClick){g.style.cursor="pointer";g.addEventListener("click",()=>window.Ogonek.onPersonClick(pp.me?"me":pp.id))}
    try{noteBadge(g,pp,x,y)}catch(e){}
    svg.append(g); if(pp.me)meY=y;
  };
  Object.entries(groups).forEach(([key,gr])=>{
    gr.sort((a,b)=>(b.me?1:0)-(a.me?1:0)); // «Вы» first
    const [nx,by]=posXY(gr[0].pos), dir=nx>cx?-1:1; // stand next to the day node, toward the middle
    const space=dir>0?W-nx-34:nx-34, perRow=Math.max(1,Math.floor(space/36));
    const open=pathOpen.has(key), maxShow=open?gr.length:Math.min(gr.length,perRow*2+1);
    const shown=gr.length>maxShow?maxShow-1:maxShow;
    const crowd=gr.length>1, rowH=crowd&&pathZoom<1.5?38:46;
    // первый человек стоит прямо в кружке дня, остальные — рядом
    drawPerson(gr[0],nx,by,0,crowd);
    for(let j=1;j<shown;j++){const q=j-1,r=Math.floor(q/perRow),c=q%perRow;drawPerson(gr[j],nx+dir*(34+c*36),by+r*rowH,j,crowd)}
    if(shown<gr.length){ // too many on one day: a "+N" bubble opens the whole group
      const q=shown-1,r=Math.floor(q/perRow),c=q%perRow,x=nx+dir*(34+c*36),y=by+r*rowH;
      const g=sv("g",{class:"pmore",tabindex:0,role:"button"});
      g.append(sv("circle",{cx:x,cy:y,r:16}));g.append(sv("text",{x,y:y+5,"text-anchor":"middle"},"+"+(gr.length-shown)));
      g.append(sv("title",{},gr.slice(shown).map(pp=>pp.name).join(", ")));
      const openIt=()=>{pathOpen.add(key);renderPath()};g.addEventListener("click",openIt);g.addEventListener("keydown",e=>{if(e.key==="Enter")openIt()});
      svg.append(g);
    }else if(open&&gr.length>perRow*2+1){
      const r=Math.ceil((gr.length-1)/perRow),x=nx+dir*34,y=by+r*rowH-8;
      const t=sv("text",{x,y,"text-anchor":dir>0?"start":"end",class:"pless"},"свернуть");
      t.addEventListener("click",()=>{pathOpen.delete(key);renderPath()});svg.append(t);
    }
  });
  // zoom: scale the whole drawing; the box scrolls both ways
  svg.setAttribute("width",Math.round(W*pathZoom));svg.setAttribute("height",Math.round(H*pathZoom));
  box.textContent="";box.append(svg);renderDayPath.el=svg;
  const lead=people.slice().sort((a,b)=>b.pos-a.pos)[0];
  $("pathSub").textContent="";
  const pb=$("pathBox");
  if(pb&&pathKeep){pb.scrollLeft=pathKeep.x*pb.scrollWidth-pb.clientWidth/2;pb.scrollTop=pathKeep.y*pb.scrollHeight-pb.clientHeight/2;pathKeep=null}
  else if(pb&&!pb.dataset.touched){pb.scrollTop=Math.max(0,meY*pathZoom-pb.clientHeight/2);pb.scrollLeft=(pb.scrollWidth-pb.clientWidth)/2}
  if(pb&&!pb.dataset.bound){pb.dataset.bound="1";["wheel","touchstart","pointerdown"].forEach(ev=>pb.addEventListener(ev,()=>{pb.dataset.touched="1"},{passive:true}))}
}
function renderPath(){let cm=false;try{cm=pathModeConf()}catch(e){}if(cm)return renderConfPath();try{confPathChrome(false)}catch(e){}return renderDayPath()}
function renderBiblePath(){
  const box=$("path"); if(!box)return;
  // путь — вся Библия от Бытия до Откровения; каждый стоит там, где сейчас читает (по любому расписанию)
  const W=Math.max(280,box.clientWidth||320), cx=W/2, A=Math.min(90,W*0.26), B=72, C=6, padB=120, padT=90, NTGAP=70;
  const geo=[];let v=padB;
  BOOKS.forEach((b,i)=>{if(b.a==="Мф.")v+=NTGAP;const h=B+C*b.v.length;geo.push({b,i,v0:v,node:v+20,h});v+=h});
  const H=v+padT, Y=vv=>H-vv, X=vv=>cx+A*Math.sin(vv/170*Math.PI);
  const G=Object.fromEntries(geo.map(x=>[x.b.a,x]));
  // место отрывка на пути: книга, глава и (если есть) стих
  const vOf=(book,ref)=>{const g=G[book];if(!g)return null;const [c]=chapRange(String(ref||"1"));const ch=Math.max(1,Math.min(g.b.v.length,c||1));
    const m=/^\d+:(\d+)/.exec(String(ref||""));const fr=m?(Math.min(+m[1],g.b.v[ch-1])-1)/g.b.v[ch-1]:0;return g.node+30+(ch-1+fr)*C};
  const parseRef=s=>{const m=/^(.*\S)\s+(\d[\d:–—\-]*)$/.exec(s||"");return m&&BOOK[m[1]]?{book:m[1],ref:m[2]}:null};
  const svg=sv("svg",{width:W,height:H,viewBox:"0 0 "+W+" "+H,class:"pathsvg",role:"img","aria-label":"Путь: вся Библия от Бытия до Откровения — где вы и ваши друзья"});
  let d="";for(let vv=padB-40;vv<=H-padT+40;vv+=10)d+=(d?"L":"M")+X(vv).toFixed(1)+" "+Y(vv).toFixed(1);
  svg.append(sv("path",{d,fill:"none",stroke:"var(--trail)","stroke-width":8,"stroke-linecap":"round","stroke-linejoin":"round"}));
  // книги: кружок в начале книги и табличка с названием
  const done=new Set(booksSummary().map(x=>x[0]));
  const people=[];
  KEYS.forEach(k=>{const np=nextP(k);if(np>=DAYS)return;const x=part(k,np);const vv=vOf(x.book,x.ref);if(vv!=null)people.push({id:"me",key:"me-"+k,name:"Вы",photo:state.photo||"",v:vv,me:true,ref:refStr(x)})});
  const reading=new Set(people.map(p=>parseRef(p.ref)&&parseRef(p.ref).book));
  const fs=W<360?11:12;
  geo.forEach(g=>{
    const nx=X(g.node), ny=Y(g.node), right=nx<=cx;
    const n=sv("g",{class:"pnode"+(done.has(g.b.a)?" both":reading.has(g.b.a)?" one":"")});
    n.append(sv("circle",{cx:nx,cy:ny,r:13}));n.append(sv("text",{x:nx,y:ny+4,"text-anchor":"middle"},String(g.i+1)));
    n.append(sv("title",{},g.b.n+" · "+g.b.v.length+" "+plural(g.b.v.length,"глава","главы","глав")+(done.has(g.b.a)?" · прочитана":"")));svg.append(n);
    const name=g.b.n, sec=(SECTIONS.find(s=>s[0]===g.b.s)||[,""])[1];
    const bw=Math.ceil(Math.max(name.length*fs*0.56,sec.length*6.3)+34), bh=34, bx=right?W-8-bw:8, by=ny-bh/2;
    const t=sv("g",{class:"pbook "+g.b.t+(done.has(g.b.a)?" done":"")});t.style.setProperty("--c",SECCOL[g.b.s]);
    t.append(sv("line",{x1:right?bx:bx+bw,y1:ny,x2:nx+(right?15:-15),y2:ny,class:"pbookln"}));
    t.append(sv("rect",{x:bx,y:by,width:bw,height:bh,rx:10}));
    t.append(sv("rect",{x:bx+8,y:by+8,width:5,height:bh-16,rx:2,class:"pbookspine"}));
    t.append(sv("text",{x:bx+20,y:by+13,class:"pbooklab"},sec));
    t.append(sv("text",{x:bx+20,y:by+27,class:"pbookname","font-size":fs},name+(done.has(g.b.a)?" ✓":"")));
    t.append(sv("title",{},name+" · "+sec));svg.append(t);
  });
  // заветы: начало, граница и конец Библии
  {const g0=geo[0], s0=Y(g0.node)+48, st=sv("g",{class:"pstart"}), x0=X(g0.node), tx=Math.min(W-95,Math.max(95,x0));
   st.append(sv("line",{x1:x0,y1:s0-14,x2:x0,y2:s0+10}));st.append(sv("path",{d:"M"+x0+" "+(s0-14)+"h22l-6 6 6 6h-22z"}));
   st.append(sv("text",{x:tx,y:s0+28,"text-anchor":"middle"},"Начало Библии · Ветхий Завет"));
   st.append(sv("text",{x:tx,y:s0+44,"text-anchor":"middle",class:"pstartsub"},"«В начале сотворил Бог…»"));svg.append(st);
   const mt=G["Мф."], yv=Y(mt.v0-NTGAP/2);svg.append(sv("line",{x1:10,x2:W-10,y1:yv,y2:yv,class:"ptestline"}));
   const lab=sv("text",{x:cx,y:yv-6,"text-anchor":"middle",class:"ptestlab"},"Новый Завет");svg.append(lab);
   const last=geo[geo.length-1], ye=Y(last.v0+last.h)-18;svg.append(sv("text",{x:cx,y:ye,"text-anchor":"middle",class:"pweek"},"Конец Библии"));}
  // где по вашему расписанию нужно быть сегодня
  {const tp=Math.min(DAYS-1,Math.max(0,todayP()));KEYS.forEach(k=>{const x=part(k,tp);const vv=vOf(x.book,x.ref);if(vv==null)return;
    const px=X(vv), py=Y(vv), dr=px>cx?-1:1;svg.append(sv("circle",{cx:px,cy:py,r:21,class:"pplanring"}));
    const t=sv("text",{x:px-dr*26,y:py+4,"text-anchor":dr>0?"end":"start",class:"pplantag"},"по плану");t.append(sv("title",{},"По плану сегодня: "+refStr(x)));svg.append(t)})}
  // друзья — по их собственным отрывкам, какое бы расписание у них ни было
  pathPeople.forEach(f=>{const ks=Array.isArray(f.keys)&&f.keys.length?f.keys:["nt","ot"];
    ks.forEach((k,j)=>{let r=f.refs&&f.refs[j]?parseRef(f.refs[j]):null;
      if(!r&&(f.plan||"spb")==="spb"){const p=Math.min(PLAN_SPB.length-1,f[k]||0),dd=PLAN_SPB[p],bi=k==="nt"?0:2;r={book:dd[bi],ref:dd[bi+1]}}
      if(!r)return;const vv=vOf(r.book,r.ref);if(vv!=null)people.push({id:f.id,key:f.id+"-"+k,name:f.name||"Друг",photo:f.photo||"",v:vv,ref:r.book+" "+r.ref})})});
  // люди: кто рядом (в пределах ~2 глав) — стоят рядом
  const groups={};{let cur=null,start=-1e9;people.slice().sort((a,b)=>a.v-b.v).forEach(pp=>{if(!cur||pp.v-start>34){start=pp.v;cur=String(Math.round(pp.v));groups[cur]=[]}groups[cur].push(pp)})}
  let meY=0;
  const drawPerson=(pp,x,y,j,crowd)=>{
    const col=pp.me?"var(--flame)":hashCol(pp.id), cid="pc"+pp.key.replace(/[^a-zA-Z0-9]/g,"")+j;
    const g=sv("g",{class:"pperson"+(pp.me?" me":"")});
    g.append(sv("circle",{cx:x,cy:y,r:16,fill:col,stroke:"var(--surface)","stroke-width":3}));
    if(pp.photo){const cp=sv("clipPath",{id:cid});cp.append(sv("circle",{cx:x,cy:y,r:13}));g.append(cp);
      g.append(sv("image",{href:pp.photo,x:x-13,y:y-13,width:26,height:26,"clip-path":"url(#"+cid+")",preserveAspectRatio:"xMidYMid slice",referrerpolicy:"no-referrer"}))}
    else g.append(sv("text",{x,y:y+5,"text-anchor":"middle",class:"pinit"},(pp.name||"?").trim().charAt(0).toUpperCase()));
    if(!crowd||pathZoom>=1.5){let nm=pp.me?"Вы":(pp.name||"").split(" ")[0];if(crowd&&nm.length>7)nm=nm.slice(0,6)+"…";g.append(sv("text",{x,y:y+30,"text-anchor":"middle",class:"pname"+(crowd?" small":"")},nm))}
    g.append(sv("title",{},(pp.me?"Вы":pp.name)+" · читает "+pp.ref));
    if(window.Ogonek&&window.Ogonek.onPersonClick){g.style.cursor="pointer";g.addEventListener("click",()=>window.Ogonek.onPersonClick(pp.me?"me":pp.id))}
    try{noteBadge(g,pp,x,y)}catch(e){}
    svg.append(g); if(pp.me&&!meY)meY=y;
  };
  Object.entries(groups).forEach(([key,gr])=>{
    gr.sort((a,b)=>(b.me?1:0)-(a.me?1:0)||a.v-b.v);
    const vv=gr[0].v, nx=X(vv), by=Y(vv), dir=nx>cx?-1:1;
    const space=dir>0?W-nx-34:nx-34, perRow=Math.max(1,Math.floor(space/36));
    const open=pathOpen.has(key), maxShow=open?gr.length:Math.min(gr.length,perRow*2+1);
    const shown=gr.length>maxShow?maxShow-1:maxShow;
    const crowd=gr.length>1, rowH=crowd&&pathZoom<1.5?38:46;
    drawPerson(gr[0],nx,by,0,crowd);
    for(let j=1;j<shown;j++){const q=j-1,r=Math.floor(q/perRow),c=q%perRow;drawPerson(gr[j],nx+dir*(34+c*36),by+r*rowH,j,crowd)}
    if(shown<gr.length){
      const q=shown-1,r=Math.floor(q/perRow),c=q%perRow,x=nx+dir*(34+c*36),y=by+r*rowH;
      const g=sv("g",{class:"pmore",tabindex:0,role:"button"});
      g.append(sv("circle",{cx:x,cy:y,r:16}));g.append(sv("text",{x,y:y+5,"text-anchor":"middle"},"+"+(gr.length-shown)));
      g.append(sv("title",{},gr.slice(shown).map(pp=>pp.name).join(", ")));
      const openIt=()=>{pathOpen.add(key);renderPath()};g.addEventListener("click",openIt);g.addEventListener("keydown",e=>{if(e.key==="Enter")openIt()});
      svg.append(g);
    }else if(open&&gr.length>perRow*2+1){
      const r=Math.ceil((gr.length-1)/perRow),x=nx+dir*34,y=by+r*rowH-8;
      const t=sv("text",{x,y,"text-anchor":dir>0?"start":"end",class:"pless"},"свернуть");
      t.addEventListener("click",()=>{pathOpen.delete(key);renderPath()});svg.append(t);
    }
  });
  svg.setAttribute("width",Math.round(W*pathZoom));svg.setAttribute("height",Math.round(H*pathZoom));
  box.textContent="";box.append(svg);
  $("pathSub").textContent="";
  const pb=$("pathBox");
  if(pb&&pathKeep){pb.scrollLeft=pathKeep.x*pb.scrollWidth-pb.clientWidth/2;pb.scrollTop=pathKeep.y*pb.scrollHeight-pb.clientHeight/2;pathKeep=null}
  else if(pb&&!pb.dataset.touched){pb.scrollTop=Math.max(0,meY*pathZoom-pb.clientHeight/2);pb.scrollLeft=(pb.scrollWidth-pb.clientWidth)/2}
  if(pb&&!pb.dataset.bound){pb.dataset.bound="1";["wheel","touchstart","pointerdown"].forEach(ev=>pb.addEventListener(ev,()=>{pb.dataset.touched="1"},{passive:true}))}
}

$("pzIn").addEventListener("click",()=>setPathZoom(pathZoom*1.25));
$("pzOut").addEventListener("click",()=>setPathZoom(pathZoom/1.25));
$("pzLevel").addEventListener("click",()=>setPathZoom(1));
$("pzMe").addEventListener("click",()=>{const pb=$("pathBox"),me=document.querySelector("#path .pperson.me circle");if(!pb||!me)return;
  const y=Number(me.getAttribute("cy"))*pathZoom, x=Number(me.getAttribute("cx"))*pathZoom;
  pb.scrollTo({top:Math.max(0,y-pb.clientHeight/2),left:Math.max(0,x-pb.clientWidth/2),behavior:"smooth"})});
$("pzLevel").textContent=Math.round(pathZoom*100)+"%";
(function(){ // Ctrl+колесо и щипок двумя пальцами
  const pb=$("pathBox"), pts=new Map(); let d0=0,z0=1;
  pb.addEventListener("wheel",e=>{if(!e.ctrlKey)return;e.preventDefault();setPathZoom(pathZoom*(e.deltaY<0?1.1:1/1.1))},{passive:false});
  const dist=()=>{const a=[...pts.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};
  pb.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch")return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2){d0=dist();z0=pathZoom}});
  pb.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2&&d0>0)setPathZoom(z0*dist()/d0)});
  ["pointerup","pointercancel","pointerleave"].forEach(t=>pb.addEventListener(t,e=>{pts.delete(e.pointerId);if(pts.size<2)d0=0}));
})();

/* ---------- schedule ---------- */
let selWeek=null;
const sel=$("wkSel");
for(let w=1;w<=Math.ceil(DAYS/7);w++){const o=el("option",null,shortDay((w-1)*7)+" – "+shortDay(Math.min(DAYS-1,w*7-1)));o.value=w;sel.append(o)}
function currentWeek(){return Math.floor(Math.min(Math.max(0,todayP()),DAYS-1)/7)+1}
function renderSchedule(){
  const w=selWeek||currentWeek(), max=Math.ceil(DAYS/7);
  sel.value=String(w); $("wkPrev").disabled=w<=1; $("wkNext").disabled=w>=max;
  const box=$("sched");box.textContent="";
  const rs=Object.fromEntries(KEYS.map(k=>[k,readSet(k)]));
  for(let i=0;i<7;i++){
    const p=(w-1)*7+i; if(p>=DAYS)break;
    const row=el("div","srow"+(p===todayP()?" snext":""));
    row.append(el("div","sday",(p===todayP()?"Сегодня · ":"")+dayLabel(p)));
    KEYS.forEach(k=>{
      const x=part(k,p), done=rs[k].has(p);
      const item=el("div","sitem"+(done?" sdone":""));
      const a=el("a","sref");a.href=chapterUrl(x);a.target="_blank";a.rel="noopener";a.title=FULL[x.book]||x.book;
      a.append(el("span","stag",T[k].short),el("span",null,refStr(x)));
      const c=el("button","scheck");c.type="button";
      c.setAttribute("aria-pressed",done?"true":"false");
      c.setAttribute("aria-label",(done?"Снять отметку: ":"Отметить прочитанным: ")+T[k].label+", "+dayLabel(p));
      c.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      schedCheck(c,k,p,done);
      item.append(a,c);row.append(item);
    });
    box.append(row);
  }
}
sel.addEventListener("change",()=>{selWeek=Number(sel.value);renderSchedule()});
$("wkPrev").addEventListener("click",()=>{selWeek=Math.max(1,(selWeek||currentWeek())-1);renderSchedule()});
$("wkNext").addEventListener("click",()=>{selWeek=Math.min(Math.ceil(DAYS/7),(selWeek||currentWeek())+1);renderSchedule()});

/* ---------- actions ---------- */
let toastT;
function toast(msg,action){
  const t=$("toast");t.textContent="";t.append(el("span",null,msg));
  if(action){const b=el("button","toastbtn",action.label);b.type="button";b.addEventListener("click",()=>{t.hidden=true;action.fn()});t.append(b)}
  t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,Math.max(action?6000:3500,msg.length*55));
}
/* two taps to confirm: first tap arms the button, second tap within 4 s confirms */
function confirmTap(btn,armedText,fn){
  btn.addEventListener("click",()=>{
    if(btn.dataset.armed){clearTimeout(btn._t);delete btn.dataset.armed;btn.classList.remove("armed");fn();return}
    btn.dataset.armed="1";btn.classList.add("armed");vibrate(12);
    const orig=btn.innerHTML;
    if(armedText)btn.textContent=armedText;else toast("Нажмите ещё раз, чтобы отметить прочитанным");
    btn._t=setTimeout(()=>{delete btn.dataset.armed;btn.classList.remove("armed");btn.innerHTML=orig},4000);
  });
}
/* undo: restores the exact state from before the last mark */
let undoSnap=null;
function undoLast(){
  if(!undoSnap)return;
  state=undoSnap.state;undoSnap=null;
  chestQueue=[];$("chest").hidden=true;$("celebrate").hidden=true;
  save();render();toast("Отметка отменена");
}
function undoMark(k,p){
  if(undoSnap&&undoSnap.k===k&&undoSnap.p===p)return undoLast();
  unmark(k,p);
}

/* ---------- awards: medals with their own emblems ---------- */
const TIERS={bronze:["#d08a4a","#8a5226"],silver:["#b9c1cf","#6f7888"],gold:["#f2b632","#a8730c"],ruby:["#e0475b","#951c30"],violet:["#8a6cf2","#4a32b0"],green:["#34a874","#1b6a48"],blue:["#3d93e2","#1f5896"],flame:["#ff8a33","#b8480a"]};
const IC={ // emblems drawn in a 64×64 box, light ink on the medal
  flame:n=>'<g transform="translate(19 9) scale(.4)"><path fill="#fff" d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z"/><path fill="#ffd36b" d="M32 40c4 8 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 6-12 0 4 2 7 5 7-2-5-2-11-1-16z"/></g><text x="32" y="51" text-anchor="middle" font-size="'+(n.length>2?11:13)+'" font-weight="800" fill="#fff" font-family="Golos Text,system-ui,sans-serif">'+n+'</text>',
  book:t=>'<path fill="#fff" d="M13 20c7-3 13-3 18 1v24c-5-4-11-4-18-1z"/><path fill="#fff" opacity=".85" d="M51 20c-7-3-13-3-18 1v24c5-4 11-4 18-1z"/><text x="32" y="56" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="Golos Text,system-ui,sans-serif">'+t+'</text>',
  gospels:()=>'<g fill="#fff"><rect x="15" y="20" width="7" height="24" rx="1.5"/><rect x="24" y="16" width="7" height="28" rx="1.5" opacity=".9"/><rect x="33" y="18" width="7" height="26" rx="1.5"/><rect x="42" y="22" width="7" height="22" rx="1.5" opacity=".9"/></g><rect x="13" y="45" width="38" height="3" rx="1.5" fill="#fff" opacity=".7"/>',
  fire3:()=>'<g fill="#fff"><path d="M20 44c-5 0-7-4-6-8 1-3 4-5 4-9 3 3 8 7 8 11s-2 6-6 6z"/><path d="M32 44c-6 0-9-5-7-10 1-4 5-6 5-12 4 4 9 9 9 14 0 5-3 8-7 8z"/><path d="M44 44c-4 0-6-2-6-6 0-4 5-8 8-11 0 4 3 6 4 9 1 4-1 8-6 8z"/></g>',
  sun:()=>'<circle cx="32" cy="32" r="8" fill="#fff"/><g stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M32 13v6M32 45v6M13 32h6M45 32h6M18.5 18.5l4.2 4.2M41.3 41.3l4.2 4.2M18.5 45.5l4.2-4.2M41.3 22.7l4.2-4.2"/></g>',
  tablets:()=>'<g fill="#fff"><path d="M14 46V24a8 8 0 0 1 16 0v22z"/><path d="M34 46V24a8 8 0 0 1 16 0v22z" opacity=".9"/></g><g stroke="#8a6a3a" stroke-width="1.6" opacity=".55"><path d="M18 27h8M18 32h8M18 37h8M38 27h8M38 32h8M38 37h8"/></g>',
  wheat:()=>'<path d="M32 50V18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><g fill="#fff"><ellipse cx="32" cy="16" rx="3" ry="5"/><ellipse cx="27" cy="23" rx="3" ry="5" transform="rotate(-30 27 23)"/><ellipse cx="37" cy="23" rx="3" ry="5" transform="rotate(30 37 23)"/><ellipse cx="27" cy="31" rx="3" ry="5" transform="rotate(-30 27 31)"/><ellipse cx="37" cy="31" rx="3" ry="5" transform="rotate(30 37 31)"/><ellipse cx="27" cy="39" rx="3" ry="5" transform="rotate(-30 27 39)"/><ellipse cx="37" cy="39" rx="3" ry="5" transform="rotate(30 37 39)"/></g>',
  quill:()=>'<path fill="#fff" d="M46 14c-12 2-22 12-25 26l-3 8 4-3c12-2 21-12 24-31z"/><path d="M20 49l10-14" stroke="#7a2a3a" stroke-width="1.6" opacity=".5"/><rect x="14" y="50" width="22" height="2.6" rx="1.3" fill="#fff" opacity=".7"/>',
  quiz:()=>'<path fill="#fff" d="M14 16h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H30l-9 8v-8h-7a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4z"/><path d="M27 25.5a5 5 0 1 1 7.5 4.3c-1.6.9-2.5 1.8-2.5 3.7" stroke="#1f5896" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="38.5" r="1.9" fill="#1f5896"/>',
  crown:()=>'<path fill="#fff" d="M14 42l-2-20 11 9 9-14 9 14 11-9-2 20z"/><rect x="14" y="44" width="36" height="5" rx="2" fill="#fff"/><g fill="#e0475b"><circle cx="32" cy="34" r="2.4"/><circle cx="22" cy="37" r="1.8"/><circle cx="42" cy="37" r="1.8"/></g>'
};
function medalSvg(a,size){
  const [c1,c2]=TIERS[a.tier], g="mg"+a.id;
  return '<svg viewBox="0 0 64 64" width="'+(size||52)+'" height="'+(size||52)+'" aria-hidden="true"><defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs>'+
    '<circle cx="32" cy="32" r="31" fill="'+c2+'"/><circle cx="32" cy="32" r="27.5" fill="url(#'+g+')"/><circle cx="32" cy="32" r="27.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>'+
    '<path d="M12 22a22 22 0 0 1 40 0" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>'+a.icon+'</svg>';
}
const quizRight=()=>Object.values(state.quiz||{}).filter(x=>x&&x.ok&&(x.first||(x.first===undefined&&x.pick!==undefined))).length;
// книга прочитана: в её дорожке пройден последний день с этой книгой (книги нет в расписании — награды нет)
function bookLast(b){for(const k of KEYS){let L=-1;PLAN.forEach((d,i)=>{if(d[T[k].bi]===b&&(L<0||i===L+1))L=i});if(L>=0)return {k,L}}return null}
const bookDone=b=>{const x=bookLast(b);return !!x&&nextP(x.k)>x.L};
const AWARDS=[
  {id:"s3",name:"Первая искра",desc:"3 дня подряд читать оба завета",tier:"bronze",icon:IC.flame("3"),ok:()=>state.best>=3},
  {id:"s7",name:"Неделя",desc:"7 дней подряд",tier:"silver",icon:IC.flame("7"),ok:()=>state.best>=7},
  {id:"s30",name:"Месяц",desc:"30 дней подряд",tier:"gold",icon:IC.flame("30"),ok:()=>state.best>=30},
  {id:"s100",name:"Сто дней",desc:"100 дней подряд",tier:"ruby",icon:IC.flame("100"),ok:()=>state.best>=100},
  {id:"s364",name:"Год без пропусков",desc:"364 дня подряд",tier:"flame",icon:IC.flame("364"),ok:()=>state.best>=364},
  {id:"mt",name:"Матфей",desc:"Прочитано Евангелие по Матфею",tier:"blue",icon:IC.book("МФ"),book:"Мф.",ok:()=>bookDone("Мф.")},
  {id:"gosp",name:"Четыре Евангелия",desc:"Прочитаны все четыре Евангелия",tier:"violet",icon:IC.gospels(),book:"Ин.",ok:()=>["Мф.","Мк.","Лк.","Ин."].every(bookDone)},
  {id:"acts",name:"Деяния",desc:"Прочитана книга Деяний",tier:"ruby",icon:IC.fire3(),book:"Деян.",ok:()=>bookDone("Деян.")},
  {id:"gen",name:"Бытие",desc:"Прочитана книга Бытия",tier:"gold",icon:IC.sun(),book:"Быт.",ok:()=>bookDone("Быт.")},
  {id:"pent",name:"Пятикнижие",desc:"Прочитаны пять книг Моисея",tier:"silver",icon:IC.tablets(),book:"Втор.",ok:()=>["Быт.","Исх.","Лев.","Числ.","Втор."].every(bookDone)},
  {id:"ruth",name:"Судьи и Руфь",desc:"Прочитаны книги Судей и Руфь",tier:"green",icon:IC.wheat(),book:"Руфь",ok:()=>bookDone("Суд.")&&bookDone("Руфь")},
  {id:"quiz10",name:"Знаток текста",desc:"10 верных ответов с первого раза",tier:"blue",icon:IC.quiz(),ok:()=>quizRight()>=10},
  {id:"year",name:"Первый год плана",desc:"Прочитаны все 364 дня первого года — половина Библии позади",tier:"gold",icon:IC.crown(),ok:()=>KEYS.every(k=>state[k].read.length>=(SCHED.spb?Math.min(364,DAYS):DAYS))},
  {id:"bible",name:"Вся Библия",desc:"Прочитаны все 728 дней — вся Библия за 2 года",tier:"flame",icon:IC.crown(),ok:()=>KEYS.every(k=>state[k].read.length>=DAYS)}
];
if(!SCHED.spb){const y=AWARDS.find(a=>a.id==="year");if(y){y.name="Расписание пройдено";y.desc="Прочитаны все дни расписания «"+SCHED.name+"»"}}
function awards(){return AWARDS.filter(a=>!a.book||bookLast(a.book)).filter(a=>a.id!=="quiz10"||SCHED.spb||quizRight()>0).filter(a=>a.id!=="bible"||SCHED.spb).map(a=>Object.assign({},a,{ok:a.ok()}))}

/* new award → chest pops up; tap to open it and reveal the medal */
let chestQueue=[];
function checkAwards(){
  if(!state.seenAwards)state.seenAwards=[];
  const fresh=AWARDS.filter(a=>a.ok()&&!state.seenAwards.includes(a.id));
  if(!fresh.length)return;
  fresh.forEach(a=>{state.seenAwards.push(a.id);chestQueue.push(a)});
  save();
  showChest();
}
function showChest(){
  const ov=$("chest");
  if(!ov.hidden||!$("celebrate").hidden||!chestQueue.length)return;
  const a=chestQueue[0];
  ov.classList.remove("open");
  $("chestTitle").textContent="Новая награда!";
  $("chestSub").textContent="Вы заслужили награду. Откройте сундук, чтобы увидеть её.";
  $("chestMedal").innerHTML=medalSvg(a,120);
  $("chestName").textContent=a.name;$("chestDesc").textContent=a.desc;
  $("chestBtn").textContent="Открыть сундук";
  $("toast").hidden=true;ov.hidden=false;$("chestBtn").focus();
  vibrate([30,40,30]);
}
$("chestBtn").addEventListener("click",()=>{
  const ov=$("chest");
  if(!ov.classList.contains("open")){
    ov.classList.add("open");
    $("chestTitle").textContent="Поздравляем!";
    $("chestSub").textContent="";
    $("chestBtn").textContent=chestQueue.length>1?"Следующая награда":"Забрать награду";
    vibrate([80,50,80,50,200]);
    const r=$("chestArt").getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height*.4,70);
  }else{
    chestQueue.shift();ov.hidden=true;ov.classList.remove("open");
    setTimeout(showChest,250);
  }
});

function complete(k,pp){
  const st=state[k], p=(pp==null?nextP(k):pp); if(p>=DAYS||readSet(k).has(p))return;
  undoSnap={state:JSON.parse(JSON.stringify(state)),k,p};const bkB=bkSnap();
  const wasAhead=ahead[k]; ahead[k]=false;
  const t=today(), firstK=!datesOf(k).has(t), bothBefore=bothSet().has(t), awBefore=awards().filter(a=>a.ok).length;
  const frzBefore=freezesNow();
  const fromEl=document.querySelectorAll("#testaments .tcard")[KEYS.indexOf(k)], fromBox=fromEl&&(fromEl.querySelector(".nextmark")||fromEl).getBoundingClientRect();
  st.log.push({d:t,p}); st.read.push(p);
  try{autoRepair()}catch(e){console.warn(e)} // дочитали вчерашнее — серия возвращается до подсчёта праздника
  let gain=XP_PART;
  const bothNow=!bothBefore&&bothSet().has(t);
  const common=streak();
  state.best=Math.max(state.best,common);
  if(bothNow)gain+=XP_BOTH;
  state.xp+=gain;
  save(); render();
  const newAw=awards().filter(a=>a.ok).length-awBefore;
  if(firstK){ignite($("flame-"+k),bothNow?0:1); if(!bothNow)ignite($("heroFlame"),0);} // в большом огне загорается маленький огонёк
  else{const ms=document.querySelectorAll("#minis-"+k+" .mini");ignite(ms[ms.length-1],1)}
  if(bothNow){
    ignite($("heroFlame"),2);
    $("celebNum").textContent=common;
    $("celebText").textContent="Общий огонёк: "+plural(common,"день","дня","дней")+" подряд!";
    const lines=["Оба завета прочитаны"];if(freezesNow()>frzBefore)lines.push("Заморозок: "+freezesNow());if(newAw>0)lines.push("Новая награда!");
    $("celebSub").textContent=lines.join(" · ");
    $("toast").hidden=true;$("celebrate").hidden=false;$("celebClose").focus();
    const cf=document.querySelector("#celebrate .flame");cf.classList.remove("ignite");void cf.getBoundingClientRect();cf.classList.add("ignite");
    burst(window.innerWidth/2,window.innerHeight/2-60,90);
  }else if(firstK){
    const s=streak(k);
    toast(T[k].label+": "+s+" "+plural(s,"день подряд","дня подряд","дней подряд")+(newAw>0?" · Новая награда!":""),{label:"Отменить",fn:undoLast});
  }else{
    toast("Огонёк зажжён: "+refStr(part(k,p))+(newAw>0?" · Новая награда!":""),{label:"Отменить",fn:undoLast});
  }
  const frzAfter=freezesNow();
  if(frzAfter>frzBefore&&!bothNow)flyFreeze(fromBox,frzBefore,frzAfter);
  checkAwards();
  try{bkCheck(bkB)}catch(e){console.warn(e)}
  try{askVerseSoon(k,p,bothNow?700:1400)}catch(e){console.warn(e)}
}
/* снежинка заморозки летит от кнопки к плашке «Заморозки» */
function flyFreeze(fromBox,before,after){
  const chip=$("freezeChip"), txt=$("freezeText"); if(!chip)return;
  txt.textContent="Заморозки: "+before;
  const go=()=>{
    const fr=fromBox||{left:innerWidth/2-20,top:innerHeight/2,width:40,height:40}, to=chip.querySelector("svg").getBoundingClientRect();
    const sx=fr.left+fr.width/2, sy=fr.top+fr.height/2, tx=to.left+to.width/2, ty=to.top+to.height/2;
    const f=el("div","frzfly");f.innerHTML=chip.querySelector("svg").outerHTML;document.body.append(f);
    f.style.left=(sx-22)+"px";f.style.top=(sy-22)+"px";
    const dx=tx-sx, dy=ty-sy, mx=dx*0.35+(dx>0?-60:60), my=Math.min(dy*0.5,-80);
    vibrate(20);
    const done=()=>{f.remove();iceSound();txt.textContent="Заморозки: "+after;chip.classList.remove("frzpop");void chip.offsetWidth;chip.classList.add("frzpop");vibrate([30,40,60]);
      toast("Заморозка получена! Теперь их: "+after)};
    if(reduceMotion()||!f.animate){done();return}
    const a=f.animate([
      {transform:"translate(0,0) scale(.6) rotate(0deg)",opacity:0},
      {transform:"translate(0,-24px) scale(1.5) rotate(60deg)",opacity:1,offset:.18},
      {transform:"translate("+mx+"px,"+my+"px) scale(1.3) rotate(200deg)",opacity:1,offset:.55},
      {transform:"translate("+dx+"px,"+dy+"px) scale(.45) rotate(360deg)",opacity:.9}
    ],{duration:1100,easing:"cubic-bezier(.4,.1,.3,1)"});
    a.onfinish=done;
  };
  const r=chip.getBoundingClientRect();
  if(r.top<8||r.bottom>innerHeight-8){
    // плашка за экраном — сначала показываем её, затем запускаем снежинку от середины экрана
    const y=scrollY+r.top-90; scrollTo({top:Math.max(0,y),behavior:reduceMotion()?"auto":"smooth"});
    fromBox={left:innerWidth/2-20,top:innerHeight*0.7,width:40,height:40};
    setTimeout(go,550);
  }else go();
}
function unmark(k,p){
  const st=state[k]; if(!readSet(k).has(p))return;
  st.read=st.read.filter(x=>x!==p); st.log=st.log.filter(x=>x.p!==p);
  state.xp=Math.max(0,state.xp-XP_PART);
  save(); render(); toast("Отметка снята · "+T[k].label+", "+dayLabel(p));
}
$("celebUndo").addEventListener("click",undoLast);
$("celebClose").addEventListener("click",()=>{$("celebrate").hidden=true;setTimeout(showChest,250)});




/* ---------- Алмазы: тест из 10 вопросов, вопросы не повторяются ---------- */
const GEM_LADDER=[1,5,10,20], GEM_UNLOCK=10, GEM_N=10;
// главы: глава закрыта, когда прочитаны все отрывки плана, которые её касаются
// главы отрывка: «3:1–4:22» → [3,4], «5:1–20» → [5,5], «2–4» → [2,4], «7» → [7,7]
function chapRange(ref){let m=/^(\d+):\d+[–—-](\d+):\d+$/.exec(ref);if(m)return [+m[1],+m[2]];m=/^(\d+)[–—-](\d+)$/.exec(ref);if(m)return [+m[1],+m[2]];const a=parseInt(ref,10)||1;return [a,a]}
const CHAPTERS=(()=>{const m=new Map();
  PLAN.forEach((d,p)=>KEYS.forEach(k=>{const book=d[T[k].bi],ref=d[T[k].ri];if(!book||!ref||!BOOK[book])return;
    const [a,b]=chapRange(ref), tk=BOOK[book].t; // ключ вопроса — по завету книги: "nt|Мф.|5"
    for(let c=a;c<=b;c++){const key=tk+"|"+book+"|"+c;if(!m.has(key))m.set(key,{k,ps:[]});m.get(key).ps.push(p)}
  }));
  return [...m.entries()].map(([key,x])=>{const [,book,c]=key.split("|");return {key,k:x.k,book,c:+c,ps:x.ps}});
})();
function chaptersDone(){const r=Object.fromEntries(KEYS.map(k=>[k,readSet(k)]));return CHAPTERS.filter(c=>c.ps.every(p=>r[c.k].has(p))).length}
function gemPool(){
  const used=new Set(state.gems.used), out=[];
  KEYS.forEach(k=>state[k].read.forEach(p=>{
    [[2,QUIZ2],[1,QUIZ]].forEach(([b,Q])=>{const id=b+"-"+k+"-"+p;if(Q[p]&&Q[p][k]&&!used.has(id))out.push({id,b,k,p,q:Q[p][k]})});
  }));
  // вопросы «В какой главе…» — по полностью прочитанным главам
  const r=Object.fromEntries(KEYS.map(k=>[k,readSet(k)]));
  CHAPTERS.forEach(ch=>{const q=QCH[ch.key], id="3-"+ch.key; if(!q||used.has(id)||!ch.ps.every(p=>r[ch.k].has(p)))return;
    const max=BOOKCH[ch.book]||ch.c+4, near=[];for(let d=-4;d<=4;d++){const x=ch.c+d;if(d&&x>=1&&x<=max)near.push(x)}
    const w=shuffled(near,ch.c*7+ch.book.length).slice(0,2);
    out.push({id,b:3,k:ch.k,p:ch.ps[ch.ps.length-1],chap:ch,q:[q,"Глава "+ch.c,"Глава "+w[0],"Глава "+w[1]]});
  });
  return out;
}
const BOOKCH=Object.fromEntries(BOOKS.map(b=>[b.a,b.v.length]));
const gemNext=()=>GEM_LADDER[Math.min(state.gems.step,GEM_LADDER.length-1)];
function renderGems(){
  const g=state.gems, box=$("gemsBody"); if(!box)return; box.textContent=""; box.className="gemsbody";
  $("gemCount").textContent=g.n;
  const ch=chaptersDone(), sum=$("gemSum");
  if(sum)sum.textContent=ch<GEM_UNLOCK?ch+" из "+GEM_UNLOCK+" глав":(gemPool().length>=GEM_N?"тест готов":"");
  if(ch<GEM_UNLOCK){
    box.append(el("p","muted","Тест откроется, когда вы прочитаете "+GEM_UNLOCK+" глав. Прочитано полностью: "+ch+" из "+GEM_UNLOCK+"."));
    const bar=el("div","gbar"),i=el("i");i.style.width=(ch/GEM_UNLOCK*100)+"%";bar.append(i);box.append(bar);
    box.append(el("p","hint","Тест — 10 вопросов. 10 из 10 подряд дают 1, 5, 10, 20 алмазов."));
    return;
  }
  const lad=el("div","ladder");
  GEM_LADDER.forEach((v,i)=>{const st=el("div","lstep"+(i<g.step?" done":"")+(i===Math.min(g.step,GEM_LADDER.length-1)?" cur":""));
    const b=el("b");b.append(el("span","gemicon"),document.createTextNode(String(v)));
    st.append(b,el("span",null,i===GEM_LADDER.length-1?(i+1)+"-й и далее":(i+1)+"-й тест"));lad.append(st)});
  box.append(lad);
  const pool=gemPool();
  box.append(el("p","muted",g.step?"Идеальных тестов подряд: "+g.step+". Следующий 10 из 10 даст "+gemNext()+" "+plural(gemNext(),"алмаз","алмаза","алмазов")+". Одна ошибка — и лестница начнётся сначала.":"Ответьте на 10 из 10 — получите "+gemNext()+" "+plural(gemNext(),"алмаз","алмаза","алмазов")+". Каждый следующий идеальный тест подряд даёт больше."));
  if(pool.length>=GEM_N){
    const b=el("button","btn-gem","Начать тест · 10 вопросов");b.type="button";b.addEventListener("click",startGemTest);box.append(b);
  }else{
    box.append(el("p","hint","Все вопросы по прочитанному уже были в тестах. Прочитайте новые отрывки — накопится "+GEM_N+" новых вопросов (сейчас "+pool.length+")."));
  }
  if(g.tests)box.append(el("p","hint","Тестов: "+g.tests+", из них 10 из 10: "+g.perfect+". Вопросов в запасе: "+pool.length+"."));
}
let gemRun=null;
function closeGem(){const m=document.querySelector(".gmodal");if(m)m.remove();document.removeEventListener("keydown",gemEsc)}
function gemEsc(e){if(e.key==="Escape"&&gemRun&&gemRun.done)closeGem()}
function startGemTest(){
  const pool=gemPool(); if(pool.length<GEM_N)return;
  // сначала вопросы второй базы, затем первой; внутри — случайно
  const rnd=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  // до 4 вопросов «в какой главе», остальные — по тексту прочитанных отрывков
  const chq=rnd(pool.filter(x=>x.b===3)).slice(0,4);
  const pick=chq.concat(rnd(pool.filter(x=>x.b===2)),rnd(pool.filter(x=>x.b===1)),rnd(pool.filter(x=>x.b===3)).filter(x=>!chq.includes(x))).slice(0,GEM_N);
  rnd(pick);
  // вопросы считаются использованными сразу: тест нельзя «переиграть»
  state.gems.used=state.gems.used.concat(pick.map(x=>x.id)); state.gems.tests++;
  gemRun={qs:pick,i:0,res:[],done:false}; state.gems.open=1; save();
  closeGem();
  const modal=el("div","fmodal gmodal"), sheet=el("div","fsheet gtest");
  sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
  modal.append(sheet);document.body.append(modal);document.addEventListener("keydown",gemEsc);
  drawGemQ();
}
function drawGemQ(){
  const sheet=document.querySelector(".gmodal .fsheet"); if(!sheet)return; sheet.textContent="";
  const r=gemRun, it=r.qs[r.i];
  const head=el("div","fhead"), ht=el("div");
  ht.append(el("h2",null,"Вопрос "+(r.i+1)+" из "+GEM_N),el("div","hint","Нужно 10 из 10"));
  const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Прервать тест");
  x.addEventListener("click",()=>{
    if(x.dataset.armed){finishGem(true);return}
    x.dataset.armed="1";toast("Нажмите × ещё раз: тест будет прерван, вопросы сгорят");setTimeout(()=>delete x.dataset.armed,3500);
  });
  head.append(ht,x);
  const prog=el("div","gprog");for(let i=0;i<GEM_N;i++)prog.append(el("i",i<r.res.length?(r.res[i]?"ok":"no"):i===r.i?"now":null));
  const ref=el("div","qref",it.chap?FULL[it.chap.book]+" · вопрос о главе":T[it.k].label+" · "+refStr(part(it.k,it.p)));
  const q=el("div","qtext",it.q[0]);
  const opts=el("div","qopts");
  const order=[it.q[1],it.q[2],it.q[3]];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  order.forEach(o=>{const b=el("button","qopt");b.type="button";const mark=el("span","qmark");b.append(el("span",null,o),mark);
    b.addEventListener("click",()=>{
      const ok=o===it.q[1]; r.res.push(ok);
      opts.querySelectorAll("button").forEach(btn=>{btn.disabled=true;const t=btn.firstChild.textContent;
        if(t===it.q[1]){btn.classList.add("right");btn.querySelector(".qmark").innerHTML=CHECK_SVG}
        else if(btn===b){btn.classList.add("wrong");btn.querySelector(".qmark").innerHTML=CROSS_SVG}});
      vibrate(ok?[30]:[160]);
      prog.children[r.i].className=ok?"ok":"no";
      setTimeout(()=>{r.i++; if(r.i>=GEM_N)finishGem(false); else drawGemQ()},ok?900:1800);
    });
    opts.append(b)});
  sheet.append(head,prog,ref,q,opts);
  const f=opts.querySelector("button");if(f)f.focus();
}
function finishGem(aborted){
  const r=gemRun, g=state.gems, right=r.res.filter(Boolean).length, perfect=!aborted&&right===GEM_N;
  let gain=0;
  if(perfect){gain=gemNext();g.n+=gain;g.step++;g.perfect++}else g.step=0;
  delete g.open; r.done=true; save(); render();
  const sheet=document.querySelector(".gmodal .fsheet"); if(!sheet){gemRun=null;return}
  sheet.textContent="";sheet.className="fsheet gresult";
  sheet.append(el("span","gemicon"));
  sheet.append(el("div","score",(aborted?r.res.filter(Boolean).length:right)+" из "+GEM_N));
  if(perfect){
    sheet.append(el("div","gain","+"+gain+" "+plural(gain,"алмаз","алмаза","алмазов")));
    sheet.append(el("p","muted","Следующий тест 10 из 10 даст "+gemNext()+" "+plural(gemNext(),"алмаз","алмаза","алмазов")+"."));
    const rc=sheet.getBoundingClientRect();burst(rc.left+rc.width/2,rc.top+80,48);vibrate([60,40,60,40,200]);
  }else{
    sheet.append(el("p","muted",aborted?"Тест прерван. Лестница начнётся сначала: следующий 10 из 10 даст 1 алмаз.":"Алмазы даются только за 10 из 10. Лестница начнётся сначала: следующий идеальный тест даст 1 алмаз."));
  }
  const b=el("button","btn-main","Готово");b.type="button";b.addEventListener("click",()=>{closeGem();gemRun=null});
  sheet.append(b);b.focus();
}
// тест, брошенный при закрытии страницы, считается прерванным
if(state.gems.open){delete state.gems.open;state.gems.step=0;save()}

/* в карточках заветов двойное нажатие не увеличивает экран:
   нажатие на кнопку обрабатываем сами и отменяем стандартный жест браузера */
(function(){
  const box=$("testaments"); let sx=0, sy=0, moved=false, last=0;
  box.addEventListener("touchstart",e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;moved=false},{passive:true});
  box.addEventListener("touchmove",e=>{const t=e.touches[0];if(Math.abs(t.clientX-sx)>10||Math.abs(t.clientY-sy)>10)moved=true},{passive:true});
  box.addEventListener("touchend",e=>{
    const now=Date.now(), quick=now-last<400; last=now;
    if(moved)return;
    const b=e.target.closest("button");
    if(b&&!b.disabled){e.preventDefault();b.click();return}   // кнопка: сразу нажимаем, без зума
    if(quick&&!e.target.closest("a"))e.preventDefault();       // двойной тап по пустому месту — без зума
  },{passive:false});
  box.addEventListener("dblclick",e=>e.preventDefault());
})();
$("freezeChip").addEventListener("click",()=>toast("Заморозка — это день, прочитанный заранее, впереди графика. Прочитайте следующий день в обоих заветах — получите заморозку. Если отстаёте от плана, сначала догоните его. Пропустите день — заморозка сохранит серию."));
/* ---------- установка на экран телефона ---------- */
(function(){
  if(window.self!==window.top)return; // внутри Claude не показываем
  const standalone=()=>(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
  const INST="ogonek-installed", lsg=k=>{try{return localStorage.getItem(k)}catch(e){return null}}, lss=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
  // открыто как приложение (со значка) — запоминаем, что Огонёк установлен, и больше не предлагаем
  if(standalone()){lss(INST,"1");return}
  if(lsg(INST))return;
  const ua=navigator.userAgent, isIOS=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&"ontouchend" in document), isAndroid=/Android/.test(ua);
  let deferred=null; const HIDE="ogonek-install-hide";
  // предложение показывается раз в день: после показа (или «×») — снова только завтра, пока Огонёк не установлен
  const hidden=()=>lsg(HIDE)===today();
  const card=$("installCard"), link=$("installLink");
  link.hidden=false; link.addEventListener("click",()=>openGuide());
  const show=()=>{if(hidden())return;card.hidden=false;lss(HIDE,today())};
  if(isIOS||isAndroid)show();
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;show()});
  const installed=()=>{lss(INST,"1");card.hidden=true;link.hidden=true};
  window.addEventListener("appinstalled",()=>{installed();toast("Огонёк добавлен на экран!")});
  // Android/Chrome умеет сказать, что приложение уже установлено
  if(navigator.getInstalledRelatedApps)navigator.getInstalledRelatedApps().then(a=>{if(a&&a.length)installed()}).catch(()=>{});
  $("installHide").addEventListener("click",()=>{card.hidden=true;lss(HIDE,today())});
  $("installGo").addEventListener("click",async()=>{
    if(deferred){deferred.prompt();try{const r=await deferred.userChoice;if(r.outcome==="accepted")card.hidden=true}catch(e){}deferred=null;return}
    openGuide();
  });
  const SHARE='<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const PLUS='<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const DOTS='<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>';
  const ico='<img src="icon-192.png" alt="">';
  const host=location.host||"bible-fire.ru";
  const STEPS={
    ios:[
      ["Откройте Огонёк в браузере <b>Safari</b> (синий компас). В других браузерах на iPhone так не получится.",'<div class="url">'+'<span>🔒</span><b>'+host+'</b></div>'],
      ["Внизу экрана нажмите кнопку <b>«Поделиться»</b> — квадрат со стрелкой вверх.",'<div class="bar"><span>‹</span><span>›</span><span class="hl">'+SHARE+'</span><span>📖</span><span>⧉</span></div>'],
      ["В появившемся списке пролистайте вниз и нажмите <b>«На экран „Домой“»</b>.",'<div class="menu"><div>Скопировать <span>⧉</span></div><div>Добавить в закладки <span>📖</span></div><div class="hl">На экран «Домой» <span>'+PLUS+'</span></div></div>'],
      ["Справа вверху нажмите <b>«Добавить»</b>.",'<div class="addhdr"><span>Отменить</span><span class="hl">Добавить</span></div>'],
      ["Готово! На экране телефона появился значок Огонька — нажимайте на него, как на приложение.",'<div class="home"><i></i><i></i><span>'+ico+'</span><i></i><em></em><em></em><em><b>Огонёк</b></em><em></em></div>']
    ],
    android:[
      ["Откройте Огонёк в браузере <b>Chrome</b> (цветной круг).",'<div class="url"><span>🔒</span><b>'+host+'</b><span>'+DOTS+'</span></div>'],
      ["Справа вверху нажмите <b>три точки ⋮</b>.",'<div class="url"><span>🔒</span><b>'+host+'</b><span class="hl" style="border-radius:50%;padding:4px">'+DOTS+'</span></div>'],
      ["В меню нажмите <b>«Добавить на главный экран»</b> (или <b>«Установить приложение»</b>).",'<div class="menu"><div>Новая вкладка</div><div>История</div><div class="hl">Добавить на главный экран <span>'+PLUS+'</span></div></div>'],
      ["Нажмите <b>«Установить»</b> или <b>«Добавить»</b>.",'<div class="addhdr"><span>Отмена</span><span class="hl">Установить</span></div>'],
      ["Готово! Значок Огонька появится на экране телефона.",'<div class="home"><i></i><i></i><span>'+ico+'</span><i></i><em></em><em></em><em><b>Огонёк</b></em><em></em></div>']
    ]
  };
  function openGuide(){
    let tab=isIOS?"ios":"android";
    const modal=el("div","fmodal"),sheet=el("div","fsheet iguide");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
    const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};
    modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
    const draw=()=>{
      sheet.textContent="";
      const head=el("div","fhead"),h=el("h2",null,"Огонёк на экран телефона");const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);head.append(h,x);
      const tabs=el("div","itabs");[["ios","iPhone"],["android","Android"]].forEach(([k,t])=>{const b=el("button","itab"+(tab===k?" on":""),t);b.type="button";b.addEventListener("click",()=>{tab=k;draw()});tabs.append(b)});
      const ol=el("ol","isteps");STEPS[tab].forEach(([txt,mock])=>{const li=el("li"),p=el("p");p.innerHTML="<span>"+txt+"</span>";const m=el("div","mock");m.innerHTML=mock;li.append(p,m);ol.append(li)});
      const ok=el("button","btn-main","Понятно");ok.type="button";ok.addEventListener("click",close);
      sheet.append(head,tabs,ol,ok);
    };
    draw();modal.append(sheet);document.body.append(modal);
  }
})();
/* ---------- путеводитель: что такое Библия и как устроено приложение ---------- */
(function(){
  const G={law:["Закон (Пятикнижие)","#c2410c"],hist:["Исторические книги","#e8650a"],poet:["Поэтические книги","#d4a017"],proph:["Пророки","#9a6b3f"],
    gosp:["Евангелия","#6b4fd8"],acts:["Деяния","#1d6fd6"],ep:["Послания","#0e9aa7"],rev:["Откровение","#c7559c"]};
  const OT=[["Бытие",50,"law"],["Исход",40,"law"],["Левит",27,"law"],["Числа",36,"law"],["Второзаконие",34,"law"],["Иисус Навин",24,"hist"],["Судьи",21,"hist"],["Руфь",4,"hist"],["1 Царств",31,"hist"],["2 Царств",24,"hist"],["3 Царств",22,"hist"],["4 Царств",25,"hist"],["1 Паралипоменон",29,"hist"],["2 Паралипоменон",36,"hist"],["Эздра",10,"hist"],["Неемия",13,"hist"],["Эсфирь",10,"hist"],["Иов",42,"poet"],["Псалмы",150,"poet"],["Притчи",31,"poet"],["Экклезиаст",12,"poet"],["Песнь Песней",8,"poet"],["Исайя",66,"proph"],["Иеремия",52,"proph"],["Плач Иеремии",5,"proph"],["Иезекииль",48,"proph"],["Даниил",12,"proph"],["Осия",14,"proph"],["Иоиль",3,"proph"],["Амос",9,"proph"],["Авдий",1,"proph"],["Иона",4,"proph"],["Михей",7,"proph"],["Наум",3,"proph"],["Аввакум",3,"proph"],["Софония",3,"proph"],["Аггей",2,"proph"],["Захария",14,"proph"],["Малахия",4,"proph"]];
  const NT=[["Евангелие по Матфею",28,"gosp"],["Евангелие по Марку",16,"gosp"],["Евангелие по Луке",24,"gosp"],["Евангелие по Иоанну",21,"gosp"],["Деяния",28,"acts"],["Римлянам",16,"ep"],["1 Коринфянам",16,"ep"],["2 Коринфянам",13,"ep"],["Галатам",6,"ep"],["Эфесянам",6,"ep"],["Филиппийцам",4,"ep"],["Колоссянам",4,"ep"],["1 Фессалоникийцам",5,"ep"],["2 Фессалоникийцам",3,"ep"],["1 Тимофею",6,"ep"],["2 Тимофею",4,"ep"],["Титу",3,"ep"],["Филимону",1,"ep"],["Евреям",13,"ep"],["Иакова",5,"ep"],["1 Петра",5,"ep"],["2 Петра",3,"ep"],["1 Иоанна",5,"ep"],["2 Иоанна",1,"ep"],["3 Иоанна",1,"ep"],["Иуды",1,"ep"],["Откровение",22,"rev"]];
  const inPlan=new Set(KEYS.flatMap(k=>PLAN.map(d=>FULL[d[T[k].bi]]).filter(Boolean)));
  const SNOW='<svg viewBox="0 0 24 24"><g fill="none" stroke="var(--ice)" stroke-width="1.9" stroke-linecap="round"><path d="M12 2.5v19M8.8 4.6L12 7.2l3.2-2.6M8.8 19.4l3.2-2.6 3.2 2.6"/><g transform="rotate(60 12 12)"><path d="M12 2.5v19M8.8 4.6L12 7.2l3.2-2.6M8.8 19.4l3.2-2.6 3.2 2.6"/></g><g transform="rotate(120 12 12)"><path d="M12 2.5v19M8.8 4.6L12 7.2l3.2-2.6M8.8 19.4l3.2-2.6 3.2 2.6"/></g></g></svg>';
  const fl=(o)=>'<svg viewBox="0 0 64 80"><path d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z" fill="'+(o?"var(--off)":"var(--flame)")+'"/><path d="M32 40c4 8 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 6-12 0 4 2 7 5 7-2-5-2-11-1-16z" fill="'+(o?"var(--flame)":"var(--flame2)")+'"/></svg>';
  const GEM='<span class="gemicon" style="width:28px;height:28px"></span>';
  function shelf(list,title,info){
    const w=el("div","shelf"),h=el("div","shelfhead");h.append(el("span",null,title),el("span",null,list.length+" "+plural(list.length,"книга","книги","книг")));
    const row=el("div","shelfrow");
    list.forEach(([n,c,g])=>{const sp=el("span","spine"+(inPlan.has(n)?" plan":""));sp.style.height=Math.round(26+Math.sqrt(c)*4.2)+"px";sp.style.background=G[g][1];
      sp.title=n+" — "+c+" "+plural(c,"глава","главы","глав");
      const show=()=>{row.querySelectorAll(".on").forEach(x=>x.classList.remove("on"));sp.classList.add("on");info.innerHTML="<b>"+n+"</b> · "+G[g][0].toLowerCase()+" · "+c+" "+plural(c,"глава","главы","глав")+(SCHED.spb?(inPlan.has(n)?" · <b>читаем в 1-й год</b>":" · читаем во 2-й год"):(inPlan.has(n)?" · <b>есть в вашем расписании</b>":""))};
      sp.addEventListener("mouseenter",show);sp.addEventListener("click",show);row.append(sp)});
    w.append(h,row);return w;
  }
  function route(k){
    const segs=[];BOOKSTARTS.filter(b=>b.k===k).forEach((b,j,a)=>{const end=j+1<a.length?a[j+1].i:DAYS;segs.push([b.book,end-b.i])});
    const pal=k==="nt"?["#6b4fd8","#8a6cf2","#5b3fc0","#7c5ce6","#1d6fd6","#0e9aa7","#0b7f8a"]:["#c2410c","#e8650a","#d4570b","#b45309","#a8541f","#e07b39","#c96a2b","#9a4a16"];
    const bar=el("div","rbar");segs.forEach(([b,n],j)=>{const d=el("div",null,n>=32?b:"");d.style.flex=n+" 0 0";d.style.background=pal[j%pal.length];d.title=(FULL[b]||b)+" — "+n+" "+daysWord(n);bar.append(d)});
    const wrap=el("div","groute");const l=el("div","rl",T[k].label);l.style.color="var(--s-"+k+")";
    const ls=el("div","rlist");ls.innerHTML=segs.map(([b,n])=>'<span style="white-space:nowrap"><b>'+(FULL[b]||b)+"</b> "+n+"&nbsp;"+daysWord(n)+"</span>").join(" · ");
    wrap.append(l,bar,ls);return wrap;
  }
  function open(){
    const modal=el("div","fmodal"),sheet=el("div","fsheet bguide");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label","Путеводитель");
    const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};
    modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
    const head=el("div","fhead"),h=el("h2",null,"Путеводитель по Библии");const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);head.append(h,x);
    const sec=(t)=>{const d=el("section","gsec");if(t)d.append(el("h3",null,t));sheet.append(d);return d};
    sheet.append(head);
    // 1. что такое Библия
    let d=sec("Что такое Библия");
    const p1=el("p","glead");p1.innerHTML="Библия — это не одна книга, а <b>целая библиотека</b>. В ней 66 книг, которые писали около 40 человек на протяжении примерно 1500 лет: цари и пастухи, рыбаки и врачи. Но у всех этих книг одна главная тема — <b>личная история любви Бога к человеку</b> и Его желание войти в жизнь каждого из нас.";
    const nums=el("div","gnum");nums.innerHTML="<div><b>66</b><span>книг</span></div><div><b>1189</b><span>глав</span></div><div><b>2</b><span>года на всю Библию</span></div>";
    d.append(p1,nums);
    // 2. полка
    d=sec("Книжная полка");
    const info=el("div","shelfinfo");info.textContent="Нажмите на корешок, чтобы узнать, что это за книга. Высота — сколько в книге глав.";
    d.append(shelf(OT,"Ветхий Завет",info),shelf(NT,"Новый Завет",info),info);
    const lg=el("div","glegend");Object.values(G).forEach(([n,c])=>{const s=el("span");const i=el("i");i.style.background=c;s.append(i,document.createTextNode(n));lg.append(s)});
    const s0=el("span");s0.innerHTML='<i style="background:#555;position:relative"></i>';s0.firstChild.innerHTML='<b style="position:absolute;left:3px;top:3px;width:4px;height:4px;border-radius:50%;background:#fff"></b>';s0.append(document.createTextNode("точка — читаем в 1-й год, остальное — во 2-й"));lg.append(s0);
    d.append(lg);
    // 3. два завета
    d=sec("Два Завета");
    const two=el("div","gtwo");
    two.innerHTML='<div class="gtest"><h4>Ветхий Завет · 39 книг</h4><p>Написан до прихода Иисуса Христа.</p><ul><li>сотворение мира и первые люди</li><li>история народа Израиля</li><li>закон, который Бог дал через Моисея</li><li>псалмы и мудрые изречения</li><li>пророчества о грядущем Христе</li></ul></div>'+
      '<div class="gtest nt"><h4>Новый Завет · 27 книг</h4><p>Написан после жизни Иисуса на земле.</p><ul><li>четыре Евангелия — жизнь, смерть и воскресение Иисуса</li><li>Деяния — как появилась церковь</li><li>послания (письма) апостолов</li><li>Откровение — о том, чем всё завершится</li></ul></div>';
    d.append(two);
    // 4. как читать ссылку
    d=sec("Как читать «Мф. 3:7–17»");
    const r=el("div","gref");r.innerHTML='<div class="r1"><span class="rbig">Мф.</span><span class="rlab">книга<br>(Евангелие по Матфею)</span></div><div class="r2"><span class="rbig">3</span><span class="rlab">глава</span></div><span class="rsep">:</span><div class="r3"><span class="rbig">7–17</span><span class="rlab">стихи<br>с 7-го по 17-й</span></div>';
    const n1=el("p","gnote");n1.innerHTML="Каждая книга разделена на <b>главы</b>, а глава — на короткие пронумерованные <b>стихи</b>. Так любое место легко найти. Если отрывок переходит в следующую главу, пишут так: <b>Быт. 2:19–3:6</b> — с 19-го стиха 2-й главы по 6-й стих 3-й главы. В Огоньке на номер отрывка можно просто нажать — текст откроется сам.";
    d.append(r,n1);
    // 5. как читает Огонёк
    d=sec("Как читаем в Огоньке");
    const p5=el("p");
    if(SCHED.spb)p5.innerHTML="Читаем по Восстановительному переводу: <b>вся Библия за 2 года</b>, примерно <b>10 минут в день</b>. Каждый день — <b>два коротких отрывка</b> (в среднем около 40 стихов): один из Нового Завета и один из Ветхого. Читаем книги по порядку, без пропусков. Все начали 28 сентября и идут по одному пути.";
    else p5.innerHTML="Ваше расписание — <b>«"+SCHED.name+"»</b>: "+DAYS+" "+plural(DAYS,"день","дня","дней")+" чтения, с "+parse(PLAN_START).toLocaleDateString("ru-RU",{day:"numeric",month:"long"})+" по "+parse(planDate(DAYS-1)).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})+". Сменить его можно в разделе «Расписание».";
    const day=el("div","gday");const pt=Math.min(DAYS-1,Math.max(0,todayP()));
    day.innerHTML=KEYS.map(k=>'<div style="border-left:4px solid var(--s-'+k+')"><span class="muted">Сегодня, '+T[k].label+'</span><b>'+refStr(part(k,pt))+'</b></div>').join("");
    const p6=el("p");p6.innerHTML=SCHED.spb?"Сейчас идёт <b>"+(todayP()>=364?2:1)+"-й год</b> из двух. Маршрут на два года — какие книги и сколько дней на каждую:":"Маршрут — какие книги и сколько дней на каждую:";
    const mo=el("div","rmonths");[0,.25,.5,.75,1].forEach(f=>mo.append(el("span",null,shortDay(Math.round(f*(DAYS-1))))));
    d.append(p5,day,p6,...KEYS.map(route),mo);
    // 6. что значат цифры
    d=sec("Что значат цифры и значки");
    const ul=el("ul","gkeys");
    [[fl(false)+"","<b>Серия — дней подряд.</b> Каждый день, когда вы прочитали хотя бы один отрывок, огонёк горит и серия растёт. Прочитали оба завета — огонь горит в полную силу. Пропустили день — огонёк тлеет: в течение 7 дней прочитайте по одному лишнему отрывку за каждый пропущенный день, и серия вернётся. Если пропущено больше 7 дней подряд или срок прошёл — серия начинается заново, рекорд сохраняется."],
     [fl(true),"<b>Маленький огонёк</b> — сегодня прочитан один завет из двух. Серия уже засчитана, но можно дочитать и второй."],
     ['<span style="color:var(--ok)">+2</span>',"<b>Опережение.</b> НЗ и ВЗ — на сколько дней вы впереди плана (зелёным) или позади (красным). «По плану» — вы идёте точно в график."],
     [SNOW,"<b>Заморозки.</b> Если читаете вперёд графика по обоим заветам, копятся заморозки. Пропустили день — заморозка сохранит серию."],
     ['<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="var(--flame)"/><text x="15" y="19" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">12</text></svg>',"<b>Кружки на пути</b> — дни расписания церкви, в кружке число месяца. Оранжевый — прочитаны оба завета, светлый — один. Синий пунктир «По плану сегодня» показывает, где все должны быть сегодня. Кто читает по своему расписанию, стоит в тот день, где читается его книга и глава."],
     ['<svg viewBox="0 0 30 30"><rect x="3" y="7" width="24" height="16" rx="4" fill="var(--surface)" stroke="var(--s-ot)" stroke-width="1.6"/><rect x="7" y="11" width="3" height="8" rx="1" fill="var(--s-ot)"/></svg>',"<b>Таблички с книгами</b> на пути показывают, где начинается новая книга: Исход, Левит, Числа… Пролистайте путь вверх — увидите весь путь."],
     [GEM,"<b>Алмазы</b> — за тесты по прочитанным главам. Даются только за 10 правильных ответов из 10."]
    ].forEach(([ic,t])=>{const li=el("li"),k=el("span","gk");k.innerHTML=ic;const p=el("p");p.innerHTML=t;li.append(k,p);ul.append(li)});
    d.append(ul);
    // 7. советы
    d=sec("Несколько советов");
    const tips=el("ol","gtips");["Читайте в одно и то же время — утром или перед сном.","Не страшно, если что-то непонятно. Читайте дальше: многое проясняется по ходу.","Перед чтением можно коротко помолиться и попросить Бога открыть смысл.","Отмечайте стих, который тронул, и поделитесь им с другом.","Читайте вместе с друзьями — так легче не бросить."].forEach(t=>tips.append(el("li",null,t)));
    d.append(tips);
    const ok=el("button","btn-main","Понятно, начнём!");ok.type="button";ok.addEventListener("click",close);sheet.append(ok);
    modal.append(sheet);document.body.append(modal);sheet.scrollTop=0;
  }
  $("guideOpen").addEventListener("click",open);if($("guideLink"))$("guideLink").addEventListener("click",open);
  window.__openGuide=open;
})();
/* ---------- выбор расписания: общее церковное или своё ---------- */
function planProgress(id){if(id===SCHED.id)return KEYS.reduce((a,k)=>a+state[k].read.length,0);const x=(state.plans||{})[id];return x?((x.nt&&x.nt.read)||[]).length+((x.ot&&x.ot.read)||[]).length:0}
function switchPlan(def){
  if(def.id===SCHED.id&&JSON.stringify(def)===JSON.stringify(SCHED.def))return;
  // человек выбрал расписание: «без расписания» больше нет, указатель «Изменить — в профиле» загорается
  try{const np=noPlan();state.planChosen=true;if(state.ptrEdit===undefined)state.ptrEdit="on";
    if(np){state.tracks={spb:true,conf:false};const c=confSt();if(!c.log.length)delete c.joined}
    else if(state.tracks&&state.tracks.spb===false)state.tracks=Object.assign({},state.tracks,{spb:true});
    localStorage.setItem("ogonek-app-mode","spb")}catch(e){}
  state.plans=state.plans||{};
  // текущий прогресс откладываем — к этому расписанию можно вернуться
  if(KEYS.some(k=>state[k].read.length)||state.frzDays.length)state.plans[SCHED.id]={nt:state.nt,ot:state.ot,frzDays:state.frzDays,def:SCHED.def};
  state.hist=[...new Set([...(state.hist||[]),...state.nt.log.map(x=>x.d),...state.ot.log.map(x=>x.d),...state.frzDays])].sort().slice(-800);
  const back=def.id!==SCHED.id&&state.plans[def.id]&&!def.fresh?state.plans[def.id]:null;
  delete def.fresh;
  state.nt=back?back.nt:{log:[],read:[]}; state.ot=back?back.ot:{log:[],read:[]}; state.frzDays=back?back.frzDays||[]:[];
  if(back&&back.def)def=back.def;
  delete state.plans[def.id];
  state.schedDef=def; state.sched=def.id;
  if(def.custom){state.myScheds=state.myScheds||{};state.myScheds[def.id]=def}
  const done=()=>location.reload();
  let p=null;try{p=save()}catch(e){}
  Promise.race([Promise.resolve(p),new Promise(r=>setTimeout(r,2500))]).then(done,done);
  toast("Переключаем расписание…");
}
function fmtLong(d){return parse(d).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}
function schedSummary(S){if(S.spb)return "Вся Библия за 2 года · с 28 сентября 2026 · сейчас "+(todayP()>=364?2:1)+"-й год";const last=S.dates?S.dates[S.dates.length-1]:add(S.start,S.plan.length-1);
  return S.plan.length+" "+plural(S.plan.length,"день","дня","дней")+" · с "+fmtLong(S.start)+" по "+fmtLong(last)}
function versesPerDay(S){let v=0;S.plan.forEach(d=>S.keys.forEach(k=>{const b=BOOK[d[T[k].bi]];if(!b)return;const ref=d[T[k].ri];let m;
  if((m=/^(\d+):(\d+)[–—-](\d+):(\d+)$/.exec(ref))){let n=0;for(let c=+m[1];c<=+m[3];c++)n+=(c===+m[3]?+m[4]:b.v[c-1])-(c===+m[1]?+m[2]-1:0);v+=n}
  else if((m=/^(\d+):(\d+)(?:[–—-](\d+))?$/.exec(ref)))v+=(+(m[3]||m[2]))-(+m[2])+1;
  else{const [a,z]=chapRange(ref);for(let c=a;c<=z;c++)v+=b.v[c-1]||0}}));return Math.round(v/S.plan.length)}
function openPlans(start,E){
  if(start!=="custom"&&start!=="ms"&&noPlan()){openWelcome();return}
  if(start!=="custom"&&state.ptrEdit==="on"&&!isLogged()){state.ptrEdit="done";save();try{applyPtr()}catch(e){}} // без входа указатель ведёт сюда
  const modal=el("div","fmodal plans"),sheet=el("div","fsheet psheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label","Расписание чтения");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc);setTimeout(()=>{window.__planPick=null;if(window.__planPickClosed){const f=window.__planPickClosed;window.__planPickClosed=null;f()}},0)};const esc=e=>{if(e.key==="Escape")close()};
  modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
  const head=(title,back)=>{const h=el("div","fhead");if(back){const b=el("button","pback","‹");b.type="button";b.setAttribute("aria-label","Назад");b.addEventListener("click",back);h.append(b)}
    h.append(el("h2",null,title));const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);h.append(x);return h};
  function list(){
    sheet.textContent="";sheet.classList.remove("msform");sheet.append(head("Добавить расписание"));sheet.scrollTop=0;
    const opt=(ic,title,sub,cls,fn)=>{const b=el("button","wopt "+cls);b.type="button";b.append(icoEl(ic));const t=el("span","ptxt");t.append(el("b",null,title),el("span",null,sub));b.append(t);b.addEventListener("click",fn);return b};
    // три пути: Библия · книги служения · челлендж
    sheet.append(opt("book","Библия","Своё расписание: какие книги, темп и дата начала","bib",()=>custom()));
    if(!churchOn()){const ch=el("button","linkbtn pchurch","или расписание церкви в Санкт-Петербурге — вся Библия за 2 года");ch.type="button";ch.addEventListener("click",()=>{close();enableChurch()});sheet.append(ch)}
    // церковь и челлендж — только если их ещё нет в «Моих расписаниях»
    {const mo=opt("scroll","Жизнеизучение и книги служения","Уитнесс Ли и Вочман Ни · в неделю, страниц в день или к дате","msb"+(msNew()?" newglow":""),()=>ms());
      if(msNew())mo.querySelector(".ptxt b").after(el("span","newbadge","Новое"));sheet.append(mo)}
    if(!confClosed()&&!(tracks().conf&&confSt().joined))sheet.append(opt("peak","Челлендж «Божья гора»","Исход 19–20 и Псалом 119 · до 28 октября · с друзьями","ch",()=>{close();state.planChosen=true;confJoin();render();toast("Вы в челлендже! Он на главной")}));
    // прежние свои расписания, которые сейчас не в списке
    const ex=state.extra||{},fin=new Set((state.finished||[]).map(f=>f.id)),old=myPlanList().filter(d=>!fin.has(d.id)&&!ex[d.id]&&!(d.id===SCHED.id&&tracks().spb&&!noPlan()));
    if(old.length){sheet.append(el("div","pgroup","Вернуть своё"));old.forEach(d=>{const w=el("div","pold");
      w.append(opt(myEmb(d),d.name||"Моё расписание","Продолжить с того же места · прочитано отрывков: "+planProgress(d.id),"my",()=>{close();schedSetOn({id:d.id,kind:"my",primary:d.id===SCHED.id,def:d},true)}));
      const del=el("button","pdel","Удалить");del.type="button";del.setAttribute("aria-label","Удалить насовсем: "+(d.name||"Моё расписание"));
      confirmTap(del,"Удалить насовсем?",()=>{if(deletePlan(d.id))return;list()});w.append(del);sheet.append(w)})}
    sheet.append(el("p","hint","Добавленные расписания — на главной, у каждого своя кнопка «Прочитал(а)». Убрать — подержите тумблер в карточке."));
  }
  function card(name,desc,id,go){
    const b=el("button","pitem"+(id===SCHED.id?" on":""));b.type="button";
    const t=el("div","ptxt");t.append(el("b",null,name),el("span",null,desc));
    const n=planProgress(id);if(n&&id!==SCHED.id)t.append(el("span","pdone","Продолжить · прочитано отрывков: "+n));
    b.append(t);if(id===SCHED.id)b.append(el("span","pmark","✓"));b.addEventListener("click",go);return b;
  }
  function custom(E){
    if(E&&E.ms)return ms(E);
    sheet.classList.remove("msform");sheet.classList.toggle("pickmode",!!window.__planPick);
    sheet.textContent="";sheet.append(head(E?"Изменить расписание":"Своё расписание",window.__planPick?()=>{close()}:E?()=>{close();openPlanEditor()}:noPlan()?()=>{close();openWelcome()}:list));sheet.scrollTop=0;
    const f={name:E?(E.name||"Моё расписание"):"Моё расписание",start:today(),sec:ALLSEC.slice(),mode:"par",by:"end",end:add(today(),364),amount:3};
    if(E){f.name=E.name||f.name;f.start=E.start||f.start;f.mode=E.mode||f.mode;f.by=E.by||f.by;if(E.end)f.end=E.end;if(E.amount)f.amount=E.amount}
    const field=(label,input)=>{const l=el("label","pfield");l.append(el("span",null,label),input);return l};
    // название — обязательно, по умолчанию пустое; эмблема — из набора
    f.name=E&&E.name&&E.name!=="Моё расписание"?E.name:"";f.emb=E&&E.emb||"book";
    const nmf=el("div","pname"),nm=el("input");nm.value=f.name;nm.maxLength=40;nm.placeholder="Например: Евангелия";nm.setAttribute("aria-label","Название расписания");
    const nmh=el("span","pnh","Название и значок");nmh.append(el("small",null," — видите вы и друзья"));
    const nmMsg=el("span","pnmsg","👆 Напишите название — без него расписание не сохранить");
    nm.addEventListener("input",()=>{f.name=nm.value.trim();if(f.name)nmf.classList.remove("need")});
    const nmRow=el("div","pnrow"),embNow=el("span","embnow");const drawNow=()=>{embNow.textContent="";embNow.append(icoEl(f.emb))};drawNow();
    nmRow.append(embNow,nm);nmf.append(nmh,nmRow,embPicker(()=>f.emb,v=>{f.emb=v;drawNow()}),nmMsg);
    const st=el("input");st.type="date";st.value=f.start;st.addEventListener("change",()=>{f.start=st.value||today();upd()});
    const stF0=field("Дата начала",st);sheet.append(nmf);
    // что читать: включите Ветхий и/или Новый Завет, затем отметьте нужные книги (название раздела — выбрать весь раздел)
    f.books=new Set(E&&E.books||[]); f.tOn={ot:true,nt:true}; // видны все книги Библии, ни одна не выбрана
    const secBox=el("div","psecs");const cnt=el("span","pcnt");const lab=el("span","plab","Что читать ");lab.append(cnt);secBox.append(lab);
    // два завета; включены оба — кнопки сливаются в одну «Вся Библия» (половинки по-прежнему выключают свой завет)
    const quick=el("div","ptest"), qOt=el("button","pchip pt-ot"), qNt=el("button","pchip pt-nt");
    qOt.append(el("span",null,"Ветхий Завет"));qNt.append(el("span",null,"Новый Завет"));
    [qOt,qNt].forEach(b=>{b.type="button";quick.append(b)});quick.append(el("span","ptall","Вся Библия"));
    // завет включён — видны его книги (выбираете сами); выключен — книги скрыты и сняты
    const setT=(t,on)=>{f.tOn[t]=on;if(!on)BOOKS.filter(b=>b.t===t).forEach(b=>f.books.delete(b.a))};
    // «Вся Библия»: нажатие на половину оставляет только этот завет (другой сворачивается); нажатие на выключенный — снова вся Библия
    [[qOt,"ot","nt"],[qNt,"nt","ot"]].forEach(([b,t,o])=>b.addEventListener("click",()=>{if(f.tOn[t]&&f.tOn[o])setT(o,false);else if(!f.tOn[t])setT(t,true);else return;drawSecs();upd()}));
    const secs=el("div","pbooks");
    function drawSecs(){secs.textContent="";
      qOt.classList.toggle("on",f.tOn.ot);qNt.classList.toggle("on",f.tOn.nt);quick.classList.toggle("both",f.tOn.ot&&f.tOn.nt);
      [qOt,qNt].forEach(b=>b.setAttribute("aria-pressed",b.classList.contains("on")?"true":"false"));
      qOt.title=f.tOn.ot&&f.tOn.nt?"Нажмите слева — только Ветхий Завет":f.tOn.ot?"":"Показать всю Библию";qNt.title=f.tOn.ot&&f.tOn.nt?"Нажмите справа — только Новый Завет":f.tOn.nt?"":"Показать всю Библию";
      SECTIONS.forEach(([id,name,t])=>{if(!f.tOn[t])return;
        const list=BOOKS.filter(b=>b.s===id), all=list.every(b=>f.books.has(b.a)), some=list.some(b=>f.books.has(b.a));
        const grp=el("div","pbgrp "+t);grp.style.setProperty("--c",SECCOL[id]);
        const h=el("button","pbsec"+(all?" on":some?" some":""));h.type="button";h.append(el("span",null,name));h.title=(all?"Снять":"Выбрать")+" весь раздел «"+name+"»";h.setAttribute("aria-pressed",all?"true":"false");
        h.addEventListener("click",()=>{list.forEach(b=>all?f.books.delete(b.a):f.books.add(b.a));drawSecs();upd()});
        const chips=el("div","pbchips");list.forEach(b=>{const c=el("button","pbook-c"+(f.books.has(b.a)?" on":""),b.n.replace(/^Евангелие (от|по) /,"По "));c.type="button";c.title=b.n;c.style.setProperty("--c",SECCOL[b.s]);c.setAttribute("aria-pressed",f.books.has(b.a)?"true":"false");
          c.addEventListener("click",()=>{f.books.has(b.a)?f.books.delete(b.a):f.books.add(b.a);drawSecs();upd()});chips.append(c)});
        grp.append(h,chips);secs.append(grp)});
      cnt.textContent="· выбрано книг: "+f.books.size+" из 66"}
    drawSecs();secBox.append(quick,secs);sheet.append(secBox);
    // как читать
    const modeBox=el("div","psecs");modeBox.append(el("span","plab","Как читать"));
    const radio=(name,opts,get,set)=>{const w=el("div","pradios");opts.forEach(([v,t])=>{const l=el("label","pradio");const r=el("input");r.type="radio";r.name=name;r.checked=get()===v;r.addEventListener("change",()=>{set(v);upd()});l.append(r,el("span",null,t));w.append(l)});return w};
    modeBox.append(radio("pmode",[["par","Каждый день отрывок из Ветхого и из Нового Завета"],["seq","Подряд, по порядку книг"]],()=>f.mode,v=>f.mode=v));
    sheet.append(modeBox);
    // темп
    const paceBox=el("div","psecs");paceBox.append(el("span","plab","Темп"));
    const endI=el("input");endI.type="date";endI.value=f.end;endI.addEventListener("change",()=>{f.end=endI.value;upd()});
    const amt=el("input");amt.type="number";amt.min="1";amt.max="500";amt.value=f.amount;amt.inputMode="numeric";amt.addEventListener("input",()=>{f.amount=Math.max(1,+amt.value||1);upd()});
    const paceRow=el("div","prow");
    const drawPace=()=>{paceRow.textContent="";if(f.by==="end")paceRow.append(stF0,field("Закончить к дате",endI));else{amt.value=f.amount;paceRow.append(field(f.by==="verses"?"Стихов в день":"Глав в день",amt),stF0)}};
    paceBox.append(radio("pby",[["end","Закончить к дате"],["verses","Стихов в день"],["chapters","Глав в день"]],()=>f.by,v=>{f.by=v;if(v==="verses")f.amount=40;if(v==="chapters")f.amount=3;drawPace()}),paceRow);
    drawPace();sheet.append(paceBox);
    const prev=el("div","pprev");sheet.append(prev);
    const go=el("button","btn-main",E?"Сохранить изменения":"Создать и начать читать");go.type="button";if(window.__planPick)go.textContent="Готово — читаем это в группе";sheet.append(go);
    if(E)sheet.append(el("p","hint","Если поменять книги, даты или темп, расписание начнётся заново с первого дня. Серия дней сохранится. Только новое название — прогресс не меняется."));
    sheet.append(el("p","hint","Читаем каждый день. Отрывки делятся поровну по числу стихов, по возможности — по целым главам. Один день не захватывает две книги."));
    const def=()=>({id:E?E.id:"my-"+Date.now().toString(36),custom:true,name:f.name,emb:f.emb,start:f.start,books:BOOKS.filter(b=>f.books.has(b.a)).map(b=>b.a),mode:f.mode,by:f.by,end:f.end,amount:f.amount});
    function upd(){prev.textContent="";if(go.dataset.arm){delete go.dataset.arm;go.classList.remove("warn");go.textContent=E?"Сохранить изменения":"Создать и начать читать"}
      if(!f.books.size){prev.append(el("b",null,"Выберите книги, которые хотите читать"));go.disabled=true;return}
      if(f.by==="end"&&(!f.end||f.end<=f.start)){prev.append(el("b",null,"Дата окончания должна быть позже начала"));go.disabled=true;return}
      try{const S=buildSched(def());prev.append(el("b",null,schedSummary(S)),el("span",null,"В среднем ~"+versesPerDay(S)+" стихов в день · первый день: "+S.keys.map(k=>refStr(part2(S,k,0))).join(" и ")));go.disabled=false}catch(e){console.warn(e);prev.append(el("b",null,"Не получилось составить расписание"));go.disabled=true}}
    upd();
    go.addEventListener("click",()=>{const d=def();if(window.__planPick){const cb=window.__planPick;window.__planPick=null;close();cb(d);return}
      if(!f.name){nmf.classList.remove("need");void nmf.offsetWidth;nmf.classList.add("need");nmf.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>nm.focus({preventScroll:true}),350);vibrate(20);return}
      if(E){const k=x=>JSON.stringify([x.start,(x.books||[]).join(),x.mode,x.by,x.by==="end"?x.end:x.amount]);
        if(k(d)===k(E)){if(d.name===E.name&&d.emb===(E.emb||"book")){close();return}renamePlan(E.id,d.name,d.emb);return}
        // поменялись книги, даты или темп — расписание начнётся заново: переспросим
        if(!go.dataset.arm&&planProgress(E.id)){go.dataset.arm="1";go.classList.add("warn");go.textContent="Начать заново с 1-го дня? Прочитано отрывков: "+planProgress(E.id)+" — нажмите ещё раз";return}
        if(E.id!==SCHED.id){state.myScheds=state.myScheds||{};state.myScheds[E.id]=d;state.plans=state.plans||{};state.plans[E.id]={nt:{log:[],read:[]},ot:{log:[],read:[]},frzDays:[],def:d};
          save();close();render();toast("Сохранено. Расписание начнётся заново");return}
        d.fresh=true}
      else if(tracks().spb&&!noPlan()&&!noActive()){
        state.myScheds=state.myScheds||{};state.myScheds[d.id]=d;state.plans=state.plans||{};state.plans[d.id]={nt:{log:[],read:[]},ot:{log:[],read:[]},frzDays:[],def:d};
        state.extra=state.extra||{};state.extra[d.id]=true;state.planChosen=true;save();close();setSchedView("");render();
        toast("«"+d.name+"» создано и включено — оно на главной в «Чтении на сегодня»");return}
      else{try{sessionStorage.setItem("ogonek-made","1")}catch(e){}}
      switchPlan(d)});
  }
  // книга служения: Жизнеизучение или другая книга, темп — сообщений (глав) в неделю
  function ms(E){
    if(!state.msSeen){state.msSeen=true;save();try{applyPtr();renderSchedList()}catch(e){}}
    const field=(label,input)=>{const l=el("label","pfield");l.append(el("span",null,label),input);return l};
    sheet.textContent="";sheet.classList.add("msform");sheet.classList.toggle("pickmode",!!window.__planPick);sheet.append(head(E?"Изменить расписание":"Книга служения",window.__planPick?()=>{close()}:E?()=>{close();openPlanEditor()}:list));sheet.scrollTop=0;
    const f={ms:E?E.ms:160,from:E&&E.from||1,pw:E&&E.pw||2,rev:E?!!E.rev:true,start:E&&E.start||today(),emb:E&&E.emb||"scroll",name:E?E.name||"":"",tab:"ls",named:!!E,wd:E&&Array.isArray(E.wd)?E.wd.map(Boolean):[true,true,true,true,true,true,true],paper:E?!!E.paper:true,by:E&&E.by||"week",ppd:E&&E.ppd||5,end:E&&E.end||""};
    if(msBook(f.ms)&&msBook(f.ms).k!=="ls")f.tab="other";
    f.name=msBook(f.ms).t; // название — всегда название книги, выбирается только эмблема
    sheet.append(el("p","hint mstop","Книги с сайта ministrybooks.online. В карточке на главной — ссылка прямо на нужную страницу."));
    // эмблема; название расписания — название книги
    const nmf=el("div","pname msemb"+(E?"":" pick")),nm=el("b","msname",f.name);
    const nmh=el("span","msh","Выберите значок расписания");if(window.__planPick)nmh.style.display="none";
    const nmp=el("span","msptr",E?"Её видите вы и друзья":"👇 Нажмите на картинку — она будет рядом с расписанием у вас и у друзей");
    const nmRow=el("div","pnrow"),embNow=el("span","embnow");const drawNow=()=>{embNow.textContent="";embNow.append(icoEl(f.emb))};drawNow();
    nmRow.append(embNow,nm);nmf.append(nmRow,nmp,embPicker(()=>f.emb,v=>{f.emb=v;drawNow();nmf.classList.remove("pick");nmp.textContent="✓ Значок выбран — его видите вы и друзья"}));
    // выбор книги
    const bookBox=el("div","psecs");bookBox.append(el("span","plab msh","Что читать"));
    const tabs=el("div","pradios mstabs");const tabBtn=(v,t)=>{const b=el("button","pbook-c mstab",t);b.type="button";b.style.setProperty("--c","var(--link)");b.addEventListener("click",()=>{f.tab=v;if(v==="other")f.oopen=true;drawBooks()});tabs.append(b);return b};
    const tLs=tabBtn("ls","Жизнеизучение Библии"),tOt=tabBtn("other","Другие книги");
    const grid=el("div","pbchips msgrid"),info=el("div","msinfo");
    function pickBook(id){const fromList=f.tab==="other"&&f.oopen;f.ms=id;f.from=1;f.name=msBook(id).t;nm.textContent=f.name;f.oopen=false;drawBooks();drawFrom();upd();
      // книга выбрана — показываем следующий шаг
      if(fromList)setTimeout(()=>{info.scrollIntoView({behavior:"smooth",block:"start"})},60)}
    function drawBooks(){grid.textContent="";tLs.classList.toggle("on",f.tab==="ls");tOt.classList.toggle("on",f.tab==="other");
      if(f.tab==="ls")MSB.ls.forEach(([id,n,ok],i)=>{if(i===18)grid.append(el("span","msdiv","Новый Завет"));if(i===0)grid.append(el("span","msdiv","Ветхий Завет"));
        const c=el("button","pbook-c"+(f.ms===id?" on":"")+(ok?"":" off"),n);c.type="button";c.style.setProperty("--c",i<18?"#c77d2e":"#3b78c4");
        if(ok)c.addEventListener("click",()=>pickBook(id));else{c.disabled=true;c.title="Оглавление этой книги появится в следующем обновлении"}grid.append(c)});
      else{
        // поиск по ~430 книгам: название, автор, раздел
        const w=(f.oq||"").trim().toLowerCase(),L=MSB.other.filter(([id,n,a,c])=>(f.oa==null||(a||"").includes(f.oa))&&(f.oc==null||c===f.oc)&&(!w||(n+" "+a).toLowerCase().includes(w)));
        const lim=f.oall?L.length:40;let last=-1;f.oN=L.length;
        L.slice(0,lim).forEach(([id,n,a,c])=>{if(!w&&f.oc==null&&c!==last){grid.append(el("span","msdiv",MSB.cats[c]));last=c}
          const r=el("button","msrowb"+(f.ms===id?" on":""));r.type="button";r.append(el("b",null,n));
          r.addEventListener("click",()=>pickBook(id));grid.append(r)});
        if(!L.length)grid.append(el("p","hint","Ничего не нашлось. Попробуйте другое слово."));
        else if(L.length>lim){const more=el("button","linkbtn msmore","Показать все — "+L.length);more.type="button";more.addEventListener("click",()=>{f.oall=true;drawBooks()});grid.append(more)}}
      const listOpen=f.tab!=="other"||f.oopen;oCtl.hidden=f.tab!=="other"||!f.oopen;grid.hidden=!listOpen;grid.classList.toggle("msolist",f.tab==="other");
      oHint.hidden=f.tab!=="other"||!f.oopen;
      // пока книга не выбрана, остальные шаги не показываем
      if(typeof stF!=="undefined"){const hr=f.tab==="other"&&f.oopen;[paceBox,stF,prev,go].forEach(x=>x.hidden=hr);if(hr){fromF.hidden=true;papL.hidden=true}}oFoot.hidden=f.tab!=="other"||!f.oopen;
      if(!oFoot.hidden){const tot=grid.querySelectorAll(".msrowb").length;oFoot.textContent=tot>4?"↓ Листайте список · показано "+tot+(f.oN>tot?" из "+f.oN:""):"";oFoot.hidden=tot<=4}
      const B=msBook(f.ms);info.textContent="";info.classList.toggle("pick",f.tab==="other"&&!f.oopen);
      info.hidden=f.tab==="other"&&f.oopen&&B&&B.k==="ls";
      if(B){const U=msUnits(B),P=U.reduce((x,u)=>x+u.pages,0);if(f.tab==="other"&&!f.oopen)info.append(el("span","msok","✓ Выбрано"));
        info.append(el("b",null,B.t),el("span",null,(B.a||"автор не указан")+" · "+(U.length>1?U.length+" "+(B.k==="ls"?plural(U.length,"сообщение","сообщения","сообщений"):plural(U.length,"глава","главы","глав"))+" · ":"")+P+" стр. (~"+MS_MIN+" мин каждая)"));
        if(f.tab==="other"&&!f.oopen){const ch=el("button","btn mschange","Сменить книгу");ch.type="button";ch.addEventListener("click",()=>{f.oopen=true;drawBooks();oCtl.scrollIntoView({behavior:"smooth",block:"start"})});info.append(ch,el("span","msnext","↓ Дальше — с чего начать, дни и темп"))}}}
    // поиск и фильтры для «Других книг» — создаются один раз, чтобы не терять фокус
    const oCtl=el("div","msoctl"),oS=el("input","nsearch msq");oS.type="search";oS.placeholder="Поиск: название или автор";oS.setAttribute("aria-label","Поиск книги");
    oS.addEventListener("input",()=>{f.oq=oS.value;f.oall=false;drawBooks()});
    const oA=el("div","mstabs msau");[["Все",null],["Уитнесс Ли","Уитнесс Ли"],["Вочман Ни","Вочман Ни"]].forEach(([t,v])=>{const b=el("button","pbook-c",t);b.type="button";b.style.setProperty("--c","#7a5cc4");
      b.addEventListener("click",()=>{f.oa=v;f.oall=false;oA.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));drawBooks()});if(v===null)b.classList.add("on");oA.append(b)});
    const oC=el("select","msfrom");oC.setAttribute("aria-label","Раздел");const o0=el("option",null,"Все разделы");o0.value="";oC.append(o0);MSB.cats.forEach((c,i)=>{const o=el("option",null,c+" ("+MSB.other.filter(r=>r[3]===i).length+")");o.value=i;oC.append(o)});
    oC.addEventListener("change",()=>{f.oc=oC.value===""?null:+oC.value;f.oall=false;drawBooks()});
    oCtl.append(oS,oA,oC);oCtl.hidden=true;
    const oHint=el("p","mshint","Нажмите на книгу, чтобы выбрать её. Дальше — настройки чтения."),oFoot=el("div","msfoot");oHint.hidden=oFoot.hidden=true;
    bookBox.append(tabs,oCtl,oHint,grid,oFoot,info);
    // с какого сообщения
    const fromSel=el("select","msfrom");fromSel.setAttribute("aria-label","С какого сообщения начать");
    fromSel.addEventListener("change",()=>{f.from=+fromSel.value||1;upd()});
    // уже прочитанное до Огонька (например, в бумажной книге) — сразу на книжную полку
    const papL=el("label","pradio mspaper"),papI=el("input"),papT=el("span");papI.type="checkbox";papI.checked=f.paper;papI.addEventListener("change",()=>{f.paper=papI.checked});papL.append(papI,papT);
    function drawFrom(){fromSel.textContent="";const B=msBook(f.ms);msUnits(B).forEach(u=>{const o=el("option",null,u.n+". "+u.title);o.value=u.n;if(u.n===f.from)o.selected=true;fromSel.append(o)})}
    const fromF=el("label","pfield");const fromL=el("span","msh","Начать с");fromF.append(fromL,fromSel);
    // темп
    const paceBox=el("div","psecs"),paceL=el("span","plab msh","Сообщений в неделю"),pw=el("div","mspw");
    // дни недели, в которые читаем
    const wdL=el("span","plab msh","Дни чтения"),wdRow=el("div","mspw mswd");
    const wdBtns=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((t,i)=>{const b=el("button","pbook-c",t);b.type="button";b.style.setProperty("--c","var(--link)");
      b.addEventListener("click",()=>{if(f.wd[i]&&f.wd.filter(Boolean).length===1){toast("Нужен хотя бы один день чтения");return}f.wd[i]=!f.wd[i];upd()});wdRow.append(b);return b});
    const wdHint=el("span","mswdh");
    const byL=el("span","plab msh","Темп"),byRow=el("div","mspw msby");
    const byBtns=[["week","В неделю"],["pages","Страниц в день"],["end","К дате"]].map(([v,t])=>{const b=el("button","pbook-c",t);b.type="button";b.style.setProperty("--c","var(--xp)");b.addEventListener("click",()=>{f.by=v;if(v==="end"&&!f.end){const t=new Date(f.start+"T12:00:00");t.setDate(t.getDate()+60);f.end=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")}upd()});byRow.append(b);return [v,b]});
    const ppdL=el("span","plab msh","Страниц в день"),ppdRow=el("div","mspw");
    const ppdBtns=[1,2,3,4,5,7,10].map(n=>{const b=el("button","pbook-c",String(n));b.type="button";b.style.setProperty("--c","var(--flame)");b.addEventListener("click",()=>{f.ppd=n;upd()});ppdRow.append(b);return [n,b]});
    const endI=el("input");endI.type="date";endI.addEventListener("change",()=>{f.end=endI.value;upd()});const endF=field("Закончить к дате",endI);endF.firstChild.className="msh";
    const msDates=el("div","prow msdates");paceBox.append(wdL,wdRow,wdHint,byL,byRow,paceL,pw,ppdL,ppdRow,msDates);
    const pwBtns=[1,2,3,4,5,6,7].map(n=>{const b=el("button","pbook-c",String(n));b.type="button";b.style.setProperty("--c","var(--flame)");b.addEventListener("click",()=>{f.pw=n;upd()});pw.append(b);return b});
    const st=el("input");st.type="date";st.value=f.start;st.addEventListener("change",()=>{f.start=st.value||today();upd()});
    const stF=field("Дата начала",st);stF.firstChild.className="msh";msDates.append(stF,endF);sheet.append(nmh,nmf,bookBox,fromF,papL,paceBox);
    const prev=el("div","pprev msprev");sheet.append(prev);
    const go=el("button","btn-main",E?"Сохранить изменения":"Создать и начать читать");go.type="button";if(window.__planPick)go.textContent="Готово — читаем это в группе";sheet.append(go);
    sheet.append(el("p","hint","Неделя — с понедельника по воскресенье. Дни чтения делятся между сообщениями по числу страниц; один день не захватывает два сообщения. В дни без чтения расписание отдыхает — серия от этого не прерывается, если в этот день читаете Библию."));
    const def=()=>({id:E?E.id:"ms-"+Date.now().toString(36),custom:true,ms:f.ms,from:f.from,pw:f.pw,...(f.by==="pages"?{by:"pages",ppd:f.ppd}:f.by==="end"&&f.end?{by:"end",end:f.end}:{}),...(f.wd.every(Boolean)?{}:{wd:f.wd.map(x=>x?1:0)}),...(f.from>1&&f.paper?{paper:true}:{}),name:f.name,emb:f.emb,start:f.start});
    function upd(){
      if(go.dataset.arm){delete go.dataset.arm;go.classList.remove("warn");go.textContent=E?"Сохранить изменения":"Создать и начать читать"}
      const B=msBook(f.ms),isLs=B.k==="ls";paceL.textContent=isLs?"Сообщений в неделю":"Глав в неделю";const one=B.m.length<2;fromF.hidden=one;paceL.hidden=one||f.by!=="week";pw.hidden=one||f.by!=="week";ppdL.hidden=ppdRow.hidden=f.by!=="pages";endF.hidden=f.by!=="end";endI.value=f.end||"";endI.min=f.start;byBtns.forEach(([v,b])=>b.classList.toggle("on",f.by===v));ppdBtns.forEach(([n,b])=>b.classList.toggle("on",f.ppd===n));if(f.by==="end"&&(!f.end||f.end<=f.start)){prev.textContent="";prev.append(el("b",null,"Дата окончания должна быть позже начала"));go.disabled=true;return}fromL.textContent=isLs?"Начать с сообщения":"Начать с главы";
      const K=f.wd.filter(Boolean).length;if(f.pw>K)f.pw=K;
      wdBtns.forEach((b,i)=>{b.classList.toggle("on",f.wd[i]);b.setAttribute("aria-pressed",String(f.wd[i]))});
      wdHint.textContent=K===7?"Каждый день":K+" "+plural(K,"день","дня","дней")+" в неделю · в остальные — отдых";
      pwBtns.forEach((b,i)=>{b.classList.toggle("on",i+1===f.pw);b.setAttribute("aria-pressed",String(i+1===f.pw));b.disabled=i+1>K;b.classList.toggle("off",i+1>K)});

      papL.hidden=f.from<=1;papT.textContent=(isLs?"Сообщения":"Главы")+" "+(f.from===2?"1":"1–"+(f.from-1))+" уже прочитаны (например, в бумажной книге) — поставить их на книжную полку";
      prev.textContent="";let S;try{S=buildMs(def())}catch(e){console.warn(e);prev.append(el("b",null,"Не получилось составить расписание"));go.disabled=true;return}go.disabled=false;
      const reads=S.plan.filter(r=>r[0]&&r[0]!=="Повторение:"),nRev=S.plan.filter(r=>r[0]==="Повторение:").length,pages=msUnits(B).slice(f.from-1).reduce((s,u)=>s+u.pages,0),weeks=Math.ceil((S.plan.length+msDow(S.start))/7);
      const mins=Math.round(pages/Math.max(1,reads.length)*MS_MIN);
      prev.append(el("b",null,weeks+" "+plural(weeks,"неделя","недели","недель")+" · до "+fmtLong(add(S.start,S.plan.length-1))),
        el("span",null,"В день ~"+(pages/Math.max(1,reads.length)).toFixed(1).replace(".",",")+" стр. — около "+mins+" мин"+(nRev?" · дней повторения: "+nRev:"")+(mins>30?" · много за раз — можно добавить дни чтения":"")));
      // как выглядят первые две недели
      const tb=el("div","msweek");const W=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
      for(let p=0;p<Math.min(S.plan.length,14-msDow(S.start));p++){const r=S.plan[p],dt=add(S.start,p),dw=msDow(dt);
        if(p===0||dw===0)tb.append(el("span","mswh",p===0?"Первая неделя":"Вторая неделя"));
        const ln=el("div","msday"+(!r[0]?" rest":r[0]==="Повторение:"?" rev":"")+(dw===6?" sun":""));ln.append(el("span","msdw",W[dw]+" "+parse(dt).getDate()),el("b",null,r[0]?r[0]+" "+r[1]:"отдых"));if(r[0])ln.append(el("span","mst",r[5]));tb.append(ln)}
      prev.append(tb);
    }
    drawBooks();drawFrom();upd();
    go.addEventListener("click",()=>{const d=def();if(window.__planPick){const cb=window.__planPick;window.__planPick=null;close();cb(d);return}
      if(E){const k=x=>JSON.stringify([x.ms,x.from||1,x.pw,!!x.rev,x.start,x.wd||null,x.by||"",x.ppd||0,x.end||""]);
        if(k(d)===k(E)){const pap=!!d.paper!==!!E.paper;if(d.name===E.name&&d.emb===(E.emb||"scroll")&&!pap){close();return}
          if(pap)[state.schedDef,(state.myScheds||{})[E.id],((state.plans||{})[E.id]||{}).def].forEach(x=>{if(x&&x.id===E.id){if(d.paper)x.paper=true;else delete x.paper}});
          renamePlan(E.id,d.name,d.emb);return}
        if(!go.dataset.arm&&planProgress(E.id)){go.dataset.arm="1";go.classList.add("warn");go.textContent="Начать заново с 1-го дня? Прочитано отрывков: "+planProgress(E.id)+" — нажмите ещё раз";return}
        state.myScheds=state.myScheds||{};state.myScheds[E.id]=d;state.plans=state.plans||{};state.plans[E.id]={nt:{log:[],read:[]},ot:{log:[],read:[]},frzDays:[],def:d};
        save();close();render();toast("Сохранено. Расписание начнётся заново");return}
      // книга служения читается рядом с основным расписанием Библии
      if(!(tracks().spb&&!noPlan()&&!noActive())){toast("Сначала включите основное расписание Библии — книга служения читается рядом с ним");return}
      state.myScheds=state.myScheds||{};state.myScheds[d.id]=d;state.plans=state.plans||{};state.plans[d.id]={nt:{log:[],read:[]},ot:{log:[],read:[]},frzDays:[],def:d};
      state.extra=state.extra||{};state.extra[d.id]=true;state.planChosen=true;save();close();setSchedView("");render();
      toast("«"+d.name+"» добавлено — оно на главной");});
  }
  if(start==="custom")custom(E);else if(start==="ms")ms(E);else list();modal.append(sheet);document.body.append(modal);
}
function autoName(set){const a=BOOKS.filter(b=>set.has(b.a)),sh=b=>b.n.replace(/^Евангелие (от|по) /,"По ");if(!a.length)return "Моё расписание";
  if(a.length===66)return "Вся Библия";if(a.length===39&&a.every(b=>b.t==="ot"))return "Ветхий Завет";if(a.length===27&&a.every(b=>b.t==="nt"))return "Новый Завет";
  if(a.length===1)return a[0].n;
  const secs=SECTIONS.filter(([id])=>BOOKS.filter(b=>b.s===id).every(b=>set.has(b.a))),cov=new Set(secs.flatMap(([id])=>BOOKS.filter(b=>b.s===id).map(b=>b.a)));
  let n;if(secs.length&&secs.length<=3&&a.every(b=>cov.has(b.a)))n=secs.map(x=>x[1]).join(", ");
  else if(a.length<=3)n=a.map(sh).join(", ");else n=sh(a[0])+" — "+sh(a[a.length-1]);
  return n.length>40?n.slice(0,39)+"…":n}
function part2(S,k,p){const d=S.plan[Math.min(p,S.plan.length-1)];return k==="nt"&&d[4]?{book:d[0],ref:d[1],url:d[4],title:d[5]}:{book:d[T[k].bi],ref:d[T[k].ri]}}
function SCHED_SPB(){return buildSched({id:"spb"})}
$("planOpen").addEventListener("click",openPlans);
$("booksOpen").addEventListener("click",()=>openBooks());
$("libCard").addEventListener("click",()=>openBooks());
/* ссылка с #library сразу открывает библиотеку */
if(location.hash==="#library")setTimeout(()=>{try{setPage("awards")}catch(e){}openBooks()},400);
/* ---------- книжная полка: прочитанные книги и когда они дочитаны ---------- */
// книга прочитана, когда отмечены все её дни подряд в расписании; дата — день, когда отмечен последний из них
function booksFinished(){
  const res=[];
  const scan=(plan,keys,st,name)=>keys.forEach(k=>{
    const bi=T[k].bi, when=new Map();((st[k]&&st[k].log)||[]).forEach(x=>{if(!when.has(x.p)||x.d>when.get(x.p))when.set(x.p,x.d)});
    let i=0;while(i<plan.length){const b=plan[i][bi];if(!b||!BOOK[b]){i++;continue}let j=i;while(j+1<plan.length&&plan[j+1][bi]===b)j++;
      // книга должна начинаться с 1-й главы (в церковном плане последняя книга года обрывается)
      let ok=parseInt(plan[i][bi+1],10)===1, last="";
      if(ok){const lastRef=plan[j][bi+1], [,z]=chapRange(lastRef), m=/^\d+:\d+[–—-](?:\d+:)?(\d+)$/.exec(lastRef)||/^\d+:(\d+)$/.exec(lastRef);ok=z===BOOK[b].v.length&&(!m||+m[1]===BOOK[b].v[z-1])}
      for(let p=i;ok&&p<=j;p++){const d=when.get(p);if(!d)ok=false;else if(d>last)last=d}
      if(ok)res.push({a:b,d:last,plan:name});i=j+1}
  });
  scan(PLAN,KEYS,state,SCHED.name);
  Object.entries(state.plans||{}).forEach(([id,x])=>{try{const S=buildSched(x.def||{id});scan(S.plan,S.keys,x,S.name)}catch(e){}});
  return res.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
}
// для друзей: [[книга, дата первого прочтения, сколько раз], ...]
function booksSummary(){const m=new Map();booksFinished().forEach(x=>{const o=m.get(x.a);if(o)o[2]++;else m.set(x.a,[x.a,x.d,1])});return [...m.values()]}
function nextBookHint(){let best=null;KEYS.forEach(k=>{const np=nextP(k);if(np>=DAYS)return;const b=PLAN[np][T[k].bi];let j=np;while(j+1<DAYS&&PLAN[j+1][T[k].bi]===b)j++;const left=j-np+1;if(!best||left<best.left)best={b,left}});return best}
/* книжная полка: что прочитано в книгах служения — по всем расписаниям (включённым, на паузе, дочитанным) */
function msShelf(){
  const out={};
  Object.entries(state.plans||{}).forEach(([id,x])=>{const d=x.def||(state.myScheds||{})[id];if(!d||!d.ms||!msBook(d.ms))return;
    let S;try{S=buildMs(d)}catch(e){return}
    const st=x.nt||{read:[],log:[]},rd=new Set(st.read||[]),when=new Map();(st.log||[]).forEach(l=>{if(!when.has(l.p)||l.d>when.get(l.p))when.set(l.p,l.d)});
    const B=msBook(d.ms),o=out[d.ms]||(out[d.ms]={id:d.ms,B,total:B.m.length,done:new Set(),started:new Set(),last:"",first:"",on:false});
    if((state.extra||{})[id])o.on=true;
    if(d.paper)for(let n=1;n<(+d.from||1);n++){o.done.add(n);o.started.add(n)} // прочитано раньше, например в бумажной книге
    const rows=new Map();S.plan.forEach((r,p)=>{if(r[6])(rows.get(r[6])||rows.set(r[6],[]).get(r[6])).push(p)});
    rows.forEach((ps,n)=>{const got=ps.filter(p=>rd.has(p));if(got.length)o.started.add(n);if(got.length===ps.length)o.done.add(n)});
    when.forEach(dt=>{if(dt>o.last)o.last=dt;if(!o.first||dt<o.first)o.first=dt});
  });
  return Object.values(out).filter(o=>o.started.size||o.on).map(o=>Object.assign(o,{n:o.done.size,pct:Math.round(o.done.size/o.total*100),full:o.done.size===o.total}))
    .sort((a,b)=>a.last<b.last?1:a.last>b.last?-1:0);
}
function openBooks(list,who){
  const mine=!list; list=list||booksSummary();
  if(mine&&!state.libSeen){state.libSeen=true;save();try{applyPtr()}catch(e){}}
  const read=new Map(list.map(x=>[x[0],x]));
  const modal=el("div","fmodal"),sheet=el("div","fsheet bshelf lib");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label",mine?"Моя библиотека":"Библиотека");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};
  modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
  const head=el("div","fhead"),h=el("h2",null,mine?"Моя библиотека":"Библиотека · "+(who||"друг"));const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);head.append(h,x);
  sheet.append(head);
  const ms=mine?msShelf():[],byId=new Map(ms.map(o=>[o.id,o])),lsAll=ms.filter(o=>o.B.k==="ls"),oth=ms.filter(o=>o.B.k!=="ls");
  const nB=read.size,nLs=lsAll.filter(o=>o.full).length;
  // итоги: по одной плитке на каждую часть шкафа
  const sum=el("div","libsum");
  const tile=(num,of,label)=>{const t=el("div","libtile");const b=el("b",null,String(num));if(of)b.append(el("small",null," / "+of));t.append(b,el("span",null,label));return t};
  sum.append(tile(nB,66,plural(nB,"книга Библии","книги Библии","книг Библии")));
  if(mine){sum.append(tile(nLs,MSB.ls.length,"Жизнеизучений"+(lsAll.length>nLs?" · начато "+(lsAll.length-nLs):"")));
    const nO=oth.filter(o=>o.full).length;sum.append(tile(nO,0,plural(nO,"книга служения","книги служения","книг служения")+(oth.length>nO?" · читаю "+(oth.length-nO):"")))}
  sheet.append(sum);
  // шкаф: сверху Библия, ниже Жизнеизучение, ниже остальные книги служения
  const cab=el("div","bcase"),info=el("div","shelfinfo libinfo","Нажмите на корешок — покажу, что прочитано.");
  const pick=(sp,html)=>{cab.querySelectorAll(".spine.on").forEach(q=>q.classList.remove("on"));sp.classList.add("on");info.innerHTML=html};
  const board=(plate,sub,row,cls)=>{const w=el("div","bboard"+(cls?" "+cls:""));const pl=el("div","bplank");pl.append(el("b",null,plate));if(sub)pl.append(el("span",null,sub));w.append(row,pl);cab.append(w)};
  [["ot","Ветхий Завет"],["nt","Новый Завет"]].forEach(([t,title])=>{
    const L=BOOKS.filter(b=>b.t===t),row=el("div","shelfrow");
    L.forEach(b=>{const r=read.get(b.a),sp=el("span","spine"+(r?"":" unread"));sp.style.height=Math.round(26+Math.sqrt(b.v.length)*4.2)+"px";if(r)sp.style.backgroundColor=SECCOL[b.s];
      sp.title=b.n;sp.tabIndex=0;
      const show=()=>pick(sp,"<b>"+b.n+"</b> · "+(r?"прочитана "+fmtLong(r[1])+(r[2]>1?" · "+r[2]+" "+plural(r[2],"раз","раза","раз"):""):"ещё не прочитана"));
      sp.addEventListener("click",show);sp.addEventListener("mouseenter",show);sp.addEventListener("focus",show);row.append(sp)});
    board("Библия · "+title,L.filter(b=>read.has(b.a)).length+" из "+L.length,row)});
  const spineMs=(o,B,label,col,name)=>{const sp=el("span","spine lspine"+(o?(o.full?" full":""):" unread"));
    const pages=B?B.last:400;sp.style.height=(B&&B.k!=="ls"?96:Math.round(Math.min(100,46+Math.sqrt(pages)*2.2)))+"px";
    sp.style.setProperty("--c",col);sp.style.setProperty("--f",(o?(o.full?100:Math.max(7,o.pct)):0)+"%");
    sp.append(el("i",null,label));sp.title=name;sp.tabIndex=0;
    const what=B&&B.k!=="ls"?"глав":"сообщений";
    const show=()=>pick(sp,"<b>"+name+"</b> · "+(o?(o.full?"прочитана целиком":"прочитано "+o.n+" из "+o.total+" "+what)+(o.on&&!o.full?" · читаю":""):"ещё не начата"));
    sp.addEventListener("click",show);sp.addEventListener("mouseenter",show);sp.addEventListener("focus",show);return sp};
  if(mine){
    const LSS=["Быт","Исх","Лев","Чис","Втор","Нав–Руфь","1–2 Цар","3–4 Цар","Пар–Есф","Иов","Пс","Притч–Еккл","Песн","Ис","Иер","Иез","Дан","Мал. пр","Мф","Мк","Лк","Ин","Деян","Рим","1 Кор","2 Кор","Гал","Еф","Флп","Кол","1–2 Фес","Тим–Флм","Евр","Иак","1 Пет","2 Пет","Ин–Иуд","Откр"];
    [[0,18,"Ветхий Завет","#b8722c"],[18,38,"Новый Завет","#3b6fb0"]].forEach(([a,z,t,col])=>{
      const row=el("div","shelfrow lsrow");const part=MSB.ls.slice(a,z);
      part.forEach(([id,n],j)=>{const o=byId.get(id);row.append(spineMs(o,msBook(id),LSS[a+j]||n,col,"Жизнеизучение: "+n))});
      const got=part.filter(([id])=>byId.has(id)),done=got.filter(([id])=>byId.get(id).full).length;
      board("Жизнеизучение · "+t,done+" из "+part.length,row,"lsboard")});
    const row=el("div","shelfrow lsrow orow");const pal=["#7a5cc4","#2f8f6b","#a8443f","#3b6fb0","#b07a2c","#5a6b8c"];
    oth.forEach((o,i)=>row.append(spineMs(o,o.B,o.B.t.length>16?o.B.t.slice(0,15)+"…":o.B.t,pal[i%pal.length],o.B.t+" · "+o.B.a)));
    row.append(el("span","bslot","Здесь встанут книги, которые вы читаете"));
    board("Книги служения",oth.filter(o=>o.full).length+" прочитано",row,"lsboard")}
  sheet.append(cab,info);
  // ниже шкафа — подробности в том же порядке
  if(mine){
    const item=o=>{const li=el("div","msbk"+(o.full?" full":""));const tx=el("div","msbt");
      tx.append(el("b",null,o.B.t),el("span",null,(o.full?"прочитана целиком":o.n+" из "+o.total+" "+(o.B.k==="ls"?"сообщений":"глав"))+(o.last?" · "+(o.full?fmtLong(o.last):"последнее — "+fmtLong(o.last)):"")));
      const pc=el("span","msbp"+(o.full?" ok":o.on?" on":""),o.full?"✓":o.on?"читаю":"пауза");
      const br=el("div","msbbar"),bi=el("i");bi.style.width=Math.max(o.n?2:0,o.pct)+"%";br.append(bi);
      const top=el("div","msbtop");top.append(tx,pc);li.append(top,br);return li};
    if(ms.length){sheet.append(el("div","plab","Книги служения — читаю и прочитано"));const l=el("div","msbl");lsAll.concat(oth).forEach(o=>l.append(item(o)));sheet.append(l)}
    else sheet.append(el("p","hint","Жизнеизучение и другие книги добавляются в «Расписаниях» → «＋ Добавить» → «Книга служения»."))}
  if(nB){const ul=el("ol","bslist");
    list.slice().sort((a,b)=>a[1]<b[1]?1:a[1]>b[1]?-1:0).forEach(([a,d,c])=>{const b=BOOK[a];if(!b)return;const li=el("li");const dot=el("i");dot.style.background=SECCOL[b.s];
      const tx=el("div");tx.append(el("b",null,b.n),el("span",null,"прочитана "+fmtLong(d)+(c>1?" · "+c+" "+plural(c,"раз","раза","раз"):"")));li.append(dot,tx);ul.append(li)});
    sheet.append(el("div","plab","Библия — по порядку прочтения"),ul)}
  else sheet.append(el("p","hint",mine?"Ни одна книга Библии пока не прочитана целиком.":"Пока ни одной книги Библии целиком."));
  if(mine){const nb=nextBookHint();if(nb)sheet.append(el("p","bsnext","Ближе всего: «"+(FULL[nb.b]||nb.b)+"» — осталось "+nb.left+" "+plural(nb.left,"день","дня","дней")+" чтения"))}
  modal.append(sheet);document.body.append(modal);
}
/* ---------- пройденные расписания и управление своими расписаниями ---------- */
// расписание пройдено, когда прочитаны все его дни; запоминаем это навсегда (даже если расписание потом удалить)
function planDoneInfo(id,def,st){let S=null;try{S=id===SCHED.id?SCHED:buildSched(def||{id})}catch(e){return null}
  // прочитано всё, где есть чтение (в книгах служения бывают дни без чтения)
  if(!S.keys.every(k=>{const r=new Set((st[k]&&st[k].read)||[]);for(let p=0;p<S.plan.length;p++){if(r.has(p))continue;let b=true;try{b=!!part2(S,k,p).book}catch(e){}if(b)return false}return true}))return null;
  const end=S.keys.flatMap(k=>((st[k]&&st[k].log)||[]).map(x=>x.d)).sort().pop()||today();
  const first=S.keys.flatMap(k=>((st[k]&&st[k].log)||[]).map(x=>x.d)).sort()[0]||S.start;
  const d=id===SCHED.id?SCHED.def:def,n=S.keys.reduce((a,k)=>a+(((st[k]&&st[k].read)||[]).length),0);
  const f={id,name:S.name,days:S.plan.length,start:first,end,n};if(d&&d.custom){f.emb=myEmb(d);f.def=JSON.parse(JSON.stringify(d))}return f}
/* прочитанное расписание висит на главной до конца дня (можно нажать «Отменить»), а назавтра уходит само */
function finRetire(){
  if(finRetire.busy)return;finRetire.busy=true;
  try{const t=today();let ch=false;
    state.finished=(state.finished||[]).filter(f=>{if(f.gone||f.end<t)return true;
      const st=f.id===SCHED.id?state:(state.plans||{})[f.id],def=f.id===SCHED.id?SCHED.def:(st&&st.def);
      let ok=true;try{ok=!!(st&&planDoneInfo(f.id,def,st))}catch(e){}
      if(!ok){ch=true;if(f.cel){state.finCel=state.finCel||{};state.finCel[f.id]=t}}return ok}); // отметку отменили в тот же день — расписание снова в работе
    state.finished.forEach(f=>{if(f.gone||f.end>=t)return;f.gone=true;ch=true;try{retirePlan(f.id)}catch(e){console.warn(e)}});
    if(ch)save();
  }finally{finRetire.busy=false}}
function noteFinished(){
  try{finRetire()}catch(e){console.warn(e)}
  state.finished=state.finished||[];const have=new Set(state.finished.map(x=>x.id));let added=false;
  const check=(id,def,st)=>{if(have.has(id))return;const f=planDoneInfo(id,def,st);if(f){if((state.finCel||{})[id]===today())f.cel=true;state.finished.push(f);have.add(id);added=true}};
  check(SCHED.id,SCHED.def,state);
  Object.entries(state.plans||{}).forEach(([id,x])=>check(id,x.def,x));
  if(added)save();
  if(state.finished.some(f=>f.def&&!f.cel))setTimeout(celebrateNext,450);
  return added;
}
/* Своё расписание прочитано: праздник, и оно уходит с главной в профиль — «Прочитанные расписания» */
var celOpen=false;
function celebrateNext(){
  if(celOpen)return;const f=(state.finished||[]).find(x=>x.def&&!x.cel);if(!f)return;celOpen=true;
  const nth=(state.finished||[]).filter(x=>x.name===f.name&&x.end<=f.end).length;
  const ov=el("div","celov"),box=el("div","celbox");box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");
  const em=el("div","celemb");em.append(icoEl(f.emb||"book"));
  box.append(em,el("div","celk","Расписание прочитано!"),el("h2",null,"«"+f.name+"»"+(nth>1?" · "+nth+"-й раз":"")));
  const stt=el("div","celst");[[f.days,plural(f.days,"день","дня","дней")],[f.n||0,plural(f.n||0,"отрывок","отрывка","отрывков")]].forEach(([v,l])=>{const c=el("div");c.append(el("b",null,String(v)),el("span",null,l));stt.append(c)});
  box.append(stt,el("p","celp",fmtLong(f.start)+" — "+fmtLong(f.end)),el("p","celp2","Сегодня оно ещё на главной — можно отменить отметку. Завтра оно само уйдёт в «Архив» (вкладка «Библиотека»)."));
  const ok=el("button","btn-main","Отлично! 🎉");ok.type="button";
  const done=()=>{f.cel=true;ov.classList.add("out");setTimeout(()=>{ov.remove();celOpen=false;save();render();setTimeout(celebrateNext,300)},250)}; // уйдёт с главной завтра (finRetire)
  ok.addEventListener("click",done);box.append(ok);ov.append(box);document.body.append(ov);
  vibrate([20,40,20]);
  const r=em.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  [0,350,800].forEach((t,i)=>setTimeout(()=>{try{burst(cx,cy,i?50:90,["#ffc53d","#ff7a1a","#3fbf82","#6aa8ff","#ff5b6b","#fff"])}catch(e){}},t));
}
// прочитанное своё расписание уходит с главной и из «Моих расписаний» (прогресс и история остаются)
function retirePlan(id){
  if(id==="spb")return false;
  if(state.extra&&state.extra[id]){delete state.extra[id];save();return false}
  if(id===SCHED.id&&!SCHED.spb){state.myScheds=state.myScheds||{};state.myScheds[id]=SCHED.def;
    const ex=xOnMain();if(ex.length){const n=ex[0];delete state.extra[n];save();switchPlan(xDef(n));return true}
    state.tracks=Object.assign(tracks(),{spb:false});save();try{applyAppMode()}catch(e){}return false}
  return false}
// «Прочитать ещё раз»: та же программа с сегодняшнего дня
function rereadPlan(f){const o=f.def;if(!o)return;
  if(o.ms&&!(tracks().spb&&!noPlan()&&!noActive())){toast("Сначала включите основное расписание Библии — книга служения читается рядом с ним");return}
  const d=Object.assign({},o,{id:"my-"+Date.now().toString(36),start:today()});
  if(o.by==="end"&&o.end&&o.start)d.end=add(today(),Math.max(1,dayNo(o.end)-dayNo(o.start)));
  state.planChosen=true;state.myScheds=state.myScheds||{};state.myScheds[d.id]=d;
  if(tracks().spb&&!noPlan()&&!noActive()){state.plans=state.plans||{};state.plans[d.id]={nt:{log:[],read:[]},ot:{log:[],read:[]},frzDays:[],def:d};
    state.extra=state.extra||{};state.extra[d.id]=true;save();render();toast("«"+d.name+"» — снова читаем, с сегодняшнего дня. Оно на главной");return}
  state.tracks=Object.assign(tracks(),{spb:true});switchPlan(d)}
function finishedPlans(){return (state.finished||[]).slice().sort((a,b)=>a.end<b.end?1:-1)}
function openFinished(list,who){
  const mine=!list;list=list||finishedPlans();
  const modal=el("div","fmodal"),sheet=el("div","fsheet pdone-sheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};
  modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
  const head=el("div","fhead"),h=el("h2",null,mine?"Прочитанные расписания":"Прочитанные расписания · "+(who||"друг"));const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);head.append(h,x);
  const big=el("div","bsbig");big.innerHTML="<b>"+list.length+"</b><span>"+plural(list.length,"расписание прочитано","расписания прочитано","расписаний прочитано")+" до конца</span>";
  sheet.append(head,big);
  if(!list.length)sheet.append(el("p","hint",mine?"Когда вы дочитаете своё расписание, оно переедет сюда с главной — как книга на полку.":"Пока ни одного расписания до конца."));
  const ul=el("ol","fdlist");
  list.forEach(f=>{const nm=f.name||(typeof f.n==="string"?f.n:"")||"Расписание",days=f.days||f.d||0,end=f.end||f.f;
    const nth=list.filter(x=>(x.name||x.n)===nm&&(x.end||x.f)<=end).length;
    const li=el("li");const ic=el("span","fdemb");ic.append(icoEl(f.emb||f.e||(f.id==="spb"?"flame":"book")));const tx=el("div");
    const tl=el("b",null,nm);if(nth>1)tl.append(el("span","fdnth",nth+"-й раз"));
    tx.append(tl,el("span",null,days+" "+plural(days,"день","дня","дней")+(f.start?" · "+fmtLong(f.start)+" — ":" · завершено ")+fmtLong(end)));li.append(ic,tx);
    if(mine&&f.def){const rb=el("button","fdre","Ещё раз");rb.type="button";rb.title="Прочитать ещё раз — с сегодняшнего дня";confirmTap(rb,"Начать?",()=>{close();rereadPlan(f)});li.append(rb)}
    ul.append(li)});
  if(list.length)sheet.append(ul);
  modal.append(sheet);document.body.append(modal);
}
// удаление своих расписаний (только из профиля); дни чтения остаются в серии
function myPlanList(){return myPlanList0().filter(d=>String(d.id).indexOf("fire-")!==0)}
function myPlanList0(){const out=new Map();
  Object.values(state.myScheds||{}).forEach(d=>out.set(d.id,d));
  if(!SCHED.spb)out.set(SCHED.id,SCHED.def);
  Object.entries(state.plans||{}).forEach(([id,x])=>{if(id!=="spb"&&x.def)out.set(id,x.def)});
  return [...out.values()]}
function deletePlan(id){
  if(id==="spb")return;
  const keepDates=st=>((st&&st.nt&&st.nt.log)||[]).concat((st&&st.ot&&st.ot.log)||[]).map(x=>x.d).concat((st&&st.frzDays)||[]);
  if(id===SCHED.id){
    state.hist=[...new Set([...(state.hist||[]),...keepDates(state)])].sort().slice(-800);
    const back=(state.plans||{}).spb;
    state.nt=back?back.nt:{log:[],read:[]};state.ot=back?back.ot:{log:[],read:[]};state.frzDays=back?back.frzDays||[]:[];
    if(state.plans)delete state.plans.spb;
    if(state.myScheds)delete state.myScheds[id];
    state.schedDef={id:"spb"};state.sched="spb";
    const done=()=>location.reload();let p=null;try{p=save()}catch(e){}
    Promise.race([Promise.resolve(p),new Promise(r=>setTimeout(r,2500))]).then(done,done);toast("Расписание удалено");return true;
  }
  const x=(state.plans||{})[id];if(x)state.hist=[...new Set([...(state.hist||[]),...keepDates(x)])].sort().slice(-800);
  if(state.plans)delete state.plans[id];if(state.myScheds)delete state.myScheds[id];save();toast("Расписание удалено");return false;
}
function openPlanEditor(){
  const modal=el("div","fmodal","");const sheet=el("div","fsheet psheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};
  modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
  function draw(){
    sheet.textContent="";
    const head=el("div","fhead"),h=el("h2",null,"Мои расписания");const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);head.append(h,x);sheet.append(head);
    const tt=tracks(),hl=state.ptrEdit==="on";let rows=0;
    const btn=(cls,txt,fn)=>{const b=el("button","pact "+cls,txt);b.type="button";b.addEventListener("click",fn);return b};
    // «Изменить»: пока человек его не нажал, кнопка подсвечена (указатель с имени ведёт сюда)
    const edit=fn=>btn("edit"+(hl?" ptr":""),"Изменить",()=>{if(state.ptrEdit==="on"){state.ptrEdit="done";save();try{applyPtr()}catch(e){}}close();fn()});
    const row=(on,name,sum,extra,btns)=>{const r=el("div","pedit"+(on?" on":""));const t=el("div","ptxt");t.append(el("b",null,name),el("span",null,sum));if(extra)t.append(el("span","pdone",extra));const bx=el("div","pbtns");bx.append(...btns);r.append(t,bx);sheet.append(r);rows++};
    if(noPlan())sheet.append(el("p","hint","Вы ещё не выбрали расписание."));
    else{
      const again=()=>canUndo()?[btn("read","Выбрать заново",()=>{close();reChoose()})]:[];
      if(tt.spb&&SCHED.spb)row(true,SCHED.name,schedSummary(SCHED),"Читаете сейчас · прочитано отрывков: "+planProgress("spb"),[edit(()=>openPlans()),...again()]);
      if(tt.conf&&confSt().joined&&today()<="2026-10-28")row(true,"Челлендж «Божья гора»","Исход 19–20 и Псалом 119 · до 28 октября",confSt().log.length?"Прочитано частей: "+confSt().log.length:"Участвуете",[edit(()=>openPlans()),...(tt.spb?[]:again())]);
    }
    myPlanList().forEach(d=>{let S=null;try{S=buildSched(d)}catch(e){}if(!S)return;const cur=d.id===SCHED.id&&tt.spb;
      const del=el("button","pdel","Удалить");del.type="button";
      del.addEventListener("click",()=>{if(!del.dataset.armed){del.dataset.armed="1";del.textContent="Точно удалить?";del.classList.add("armed");setTimeout(()=>{delete del.dataset.armed;del.textContent="Удалить";del.classList.remove("armed")},3500);return}
        if(!deletePlan(d.id))draw()});
      row(cur,S.name,schedSummary(S),(cur?"Читаете сейчас · ":"")+"прочитано отрывков: "+planProgress(d.id),[cur?edit(()=>openPlans("custom",d)):btn("read","Читать",()=>{close();switchPlan(d)}),del])});
    if(!rows&&!noPlan())sheet.append(el("p","hint","У вас пока нет своих расписаний."));
    if(hl&&rows)sheet.append(el("p","hint ptrhint","Нажмите «Изменить», чтобы поменять расписание, — и подсказка исчезнет."));
    if(hl&&!rows){state.ptrEdit="done";save();try{applyPtr()}catch(e){}}
    const add=el("button","pnew pbig");add.type="button";add.append(el("b",null,"＋ Создать своё расписание"),el("span",null,"Выберите книги, темп и дату начала"));add.addEventListener("click",()=>{close();openPlans("custom")});sheet.append(add);
    sheet.append(el("p","hint","Удалённое расписание пропадёт вместе с прогрессом по нему. Дни, когда вы читали, останутся в серии, а дочитанные — в «Прочитанных расписаниях» в профиле. Расписание церкви удалить нельзя — можно перейти на другое."));
  }
  draw();modal.append(sheet);document.body.append(modal);
}
function renamePlan(id,name,emb){
  const fix=d=>{if(d&&d.id===id){d.name=name;if(emb)d.emb=emb}};
  fix(state.schedDef);fix((state.myScheds||{})[id]);fix(((state.plans||{})[id]||{}).def);
  const done=()=>location.reload();let p=null;try{p=save()}catch(e){}
  Promise.race([Promise.resolve(p),new Promise(r=>setTimeout(r,2500))]).then(done,done);toast("Сохранено");
}
/* ---------- «Без расписания»: новый человек ещё ничего не выбрал ----------
   Без расписания — тот, кто не прочитал ни одного отрывка ни в одном расписании и в челлендже
   (даже если раньше по умолчанию стоял на расписании церкви или нажал «участвовать»).
   Считается каждый раз заново, ничего не стирается: стоит прочитать или выбрать — и всё как обычно. */
function noPlan(){return !state.planChosen&&noReads()}
// ничего не прочитано ни в одном расписании и в челлендже (своих расписаний тоже нет)
function noReads(){
  if(!SCHED.spb||Object.keys(state.myScheds||{}).length)return false;
  if(state.nt.read.length||state.ot.read.length||(state.frzDays||[]).length)return false;
  if(Object.values(state.plans||{}).some(x=>x&&((x.nt&&x.nt.read&&x.nt.read.length)||(x.ot&&x.ot.read&&x.ot.read.length))))return false;
  const c=state.conf;if(c&&c.log&&c.log.length)return false;
  if((state.hist||[]).length||(state.finished||[]).length)return false;
  return true;
}

/* ---------- Несколько расписаний сразу ----------
   Основное (SCHED) — как раньше: серия, путь и вопросы. Остальные включённые (state.extra) читаются рядом:
   их прогресс — в state.plans[id], на главной у каждого свой блок. Челлендж включается переключателем (tracks.conf).
   Серия: день засчитан, если прочитан хотя бы один отрывок из любого расписания; огонёк горит полностью — когда прочитано всё. */
function xDef(id){if(id==="spb")return {id:"spb"};return (state.myScheds||{})[id]||((state.plans||{})[id]||{}).def||null}
function xOnMain(){return xOn().filter(id=>{const d=xDef(id);return d&&!d.ms&&String(id).indexOf("fire-")!==0})}
/* основным стала книга служения или расписание группы, а церковь — дополнительным: вернуть церковь основной с её прогрессом */
function churchRepair(){try{if(SCHED.spb||!(SCHED.ms||String(SCHED.id).indexOf("fire-")===0))return false;if(!tracks().spb||noPlan())return false;const ex=state.extra||{},sv=(state.plans||{}).spb;if(!ex.spb&&!sv)return false;let n=0;try{n=+sessionStorage.getItem("ogonek-church-fix2")||0;sessionStorage.setItem("ogonek-church-fix2",String(n+1))}catch(e){}if(n>=2)return false;state.extra=Object.assign({},ex);state.extra[SCHED.id]=true;delete state.extra.spb;switchPlan({id:"spb"});return true}catch(e){console.warn(e);return false}}
function xOn(){if(!tracks().spb||noPlan())return [];return Object.keys(state.extra||{}).filter(id=>state.extra[id]&&id!==SCHED.id&&xDef(id))}
function xSt(id){state.plans=state.plans||{};let p=state.plans[id];if(!p)p=state.plans[id]={nt:{log:[],read:[]},ot:{log:[],read:[]},frzDays:[],def:xDef(id)};p.nt=p.nt||{log:[],read:[]};p.ot=p.ot||{log:[],read:[]};return p}
function xS(id){const C=window.__xc||(window.__xc={}),d=xDef(id);if(!d)return null;const key=JSON.stringify(d);if(!C[id]||C[id].k!==key){try{C[id]={k:key,S:buildSched(d)}}catch(e){return null}}return C[id].S}
function xNext(id,k){const S=xS(id),st=xSt(id)[k],r=new Set(st.read),sk=new Set(st.skip||[]);let p=0;while(p<S.plan.length&&(r.has(p)||sk.has(p)||!part2(S,k,p).book))p++;return p}
// отстал — пропускаю долг и читаю вместе с церковью; пропущенное остаётся «отложенным», его можно дочитать позже
// 13.11: книги служения «В неделю» — отставание считается только за прошедшие недели (с понедельника), а не по дням внутри недели
function xCut(id,S){const ti=dayNo(today())-dayNo(S.start),d=xDef(id)||{};if(!S.ms||(d.by&&d.by!=="week"))return ti;const t=parse(today()),mon=dayNo(today())-((t.getDay()+6)%7);return Math.min(ti,mon-dayNo(S.start))}
function xLateParts(id,k){const S=xS(id),st=xSt(id)[k],r=new Set(st.read),sk=new Set(st.skip||[]),ti=xCut(id,S),out=[];for(let p=0;p<Math.min(ti,S.plan.length);p++){let x;try{x=part2(S,k,p)}catch(e){continue}if(x.book&&!r.has(p)&&!sk.has(p))out.push(p)}return out}
function xLateUnits(id,k){const S=xS(id),ps=xLateParts(id,k);return S.ms?new Set(ps.map(p=>S.plan[p][6]||p)).size:ps.length}
function xJump(id,k){const st=xSt(id)[k];st.skip=[...new Set([...(st.skip||[]),...xLateParts(id,k)])];save();render();try{toast("Пропущенное отложено — читайте по расписанию")}catch(e){}}
function xUnjump(id,k){const st=xSt(id)[k];st.skip=[];save();render()}
function xToday(id,k){return xSt(id)[k].log.filter(x=>x.d===today())}
// что ещё не прочитано сегодня в дополнительных расписаниях и челлендже (для огонька «полностью»)
function xCount(bible){let d=0,t=0;const left=[];xOn().forEach(id=>{const S=xS(id);if(!S||S.start>today()||(bible&&S.ms))return;S.keys.forEach(k=>{const r=xToday(id,k).length>0;if(!r&&xNext(id,k)>=S.plan.length)return;
    if(!r&&S.ms){const ti=dayNo(today())-dayNo(S.start);if(ti<S.plan.length&&!S.plan[ti][0]&&xNext(id,k)>=ti)return}
    t++;if(r)d++;else if(!left.includes(xName(id)))left.push(xName(id))})});
  const tt=tracks();if(!bible&&tt.spb&&tt.conf&&confSt().joined&&today()<="2026-10-28"){let all=false;try{const r=confRead();all=CONF_UNITS.every(u=>r.has(u.i))}catch(e){}
    const rd=confSt().log.some(x=>x.d===today());if(!all||rd){t++;if(rd)d++;else left.push("челлендж «Божья гора»")}}
  xCount.left=left;return [d,t]}
function xMark(id,k,p){const bkB=bkSnap();setTimeout(()=>{try{bkCheck(bkB)}catch(e){}},0);try{const S=xS(id);askVerseSoon(k,p,1400,part2(S,k,p),id)}catch(e){}const st=xSt(id);const first=!anySet().has(today());st[k].log.push({d:today(),p});if(!st[k].read.includes(p))st[k].read.push(p);state.xp=(state.xp||0)+5;save();render();
  const c=xCount();try{if(first)ignite($("heroFlame"),1)}catch(e){}toast(first?"Огонёк зажёгся — день засчитан в серию":"Отмечено ✓")}
function xUndo(id,k){const st=xSt(id),l=st[k].log;for(let i=l.length-1;i>=0;i--)if(l[i].d===today()){const p=l.splice(i,1)[0].p;if(!l.some(y=>y.p===p))st[k].read=st[k].read.filter(x=>x!==p);break}save();render()}
function xDate(S,p){return parse(add(S.start,p)).toLocaleDateString("ru-RU",{weekday:"short",day:"numeric",month:"long"})}
function xName(id){return id==="spb"?"Церковь":(xDef(id)||{}).name||"Моё расписание"}
function churchOn(){return (SCHED.spb&&tracks().spb&&!noPlan())||!!(state.extra||{}).spb&&tracks().spb}
function enableChurch(){state.planChosen=true;
  if(SCHED.spb){state.tracks=Object.assign(tracks(),{spb:true});save();applyAppMode();render();toast("Расписание церкви включено");return}
  if(tracks().spb&&!noActive()){state.extra=state.extra||{};state.extra.spb=true;xSt("spb");save();if(churchRepair())return;render();toast("Расписание церкви включено — оно на главной");return}
  switchPlan({id:"spb"})}
function noActive(){const t=state.tracks;return !noPlan()&&!!t&&t.spb===false&&!(t.conf&&confSt().joined&&today()<="2026-10-28")}
var xmapOpen=new Set(),xmapSel={},xmapAll=new Set();
function xmapToggle(id){xmapOpen.has(id)?xmapOpen.delete(id):xmapOpen.add(id);render()}
function xmapBtn(id){const b=el("button","xmapbtn"+(xmapOpen.has(id)?" on":""));b.type="button";b.setAttribute("aria-expanded",String(xmapOpen.has(id)));b.setAttribute("aria-label","Что прочитано, что нет");
  b.append(el("span",null,"Где я"),el("i"));b.addEventListener("click",e=>{e.stopPropagation();xmapToggle(id)});return b}
// карта дополнительного расписания: сообщения (книги служения) или дни (своя Библия)
function xmapEl(id){
  const S=xS(id),st=xSt(id);if(!S)return null;const ti=dayNo(today())-dayNo(S.start);
  const box=el("div","xmap");
  S.keys.forEach(k=>{
    const r=new Set(st[k].read),skp=new Set(st[k].skip||[]),PG=st[k].pg||{},U=[],byKey=new Map();
    S.plan.forEach((d,p)=>{let x;try{x=part2(S,k,p)}catch(e){return}if(!x.book)return;
      const key=S.ms?"m"+(d[6]||p):"d"+p;let u=byKey.get(key);
      if(!u){u={key,n:S.ms?(d[6]||U.length+1):U.length+1,title:S.ms?(x.title||""):"",parts:[]};byKey.set(key,u);U.push(u)}
      u.parts.push({p,x,done:r.has(p)})});
    if(!U.length)return;
    const nowP=Math.min(Math.max(0,ti),S.plan.length-1);
    const lc=xCut(id,S);let done=0,late=0,held=0;U.forEach(u=>{u.all=u.parts.every(q=>q.done);u.some=u.parts.some(q=>q.done||(PG[q.p]||[]).length);u.held=u.parts.some(q=>!q.done&&skp.has(q.p));u.late=u.parts.some(q=>!q.done&&q.p<lc&&!skp.has(q.p));if(u.held)held++;u.now=u.parts.some(q=>q.p===nowP)||(!U.some(v=>v.parts.some(q=>q.p===nowP))&&u.parts[0].p>nowP&&u===U.find(v=>v.parts[0].p>nowP));if(u.all)done++;if(u.late)late++});
    const unit=n=>S.ms?plural(n,"глава","главы","глав"):plural(n,"день","дня","дней");
    const sum=el("div","xmsum");
    if(late)sum.append(el("span","xmlate","отстаёте на "+late+" "+(S.ms?plural(late,"главу","главы","глав"):unit(late))));else if(ti>=0)sum.append(el("span","xmok","по плану ✓"));
    if(held&&!late)sum.append(el("span","xmheld","отложено: "+held+" "+(S.ms?plural(held,"глава","главы","глав"):unit(held))));
    if(S.keys.length>1)box.append(el("div","xmk",S.labels[k]));
    box.append(sum);
    if(late){const jb=el("button","xmjump","Пропустить "+late+" "+(S.ms?plural(late,"главу","главы","глав"):unit(late))+" и читать по расписанию");jb.type="button";
      confirmTap(jb,"Нажмите ещё раз — пропущенное будет отложено",()=>xJump(id,k));box.append(jb);
      box.append(el("div","xmhint","Пропущенные главы не потеряются — их можно дочитать в любое время."))}
    else if(held){const ub=el("button","linkbtn xmall","Вернуть отложенное в очередь");ub.type="button";ub.addEventListener("click",e=>{e.stopPropagation();xUnjump(id,k)});box.append(ub)}
    const grid=el("div","xmgrid");const sk=id+"|"+k;
    U.forEach(u=>{const c=el("button","xmc"+(u.all?" done":u.some?" part":u.late?" late":u.held?" held":"")+(u.now?" now":"")+(xmapSel[sk]===u.key?" sel":""),String(u.n));c.type="button";
      c.title=(S.ms?"Глава ":"День ")+u.n+(u.title?" «"+u.title+"»":"")+(u.all?" — прочитано":u.some?" — частично":" — не прочитано");
      c.addEventListener("click",e=>{e.stopPropagation();xmapSel[sk]=xmapSel[sk]===u.key?null:u.key;render()});grid.append(c)});
    // обычно отстают на 5–7 сообщений: сначала только пропущенные и сегодняшнее, вся сетка — по кнопке
    const full=xmapAll.has(sk)||!(late||held);
    if(!full){[...grid.children].forEach((c,i)=>{const u=U[i];if(!(u.late||u.held||u.now||u.key===xmapSel[sk]))c.remove()});grid.classList.add("short")}
    box.append(grid);
    if(late||held){const tg=el("button","linkbtn xmall",full?"Скрыть остальные":"Показать все "+U.length);tg.type="button";tg.addEventListener("click",e=>{e.stopPropagation();xmapAll.has(sk)?xmapAll.delete(sk):xmapAll.add(sk);render()});box.append(tg)}
    const su=U.find(u=>u.key===xmapSel[sk]);
    if(su){const dt=el("div","xmdet");
      // сколько страниц главы прочитано; страницы из «стр. 18–20»; можно отмечать по одной странице
      const rng=q=>{const m=/стр\.?\s*(\d+)(?:\s*[–-]\s*(\d+))?/.exec(q.x.ref||"")||/стр\.?\s*(\d+)(?:\s*[–-]\s*(\d+))?/.exec(refStr(q.x));if(!m)return[];const a=+m[1],b=m[2]?+m[2]:a,o=[];for(let i=a;i<=b&&o.length<40;i++)o.push(i);return o};
      let tot=0,rd=0;su.parts.forEach(q=>{const g=rng(q);tot+=g.length;rd+=q.done?g.length:g.filter(n=>(PG[q.p]||[]).includes(n)).length});
      const pr=el("div","xmpg");
      if(tot)pr.append(el("span",null,"прочитано "),el("b",null,rd+" из "+tot),el("span",null," "+plural(tot,"страницы","страниц","страниц")));
      else pr.append(el("span",null,"прочитано "),el("b",null,su.parts.filter(q=>q.done).length+" из "+su.parts.length),el("span",null," "+plural(su.parts.length,"части","частей","частей")));
      void pr;
      const nx=su.parts.find(q=>!q.done);
      // все страницы сообщения: зелёные — прочитаны; нажатие отмечает страницу (любую, не по порядку)
      if(nx){const g=rng(nx),a=el("a","xmread","Читать "+(g.length?"стр. "+g[0]+(g.length>1?"–"+g[g.length-1]:""):refStr(nx.x)));a.href=chapterUrl(nx.x);a.target="_blank";a.rel="noopener";dt.append(a)}
      dt.append(el("div","xmhint",tot?plural(tot,"страница","страницы","страниц").replace(/^/,tot+" ")+" · прочитано "+rd+" — нажмите на страницу, чтобы отметить или снять":"Части сообщения:"));
      const pw=el("div","xmpages");
      su.parts.forEach(q=>{const g=rng(q),have=PG[q.p]||[];
        const pages=g.length?g:[null];
        pages.forEach(n=>{const on=q.done||(n!=null&&have.includes(n)),c=el("button","xmpgc"+(on?" on":""),n!=null?String(n):(q.x.ref||"ч."));c.type="button";
          c.addEventListener("click",e=>{e.stopPropagation();
            // снять отметку со страницы прочитанной части: часть снова «не прочитана», остальные её страницы остаются отмеченными
            if(q.done){const s2=xSt(id)[k];s2.read=s2.read.filter(v=>v!==q.p);s2.log=s2.log.filter(x=>!(x.p===q.p&&x.d===today()));
              s2.pg=s2.pg||{};const rest=g.filter(v=>v!==n);if(rest.length)s2.pg[q.p]=rest;else delete s2.pg[q.p];save();render();return}
            if(n==null){xMark(id,k,q.p);return}
            const s2=xSt(id)[k];s2.pg=s2.pg||{};let cur=s2.pg[q.p]||[];cur=cur.includes(n)?cur.filter(v=>v!==n):[...cur,n];
            if(g.every(v=>cur.includes(v))){delete s2.pg[q.p];xMark(id,k,q.p)}else{if(cur.length)s2.pg[q.p]=cur;else delete s2.pg[q.p];save();render()}});pw.append(c)})});
      dt.append(pw);
      if(!nx)dt.append(el("div","xmok","Глава "+su.n+" прочитана ✓"));
      if(nx&&su.held)dt.append(el("div","xmhint","Отложена — прочитайте, когда будет время."));
      box.append(dt)}
    else box.append(el("div","xmhint","Нажмите на главу — откроются её страницы."));
  });
  box.append(el("div","xmleg","<i class='d'></i>прочитано <i class='p'></i>частично <i class='l'></i>пропущено <i class='h'></i>отложено <i class='n'></i>сегодня"));
  box.lastChild.innerHTML=box.lastChild.textContent.replace(/<i class='(\w)'><\/i>/g,(m,c)=>'<i class="'+c+'"></i>');
  return box;
}
var churchFrom=null;
function churchMapEl(){
  const tp=Math.min(Math.max(0,todayP()),DAYS-1),box=el("div","xmap cmap"),rs=Object.fromEntries(KEYS.map(k=>[k,readSet(k)]));
  const from=churchFrom==null?Math.max(0,tp-6):churchFrom,to=Math.min(DAYS-1,tp+2);
  // пропущено раньше показанного
  let early=0;for(let p=0;p<from;p++)KEYS.forEach(k=>{if(!rs[k].has(p))early++});
  const list=el("div","cmlist");
  for(let p=from;p<=to;p++){const d=parse(planDate(p)),row=el("div","cmrow"+(p===tp?" now":""));
    const dd=el("div","cmday");dd.append(el("span",null,p===tp?"сегодня":d.toLocaleDateString("ru-RU",{weekday:"short"})),el("b",null,String(d.getDate())));row.append(dd);
    KEYS.forEach(k=>{const x=part(k,p),done=rs[k].has(p),it=el("div","sitem"+(done?" sdone":"")+(!done&&p<tp?" cmlate":""));
      const a=el("a","sref");a.href=chapterUrl(x);a.target="_blank";a.rel="noopener";a.title=FULL[x.book]||x.book;{const sp=el("span","cmref");refStr(x).split("—").forEach((t,i)=>{if(i){sp.append("—",document.createElement("wbr"))}sp.append(el("i",null,t))});a.append(sp)}
      const c=el("button","scheck");c.type="button";c.setAttribute("aria-pressed",done?"true":"false");
      c.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      schedCheck(c,k,p,done);it.append(a,c);row.append(it)});
    list.append(row)}
  if(from>0){const m=el("button","linkbtn xmall",early?"Раньше: ещё не прочитано "+early:"Показать раньше");m.type="button";m.addEventListener("click",e=>{e.stopPropagation();churchFrom=Math.max(0,from-7);render()});box.append(m)}
  box.append(list);return box;
}
function renderExtras(){
  const tc=$("testaments")&&$("testaments").closest(".card");if(!tc)return;
  let box=$("xCards");if(!box){box=el("div","xcards");box.id="xCards";box.dataset.page="home";box.dataset.spb="1";tc.after(box)}
  box.classList.toggle("pg-off",(document.body.dataset.page||"home")!=="home");
  const ids=xOn();box.textContent="";
  // подпись основного блока, когда расписаний несколько
  let lab=$("primLab");const many=ids.length>0||document.body.classList.contains("with-conf");
  if(!lab){const hd=tc.querySelector(".reading-head");if(hd){lab=el("span","primlab");lab.id="primLab";hd.append(lab)}}
  if(lab){lab.hidden=noPlan()||!tracks().spb;lab.className="kmark "+(SCHED.spb?"k-spb":"k-my");lab.textContent="";lab.append(icoEl(SCHED.spb?"flame":myEmb(SCHED.def)),SCHED.spb?"Церковь":"Моё · "+SCHED.name)}
  {let ph=$("primFin");const pf=!SCHED.spb&&(state.finished||[]).some(f=>f.id===SCHED.id&&!f.gone);
    if(pf&&!ph){const hd=tc.querySelector(".reading-head");if(hd){ph=el("p","xfinhint");ph.id="primFin";hd.after(ph)}}
    if(ph){ph.hidden=!pf;if(pf)ph.textContent="🎉 «"+SCHED.name+"» прочитано до конца! Сегодня ещё можно отменить отметку. Завтра расписание само уйдёт в «Архив» (вкладка «Библиотека»)."}}
  {const hd=tc.querySelector(".reading-head");let b=$("primMapBtn");
    const pOn=xmapOpen.has("__prim")&&!noPlan();
    if(hd&&!b&&!noPlan()){b=xmapBtn("__prim");b.id="primMapBtn";hd.append(b)}
    if(b&&noPlan()){b.remove();b=null}
    if(b){b.classList.toggle("on",xmapOpen.has("__prim"));b.setAttribute("aria-expanded",String(xmapOpen.has("__prim")))}
    let pm=$("primMap");if(pm)pm.remove();
    // «Где я» у Библии: дни недели с кружками, как в «Мои расписания», но компактно; чтение на сегодня скрыто
    const tsx=$("testaments");if(tsx)tsx.hidden=pOn;
    if(pOn&&hd){try{pm=churchMapEl();pm.id="primMap";hd.after(pm)}catch(e){console.warn(e)}}}
  const visX=ids.filter(i=>String(i).indexOf("fire-")!==0);
  // 13.11: «Главное расписание» / «Расписание 2» на главной не пишем — только во вкладке «Мои расписания»
  ids.forEach(id=>{const S=xS(id);if(!S)return;if(String(id).indexOf("fire-")===0)return;const card=el("section","card xcard");
    const hd=el("div","reading-head"),dn=S.keys.filter(k=>xToday(id,k).length).length;
    const hr=el("span","xhr");const km=el("span","kmark "+(id==="spb"?"k-spb":"k-my"));km.append(icoEl(id==="spb"?"flame":myEmb(xDef(id))),id==="spb"?"Церковь":"Моё");hr.append(km);if(dn===S.keys.length)hr.append(el("span","xst ok","готово ✓")); // счётчик «0 из 1» убран — показываем только «готово»
    if(id!=="spb"&&S.ms)hr.append(xmapBtn(id));
    hd.append(el("h2",null,id==="spb"?"Расписание церкви":xName(id)),hr);card.append(hd);
    if(id!=="spb"&&S.ms&&xmapOpen.has(id)){try{const m=xmapEl(id);if(m)card.append(m)}catch(e){console.warn(e)}}
    if(id!=="spb"&&(state.finished||[]).some(f=>f.id===id&&!f.gone)){card.classList.add("xfin");card.append(el("p","xfinhint","🎉 Прочитано до конца! Сегодня ещё можно отменить отметку. Завтра расписание само уйдёт в «Архив» (вкладка «Библиотека»)."))}
    const tg=el("div","tgrid");
    S.keys.forEach(k=>{const tcd=el("div","tcard"),np=xNext(id,k),ti=dayNo(today())-dayNo(S.start),tod=xToday(id,k),done=tod.length>0;
      const th=el("div","thead");const hb=el("div","tht");hb.append(el("b",null,S.keys.length>1?S.labels[k]:"Сегодня"));th.append(hb);tcd.append(th);
      if(np>=S.plan.length&&!done){tcd.append(el("p","muted","Расписание пройдено 🎉"));tg.append(tcd);return}
      const shown=done?tod[tod.length-1].p:np,x=part2(S,k,shown);try{if(x&&x.book)th.append(verseBtn(k,shown,x,id))}catch(e){}
      const cols=el("div","tcols"),left=el("div","tcol"),right=el("div","tcol");
      const a=el("a","tlink");a.href=chapterUrl(x);a.target="_blank";a.rel="noopener";
      a.append(el("span","label",done?"Прочитано сегодня":shown<xCut(id,S)?"Догнать":shown<=ti?"Сегодня":"Заранее"),el("span","name",refStr(x)),...(x.title?[el("span","mst",x.title)]:[]),el("span","sub",xDate(S,shown)));
      const btn=el("button","tbtn");btn.type="button";
      if(done){btn.textContent="Прочитано ✓";btn.classList.add("done");btn.disabled=true}else{btn.textContent="Прочитал(а)";btn.classList.add("nudge");confirmTap(btn,"Нажмите ещё раз",()=>xMark(id,k,np))}
      left.append(a,btn);
      if(!done&&shown<xCut(id,S)&&id!=="spb"&&S.ms){const n=xLateUnits(id,k);if(n>1){const j=el("button","linkbtn xjump","Пропустить "+n+" и читать по расписанию");j.type="button";confirmTap(j,"Нажмите ещё раз",()=>xJump(id,k));left.append(j)}}
      if(done){const u=el("button","linkbtn undolink","Отменить");u.type="button";u.addEventListener("click",()=>xUndo(id,k));left.append(u)}
      const nx=done?np:np+1;
      if(nx<S.plan.length&&part2(S,k,nx).book){const y=part2(S,k,nx),a2=el("a","nextlink"+(done?"":" later"));a2.href=chapterUrl(y);a2.target="_blank";a2.rel="noopener";
        a2.append(el("span","label",done?"Следующий":"Потом"),el("span","name",refStr(y)),...(y.title?[el("span","mst",y.title)]:[]),el("span","sub",xDate(S,nx)));right.append(a2);
        if(done){const b2=el("button","tbtn nextmark","Прочитал(а)");b2.type="button";confirmTap(b2,"Нажмите ещё раз",()=>xMark(id,k,np));right.append(b2)}}
      cols.append(left,right);tcd.append(cols);tg.append(tcd)});
    // «Где я» — отдельный вид: пока открыт, чтение на сегодня скрыто
    if(!(id!=="spb"&&S.ms&&xmapOpen.has(id)))card.append(tg);box.append(card)});
}
/* ---------- «Расписания»: список с переключателями, нажали — детали ---------- */
var schedView=""; // при каждом открытии вкладки — сначала список
function setSchedView(v){schedView=v||"";renderSchedList();const s=$("schedule");if(s)s.open=true;
  // раскрытая карточка — на экране (стрелка остаётся на месте, закрыть можно тем же пальцем)
  const w=document.querySelector(".slwrap.open");if(w){const b=w.getBoundingClientRect();if(b.top<70||b.top>innerHeight-160)window.scrollTo({top:b.top+window.scrollY-80,behavior:"smooth"})}}
function schedRows(){
  const tt=tracks(),np=noPlan(),rows=[],seen=new Set(),ex=state.extra||{};
  const add=x=>{if(seen.has(x.id))return;seen.add(x.id);rows.push(x)};
  const groupPlan=id=>id.startsWith("fire-");
  add({id:SCHED.id,kind:SCHED.spb?"spb":groupPlan(SCHED.id)?"group":"my",primary:true,on:tt.spb&&!np,def:SCHED.def});
  add({id:"spb",kind:"spb",on:!!ex.spb&&tt.spb&&!np,def:{id:"spb"}});
  const fin=new Set((state.finished||[]).map(f=>f.id));
  myPlanList().forEach(d=>{if(!fin.has(d.id))add({id:d.id,kind:"my",on:!!ex[d.id]&&tt.spb&&!np,def:d})});
  xOn().filter(id=>groupPlan(id)&&!fin.has(id)).forEach(id=>add({id,kind:"group",on:true,def:xDef(id)}));
  if(today()<="2026-10-28"){const j=!!(tt.conf&&confSt().joined)&&!np;rows.splice(rows.findIndex(r=>!r.primary&&!r.on)>=0?Math.max(1,rows.findIndex(r=>!r.primary&&!r.on)):rows.length,0,{id:"conf",kind:"conf",on:j,joined:j})}
  // в «Моих расписаниях» — только добавленные (включённые)
  return rows.filter(x=>x.on);
}
function schedTotal(x){try{if(x.primary)return KEYS.length*DAYS;const S=x.kind==="spb"&&!x.primary?buildSched({id:"spb"}):buildSched(x.def);return S.keys.filter(k=>k).length*S.plan.length}catch(e){return 0}}
/* убрать расписание из «Моих расписаний» (подержать тумблер):
   церковь и челлендж — выключаются (прочитанное сохраняется, вернуть — «＋ Добавить»); своё — удаляется (дни в серии остаются) */
function schedRemove(r){schedView="";
  if(r.kind==="conf"){state.tracks=Object.assign(tracks(),{conf:false});save();applyAppMode();render();toast("Челлендж убран. Прочитанное сохранено — вернуть можно в «＋ Добавить расписание»");return}
  const msg=r.kind==="my"?"«"+(r.primary?SCHED.name:xName(r.id))+"» убрано. Прочитанное сохранено — вернуть: «＋ Добавить расписание» → «Вернуть своё»":"Расписание церкви убрано. Вернуть — «＋ Добавить расписание»";
  if(!r.primary){if(state.extra)delete state.extra[r.id];save();toast(msg);render();return}
  // основное: если есть другие — первое из них станет основным (прогресс убранного сохраняется в state.plans)
  const ex=xOnMain();
  if(r.kind==="my"){state.myScheds=state.myScheds||{};state.myScheds[SCHED.id]=SCHED.def}
  if(ex.length){const id=ex[0];delete state.extra[id];save();switchPlan(xDef(id));return}
  state.tracks=Object.assign(tracks(),{spb:false});
  save();applyAppMode();render();toast(msg);
}
function mainSchedule(rows){
  return rows.find(r=>r.id===state.globeSchedule)||rows[0];
}
function chooseMainSchedule(id){
  state.globeSchedule=id;
  if(undoSnap)undoSnap.state.globeSchedule=id;
  save();
  renderSchedList();
}
function globeSchedule(){
  const row=mainSchedule(schedRows());
  if(!row)return null;
  if(row.kind==="conf"){
    const units=confToday(),read=confReadWhen(),t=today();
    const passages=[...new Set(units.map(u=>u.b))].map(book=>{
      const group=units.filter(u=>u.b===book);
      return {ref:confRefs(group)[0].text,url:confRefs(group)[0].url,label:"",last:group.every(u=>read[u.i]===t)?t:""};
    });
    return {name:"Божья гора",passages};
  }
  const S=row.primary?SCHED:xS(row.id);
  if(!S)return null;
  const progress=row.primary?state:(state.plans||{})[row.id]||{};
  const passages=S.keys.map(k=>{
    const track=progress[k]||{}, read=new Set(track.read||[]), skip=new Set(track.skip||[]);
    const log=track.log||[];
    const next=S.plan.findIndex((_,p)=>{
      if(read.has(p)||skip.has(p))return false;
      const x=part2(S,k,p);
      return !!(x.book&&x.ref);
    });
    return {
      ref:next<0?"":refStr(part2(S,k,next)),
      url:next<0?"":chapterUrl(part2(S,k,next)),
      key:k,
      label:S.labels[k]||S.short[k]||"Отрывок",
      ahead:row.primary?paceSeries()[k].slice(-1)[0]:(()=>{
        const elapsed=Math.max(0,dayNo(today())-dayNo(S.start));
        const due=n=>S.plan.slice(0,n).filter((_,i)=>!!part2(S,k,i).book).length;
        const count=[...read].filter(i=>Number.isInteger(i)&&i>=0&&i<S.plan.length&&part2(S,k,i).book).length;
        const delta=count-due(elapsed+1);
        return delta<0?Math.min(0,count-due(elapsed)):delta;
      })(),
      last:log.reduce((last,x)=>x.d>last?x.d:last,""),
    };
  });
  return {name:S.name,passages};
}
function schedSetOn(r,on){
  if(r.kind==="conf"){if(on){state.planChosen=true;confJoin();toast("Вы в челлендже! Он на главной")}else{state.tracks=Object.assign(tracks(),{conf:false});save();applyAppMode();toast("Челлендж на паузе. Прочитанное сохранено")}render();return}
  if(r.primary){
    if(on){state.planChosen=true;state.tracks=Object.assign(tracks(),{spb:true});save();applyAppMode();render();toast("«"+(SCHED.spb?"Церковь":SCHED.name)+"» — на главной");return}
    const ex=xOnMain();if(ex.length){const id=ex[0];delete state.extra[id];save();switchPlan(xDef(id));return}
    state.tracks=Object.assign(tracks(),{spb:false});save();applyAppMode();render();
    toast(noActive()?"Расписание выключено. Выберите, что читать: «＋ Добавить расписание»":"Расписание на паузе. Прогресс сохранён");return}
  if(on){state.planChosen=true;
    if(!tracks().spb||noActive()){state.tracks=Object.assign(tracks(),{spb:true});if(state.extra)delete state.extra[r.id];save();switchPlan(xDef(r.id));return}
    state.extra=state.extra||{};state.extra[r.id]=true;xSt(r.id);save();render();toast("«"+xName(r.id)+"» — на главной в «Чтении на сегодня»");return}
  if(state.extra)delete state.extra[r.id];save();render();toast("«"+xName(r.id)+"» на паузе. Прогресс сохранён");
}
/* Тумблер расписания: включить и выключить — нажать и подержать 1 секунду (над пальцем — увеличенный тумблер); включение зелёное, выключение мягко-красное
   (зелёный цвет «стекает», идёт отсчёт), отпустили раньше — ничего не меняется. Чтобы не выключить случайно. */
function holdSwitch(sw,lab,card,on,fn){
  // и включение, и выключение — нажать и подержать секунду
  sw.addEventListener("click",e=>{e.stopPropagation();e.preventDefault()});
  sw.addEventListener("contextmenu",e=>e.preventDefault());
  const txt=lab.textContent,HOLD=1000,N=12,verb=on?"убрать расписание":"включить";let t0=0,raf=0,lp=null;
  const C=on?["#ffd9d2","#ffcfc7","#fdc4bb","#fbb9af","#f8aea3","#f5a398","#f2988d","#ee8e83","#ea8479","#e57b70","#e07368","#da6b61"]
            :["#c9f5dc","#b2efcb","#9be9ba","#84e3a9","#6ddc98","#57d488","#45ca7b","#36bf70","#2fb877","#26a96b","#1f9d63","#178f59"];
  sw.classList.toggle("hold-on",!on);
  const bars=el("span","hbars");bars.setAttribute("aria-hidden","true");
  for(let i=0;i<N;i++){const s=el("i");s.style.setProperty("--c",C[i]);s.style.height=(9+Math.round(9*Math.sin(Math.PI*(i+.5)/N)))+"px";bars.append(s)}
  sw.before(bars);
  const secs=k=>"";
  const tick=()=>{if(!t0)return;const k=Math.min(1,(performance.now()-t0)/HOLD);sw.style.setProperty("--k",k.toFixed(3));
    const lit=Math.floor(k*N+0.0001);[...bars.children].forEach((s,i)=>s.classList.toggle("on",i<lit));
    lab.textContent="Держите…";
    if(lp){lp.style.setProperty("--k",k.toFixed(3));[...lp.querySelectorAll(".hlb i")].forEach((s,i)=>s.classList.toggle("on",i<lit));lp.querySelector(".hlt").textContent="Держите…"}
    if(k>=1){t0=0;sw.dataset.busy="1";sw.classList.remove("holding");bars.classList.add("done");unloupe(true);
      if(on){// выключили — красная реакция «с сожалением»
        sw.classList.add("off-go");card.classList.add("glow-r");lab.textContent="";vibrate([40,80,40]);
        setTimeout(()=>{bars.classList.remove("show","done");lab.textContent="Жаль… убрано 😔";lab.classList.add("pill-r")},450);
        try{const b=sw.getBoundingClientRect();burst(b.left+b.width/2,b.top+b.height/2,22,["#f5a398","#ea8479","#ffd9d2","#a7abc0","#7d829b"],true)}catch(e){}
        setTimeout(()=>card.classList.add("fade"),700);setTimeout(()=>fn(false),1400)}
      else{// включили — зелёная радостная реакция
        sw.classList.remove("hold-on");sw.classList.add("on","pop");card.classList.add("glow-g");lab.textContent="";vibrate([15,40,30]);
        setTimeout(()=>{bars.classList.remove("show","done");lab.textContent="Читаю! 🔥";lab.classList.add("pill-g")},350);
        try{const b=sw.getBoundingClientRect(),G=["#3fcf8a","#7ee8a8","#b8f5cf","#2fb877","#ffe08a","#ffffff"];burst(b.left+b.width/2,b.top+b.height/2,44,G);setTimeout(()=>{const c=card.getBoundingClientRect();burst(c.left+40,c.top+30,20,G)},180)}catch(e){}
        setTimeout(()=>fn(true),1300)}
      return}
    raf=requestAnimationFrame(tick)};
  const loupe=()=>{const b=sw.getBoundingClientRect();lp=el("div","hloupe"+(on?"":" g"));lp.setAttribute("aria-hidden","true");
    const tr=el("div","hlsw");tr.append(el("i"));const lb=el("div","hlb");C.forEach(c=>{const s=el("i");s.style.setProperty("--c",c);lb.append(s)});
    lp.append(tr,lb,el("div","hlt","Держите…"));document.body.append(lp);
    const w=lp.offsetWidth,x=Math.max(8,Math.min(innerWidth-w-8,b.left+b.width/2-w/2)),y=Math.max(8,b.top-lp.offsetHeight-18);lp.style.left=x+"px";lp.style.top=y+"px";
    lp.style.setProperty("--ax",(b.left+b.width/2-x)+"px");requestAnimationFrame(()=>lp&&lp.classList.add("in"))};
  const unloupe=(ok)=>{const l=lp;lp=null;if(!l)return;l.classList.add(ok?"done":"out");setTimeout(()=>l.remove(),ok?700:220)};
  const start=e=>{if(sw.dataset.busy)return;e.preventDefault();e.stopPropagation();try{sw.setPointerCapture(e.pointerId)}catch(x){}t0=performance.now();sw.classList.add("holding");bars.classList.add("show");loupe();vibrate(10);raf=requestAnimationFrame(tick)};
  const stop=()=>{if(!t0)return;const k=(performance.now()-t0)/HOLD;t0=0;cancelAnimationFrame(raf);sw.classList.remove("holding");sw.style.setProperty("--k","0");lab.textContent=txt;bars.classList.remove("show");unloupe(false);[...bars.children].forEach(s=>s.classList.remove("on"));
    if(k<1)toast("Чтобы "+verb+", нажмите и подержите секунду")};
  sw.addEventListener("pointerdown",start);["pointerup","pointercancel","lostpointercapture"].forEach(ev=>sw.addEventListener(ev,stop));
  sw.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();toast("Чтобы "+verb+", нажмите и подержите секунду")}});
}
function renderSchedList(){
  const L=$("schedList"),D=$("schedDet"),T=$("schedTitle");if(!L||!D)return;
  if(D.parentNode!==L.parentNode)L.after(D); // детали раскрываются прямо в карточке (аккордеон)
  const rows=schedRows(),x=schedView&&rows.find(r=>r.id===schedView);
  if(schedView&&!x)schedView="";
  let openWrap=null;
  L.hidden=false;D.hidden=!x;L.textContent="";T.textContent="Мои расписания";
  {
    const NS="http://www.w3.org/2000/svg",ring=(pct,col,ic)=>{const w=el("span","sring"),sv=document.createElementNS(NS,"svg");sv.setAttribute("viewBox","0 0 48 48");
      const c=(r,st,extra)=>{const q=document.createElementNS(NS,"circle");q.setAttribute("cx","24");q.setAttribute("cy","24");q.setAttribute("r","21");q.setAttribute("fill","none");q.setAttribute("stroke-width","3.5");q.setAttribute("stroke",st);Object.entries(extra||{}).forEach(([k,v])=>q.setAttribute(k,v));return q};
      const L2=2*Math.PI*21;sv.append(c(21,"var(--ringbg)"),c(21,col,{"stroke-linecap":"round","stroke-dasharray":(L2*Math.max(pct?.03:0,pct/100)).toFixed(1)+" "+L2.toFixed(1),transform:"rotate(-90 24 24)"}));w.append(sv,ic);return w};
    const card=r=>{
      const kind=r.kind==="conf"?"k-conf":r.kind==="spb"?"k-spb":"k-my";
      const wrap=el("div","slwrap "+kind+(r.on?" on":"")),b=el("div","slrow");b.setAttribute("role","button");b.tabIndex=0;
      const t=el("span","stx"),ln=el("span","stl");let name="",sub="",pct=0,col="var(--flame)",chip=null;
      if(r.kind==="conf"){let n=Math.max(1,dayNo("2026-10-28")-dayNo(today())+1);try{pct=r.on?myPct():0;n=confDaysLeft()}catch(e){}
        name="«Божья гора»";sub="Исход 19–20 и Псалом 119";col="#2f9e6b";chip=el("span","schip ch","ещё "+n+" "+plural(n,"день","дня","дней"))}
      else{const n=planProgress(r.id),tot=schedTotal(r);pct=tot?Math.min(100,Math.round(n/tot*100)):0;
        if(r.kind==="spb"){name="Церковь";sub=r.on&&r.primary?"День "+Math.min(DAYS,todayP()+1)+" из "+DAYS+" · вся Библия за 2 года":"Вся Библия за 2 года · Санкт-Петербург"}
        else{let S=null;try{S=r.primary?SCHED:buildSched(r.def)}catch(e){}name=r.primary?SCHED.name:(r.def.name||"Моё расписание");col="var(--link)";chip=el("span","schip my"+(name==="Моё расписание"?" nm":""),r.kind==="group"?"жизненная группа":name==="Моё расписание"?"✎ назвать":r.def&&r.def.ms?"служение":"своё");
          if(S){const di=Math.max(1,Math.min(S.plan.length,dayNo(today())-dayNo(S.start)+1));sub=r.on?"День "+di+" из "+S.plan.length:S.plan.length+" "+plural(S.plan.length,"день","дня","дней")}}
        if(!r.on&&n)sub+=" · прочитано "+n;else if(r.on)sub+=" · "+pct+"%"}
      ln.append(el("b",null,name));if(chip)ln.append(chip);t.append(ln,el("span","ssub",sub));
      // сегодняшние отрывки — компактными «чипами»
      if(r.on&&r.kind!=="conf"){const td=el("span","stoday");
        if(r.primary){const tp=Math.max(0,Math.min(todayP(),DAYS-1));KEYS.forEach(k=>{const pp=part(k,tp);if(!pp||!pp.book)return;const ok=readSet(k).has(tp);td.append(el("span","tchip"+(ok?" ok":""),refStr(pp)+(ok?" ✓":"")))})}
        else{const XS=xS(r.id);if(XS)XS.keys.forEach(k=>{const tod=xToday(r.id,k),ok=tod.length>0,p=ok?tod[tod.length-1].p:xNext(r.id,k);if(p>=XS.plan.length)return;const y=part2(XS,k,p);if(y.book)td.append(el("span","tchip"+(ok?" ok":""),refStr(y)+(ok?" ✓":"")))})}
        if(td.childNodes.length)t.append(td)}
      const icn=icoEl(r.kind==="spb"?"flame":r.kind==="conf"?"peak":myEmb(r.primary?SCHED.def:r.def));
      const sw=el("button","ssw"+(r.on?" on":""));sw.type="button";sw.setAttribute("role","switch");sw.setAttribute("aria-checked",String(r.on));sw.setAttribute("aria-label",(r.on?"Поставить на паузу: ":"Включить: ")+name);
      const swl=el("span",null,r.kind==="conf"?"Участвую":"Читаю");
      const ft=el("div","slft");
      if(r.kind!=="group"){
        ft.append(swl,sw);
        holdSwitch(sw,swl,wrap,true,()=>schedRemove(r));
      }
      const isOpen=!!x&&x.id===r.id;if(isOpen){wrap.classList.add("open");openWrap=wrap}
      b.setAttribute("aria-expanded",String(isOpen));
      const go=el("span","sgo");go.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      b.append(ring(pct,col,icn),t,go);
      const open=()=>setSchedView(schedView===r.id?"":r.id);b.addEventListener("click",open);b.addEventListener("keydown",e=>{if(e.key==="Enter")open()});wrap.append(b);if(ft.hasChildNodes())wrap.append(ft);return wrap};
    // группы: что читаю (на главной) и что на паузе
    if(rows.length){
      const main=mainSchedule(rows), ordered=[main,...rows.filter(r=>r!==main)];
      L.append(el("div","slgrp","Читаю · "+rows.length));
      L.append(el("p","hint","На глобусе видны отрывки и огонёк главного расписания."));
      ordered.forEach((r,i)=>{
        const entry=card(r);
        const lb=el("div","schedno sllab"+(i===0?" main":""),i===0?"✓ Главное расписание":"Расписание "+(i+1));
        if(i>0){
          const mb=el("button","slmkmain","Сделать главным");mb.type="button";
          mb.setAttribute("aria-label","Сделать главным: "+entry.querySelector(".stl b").textContent);
          mb.addEventListener("click",()=>chooseMainSchedule(r.id));lb.append(mb);
        }
        L.append(lb,entry);
      });
    }
    else L.append(el("p","sempty","Сейчас вы ничего не читаете. Добавьте расписание — своё, церкви или челлендж."));
    const ad=el("button","pnew pbig"+(msNew()?" newglow":""));ad.type="button";ad.append(el("b",null,"＋ Добавить расписание"),el("span",null,msNew()?"Новое: Жизнеизучение и книги служения":(confClosed()?"Библия или книги служения":"Библия, книги служения или челлендж")));if(msNew())ad.append(el("span","newbadge","Новое"));ad.addEventListener("click",()=>openPlans());L.append(ad);{const FL=window.ogFireList?window.ogFireList():[];const nb=el("button","pnew pbig rgfirenew2");nb.type="button";nb.append(el("b",null,"＋ Создать жизненную группу"),el("span",null,"Читать вместе с друзьями"));nb.addEventListener("click",()=>{try{window.ogFireNew()}catch(e){}});const row=el("div","rgaddrow");L.append(row);row.append(ad,nb);if(FL.length)L.append(el("div","slgrp rgtog","Мои жизненные группы · "+FL.length));FL.forEach(f=>{const fb=el("button","rgfirebtn");fb.type="button";fb.innerHTML='<svg class="rgfi" viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(22 0) scale(.88)"><path d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z" fill="#ff7a1a"/><path d="M32 40c4 8 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 6-12 0 4 2 7 5 7-2-5-2-11-1-16z" fill="#ffc94a"/></g><g stroke-linecap="round"><path d="M14 90 L86 74" stroke="#8a5a32" stroke-width="10"/><path d="M14 74 L86 90" stroke="#6e4426" stroke-width="10"/></g></svg><span><b>'+f.name.replace(/[<>&]/g,"")+'</b><small>'+f.n+" из "+f.size+" · "+f.what.replace(/[<>&]/g,"")+'</small></span><em>'+(f.own?"Настроить":"Открыть")+'</em>';fb.addEventListener("click",()=>{try{window.ogFireMenu(f.code)}catch(e){}});L.append(fb)})}
    L.append(el("p","hint","Чтобы убрать расписание, подержите его тумблер секунду — прочитанное сохранится. Все расписания из списка — на главной, у каждого своя кнопка «Прочитал(а)»."));
    if(!x)return}
  // детали
  const H=$("schedDetHead"),W=$("schedWeek");H.textContent="";
  const head=el("div","sdhead"),acts=el("div","sacts");
  const btn=(cls,txt,fn)=>{const b=el("button",cls,txt);b.type="button";b.addEventListener("click",fn);return b};
  W.hidden=!(x.primary&&x.on);
  let extraList=null;
  if(x.kind==="conf"&&!x.joined){T.textContent="«Божья гора»";
    head.append(el("b",null,"Исход 19–20 и Псалом 119"),el("span",null,"Челлендж к конференции школьников: до 28 октября, вопросы, игры, восхождение с друзьями"));
    acts.append(btn("btn-main","Присоединиться",()=>{schedSetOn(x,true);setPage("home")}),btn("btn","Подробнее",()=>openConf("read")))}
  else if(x.kind==="conf"){T.textContent="«Божья гора»";const c=confSt();
    head.append(el("b",null,"Исход 19–20 и Псалом 119"),el("span",null,"До 28 октября · прочитано частей: "+c.log.length));
    acts.append(btn("btn-main","Открыть челлендж",()=>openConf()));
  }
  else{
    const S=x.primary?SCHED:(()=>{try{return buildSched(x.def)}catch(e){return null}})();const nm=x.kind==="spb"?"Церковь":(x.primary?SCHED.name:(x.def.name||"Моё расписание"));T.textContent=nm;
    head.append(el("b",null,x.kind==="spb"?"Санкт-Петербург · вся Библия за 2 года":x.kind==="group"?"Расписание жизненной группы":x.def&&x.def.ms&&msBook(x.def.ms)?msBook(x.def.ms).t+" · "+x.def.pw+" в неделю":"Своё расписание"),el("span",null,(S?schedSummary(S):"")+" · прочитано отрывков: "+planProgress(x.id)+" · "+(x.on?"читаете":"на паузе")));
    if(x.kind==="my"){const cur=x.primary?SCHED.name:(x.def.name||"Моё расписание"),dd=x.primary?SCHED.def:x.def;
      if(cur==="Моё расписание"){const rb=el("div","rnbox");rb.append(el("b",null,"✎ Дайте расписанию название"),el("span",null,"Так его проще узнать — и вам, и друзьям"));
        const ri=el("input");ri.maxLength=40;ri.placeholder="Например: Евангелия";let em=myEmb(dd);ri.addEventListener("input",()=>{if(ri.value.trim())rb.classList.remove("need")});
        const rs=btn("btn-main","Сохранить",()=>{const v=ri.value.trim();if(!v){rb.classList.remove("need");void rb.offsetWidth;rb.classList.add("need");ri.focus();vibrate(20);return}renamePlan(x.id,v,em)});
        const rr=el("div","rnrow");rr.append(ri,rs);rb.append(rr,embPicker(()=>em,v=>{em=v}),el("span","pnmsg","👆 Сначала напишите название"));H.append(rb)}}
    if(x.kind==="my")acts.append(btn("btn","Изменить",()=>{if(state.ptrEdit==="on"){state.ptrEdit="done";save();try{applyPtr()}catch(e){}}openPlans("custom",x.primary?SCHED.def:x.def)}));
    // включённое дополнительное — ближайшие отрывки
    if(!x.primary&&x.on){const XS=xS(x.id);if(XS){extraList=el("div","xnext");extraList.append(el("div","pgroup","Ближайшие отрывки"));
      XS.keys.forEach(k=>{let p=xNext(x.id,k);for(let i=0;i<5&&p<XS.plan.length;i++,p++){const y=part2(XS,k,p);if(!y.book)continue;const a=el("a","xnl");a.href=chapterUrl(y);a.target="_blank";a.rel="noopener";a.append(el("b",null,refStr(y)),el("span",null,xDate(XS,p)));extraList.append(a)}})}}
  }
  H.prepend(head);if(acts.childNodes.length)H.append(acts);if(extraList)H.append(extraList);
  T.textContent="Мои расписания";if(openWrap)openWrap.append(D);
}
function canUndo(){return !!state.planChosen&&noReads()}
function reChoose(){
  delete state.planChosen;delete state.ptrEdit;delete state.tracks;
  const c=confSt();if(!c.log.length)delete c.joined;
  try{localStorage.setItem("ogonek-app-mode","spb");localStorage.removeItem("ogonek-ptr-tip")}catch(e){}
  save();render();try{applyAppMode()}catch(e){}window.scrollTo({top:0,behavior:"smooth"});openWelcome();
}
function isLogged(){const t=$("loginTop");return !!(t&&t.classList.contains("user")&&!t.hidden)}
function applyNoPlan(){
  const np=noPlan()||noActive();document.body.classList.toggle("noplan",np);
  const pg=document.body.dataset.page||"home";
  [["noPlanCard","home"],["noPlanCard2","plan"]].forEach(([id,page])=>{let c=$(id);
    if(np&&!c){c=el("section","card npcard");c.id=id;c.dataset.page=page;
      c.append(el("h2",null,"Выберите расписание, чтобы начать"),el("p",null,"Своё, челлендж «Божья гора» или расписание церкви в Санкт-Петербурге"));
      const b=el("button","btn-main","Выбрать расписание");b.type="button";b.addEventListener("click",()=>openWelcome());c.append(b);
      const anchor=$("pageHead")||$("appTabs");if(anchor)anchor.after(c)}
    if(c){c.hidden=!np;c.classList.toggle("pg-off",pg!==page);
      if(np){const fin=noActive()&&(state.finished||[]).some(f=>f.gone);c.querySelector("h2").textContent=fin?"Расписание прочитано — выберите новое":"Выберите расписание, чтобы начать";
        c.querySelector("p").textContent=fin?"Прочитанное сохранено в «Архиве» во вкладке «Библиотека». Выберите, что читать дальше.":"Своё расписание или общее расписание церкви в Санкт-Петербурге"}}});
  try{renderSchedList()}catch(e){console.warn(e)}
  {let u=$("undoCard");const can=!np&&canUndo();
    if(can&&!u){u=el("section","undocard");u.id="undoCard";u.dataset.page="home";const t=el("div","ptxt");t.append(el("b"),el("span",null,"Выбрали случайно? Пока ничего не прочитано, можно выбрать другое."));
      const b=el("button","undogo","Выбрать другое");b.type="button";b.addEventListener("click",reChoose);u.append(t,b);const anchor=$("pageHead")||$("appTabs");if(anchor)anchor.after(u)}
    if(u){u.hidden=!can;u.classList.toggle("pg-off",pg!=="home");if(can){const tt=tracks();u.querySelector("b").textContent="Вы выбрали: "+(tt.conf&&!tt.spb?"челлендж «Божья гора»":"расписание церкви в СПб")}}}
  if(np){
    document.querySelectorAll("#testaments .name").forEach(n=>n.textContent="— · —");
    document.querySelectorAll("#testaments .sub").forEach(n=>n.textContent="");
  }else{const w=document.querySelector(".fmodal.welcome");if(w&&w.dataset.auto)w.remove()}
  applyPtr();
}
function openWelcome(auto){
  if(document.querySelector(".fmodal.welcome"))return;
  try{localStorage.setItem("ogonek-welcome","1")}catch(e){}
  const modal=el("div","fmodal welcome"),sheet=el("div","fsheet psheet wsheet");if(auto)modal.dataset.auto="1";
  sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label","Выбор расписания");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};
  modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
  const hd=el("div","fhead");hd.append(el("h2",null,"Добро пожаловать в Огонёк"));const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);hd.append(x);
  sheet.append(hd,el("p","wsub","Читайте Библию каждый день — понемногу и вместе с друзьями. С чего начнём?"));
  const opt=(cls,ic,tag,tagc,title,desc,fn)=>{const b=el("button","wopt "+cls);b.type="button";b.append(icoEl(ic));const t=el("span","ptxt");if(tag)t.append(el("span","wtag "+tagc,tag));t.append(el("b",null,title),el("span",null,desc));b.append(t);b.addEventListener("click",()=>{if(fn.confirm){fn.confirm();return}close();fn()});return b};
  // челлендж и церковь — сначала короткое описание и «Начать читать», чтобы не выбрать случайно
  const confirm=(ic,title,lines,list,go)=>{sheet.textContent="";const h2=el("div","fhead"),bk=el("button","pback","‹");bk.type="button";bk.setAttribute("aria-label","Назад");bk.addEventListener("click",()=>{close();openWelcome()});
    const x2=el("button","fclose","×");x2.type="button";x2.setAttribute("aria-label","Закрыть");x2.addEventListener("click",close);h2.append(bk,el("h2",null,title),x2);
    const big=el("div","wconf");big.append(icoEl(ic));const tx=el("div","ptxt");tx.append(el("b",null,lines[0]),el("span",null,lines[1]));big.append(tx);
    const ul=el("ul","wlist");list.forEach(s=>{const li=el("li");li.innerHTML=s;ul.append(li)});
    const g=el("button","btn-main","Начать читать");g.type="button";g.addEventListener("click",()=>{close();go()});
    const back=el("button","wback","‹ Назад к выбору");back.type="button";back.addEventListener("click",()=>{close();openWelcome()});
    sheet.append(h2,big,ul,g,back,el("p","hint","Передумаете — пока не прочитан первый отрывок, на главной будет кнопка «Выбрать другое»."));sheet.scrollTop=0};
  const esc2=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[c]);
  const firstRefs=()=>{try{return KEYS.map(k=>"<b>"+esc2(refStr(part(k,Math.min(nextP(k),DAYS-1))))+"</b>").join(" и ")}catch(e){return ""}};
  const goChurch=()=>chooseChurch();goChurch.confirm=()=>confirm("flame","Расписание церкви",["Санкт-Петербург · вся Библия за 2 года","Все читают одно и то же, с 28 сентября 2026"],["Каждый день ~15 минут: отрывок из Ветхого и из Нового Завета","Первый отрывок: "+firstRefs(),"На пути видно, кто из друзей читает рядом"],chooseChurch);
  const goCh=()=>chooseChallenge();goCh.confirm=()=>confirm("peak","Челлендж «Божья гора»",["Исход 19–20 и Псалом 119","До 28 октября — к конференции школьников"],["Объём делится поровну на оставшиеся дни","Вопросы, игры и восхождение с друзьями","После 28 октября можно выбрать другое расписание"],chooseChallenge);
  sheet.append(opt("own","book","для всех","or","Своё расписание","Выберите, что читать и в каком темпе: Новый Завет за год, вся Библия или отдельные книги.",()=>openPlans("custom")));
  if(today()<="2026-10-28"){const n=Math.max(1,dayNo("2026-10-28")-dayNo(today())+1);
    sheet.append(opt("ch","peak","скоро заканчивается · "+n+" "+plural(n,"день","дня","дней"),"","Челлендж «Божья гора»","Исход 19–20 и Псалом 119 до 28 октября — к конференции школьников. Вопросы, игры, восхождение с друзьями.",goCh))}
  sheet.append(opt("spb","flame","","","Расписание церкви в Санкт-Петербурге","Если вы из церкви в Санкт-Петербурге: вся Библия за 2 года, все читают одно и то же с 28 сентября 2026.",goChurch));
  sheet.append(el("p","hint","Расписания можно добавить или поставить на паузу в любой момент — во вкладке «Расписания»."));
  modal.append(sheet);document.body.append(modal);
}
function chooseChurch(){
  state.planChosen=true;if(state.ptrEdit===undefined)state.ptrEdit="on";
  state.tracks={spb:true,conf:false};const c=confSt();if(!c.log.length)delete c.joined;
  try{localStorage.setItem("ogonek-app-mode","spb")}catch(e){}
  if(!SCHED.spb){switchPlan({id:"spb"});return}
  save();render();try{applyAppMode()}catch(e){}window.scrollTo({top:0,behavior:"smooth"});
  toast("Готово! Вы читаете по расписанию церкви в Санкт-Петербурге");
}
function chooseChallenge(){
  state.planChosen=true;if(state.ptrEdit===undefined)state.ptrEdit="on";
  state.tracks={spb:false,conf:true};try{localStorage.setItem("ogonek-app-mode","conf")}catch(e){}
  confJoin();render();window.scrollTo({top:0,behavior:"smooth"});toast("Вы в челлендже «Божья гора»!");
}
/* указатели: без расписания — на вкладке «План»; после выбора — на имени (профиль → «Мои расписания» → «Изменить»),
   без входа — на вкладке «План» («Сменить расписание»), пока окно расписаний не откроют */
function ptrStage(){if(noPlan()||noActive())return "noplan";return state.ptrEdit==="on"?"on":""}
window.ogonekPtr=ptrStage;
/* Новинка «Жизнеизучение и книги служения»: жёлтые подсказки, пока человек не открыл этот раздел (state.msSeen) */
function msNew(){return false} /* новинка уже знакома всем — подсказки «Новое» больше не показываем */
function libNew(){return false}
function applyNew(){const nav=$("botNav");if(!nav)return;const pg=document.body.dataset.page||"home",on=msNew();
  const pb=[...nav.querySelectorAll(".bn")].find(b=>b.getAttribute("aria-label")==="Расписания");
  const ab=[...nav.querySelectorAll(".bn")].find(b=>b.getAttribute("aria-label")==="Библиотека");
  nav.querySelectorAll(".bnnew,.bnnewtip").forEach(n=>n.remove());nav.querySelectorAll(".bn.newglow").forEach(b=>b.classList.remove("newglow"));
  if(pb&&on&&!pb.classList.contains("need")){pb.classList.add("newglow");pb.append(el("span","bnnew","NEW"));
    if(pg!=="plan"){const t=el("span","bnnewtip","Новое: Жизнеизучение и книги служения ›");t.addEventListener("click",e=>{e.stopPropagation();setPage("plan");setTimeout(()=>openPlans(),250)});pb.append(t)}}
  if(ab&&libNew()&&!(pb&&on)){ab.classList.add("newglow");ab.append(el("span","bnnew","NEW"))}
  const lc=$("libCard");if(lc){lc.classList.toggle("newglow",libNew());let bd=lc.querySelector(".newbadge");if(libNew()&&!bd){bd=el("span","newbadge","Новое");lc.querySelector(".libtx b").after(bd)}else if(!libNew()&&bd)bd.remove()}}
/* указатель «Новое: уведомления» — сегодня и завтра (26–27.10), пока человек не открыл настройки */
function ntNew(){let seen=false;try{seen=!!localStorage.getItem("ogonek-nt-seen")}catch(e){}return !seen&&today()<="2026-10-27"&&isLogged()}
function ntSeen(){try{localStorage.setItem("ogonek-nt-seen","1")}catch(e){}["ntTip","ntDot"].forEach(id=>{const n=$(id);if(n)n.remove()})}
function applyNtTip(){const on=ntNew(),top=$("loginTop"),pg=document.body.dataset.page||"home";
  let dot=$("ntDot");const pd=$("ptrDot");if(on&&!dot&&top&&!(pd&&!pd.hidden)){dot=el("span","ptrdot ntdot");dot.id="ntDot";dot.setAttribute("aria-hidden","true");top.after(dot)}if(dot&&!on)dot.remove();
  let tip=$("ntTip");if(on&&pg==="home"&&!tip&&!$("ptrTip")&&top){tip=el("button","ptrtip nttip","🔔 Новое: настройте уведомления ›");tip.type="button";tip.id="ntTip";
    tip.addEventListener("click",e=>{e.stopPropagation();ntSeen();if(window.ogonekOpenNotify)window.ogonekOpenNotify();else openNotify({})});
    const hdr=document.querySelector(".app>.top");if(hdr)hdr.append(tip)}
  if(tip&&(!on||pg!=="home"))tip.remove()}
function applyPtr(){
  try{applyNtTip()}catch(e){}
  try{applyNew()}catch(e){}
  const st=ptrStage(),top=$("loginTop"),logged=isLogged(),pg=document.body.dataset.page||"home";
  const onName=st==="on"&&logged;
  let dot=$("ptrDot");
  if(onName&&!dot&&top){dot=el("span","ptrdot");dot.id="ptrDot";dot.setAttribute("aria-hidden","true");top.after(dot)}
  if(dot)dot.hidden=!onName;
  if(top)top.classList.toggle("ptr",onName);
  let tip=$("ptrTip"),seen=false;try{seen=!!localStorage.getItem("ogonek-ptr-tip")}catch(e){}
  if(onName&&!seen&&!tip&&pg==="home"&&top&&!onbFirstDay()){tip=el("button","ptrtip","Изменить расписание — в профиле ›");tip.type="button";tip.id="ptrTip";
    tip.addEventListener("click",e=>{e.stopPropagation();try{localStorage.setItem("ogonek-ptr-tip","1")}catch(e2){}tip.remove();top.click()});
    const hdr=document.querySelector(".app>.top");if(hdr)hdr.append(tip)}
  if(tip&&(!onName||pg!=="home"))tip.remove();
  if(onName&&document.querySelector(".usermenu"))try{localStorage.setItem("ogonek-ptr-tip","1")}catch(e){}
  const nav=$("botNav");if(!nav)return;
  const pb=[...nav.querySelectorAll(".bn")].find(b=>b.getAttribute("aria-label")==="Расписания");
  const need=st==="noplan"||(st==="on"&&!logged);
  nav.querySelectorAll(".bnptr,.bntip").forEach(n=>{if(!need||n.parentNode!==pb)n.remove()});
  nav.querySelectorAll(".bn.need").forEach(b=>{if(b!==pb||!need)b.classList.remove("need")});
  if(!pb||!need||onbFirstDay())return; // в первый день — без подсказок, кроме карточки чтения
  pb.classList.add("need");
  if(!pb.querySelector(".bnptr"))pb.append(el("span","bnptr","!"));
  const tp=pb.querySelector(".bntip");
  if(pg==="plan"){if(tp)tp.remove()}
  else if(!tp){const t=el("span","bntip",st==="noplan"?"Выберите расписание ›":"Ваши расписания ›");
    t.addEventListener("click",e=>{e.stopPropagation();if(noPlan())openWelcome();else openPlans()});pb.append(t)}
}
// окно выбора показываем само один раз — когда прогресс уже загружен и других окон нет
(function welcomeAuto(){const t0=Date.now();let done=false;
  setInterval(()=>{try{applyPtr()}catch(e){}
    if(done)return;
    let seen=false,owner=null;try{seen=!!localStorage.getItem("ogonek-welcome");owner=localStorage.getItem("ogonek-owner")}catch(e){}
    if(seen){done=true;return}
    if(document.body.classList.contains("onbon"))return; // идёт «первый вход по шагам»
    const user=isLogged();
    if((user||owner)&&!window.__ogLoaded)return;
    if(!noPlan()){if(window.__ogLoaded||(!user&&!owner&&Date.now()-t0>6000))done=true;return}
    const au=$("auth");if(au&&!au.hidden)return;
    if(Date.now()-t0<2500||document.querySelector(".fmodal,.usermenu")||(window.OgonekGlobe&&OgonekGlobe.isOpen&&OgonekGlobe.isOpen()))return;
    done=true;openWelcome(true)},1500)})();
/* ---------- Первый вход по шагам (08.11): Приветствие → Что читать → Вход и имя → Напоминание → Первое чтение ----------
   Заменяет для новых людей экран входа, обязательное окно имени и окно выбора расписания. Шаг хранится в localStorage
   («ogonek-onb-step»), потому что смена расписания и вход через Google на телефоне перезагружают страницу. */
const ONB_FL='<svg viewBox="0 0 64 80"><defs><linearGradient id="onbg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a00"/><stop offset=".6" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ffd25a"/></linearGradient></defs><path d="M32 4c4 14 22 22 22 44a22 22 0 0 1-44 0c0-10 5-17 10-22 0 8 4 12 8 12-2-14 2-26 4-34z" fill="url(#onbg)"/><path d="M32 40c3 6 10 9 10 18a10 10 0 0 1-20 0c0-5 3-9 6-11 0 4 2 5 3 5-1-5 0-9 1-12z" fill="#fff3c4"/></svg>';
const onbLS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,String(v))}catch(e){}}};
function onbFirstDay(){return onbLS.get("ogonek-onb-day")===today()||!!document.querySelector(".onb")}
function openOnb(startStep){
  if(document.querySelector(".onb"))return;
  window.__onbActive=true;document.body.classList.add("onbon");onbLS.set("ogonek-welcome","1");
  const S={step:0,plan:onbLS.get("ogonek-onb-plan")||"spb",time:+(onbLS.get("ogonek-onb-time")||22),name:""};
  const root=el("div","onb");root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label","Первый вход в Огонёк");
  const bar=el("div","obar"),back=el("button","oback","‹"),dots=el("div","odots");back.type="button";back.setAttribute("aria-label","Назад");
  bar.append(back,dots,el("span","oskip"));const stage=el("div","ostage");root.append(bar,stage);
  const steps=[0,1,2,3,4].map(()=>el("div","ostep"));steps.forEach(s=>stage.append(s));for(let i=0;i<5;i++)dots.append(el("i"));
  const logged=()=>isLogged(),info=()=>{try{return window.ogAuthInfo?window.ogAuthInfo():{}}catch(e){return {}}};
  const foot=(...b)=>{const f=el("div","ofoot");f.append(...b);return f};
  const btn=(cls,t,fn)=>{const b=el("button",cls,t);b.type="button";b.addEventListener("click",fn);return b};
  const hero=()=>{const h=el("div","ohero");h.innerHTML=ONB_FL;return h};
  // 0 — приветствие
  function d0(s){s.append(hero(),el("h1",null,"Огонёк"),el("p",null,"Немного Библии каждый день — и огонёк разгорается. Читайте вместе с друзьями и церковью."),
    foot(btn("ogo","Начать",()=>to(1)),btn("olink","Я уже читаю в Огоньке — войти",()=>{onbLS.set("ogonek-onb-step","login");signIn()})))}
  // 1 — что читать
  function d1(s){s.append(el("h2",null,"Что будем читать?"),el("p",null,"Выберите одно — потом можно добавить ещё или поменять."));
    const cs=el("div","ocards");
    [["spb","flame","Вместе с церковью в Санкт-Петербурге","Вся Библия за 2 года · Новый и Ветхий Завет каждый день · ~15 минут","Все читают одно и то же"],
     ["nt","book","Новый Завет — по главе в день","~5 минут в день · хорошо для начала",""],
     ["own","scroll","Своё расписание","Любые книги и свой темп — Жизнеизучение, книги служения",""]].forEach(([id,ic,t,d,tag])=>{
      const b=el("button","ocard"+(S.plan===id?" on":""));b.type="button";const tx=el("span");if(tag)tx.append(el("span","otag",tag));tx.append(el("b",null,t),el("small",null,d));b.append(icoEl(ic),tx);
      b.addEventListener("click",()=>{S.plan=id;onbLS.set("ogonek-onb-plan",id);cs.querySelectorAll(".ocard").forEach(c=>c.classList.toggle("on",c===b))});cs.append(b)});
    s.append(cs,foot(btn("ogo","Дальше",applyPlan)))}
  function applyPlan(){
    onbLS.set("ogonek-onb-step",2);
    if(S.plan==="spb"){
      if(!SCHED.spb){switchPlan({id:"spb"});return} // перезагрузка → шаг 2
      state.planChosen=true;if(state.ptrEdit===undefined)state.ptrEdit="on";state.tracks={spb:true,conf:false};
      try{localStorage.setItem("ogonek-app-mode","spb")}catch(e){}save();render();to(2);return}
    if(S.plan==="nt"){const d={id:"my-"+Date.now().toString(36),custom:true,name:"Новый Завет",emb:"book",start:today(),sec:NTSEC.slice(),mode:"seq",by:"chapters",amount:1};switchPlan(d);return}
    to(2)} // своё — книги выберет в конце
  // 2 — вход и имя
  function d2(s){s.textContent="";
    if(!logged()){s.append(el("h2",null,"Сохраним ваш огонёк"),el("p",null,"Войдите — прогресс не потеряется, и друзья увидят, где вы читаете."),hero());
      const g=btn("ogoogle","",()=>{g.disabled=true;g.lastChild.textContent="Вхожу…";signIn();setTimeout(()=>{g.disabled=false;g.lastChild.textContent="Войти через Google"},9000)});g.append(el("span","g"),el("span",null,"Войти через Google"));
      s.append(foot(g,btn("olink","Пока без входа — только на этом телефоне",()=>{try{window.ogSkipLogin&&window.ogSkipLogin()}catch(e){}to(4)})));return}
    const nm=(info().name||"").trim();s.append(el("h2",null,"Как вас зовут?"),el("p",null,"Так вас увидят друзья. Можно поправить."));
    const av=el("div","oav",(nm||"?").charAt(0).toUpperCase()),inp=document.createElement("input");inp.className="onamein";inp.value=nm;inp.maxLength=40;inp.autocomplete="given-name";inp.setAttribute("aria-label","Имя");
    const go=btn("ogo","Дальше",async()=>{go.disabled=true;setGender(S.g);try{await (window.ogSaveNick&&window.ogSaveNick(S.name))}catch(e){console.warn(e)}go.disabled=false;to(3)});
    S.g=S.g||myGender();const gs=el("div","ogender");
    [["m","Мужской"],["f","Женский"]].forEach(([g,t])=>{const b=btn("ogsex"+(S.g===g?" on":""),S.g===g?"✓ "+t:t,()=>{
        if(S.g===g)return;
        if(b.dataset.arm!=="1"){gs.querySelectorAll(".ogsex").forEach(c=>{c.dataset.arm="";c.classList.remove("arm");c.textContent=(c.classList.contains("on")?"✓ ":"")+c.dataset.t});b.dataset.arm="1";b.classList.add("arm");b.textContent=t;b.append(el("small",null,"нажмите ещё раз"));return}
        S.g=g;gs.querySelectorAll(".ogsex").forEach(c=>{c.dataset.arm="";c.classList.remove("arm");c.classList.toggle("on",c===b);c.textContent=(c===b?"✓ ":"")+c.dataset.t});ok()});b.dataset.t=t;gs.append(b)});
    const ok=()=>{S.name=inp.value.replace(/\s+/g," ").trim();go.disabled=S.name.length<2||!S.g;av.textContent=(S.name||"?").charAt(0).toUpperCase()};
    inp.addEventListener("input",ok);inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!go.disabled)go.click()});ok();s.append(av,inp,el("div","oglab","Пол"),gs,foot(go))}
  // 3 — напоминание: разрешение спрашиваем только здесь и только по нажатию
  function d3(s){const b=el("div","obell");b.append(icoEl("bell"));s.append(b,el("h2",null,"Напомнить вечером?"),el("p",null,"Если день ещё не прочитан — короткое уведомление днём в 14:00 и вечером. Без спама."));
    const ts=el("div","otimes");[20,21,22].forEach(h=>{const t=btn("otime"+(h===S.time?" on":""),h+":00",()=>{S.time=h;onbLS.set("ogonek-onb-time",h);ts.querySelectorAll(".otime").forEach(c=>c.classList.toggle("on",c===t))});ts.append(t)});
    const go=btn("ogo","Включить напоминание",async()=>{go.disabled=true;
      try{localStorage.setItem("ogonek-notify",JSON.stringify({on:true,times:[{h:14,on:true},{h:S.time,on:true}],friends:true}))}catch(e){}
      S.remind=true;try{await (window.ogEnableReminder&&window.ogEnableReminder())}catch(e){console.warn(e)}go.disabled=false;to(4)});
    s.append(ts,foot(go,btn("olink","Не сейчас",()=>{S.remind=false;to(4)})))}
  // 4 — первое чтение
  function d4(s){s.textContent="";const nm=logged()?(info().name||"").split(" ")[0]:"";
    s.append(el("h2",null,(nm?nm+", в":"В")+"сё готово!"),el("p",null,S.remind?"Напомним в 14:00 и "+S.time+":00, если день не прочитан.":"Напоминания можно включить потом — в меню под вашим именем."));
    const c=el("div","ofirst");c.append(el("small",null,"Ваше первое чтение · сегодня"));
    if(S.plan==="own"&&noPlan())c.append(el("b",null,"Сейчас выберете книги и темп"));
    else{try{KEYS.forEach(k=>{const x=part(k,Math.min(Math.max(0,nextP(k)),DAYS-1));if(x&&x.book)c.append(el("b",null,refStr(x)))})}catch(e){}}
    c.append(el("p",null,"Прочитали — нажмите «Прочитал(а)», и огонёк загорится."));
    const later=el("div","olater");later.append(el("b",null,"Остальное покажем потом, по одному:"));[["❞","Отметить стих, который затронул"],["👥","Позвать друзей"],["🌍","Глобус читателей"]].forEach(([i,t])=>{const sp=el("span");sp.append(el("span",null,i),el("span",null,t));later.append(sp)});
    s.append(c,later,foot(btn("ogo",S.plan==="own"&&noPlan()?"Выбрать книги":"Начать читать",()=>finish(false))))}
  const draw=[d0,d1,d2,d3,d4];
  function to(n){if(n===3&&!logged())n=4;onbLS.set("ogonek-onb-step",n);const prev=S.step;S.step=n;steps[n].textContent="";draw[n](steps[n]);
    steps.forEach((s,i)=>{s.classList.toggle("on",i===n);s.classList.toggle("left",i<n)});dots.querySelectorAll("i").forEach((d,i)=>d.classList.toggle("on",i===n));back.hidden=n===0;
    const f=steps[n].querySelector("input");if(f&&prev!==n)setTimeout(()=>f.focus(),380)}
  back.addEventListener("click",()=>{if(S.step>0)to(S.step===4&&!logged()?2:S.step-1)});
  function signIn(){try{if(window.ogSignIn)window.ogSignIn();else toast("Вход пока недоступен — проверьте интернет")}catch(e){console.warn(e)}}
  // вход прошёл (всплывающее окно — без перезагрузки)
  const onAuth=()=>{if(!document.body.contains(root))return;if(!logged()||!window.__ogLoaded)return;
    if(!noPlan()&&(S.step===0||onbLS.get("ogonek-onb-step")==="login")){finish(true);return}
    if(S.step===0)to(1);else if(S.step===2)to(2)};
  window.addEventListener("og-auth",onAuth);
  function finish(returning){window.removeEventListener("og-auth",onAuth);onbLS.set("ogonek-onb","1");onbLS.set("ogonek-onb-step",null);onbLS.set("ogonek-onb-plan",null);
    if(!returning)onbLS.set("ogonek-onb-day",today());
    root.style.transition="opacity .35s";root.style.opacity="0";setTimeout(()=>{root.remove();window.__onbActive=false;document.body.classList.remove("onbon");try{applyPtr()}catch(e){}},360);
    try{setPage("home")}catch(e){}
    if(returning){toast("С возвращением! Прогресс загружен");return}
    if(S.plan==="own"&&noPlan()){setTimeout(()=>openPlans("custom"),380);return}
    setTimeout(onbCoach,500)}
  document.body.append(root);requestAnimationFrame(()=>to(startStep||0));
}
/* ---------- пол: «Мужской» / «Женский» ---------- */
function myGender(){return state.gender==="m"||state.gender==="f"?state.gender:""}
function setGender(g){if(g!=="m"&&g!=="f")return;state.gender=g;save();try{window.ogSetGender&&window.ogSetGender(g)}catch(e){}try{window.ogGroupRender&&window.ogGroupRender()}catch(e){}try{window.dispatchEvent(new Event("og-gender"))}catch(e){}}
window.ogGender=myGender;
// вошёл до обновления и пол не указан — одно короткое окно, без подробностей
function askGender(){if(myGender()||document.querySelector(".gmodal2,.onb"))return;
  const m=el("div","fmodal gmodal2"),sh=el("div","fsheet gsheet");sh.setAttribute("role","dialog");sh.setAttribute("aria-modal","true");sh.setAttribute("aria-label","Ваш пол");
  sh.append(el("h2",null,"Ваш пол"));const row=el("div","ogender");
  [["m","Мужской"],["f","Женский"]].forEach(([g,t])=>{const b=el("button","ogsex",t);b.type="button";b.dataset.t=t;b.addEventListener("click",()=>{
      if(b.dataset.arm!=="1"){row.querySelectorAll(".ogsex").forEach(c=>{c.dataset.arm="";c.classList.remove("arm");c.textContent=c.dataset.t});b.dataset.arm="1";b.classList.add("arm");b.textContent=t;b.append(el("small",null,"нажмите ещё раз"));return}
      setGender(g);m.remove()});row.append(b)});
  sh.append(row);m.append(sh);document.body.append(m)}
window.ogAskGender=askGender;window.ogGenderLocal=g=>{if((g==="m"||g==="f")&&state.gender!==g){state.gender=g;save();try{window.ogGroupRender&&window.ogGroupRender()}catch(e){}try{window.dispatchEvent(new Event("og-gender"))}catch(e){}}};window.__ogOpenOnb=n=>openOnb(n);window.__ogResetGender=()=>{delete state.gender;save();try{window.dispatchEvent(new Event("og-gender"))}catch(e){}};
// после первого входа — одна подсказка на карточке чтения
function onbCoach(){const card=$("testaments");if(!card)return;const box=card.closest(".card")||card;
  document.querySelectorAll(".coachtip").forEach(x=>x.remove());box.classList.add("coach");
  const tip=el("div","coachtip","Это ваше чтение на сегодня. Откройте отрывок, прочитайте и нажмите «Прочитал(а)» 🔥");
  const x=el("button",null,"✕");x.type="button";x.setAttribute("aria-label","Понятно");tip.append(x);
  const off=()=>{box.classList.remove("coach");tip.remove()};x.addEventListener("click",off);box.addEventListener("click",e=>{if(e.target.closest(".nextmark,.tbtn"))off()});
  card.before(tip);setTimeout(()=>tip.scrollIntoView({block:"center",behavior:"smooth"}),100)}
// кому показывать: новый человек (ещё не выбирал расписание и не видел старое окно) или незаконченный путь
(function onbAuto(){
  const pend=onbLS.get("ogonek-onb-step"),fresh=!onbLS.get("ogonek-onb")&&!onbLS.get("ogonek-welcome");
  if(!pend&&!fresh)return;
  document.body.classList.add("onbon"); // пока решаем — экран входа не мигает
  const t0=Date.now();let done=false;
  const iv=setInterval(()=>{if(done)return;
    const user=isLogged(),owner=onbLS.get("ogonek-owner"),wait=Date.now()-t0;
    if((user||owner)&&!window.__ogLoaded&&wait<8000)return; // ждём прогресс из аккаунта
    if(!user&&wait<2200)return;                               // вход Google мог ещё не восстановиться
    done=true;clearInterval(iv);
    if(pend){let n=pend==="login"?(user&&!noPlan()?-1:(user?1:0)):+pend||0;if(n<0){onbLS.set("ogonek-onb-step",null);onbLS.set("ogonek-onb","1");document.body.classList.remove("onbon");toast("С возвращением! Прогресс загружен");return}openOnb(n);return}
    if(!noPlan()){onbLS.set("ogonek-onb","1");document.body.classList.remove("onbon");return}
    openOnb(user?1:0)},300)})();

/* ---------- start ---------- */
if(state.dropAfter){const id=state.dropAfter;delete state.dropAfter;if(id!==SCHED.id){if(state.plans)delete state.plans[id];if(state.myScheds)delete state.myScheds[id];if(state.extra)delete state.extra[id]}try{save()}catch(e){}}
function initSeen(){if(!Array.isArray(state.seenAwards))state.seenAwards=AWARDS.filter(a=>a.ok()).map(a=>a.id)}
initSeen();
const used=applyFreezes();
render();
if(used)toast("Заморозка сохранила вашу серию ("+used+" "+daysWord(used)+")");
try{if(sessionStorage.getItem("ogonek-made")){sessionStorage.removeItem("ogonek-made");setTimeout(()=>toast("Расписание создано! Изменить его можно в «Мои расписания» — в профиле"),1200)}}catch(e){}
// re-render when the day changes while the page stays open
document.addEventListener("visibilitychange",()=>{if(!document.hidden){applyFreezes();render()}});

function summary(){
  const S=paceSeries(), last=S.dates.length-1, out={};
  out.streak=streak(); out.best=state.best; out.xp=state.xp; out.level=level(state.xp).k;
  KEYS.forEach(k=>{
    const np=nextP(k), dates=[...datesOf(k)].sort();
    out[k+"Streak"]=streak(k); out[k+"Next"]=np; out[k+"Read"]=state[k].read.length;
    out[k+"Last"]=dates.length?dates[dates.length-1]:""; out[k+"Ahead"]=S[k][last];
  });
  out.awards=awards().filter(a=>a.ok).map(a=>a.id);
  out.gems=state.gems.n;
  // расписание: друзья видят, по какому плану вы читаете и какие у вас отрывки
  out.plan=SCHED.id; out.planName=SCHED.name; out.keys=KEYS.slice();
  out.plansDone=(state.finished||[]).map(f=>({n:f.name,d:f.days,f:f.end,e:f.emb||(f.id==="spb"?"flame":"book")}));
  try{out.books=booksSummary()}catch(e){out.books=[]}
  KEYS.forEach(k=>{const p=Math.min(out[k+"Next"],DAYS-1);out[k+"Ref"]=out[k+"Next"]>=DAYS?"":refStr(part(k,p));out[k+"Url"]=chapterUrl(part(k,p));out[k+"Label"]=T[k].label;out[k+"Days"]=DAYS});
  ["nt","ot"].forEach(k=>{if(!KEYS.includes(k)){const o=KEYS[0];["Streak","Next","Read","Last","Ahead"].forEach(f=>out[k+f]=out[o+f])}}); // для старых версий у друзей
  try{out.conf=confSummary()}catch(e){}
  // стихи, которые затронули: друзья видят их в профиле и на пути
  out.notes=(Array.isArray(state.notes)?state.notes:[]).slice(0,10).map(n=>({d:n.d,v:String(n.v||"").slice(0,40),r:String(n.r||"").slice(0,80),w:String(n.w||"").slice(0,1000)}));
  out.globeSchedule=globeSchedule();
  {let xd=0;try{xd=xCount(true)[0]}catch(e){}
   out.heroFlameDay=(activeKeys().some(k=>datesOf(k).has(today()))||xd>0||anySet().has(today()))?today():"";}
  {const np=noPlan();out.noPlan=np;out.chosen=!np} // оба флага явно: профиль сохраняется с merge, старый флаг иначе остаётся
  return out;
}
window.__gemDebug={chaptersDone:()=>chaptersDone(),pool:()=>gemPool().length,cur:()=>gemRun&&gemRun.qs[gemRun.i]&&gemRun.qs[gemRun.i].q[1],gems:()=>state.gems};
/* ---------- Конференция школьников (онлайн, 29 октября – 1 ноября 2026) ----------
   Отдельное расписание: Исход 19–20 и Псалом 119. Его нужно прочитать до 28 октября включительно.
   Объём делится поровну на дни от сегодняшнего до 28 октября; если день пропущен, остаток снова
   раскладывается поровну на оставшиеся дни. После 28 октября расписание закрыто и лежит в архиве.
   Данные — в state.conf: {joined, log:[{u,d}], q:{id:0|1}, g:{tab:{w,best,days},mem:{w,best,days}}, hide} */
const CONF={name:"Конференция школьников",short:"Конференция",dates:"онлайн · 29 октября – 1 ноября",end:"2026-10-28",open:"2026-10-01"};
const CONF_UNITS=(()=>{const u=[];
  [[19,1,6],[19,7,13],[19,14,19],[19,20,25],[20,1,7],[20,8,11],[20,12,17],[20,18,21],[20,22,26]].forEach(([c,a,z])=>u.push({b:"Исх.",c,a,z,st:-1}));
  for(let s=0;s<22;s++){u.push({b:"Пс.",c:119,a:s*8+1,z:s*8+4,st:s});u.push({b:"Пс.",c:119,a:s*8+5,z:s*8+8,st:s})}
  u.forEach((x,i)=>{x.i=i;x.w=x.z-x.a+1});return u})();
const CONF_VERSES=CONF_UNITS.reduce((s,x)=>s+x.w,0);
const HEB=["Алеф","Бет","Гимел","Далет","Хе","Вав","Заин","Хет","Тет","Йод","Каф","Ламед","Мем","Нун","Самех","Аин","Пе","Цади","Коф","Реш","Шин","Тав"];
// вопрос: [где (глава:стих), вопрос, верный, неверный, неверный]
const CONF_Q=[
 ["19:1","В каком месяце после выхода из Египта израильтяне пришли в пустыню Синай?","В третьем","В первом","В седьмом"],
 ["19:4","Как, по словам Бога, Он носил Израиль из Египта к Себе?","На орлиных крыльях","Как пастух на плечах","Как на колеснице"],
 ["19:6","Кем Бог хотел сделать Израиль?","Царством священников и святым племенем","Самым большим народом на земле","Народом непобедимых воинов"],
 ["19:8","Что ответил весь народ, услышав слова Бога?","«Всё, что сказал Иегова, исполним»","«Дай нам подумать»","«Пусть Моисей решает за нас»"],
 ["19:9","В чём Иегова пришёл к Моисею, чтобы народ слышал Его голос?","В густом облаке","В огненном столпе","В тихом ветре"],
 ["19:10","Что народ должен был сделать, чтобы приготовиться к третьему дню?","Освятиться и омыть свои одежды","Построить жертвенник","Собрать манну на три дня"],
 ["19:12","Что Моисей должен был сделать вокруг горы?","Установить границу, за которую нельзя заходить","Посадить деревья","Выкопать ров с водой"],
 ["19:13","Когда народ мог взойти на гору?","Когда труба издаст протяжный звук","Когда загорится огонь","Когда утихнет ветер"],
 ["19:16","Что было утром на третий день?","Громы, молнии, густое облако и очень сильный трубный звук","Землетрясение и полная тишина","Тёплый дождь и радуга"],
 ["19:18","Почему вся гора Синай дымилась?","Иегова сошёл на неё в огне","Моисей разжёг на ней жертвенник","На ней загорелся лес"],
 ["19:19","Что происходило со звуком трубы?","Он становился всё сильнее","Он постепенно затихал","Его слышал только Моисей"],
 ["19:20","Куда Иегова позвал Моисея?","На вершину горы","К подножию горы","В стан народа"],
 ["19:24","Кому Бог велел взойти вместе с Моисеем?","Аарону","Иисусу, сыну Навину","Мариам"],
 ["20:2","Как Бог называет Себя в начале заповедей?","Иегова, твой Бог, который вывел тебя из Египетской земли, из дома рабства","Бог, который даст тебе богатство","Бог только для священников"],
 ["20:3","О чём первая заповедь?","Пусть не будет у тебя других богов передо Мной","Почитай отца и мать","Не кради"],
 ["20:4","Что запрещает вторая заповедь?","Делать себе идола и поклоняться ему","Работать в субботу","Говорить неправду"],
 ["20:8","Какой день нужно помнить, чтобы освящать его?","Субботний день","Первый день месяца","День выхода из Египта"],
 ["20:9","Сколько дней в неделю можно трудиться и делать свои дела?","Шесть","Пять","Семь"],
 ["20:11","Почему Иегова благословил субботний день?","В шесть дней Он создал небо и землю, а в седьмой покоился","В этот день Израиль вышел из Египта","В этот день Моисей поднялся на гору"],
 ["20:12","Какая по счёту заповедь — «Почитай отца и мать»?","Пятая","Первая","Десятая"],
 ["20:12","Какое обещание дано тем, кто почитает отца и мать?","Продлятся дни на земле, которую Иегова даёт","Будет много друзей","Станешь самым богатым"],
 ["20:17","Что нельзя желать по десятой заповеди?","Ничего, что принадлежит ближнему","Хорошей погоды","Мудрости"],
 ["20:18","Что сделал народ, увидев громы, молнии и дымящуюся гору?","Затрепетал и встал поодаль","Побежал к горе","Начал петь и танцевать"],
 ["20:19","О чём народ попросил Моисея?","Ты говори с нами, а Бог пусть не говорит, чтобы нам не умереть","Уведи нас обратно в Египет","Построй нам город у горы"],
 ["20:20","Зачем, по словам Моисея, пришёл Бог?","Чтобы испытать народ — и чтобы они не грешили","Чтобы наказать народ","Чтобы забрать Моисея на небо"],
 ["20:21","К чему приблизился Моисей?","К мраку, где был Бог","К стану народа","К морю"],
 ["20:24","Из чего Бог велел сделать жертвенник?","Из земли","Из золота","Из кедрового дерева"],
 ["20:25","Из каких камней нельзя было строить жертвенник?","Из тёсаных, на которые поднимали орудие","Из неотёсанных","Из речных"],
 ["119:1","Кто блажен, по первому стиху псалма?","Те, чей путь совершенен, ходящие в законе Иеговы","Богатые и сильные","Те, у кого нет забот"],
 ["119:1","Что особенного в каждой строфе Псалма 119 из 8 стихов?","Все стихи строфы начинаются с одной буквы еврейского алфавита","Каждая строфа написана другим автором","Каждую строфу пели в другой день недели"],
 ["119:9","Чем юноше содержать в чистоте свой путь?","Оберегая его по слову Божьему","Никогда не ошибаясь","Слушая только себя"],
 ["119:11","Где псалмопевец скопил слово Божье, чтобы не грешить?","В сердце","В книге","В сундуке"],
 ["119:18","О чём псалмопевец просит в стихе 18?","Открыть ему глаза, чтобы созерцать чудесное из закона Божьего","Дать ему много золота","Победить всех его врагов"],
 ["119:19","Кем называет себя псалмопевец на земле?","Пришельцем","Царём","Пастухом"],
 ["119:25","К чему льнёт душа псалмопевца?","К праху","К золоту","К морю"],
 ["119:32","Что Бог делает с сердцем, чтобы псалмопевец бежал путём заповедей?","Расширяет его","Делает каменным","Прячет его"],
 ["119:37","От чего псалмопевец просит отвратить его глаза?","От созерцания суеты","От яркого солнца","От книг"],
 ["119:46","Перед кем псалмопевец будет говорить о свидетельствах Божьих и не будет посрамлён?","Перед царями","Перед детьми","Перед зверями"],
 ["119:45","Как будет ходить псалмопевец, потому что искал уставов Божьих?","Свободно","Оглядываясь от страха","Только днём"],
 ["119:54","Чем стали постановления Божьи для псалмопевца в доме его странствования?","Его песнями хвалы","Тяжёлым грузом","Крепкими стенами"],
 ["119:55","Когда псалмопевец вспоминал имя Иеговы?","Ночью","Только в праздник","Утром на рынке"],
 ["119:57","Что псалмопевец называет своей долей?","Иегову","Землю отцов","Золото"],
 ["119:62","В какое время он встаёт благодарить Бога?","В полночь","На рассвете","В полдень"],
 ["119:67","Что было с псалмопевцем, прежде чем он подвергся скорби?","Он заблуждался","Он был царём","Он жил в Египте"],
 ["119:72","Что для псалмопевца лучше тысяч слитков золота и серебра?","Закон уст Божьих","Дом и сад","Слава у людей"],
 ["119:73","Что сделали руки Божьи, по стиху 73?","Создали и образовали псалмопевца","Построили храм","Посадили сад"],
 ["119:83","С чем сравнивает себя псалмопевец в стихе 83?","С винным мехом в дыму","С деревом у воды","С орлом в небе"],
 ["119:89","Где навеки утверждено слово Иеговы?","На небе","На каменной скале","В Иерусалиме"],
 ["119:96","Что, по стиху 96, всеобширно?","Заповедь Божья","Море","Пустыня"],
 ["119:97","Сколько времени псалмопевец размышляет о законе Божьем?","Весь день","Час в неделю","Только в субботу"],
 ["119:99","Кого псалмопевец проницательнее, потому что свидетельства Божьи — его размышление?","Всех своих учителей","Только младших братьев","Никого"],
 ["119:103","Какими кажутся псалмопевцу слова Божьи?","Слаще мёда","Твёрже камня","Горче полыни"],
 ["119:105","Чем слово Божье является для ноги и для тропы?","Светильником и светом","Обувью и посохом","Картой и компасом"],
 ["119:111","Что для псалмопевца — наследие навеки?","Свидетельства Божьи","Земля","Дом отца"],
 ["119:114","Как псалмопевец называет Бога в стихе 114?","Потайным местом и щитом","Царём и судьёй","Светом и огнём"],
 ["119:119","Как Бог устраняет всех порочных земли?","Как окалину","Как солому ветром","Как воду в песок"],
 ["119:127","Что псалмопевец любит больше золота, даже лучшего?","Заповеди Божьи","Серебро","Драгоценные камни"],
 ["119:130","Что даёт свет и наделяет разумением простых?","Открытие слов Божьих","Солнце","Долгая учёба"],
 ["119:136","Почему глаза псалмопевца проливают потоки воды?","Потому что люди не соблюдают закон Божий","От дыма","От ветра"],
 ["119:140","Каким названо слово Божье в стихе 140?","Очень чистым","Трудным","Древним"],
 ["119:141","Каким называет себя псалмопевец в стихе 141?","Малым и презираемым","Сильным и смелым","Мудрым и знаменитым"],
 ["119:145","Как псалмопевец взывал к Иегове?","Всем сердцем","Шёпотом","Только в храме"],
 ["119:147","Что делал псалмопевец в стихе 147?","Опережал рассвет и восклицал","Взывал в полдень","Молился только вечером"],
 ["119:160","Что есть итог слова Божьего, по стиху 160?","Истина","Загадка","Предание"],
 ["119:162","Чему псалмопевец радуется, как нашедший большую добычу?","Слову Божьему","Победе над врагами","Богатому урожаю"],
 ["119:164","Сколько раз в день псалмопевец хвалит Бога?","Семь раз","Три раза","Один раз"],
 ["119:165","Что есть у любящих закон Божий?","Великий мир","Много денег","Слава у людей"],
 ["119:176","С кем сравнивает себя псалмопевец в последнем стихе?","С потерянной овцой","С сильным львом","С птицей в клетке"],
 ["119:176","Сколько стихов в Псалме 119 — самой длинной главе Библии?","176","150","119"],
 ["119:1","Какое из этих слов НЕ встречается в Псалме 119 как название слова Божьего?","Пророчество","Свидетельства","Уставы"],
 ["119:16","Что псалмопевец обещает не делать со словом Божьим?","Не забывать его","Не читать его по ночам","Не рассказывать о нём другим"],
 ["119:24","Чем стали для псалмопевца свидетельства Божьи?","Отрадой и советниками","Тяжёлым грузом","Тайной для мудрецов"],
 ["119:25","Что слово Божье делает с душой, которая льнёт к праху?","Оживляет её","Усыпляет её","Наказывает её"],
 ["119:28","О чём просит псалмопевец, когда его душа тает от огорчения?","Укрепить его по слову Божьему","Дать ему отдохнуть от всего","Забрать его скорбь без слова"],
 ["119:43","Каким псалмопевец называет слово Божье в стихе 43?","Словом истины","Словом тайны","Словом закона для царей"],
 ["119:50","Что стало утешением псалмопевца в его скорби?","Слово Божье, которое оживило его","Помощь друзей","Богатство"],
 ["119:86","Какие все заповеди Божьи, по стиху 86?","Верны (истинны)","Трудны","Временны"],
 ["119:92","Что было бы с псалмопевцем, если бы закон Божий не был его отрадой?","Он погиб бы в своей скорби","Он стал бы царём","Ничего не изменилось бы"],
 ["119:93","Почему псалмопевец никогда не забудет уставы Божьи?","Ими Бог оживил его","Их легко выучить","Их написал Моисей"],
 ["119:98","Кого заповеди Божьи делают псалмопевца мудрее?","Его врагов","Только детей","Животных"],
 ["119:100","Больше кого понимает псалмопевец, потому что соблюдал уставы Божьи?","Больше старцев","Больше пророков","Больше ангелов"],
 ["119:104","Чем псалмопевец приобретает разумение?","Уставами Божьими","Долгой жизнью","Путешествиями"],
 ["119:114","На что уповает (надеется) псалмопевец?","На слово Божье","На своё оружие","На своих друзей"],
 ["119:129","Какими псалмопевец называет свидетельства Божьи в стихе 129?","Чудесными","Скучными","Тайными"],
 ["119:133","О чём просит псалмопевец, чтобы над ним не владычествовало беззаконие?","Утвердить его стопы в слове Божьем","Дать ему сильную армию","Спрятать его в пещере"],
 ["119:137","Каковы суды Божьи, по стиху 137?","Правы","Жестоки","Непонятны"],
 ["119:142","Что такое закон Божий, по стиху 142?","Истина","Совет мудрецов","Древняя традиция"],
 ["119:144","Что даёт праведность свидетельств Божьих тому, кто их понимает?","Он будет жить","Он станет богатым","Он станет знаменитым"],
 ["119:152","На сколько времени основаны свидетельства Божьи?","Навеки","На сто лет","До конца жизни Моисея"],
 ["119:165","Что ещё сказано о любящих закон Божий, кроме великого мира?","Нет им повода для преткновения","Они никогда не будут плакать","Они не будут работать"],
 ["119:172","О чём будет петь язык псалмопевца?","О слове Божьем","О своих победах","О красоте природы"]
].map((q,i)=>{const [c,v]=q[0].split(":").map(Number),u=CONF_UNITS.find(x=>x.c===c&&v>=x.a&&v<=x.z);return {id:"q"+i,u:u.i,at:(c===119?"Пс. ":"Исх. ")+c+":"+v,c,v,q:q[1],opts:q.slice(2)}});
const CONF_PAIRS=[["🦅","Носил на орлиных крыльях","Исх. 19:4"],["⛰️","Дым поднимался, как дым печи","Исх. 19:18"],["📯","Звук трубы всё сильнее","Исх. 19:19"],["🪨","Жертвенник не из тёсаных камней","Исх. 20:25"],
 ["❤️","Скопил слово в сердце","Пс. 119:11"],["👀","Открой мои глаза","Пс. 119:18"],["👑","Не посрамлён перед царями","Пс. 119:46"],["🎵","Постановления — мои песни хвалы","Пс. 119:54"],["🌙","Встаю в полночь благодарить","Пс. 119:62"],
 ["💰","Лучше тысяч золота и серебра","Пс. 119:72"],["💨","Как винный мех в дыму","Пс. 119:83"],["🧑‍🏫","Проницательнее всех учителей","Пс. 119:99"],["🍯","Слаще мёда","Пс. 119:103"],["🪔","Светильник моей ноге","Пс. 119:105"],
 ["🛡️","Потайное место и щит","Пс. 119:114"],["🌱","Слово оживило меня","Пс. 119:50"],["🧭","Свидетельства — мои советники","Пс. 119:24"],["💪","Укрепи меня по слову","Пс. 119:28"],["🕊️","Великий мир любящим закон","Пс. 119:165"],["☁️","Слово утверждено на небе","Пс. 119:89"],["💎","Слово истины","Пс. 119:43"],["7️⃣","Хвалю Тебя семь раз в день","Пс. 119:164"],["🐑","Как потерянная овца","Пс. 119:176"]]
 .map(([e,t,r])=>{const m=/(\d+):(\d+)$/.exec(r),c=+m[1],v=+m[2];return {e,t,r,u:CONF_UNITS.find(x=>x.c===c&&v>=x.a&&v<=x.z).i}});
// «Найди пару»: наборы по строфам Псалма 119 (по 8 стихов) и по главам Исхода — стих ↔ о чём он
const MEM_PS=[
 [1,"Блаженны те, чей путь совершенен"],[2,"Блаженны всем сердцем ищущие Его"],[5,"О, если бы были утверждены мои пути!"],[8,"Я буду соблюдать Твои постановления"],
 [9,"Чем юноше содержать в чистоте свой путь?"],[10,"Всем моим сердцем я искал Тебя"],[11,"В моём сердце я скопил Твоё слово"],[14,"Я радовался пути Твоих свидетельств"],
 [17,"Поступи щедро с Твоим слугой"],[18,"Открой мои глаза, чтобы я созерцал"],[19,"Я пришелец на земле"],[24,"Твои свидетельства — моя отрада, мои советники"],
 [25,"Моя душа льнёт к праху; оживи меня"],[28,"Моя душа тает от огорчения; укрепи меня"],[30,"Я избрал путь верности"],[32,"Я бегу путём Твоих заповедей"],
 [33,"Научи меня, Иегова, пути Твоих постановлений"],[34,"Хранить его буду всем сердцем"],[35,"Дай мне идти тропой Твоих заповедей"],[37,"Отврати мои глаза от созерцания суеты"],
 [45,"И буду я ходить свободно"],[46,"Буду говорить о Твоих свидетельствах перед царями"],[47,"Буду находить отраду в Твоих заповедях"],[48,"Подниму я мои руки к Твоим заповедям"],
 [49,"Вспомни слово к Твоему слуге"],[50,"Твоё слово оживило меня"],[54,"Твои постановления — мои песни хвалы"],[55,"Я вспоминал ночью Твоё имя, Иегова"],
 [57,"Иегова — моя доля"],[62,"В полночь я встаю, чтобы благодарить Тебя"],[63,"Я товарищ всем, которые боятся Тебя"],[64,"Твоя любовная забота наполняет землю"],
 [67,"Прежде чем я подвергся скорби, я заблуждался"],[68,"Ты — благой и Делающий благое"],[71,"Хорошо мне, что я подвергся скорби"],[72,"Закон Твоих уст лучше тысяч слитков золота"],
 [73,"Твои руки создали меня и образовали меня"],[74,"Боящиеся Тебя увидят меня и возрадуются"],[76,"Пусть Твоя любовная забота будет моим утешением"],[80,"Пусть будет моё сердце совершенно"],
 [81,"Моя душа изнемогает, жаждая Твоего спасения"],[82,"Когда Ты утешишь меня?"],[83,"Я стал как винный мех в дыму"],[88,"Оживи меня по Твоей любовной заботе"],
 [89,"Навеки утверждено Твоё слово на небе"],[90,"Твоя верность — из поколения в поколение"],[92,"Если бы Твой закон не был моей отрадой"],[96,"Твоя заповедь всеобширна"],
 [97,"Как я люблю Твой закон!"],[98,"Твои заповеди делают меня мудрее моих врагов"],[99,"Я проницательнее всех моих учителей"],[103,"Слаще мёда моим устам!"],
 [105,"Твоё слово — светильник моей ноге"],[106,"Буду соблюдать Твои праведные предписания"],[111,"Твои свидетельства — моё наследие навеки"],[112,"Я приклонил моё сердце исполнять Твои постановления"],
 [113,"Твой закон люблю"],[114,"Ты моё потайное место и мой щит"],[116,"Подкрепи меня по Твоему слову"],[119,"Ты устраняешь, как окалину, всех порочных"],
 [125,"Я Твой слуга; дай мне разумение"],[126,"Пора Иегове действовать"],[127,"Люблю Твои заповеди больше золота"],[128,"Ненавижу всякий лживый путь"],
 [129,"Чудесны Твои свидетельства"],[130,"Открытие Твоих слов даёт свет"],[131,"Я жаждал Твоих заповедей"],[136,"Мои глаза проливают потоки воды"],
 [137,"Ты праведен, Иегова, и Твои суды правы"],[140,"Твоё слово очень чисто"],[141,"Я мал и презираем"],[142,"Твой закон — истина"],
 [145,"Я воззвал всем сердцем; ответь мне, Иегова"],[147,"Я опережал рассвет и восклицал"],[148,"Мои глаза опережали ночные стражи"],[151,"Ты близко, Иегова"],
 [153,"Посмотри на мою скорбь и избавь меня"],[156,"Велики Твои сострадания, Иегова"],[159,"Посмотри, как я возлюбил Твои уставы"],[160,"Итог Твоего слова — истина"],
 [161,"Моё сердце благоговеет перед Твоими словами"],[162,"Как нашедший большую добычу"],[164,"Семь раз в день я хвалю Тебя"],[165,"Великий мир любящим Твой закон"],
 [171,"Пусть мои губы изливают хвалу"],[172,"Пусть мой язык воспевает Твоё слово"],[175,"Пусть живёт моя душа"],[176,"Я заблудился, как потерянная овца"]];
const MEM_SETS=[
 {id:"x19",title:"Исход 19",sub:"у горы Синай",units:[0,1,2,3],pairs:[[19,4,"Носил вас на орлиных крыльях"],[19,6,"Царство священников и святое племя"],[19,9,"Я приду к тебе в густом облаке"],[19,16,"Громы, и молнии, и очень сильный трубный звук"],[19,18,"Дым поднимался, как дым печи"]]},
 {id:"x20",title:"Исход 20",sub:"Десять заповедей",units:[4,5,6,7,8],pairs:[[20,2,"Вывел тебя из Египетской земли, из дома рабства"],[20,3,"Пусть не будет у тебя других богов передо Мной"],[20,12,"Почитай твоего отца и твою мать"],[20,21,"Моисей приблизился к мраку, где был Бог"],[20,24,"Жертвенник из земли сделай Мне"]]}
].concat(HEB.map((h,s)=>({id:"p"+s,title:h,sub:"Пс. 119:"+(s*8+1)+"–"+(s*8+8),st:s,pairs:MEM_PS.filter(([v])=>Math.floor((v-1)/8)===s).map(([v,t])=>[119,v,t])})));
function memSetOpen(m,r){return m.st!=null?CONF_UNITS.filter(u=>u.st===m.st).every(u=>r.has(u.i)):m.units.every(i=>r.has(i))}
const TEN=["Пусть не будет у тебя других богов","Не делай себе идола","Не бери имя Иеговы напрасно","Помни субботний день","Почитай твоего отца и твою мать","Не убивай","Не прелюбодействуй","Не кради","Не свидетельствуй ложным свидетельством","Не желай того, что принадлежит ближнему"];
const TEN_UNITS=[4,5,6];

function confSt(){if(!state.conf||typeof state.conf!=="object")state.conf={};const c=state.conf;c.log=c.log||[];c.q=c.q||{};c.g=c.g||{};return c}
function confScore(s){const c=s&&s.conf;return c?((c.log||[]).length+Object.keys(c.q||{}).length+(c.joined?1:0)):0}
function confClosed(){try{return today()>CONF.end}catch(e){return true}} // function: вызывается из первого render() раньше, чем объявлен CONF
const confDaysLeft=()=>Math.max(0,dayNo(CONF.end)-dayNo(today())+1);
const confRead=()=>new Set(confSt().log.map(x=>x.u));
const confReadWhen=()=>{const m={};confSt().log.forEach(x=>{m[x.u]=x.d});return m};
const TAB_LIMIT=2,TAB_STARS=3;
const tabToday=()=>{const g=confSt().g.tab||{};return ((g.cnt||{})[today()])||0};
function confStars(){const c=confSt();return Object.values(c.q).filter(x=>x===1).length+Object.entries(c.g).reduce((s,[k,g])=>{if(!g)return s;
  if(k==="tab"){const cnt=g.cnt||{};return s+Object.values(cnt).reduce((a,n)=>a+Math.min(n,TAB_LIMIT)*TAB_STARS,0)+(g.days||[]).filter(d=>!(d in cnt)).length*2}
  return s+(g.days||[]).length*2},0)}
// делим части на n дней как можно ровнее по стихам; разрез внутри строфы псалма — лишь когда без этого никак
function confSplit(units,n){
  const L=units.length;n=Math.max(1,Math.min(n,L));if(!L)return [];
  const pre=[0];units.forEach(u=>pre.push(pre[pre.length-1]+u.w));const ideal=pre[L]/n;
  const cost=(i,j)=>{const s=pre[j]-pre[i],d=s-ideal;return d*d+(j<L&&units[j-1].st>=0&&units[j-1].st===units[j].st?6:0)};
  const D=[],P=[];for(let k=0;k<=n;k++){D.push(new Array(L+1).fill(Infinity));P.push(new Array(L+1).fill(0))}
  D[0][0]=0;
  for(let k=1;k<=n;k++)for(let j=k;j<=L-(n-k);j++)for(let i=k-1;i<j;i++){const v=D[k-1][i]+cost(i,j);if(v<D[k][j]){D[k][j]=v;P[k][j]=i}}
  const out=[];let j=L;for(let k=n;k>0;k--){const i=P[k][j];out.unshift(units.slice(i,j));j=i}return out;
}
// подписи отрывков: соседние части сливаются («Исх. 19:20–20:7», «Пс. 119:9–20»)
function confRefs(units){
  const runs=[];units.forEach(u=>{const r=runs[runs.length-1];
    if(r&&r.b===u.b&&r.lastI===u.i-1){r.zc=u.c;r.zv=u.z;r.lastI=u.i}else runs.push({b:u.b,ac:u.c,av:u.a,zc:u.c,zv:u.z,lastI:u.i})});
  return runs.map(r=>{const bk=BOOK[r.b],full=c=>bk.v[c-1];let ref;
    if(r.ac===r.zc)ref=r.av===1&&r.zv===full(r.ac)?String(r.ac):r.ac+":"+r.av+"–"+r.zv;
    else ref=r.av===1&&r.zv===full(r.zc)?r.ac+"–"+r.zc:r.ac+":"+r.av+"–"+r.zc+":"+r.zv;
    const x={book:r.b,ref};let note="";
    if(r.b==="Пс."){const s1=Math.floor((r.av-1)/8),s2=Math.floor((r.zv-1)/8);note=s1===s2?"строфа «"+HEB[s1]+"»":"строфы «"+HEB[s1]+"» – «"+HEB[s2]+"»"}
    else if(r.zc===19)note="у горы Синай";else if(r.ac===19)note="у горы Синай · заповеди";else if(r.av>=18)note="народ у горы · жертвенник";else note=r.zv>17?"Десять заповедей · жертвенник":"Десять заповедей";
    return {text:refStr(x),url:chapterUrl(x),note,verses:units.filter(u=>u.b===r.b).reduce((s,u)=>s+u.w,0)}});
}
// план: прошедшие дни — что прочитано в тот день; с сегодняшнего — остаток поровну на оставшиеся дни
function confPlan(){
  const c=confSt(),t=today(),when=confReadWhen(),days=[];
  if(c.joined){let d=c.joined<t?c.joined:t;while(d<t){const us=CONF_UNITS.filter(u=>when[u.i]===d);days.push({d,past:true,units:us});d=add(d,1)}}
  const left=CONF_UNITS.filter(u=>!(u.i in when)||when[u.i]>=t);
  const n=confDaysLeft();
  if(n&&left.length){const parts=confSplit(left,n);parts.forEach((us,k)=>days.push({d:add(t,k),now:k===0,units:us}))}
  return days;
}
function confToday(){const p=confPlan().find(x=>x.now);return p?p.units:[]}
function confMark(units,on){const c=confSt(),t=today();const ids=new Set(units.map(u=>u.i));
  c.log=c.log.filter(x=>!ids.has(x.u));if(on)units.forEach(u=>c.log.push({u:u.i,d:t}));save();try{confPublishRead()}catch(e){}}
function confUnlocked(){const r=confRead();return CONF_Q.filter(q=>r.has(q.u))}
function confNewQ(){const c=confSt();return confUnlocked().filter(q=>!(q.id in c.q)).length}
function confConfetti(){const box=el("div","confetti");const cols=["#2f8f6b","#ffc53d","#ff7a1a","#6b4fd8","#3fa7e0"];
  for(let i=0;i<60;i++){const p=el("i");p.style.left=Math.random()*100+"%";p.style.background=cols[i%cols.length];p.style.animationDelay=Math.random()*.6+"s";p.style.animationDuration=1.4+Math.random()*1.2+"s";box.append(p)}
  document.body.append(box);setTimeout(()=>box.remove(),3200)}
const mountSvg='<svg class="cmount" viewBox="0 0 58 50" aria-hidden="true"><path d="M2 48 L22 14 L30 26 L36 18 L56 48Z" fill="#2f8f6b"/><path d="M22 14 L27 22 L24 21 L20 24 L17 22Z" fill="#fff" opacity=".85"/><path d="M8 12c4-6 12-6 15-2 3-3 9-2 10 2" fill="none" stroke="#9aa3b5" stroke-width="3" stroke-linecap="round"/><path d="M29 30l2-6 2 6" stroke="#ffc53d" stroke-width="2" fill="none"/></svg>';

/* карточка на главной */
function confRenderCard(){
  const card=$("confCard");if(!card)return;const c=confSt();try{confTabDot()}catch(e){}
  if(confClosed()||!tracks().conf){card.hidden=true;return}
  card.hidden=false;card.textContent="";
  const hero=el("div","chero");hero.insertAdjacentHTML("afterbegin",mountSvg);
  const tt=el("div");tt.append(el("h2",null,CONF.name),el("div","csub",CONF.dates+" · прочитать до 28 октября"));hero.append(tt);
  const n=confDaysLeft(),cnt=el("div","ccount");cnt.append(el("b",null,String(n)),el("span",null,plural(n,"день","дня","дней")+" осталось"));hero.append(cnt);
  card.prepend(el("div","chtag","Челлендж «Божья гора» · временный"));card.append(hero);const ts=confTeamStrip();if(ts)card.append(ts);
  if(!c.joined){
    const per=Math.round(CONF_VERSES/Math.max(1,Math.min(n,CONF_UNITS.length)));
    card.append(el("p","cnote","Исход 19–20 и Псалом 119. Начните сегодня — это "+n+" "+plural(n,"день","дня","дней")+" примерно по "+per+" "+plural(per,"стиху","стиха","стихов")+". Чем позже присоединитесь, тем больше чтения в день: расписание подстраивается под вас."));
    const j=el("button","cbtn","Присоединиться");j.type="button";j.addEventListener("click",()=>{confJoin();openConf("read")});
    const row=el("div","crow");const more=el("button","btn","Подробнее");more.type="button";more.addEventListener("click",()=>openConf("read"));
    row.append(more);card.append(j,row);if(!tracks().spb){const lk=el("button","linkbtn chide","＋ Подключить основное расписание церкви");lk.type="button";lk.addEventListener("click",()=>{setTrack("spb",true);toast("Основное расписание подключено — переключайтесь вверху")});card.append(lk)}return;
  }
  const r=confRead(),pct=Math.round(CONF_UNITS.filter(u=>r.has(u.i)).reduce((s,u)=>s+u.w,0)/CONF_VERSES*100);
  const pr=el("div","cprog");pr.innerHTML="<span>Прочитано <b>"+pct+"%</b></span><span class='cstars'>⭐ "+confStars()+"</span>";
  const bar=el("div","cbar");const bi=el("i");bi.style.width=pct+"%";bar.append(bi);card.append(pr,bar);
  card.append(confTodayBlock());
  const row=el("div","crow");const nq=confNewQ();
  const qb=el("button","btn");qb.type="button";qb.append("Вопросы ");if(nq)qb.append(el("span","cnew",String(nq)));qb.addEventListener("click",()=>openConf("quiz"));
  const gb=el("button","btn","🎮 Игры");gb.type="button";gb.addEventListener("click",()=>openConf("games"));
  const sb=el("button","btn","Расписание");sb.type="button";sb.addEventListener("click",()=>openConf("read"));
  row.append(sb,qb,gb);card.append(row);
  if(!tracks().spb){const lk=el("button","linkbtn chide","＋ Подключить основное расписание церкви");lk.type="button";lk.addEventListener("click",()=>{setTrack("spb",true);toast("Основное расписание подключено — переключайтесь вверху")});card.append(lk)}
}
// серия конференции: дни подряд, когда что-то прочитано (сегодня ещё можно успеть)
function confStreak(){const ds=new Set(confSt().log.map(x=>x.d));let d=today();if(!ds.has(d))d=add(d,-1);let n=0;while(ds.has(d)){n++;d=add(d,-1)}return n}
function confFlame(cls){const f=document.createElementNS("http://www.w3.org/2000/svg","svg");f.setAttribute("viewBox","0 0 64 80");f.setAttribute("class",cls);f.innerHTML=FLAME;return f}
// «Чтение на сегодня» — как в основном Огоньке: сегодня | следующий, «Отменить», загорается огонёк
function confTodayBlock(){
  const r=confRead(),t=today(),groups=confPlan().filter(d=>!d.past).map(d=>d.units).filter(g=>g.length);
  const doneG=g=>g.every(u=>r.has(u.i));
  const todayLog=confSt().log.filter(x=>x.d===t);
  const g0=groups[0]||[],lit=g0.length?doneG(g0):todayLog.length>0;
  const nextG=groups.slice(1).find(g=>!doneG(g));
  const readTodayGroups=groups.filter((g,i)=>i>0&&doneG(g)&&g.every(u=>todayLog.some(x=>x.u===u.i))).length+(lit&&g0.length?1:0);
  const card=el("div","tcard confread"),head=el("div","thead");
  const fl=confFlame("flame"+(lit?"":" off"));fl.id="confFlame";
  const hb=el("div","tht");const sk=confStreak();hb.append(el("b",null,"Чтение на сегодня"),el("span",null,"· "+sk+" "+plural(sk,"день подряд","дня подряд","дней подряд")));
  if(readTodayGroups>0){const mm=el("div","minis");mm.id="confMinis";for(let i=0;i<Math.min(8,readTodayGroups);i++)mm.append(confFlame("flame mini"));hb.append(mm)}
  head.append(fl,hb);card.append(head);
  const link=(cls,label,g,sub)=>{const refs=confRefs(g),a=el("a",cls);a.href=refs[0].url;a.target="_blank";a.rel="noopener";a.append(el("span","label",label));
    refs.forEach(x=>a.append(el("span","name",x.text)));a.append(el("span","sub",sub||refs.map(x=>x.note).join(" · ")));return a};
  const cols=el("div","tcols"),left=el("div","tcol"),right=el("div","tcol");
  const qMsg=g=>{const k=CONF_Q.filter(q=>g.some(u=>u.i===q.u)).length;return k?"Открыто вопросов: "+k:"Отрывок отмечен"};
  const mark=(g,flameEl,lvl)=>{confMark(g,true);if(flameEl)flameEl.classList.remove("off");ignite(flameEl,lvl);toast(qMsg(g));if(confRead().size===CONF_UNITS.length){confConfetti();toast("Всё прочитано — вы готовы к конференции!")}setTimeout(confRenderCard,850)};
  if(g0.length){
    left.append(link("tlink",lit?"Прочитано сегодня":"Сегодня",g0));
    const btn=el("button","tbtn");btn.type="button";
    if(lit){btn.textContent="Прочитано ✓";btn.classList.add("done");btn.disabled=true}
    else{btn.textContent="Прочитал(а)";btn.classList.add("nudge");confirmTap(btn,"Нажмите ещё раз",()=>mark(g0,fl,1))}
    left.append(btn);
  }else{const d=el("div","tlink");d.append(el("span","label","Сегодня"),el("span","name","Всё прочитано"),el("span","sub","Загляните в вопросы и игры"));left.append(d)}
  if(lit&&todayLog.length){const u=el("button","linkbtn undolink","Отменить");u.type="button";u.addEventListener("click",()=>{
      const c=confSt(),last=c.log.filter(x=>x.d===t).pop(),g=groups.find(g=>g.some(x=>x.i===last.u))||[CONF_UNITS[last.u]];
      confMark(g,false);toast("Отметка отменена");confRenderCard()});left.append(u)}
  if(lit&&nextG){
    const box=el("div","nextbox");box.append(link("nextlink","Следующий",nextG));
    const b2=el("button","tbtn nextmark");b2.type="button";b2.innerHTML='<svg viewBox="0 0 64 80" aria-hidden="true">'+FLAME+'</svg>';b2.append(document.createTextNode("Прочитал(а)"));
    confirmTap(b2,"Нажмите ещё раз",()=>{const ms=document.querySelectorAll("#confMinis .mini");mark(nextG,ms[ms.length-1]||fl,1)});
    box.append(b2,el("span","frzhint","можно заранее"));right.append(box);
  }else if(!lit&&groups[1])right.append(link("nextlink later","Потом",groups[1]));
  else if(!nextG){const d=el("div","cdone");d.append(el("span",null,"🎉"),el("div",null,"Всё прочитано! Вы готовы к конференции."));right.append(d)}
  cols.append(left,right);card.append(cols);return card;
}
function confTabDot(){const nav=$("appTabs");if(!nav||appMode()==="conf")return;const b=nav.querySelectorAll(".apptab")[1];if(!b)return;const c=confSt(),t=today();
  const need=!c.joined||!c.log.some(x=>x.d===t)||(NET&&myTeams().some(x=>{const d=TEAMS[x.code];return d&&d.g&&d.g.status==="play"&&tCur(d.g)===NET.uid}))||TINV.length>0;
  const dot=b.querySelector(".atdot");if(need&&!dot)b.append(el("em","atdot"));if(!need&&dot)dot.remove()}
function confJoin(){state.planChosen=true;const c=confSt();const tt=tracks();if(!tt.conf){state.tracks=Object.assign(tt,{conf:true});try{localStorage.setItem("ogonek-app-mode","conf")}catch(e){}}if(!c.joined){c.joined=today();c.hide=false}save();try{applyAppMode()}catch(e){confRenderCard()}}

/* лист конференции: Чтение · Вопросы · Игры */
function openConf(tab,teamCode){
  const arch=confClosed();
  const modal=el("div","fmodal"),sheet=el("div","fsheet csheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label",CONF.name);
  const close=()=>{teamView=null;modal.remove();document.removeEventListener("keydown",esc);confRenderCard()};const esc=e=>{if(e.key==="Escape")close()};
  modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
  modal.append(sheet);document.body.append(modal);
  let cur=tab||"read";
  function draw(){
    sheet.textContent="";
    const h=el("div","fhead");h.insertAdjacentHTML("afterbegin",mountSvg);const ht=el("div");ht.style.minWidth="0";
    ht.append(el("h2",null,CONF.name),el("div","csub",CONF.dates));h.append(ht);
    const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);h.append(x);sheet.append(h);
    const info=el("div","cinfo");
    if(arch)info.append(el("span",null,"🗄 В архиве · закрыто 28 октября"));
    else{const n=confDaysLeft();info.append(el("span",null,"⏳ "+n+" "+plural(n,"день","дня","дней")+" до 28 октября"))}
    info.append(el("span",null,"📖 Исход 19–20 · Псалом 119"));const st=el("span","cstars","⭐ "+confStars());info.append(st);sheet.append(info);
    const tabs=el("div","ctabs");[["read","Чтение"],["quiz","Вопросы"],["games","Игры"]].forEach(([k,l])=>{const b=el("button","ctab"+(k===cur?" on":""),l);b.type="button";
      if(k==="quiz"&&!arch){const nq=confNewQ();if(nq){b.append(" ");b.append(el("span","cnew",String(nq)))}}
      b.addEventListener("click",()=>{cur=k;draw();sheet.scrollTop=0});tabs.append(b)});sheet.append(tabs);
    const body=el("div","gstage");sheet.append(body);
    if(cur==="read")drawRead(body);else if(cur==="quiz")drawQuiz(body);else drawGames(body);
  }
  function drawRead(body){
    const c=confSt(),r=confRead();
    if(arch){
      const k=CONF_UNITS.filter(u=>r.has(u.i)).reduce((s,u)=>s+u.w,0);
      const a=el("div","carch");a.innerHTML="Это расписание было открыто до <b>28 октября</b> — накануне конференции. "+(c.joined?"Вы прочитали <b>"+Math.round(k/CONF_VERSES*100)+"%</b> ("+k+" из "+CONF_VERSES+" стихов) и собрали <b>"+confStars()+" ⭐</b>.":"Вы к нему не присоединялись.");body.append(a);
      const days=el("div","cdays");CONF_UNITS.forEach(u=>{});
      confRefs(CONF_UNITS).forEach(x=>{});
      // в архиве — все части с отметками, без кнопок
      CONF_UNITS.reduce((g,u)=>{const key=u.b==="Пс."?"s"+u.st:"x"+u.i;const last=g[g.length-1];if(last&&last.key===key)last.us.push(u);else g.push({key,us:[u]});return g},[]).forEach(g=>{
        const row=el("div","cday"+(g.us.every(u=>r.has(u.i))?"":" past"));const ref=confRefs(g.us)[0];
        row.append(el("span","cd",g.us.every(u=>r.has(u.i))?"прочитано":"—"));const rs=el("div","crefs");const a2=el("a",null,ref.text);a2.href=ref.url;a2.target="_blank";a2.rel="noopener";rs.append(a2,el("em",null,ref.note));row.append(rs);
        const ck=el("button","cchk"+(g.us.every(u=>r.has(u.i))?" on":""),"✓");ck.disabled=true;row.append(ck);days.append(row)});
      body.append(days);return;
    }
    if(!c.joined){
      const n=confDaysLeft(),per=Math.round(CONF_VERSES/Math.max(1,Math.min(n,CONF_UNITS.length)));
      const j=el("div","cjoin");j.append(el("b",null,"Прочитаем вместе к конференции"),
        el("p","cnote","Исход 19 и 20 — Бог встречается с народом у горы Синай и даёт Десять заповедей. Псалом 119 — самая длинная глава Библии: 176 стихов о любви к слову Божьему, 22 строфы по буквам еврейского алфавита."),
        el("p","cnote","Если начать сегодня: "+n+" "+plural(n,"день","дня","дней")+" примерно по "+per+" "+plural(per,"стиху","стиха","стихов")+" в день. Расписание считается от дня, когда вы присоединились, и всегда заканчивается 28 октября."));
      const b=el("button","cbtn","Присоединиться");b.type="button";b.addEventListener("click",()=>{confJoin();draw()});j.append(b);body.append(j);return;
    }
    const days=confPlan(),t=today();
    body.append(el("p","cnote","Нажмите на отрывок, чтобы открыть его, и на кружок, чтобы отметить. Пропустили день — оставшееся снова поровну разложится на оставшиеся дни до 28 октября."));
    const list=el("div","cdays");
    days.forEach(day=>{
      if(day.past&&!day.units.length)return;
      const row=el("div","cday"+(day.now?" now":"")+(day.past?" past":""));
      const dl=parse(day.d).toLocaleDateString("ru-RU",{weekday:"short",day:"numeric",month:"short"});
      row.append(el("span","cd",day.now?"Сегодня\n"+dl:dl));row.lastChild.style.whiteSpace="pre-line";
      const rs=el("div","crefs");confRefs(day.units).forEach(x=>{const a=el("a",null,x.text);a.href=x.url;a.target="_blank";a.rel="noopener";rs.append(a,el("em",null,x.note+" · "+x.verses+" ст."))});row.append(rs);
      const on=day.units.every(u=>r.has(u.i));const ck=el("button","cchk"+(on?" on":""),"✓");ck.type="button";ck.setAttribute("aria-label",on?"Снять отметку":"Отметить прочитанным");
      if(day.past)ck.disabled=true;
      else ck.addEventListener("click",()=>{confMark(day.units,!on);if(!on){const k=CONF_Q.filter(q=>day.units.some(u=>u.i===q.u)).length;if(k)toast("Открыто вопросов: "+k);if(confRead().size===CONF_UNITS.length){confConfetti();toast("Всё прочитано — вы готовы к конференции!")}}draw()});
      row.append(ck);list.append(row);
    });
    body.append(list);
  }
  function drawQuiz(body){
    const c=confSt(),r=confRead(),open=confUnlocked(),todo=open.filter(q=>!(q.id in c.q));
    const right=Object.values(c.q).filter(x=>x===1).length,ans=Object.keys(c.q).length;
    body.append(el("p","cnote","Вопросы открываются, когда вы отмечаете отрывок прочитанным. За каждый верный ответ — ⭐. Отвечено: "+ans+" из "+CONF_Q.length+", верно: "+right+"."));
    if(!arch&&todo.length){
      const q=todo[0],box=el("div","cq qin");box.append(el("span","qref",q.at),el("div","qtext",q.q));
      const opts=el("div","qopts");const order=q.opts.map((t,i)=>({t,i})).sort(()=>Math.random()-.5);
      order.forEach(o=>{const b=el("button","qopt");b.type="button";b.append(el("span",null,o.t),el("span","qmark"));b.addEventListener("click",()=>{
        if(q.id in c.q)return;const ok=o.i===0;c.q[q.id]=ok?1:0;save();
        opts.querySelectorAll("button").forEach((x,k)=>{x.disabled=true;if(order[k].i===0)x.classList.add("right")});if(!ok)b.classList.add("wrong");
        box.classList.add(ok?"flash-ok":"shake");sheet.querySelectorAll(".cinfo .cstars").forEach(x=>x.textContent="⭐ "+confStars());const v=el("div","qverdict "+(ok?"ok":"no"),ok?"Верно! +1 ⭐":"Не совсем");box.append(v);
        const why=el("div","cwhy");const u=CONF_UNITS[q.u],a=el("a",null,"Посмотреть "+q.at);a.href=BIBLE+SLUG[u.b]+"/"+q.c+"/"+q.v;a.target="_blank";a.rel="noopener";why.append(a);box.append(why);
        const nx=el("button","cbtn",todo.length>1?"Следующий вопрос":"Готово");nx.type="button";nx.addEventListener("click",()=>{draw()});box.append(nx);
        if(ok&&todo.length===1&&ans+1===CONF_Q.length)confConfetti();
      });opts.append(b)});
      box.append(opts);body.append(box,el("div","cqmore","Ещё открыто: "+(todo.length-1)));
    }else if(!arch){
      const lk=el("div","cqlock");lk.append(el("span",null,"🔒"),el("span",null,r.size===CONF_UNITS.length?"Вы ответили на все вопросы! Попробуйте игры.":"Новые вопросы откроются, когда вы прочитаете следующий отрывок."));body.append(lk);
    }
    const done=CONF_Q.filter(q=>q.id in c.q);
    if(done.length){const l=el("div","cqlist");done.forEach(q=>{const d=el("div");d.append(el("i",c.q[q.id]?"ok":"no",c.q[q.id]?"✓":"✗"),el("span",null,q.at+" — "+q.q+" "),el("b",null,q.opts[0]));l.append(d)});
      const det=el("details","pacetable");det.append(el("summary",null,"Мои ответы ("+done.length+")"),l);body.append(det)}
    if(arch&&!done.length)body.append(el("div","carch","Расписание закрыто. Вопросы были доступны до 28 октября."));
  }
  function drawGames(body){
    const r=confRead(),c=confSt();
    if(arch){body.append(el("div","carch","Игры были доступны до 28 октября. "+(Object.keys(c.g).length?"Ваши результаты: "+Object.entries(c.g).map(([k,g])=>({tab:"«Скрижали»",mem:"«Найди пару»",team:"«Восхождение на Синай»"}[k]||k)+" — побед: "+(g.w||0)).join(", ")+".":"")));return}
    const tabOpen=TEN_UNITS.every(i=>r.has(i)),memOpen=MEM_SETS.some(m=>memSetOpen(m,r));
    body.append(el("p","cnote","За первую победу в каждой игре за день — +2 ⭐. «Скрижали» и «Найди пару» открываются по мере чтения."));
    onlineSection(body);
    const g=el("div","cgames");
    const mk=(icon,name,desc,on,go)=>{const b=el("button","cgame");b.type="button";b.disabled=!on;b.append(el("span","gi",icon),el("b",null,name),el("span",null,desc));if(on)b.addEventListener("click",go);return b};
    const tg=c.g.tab||{},mg=c.g.mem||{};
    const tl=TAB_LIMIT-tabToday();
    g.append(mk("🪨","Скрижали",!tabOpen?"Откроется после Исх. 20:1–17":tl>0?"Соберите Десять заповедей по порядку · +"+TAB_STARS+" ⭐ за сборку, сегодня осталось "+tl+(tg.best?" · рекорд "+tg.best+" с":""):"Сегодня скрижали собраны дважды — завтра снова можно",tabOpen&&tl>0,()=>gameTablets(body)),
      mk("🕊️","Найди пару",memOpen?"Стих ↔ о чём он: по строфам Псалма 119 и по Исходу"+(mg.best?" · рекорд "+mg.best+" ходов":""):"Откроется, когда прочитаете первую строфу или главу",memOpen,()=>gameMemory(body)));
    body.append(g);
  }
  function award(key,val,better){const c=confSt(),g=c.g[key]=c.g[key]||{w:0,days:[]};g.w++;const first=!g.days.includes(today());if(first)g.days.push(today());
    const rec=!g.best||better(val,g.best);if(rec)g.best=val;save();return {first,rec}}
  function winBox(body,emoji,title,sub,again){const w=el("div","gwin");w.append(el("span","gw",emoji),el("b",null,title),el("span","cnote",sub));
    const row=el("div","crow");const a=el("button","btn",again?"Ещё раз":"Завтра снова");a.type="button";if(again)a.addEventListener("click",again);else a.disabled=true;const bk=el("button","btn","К играм");bk.type="button";bk.addEventListener("click",()=>{cur="games";draw()});row.append(a,bk);w.append(row);body.append(w);confConfetti()}
  /* онлайн-раздел во вкладке «Игры»: приглашения, мои команды, создать / войти по коду */
  function onlineSection(body){
    const sec=el("div","tonline");sec.append(el("div","tsech"));sec.lastChild.innerHTML="<span>⛰️</span><div><b>Восхождение на Синай</b><i>Вместе с 1–2 друзьями, каждый со своего телефона. Общая цель — 12 ступеней к вершине, итог общий.</i></div>";
    if(!NET){
      const login=$("loginTop"),can=login&&!login.hidden;
      sec.append(el("p","cnote",can?"Войдите, чтобы пригласить друга и восходить вместе.":"Восхождение с друзьями работает на сайте Огонька после входа через Google."));
      if(can){const b=el("button","cbtn","Войти и пригласить друга");b.type="button";b.addEventListener("click",()=>{close();login.click()});sec.append(b)}
      body.append(sec);return;
    }
    TINV.forEach(i=>{const row=el("div","tinv");row.append(el("span",null,"✉️ "+i.name.split(" ")[0]+" зовёт вас в команду «"+i.tname+"»"));
      const y=el("button","btn","Принять");y.type="button";y.addEventListener("click",async()=>{y.disabled=true;if(await confJoinTeam(i.team))openTeam(i.team);else y.disabled=false});
      const n=el("button","linkbtn","Отклонить");n.type="button";n.addEventListener("click",()=>{NET.dropInvite(i.team);TINV=TINV.filter(x=>x!==i);draw()});
      const r2=el("div","crow");r2.append(y,n);row.append(r2);sec.append(row)});
    const L=myTeams();
    L.forEach(t=>{const d=TEAMS[t.code];const b=el("button","tcard2");b.type="button";
      const av=el("span","tavs");((d&&d.members)||[]).forEach(u=>{const a=el("i",null,tName(d,u).charAt(0).toUpperCase());a.style.background=tColor(d,u);if(((d.read||{})[u]||{}).d===today())a.classList.add("lit");av.append(a)});
      const tx=el("span","ttx");tx.append(el("b",null,(d&&d.name)||t.name));
      const g=(d&&d.g)||{};let st="загрузка…";if(d){st=g.status==="play"?(tCur(g)===NET.uid?"ваш ход!":"ходит "+tName(d,tCur(g))+" · ступень "+g.steps+"/"+T_GOAL):(d.members||[]).length<2?"ждём друзей · код "+t.code:"можно начинать восхождение"}
      tx.append(el("span",null,st));b.append(av,tx);if(g.status==="play"&&tCur(g)===NET.uid)b.append(el("span","cnew","!"));
      b.addEventListener("click",()=>openTeam(t.code));sec.append(b)});
    const nb=el("button","cbtn",L.length?"＋ Новое восхождение с другом":"Пригласить друга");nb.type="button";
    nb.addEventListener("click",async()=>{nb.disabled=true;const code=await confCreateTeam("");nb.disabled=false;if(code)openTeam(code)});
    const row=el("details","tjoin");row.append(el("summary",null,"Есть код от друга?"));
    const ci=el("input");ci.placeholder="Например, K7M2QX";ci.maxLength=8;ci.autocapitalize="characters";ci.spellcheck=false;
    const jb=el("button","btn","Присоединиться");jb.type="button";jb.addEventListener("click",async()=>{jb.disabled=true;if(await confJoinTeam(ci.value))openTeam(ci.value.toUpperCase().replace(/[^A-Z0-9]/g,""));jb.disabled=false});
    const r2=el("div","tjrow");r2.append(ci,jb);row.append(r2);
    if(L.length<3)sec.append(nb);
    sec.append(row);body.append(sec);
  }
  function stopTeamView(){teamView=null}
  function openTeam(code){
    cur="games";const box=el("div","gstage");
    teamView={code,redraw:()=>{if(teamView&&teamView.code===code&&box.isConnected){const y=sheet.scrollTop;box.textContent="";teamScreen(box,code);sheet.scrollTop=y}}};
    sheet.querySelectorAll(".ctab").forEach(t=>t.classList.toggle("on",t.textContent.startsWith("Игры")));
    const old=sheet.querySelector(".gstage");old.replaceWith(box);teamSub(code);teamScreen(box,code);
  }
  function teamScreen(body,code){
    const d=TEAMS[code],me=NET&&NET.uid;
    const back=el("button","linkbtn chide","← К играм");back.type="button";back.addEventListener("click",()=>{stopTeamView();cur="games";draw()});
    if(!NET){body.append(el("p","cnote","Войдите, чтобы играть онлайн."),back);return}
    if(!d){body.append(el("p","cnote",TEAMS[code]===null?"Команда не найдена или вы из неё вышли.":"Загружаем команду…"),back);return}
    const g=d.g||{},mem=d.members||[];
    // шапка команды
    const hd=el("div","thead2");hd.append(el("b",null,"«"+d.name+"»"));const cd=el("button","tcode","Код "+code+" · скопировать приглашение");cd.type="button";
    cd.addEventListener("click",()=>{const url=location.origin+location.pathname.replace(/[^/]*$/,"")+"sinai.html?team="+code,txt="Играем вместе в «Восхождение на Синай» к конференции! Команда «"+d.name+"», код "+code+": "+url;
      if(navigator.share){navigator.share({text:txt}).catch(()=>{})}else{try{navigator.clipboard.writeText(txt);toast("Приглашение скопировано")}catch(e){toast("Код команды: "+code)}}});
    hd.append(cd);body.append(hd);
    // участники и их чтение сегодня — общий огонёк команды
    const ms=el("div","tmembers");let lit=0;
    mem.forEach(u=>{const r=(d.read||{})[u]||{},on=r.d===today();if(on)lit++;const m=el("div","tmem"+(on?" lit":""));m.style.setProperty("--pc",tColor(d,u));
      const fl=confFlame("flame"+(on?"":" off"));m.append(fl,el("b",null,tName(d,u)+(u===me?" (вы)":"")),el("span",null,(r.pct||0)+"% · "+(r.st||0)+" "+plural(r.st||0,"день","дня","дней")));ms.append(m)});
    body.append(ms);
    const fire=el("div","tfire"+(lit===mem.length&&mem.length>1?" on":""));fire.textContent=lit===mem.length&&mem.length>1?"🔥 Сегодня прочитала вся команда — общий огонёк горит!":"Общий огонёк загорится, когда прочитают все: сегодня "+lit+" из "+mem.length;body.append(fire);
    // позвать друзей
    if(mem.length<3){const fr=NET.friends().filter(f=>!mem.includes(f.uid));const inv=el("details","pacetable tinvite");inv.open=mem.length<2;
      inv.append(el("summary",null,mem.length<2?"Пригласить друга":"Пригласить ещё одного друга"));
      if(!fr.length)inv.append(el("p","cnote","Пока некого позвать из друзей Огонька. Отправьте другу приглашение — кнопка «Код … · скопировать приглашение» выше."));
      fr.forEach(f=>{const r=el("div","tfr");r.append(el("span",null,f.name));const b=el("button","btn","Позвать");b.type="button";
        b.addEventListener("click",()=>{b.disabled=true;NET.invite(f.uid,code,d.name).then(()=>{b.textContent="Позвали ✓";teamPost(code,"✉️ Позвал(а) "+f.name.split(" ")[0],1)}).catch(e=>{console.warn(e);b.disabled=false;toast("Не получилось позвать")})});r.append(b);inv.append(r)});
      body.append(inv)}
    // игра
    const game=el("div","tgame");body.append(game);
    if(g.status!=="play")lobby(game,d,code);else playOnline(game,d,code);
    // лента команды: ободрения и события
    const fd=el("div","tfeed");fd.append(el("div","label","Лента команды"));
    const qb=el("div","tquick");T_CHEERS.forEach(t=>{const b=el("button","tile",t);b.type="button";b.addEventListener("click",()=>{b.disabled=true;teamPost(code,t).then(()=>toast("Отправлено команде"))});qb.append(b)});fd.append(qb);
    (d.feed||[]).slice(-12).reverse().forEach(f=>{const r=el("div","tfi"+(f.sys?" sys":""));r.style.setProperty("--pc",tColor(d,f.u));r.append(el("b",null,f.n),el("span",null,f.t),el("i",null,tAgo(f.at)));fd.append(r)});
    body.append(fd);
    const lv=el("button","linkbtn chide","Выйти из команды");lv.type="button";lv.addEventListener("click",()=>{if(lv.dataset.armed){NET.act(code,x=>({members:(x.members||[]).filter(u=>u!==me),
      feed:(x.feed||[]).concat([{u:me,n:NET.name().split(" ")[0],t:"👋 Вышел(ла) из команды",at:Date.now(),sys:1}]).slice(-30)})).then(()=>{confTeamDrop(code);stopTeamView();cur="games";draw()}).catch(e=>{console.warn(e);toast("Не получилось выйти")});return}
      lv.dataset.armed="1";lv.textContent="Точно выйти? Нажмите ещё раз"});
    body.append(back,lv);
  }
  function tAgo(at){if(!at)return "";const m=Math.round((Date.now()-at)/60000);if(m<1)return "сейчас";if(m<60)return m+" мин";const h=Math.round(m/60);if(h<24)return h+" ч";const dd=Math.round(h/24);return dd+" "+plural(dd,"день","дня","дней")}
  function tHud(d,g){
    const h=el("div","thud");const ord=g.order||[];
    h.innerHTML='<svg viewBox="0 0 320 120" class="tmount" aria-hidden="true"><path d="M8 116 L160 10 L312 116Z" fill="color-mix(in srgb,#2f8f6b 75%,var(--surface))"/><path d="M160 10 L182 26 L170 24 L160 32 L150 24 L138 26Z" fill="#fff" opacity=".85"/>'+
      Array.from({length:T_GOAL+1},(_,i)=>{const x=20+i*(140/T_GOAL),y=112-i*(98/T_GOAL);return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(i===T_GOAL?6:3.5)+'" fill="'+(i<=g.steps?"#ffc53d":"rgba(255,255,255,.55)")+'"/>'}).join("")+
      ord.map((u,i)=>{const s=Math.min(g.steps||0,T_GOAL),x=20+s*(140/T_GOAL)-8+i*8,y=112-s*(98/T_GOAL)-12;return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="6.5" fill="'+tColor(d,u)+'" stroke="#fff" stroke-width="2"/><text x="'+x.toFixed(1)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="middle" font-size="8" font-weight="800" fill="#fff">'+tName(d,u).charAt(0).toUpperCase().replace(/[<&]/g,"")+'</text>'}).join("")+'</svg>';
    const st=el("div","tstat");st.innerHTML="<span>Ступени <b>"+Math.min(g.steps||0,T_GOAL)+"/"+T_GOAL+"</b></span><span>"+("🪔".repeat(Math.max(0,g.lamps))||"—")+"<i>"+"·".repeat(3-Math.max(0,g.lamps))+"</i></span><span>Подсказки <b>"+g.hints+"</b></span>";h.append(st);return h}
  function lobby(game,d,code){
    const mem=d.members||[],g=d.g||{};
    if(g.status==="done"){const top=g.steps>=T_GOAL;game.append(tHud(d,g));const w=el("div","gwin");w.append(el("span","gw",top?"⛰️":"☁️"),el("b",null,top?"Команда на вершине!":"Облако закрыло путь"),
      el("span","cnote","Общий итог: "+Math.min(g.steps,T_GOAL)+" из "+T_GOAL+" ступеней · 🪔 "+Math.max(0,g.lamps)+" из 3"),el("span","tteam",(g.order||[]).map(u=>tName(d,u)).join(" · ")));game.append(w)}
    else game.append(el("div","tintro2","⛰️ Восхождение на Синай: вместе поднимитесь на 12 ступеней. Ход переходит по кругу — каждый отвечает со своего телефона. Общие 3 светильника и 2 подсказки. В свой ход можно попросить совета у команды."));
    if(mem.length<2){game.append(el("p","cnote","Пригласите друга — как только он примет приглашение, можно начинать восхождение."));return}
    const b=el("button","cbtn",g.status==="done"?"Новое восхождение":"Начать восхождение");b.type="button";
    b.addEventListener("click",()=>{b.disabled=true;NET.act(code,x=>{if((x.g||{}).status==="play")return null;const ord=sshuf(x.members,Math.random);
      return {g:{status:"play",seed:Math.floor(Math.random()*1e9),order:ord,turn:0,round:0,steps:0,lamps:3,hints:2,k:0,picked:[],removed:[],asked:{},sug:{},ans:null,done:false,t0:Date.now()},
        feed:(x.feed||[]).concat([{u:NET.uid,n:NET.name().split(" ")[0],t:"⛰️ Начинаем восхождение! Первым ходит "+tName(x,ord[0]),at:Date.now(),sys:1}]).slice(-30)}}).catch(e=>{console.warn(e);toast("Не получилось начать");b.disabled=false})});
    game.append(b);
    if(d.hist&&d.hist.length){const h=el("details","pacetable");h.append(el("summary",null,"Прошлые восхождения ("+d.hist.length+")"));const l=el("div","cqlist");
      d.hist.slice().reverse().forEach(x=>{const r=el("div");r.append(el("i",x.top?"ok":"no",x.top?"⛰":"☁"),el("span",null,x.names+" — "+x.steps+" из "+T_GOAL+", 🪔 "+x.lamps));l.append(r)});h.append(l);game.append(h)}
  }
  // действие в свой ход: транзакция проверяет, что раунд и ход не изменились
  function tAct(code,g0,fn,turnOnly){return NET.act(code,x=>{const g=JSON.parse(JSON.stringify(x.g||{}));if(g.status!=="play"||g.round!==g0.round)return null;if(turnOnly!==false&&tCur(g)!==NET.uid)return null;const ev=fn(g,x);if(ev===false)return null;
      const patch={g};const feed=(x.feed||[]).slice();if(ev)feed.push({u:NET.uid,n:NET.name().split(" ")[0],t:ev,at:Date.now(),sys:1});
      if(g.done&&(g.steps>=T_GOAL||g.lamps<=0)){g.status="done";const top=g.steps>=T_GOAL;feed.push({u:NET.uid,n:"Команда",t:top?"🎉 Мы на вершине! "+T_GOAL+" ступеней, 🪔 "+g.lamps:"☁️ Облако закрыло путь на ступени "+g.steps+". Попробуем ещё!",at:Date.now()+1,sys:1});
        patch.hist=(x.hist||[]).concat([{names:g.order.map(u=>tName(x,u)).join(", "),steps:Math.min(g.steps,T_GOAL),lamps:Math.max(0,g.lamps),top,d:today()}]).slice(-10)}
      patch.feed=feed.slice(-30);return patch}).catch(e=>{console.warn(e);toast("Не удалось сохранить ход. Проверьте интернет.")})}
  function nextRound(code,g0){return tAct(code,g0,g=>{if(!g.done)return false;g.round++;g.k=0;g.picked=[];g.removed=[];g.sug={};g.ans=null;g.done=false;return ""},false)}
  function playOnline(game,d,code){
    const g=d.g,R=teamRound(g,g.round),cu=tCur(g),mine=cu===NET.uid,me=NET.uid;
    game.append(tHud(d,g));
    const tw=el("div","tturn");tw.style.setProperty("--pc",tColor(d,cu));tw.innerHTML="<b>"+(mine?"Ваш ход!":tName(d,cu).replace(/[<&]/g,""))+"</b><span>"+(mine?"":"ходит сейчас")+"</span>";game.append(tw);
    if(!mine&&!g.done){const nb=el("button","btn tnudge","💪 Подбодрить "+tName(d,cu));nb.type="button";nb.addEventListener("click",()=>{nb.disabled=true;teamPost(code,"💪 "+tName(d,cu)+", твой ход — мы ждём!").then(()=>toast("Отправлено"))});tw.append(nb)}
    const nextBtn=()=>{const nx=el("button","cbtn",(g.steps>=T_GOAL||g.lamps<=0)?"Итог":"Дальше");nx.type="button";nx.addEventListener("click",()=>{nx.disabled=true;nextRound(code,g)});return nx};
    if(R.kind==="q"){
      const q=R.q,box=el("div","cq");box.append(el("span","qref",q.at),el("div","qtext",q.q));const opts=el("div","qopts");
      R.order.forEach(i=>{const b=el("button","qopt");b.type="button";const lab=el("span",null,q.opts[i]);b.append(lab,el("span","qmark"));
        const sugs=Object.entries(g.sug||{}).filter(([u,v])=>v===i&&u!==cu).map(([u])=>tName(d,u));if(sugs.length&&!g.ans)lab.append(el("small","tsug"," · советует "+sugs.join(", ")));
        if((g.removed||[]).includes(i)){b.disabled=true;b.style.opacity=".35"}
        if(g.ans){b.disabled=true;if(i===0)b.classList.add("right");if(g.ans.i===i&&!g.ans.ok)b.classList.add("wrong")}
        else if(mine)b.addEventListener("click",()=>{opts.querySelectorAll("button").forEach(x=>x.disabled=true);tAct(code,g,gg=>{const ok=i===0;gg.ans={i,ok};gg.done=true;if(ok)gg.steps++;else gg.lamps--;gg.turn++;
          return (ok?"✅ ответил(а) верно: +1 ступень":"❌ ошибся(лась): светильник погас")+" — «"+q.q.slice(0,50)+(q.q.length>50?"…":"")+"»"})});
        else if(g.asked&&g.asked[cu]){b.addEventListener("click",()=>{tAct(code,g,gg=>{gg.sug=gg.sug||{};gg.sug[me]=i;return ""},false).then(()=>toast("Совет отправлен"))})}
        else b.disabled=true;
        opts.append(b)});
      box.append(opts);game.append(box);
      if(g.ans){box.append(el("div","qverdict "+(g.ans.ok?"ok":"no"),g.ans.ok?"Верно! +1 ступень":"Светильник погас"));game.append(nextBtn())}
      else if(mine){const tools=el("div","ttools");
        const hb=el("button","btn","🪔 Подсказка ("+g.hints+")");hb.type="button";hb.disabled=!g.hints;hb.addEventListener("click",()=>{hb.disabled=true;tAct(code,g,gg=>{if(!gg.hints)return false;const w=R.order.find(i=>i!==0&&!(gg.removed||[]).includes(i));if(w==null)return false;gg.removed=(gg.removed||[]).concat([w]);gg.hints--;return "🪔 взял(а) подсказку"})});
        const ab=el("button","btn",g.asked&&g.asked[me]?"🙋 Ждём советов команды":"🙋 Спросить команду");ab.type="button";ab.disabled=!!(g.asked&&g.asked[me]);
        ab.addEventListener("click",()=>{ab.disabled=true;tAct(code,g,gg=>{gg.asked=gg.asked||{};if(gg.asked[me])return false;gg.asked[me]=true;return "🙋 просит совета: нажмите ответ, который считаете верным"})});
        tools.append(hb,ab);game.append(tools)}
      else if(g.asked&&g.asked[cu])game.append(el("p","cnote","🙋 "+tName(d,cu)+" просит совета — нажмите ответ, который считаете верным."));
      else game.append(el("p","cnote","Вопрос видят все. Отвечает "+tName(d,cu)+"."));
    }else if(R.kind==="order"){
      game.append(el("div","ttask","🤝 Командное задание · +2 ступени"),el("div","qtext",R.t),el("p","cnote","Каждый в свой ход ставит следующий пункт. Ошибка гасит светильник."));
      const ol=el("ol","tplaced");R.items.slice(0,g.k).forEach(t=>ol.append(el("li",null,t)));game.append(ol);
      if(g.done){game.append(el("div","gwin"));game.lastChild.append(el("span","gw","🤝"),el("b",null,g.k>=R.items.length?"Вместе справились! +2 ступени":"Светильники погасли"));game.append(nextBtn())}
      else{const pool=el("div","tiles");R.show.filter(x=>x.i>=g.k).forEach(x=>{const b=el("button","tile",x.t);b.type="button";b.disabled=!mine;
          if(mine)b.addEventListener("click",()=>{pool.querySelectorAll("button").forEach(z=>z.disabled=true);tAct(code,g,gg=>{if(x.i===gg.k){gg.k++;gg.turn++;if(gg.k>=R.items.length){gg.steps+=2;gg.done=true;return "🤝 поставил(а) последний пункт: +2 ступени"}return "✔️ поставил(а) пункт № "+gg.k}
            gg.lamps--;if(gg.lamps<=0)gg.done=true;return "❌ ошибся(лась) в порядке: светильник погас"})});pool.append(b)});game.append(pool);
        game.append(el("p","cnote",mine?"Выберите пункт № "+(g.k+1):"Сейчас выбирает "+tName(d,cu)+" — пункт № "+(g.k+1)))}
    }else{
      const found=(g.picked||[]).filter(i=>R.cells[i].ok).length;
      game.append(el("div","ttask","🤝 Командное задание · +2 ступени"),el("div","qtext","Каким Псалом 119 называет слово Божье и что оно делает?"),el("p","cnote","Найдите все "+R.need+" верных ответов, по одному в свой ход. Неверный гасит светильник. Найдено: "+found+" из "+R.need));
      const grid=el("div","twords");R.cells.forEach((c,i)=>{const b=el("button","tile",c.t);b.type="button";const was=(g.picked||[]).includes(i);if(was)b.classList.add(c.ok?"tok":"tno");b.disabled=!mine||was||g.done;
        if(mine&&!was&&!g.done)b.addEventListener("click",()=>{grid.querySelectorAll("button").forEach(z=>z.disabled=true);tAct(code,g,gg=>{if((gg.picked||[]).includes(i))return false;gg.picked=(gg.picked||[]).concat([i]);gg.turn++;
          if(c.ok){const f=gg.picked.filter(j=>R.cells[j].ok).length;if(f>=R.need){gg.steps+=2;gg.done=true;return "🪔 нашёл(ла) последний ответ: +2 ступени"}return "✔️ «"+c.t+"» — верно"}
          gg.lamps--;if(gg.lamps<=0)gg.done=true;return "❌ «"+c.t+"» — так Псалом не говорит"})});grid.append(b)});
      game.append(grid);if(g.done)game.append(nextBtn());else if(!mine)game.append(el("p","cnote","Сейчас выбирает "+tName(d,cu)+"."));
    }
  }
  function gameTablets(body){
    if(tabToday()>=TAB_LIMIT){cur="games";draw();toast("Сегодня скрижали уже собраны дважды — приходите завтра");return}
    body.textContent="";const t0=Date.now();let next=0,miss=0;
    const head=el("div","ghead");const hl=el("span",null,"Найдите заповедь № 1");const hm=el("span");hm.innerHTML="Ошибок: <b>0</b>";head.append(hl,hm);
    const tabs=el("div","tablets"),slots=[];[0,1].forEach(s=>{const tb=el("div","tablet");for(let i=s*5;i<s*5+5;i++){const sl=el("div","tslot");sl.append(el("i",null,String(i+1)));slots.push(sl);tb.append(sl)}tabs.append(tb)});
    const tiles=el("div","tiles");TEN.map((t,i)=>({t,i})).sort(()=>Math.random()-.5).forEach(o=>{const b=el("button","tile",o.t);b.type="button";b.addEventListener("click",()=>{
      if(b.dataset.busy)return;
      if(o.i===next){const sl=slots[next];next++;b.dataset.busy="1";b.classList.add("good");setTimeout(()=>{sl.append(o.t);sl.classList.add("fill");b.remove()},420);
        if(next===10)setTimeout(()=>{const sec=Math.round((Date.now()-t0)/1000);const a=award("tab",sec,(v,b2)=>v<b2);const cc=confSt().g.tab;cc.cnt=cc.cnt||{};Object.keys(cc.cnt).forEach(k=>{if(k<add(today(),-60))delete cc.cnt[k]});
          const n=(cc.cnt[today()]||0)+1;cc.cnt[today()]=n;save();tiles.remove();head.remove();const left=TAB_LIMIT-n;
          winBox(body,miss?"🪨":"🏆",miss?"Скрижали готовы!":"Без единой ошибки!",sec+" с, ошибок: "+miss+(a.rec?" · новый рекорд!":"")+(n<=TAB_LIMIT?" · +"+TAB_STARS+" ⭐":"")+(left>0?" · сегодня можно ещё "+left+" раз":" · следующая сборка — завтра"),left>0?()=>gameTablets(body):null);
          sheet.querySelectorAll(".cinfo .cstars").forEach(x=>x.textContent="⭐ "+confStars())},480);
        else hl.textContent="Найдите заповедь № "+(next+1);
      }else{miss++;hm.innerHTML="Ошибок: <b>"+miss+"</b>";b.classList.remove("bad");void b.offsetWidth;b.classList.add("bad");clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove("bad"),800)}
    });tiles.append(b)});
    const back=el("button","linkbtn chide","← К играм");back.type="button";back.addEventListener("click",()=>{cur="games";draw()});
    body.append(head,tabs,tiles,back);
  }
  function gameMemory(body){
    body.textContent="";const r=confRead(),c=confSt(),done=new Set(((c.g.mem||{}).sets)||[]);
    body.append(el("div","ghead"));body.lastChild.append(el("span",null,"Выберите отрывок: в каждом — пары «стих ↔ о чём он»"));
    const grid=el("div","msets");
    MEM_SETS.forEach(m=>{const on=memSetOpen(m,r),b=el("button","mset"+(done.has(m.id)?" done":""));b.type="button";b.disabled=!on;
      b.append(el("b",null,(done.has(m.id)?"✓ ":on?"":"🔒 ")+m.title),el("span",null,m.sub));if(on)b.addEventListener("click",()=>memRound(body,m));grid.append(b)});
    body.append(grid,el("p","cnote","Строфа откроется, когда вы прочитаете её. В Псалме 119 — 22 строфы по 8 стихов, каждая названа буквой еврейского алфавита."));
    const back=el("button","linkbtn chide","← К играм");back.type="button";back.addEventListener("click",()=>{cur="games";draw()});body.append(back);
  }
  function memRound(body,m){
    body.textContent="";const set=m.pairs.slice().sort(()=>Math.random()-.5).slice(0,4);let moves=0,got=0,openC=[],lock=false;
    const refOf=p=>(p[0]===119?"Пс. 119:":"Исх. "+p[0]+":")+p[1],urlOf=p=>BIBLE+(p[0]===119?"psa/119/":"exo/"+p[0]+"/")+p[1];
    const back=el("button","linkbtn chide","← Другой отрывок");back.type="button";back.addEventListener("click",()=>gameMemory(body));
    const head=el("div","ghead");const hl=el("span",null,m.title+" · "+m.sub);const hm=el("span");hm.innerHTML="Ходов: <b>0</b>";head.append(hl,hm);
    const grid=el("div","mem two"),found=el("div","mfound");
    set.flatMap((p,k)=>[{k,ref:true,p},{k,ref:false,p}]).sort(()=>Math.random()-.5).forEach(o=>{
      const b=el("button","mcard");b.type="button";b.setAttribute("aria-label","Карточка");const mi=el("span","mi");const f=el("span","mf","📜");
      const bk=el("span","mb"+(o.ref?" mref":""));if(o.ref){bk.append(el("b",null,refOf(o.p)))}else bk.textContent=o.p[2];
      mi.append(f,bk);b.append(mi);
      b.addEventListener("click",()=>{if(lock||b.classList.contains("open")||b.classList.contains("got"))return;b.classList.add("open");openC.push({b,o});
        if(openC.length===2){moves++;hm.innerHTML="Ходов: <b>"+moves+"</b>";const [x,y]=openC;openC=[];
          if(x.o.k===y.o.k&&x.o.ref!==y.o.ref){x.b.classList.add("got");y.b.classList.add("got");got++;
            const a=el("a","mfi");a.href=urlOf(x.o.p);a.target="_blank";a.rel="noopener";a.append(el("b",null,refOf(x.o.p)),el("span",null,x.o.p[2]),el("i",null,"Читать ›"));found.append(a);
            if(got===set.length){const cc=confSt(),g=cc.g.mem=cc.g.mem||{w:0,days:[]};g.sets=[...new Set((g.sets||[]).concat([m.id]))];
              const aw=award("mem",moves,(v,b2)=>v<b2);setTimeout(()=>{grid.remove();lab.remove();back.remove();winBox(body,"🕊️","Все пары найдены!","Ходов: "+moves+(aw.rec?" · новый рекорд!":"")+(aw.first?" · +2 ⭐":""),()=>memRound(body,m));body.append(found);
                const more=el("button","linkbtn chide","Выбрать другой отрывок");more.type="button";more.addEventListener("click",()=>gameMemory(body));body.append(more)},500)}}
          else{lock=true;setTimeout(()=>{x.b.classList.remove("open");y.b.classList.remove("open");lock=false},1100)}}});
      grid.append(b)});
    const lab=el("div","label","Найденные пары");body.append(head,grid,lab,found,back);
  }
  draw();
  if(teamCode&&NET)openTeam(teamCode);
}
// пункт в списке расписаний: до 28 октября — «Конференция», потом — «Архив»
function confPlanItems(closePlans){return [];
  const c=confSt(),arch=confClosed(),b=el("button","pitem confitem");b.type="button";
  const ic=el("span","cicon",arch?"🗄":"⛰️");const t=el("div","ptxt");
  const r=confRead(),pct=Math.round(CONF_UNITS.filter(u=>r.has(u.i)).reduce((s,u)=>s+u.w,0)/CONF_VERSES*100);
  t.append(el("b",null,CONF.name+" 2026"),el("span",null,arch?"Закрыто 28 октября · "+(c.joined?"прочитано "+pct+"%":"вы не участвовали"):"Исход 19–20 и Псалом 119 · до 28 октября · "+confDaysLeft()+" "+plural(confDaysLeft(),"день","дня","дней")));
  if(c.joined&&!arch)t.append(el("span","pdone","Прочитано "+pct+"% · ⭐ "+confStars()));
  b.append(ic,t);b.addEventListener("click",()=>{closePlans();openConf("read")});
  return [el("div","pgroup",arch?"Архив":"Особое расписание"),b];
}
/* ---------- Онлайн-команды «Восхождение на Синай»: 2–3 друга, каждый со своего телефона ----------
   Работает на сайте после входа: auth.js передаёт сюда NET (Firestore). Команда — документ teams/<КОД>.
   Игра пошаговая: ход переходит по кругу, общий итог на всю команду. В ленте команды — ободрения
   и события игры, у каждого участника видно, прочитал ли он сегодня (общий огонёк команды). */
let NET=null,TEAMS={},TSUB={},TINV=[],teamView=null,teamSeen={};
const T_GOAL=12,T_COLS=["#e8650a","#6b4fd8","#0e9aa7"];
const T_SEQ=["q","q","order","q","q","word","q","q","order","q","word","q","q","order","q","q"];
const T_TRUE=["Светильник моей ноге","Свет моей тропе","Слаще мёда","Лучше тысяч слитков золота и серебра","Истина","Утверждено на небе навеки","Оживляет","Очень чистое","Великий мир любящим его","Мои советники","Наделяет разумением простых","Праведно","Мои песни","Укрепляет"];
const T_FALSE=["Тяжёлое бремя","Устарело","Только для взрослых","Скучное","Горче полыни","Нужно лишь священникам","Забывается со временем","Тайна, которую нельзя понять"];
const T_ORDERS=[
  {t:"Расставьте события Исхода 19 по порядку",it:["Израиль приходит в пустыню Синай","Народ: «Всё, что сказал Иегова, исполним»","Народ освящается и омывает свои одежды","Громы, молнии и трубный звук на третий день","Моисей поднимается на вершину горы"]},
  {t:"Расставьте события Исхода 20:18–26 по порядку",it:["Народ видит громы и дымящуюся гору","Народ просит: «Ты говори с нами»","Моисей: «Не бойтесь»","Моисей приближается к мраку","Бог говорит о жертвеннике из земли"]},
  {t:"Расставьте заповеди по их номерам",it:null},
  {t:"Что было на третий день у горы Синай? Расставьте по порядку (Исх. 19:16–20)",it:["Громы, молнии и густое облако на горе","Моисей выводит народ из стана для встречи с Богом","Гора дымится: Иегова сошёл на неё в огне","Звук трубы становится всё сильнее","Иегова зовёт Моисея на вершину"]}];
const T_CHEERS=["💪 Твой ход — мы ждём!","📖 Прочитай сегодняшний отрывок!","🔥 Молодец, так держать!","🙏 Молюсь за тебя","⛰️ Вперёд, к вершине!","🎉 Ура, команда!"];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function sshuf(arr,rnd){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// содержимое раунда одинаково у всех участников: зависит только от seed и номера раунда
function teamRound(g,r){
  const kind=T_SEQ[r%T_SEQ.length],rnd=mulberry(g.seed*31+r*977+1);
  let c=0;for(let i=0;i<r;i++)if(T_SEQ[i%T_SEQ.length]===kind)c++;
  if(kind==="q"){const perm=sshuf(CONF_Q.map((_,i)=>i),mulberry(g.seed));const q=CONF_Q[perm[c%perm.length]];return {kind,q,order:sshuf([0,1,2],rnd)}}
  if(kind==="order"){const o=sshuf(T_ORDERS,mulberry(g.seed+5))[c%T_ORDERS.length];let items=o.it;
    if(!items){const ids=sshuf([...TEN.keys()],rnd).slice(0,5).sort((a,b)=>a-b);items=ids.map(i=>TEN[i])}
    return {kind,t:o.t,items,show:sshuf(items.map((t,i)=>({t,i})),rnd)}}
  const need=Math.max(4,g.order.length*2),tr=sshuf(T_TRUE,rnd).slice(0,need),fa=sshuf(T_FALSE,rnd).slice(0,3);
  return {kind,need,cells:sshuf(tr.map(t=>({t,ok:true})).concat(fa.map(t=>({t,ok:false}))),rnd)};
}
const tCur=g=>g&&g.order&&g.order.length?g.order[g.turn%g.order.length]:null;
const tName=(d,u)=>((d.names||{})[u]||"Игрок").split(" ")[0];
const tColor=(d,u)=>T_COLS[Math.max(0,(d.members||[]).indexOf(u))%3];
function myTeams(){const c=confSt();c.teams=c.teams||[];return c.teams}
function confTeamSave(code,name){const L=myTeams();const x=L.find(t=>t.code===code);if(x){if(name&&x.name!==name){x.name=name;save()}}else{L.push({code,name:name||code});save()}}
function confTeamDrop(code){const c=confSt();c.teams=myTeams().filter(t=>t.code!==code);save();if(TSUB[code]){TSUB[code]();delete TSUB[code]}delete TEAMS[code]}
function myPct(){const r=confRead();return Math.round(CONF_UNITS.filter(u=>r.has(u.i)).reduce((s,u)=>s+u.w,0)/CONF_VERSES*100)}
// моё чтение конференции — в каждую мою команду (видно друзьям)
function confPublishRead(){if(!NET)return;const t=today(),done=confSt().log.some(x=>x.d===t),mine={d:done?t:"",pct:myPct(),st:confStreak()};
  Object.entries(TEAMS).forEach(([code,d])=>{if(!d||!(d.members||[]).includes(NET.uid))return;const o=(d.read||{})[NET.uid]||{};
    if(o.d!==mine.d||o.pct!==mine.pct||o.st!==mine.st)NET.update(code,{["read."+NET.uid]:mine}).catch(e=>console.warn(e))})}
function teamSub(code){
  if(!NET||TSUB[code])return;
  TSUB[code]=NET.watch(code,d=>{
    const prev=TEAMS[code];TEAMS[code]=d;
    if(!d||!(d.members||[]).includes(NET.uid)){if(d===null||prev)confTeamDrop(code);confRenderCard();if(teamView&&teamView.code===code)teamView.redraw();return}
    confTeamSave(code,d.name);
    // ободрения и события от друзей — коротким сообщением
    const seen=teamSeen[code]||0,fresh=(d.feed||[]).filter(f=>f.at>seen&&f.u!==NET.uid);
    if(prev||!seen){const last=fresh[fresh.length-1];if(last&&(!teamView||teamView.code!==code))toast("«"+d.name+"» · "+last.n+": "+last.t)}
    teamSeen[code]=Math.max(seen,...(d.feed||[]).map(f=>f.at||0),0);try{localStorage.setItem("ogonek-team-seen",JSON.stringify(teamSeen))}catch(e){}
    const g=d.g||{};if(prev&&g.status==="play"&&tCur(g)===NET.uid&&tCur(prev.g||{})!==NET.uid&&(!teamView||teamView.code!==code))toast("⛰️ «"+d.name+"»: ваш ход!");
    if(!prev)confPublishRead();
    confRenderCard();if(teamView&&teamView.code===code)teamView.redraw();
  },()=>{});
}
window.confNet=function(net,joinCode){
  Object.values(TSUB).forEach(u=>u());TSUB={};TEAMS={};NET=net||null;TINV=[];
  try{teamSeen=JSON.parse(localStorage.getItem("ogonek-team-seen")||"{}")}catch(e){teamSeen={}}
  if(NET){myTeams().forEach(t=>teamSub(t.code));if(joinCode)confJoinTeam(joinCode,true)}
  confRenderCard();
};
window.confNet.invites=function(list){TINV=(list||[]).filter(i=>!myTeams().some(t=>t.code===i.team));confRenderCard();if(teamView&&teamView.code==="")teamView.redraw()};
async function confJoinTeam(code,open){
  code=String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(code.length!==6){toast("Код команды — 6 букв и цифр");return false}
  if(!NET){toast("Войдите, чтобы играть онлайн");return false}
  try{
    const d=await NET.get(code);if(!d){toast("Команда с таким кодом не найдена");return false}
    if(!(d.members||[]).includes(NET.uid)){
      if((d.members||[]).length>=3){toast("В команде уже трое");return false}
      await NET.act(code,x=>{if((x.members||[]).includes(NET.uid)||(x.members||[]).length>=3)return null;
        return {members:(x.members||[]).concat([NET.uid]),names:Object.assign({},x.names,{[NET.uid]:NET.name()}),photos:Object.assign({},x.photos,{[NET.uid]:NET.photo}),
          feed:(x.feed||[]).concat([{u:NET.uid,n:NET.name().split(" ")[0],t:"👋 Я в команде!",at:Date.now(),sys:1}]).slice(-30)}});
    }
    NET.dropInvite(code);confTeamSave(code,d.name);if(!tracks().conf)confJoin();teamSub(code);toast("Вы в команде «"+d.name+"»");
    if(open)openConf("games",code);return true;
  }catch(e){console.warn(e);toast("Не получилось войти в команду. Проверьте интернет.");return false}
}
async function confCreateTeam(name){
  name=(name||"").trim().slice(0,30)||"Восхождение "+NET.name().split(" ")[0];
  try{const code=await NET.create({name,names:{[NET.uid]:NET.name()},photos:{[NET.uid]:NET.photo},created:Date.now(),
      feed:[{u:NET.uid,n:NET.name().split(" ")[0],t:"⛰️ Создал(а) команду",at:Date.now(),sys:1}],read:{},hist:[],g:{status:"lobby"}});
    confTeamSave(code,name);teamSub(code);return code}
  catch(e){console.warn(e);toast("Не получилось создать команду. Проверьте интернет.");return null}
}
function teamPost(code,t,sys){if(!NET)return Promise.resolve();return NET.act(code,d=>({feed:(d.feed||[]).concat([{u:NET.uid,n:NET.name().split(" ")[0],t,at:Date.now(),sys:sys?1:0}]).slice(-30)})).catch(e=>{console.warn(e);toast("Не удалось отправить")})}
// полоска на главной: ваш ход / приглашения
function confTeamStrip(){
  if(!NET)return null;const box=el("div","tstrip");
  TINV.forEach(i=>{const b=el("button","tsitem inv");b.type="button";b.innerHTML="<span>✉️</span>";b.append(el("b",null,i.name.split(" ")[0]+" зовёт в команду «"+i.tname+"»"),el("i",null,"Открыть"));b.addEventListener("click",()=>openConf("games"));box.append(b)});
  myTeams().forEach(t=>{const d=TEAMS[t.code];if(!d)return;const g=d.g||{};const my=g.status==="play"&&tCur(g)===NET.uid;
    const all=(d.members||[]).length,rd=(d.members||[]).filter(u=>((d.read||{})[u]||{}).d===today()).length;
    if(!my&&rd===all)return;
    const b=el("button","tsitem"+(my?" turn":""));b.type="button";b.innerHTML="<span>"+(my?"⛰️":"📖")+"</span>";
    b.append(el("b",null,"«"+d.name+"»: "+(my?"ваш ход!":"сегодня прочитали "+rd+" из "+all)),el("i",null,"Открыть"));b.addEventListener("click",()=>openConf("games",t.code));box.append(b)});
  return box.childNodes.length?box:null;
}

/* ---------- Путь конференции: переключатель «Церковь | Конференция» ----------
   Узлы — Исход 19, Исход 20 и 22 строфы Псалма 119; на пути вы и друзья, которые читают к конференции.
   Позиция — по числу прочитанных частей (друзья публикуют её в профиле: summary().conf). */
function confSummary(){const c=confSt();if(!c.joined||noPlan())return null;const t=today();return {j:1,u:c.log.length,pct:myPct(),st:confStreak(),d:c.log.some(x=>x.d===t)?t:(c.log.length?c.log.map(x=>x.d).sort().pop():"")}}
const CP_ENDS=(()=>{let n=0;return MEM_SETS.map(m=>{n+=m.st!=null?2:m.units.length;return n})})(); // сколько частей прочитано к концу каждого узла
const cpNode=u=>{let k=0;while(k<CP_ENDS.length&&u>=CP_ENDS[k])k++;return k}; // 0..24 (24 — всё прочитано)
// вкладки наверху: «Церковь в Санкт-Петербурге» | «Конференция»
function appMode(){if(confClosed())return "spb";const t=tracks();if(!t.conf)return "spb";if(!t.spb)return "conf";return "spb"}
const pathModeConf=()=>appMode()==="conf";
function setAppMode(m){try{localStorage.setItem("ogonek-app-mode",m)}catch(e){}applyAppMode();pathFocusSoon();window.scrollTo({top:0,behavior:"smooth"})}
function applyAppMode(){
  const conf=appMode()==="conf",nav=$("appTabs");document.body.classList.toggle("mode-conf",conf);document.body.classList.toggle("no-spb",!tracks().spb);
  document.body.classList.toggle("with-conf",!conf&&tracks().conf&&!confClosed());
  if(nav){const tt=tracks();nav.hidden=true;nav.textContent="";
    const mk=(m,icon,t,sub)=>{const b=el("button","apptab"+((m==="conf")===conf?" on":""));b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",String((m==="conf")===conf));
      b.append(icoEl(icon));const tx=el("span","att");tx.append(el("b",null,t),el("i",null,sub));b.append(tx);b.addEventListener("click",()=>{if(appMode()!==m)setAppMode(m)});return b};
    const c=confSt(),t=today(),need=!c.joined||!c.log.some(x=>x.d===t)||(NET&&myTeams().some(x=>{const d=TEAMS[x.code];return d&&d.g&&d.g.status==="play"&&tCur(d.g)===NET.uid}))||TINV.length>0;
    const cb=mk("conf","peak","Челлендж","«Божья гора»");if(need&&!conf)cb.append(el("em","atdot"));
    nav.append(mk("spb","book","Основное расписание",SCHED.name),cb)}
  try{renderPath()}catch(e){}confRenderCard();try{renderChallenges()}catch(e){console.warn(e)}try{renderChPromo()}catch(e){console.warn(e)}try{applyPage()}catch(e){console.warn(e)}
}
function confPathSetup(){
  const card=$("pathCard");if(!card||$("pathMode"))return;
  const pm=el("div","pmode");pm.id="pathMode";pm.setAttribute("role","tablist");
  [["spb","Церковь"],["conf","⛰️ Конференция"]].forEach(([m,l])=>{const b=el("button",null,l);b.type="button";b.dataset.m=m;b.addEventListener("click",()=>{try{localStorage.setItem("ogonek-path-mode",m)}catch(e){}renderPath()});pm.append(b)});
  card.querySelector(".pzoom").after(pm);
  const list=el("div","cpeople");list.id="confPeople";$("pathBox").after(list);
}
function confPathChrome(conf){
  confPathSetup();const pm=$("pathMode");pm.hidden=true;
  pm.querySelectorAll("button").forEach(b=>b.classList.toggle("on",(b.dataset.m==="conf")===conf));
  
  $("confPeople").hidden=!conf;$("pathBox").classList.toggle("cpbox",conf);{const lg=$("pathLegend");if(lg)lg.hidden=conf}
}
function renderConfPath(){
  confPathChrome(true);
  const host=$("path");host.textContent="";const NS="http://www.w3.org/2000/svg",sv=(t,a,tx)=>{const e=document.createElementNS(NS,t);Object.entries(a||{}).forEach(([k,v])=>e.setAttribute(k,v));if(tx!=null)e.textContent=tx;return e};
  const W=Math.max(300,Math.min(480,$("pathBox").clientWidth||340)),N=MEM_SETS.length,GAP=70,TOP=130,H=TOP+N*GAP+50,cx=W/2,A=Math.min(105,W*.27);
  // плавная волна снизу вверх, как на основном пути
  const X=t=>cx+A*Math.sin(t*Math.PI/3.5),Y=t=>H-50-t*GAP,pos=i=>({x:X(i),y:Y(i)});
  const svg=sv("svg",{viewBox:"0 0 "+W+" "+H,width:Math.round(W*pathZoom),height:Math.round(H*pathZoom),class:"pathsvg cpath",role:"img","aria-label":"Путь челленджа «Божья гора»"});
  const curve=(t0,t1)=>{let d="";for(let t=t0;t<=t1+1e-6;t+=.1)d+=(d?"L":"M")+X(t).toFixed(1)+" "+Y(t).toFixed(1);return d};
  const fp={x:X(N),y:Y(N)-34};
  svg.append(sv("path",{d:curve(-0.6,N-1)+"L"+fp.x.toFixed(1)+" "+(fp.y+30).toFixed(1),fill:"none",stroke:"var(--trail)","stroke-width":8,"stroke-linecap":"round","stroke-linejoin":"round"}));
  const c=confSt(),myNode=c.joined?cpNode(c.log.length):-1,r=confRead();
  if(myNode>0)svg.append(sv("path",{d:curve(-0.6,Math.min(myNode,N-1)),fill:"none",stroke:"var(--flame)","stroke-width":4,"stroke-linecap":"round","stroke-dasharray":"2 8"}));
  // вершина и флаг конференции
  const g0=sv("g",{class:"cpflag"});g0.append(sv("path",{d:"M"+(fp.x-70)+" "+(fp.y+30)+" L"+fp.x+" "+(fp.y-26)+" L"+(fp.x+70)+" "+(fp.y+30)+"Z",fill:"color-mix(in srgb,#2f8f6b 70%,var(--surface))"}),
    sv("path",{d:"M"+fp.x+" "+(fp.y-26)+" l12 9 -6 -1 -6 6 -6 -6 -6 1z",fill:"#fff",opacity:".85"}),sv("line",{x1:fp.x,y1:fp.y-26,x2:fp.x,y2:fp.y-48,stroke:"#2f8f6b","stroke-width":2.5}),sv("path",{d:"M"+fp.x+" "+(fp.y-48)+" l18 5 -18 6z",fill:"#ffc53d"}),
    sv("text",{x:fp.x,y:fp.y+46,"text-anchor":"middle",class:"cpft"},"Конференция · 29 октября"));svg.append(g0);
  svg.append(sv("text",{x:X(-0.6),y:H-8,"text-anchor":"middle",class:"cpst"},"Старт · все начинают отсюда"));
  // люди: стоят прямо в кружке своей строфы
  const people=[];if(c.joined)people.push({id:"me",name:"Вы",me:true,photo:state.photo||"",node:myNode,lit:c.log.some(x=>x.d===today()),pct:myPct()});
  (pathPeople||[]).forEach(f=>{const q=f.conf;if(q&&q.j)people.push({id:f.id,name:(f.name||"Друг").split(" ")[0],photo:f.photo||"",node:cpNode(q.u||0),lit:q.d===today(),pct:q.pct||0})});
  const at={};people.forEach(pp=>{const k=Math.min(pp.node,N);(at[k]=at[k]||[]).push(pp)});
  // узлы (без цифр): пройденные — зелёные; подпись — сбоку
  MEM_SETS.forEach((m,i)=>{const p=pos(i),done=m.st!=null?CONF_UNITS.filter(u=>u.st===m.st).every(u=>r.has(u.i)):m.units.every(x=>r.has(x)),busy=at[i]&&at[i].length;
    const g=sv("g",{class:"cpnode"+(done?" done":"")});g.append(sv("circle",{cx:p.x,cy:p.y,r:busy?20:15}));
    if(done&&!busy)g.append(sv("path",{d:"M"+(p.x-5.5)+" "+p.y+" l4 4 7.5-8",fill:"none",stroke:"#fff","stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"}));
    const left=p.x>cx,off=busy?Math.max(30,(Math.min(at[i].length,4)-1)*17+30):26;
    g.append(sv("text",{x:p.x+(left?-off:off),y:p.y+4,"text-anchor":left?"end":"start",class:"cpl"},m.st!=null?m.title+" · "+m.sub.replace("Пс. ",""):m.title));svg.append(g)});
  const COLR=["#e8650a","#6b4fd8","#0e9aa7","#c7559c","#1d6fd6","#9a6b3f"];let meXY=null;
  Object.entries(at).forEach(([k,list])=>{k=+k;const base=k>=N?{x:fp.x,y:fp.y+6}:pos(k),n=Math.min(list.length,4),crowd=list.length>1;
    list.slice(0,4).forEach((pp,j)=>{const x=base.x+(j-(n-1)/2)*30,y=base.y,ci=people.indexOf(pp),col=pp.me?"var(--flame)":COLR[ci%COLR.length];
      const g=sv("g",{class:"pperson cpp"+(pp.me?" me":"")});
      g.append(sv("circle",{cx:x,cy:y,r:15,fill:col,stroke:pp.lit?"#ffc53d":"var(--surface)","stroke-width":3}));
      if(pp.photo){const cid="cpc"+String(pp.id).replace(/[^a-zA-Z0-9]/g,"")+j,cp=sv("clipPath",{id:cid});cp.append(sv("circle",{cx:x,cy:y,r:12}));g.append(cp);
        g.append(sv("image",{href:pp.photo,x:x-12,y:y-12,width:24,height:24,"clip-path":"url(#"+cid+")",preserveAspectRatio:"xMidYMid slice",referrerpolicy:"no-referrer"}))}
      else g.append(sv("text",{x,y:y+5,"text-anchor":"middle",class:"cpi"},pp.name.charAt(0).toUpperCase()));
      if(!crowd||pathZoom>=1.25)g.append(sv("text",{x,y:y+30,"text-anchor":"middle",class:"pname"+(crowd?" small":"")},pp.name));
      g.append(sv("title",null,pp.name+" · "+pp.pct+"%"+(pp.lit?" · сегодня читал(а)":"")));g.style.cursor="pointer";
      g.addEventListener("click",()=>pp.me?openConf("read"):window.Ogonek&&window.Ogonek.onPersonClick&&window.Ogonek.onPersonClick(pp.id));svg.append(g);if(pp.me)meXY={x,y}});
    if(list.length>4)svg.append(sv("text",{x:base.x+n*15+18,y:base.y+4,class:"cpl"},"+"+(list.length-4)))});
  host.append(svg);
  const pb=$("pathBox");
  if(pb&&!pb.dataset.ctouched)requestAnimationFrame(()=>pathCenterMe(false));
  if(pb&&!pb.dataset.cbound){pb.dataset.cbound="1";["wheel","touchstart","pointerdown"].forEach(ev=>pb.addEventListener(ev,()=>{if(pathModeConf())pb.dataset.ctouched="1"},{passive:true}))}
  // друзья в челлендже — с кнопками «Воодушевить»
  const L=$("confPeople");L.textContent="";
  if(!c.joined){const j=el("div","cpjoin");j.append(el("span",null,"Вы ещё не присоединились к челленджу."));const b=el("button","btn","Присоединиться");b.type="button";b.addEventListener("click",()=>{confJoin();openConf("read")});j.append(b);L.append(j)}
  confFriendsList(L,false);
}

/* ---------- Воодушевление друзей в челлендже: до 5 друзей в день, можно всех сразу ---------- */
const CONF_CHEERS=["⛰️ Давай поднимемся на Синай — сегодня вместе!","📖 Твой отрывок ждёт тебя!","🔥 Я уже прочитал(а) — теперь твоя очередь!","🪔 «Слово Твоё — светильник ноге моей». Почитаем?","🍯 Слаще мёда! Загляни в сегодняшний отрывок","🙏 Молюсь за тебя — до конференции совсем немного!"];
const CONF_JOIN_MSG=6; // «Присоединяйся к челленджу «Божья гора»!»
const CHEER_LIMIT=5;
const cheerLeft=()=>NET&&NET.cheerLeft?NET.cheerLeft():0;
const cheerSent=u=>!!(NET&&NET.cheerSent&&NET.cheerSent(u));
function confFriendsAll(){return (pathPeople||[]).map(f=>({id:f.id,name:(f.name||"Друг").split(" ")[0],full:f.name||"Друг",photo:f.photo||"",c:f.conf&&f.conf.j?f.conf:null}))}
function cheerPicker(targets,onDone){
  const modal=el("div","fmodal"),sheet=el("div","fsheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)},esc=e=>{if(e.key==="Escape")close()};
  modal.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",esc);
  const h=el("div","fhead"),ht=el("div");ht.append(el("h2",null,targets.length>1?"Воодушевить "+targets.length+" "+plural(targets.length,"друга","друзей","друзей"):"Воодушевить"),el("div","hint",targets.map(t=>t.name).join(", ")+" "+(targets.length>1?"получат":"получит")+" уведомление"));
  const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);h.append(ht,x);
  const list=el("div","cheerlist");
  CONF_CHEERS.forEach((t,i)=>{const o=el("button","cheeropt",t);o.type="button";o.addEventListener("click",async()=>{
    list.querySelectorAll("button").forEach(b=>b.disabled=true);let ok=0;
    for(const tg of targets){try{if(await NET.cheer(tg.id,i))ok++}catch(e){console.warn(e)}}
    close();if(ok){toast(ok>1?"Отправлено "+ok+" друзьям! Пусть все поднимутся на Синай":"Отправлено! Пусть огонёк разгорится");vibrate&&vibrate([30,40,30])}onDone&&onDone()});list.append(o)});
  sheet.append(h,el("p","hint","Воодушевить можно до "+CHEER_LIMIT+" друзей в день. Сегодня осталось: "+cheerLeft()+"."),el("span","label","Выберите слова"),list);
  modal.append(sheet);document.body.append(modal);
}
// список друзей челленджа; full=true — во вкладке «Друзья» (ещё и кто не участвует + приглашение)
function confFriendsList(L,full){
  const all=confFriendsAll(),inC=all.filter(f=>f.c).sort((a,b)=>(b.c.pct||0)-(a.c.pct||0)),outC=all.filter(f=>!f.c),t=today();
  const redraw=()=>{try{renderConfFriendsCard()}catch(e){}try{if(pathModeConf())renderConfPath()}catch(e){}};
  const head=el("div","cfhead");head.append(el("div","label",inC.length?"Друзья в челлендже · "+inC.length:"Друзья в челлендже"));
  const need=inC.filter(f=>f.c.d!==t&&!cheerSent(f.id));
  if(NET&&need.length){const n=Math.min(need.length,cheerLeft());const ab=el("button","cbtn cheerall",n?"💪 Воодушевить всех, кто ещё не читал ("+n+")":"Лимит на сегодня исчерпан");ab.type="button";ab.disabled=!n;
    ab.addEventListener("click",()=>cheerPicker(need.slice(0,n),redraw));head.append(ab)}
  L.append(head);
  if(!inC.length)L.append(el("p","hint",NET?"Пока никто из друзей не в челлендже. Позовите их!":"Друзей видно на сайте Огонька после входа через Google."));
  inC.forEach(f=>{const row=el("div","cprow");const read=f.c.d===t,sent=cheerSent(f.id);
    row.append(confFlame("flame"+(read?"":" off")),el("b",null,f.name),el("span",null,(f.c.pct||0)+"% · "+(cpNode(f.c.u||0)>=MEM_SETS.length?"всё прочитано":MEM_SETS[cpNode(f.c.u||0)].title)+" · "+(read?"сегодня читал(а)":"сегодня ещё нет")));
    const b=el("button","cheerb"+(sent?" sent":""),read?"🔥":sent?"Воодушевили ✓":"💪 Воодушевить");b.type="button";b.disabled=read||sent||!NET||(!sent&&cheerLeft()===0);
    if(!read&&!sent&&NET)b.addEventListener("click",e=>{e.stopPropagation();if(!cheerLeft()){toast("Сегодня вы уже воодушевили "+CHEER_LIMIT+" друзей");return}cheerPicker([f],redraw)});
    row.append(b);row.addEventListener("click",()=>window.Ogonek&&window.Ogonek.onPersonClick&&window.Ogonek.onPersonClick(f.id));L.append(row)});
  if(!full){if(NET){const inv=el("button","linkbtn chide","＋ Пригласить в челлендж");inv.type="button";inv.addEventListener("click",()=>{confSegSet("conf");setPage("friends")});L.append(inv)}return}
  if(outC.length&&NET){L.append(el("div","label cflab","Ещё не в челлендже · "+outC.length));
    outC.forEach(f=>{const row=el("div","cprow out");const sent=NET.cheerSent(f.id,true);row.append(icoEl("peak"),el("b",null,f.name),el("span",null,"не участвует"));
      const b=el("button","cheerb"+(sent?" sent":""),sent?"Позвали ✓":"⛰️ Позвать");b.type="button";b.disabled=sent;
      if(!sent)b.addEventListener("click",async e=>{e.stopPropagation();b.disabled=true;if(await NET.cheer(f.id,CONF_JOIN_MSG,true)){b.textContent="Позвали ✓";b.classList.add("sent");toast("Приглашение отправлено")}else b.disabled=false});
      row.append(b);row.addEventListener("click",()=>window.Ogonek&&window.Ogonek.onPersonClick&&window.Ogonek.onPersonClick(f.id));L.append(row)})}
  const share=el("div","cshare");share.append(el("b",null,"Пригласить в челлендж по ссылке"),el("span",null,"Друг откроет Огонёк сразу с челленджем «Божья гора» и станет вашим другом."));
  const sb=el("button","cbtn",NET?"Скопировать приглашение":"Войдите, чтобы пригласить");sb.type="button";sb.disabled=!NET;
  sb.addEventListener("click",async()=>{const txt=confInviteText(NET.code());let ok=false;
    try{if(navigator.share){await navigator.share({text:txt});ok=true}}catch(e){if(e&&e.name==="AbortError")return}
    if(!ok){try{await navigator.clipboard.writeText(txt);ok=true}catch(e){}}
    if(!ok){const ta=el("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";document.body.append(ta);ta.select();try{ok=document.execCommand("copy")}catch(e){}ta.remove()}
    toast(ok?"Приглашение скопировано — отправьте его другу":"Не удалось скопировать")});
  share.append(sb);L.append(share);
}
function confInviteUrl(code){return location.origin+location.pathname.replace(/[^/]*$/,"")+"sinai.html"+(code?"?add="+code:"")}
function confInviteText(code){return "Присоединяйся к челленджу «Божья гора» в Огоньке! ⛰️\nК конференции школьников (29 октября – 1 ноября) читаем Исход 19–20 и Псалом 119 — понемногу каждый день до 28 октября. Вопросы, игры и восхождение на Синай вместе с друзьями."+(code?"\nМой код: "+code:"")+"\n"+confInviteUrl(code)}
window.confInviteText=code=>{const t=tracks();return t.conf&&!t.spb&&!confClosed()?confInviteText(code):null};
window.confGo=join=>{if(join&&!tracks().conf){confJoin();setTrack("conf",true)}if(tracks().conf){try{localStorage.setItem("ogonek-app-mode","conf")}catch(e){}applyAppMode();setPage("home")}};
window.confCheers={list:CONF_CHEERS.concat(["⛰️ Присоединяйся к челленджу «Божья гора»! Читаем вместе к конференции"])};
/* вкладка «Друзья»: «По расписанию» | «В челлендже» */
function confSeg(){const t=tracks();if(!t.conf||confClosed())return "spb";if(!t.spb)return "conf";try{return sessionStorage.getItem("ogonek-fseg")||"spb"}catch(e){return "spb"}}
function confSegSet(v){try{sessionStorage.setItem("ogonek-fseg",v)}catch(e){}renderConfFriendsCard()}
function renderConfFriendsCard(){
  let seg=$("friendsSeg"),card=$("confFriendsCard");
  if(!seg){seg=el("div","pmode fseg");seg.id="friendsSeg";seg.dataset.page="friends";card=el("section","card");card.id="confFriendsCard";card.dataset.page="friends";
    const anchor=$("friendsEmpty")||$("friendsCard");anchor.before(seg);anchor.before(card)}
  const t=tracks(),both=t.spb&&t.conf&&!confClosed(),s=confSeg();
  seg.hidden=!both;seg.textContent="";
  [["spb","book","По расписанию"],["conf","peak","В челлендже"]].forEach(([v,ic,l])=>{const b=el("button",v===s?"on":"");b.type="button";b.append(icoEl(ic),el("span",null,l));b.addEventListener("click",()=>confSegSet(v));seg.append(b)});
  const conf=s==="conf";document.body.classList.toggle("fseg-conf",conf);card.hidden=!conf;
  if(conf){card.textContent="";card.append(el("h2",null,"Друзья в челлендже «Божья гора»"));confFriendsList(card,true)}
}

/* ---------- Что я читаю: «Церковь в Санкт-Петербурге» и/или «Конференция» ----------
   Вкладки наверху видны, только если включено и то и другое. Кто давно читает по церкви — конференция
   выключена, пока её не включат. Кто пришёл по приглашению конференции (?conf=1 или ?team=КОД) — только
   конференция, а церковь включается в «Расписании». */
function tracks(){if(noPlan())return {spb:true,conf:false};const t=state.tracks;if(t&&typeof t==="object")return {spb:t.spb!==false,conf:!!t.conf};return {spb:true,conf:!!confSt().joined}}
function setTrack(k,on){const t=tracks();t[k]=!!on;if(!t.spb&&!t.conf)t.spb=true;state.tracks=t;save();
  try{localStorage.setItem("ogonek-app-mode",on?k:(k==="conf"?"spb":"conf"))}catch(e){}applyAppMode()}
(function confEntryLink(){
  let q=null;try{q=new URLSearchParams(location.search)}catch(e){}if(!q||!(q.get("team")||q.get("conf")))return;
  if(confClosed())return;
  const fresh=!state.tracks&&!state.nt.read.length&&!state.ot.read.length;
  state.planChosen=true;
  state.tracks=fresh?{spb:false,conf:true}:Object.assign(tracks(),{conf:true});
  try{localStorage.setItem("ogonek-app-mode","conf")}catch(e){}
  if(q.get("conf")){q.delete("conf");try{history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:""))}catch(e){}}
  save();
})();
function confTracksBlock(closePlans){
  // переключатель основного расписания (челлендж включается и выключается в «План» → «Челленджи»)
  const t=tracks(),box=el("div","trk");
  const b=el("button","trkitem"+(t.spb?" on":""));b.type="button";b.setAttribute("role","switch");b.setAttribute("aria-checked",String(t.spb));
  b.append(icoEl("book"));const tx=el("span","ptxt");tx.append(el("b",null,"Основное расписание"),el("span",null,t.spb?"Включено · "+SCHED.name:"Выключено — на главной только челлендж"));b.append(tx,el("span","trksw"));
  b.addEventListener("click",()=>{const now=tracks();
    if(now.spb&&!now.conf){toast("Нельзя выключить: тогда нечего будет читать. Сначала присоединитесь к челленджу");return}
    setTrack("spb",!now.spb);closePlans();toast(now.spb?"Основное расписание выключено. Прочитанное сохранено":"Основное расписание включено")});
  box.append(b);
  const closed=confClosed(),c2=el("button","trkitem"+(t.conf&&!closed?" on":""));c2.type="button";c2.disabled=closed;c2.setAttribute("role","switch");c2.setAttribute("aria-checked",String(t.conf&&!closed));
  c2.append(icoEl("peak"));const tx2=el("span","ptxt");tx2.append(el("b",null,"Челлендж «Божья гора»"),el("span",null,closed?"Завершён 28 октября — в архиве":t.conf?"Вы участвуете · до 28 октября":"Исход 19–20 и Псалом 119 · до 28 октября"));c2.append(tx2,el("span","trksw"));
  c2.addEventListener("click",()=>{const now=tracks();
    if(!now.conf){confJoin();setTrack("conf",true);closePlans();toast("Вы в челлендже! Переключайтесь вверху на главной");return}
    if(!now.spb){toast("Нельзя выключить: тогда нечего будет читать. Сначала включите основное расписание");return}
    setTrack("conf",false);closePlans();toast("Челлендж выключен. Прочитанное сохранено — можно вернуться")});
  box.append(c2);
  box.append(el("p","hint",t.spb&&t.conf&&!closed?"Включено оба — переключайтесь вкладками вверху на главной.":"Включите оба, и на главной вверху появятся вкладки «Основное расписание» и «Челлендж»."));
  return box;
}

/* ---------- «Челленджи» — отдельно от расписаний (вкладка «План») ----------
   Челлендж — временное событие: сейчас «Божья гора» к конференции школьников. Присоединился — на главной
   появляется переключатель «Основное расписание | Челлендж». Закончился — уходит в «Завершённые». */
function renderChallenges(){
  let card=$("challengesCard");
  if(!card){card=el("section","card chcard");card.id="challengesCard";card.dataset.page="plan";const sch=$("schedule");if(!sch)return;sch.before(card);
    const off=el("section","card spboff");off.id="spbOff";off.dataset.page="plan";sch.before(off);
    off.append(el("h2",null,"Основное расписание"),el("p","muted","Сейчас у вас только челлендж. Подключите общее расписание церкви в Санкт-Петербурге — вся Библия за 2 года вместе с друзьями."));
    const b=el("button","cbtn","Подключить основное расписание");b.type="button";b.addEventListener("click",()=>{setTrack("spb",true);toast("Основное расписание подключено")});off.append(b)
    const off2=off.cloneNode(false);off2.id="spbOff2";off2.dataset.page="awards";off2.append(el("h2",null,"Библиотека"),el("p","muted","Алмазы и награды — за чтение по основному расписанию. В челлендже вы собираете ⭐ за вопросы и игры."));
    const b2=el("button","cbtn","Подключить основное расписание");b2.type="button";b2.addEventListener("click",()=>{setTrack("spb",true);toast("Основное расписание подключено")});off2.append(b2);$("gemsCard").before(off2)}
  card.textContent="";const t=tracks(),c=confSt(),closed=confClosed(),on=t.conf&&!closed;
  card.append(el("div","chh","Челленджи · временные задания"));
  const item=el("div","chitem"+(on?" on":"")+(closed?" past":""));
  const r=confRead(),pct=Math.round(CONF_UNITS.filter(u=>r.has(u.i)).reduce((s,u)=>s+u.w,0)/CONF_VERSES*100),n=confDaysLeft();
  const tx=el("div","chtx");tx.append(el("b",null,"«Божья гора»"),el("span",null,closed?(c.joined?"Завершён · ваш итог "+pct+"%":"Завершён 28 октября"):"Исход 19–20, Псалом 119 · "+(on&&c.joined?pct+"% · ":"")+"ещё "+n+" "+plural(n,"день","дня","дней")));
  const lab=el("span","chlab",closed?"завершён":on?"вы участвуете":"идёт сейчас");
  const btn=el("button",on||closed?"btn":"cbtn chgo",closed?"Архив":on?"Открыть":"Присоединиться");btn.type="button";
  btn.addEventListener("click",()=>{if(closed){openConf("read");return}if(!on){confJoin();setAppMode("conf");setPage("home");toast("Вы в челлендже! Переключайтесь вверху на главной");return}setAppMode("conf");setPage("home")});
  item.append(icoEl("mount"),tx,btn);const top=el("div","chtop2");top.append(lab);
  const fr=(pathPeople||[]).filter(f=>f.conf&&f.conf.j).length;if(fr)top.append(el("span","chfr","👥 "+fr));
  if(!closed&&!on){const m=el("button","linkbtn","Подробнее");m.type="button";m.addEventListener("click",()=>openConf("read"));top.append(m)}
  if(on){const lv=el("button","linkbtn","Выйти");lv.type="button";lv.addEventListener("click",()=>{if(!t.spb){toast("Сначала включите основное расписание");return}if(!lv.dataset.armed){lv.dataset.armed="1";lv.textContent="Точно выйти?";setTimeout(()=>{delete lv.dataset.armed;lv.textContent="Выйти"},4000);return}
    setTrack("conf",false);toast("Вы вышли из челленджа. Прочитанное сохранено")});top.append(lv)}
  card.append(item,top);card.hidden=true; // пока идёт — в «Моих расписаниях»; закончился — в архиве («Библиотека» внизу)
}
// подсказка на главной основного расписания: «Сейчас идёт челлендж»
function renderChPromo(){
  let p=$("chPromo");const hide=(()=>{try{return localStorage.getItem("ogonek-chpromo-x")==="1"}catch(e){return false}})();
  if(!p){const tc=$("testaments")&&$("testaments").closest(".card");if(!tc)return;p=el("section","chpromo");p.id="chPromo";p.dataset.page="home";p.dataset.ch="1";tc.after(p)}
  const show=!confClosed()&&!tracks().conf&&!hide;p.hidden=!show;if(!show)return;p.textContent="";
  const go=el("button","chpgo");go.type="button";go.append(icoEl("mount"));const tx=el("span","chptx");tx.append(el("i",null,"Сейчас идёт челлендж"),el("b",null,"«Божья гора» — к конференции школьников"),el("span",null,"до 28 октября · "+confDaysLeft()+" "+plural(confDaysLeft(),"день","дня","дней")));go.append(tx,el("span","chparr","›"));
  go.addEventListener("click",()=>{setPage("plan");setSchedView("conf")});
  const x=el("button","chpx","×");x.type="button";x.setAttribute("aria-label","Скрыть");x.addEventListener("click",()=>{try{localStorage.setItem("ogonek-chpromo-x","1")}catch(e){}p.hidden=true});
  p.append(go,x);
}
window.confOpenChallenges=()=>{setPage("plan");setSchedView("conf")};



/* ---------- Нижние вкладки, как в Duolingo: главная разгружена, остальное — по разделам ---------- */
const PAGES_SPB=[["home","home","Главная"],["friends","friends","Друзья"],["awards","lib","Библиотека","Книги"],["plan","plan","Расписания","График"]];
let curPage=(()=>{try{return sessionStorage.getItem("ogonek-page")||"home"}catch(e){return "home"}})();
function pagesSetup(){
  if(pagesSetup.done)return;pagesSetup.done=true;
  const tag=(node,p)=>{if(node)node.dataset.page=p};
  tag($("heroFlame")&&$("heroFlame").closest(".card"),"home");tag($("testaments")&&$("testaments").closest(".card"),"home");tag($("appTabs"),"home");
  [$("heroFlame")&&$("heroFlame").closest(".card"),$("testaments")&&$("testaments").closest(".card"),$("quizCard")].forEach(n=>{if(n)n.dataset.ch="1"});
  [$("heroFlame")&&$("heroFlame").closest(".card"),$("testaments")&&$("testaments").closest(".card"),$("quizCard"),$("calendarCard"),$("progCard"),$("gemsCard"),$("awardsCard"),$("guideOpen")].forEach(n=>{if(n)n.dataset.spb="1"});
  ["quizCard","pathCard","confCard","installCard"].forEach(id=>tag($(id),"home"));
  ["friendsCard","inviteCard"].forEach(id=>tag($(id),"friends"));
  ["libCard","gemsCard","awardsCard"].forEach(id=>tag($(id),"awards"));
  ["schedule","calendarCard"].forEach(id=>tag($(id),"plan"));
  // «Прогресс плана» — в «План», «Как это работает» — в «Ещё»
  const prog=$("progCard"),how=$("howCard"),f2=prog&&prog.closest(".fold2");
  if(f2){f2.before(prog);f2.after(how);f2.remove()}tag(prog,"plan");tag(how,"awards"); // раздела «Ещё» больше нет — «Как это работает» и «Впервые читаете Библию?» в «Библиотеке»
  
  tag($("guideOpen"),"awards");{const ac=$("awardsCard"),go=$("guideOpen");if(ac&&go)ac.after(go)} // в «Библиотеке»: сначала книги, алмазы и награды, затем путеводитель
  tag(document.querySelector(".app>.foot"),"awards");
  try{libLayout()}catch(e){console.warn(e)}
  // друзья без входа — подсказка
  const fe=el("section","card fempty");fe.id="friendsEmpty";fe.dataset.page="friends";
  fe.append(el("h2",null,"Друзья"),el("p","muted",""));$("friendsCard").before(fe);
  // заголовок раздела
  const ph=el("h2","pagehead");ph.id="pageHead";($("appTabs")||document.querySelector(".app>.top")).after(ph);
}
// путь по умолчанию показывает меня: при открытии главной и смене вкладок
function pathCenterMe(smooth){const pb=$("pathBox");if(!pb||!pb.offsetParent)return;
  const me=document.querySelector("#path .pperson.me circle");
  if(!me){if(pathModeConf())pb.scrollTop=pb.scrollHeight;return}
  const y=Number(me.getAttribute("cy"))*pathZoom,x=Number(me.getAttribute("cx"))*pathZoom;
  pb.scrollTo({top:Math.max(0,y-pb.clientHeight/2),left:Math.max(0,x-pb.clientWidth/2),behavior:smooth?"smooth":"auto"})}
function pathFocusSoon(){const pb=$("pathBox");if(pb){delete pb.dataset.touched;delete pb.dataset.ctouched}
  requestAnimationFrame(()=>requestAnimationFrame(()=>pathCenterMe(false)));setTimeout(()=>pathCenterMe(false),250)}
function setPage(p){if(p==="plan")schedView="";
  curPage=p;try{sessionStorage.setItem("ogonek-page",p)}catch(e){}applyPage();window.scrollTo({top:0});if(p==="home")pathFocusSoon();
}

/* ---------- настройки уведомлений: напоминания (если огонёк ещё не горит) и уведомления от друзей ----------
   cfg = {on, times:[{h,on}], friends}. Сохранение — через opts.save (auth.js пишет в push/{uid}: hours[], friends, on). */
const NT_DEF={on:true,times:[{h:14,on:true},{h:22,on:true}],friends:true};
function ntLoad(){try{const c=JSON.parse(localStorage.getItem("ogonek-notify")||"null");if(c&&Array.isArray(c.times))return c}catch(e){}return JSON.parse(JSON.stringify(NT_DEF))}
function ntHours(c){return c.on?[...new Set(c.times.filter(t=>t.on).map(t=>t.h))].sort((a,b)=>a-b):[]}
function ntPart(h){return h<5?"ночью":h<12?"утром":h<17?"днём":"вечером"}
function ntText(c){const hs=ntHours(c);if(!hs.length)return "выключены";return hs.map(h=>h+":00").join(", ")}
function openNotify(opts){
  try{ntSeen()}catch(e){}
  opts=opts||{};let c=ntLoad(),adding=false;
  const modal=el("div","fmodal ntmodal"),sh=el("div","fsheet ntsheet");sh.setAttribute("role","dialog");sh.setAttribute("aria-modal","true");sh.setAttribute("aria-label","Уведомления");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  modal.addEventListener("click",e=>{if(e.target===modal)close()});
  const sw=(on,fn,label)=>{const l=el("label","ntsw");const i=document.createElement("input");i.type="checkbox";i.checked=!!on;i.setAttribute("aria-label",label);i.addEventListener("change",()=>fn(i.checked));l.append(i,el("span"));return l};
  let saveT=0;const save=()=>{try{localStorage.setItem("ogonek-notify",JSON.stringify(c))}catch(e){}clearTimeout(saveT);saveT=setTimeout(()=>{Promise.resolve(opts.save&&opts.save(c,ntHours(c))).then(()=>toast(ntHours(c).length?"Сохранено · напомню в "+ntText(c):"Напоминания выключены")).catch(()=>toast("Не удалось сохранить. Проверьте интернет."))},500)};
  function draw(){
    sh.textContent="";
    const hd=el("div","fhead");const ic=el("span","ntbell");ic.append(icoEl("bell"));const tt=el("div");tt.append(el("h2",null,"Уведомления"),el("div","hint","Огонёк напомнит, только если сегодня вы ещё не читали"));
    const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);hd.append(ic,tt,x);sh.append(hd);
    // разрешение на телефоне
    const st=opts.status?opts.status():"granted";
    if(st!=="granted"){const b=el("div","ntperm");
      b.append(el("p",null,st==="unsupported"?"Этот браузер не присылает уведомления. На iPhone — добавьте Огонёк на экран «Домой» и откройте оттуда.":st==="denied"?"Уведомления запрещены в настройках телефона. Разрешите их для Огонька — и напоминания заработают.":"Чтобы напоминания приходили, разрешите уведомления на этом телефоне."));
      if(st==="default"){const go=el("button","btn-main","Разрешить уведомления");go.type="button";go.addEventListener("click",async()=>{try{await (opts.ask&&opts.ask())}catch(e){}draw()});b.append(go)}
      sh.append(b)}
    // главный выключатель
    const main=el("div","ntrow ntmain");const mt=el("div","nttx");mt.append(el("b",null,"Напоминать о чтении"),el("small",null,c.on?"Напомню в "+ntText(c):"Сейчас выключено"));
    main.append(mt,sw(c.on,v=>{c.on=v;save();draw()},"Напоминать о чтении"));sh.append(main);
    // времена
    const box=el("div","ntgroup"+(c.on?"":" off"));box.append(el("div","label","Если огонёк ещё не горит, напомнить"));
    c.times.slice().sort((a,b)=>a.h-b.h).forEach(t=>{
      const r=el("div","ntrow");const tm=el("div","nttime");tm.append(el("b",null,String(t.h).padStart(2,"0")+":00"),el("small",null,ntPart(t.h)));
      const del=el("button","ntdel","Убрать");del.type="button";del.setAttribute("aria-label","Убрать "+t.h+":00");del.addEventListener("click",()=>{c.times=c.times.filter(z=>z!==t);save();draw()});
      r.append(tm,del,sw(t.on,v=>{t.on=v;save();draw()},"Напоминание в "+t.h+":00"));box.append(r)});
    if(c.times.length<4){
      if(!adding){const add=el("button","ntadd","＋ Добавить время");add.type="button";add.addEventListener("click",()=>{adding=true;draw()});box.append(add)}
      else{const pk=el("div","ntpick");pk.append(el("div","hint","Во сколько напомнить?"));const g=el("div","nthours");
        for(let h=6;h<=23;h++){const b=el("button","nth"+(c.times.some(t=>t.h===h)?" have":""),String(h).padStart(2,"0")+":00");b.type="button";b.disabled=c.times.some(t=>t.h===h);
          b.addEventListener("click",()=>{c.times.push({h,on:true});c.on=true;adding=false;save();draw()});g.append(b)}
        const cn=el("button","linkbtn","Отмена");cn.type="button";cn.addEventListener("click",()=>{adding=false;draw()});pk.append(g,cn);box.append(pk)}}
    sh.append(box);
    // от друзей
    const fr=el("div","ntrow");const ft=el("div","nttx");ft.append(el("b",null,"От друзей"),el("small",null,"Когда друг воодушевил вас или позвал читать вместе"));
    fr.append(ft,sw(c.friends,v=>{c.friends=v;save()},"Уведомления от друзей"));sh.append(fr);
    // проверка
    if(opts.test){const tb=el("button","btn ntbtn","Прислать пробное уведомление");tb.type="button";tb.addEventListener("click",()=>opts.test(c));sh.append(tb)}
    sh.append(el("p","hint ntfoot","Время — по часам вашего телефона. Если огонёк уже горит, напоминание не придёт."));
  }
  draw();modal.append(sh);document.body.append(modal);
}


/* ---------- фото человека крупно: нажатие на аватар в профиле или в карточке глобуса ---------- */
function bigPhoto(src){return String(src||"").replace(/=s\d+(-c)?$/,"=s640-c").replace(/\/s\d+(-c)?\//,"/s640-c/")}
function photoZoom(src,name,bg,letter){
  const old=document.querySelector(".phz");if(old)old.remove();
  const ov=el("div","phz");ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label",name?"Фото: "+name:"Фото");
  const box=el("div","phzbox");
  if(src){const img=document.createElement("img");img.alt=name||"";img.referrerPolicy="no-referrer";img.src=bigPhoto(src);img.onerror=()=>{if(img.src!==src)img.src=src};box.append(img)}
  else{const l=el("div","phzl",(letter||name||"?").trim().charAt(0).toUpperCase());if(bg)l.style.background=bg;box.append(l)}
  if(name)box.append(el("div","phzn",name));
  const x=el("button","phzx","×");x.type="button";x.setAttribute("aria-label","Закрыть");
  const close=()=>{ov.classList.add("out");setTimeout(()=>ov.remove(),180);document.removeEventListener("keydown",esc,true)};
  const esc=e=>{if(e.key==="Escape"){e.stopPropagation();close()}};document.addEventListener("keydown",esc,true);
  ov.addEventListener("click",close);ov.append(box,x);document.body.append(ov);x.focus();
}
document.addEventListener("click",e=>{
  const a=e.target.closest&&e.target.closest(".fhead .favatar,.gmodal .gav");if(!a)return;
  e.stopPropagation();e.preventDefault();
  const img=a.querySelector("img"),host=a.closest(".fhead")||a.parentElement;
  const nm=((host&&host.querySelector("h2,b"))||{}).textContent||"";
  photoZoom(img&&(img.dataset.hq||img.getAttribute("src")),nm.replace(/\s*\(вы\)$/,""),getComputedStyle(a).backgroundColor,a.textContent);
},true);

/* «Архив»: прочитанные расписания и прошедшие челленджи — открыть и посмотреть */
function openArchive(){
  openFinished();
  const sh=[...document.querySelectorAll(".pdone-sheet")].pop();if(!sh)return;
  const h=sh.querySelector(".fhead h2");if(h)h.textContent="Архив";
  const big=sh.querySelector(".bsbig");if(big)big.before(el("div","label","Прочитанные расписания"));
  try{if(confClosed()){
    sh.append(el("div","label archlab","Челленджи"));
    const c=confSt(),r=confRead(),pct=Math.round(CONF_UNITS.filter(u=>r.has(u.i)).reduce((s,u)=>s+u.w,0)/CONF_VERSES*100);
    const ul=el("ol","fdlist"),li=el("li"),ic=el("span","fdemb");ic.append(icoEl("mount"));
    const tx=el("div");tx.append(el("b",null,"«Божья гора»"),el("span",null,"Исход 19–20 и Псалом 119 · до 28 октября 2026 · "+(c.joined||(c.log||[]).length?"ваш итог "+pct+"%":"вы не участвовали")));
    const b=el("button","fdre","Открыть");b.type="button";b.addEventListener("click",()=>{const m=sh.closest(".fmodal");if(m)m.remove();openConf("read")});
    li.append(ic,tx,b);ul.append(li);sh.append(ul)}}catch(e){console.warn(e)}
}
/* «Библиотека»: Мои книги → Достижения → Как читать Библию — одинаковые строки с иконками */
function libLayout(){
  const lc=$("libCard"),gc=$("gemsCard"),ac=$("awardsCard"),go=$("guideOpen"),hw=$("howCard");if(!lc||!gc||!ac||!go||!hw||libLayout.done)return;libLayout.done=true;
  const sec=(t,spb)=>{const h=el("div","libsec",t);h.dataset.page="awards";if(spb)h.dataset.spb="1";return h};
  const tile=(cls,ch)=>{const t=el("span","lico "+cls);t.setAttribute("aria-hidden","true");if(typeof ch==="string")t.textContent=ch;else if(ch)t.append(ch);return t};
  const two=(t,sub)=>{const w=el("span","ltt");w.append(el("b",null,t));if(sub){const s2=el("small",null,sub);w.append(s2)}return w};
  const g1=el("div","lgroup");g1.dataset.page="awards";g1.dataset.spb="1";
  const g2=el("div","lgroup");g2.dataset.page="awards";
  // книги: полоска прогресса Библии
  const tx=lc.querySelector(".libtx");if(tx&&!$("libBarI")){const bn=el("span","libbarn","");bn.id="libBarN";const bar=el("span","libbar"),bi=el("i");bi.id="libBarI";bar.append(bi);tx.querySelector("b").after(bn,bar)}
  lc.before(sec("Мои книги"));
  // прогресс по расписанию (раньше — отдельная карточка «Прогресс плана» во вкладке «Расписания») и архив
  {const pr=$("prog");const ar=el("button","card larch");ar.type="button";ar.id="archCard";ar.dataset.page="awards";
    const ai=el("span","lico lgem");ai.append(icoEl("scroll"));const at=el("span","ltt");at.append(el("b",null,"Архив"),el("small",null,"Прочитанные расписания и прошедшие челленджи"));
    ar.append(ai,at,el("span","libgo","›"));ar.addEventListener("click",()=>openArchive());
    if(pr){const pc=el("section","card lprog");pc.dataset.page="awards";pc.dataset.spb="1";pc.append(el("div","lptitle","Прогресс по расписанию"),pr);lc.after(pc);pc.after(ar)}else lc.after(ar)}
  lc.after(sec("Достижения",1),g1);g1.append(gc,ac);
  go.classList.add("libhide");hw.classList.add("libhide");
  {const pc=document.querySelector(".lprog"),ar=$("archCard");if(pc)lc.after(pc);if(ar)(pc||lc).after(ar)} // прогресс и архив — сразу под «Моей библиотекой»

  // алмазы
  {const h=gc.querySelector(".foldhead h2"),gi=h&&h.querySelector(".gemicon");if(h){if(gi){gi.classList.remove("big");h.prepend(tile("lgem",gi))}const tn=[...h.childNodes].find(n=>n.nodeType===3);if(tn){tn.remove();h.append(two("Алмазы","Вопросы по главам"))}}}
  // награды
  {const h=ac.querySelector(".foldhead h2");if(h){h.textContent="";h.append(tile("lmedal","🏅"),two("Награды","Значки за серии и книги"))}}
  // путеводитель
  {const gb=go.querySelector(".gbshelf");if(gb)gb.replaceWith(tile("lguide","📖"));const t=go.querySelector(".gbt");if(t)t.textContent="Что это за книга и как читать ссылки вроде «Мф. 3:7–17»"}
  // как это работает
  {const h=hw.querySelector(".foldhead h2");if(h){h.textContent="";h.append(tile("lhow","💡"),two("Как работает Огонёк","Огонёк, серия дней и заморозки"))}}
}
function applyPage(){
  pagesSetup();
  const list=PAGES_SPB;
  if(!list.some(x=>x[0]===curPage)||curPage==="quiz"||curPage==="games")curPage="home";

  document.querySelectorAll(".app>[data-page]").forEach(n=>n.classList.toggle("pg-off",n.dataset.page!==curPage));
  document.body.dataset.page=curPage;
  const ph=$("pageHead");const it=list.find(x=>x[0]===curPage);ph.hidden=true;const h1=document.querySelector(".app>.top .brand h1");if(h1)h1.textContent=curPage==="home"?"Огонёк":it[2];
  // друзья: если вход не выполнен — подсказка вместо пустоты
  const fe=$("friendsEmpty");if(fe){let was=false;try{was=!!localStorage.getItem("ogonek-owner")}catch(e){}const has=!$("friendsCard").hidden||was;fe.hidden=has;const login=$("loginTop"),can=login&&!login.hidden;
    fe.querySelector("p").textContent=can?"Войдите через Google (кнопка вверху), чтобы добавлять друзей, видеть их на пути и воодушевлять друг друга.":"Друзья доступны на сайте Огонька после входа через Google."}
  try{renderConfFriendsCard()}catch(e){console.warn(e)}
  const nav=$("botNav");if(!nav)return;nav.textContent="";
  list.forEach(([p,icon,label,short])=>{const b=el("button","bn"+(p===curPage?" on":""));b.type="button";b.setAttribute("aria-label",label);if(p===curPage)b.setAttribute("aria-current","page");
    const ii=icoEl(icon);ii.classList.add("bni");b.append(ii,el("span","bnl",short||label));
    b.addEventListener("click",()=>{const G=window.OgonekGlobe;if(G&&G.isOpen&&G.isOpen())G.close();setPage(p)});nav.append(b);
    // глобус читателей — в центре нижней панели, открывается поверх любой страницы
    if(p==="friends"){const gb=el("button","bn bnglobe");gb.type="button";gb.setAttribute("aria-label","Глобус читателей");const gi=icoEl("globe");gi.classList.add("bni");gb.append(gi,el("span","bnl","Глобус"));
      gb.addEventListener("click",()=>{const G=window.OgonekGlobe;if(G&&G.isOpen&&G.isOpen()){G.close();return}if(window.ogonekOpenGlobe)window.ogonekOpenGlobe();else toast("Глобус читателей откроется после входа через Google")});nav.append(gb)}});
  globeWatch();
  try{applyNoPlan()}catch(e){}
  // iPhone: принудительная перерисовка иконок панели после смены вкладки
  requestAnimationFrame(()=>{nav.querySelectorAll(".bni svg").forEach(v=>{v.style.opacity=".99";requestAnimationFrame(()=>{v.style.opacity=""})})});
}

/* ---------- Защита серии ----------
   1) В «Расписании» прошлые дни нельзя отметить или снять задним числом: снять можно только сегодняшнюю отметку.
      (Раньше нажатие на зелёный кружок прошлого дня удаляло запись вместе с датой, и при повторной отметке
      день засчитывался как сегодняшний — из-за этого пропадали дни серии.)
   2) «Вернуть серию»: если серия прервалась на 1–3 дня, а отрывки этих дней уже прочитаны, можно один раз
      в 30 дней закрыть пропуск — эти дни станут «заморозкой» (голубые в календаре). */
function schedCheck(c,k,p,done){
  const tp=todayP(),t=today(),lg=state[k].log.find(x=>x.p===p);
  if(done){
    if(lg&&lg.d===t&&p>=tp){c.addEventListener("click",()=>unmark(k,p));return}
    c.classList.add("locked");c.title="Прочитано "+(lg?parse(lg.d).toLocaleDateString("ru-RU",{day:"numeric",month:"long"}):"раньше");
    c.addEventListener("click",()=>toast("Эта отметка уже сохранена"+(lg?" за "+parse(lg.d).toLocaleDateString("ru-RU",{day:"numeric",month:"long"}):"")+" — снять её нельзя"));return}
  if(p<tp){c.classList.add("past");c.addEventListener("click",()=>toast("Задним числом отметить нельзя. Прочитайте отрывок и нажмите «Прочитал(а)» на главной — он засчитается сегодня"));return}
  confirmTap(c,null,()=>complete(k,p));
}
function repairInfo(){
  const s=withFrozen(anySet()),t=today();let cur=s.has(t)?t:add(t,-1);
  while(s.has(cur))cur=add(cur,-1);
  const gap=[];while(!s.has(cur)&&gap.length<4&&cur>=PLAN_START){gap.push(cur);cur=add(cur,-1)}
  if(!gap.length||gap.length>3||!s.has(cur))return null;
  let before=0,c2=cur;while(s.has(c2)){before++;c2=add(c2,-1)}
  const auto=gap.length===1&&gap[0]===add(t,-1); // пропущен только вчерашний день — вернётся сама, без ограничений
  if(!auto){if(before<2)return null;const last=(state.repairs||[]).slice(-1)[0];if(last&&dayNo(t)-dayNo(last)<30)return null}
  const ok=gap.every(d=>{const i=planIdx(d);return i>=0&&KEYS.every(k=>readSet(k).has(Math.min(i,DAYS-1)))});
  return {gap:gap.reverse(),before,ok,auto};
}
/* 3) Пропустили вчера — серия возвращается сама, как только вчерашний отрывок прочитан (через «Догнать»).
   Без кнопки и без ограничения «раз в 30 дней». «Отпущенный» отрывок не считается прочитанным. */
function autoRepair(){
  const n=repaidDays().size,was=state.repN||0;if(n===was)return false;
  state.repN=n;if(n>was){const st=streak();state.best=Math.max(state.best||0,st);
    const g=streakGap();if(!g||!g.ok)setTimeout(()=>{try{ignite($("heroFlame"),2)}catch(e){}toast("Пропуск закрыт — серия снова "+st+" "+plural(st,"день","дня","дней")+" подряд!")},400)}
  save();return false;
}
function renderRepair(){
  let box=$("streakRepair");const hero=$("heroFlame")&&$("heroFlame").closest(".card");if(!hero)return;
  if(!box){box=el("div","srepair");box.id="streakRepair";hero.append(box)}
  const g=streakGap(),hf=$("heroFlame");
  if(hf)hf.classList.toggle("smolder",!!(g&&g.ok)); // огонёк тлеет, пока пропуск можно наверстать
  const fmt=d=>parse(d).toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
  // наверстать уже нельзя: несколько дней после перерыва — спокойное «начнём снова» с рекордом
  if(g&&!g.ok){const end=g.gap[g.gap.length-1],best=Math.max(state.best||0,streak());
    if(dayNo(today())-dayNo(end)<=3&&best>1){box.hidden=false;box.textContent="";box.classList.add("srnew");
      const tx=el("div","srtx");tx.append(el("b",null,"Начнём снова"),el("span",null,"Ваш рекорд — "+best+" "+plural(best,"день","дня","дней")+" подряд. Читайте каждый день — и огонь снова разгорится."));box.append(tx);return}
    box.hidden=true;return}
  box.classList.remove("srnew");
  box.hidden=!g;if(!g)return;box.textContent="";
  const n=g.gap.length,need=n+(g.todayRead?0:1),total=g.before+n+g.after+(g.todayRead?0:1);
  const days=n===1?fmt(g.gap[0]):fmt(g.gap[0])+" – "+fmt(g.gap[n-1]);
  const dueTxt=g.due===today()?"сегодня":parse(g.due).toLocaleDateString("ru-RU",{weekday:"short",day:"numeric",month:"long"});
  const tx=el("div","srtx");tx.append(el("b",null,"Огонёк тлеет · пропущено: "+days),
    el("span",null,"Наверстайте до "+(g.due===today()?"конца дня":dueTxt)+": прочитайте ещё "+need+" "+plural(need,"отрывок","отрывка","отрывков")+(g.todayRead?"":" (с сегодняшним)")+" — по одному за каждый пропущенный день — и серия вернётся: "+total+" "+plural(total,"день","дня","дней")+" подряд."));
  box.append(tx);
}

// в последний день двухлетнего плана отрывка из Нового Завета нет (Откровение уже дочитано) — засчитываем его сам
function fillBlankDays(){let ch=false;KEYS.forEach(k=>{const r=new Set(state[k].read);PLAN.forEach((d,p)=>{if(!d[T[k].ri]&&!r.has(p)&&(p===0||r.has(p-1))){state[k].read.push(p);r.add(p);ch=true}})});return ch}
render=(f=>function(){try{if(fillBlankDays())save()}catch(e){}if(!render.busy){render.busy=true;try{if(autoRepair()){render.busy=false;return render.apply(this,arguments)}}catch(e){console.warn(e)}render.busy=false}const res=f.apply(this,arguments);try{renderRepair()}catch(e){console.warn(e)}try{confRenderCard()}catch(e){console.warn(e)}try{applyPage()}catch(e){}return res})(render);
try{confRenderCard()}catch(e){console.warn(e)}
try{applyAppMode()}catch(e){console.warn(e)}
try{pathFocusSoon();window.addEventListener('load',()=>setTimeout(()=>{const pb=$('pathBox');if(pb&&!pb.dataset.touched&&!pb.dataset.ctouched)pathCenterMe(false)},300))}catch(e){}

/* ---------- «Какой стих затронул?»: после отметки «Прочитал» — короткий вопрос; друзья видят стих в профиле и на пути ----------
   state.notes = [{d:"2026-10-23", k:"nt", p:25, v:"Мф. 10:31", w:"пара слов"}] — новые сверху, не больше 60.
   Спрашиваем один раз в день: если сегодня стих уже записан или нажато «Пропустить» — больше не спрашиваем. */
const NOTE_MAX=60, NOTE_W=1000;
function notesList(){if(!Array.isArray(state.notes))state.notes=[];return state.notes}
function verseAskedToday(m){const t=today();return m?notesList().some(n=>n.d===t&&n.m)||state.msSkip===t:notesList().some(n=>n.d===t&&!n.m)||state.verseSkip===t}
// стихи отрывка для кнопок (число стихов в главах — из BOOKS): «10:26–42», «9:35–10:5», «5:3», «7», «2–4»
function verseChips(book,ref){
  const b=BOOKS.find(x=>x.a===book), vc=b&&b.v||[], n=c=>vc[c-1]||0;
  let c1,v1,c2,v2,m;ref=String(ref||"").replace(/\s+/g,"").replace(/[—−‒-]/g,"–");
  if(m=/^(\d+):(\d+)[–-](\d+):(\d+)$/.exec(ref)){c1=+m[1];v1=+m[2];c2=+m[3];v2=+m[4]}
  else if(m=/^(\d+):(\d+)[–-](\d+)$/.exec(ref)){c1=c2=+m[1];v1=+m[2];v2=+m[3]}
  else if(m=/^(\d+):(\d+)$/.exec(ref)){c1=c2=+m[1];v1=v2=+m[2]}
  else if(m=/^(\d+)[–-](\d+)$/.exec(ref)){c1=+m[1];c2=+m[2];v1=1;v2=n(c2)}
  else if(m=/^(\d+)$/.exec(ref)){c1=c2=+m[1];v1=1;v2=n(c1)}
  else return {ch:null,groups:[]};
  const groups=[];let total=0;
  for(let c=c1;c<=c2&&c-c1<6;c++){const a=c===c1?v1:1,z=c===c2?v2:n(c);if(!z||z<a)continue;const list=[];for(let v=a;v<=z;v++)list.push(c+":"+v);total+=list.length;groups.push({c,list})}
  if(total>150)return {ch:c1,groups:[]};
  return {ch:c1,groups};
}
function normVerse(s,ch){s=String(s||"").replace(/\s+/g,"").replace(/-/g,"–");if(!s)return "";if(/^\d+(–\d+)?$/.test(s)&&ch)return ch+":"+s;return s.slice(0,20)}
function msOf(id){try{const d=id?xDef(id):SCHED.def;return d&&d.ms?msBook(d.ms):null}catch(e){return null}}
function keepText(v){return String(v||"").replace(/\r/g,"").replace(/^\s*\n/,"").replace(/\s+$/,"").slice(0,NOTE_W)}
function askVerse(k,p,x0,xid,man){
  const x=x0||part(k,p);if(!x||!x.book)return;
  if(x.url)return askMinistry(k,p,x,xid,man); // книги служения и Жизнеизучение — «Что затронуло?»
  if(noteToday(k,p,false))return;
  if((!man&&verseAskedToday())||document.querySelector(".fmodal"))return;
  const ref=refStr(x), vc=verseChips(x.book,x.ref), multi=vc.groups.length>1, first=vc.groups[0]&&vc.groups[0].list[0];
  const modal=el("div","fmodal vmodal"),sheet=el("div","fsheet vsheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label","Какой стих затронул?");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};
  const skip=()=>{if(!man){state.verseSkip=today();save()}close()};
  const esc=e=>{if(e.key==="Escape")skip()};document.addEventListener("keydown",esc);
  modal.addEventListener("click",e=>{if(e.target===modal)skip()});
  const head=el("div","vhead");head.append(el("h2",null,"Какой стих затронул?"),el("div","vref",ref));
  const prev=el("div","vprev");prev.hidden=true; // текст выбранного стиха
  const chips=el("div","vchips");let picked="";
  const inp=document.createElement("input");inp.type="text";inp.id="verseIn";inp.className="vin";inp.inputMode="text";inp.autocomplete="off";
  inp.placeholder="Стих, например "+(first||(vc.ch?vc.ch+":1":"3:16"));inp.setAttribute("aria-label","Стих");
  vc.groups.forEach(g=>{if(multi)chips.append(el("span","vchap","Глава "+g.c));
    g.list.forEach(v=>{const b=el("button","vchip",v.split(":")[1]);b.type="button";b.title=x.book+" "+v;b.dataset.v=v;b.addEventListener("click",()=>pickV(v));chips.append(b)})});
  // выбранный стих подсвечен; стрелками в окошке — к соседним стихам (подсветка идёт следом)
  function pickV(v){picked=v;inp.value=v;chips.querySelectorAll(".vchip").forEach(c=>c.classList.toggle("on",c.dataset.v===v));upd();showVerseIn(prev,x.book,v,pickV)}
  inp.addEventListener("input",()=>{picked="";chips.querySelectorAll(".vchip").forEach(c=>c.classList.remove("on"));upd()});
  const ta=document.createElement("textarea");ta.id="verseWords";ta.className="vwords";ta.maxLength=NOTE_W;ta.rows=3;ta.addEventListener("blur",()=>ta.classList.toggle("big",!!ta.value.trim()));ta.placeholder="Пара слов: чем коснулся этот стих (можно не писать)";ta.setAttribute("aria-label","Пара слов");
  const cnt=el("small","hint vcnt","0 / "+NOTE_W);ta.addEventListener("input",()=>{cnt.textContent=ta.value.length+" / "+NOTE_W;upd()});
  const go=el("button","btn-main","Сохранить стих");go.type="button";
  const no=el("button","linkbtn",man?"Закрыть":"Пропустить");no.type="button";no.addEventListener("click",skip);
  function upd(){go.disabled=!inp.value.trim()}
  go.addEventListener("click",()=>{
    const v=normVerse(inp.value,vc.ch);if(!v){inp.focus();return}
    const n={d:today(),k,p,v:x.book+" "+v,w:keepText(ta.value)};
    notesList().unshift(n);state.notes=state.notes.slice(0,NOTE_MAX);save();close();
    try{render()}catch(e){}try{renderPath()}catch(e){}
    const r=go.getBoundingClientRect();try{burst(innerWidth/2,innerHeight-160,40)}catch(e){}
    toast("Стих сохранён — его увидят на пути, в профиле и на глобусе");
  });
  upd();
  const lab=(t,id)=>{const l=el("label","vlab",t);if(id)l.htmlFor=id;return l};
  sheet.append(head);
  if(vc.groups.length)sheet.append(lab("Нажмите на номер стиха — он откроется ниже"),chips,prev);
  if(!vc.groups.length)sheet.append(lab("Впишите стих","verseIn"),inp);
  sheet.append(lab("Пара слов","verseWords"),ta,cnt,go,el("small","hint vwho","Стих виден до конца дня — друзьям и всем на глобусе. Ваши слова — только друзьям."),no);
  modal.append(sheet);document.body.append(modal);
}
const MS_REACT=[["🔥","Зажгло"],["💡","Открылось новое"],["❤️","Тронуло сердце"],["🙏","Помолился"]];
function askMinistry(k,p,x,xid,man){
  if((!man&&verseAskedToday(true))||noteToday(k,p,true)||document.querySelector(".fmodal"))return;
  const B=msOf(xid),bt=B?B.t:(xid?xName(xid):SCHED.name)||"Книга служения",unit=x.book.replace(/,$/,"");
  const modal=el("div","fmodal vmodal"),sheet=el("div","fsheet vsheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label","Что затронуло?");
  const close=()=>{modal.remove();document.removeEventListener("keydown",esc)};
  const skip=()=>{if(!man){state.msSkip=today();save()}close()};
  const esc=e=>{if(e.key==="Escape")skip()};document.addEventListener("keydown",esc);
  modal.addEventListener("click",e=>{if(e.target===modal)skip()});
  const head=el("div","vhead");head.append(el("h2",null,"Что затронуло?"),el("div","vref",bt+" · "+unit+(x.title?" «"+x.title+"»":"")));
  const chips=el("div","vchips vreact");let picked=null;
  MS_REACT.forEach(r=>{const b=el("button","vchip vrc",r[0]+" "+r[1]);b.type="button";b.addEventListener("click",()=>{picked=picked===r?null:r;chips.querySelectorAll(".vchip").forEach(c=>c.classList.toggle("on",c===b&&!!picked));upd()});chips.append(b)});
  const ta=document.createElement("textarea");ta.id="msWords";ta.className="vwords";ta.maxLength=NOTE_W;ta.rows=3;ta.addEventListener("blur",()=>ta.classList.toggle("big",!!ta.value.trim()));ta.placeholder="Мысль или фраза из чтения, которая затронула";ta.setAttribute("aria-label","Что затронуло");
  const cnt=el("small","hint vcnt","0 / "+NOTE_W);ta.addEventListener("input",()=>{cnt.textContent=ta.value.length+" / "+NOTE_W;upd()});
  const go=el("button","btn-main","Сохранить");go.type="button";
  const no=el("button","linkbtn",man?"Закрыть":"Пропустить");no.type="button";no.addEventListener("click",skip);
  function upd(){go.disabled=!picked&&!ta.value.trim()}
  go.addEventListener("click",()=>{
    const t=keepText(ta.value),w=((picked?picked[0]+" "+picked[1]:"")+(picked&&t?" · ":"")+t).slice(0,NOTE_W);if(!w)return;
    const n={d:today(),k,p,m:1,v:bt,r:unit+(x.title?" «"+x.title+"»":""),w};
    notesList().unshift(n);state.notes=state.notes.slice(0,NOTE_MAX);save();close();
    try{render()}catch(e){}try{renderPath()}catch(e){}try{burst(innerWidth/2,innerHeight-160,40)}catch(e){}
    toast("Сохранено — друзья увидят, что вас затронуло");
  });
  upd();
  const lab=(t,id)=>{const l=el("label","vlab",t);if(id)l.htmlFor=id;return l};
  sheet.append(head,lab("Ваша реакция"),chips,lab("Пара слов (можно не писать)","msWords"),ta,cnt,go,el("small","hint vwho","Видно до конца дня — друзьям и всем на глобусе. Ваши слова — только друзьям."),no);
  modal.append(sheet);document.body.append(modal);
}
// показать вопрос, когда на экране нет праздника, сундука и других окон
function askVerseSoon(k,p,delay,x0,xid){
  return; // 08.11: окно больше не всплывает после «Прочитал(а)» — стих отмечают кнопкой «❞ Стих» у отрывка
  const x=x0||part(k,p);if(!x||!x.book||verseAskedToday(!!x.url))return;let tries=0;
  const tick=()=>{if(++tries>80)return;
    const busy=!$("celebrate").hidden||($("chest")&&!$("chest").hidden)||document.querySelector(".fmodal,.bkcel,.celov");
    if(busy)return setTimeout(tick,400);askVerse(k,p,x0,xid)};
  setTimeout(tick,delay||1400);
}
// кнопка у отрывка: «❞ Стих» (книги служения — «❞ Мысль»); у сегодняшнего уже отмеченного — заполненная
function noteToday(){return notesList().some(n=>n&&n.d===today())} // 09.11: делимся одним — стих или мысль, один раз за день
function verseBtn(k,p,x,xid){const ms=!!(x&&x.url),has=noteToday(k,p,ms);
  // 09.11: стих или мысль — один раз в день; после сохранения кнопки серые и не нажимаются, у «своего» отрывка — «✓ Стих»
  if(has){const mine=notesList().some(n=>n&&n.d===today()&&(ms?n.m:!n.m)&&n.k===k&&n.p===p);
    const d=el("button","vbtn off"+(mine?" mine":""));d.type="button";d.disabled=true;d.title="Сегодня вы уже поделились";
    d.setAttribute("aria-label","Сегодня вы уже поделились стихом или мыслью");
    d.append(el("span","vbq",mine?"✓":"❞"),el("span",null,ms?"Мысль":"Стих"));return d}
  const b=el("button","vbtn glow");b.type="button"; // 13.11: пока сегодня ничем не поделились — кнопка мягко светится
  b.setAttribute("aria-label",ms?"Что затронуло в этом чтении":"Отметить стих, который затронул");
  b.append(el("span","vbq","❞"));
  b.append(el("span",null,ms?"Мысль":"Стих"));
  b.addEventListener("click",e=>{e.stopPropagation();askVerse(k,p,x,xid,true)});return b}
const RV={};
function rvBook(book){const sl=SLUG[book];if(!sl)return Promise.reject(new Error("нет книги"));
  if(!RV[sl])RV[sl]=fetch("rv/"+sl+".json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).catch(e=>{delete RV[sl];throw e});return RV[sl]}
function rvText(book,cv){const m=/^(\d+):(\d+)(?:[–-](\d+))?$/.exec(String(cv||"").replace(/\s+/g,""));if(!m)return Promise.reject(new Error("ссылка"));
  return rvBook(book).then(B=>{const ch=B[+m[1]-1]||[],a=+m[2],z=+(m[3]||m[2]),out=[];for(let v=a;v<=z&&v-a<30;v++)if(ch[v-1])out.push([v,ch[v-1]]);if(!out.length)throw new Error("нет стиха");return out})}
// сайт Восстановительного перевода открывается прямо в окошке Огонька, на нужном стихе
function verseUrl(book,cv){const sl=SLUG[book],m=/^(\d+):(\d+)/.exec(cv)||[];return sl?BIBLE+sl+"/"+(m[1]||1)+"/"+(m[2]||1):BIBLE}
function verseNb(book,cv,d){const b=BOOKS.find(x=>x.a===book),vc=b&&b.v||[],m=/^(\d+):(\d+)/.exec(cv);if(!m)return null;let c=+m[1],v=+m[2]+d;
  if(v<1){c--;if(c<1)return null;v=vc[c-1]||1}else if(v>(vc[c-1]||0)){c++;if(c>vc.length)return null;v=1}return c+":"+v}
function fillVerse(box,book,cv,tall,onClose,onGo){box.hidden=false;box.textContent="";const u=verseUrl(book,cv);
  const go=t=>{if(!t)return;if(onGo)onGo(t);else fillVerse(box,book,t,tall,onClose,onGo)};
  const top=el("div","vptop");const pv=verseNb(book,cv,-1),nx=verseNb(book,cv,1);
  const bp=el("button","vpnav","‹ "+(pv?pv.split(":")[1]:""));bp.type="button";bp.disabled=!pv;bp.setAttribute("aria-label","Предыдущий стих");bp.addEventListener("click",e=>{e.stopPropagation();go(pv)});
  const bn=el("button","vpnav",(nx?nx.split(":")[1]:"")+" ›");bn.type="button";bn.disabled=!nx;bn.setAttribute("aria-label","Следующий стих");bn.addEventListener("click",e=>{e.stopPropagation();go(nx)});
  void bp;void bn; // стрелки и подпись убраны по просьбе — сверху только «Закрыть»
  const a=el("button","vpout","Закрыть ✕");a.type="button";
  a.addEventListener("click",e=>{e.stopPropagation();if(onClose)onClose();else{box.hidden=true;box.textContent=""}});top.append(a);box.append(top);
  // шапку сайта («Мф. 15», стрелки, поиск) прячем — фрейм сдвинут вверх внутри рамки
  const fw=el("div","vpfw"+(tall?" tall":""));const fr=document.createElement("iframe");fr.className="vpframe";fr.src=u;fr.title=book+" "+cv;fr.loading="lazy";fr.referrerPolicy="no-referrer";fw.append(fr);box.append(fw)}
function showVerseIn(box,book,cv,onGo){fillVerse(box,book,cv,false,()=>{box.hidden=true;box.textContent="";const sh=box.closest(".vsheet");if(sh)sh.querySelectorAll(".vchip.on").forEach(c=>c.classList.remove("on"))},onGo)}
// окошко со стихом поверх Огонька (из списка стихов в профиле, на пути, у друзей)
function openVerse(ref){const m=/^(.+?)\s+(\d+:\d+(?:[–-]\d+)?)$/.exec(String(ref||"").trim());if(!m)return;
  const modal=el("div","vpopwrap"),box=el("div","vpop");box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");
  const close=()=>modal.remove();
  modal.addEventListener("click",e=>{if(e.target===modal)close()});const body=el("div","vprev");box.append(body);modal.append(box);document.body.append(modal);fillVerse(body,m[1],m[2],true,close)}
// список стихов — для профиля и для окна с пути
function fmtNoteDay(d){const t=today();if(d===t)return "сегодня";if(d===add(t,-1))return "вчера";return parse(d).toLocaleDateString("ru-RU",{day:"numeric",month:"long"})}
function noteItem(n){const li=el("div","vnote");const top=el("div","vntop");
  const vb=el(n.m?"b":"button",n.m?null:"vlink",n.v);if(!n.m){vb.type="button";vb.addEventListener("click",e=>{e.stopPropagation();openVerse(n.v)})}top.append(vb,el("small",null,fmtNoteDay(n.d)));li.append(top);if(n.r)li.append(el("small","vnr",n.r));if(n.w)li.append(el("p",null,"«"+n.w+"»"));return li}
function notesEl(notes,isMe){
  const td=today();notes=Array.isArray(notes)?notes.filter(n=>n&&n.v&&n.d===td).slice(0,1):[]; // только сегодняшний, один — завтра исчезнет
  if(!notes.length&&!isMe)return null;
  const box=el("div","freading vnotes");box.append(el("span","label","Что затронуло сегодня"));
  if(!notes.length)box.append(el("small","hint","После чтения отметьте, что затронуло, — друзья увидят это до конца дня."));
  notes.forEach(n=>box.append(noteItem(n)));
  return box;
}
function openNotes(name,notes){
  const modal=el("div","fmodal"),sheet=el("div","fsheet");sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
  const close=()=>modal.remove();modal.addEventListener("click",e=>{if(e.target===modal)close()});
  const h=el("div","vhead");const x=el("button","fclose","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.addEventListener("click",close);
  const hh=el("div","vheadrow");hh.append(el("h2",null,name),x);h.append(hh,el("div","vref","Что затронуло"));
  sheet.append(h);(notes||[]).slice(0,10).forEach(n=>sheet.append(noteItem(n)));
  modal.append(sheet);document.body.append(modal);x.focus();
}
// стих виден только сегодня (до полуночи) и только последний — как история
function freshNotes(pp){const n=pp.me?notesList():((pathPeople.find(f=>f.id===pp.id)||{}).notes||[]);const t=today();return n.filter(z=>z&&z.v&&z.d===t).slice(0,1)}
function noteBadge(g,pp,x,y){
  const ns=freshNotes(pp);if(!ns.length)return;
  const b=sv("g",{class:"pnote",role:"button","aria-label":"Стих, который затронул"});
  b.append(sv("circle",{cx:x+14,cy:y-14,r:9.5}),sv("text",{x:x+14,y:y-9.5,"text-anchor":"middle"},"❞"));
  b.append(sv("title",{},(pp.me?"Ваш стих: ":(pp.name||"")+": ")+ns[0].v));
  b.addEventListener("click",e=>{e.stopPropagation();openNotes(pp.me?"Ваш стих сегодня":(pp.name||"Друг"),ns)});
  g.append(b);
}

// пока открыт глобус: нижняя панель видна, кнопка-глобус подсвечена, остальные — нет
function globeWatch(){
  if(globeWatch.done)return;globeWatch.done=true;
  const upd=()=>{const open=!!document.querySelector(".gmodal");document.body.classList.toggle("globe-open",open);
    const nav=$("botNav");if(!nav)return;document.documentElement.style.setProperty("--navh",nav.offsetHeight+"px");
    nav.querySelectorAll(".bn").forEach(b=>{const g=b.classList.contains("bnglobe");b.classList.toggle("on",open?g:(!g&&b.getAttribute("aria-label")===((PAGES_SPB.find(x=>x[0]===curPage)||[])[2])))})};
  new MutationObserver(upd).observe(document.body,{childList:true});upd();
}
/* ---------- книга дочитана: праздник с открывающейся книгой и полкой ---------- */
function bkSnap(){const s=new Set();try{booksFinished().forEach(x=>s.add(x.a+"@"+x.d+"@"+x.plan))}catch(e){}try{msShelf().forEach(o=>{if(o.full)s.add("ms@"+o.id)})}catch(e){}return s}
function bkCheck(before){let fin=[],ms=[];
  try{fin=booksFinished().filter(x=>!before.has(x.a+"@"+x.d+"@"+x.plan))}catch(e){}
  try{ms=msShelf().filter(o=>o.full&&!before.has("ms@"+o.id))}catch(e){}
  // отменили и снова отметили в тот же день — праздник книги второй раз не показываем
  {const T0=today();if(!state.bkCel||state.bkCel.d!==T0)state.bkCel={d:T0,k:[]};const BC=state.bkCel.k;
    fin=fin.filter(x=>!BC.includes("b@"+x.a));ms=ms.filter(o=>!BC.includes("ms@"+o.id));
    fin.forEach(x=>BC.push("b@"+x.a));ms.forEach(o=>BC.push("ms@"+o.id));if(fin.length||ms.length)try{save()}catch(e){}}
  const q=[];const seen=new Set();
  fin.forEach(x=>{if(seen.has(x.a))return;seen.add(x.a);q.push({bible:x.a})});
  ms.forEach(o=>q.push({ms:o}));
  if(!q.length)return;let tries=0;
  const tick=()=>{if(++tries>120)return;
    const busy=!$("celebrate").hidden||($("chest")&&!$("chest").hidden)||document.querySelector(".fmodal,.celov,.bkcel");
    if(busy)return setTimeout(tick,400);const o=q.shift();bookCelebrate(o,()=>{if(q.length)setTimeout(tick,500)})};
  setTimeout(tick,900);
}
function bookCelebrate(o,after){
  let title,kind,sub,cover,initials,shelf=[],stats=[],word;
  if(o.bible){const b=BOOK[o.bible]||{n:o.bible,v:[],t:"nt"},have=new Set(booksSummary().map(x=>x[0])),idx=BOOKS.findIndex(x=>x.a===o.bible);
    title=b.n;kind="Книга Библии прочитана!";initials=b.n.replace(/^Евангелие по /,"По ");cover=b.t==="ot"?["#7a3f1f","#b5703a"]:["#1f3a78","#3f67b8"];
    const n=have.size;sub="Книга "+(have.has(o.bible)?n:n+1)+" из 66 на вашей полке";word="";
    const ch=b.v.length,vv=b.v.reduce((a,c)=>a+c,0);const tot=BOOKS.reduce((a,x)=>a+x.v.reduce((q,c)=>q+c,0),0),rdv=BOOKS.filter(x=>have.has(x.a)||x.a===o.bible).reduce((a,x)=>a+x.v.reduce((q,c)=>q+c,0),0),pc=Math.max(1,Math.round(rdv/tot*100));
    stats=[[ch,plural(ch,"глава","главы","глав")],[vv,plural(vv,"стих","стиха","стихов")],[pc,"% Библии"]];
    shelf=BOOKS.map((x,i)=>({on:have.has(x.a)||i===idx,me:i===idx,ot:x.t==="ot"}));
  }else{const m=o.ms,B=m.B;title=B.t;kind=B.k==="ls"?"Жизнеизучение прочитано!":"Книга служения прочитана!";const ls=B.k==="ls";initials=ls?"ЖИ":"";cover=ls?["#173f2b","#2e7a4f"]:["#6d1f2c","#a3343f"];
    const all=msShelf().filter(x=>x.full),n=Math.max(1,all.length+(all.some(x=>x.id===m.id)?0:1));sub=(B.a?B.a+" · ":"")+(n>1?n+"-я прочитанная книга служения":"первая прочитанная книга служения");
    const days=m.first&&m.last?Math.max(1,dayNo(m.last)-dayNo(m.first)+1):0;
    stats=[[m.total,B.k==="ls"?plural(m.total,"сообщение","сообщения","сообщений"):plural(m.total,"глава","главы","глав")],...(days?[[days,plural(days,"день","дня","дней")]]:[]),[n,n===1?"книга":plural(n,"книга","книги","книг")]];
    shelf=Array.from({length:Math.max(8,n+3)},(_,i)=>({on:i<n,me:i===n-1,ms:true}));
  }
  const ov=el("div","bkcel");ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label",kind);
  ov.style.setProperty("--c1",cover[0]);ov.style.setProperty("--c2",cover[1]);
  const rays=el("div","bkrays"),glow=el("div","bkglow"),cv=document.createElement("canvas");cv.className="bkdust";
  const stage=el("div","bkstage"),book=el("div","bkbook");
  const back=el("div","bkback"),pages=el("div","bkpages"),light=el("div","bklight");
  for(let i=0;i<4;i++){const pg=el("div","bkpg");pg.style.animationDelay=(1.25+i*.16)+"s";pages.append(pg)}
  const cov=el("div","bkcover");const cf=el("div","bkcf"),cb=el("div","bkcb");
  const ib=el("b",(initials||"").length>6?"long":null,initials||"✦");cf.append(el("span","bkcross","✦"),ib,el("i",null,o.bible||title.length>22||initials===title?"":title));cov.append(cf,cb);
  const rp=el("div","bkrp");rp.append(el("b",null,"✦"),el("span",null,o.bible?"Конец книги":"Конец"));book.append(back,pages,rp,light,cov);stage.append(book);
  const txt=el("div","bktxt");
  txt.append(el("div","bkk",kind),el("h2",null,title),el("div","bksub",sub));
  const st=el("div","bkstats");stats.forEach(([v,l],i)=>{const c=el("div");c.style.animationDelay=(2.3+i*.12)+"s";const bnum=el("b",null,"0");bnum.dataset.v=v;if(l[0]==="%"){bnum.dataset.s="%";l=l.slice(2)}c.append(bnum,el("span",null,l));st.append(c)});
  const sh=el("div","bkshelf"+(o.ms?" ms"+(o.ms.B.k==="ls"?" ls":""):""));shelf.forEach(x=>{const s=el("i",(x.on?"on":"")+(x.me?" me":"")+(x.ot?" ot":""));sh.append(s)});
  const go=el("button","btn-main bkgo","Поставить на полку 📚");go.type="button";
  const nx=el("button","linkbtn bknext","Продолжить чтение");nx.type="button";
  txt.append(st,sh,go,nx);
  ov.append(rays,glow,cv,stage,txt);document.body.append(ov);
  vibrate([30,60,30,60,80]);
  // золотая пыль поднимается из открытой книги
  let alive=true;const dpr=Math.min(2,window.devicePixelRatio||1),g=cv.getContext("2d");
  const fit=()=>{cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;g.setTransform(dpr,0,0,dpr,0,0)};fit();
  const P=[];const t0=performance.now();
  (function frame(now){if(!alive)return;const t=(now-t0)/1000;g.clearRect(0,0,innerWidth,innerHeight);
    const r=book.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.45;
    if(t>1.1&&!matchMedia("(prefers-reduced-motion: reduce)").matches){const k=t<2?7:2;for(let i=0;i<k;i++)P.push({x:cx+(Math.random()-.5)*r.width*.9,y:cy+(Math.random()-.5)*20,vx:(Math.random()-.5)*.8,vy:-(1+Math.random()*2.6),r:.8+Math.random()*2.4,l:1,h:Math.random()<.25?"255,255,255":Math.random()<.5?"255,214,120":"255,170,60"})}
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.x+=p.vx+Math.sin((now/400)+i)*.25;p.y+=p.vy;p.vy*=.995;p.l-=.009;if(p.l<=0){P.splice(i,1);continue}
      g.globalAlpha=p.l;g.fillStyle="rgba("+p.h+",1)";g.shadowColor="rgba(255,190,90,.9)";g.shadowBlur=8;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()}
    requestAnimationFrame(frame)})(t0);
  // салют, когда книга раскрывается
  setTimeout(()=>{try{const r=book.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height*.4,110,["#ffc53d","#ffe08a","#fff","#ff9f43",cover[1]])}catch(e){}},1150);
  setTimeout(()=>{try{const m=sh.querySelector(".me");if(m){const r=m.getBoundingClientRect();burst(r.left+r.width/2,r.top,40,["#ffc53d","#fff","#ffe08a"],true)}}catch(e){}},3300);
  // счётчики
  setTimeout(()=>st.querySelectorAll("b").forEach(b=>{const v=+b.dataset.v,s=performance.now();(function f(n){const k=Math.min(1,(n-s)/900),e=1-Math.pow(1-k,3);b.textContent=Math.round(v*e)+(b.dataset.s||"");if(k<1)requestAnimationFrame(f)})(s)}),2300);
  const close=then=>{alive=false;ov.classList.add("out");setTimeout(()=>{ov.remove();if(then)then();if(after)after()},350)};
  go.addEventListener("click",()=>close(()=>{try{setPage("awards")}catch(e){}openBooks()}));
  nx.addEventListener("click",()=>close());
  addEventListener("resize",fit,{once:true});
}
window.ogSetPage=p=>setPage(p);
window.ogOpenEditor=(kind,E,cb,onClose)=>{window.__planPick=cb;window.__planPickClosed=onClose||null;openPlans(kind==="ms"?"ms":"custom",E||undefined)};
window.ogBooks=()=>({books:BOOKS.map(b=>({a:b.a,n:b.n,t:b.t,s:b.s,c:b.v.length})),sections:SECTIONS});
window.ogPlanAdd=d=>{if(state.myScheds&&JSON.stringify(state.myScheds[d.id])===JSON.stringify(d)&&state.extra&&state.extra[d.id])return;state.myScheds=state.myScheds||{};state.myScheds[d.id]=d;state.plans=state.plans||{};const o=state.plans[d.id];if(!o||JSON.stringify(o.def)!==JSON.stringify(d))state.plans[d.id]={nt:{log:[],read:[]},ot:{log:[],read:[]},frzDays:[],def:d};state.extra=state.extra||{};state.extra[d.id]=true;state.planChosen=true;save();render()};
window.ogPlanRemove=id=>{if(state.extra&&state.extra[id]){delete state.extra[id];save();render()}};
window.ogPlanPreview=d=>{try{const S=buildSched(d);return {sum:schedSummary(S),first:S.keys.map(k=>refStr(part2(S,k,0))).filter(Boolean).join(" и ")}}catch(e){return null}};
window.ogPlanToday=id=>{try{const S=xS(id);if(!S)return null;const refs=[],urls=[];let done=0,need=0;S.keys.forEach(k=>{const td=xToday(id,k);const p=td.length?td[0].p:xNext(id,k);if(p>=S.plan.length)return;const x=part2(S,k,p);if(!x.book)return;need++;if(td.length)done++;refs.push(refStr(x));urls.push(x.url?x.url:chapterUrl(x))});return {refs,urls,done:need>0&&done===need,any:done>0,rest:need===0}}catch(e){return null}};
window.ogRefresh=()=>{try{render()}catch(e){}};
window.ogPlanMark=id=>{const S=xS(id);if(!S)return;S.keys.forEach(k=>{if(xToday(id,k).length)return;const p=xNext(id,k);if(p<S.plan.length&&part2(S,k,p).book)xMark(id,k,p)})};
window.ogPlanNext=id=>{try{const S=xS(id);if(!S)return null;const refs=[],urls=[];S.keys.forEach(k=>{const p=xNext(id,k);if(p>=S.plan.length)return;const x=part2(S,k,p);if(!x.book)return;refs.push(refStr(x));urls.push(x.url?x.url:chapterUrl(x))});return refs.length?{refs,urls}:null}catch(e){return null}};
window.ogPlanMarkNext=id=>{const S=xS(id);if(!S)return;S.keys.forEach(k=>{const p=xNext(id,k);if(p<S.plan.length&&part2(S,k,p).book)xMark(id,k,p)})};
window.ogPlanUndo=id=>{const S=xS(id);if(!S)return;S.keys.forEach(k=>{if(xToday(id,k).length)xUndo(id,k)})};
window.ogChurchMark=()=>{KEYS.forEach(k=>{if(!(state[k].log||[]).some(l=>l.d===today())&&nextP(k)<DAYS)complete(k)})};
window.ogChurchUndo=()=>{KEYS.forEach(k=>{(state[k].log||[]).filter(l=>l.d===today()).map(l=>l.p).forEach(p=>unmark(k,p))})};
window.ogChurch=()=>{if(!churchOn())enableChurch()};
window.ogChurchToday=()=>{const r=[],u=[];let any=false;KEYS.forEach(k=>{const t=(state[k].log||[]).filter(l=>l.d===today());const p=t.length?t[0].p:nextP(k);if(p>=DAYS)return;if(t.length)any=true;r.push(refStr(part(k,p)));u.push(chapterUrl(part(k,p)))});return {refs:r,urls:u,any}};
window.ogAskVerse=()=>{if(state.verseSkip===today())state.verseSkip="";const k=KEYS.find(k=>(state[k].log||[]).some(l=>l.d===today()))||KEYS[0];const l=(state[k].log||[]).filter(l=>l.d===today()).pop();askVerse(k,l?l.p:nextP(k))};
window.Ogonek={
  notesEl, openNotes, photoZoom, ntNew, openNotify, ico:icoEl, ntLoad, ntHours, ntText,
  summary, today, dayLabel, plural, daysWord, DAYS, KEYS, FLAME, burst, vibrate,
  refOf:(k,p)=>refStr(part(k,p)), urlOf:(k,p)=>chapterUrl(part(k,p)),
  // отрывок друга по его расписанию (если он на общем церковном или на том же, что и вы)
  refOfPlan:(id,k,p)=>{const P=id===SCHED.id?PLAN:id==="spb"?PLAN_SPB:null;if(!P)return "";const d=P[Math.max(0,Math.min(p,P.length-1))];return d[T[k].bi]?refStr({book:d[T[k].bi],ref:d[T[k].ri]}):""},
  urlOfRef:(ref)=>{const book=Object.keys(SLUG).sort((a,b)=>b.length-a.length).find(b=>ref.startsWith(b+" "));return book?chapterUrl({book,ref:ref.slice(book.length).trim()}):""},
  urlOfPlan:(id,k,p)=>{const P=id===SCHED.id?PLAN:id==="spb"?PLAN_SPB:null;if(!P)return "";const d=P[Math.max(0,Math.min(p,P.length-1))];return d[T[k].bi]?chapterUrl({book:d[T[k].bi],ref:d[T[k].ri]}):""},
  onSave:null,
  setPathPeople(list){pathPeople=list||[];renderPath();try{renderConfFriendsCard();renderChallenges()}catch(e){}},
  onPersonClick:null,
  medal(id,size){const a=AWARDS.find(x=>x.id===id);return a?{svg:medalSvg(a,size||40),name:a.name,desc:a.desc}:null},
  setMyPhoto(url){state.photo=url||"";renderPath()},
  fresh, score,
  getState:()=>JSON.parse(JSON.stringify(state)),
  setState(s){state=migrate(s);initSeen();try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}
    if(((state.schedDef&&state.schedDef.id)||"spb")!==SCHED.id){let n=0;try{n=+sessionStorage.getItem("ogonek-sched-reload")||0;sessionStorage.setItem("ogonek-sched-reload",String(n+1))}catch(e){}if(n<2){location.reload();return}}
    const u=applyFreezes();render();if(u)toast("Заморозка сохранила вашу серию");},
  setRemote(fn){remoteSave=fn},
  progressLoaded(){window.__ogLoaded=true;try{applyNoPlan()}catch(e){}setTimeout(()=>{try{churchRepair()}catch(e){}},60)},
  openPlans:()=>openPlans(), openFinished:(list,who)=>openFinished(list,who), finishedCount:()=>(state.finished||[]).length, openPlanEditor:()=>openPlanEditor(), myPlansCount:()=>myPlanList().length, openBooks:(list,who)=>openBooks(list,who), booksCount:()=>booksSummary().length, planId:SCHED.id, planName:SCHED.name, keysAll:["nt","ot"],
  toast
};

})();
