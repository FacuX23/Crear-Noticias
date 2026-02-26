// Ripple Effect || ripple_effect
document.addEventListener('mousedown', (event) => {
  let target = event.target.closest('.ripple_effect');
  
  if (target) {
    var rect = target.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    
    var ripples = document.createElement('ripple');
    var size = target.offsetWidth * 2;
    ripples.style.left = x - size/2 + 'px';
    ripples.style.top = y - size/2 + 'px';
    ripples.style.width = ripples.style.height = size + 'px';
    
    target.appendChild(ripples);
    
    ripples.setAttribute('data-ripple-preserve', 'true');
    
    setTimeout(() => {
      ripples.remove();
    }, 1000);
  }
});