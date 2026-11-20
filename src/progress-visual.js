window.OgonekProgressVisual=(function(){
const {fireSound}=window.OgonekSounds;
const FLAME='<path class="f1" d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z"/><path class="f2" d="M32 40c4 8 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 6-12 0 4 2 7 5 7-2-5-2-11-1-16z"/>';
/* ---------- reaction: vibration + flame ignition + sparks ---------- */
const reduceMotion=()=>window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function vibrate(pattern){try{if(navigator.vibrate)navigator.vibrate(pattern)}catch(e){}}
function burst(x,y,n,cols0,soft){
  if(reduceMotion())return;
  const c=document.createElement("canvas"),dpr=window.devicePixelRatio||1;
  c.className="sparks";c.width=innerWidth*dpr;c.height=innerHeight*dpr;document.body.append(c);
  const g=c.getContext("2d");g.scale(dpr,dpr);
  const cols=cols0||["#ff7a1a","#ffc53d","#ff9f43","#ffe08a","#ff5b1f"];
  const ps=Array.from({length:n},()=>{const a=Math.random()*Math.PI*2,sp=soft?.6+Math.random()*1.6:2+Math.random()*6;return {x,y,vx:Math.cos(a)*sp,vy:soft?Math.random()*1.2:Math.sin(a)*sp-3,r:2+Math.random()*3.5,c:cols[cols0?Math.floor(Math.random()*cols.length):n%5===0?0:Math.floor(Math.random()*5)],life:1}});
  let last=performance.now();
  (function frame(now){
    const dt=Math.min(32,now-last)/16;last=now;g.clearRect(0,0,innerWidth,innerHeight);let alive=0;
    ps.forEach(p=>{if(p.life<=0)return;p.vy+=.18*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=.018*dt;if(p.life>0){alive++;g.globalAlpha=p.life;g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()}});
    if(alive)requestAnimationFrame(frame);else c.remove();
  })(last);
}
function ignite(svgEl,level){
  if(level)vibrate(level===2?[90,60,90,60,220]:[60,40,60]);
  if(level)fireSound(level);
  if(!svgEl)return;
  svgEl.classList.remove("ignite");void svgEl.getBoundingClientRect();svgEl.classList.add("ignite");
  if(level===1){const r=svgEl.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,28)}
}


return {FLAME,reduceMotion,vibrate,burst,ignite};
})();
