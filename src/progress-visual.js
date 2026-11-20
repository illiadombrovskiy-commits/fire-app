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


function flameSvg(lit) {
 const s=document.createElementNS("http://www.w3.org/2000/svg","svg");
 s.setAttribute("viewBox","0 0 64 80");s.setAttribute("class","flame"+(lit?"":" off"));s.innerHTML=FLAME;return s;
}
function mountStatic(){document.querySelectorAll("svg[data-progress-visual]").forEach(s=>{s.innerHTML=FLAME})}
  function sleepFlame(ctx, x, y, s, f) {
    const h = 15 * s * f, w = 6 * s; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#6b7cb0"; ctx.beginPath(); ctx.moveTo(0, -h); ctx.bezierCurveTo(w * 0.9, -h * 0.45, w * 1.1, -h * 0.05, 0, 2 * s); ctx.bezierCurveTo(-w * 1.1, -h * 0.05, -w * 0.9, -h * 0.45, 0, -h); ctx.fill();
    ctx.fillStyle = "#9fb0e0"; ctx.beginPath(); ctx.ellipse(0, -h * 0.2, w * 0.4, h * 0.24, 0, 0, (Math.PI*2)); ctx.fill(); ctx.restore();
  }
  function flame(ctx, x, y, s, f) {
    const h = 15 * s * f, w = 6 * s; ctx.save(); ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, -h, 0, 2); g.addColorStop(0, "#fff3a0"); g.addColorStop(0.45, "#ffb020"); g.addColorStop(1, "#ff4a1a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -h); ctx.bezierCurveTo(w * 0.9, -h * 0.45, w * 1.1, -h * 0.05, 0, 2 * s); ctx.bezierCurveTo(-w * 1.1, -h * 0.05, -w * 0.9, -h * 0.45, 0, -h); ctx.fill();
    ctx.fillStyle = "rgba(255,250,220,.9)"; ctx.beginPath(); ctx.ellipse(0, -h * 0.2, w * 0.33, h * 0.2, 0, 0, (Math.PI*2)); ctx.fill(); ctx.restore();
  }

mountStatic();
return {FLAME,reduceMotion,vibrate,burst,ignite,flameSvg,sleepFlame,flame};
})();
