window.OgonekBibleVerses=(function(){
const {BOOKS}=window.OgonekBibleSchedule;
function create(SLUG,BIBLE){
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
function verseUrl(book,cv){const sl=SLUG[book],m=/^(\d+):(\d+)/.exec(cv)||[];return sl?BIBLE+sl+"/"+(m[1]||1)+"/"+(m[2]||1):BIBLE}
function verseNb(book,cv,d){const b=BOOKS.find(x=>x.a===book),vc=b&&b.v||[],m=/^(\d+):(\d+)/.exec(cv);if(!m)return null;let c=+m[1],v=+m[2]+d;
  if(v<1){c--;if(c<1)return null;v=vc[c-1]||1}else if(v>(vc[c-1]||0)){c++;if(c>vc.length)return null;v=1}return c+":"+v}

return {verseChips,normVerse,verseUrl,verseNb};
}
return {create};
})();
