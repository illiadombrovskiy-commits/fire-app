window.OgonekAwardVisual=(function(){
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

return {TIERS,IC,medalSvg};
})();
