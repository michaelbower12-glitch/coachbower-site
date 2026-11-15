(() => {
  if(window.parent===window)return;
  const style=document.createElement('style');style.textContent='[data-edit-key]{cursor:text!important;outline-offset:5px}[data-edit-key]:hover{outline:2px dashed #ff1289!important}[data-edit-key][data-selected]{outline:3px solid #cc0066!important}';document.head.append(style);
  let selected;
  document.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const el=e.target.closest('[data-edit-key]');if(!el)return;selected?.removeAttribute('data-selected');selected=el;el.setAttribute('data-selected','');parent.postMessage({type:'cms-select',key:el.dataset.editKey,html:el.innerHTML},location.origin)},true);
  addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;const data=e.data;if(data?.type==='cms-preview'&&selected&&selected.dataset.editKey===data.key)selected.innerHTML=data.html;});
  parent.postMessage({type:'cms-ready'},location.origin);
})();
