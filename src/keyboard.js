/* убрать клавиатуру: нажали мимо поля ввода (на кнопку — после её нажатия, чтобы нажатие не промахнулось) */
(function(){var later=null;
 function field(a){if(!a||a===document.body)return false;var tg=a.tagName;return tg==="INPUT"&&!/^(checkbox|radio|button|submit|range|file|color)$/.test(a.type)||tg==="TEXTAREA"||a.isContentEditable}
 function down(e){var a=document.activeElement;later=null;if(!field(a))return;var t=e.target;if(!t||!t.closest)return;
  if(t.closest("input,textarea,select,label,[contenteditable]"))return;
  if(t.closest("button,a,[role=button],summary")){later=a;return}
  a.blur()}
 document.addEventListener("touchstart",down,{passive:true,capture:true});document.addEventListener("mousedown",down,true);
 document.addEventListener("click",function(){var a=later;later=null;if(a)setTimeout(function(){if(document.activeElement===a)a.blur()},0)},true)})();