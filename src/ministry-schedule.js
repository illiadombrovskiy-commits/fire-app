
/* Книги служения (ministrybooks.online): оглавления — номер страницы (part) начала каждого сообщения/главы и последняя страница книги */
var MSB=window.MSB||{ls:[],other:[],cats:[],toc:{}}; // каталог книг служения — в data.js (если файл не загрузился — пустой, приложение работает)
/* ---------- Книги служения: Жизнеизучение и другие книги с ministrybooks.online ----------
   Сообщение (или глава) — несколько страниц сайта (?mb=ID&part=N, ~5 минут чтения каждая).
   Темп задаётся «сообщений в неделю». Неделя — по календарю, с понедельника по воскресенье.
   Дни недели делятся между сообщениями по числу страниц (одно сообщение — подряд идущие дни, день не захватывает два сообщения);
   по желанию последний день недели — повторение: перечитать главное из сообщений этой недели. */
const MS_URL="https://ministrybooks.online/?mb=", MS_MIN=5; // ~минут на страницу
function msDow(s){const [y,m,d]=s.split("-").map(Number);return (new Date(y,m-1,d).getDay()+6)%7} // 0 = понедельник
function msBook(id){return MSB.toc[String(id)]||null}
function msUnits(B){return B.m.map((x,i)=>({n:i+1,p0:x[0],pages:Math.max(1,(i+1<B.m.length?B.m[i+1][0]:B.last+1)-x[0]),title:x[1]}))}
function msWord(B){return B.k==="ls"?"сообщ.":"гл."}
function msPlan(d){
  const B=msBook(d.ms);if(!B)throw new Error("нет оглавления");
  // wd — дни чтения: 7 флажков с понедельника; без них — каждый день
  const wd=Array.isArray(d.wd)&&d.wd.some(Boolean)?d.wd.map(Boolean):[1,1,1,1,1,1,1].map(Boolean),K=wd.filter(Boolean).length;
  const id=d.ms, w=msWord(B), U=msUnits(B).slice(Math.max(0,(+d.from||1)-1)), pw=Math.max(1,Math.min(K,+d.pw||2)), rev=false;
  const row=(u,a,b,k)=>[(B.k==="ls"?"Сообщ. ":"Гл. ")+u.n+",","стр. "+(u.p0+a)+(b-a>1?"–"+(u.p0+b-1):"")+(k===1&&u.pages>1?" (целиком)":""),"","",MS_URL+id+"&part="+(u.p0+a),u.title,u.n];
  // одна неделя: days дней чтения, сообщения grp; rd — последний день недели для повторения
  const week=(grp,days,rd)=>{const out=[];
    rd=rd&&days>grp.length?1:0;const md=days-rd,tot=grp.reduce((s,u)=>s+u.pages,0);
    const k=grp.map(u=>Math.max(1,Math.min(u.pages,Math.floor(u.pages/tot*md))));let left=md-k.reduce((a,b)=>a+b,0);
    while(left>0){let bi=-1,bv=0;grp.forEach((u,j)=>{if(k[j]<u.pages&&u.pages/k[j]>bv){bv=u.pages/k[j];bi=j}});if(bi<0)break;k[bi]++;left--}
    while(left<0){let bi=-1;k.forEach((x,j)=>{if(x>1&&(bi<0||x>k[bi]))bi=j});if(bi<0)break;k[bi]--;left++}
    grp.forEach((u,j)=>{for(let q=0;q<k[j];q++)out.push(row(u,Math.floor(q*u.pages/k[j]),Math.floor((q+1)*u.pages/k[j]),k[j]))});
    // лишние дни (страниц меньше, чем дней) — без чтения
    for(let r=0;r<Math.max(0,left);r++)out.push(["","","","","","",0]);
    return out};
  if(d.by==="pages"||d.by==="end"){
    // поровну по страницам: каждый день читаем ppd страниц, один день не захватывает два сообщения
    const P=[];U.forEach(u=>{for(let q=0;q<u.pages;q++)P.push([u,q])});
    const dw0=msDow(d.start),isRd=o=>wd[(dw0+o)%7];
    const build=ppd=>{const plan=[],REST=["","","","","","",0];let i=0,o=0,a=0;
      while(i<U.length&&o<20000){
        if(!isRd(o)){plan.push(REST);o++;continue}
        const u=U[i],bb=Math.min(u.pages,a+ppd);
        plan.push(row(u,a,bb,a===0&&bb===u.pages?1:2));
        if(bb>=u.pages){i++;a=0}else a=bb;
        o++}
      return plan};
    if(d.by==="end"&&d.end){const x=d.start.split("-").map(Number),y=d.end.split("-").map(Number);
      const days=Math.round((new Date(y[0],y[1]-1,y[2])-new Date(x[0],x[1]-1,x[2]))/864e5)+1;let rd=0;for(let o=0;o<days;o++)if(isRd(o))rd++;
      // сообщений больше, чем дней чтения — по нескольку целых сообщений в день, поровну по страницам
      if(U.length>rd){const plan=[],REST=["","","","","","",0],tot=P.length;let i=0,o=0,dn=0,acc=0;
        while(i<U.length&&o<20000){if(!isRd(o)){plan.push(REST);o++;continue}
          dn++;const goal=Math.round(tot*dn/rd),j0=i;
          while(i<U.length&&(i===j0||acc+U[i].pages<=goal)){acc+=U[i].pages;i++}
          const u1=U[j0],u2=U[i-1];
          plan.push([(B.k==="ls"?"Сообщ. ":"Гл. ")+u1.n+(u2.n>u1.n?"–"+u2.n:"")+",","стр. "+u1.p0+"–"+(u2.p0+u2.pages-1),"","",MS_URL+id+"&part="+u1.p0,u1.title,u1.n]);o++}
        return plan}
      // сколько страниц в день нужно, чтобы успеть к дате (один день не захватывает два сообщения)
      let ppd=Math.max(1,Math.ceil(P.length/Math.max(1,rd))),plan=build(ppd);
      while(plan.length>days&&ppd<P.length){ppd++;plan=build(ppd)}
      return plan}
    return build(Math.max(1,+d.ppd||5));
  }
  // недели по календарю (пн–вс); в каждой — только выбранные дни; в остальные дни строка пустая (отдых)
  const plan=[],REST=["","","","","","",0];let i=0,off=0,dw=msDow(d.start),first=true;
  while(i<U.length&&off<20000){
    const len=7-dw,slots=[];for(let q=0;q<len;q++)if(wd[dw+q])slots.push(off+q); // индексы дней чтения в этой неделе
    let m=pw,days=slots.length,extra=[];
    if(first&&len<7){m=Math.round(pw*days/K);
      if(!m&&i<U.length){ // пара дней до воскресенья — присоединяем к следующей неделе
        for(let q=0;q<7;q++)if(wd[q])extra.push(off+len+q);days+=extra.length;m=Math.round(pw*days/K)}}
    const all=slots.concat(extra);
    if(all.length){m=Math.max(1,Math.min(U.length-i,m||1));const grp=U.slice(i,i+m),full=m===pw||first;
      const n=full?all.length:Math.max(grp.length,Math.min(all.length,Math.ceil(K*grp.length/pw)));
      const rows=week(grp,Math.min(n,all.length),rev&&n>grp.length&&!(first&&len<7&&n<3));rows.forEach((r,q)=>{const at=all[q];while(plan.length<at)plan.push(REST);plan.push(r)});i+=m}
    off+=len+(extra.length?7:0);dw=0;first=false}
  return plan;
}
function buildMs(d){
  const B=msBook(d.ms),plan=msPlan(d);
  return {id:d.id,def:d,spb:false,ms:true,name:d.name||B.t,start:d.start,plan,keys:["nt"],labels:{nt:"Чтение",ot:""},short:{nt:"Чтение",ot:""},wd:null,dates:null};
}
