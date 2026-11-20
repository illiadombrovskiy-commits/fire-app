window.OgonekDates=(function(){
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function parse(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function add(s,n){const d=parse(s);d.setDate(d.getDate()+n);return iso(d)}
const today=()=>iso(new Date());
function dayNo(s){return Math.round(parse(s).getTime()/864e5)}
function plural(n,one,few,many){const a=n%10,b=n%100;if(a===1&&b!==11)return one;if(a>=2&&a<=4&&(b<12||b>14))return few;return many}
const daysWord=n=>plural(n,"день","дня","дней");
return {iso,parse,add,today,dayNo,plural,daysWord};
})();
