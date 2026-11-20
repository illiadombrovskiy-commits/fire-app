window.OgonekReadingProgress=(function(){
function create({getState,KEYS,DAYS,WD,PLAN_START,today,add,dayNo,isOffDay,part,dueBy,todayP,save}){
const datesOf=k=>new Set(getState()[k].log.map(x=>x.d));
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
  KEYS.forEach(k=>addLog(getState()[k].log));
  try{Object.values(getState().plans||{}).forEach(p=>["nt","ot"].forEach(k=>p&&p[k]&&addLog(p[k].log)))}catch(e){}
  const t=today(),key=t+"|"+JSON.stringify(cnt)+"|"+(getState().frzDays||[]).length+"|"+(getState().hist||[]).length;if(key===_rpK)return _rpV;
  const lit=new Set(Object.keys(cnt).concat(getState().hist||[])),days=[...lit].sort();const paid=new Set();
  if(days.length){const base=new Set(getState().frzDays||[]);let q=[],run=[],dead=false,d=days[0];
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
function withFrozen(set){const s=new Set(set);getState().frzDays.forEach(d=>s.add(d));try{repaidDays().forEach(d=>s.add(d))}catch(e){}
  if(WD){let d=PLAN_START<today()?PLAN_START:today();const t=today();while(d<=t){if(isOffDay(d))s.add(d);d=add(d,1)}} // выходные дни расписания не прерывают серию
  return s}
function streakOf(set){let cur=today();if(!set.has(cur))cur=add(cur,-1);let n=0;while(set.has(cur)){n++;cur=add(cur,-1)}return n}
// серия дней растёт, если в день прочитан хотя бы один завет (горит хотя бы маленький огонёк)
function anySet(){const s=new Set(KEYS.flatMap(k=>[...datesOf(k)]).concat(getState().hist||[]));
  try{Object.values(getState().plans||{}).forEach(p=>["nt","ot"].forEach(k=>((p&&p[k]&&p[k].log)||[]).forEach(x=>s.add(x.d))));((getState().conf&&getState().conf.log)||[]).forEach(x=>s.add(x.d))}catch(e){}
  return s}
const streak=k=>streakOf(withFrozen(k?datesOf(k):anySet()));
/* заморозки = на сколько дней вы впереди плана (по обоим заветам).
   Пропущенный день сохраняет серию, если к концу этого дня оба завета были прочитаны по плану включительно. */
/* заморозки = на сколько дней вы впереди плана (по обоим заветам).
   Пропущенный день сохраняет серию, если к концу этого дня оба завета были прочитаны по плану включительно. */
const planIdx=d=>dueBy(d)-1;
function readBy(k,d){return getState()[k].log.filter(x=>x.d<=d).length}
function freezesNow(){const t=today(),tp=Math.max(0,todayP());
  // сегодняшний отрывок считается «должным», только когда вы уже читали сегодня — так число не прыгает в течение дня
  return Math.max(0,Math.min(...KEYS.map(k=>getState()[k].log.length-Math.min(DAYS,tp+(datesOf(k).has(t)?1:0)))))}
function coveredDay(d){const due=Math.min(DAYS,planIdx(d)+1);return due>0&&KEYS.every(k=>readBy(k,d)>=due)}
function applyFreezes(){
  const s=withFrozen(anySet());if(!s.size)return 0;
  const last=[...s].sort().pop(), y=add(today(),-1);
  if(last>=y)return 0;
  const gap=[];let d=add(last,1);while(d<=y){gap.push(d);d=add(d,1)}
  if(gap.every(coveredDay)){getState().frzDays.push(...gap);save();return gap.length}
  return 0;
}
function level(xp){let k=1;while(xp>=50*k*(k+1))k++;const lo=50*(k-1)*k,hi=50*k*(k+1);return {k,pct:(xp-lo)/(hi-lo)*100}}


return {datesOf,keyHasPart,activeKeys,bothSet,repaidDays,streakGap,withFrozen,streakOf,anySet,streak,planIdx,readBy,freezesNow,coveredDay,applyFreezes,level,REPAIR_WIN,REPAIR_MAX};
}
return {create};
})();
