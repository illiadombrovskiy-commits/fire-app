window.OgonekSounds=(function(){
// level 1 = one testament lit, 2 = common flame lit
/* звук огонька: синтезируем WAV прямо в браузере и играем через <audio>.
   Так звук слышен и на iPhone с выключенным звонком (Web Audio там молчит). */
const fireWav={};
function makeFireWav(level){
  const sr=22050, dur=level===2?1.4:0.9, n=Math.floor(sr*dur), pcm=new Float32Array(n);
  let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647*2-1};
  // вспышка: шум, «раскрывающийся» вверх (простой фильтр с растущей частотой)
  let lp=0, prev=0;
  for(let i=0;i<Math.floor(sr*0.5);i++){const t=i/sr, env=Math.min(1,t/0.03)*Math.pow(Math.max(0,1-t/0.5),2);
    const a=Math.min(0.9,0.05+t*1.6); lp+=a*(rnd()-lp); const hp=lp-prev; prev=lp; pcm[i]+=hp*env*0.9}
  // тёплый звон
  const notes=level===2?[523.25,659.25,783.99,1046.5]:[587.33,880];
  notes.forEach((f,k)=>{const st=Math.floor(sr*(0.08+k*0.09)), len=Math.floor(sr*(level===2?1.1:0.7));
    for(let i=0;i<len&&st+i<n;i++){const t=i/sr, env=Math.min(1,t/0.02)*Math.exp(-t*(level===2?3.2:4.5));
      const ph=2*Math.PI*f*t, tri=(2/Math.PI)*Math.asin(Math.sin(ph)); pcm[st+i]+=tri*env*0.28}});
  let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(pcm[i]));
  const gain=(level===2?0.9:0.75)/(peak||1), buf=new ArrayBuffer(44+n*2), v=new DataView(buf);
  const w=(o,str)=>{for(let i=0;i<str.length;i++)v.setUint8(o+i,str.charCodeAt(i))};
  w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,pcm[i]*gain))*32767,true);
  return URL.createObjectURL(new Blob([buf],{type:"audio/wav"}));
}
/* звук заморозки: хрустальный перезвон (высокие колокольчики + «иней») */
function makeIceWav(){
  const sr=22050, dur=1.6, n=Math.floor(sr*dur), pcm=new Float32Array(n);
  let seed=11; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647*2-1};
  // мягкое «шуршание инея»: тихий высокочастотный шум
  let prev=0;for(let i=0;i<Math.floor(sr*0.45);i++){const t=i/sr,env=Math.min(1,t/0.05)*Math.pow(1-t/0.45,2);const r=rnd();pcm[i]+=(r-prev)*env*0.12;prev=r}
  // колокольчики: восходящее арпеджио, у каждого звона — чистый тон + обертон и лёгкое «мерцание»
  const notes=[1318.5,1661.2,1975.5,2637.0];
  notes.forEach((f,k)=>{const st=Math.floor(sr*(0.05+k*0.11)), len=Math.floor(sr*1.1);
    for(let i=0;i<len&&st+i<n;i++){const t=i/sr, env=Math.min(1,t/0.004)*Math.exp(-t*4.2), trem=1+0.15*Math.sin(2*Math.PI*7*t);
      pcm[st+i]+=(Math.sin(2*Math.PI*f*t)+0.35*Math.sin(2*Math.PI*f*2.76*t)*Math.exp(-t*9))*env*trem*0.22}});
  let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(pcm[i]));
  const gain=0.8/(peak||1), buf=new ArrayBuffer(44+n*2), v=new DataView(buf);
  const w=(o,str)=>{for(let i=0;i<str.length;i++)v.setUint8(o+i,str.charCodeAt(i))};
  w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,pcm[i]*gain))*32767,true);
  return URL.createObjectURL(new Blob([buf],{type:"audio/wav"}));
}
function iceSound(){
  try{
    try{if(navigator.audioSession)navigator.audioSession.type="playback"}catch(e){}
    if(!fireWav.ice)fireWav.ice=makeIceWav();
    const a=new Audio(fireWav.ice); const pr=a.play(); if(pr&&pr.catch)pr.catch(()=>{});
  }catch(e){}
}
function fireSound(level){
  try{
    try{if(navigator.audioSession)navigator.audioSession.type="playback"}catch(e){}
    if(!fireWav[level])fireWav[level]=makeFireWav(level);
    const a=new Audio(fireWav[level]); a.volume=1; const pr=a.play(); if(pr&&pr.catch)pr.catch(()=>{});
  }catch(e){}
}
// первое касание «разблокирует» звук на телефонах и заранее готовит оба звука
document.addEventListener("pointerdown",function unlockSnd(){
  document.removeEventListener("pointerdown",unlockSnd,true);
  try{fireWav[1]=fireWav[1]||makeFireWav(1);fireWav[2]=fireWav[2]||makeFireWav(2);fireWav.ice=fireWav.ice||makeIceWav();
    const a=new Audio(fireWav[1]);a.muted=true;const pr=a.play();if(pr&&pr.then)pr.then(()=>{a.pause()}).catch(()=>{})}catch(e){}
},true);

return {iceSound,fireSound};
})();
