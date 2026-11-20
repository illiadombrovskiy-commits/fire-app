window.OgonekStateSchema=(function(){
const {today}=window.OgonekDates;
const ABBR_FIX={"Еф.":"Эф.","Есф.":"Эсф.","Еккл.":"Эккл.","Руф.":"Руфь"};
function fixAbbr(s){if(Array.isArray(s))return s.map(fixAbbr);if(s&&typeof s==="object"){for(const k in s)s[k]=fixAbbr(s[k]);return s}return typeof s==="string"&&ABBR_FIX[s]?ABBR_FIX[s]:s}
function create(KEYS){
function fresh(){return {v:3,start:today(),nt:{log:[],read:[]},ot:{log:[],read:[]},xp:0,frz:0,frzDays:[],best:0,answers:{},quiz:{},gems:{n:0,step:0,used:[],tests:0,perfect:0}}}
function migrate(s){
  if(!s||typeof s!=="object")return fresh();
  s=fixAbbr(s);
  if(s.v===3){const f=Object.assign(fresh(),s);f.gems=Object.assign(fresh().gems,s.gems||{});return f}
  if(s.v===2){const f=Object.assign(fresh(),s);f.v=3;KEYS.forEach(k=>{const log=(s[k]&&s[k].log)||[];f[k]={log,read:[...new Set(log.map(x=>x.p))]}});return f}
  if(s.v===1){ // old format: one mark per day for both testaments
    const log=(s.comp||[]).map(c=>({d:c.d,p:c.p}));
    const read=log.map(x=>x.p);
    return Object.assign(fresh(),{start:s.start||today(),nt:{log:log.slice(),read:read.slice()},ot:{log:log.slice(),read:read.slice()},xp:s.xp||0,frz:s.frz||0,frzDays:s.frzDays||[],best:s.best||0});
  }
  return fresh();
}
return {fresh,migrate};
}
return {fixAbbr,create};
})();
