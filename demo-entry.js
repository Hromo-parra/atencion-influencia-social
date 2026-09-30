/* Acceso directo a una demo independiente, sin tocar la sesión experimental. */
(() => {
  const link = document.createElement('a');
  link.href = 'demo.html';
  link.textContent = '▶ Demo para presentación';
  link.setAttribute('aria-label', 'Abrir demo breve para presentación');
  Object.assign(link.style, {position:'fixed',right:'16px',bottom:'16px',zIndex:'10000',padding:'12px 16px',borderRadius:'999px',background:'#143e68',color:'#fff',font:'700 14px system-ui,sans-serif',textDecoration:'none',boxShadow:'0 5px 18px #0004'});
  document.body.append(link);
})();
