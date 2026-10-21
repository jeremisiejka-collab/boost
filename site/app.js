const teaser = document.querySelector('.teaser');
const backgrounds = document.querySelector('.backgrounds');
const layers = ['one','two','three','four'].map(name => document.querySelector('.color-'+name));
const sources = ['assets/boost-brand-background.jpeg','assets/boost-background-2.jpeg','assets/boost-background-3.jpeg','assets/boost-background-4.jpeg'];
let paused = false, elapsed = 0, previous = null, active = -1;
const fadeDuration = 9000;
let renderFluid = null;
let canvas = null;
const logo = document.querySelector('.boost-logo');
const trigger = document.querySelector('.boost-trigger');
const status = document.querySelector('#boost-status');
let holding = false, automatic = false, charge = 0, energy = 0;
let stage = 'idle';
let pressureClock = 0, releaseAge = 10;
function setStage(value, text) {
  if(stage === value) return;
  stage = value; teaser.dataset.boostState = value;
}
function beginBoost(auto = false) {
  if(holding || energy > .12) return;
  holding = true; automatic = auto; charge = 0;
  teaser.classList.add('charging');
  setStage('charging','TRZYMAJ.');
  status.textContent = '';
}
function releaseBoost() {
  if(automatic) return;
  holding = false; teaser.classList.remove('charging');
}
trigger.addEventListener('pointerdown', event => {
  if(event.button !== 0) return;
  event.preventDefault(); trigger.setPointerCapture(event.pointerId); beginBoost();
});
trigger.addEventListener('pointerup', releaseBoost);
trigger.addEventListener('pointercancel', () => { automatic=false; releaseBoost(); });
trigger.addEventListener('lostpointercapture', releaseBoost);
trigger.addEventListener('contextmenu', event => event.preventDefault());
trigger.addEventListener('keydown', event => {
  if(event.key === ' ' || event.key === 'Enter') {
    event.preventDefault(); if(!event.repeat) beginBoost(event.key === 'Enter');
  }
  if(event.key === 'Escape') { automatic=false; releaseBoost(); }
});
trigger.addEventListener('keyup', event => {
  if(event.key === ' ') { event.preventDefault(); releaseBoost(); }
});
trigger.addEventListener('click', event => {
  // Keyboard and assistive-technology activation can charge without a sustained press.
  if(event.detail === 0 && !holding && energy <= .12) beginBoost(true);
});
window.addEventListener('blur', () => { automatic=false; releaseBoost(); });
function updateBoost(dt) {
  pressureClock += dt / 1000;
  releaseAge += dt / 1000;
  if(holding) {
    charge=Math.min(1,charge+dt/2350);
    if(charge >= 1) {
      holding=false; automatic=false; energy=1; releaseAge=0; charge=0;
      teaser.classList.remove('charging');
      setStage('boosted','BOOST.');
      status.textContent='BOOST! Napięcie uwolnione.';
    }
  } else { charge=Math.max(0,charge-dt/340); }
  energy*=Math.exp(-dt/1500);
  if(!holding && energy < .08 && charge < .01) setStage('idle','PRZYTRZYMAJ, ŻEBY ZBOOSTOWAĆ');
  // Dense, tiny oscillations build pressure without a cartoon wobble.
  const tension=Math.pow(charge,2.7);
  const phase=pressureClock*(70+charge*38);
  const amplitude=4.5*tension;
  const x=(Math.sin(phase)+Math.sin(phase*1.73)*.32)*amplitude;
  const y=(Math.cos(phase*1.31)+Math.sin(phase*.83)*.25)*amplitude*.52;
  const angle=Math.sin(phase*1.11)*tension*.38;
  // A short elastic release, then a heavily damped settle.
  const impulse=releaseAge<1.5?(1-Math.exp(-releaseAge*45))*Math.exp(-releaseAge*7):0;
  const settle=releaseAge<1.5?Math.sin(releaseAge*23)*Math.exp(-releaseAge*8)*.012:0;
  const scaleX=1+charge*.035+impulse*.14+settle;
  const scaleY=1-charge*.025+impulse*.11+settle;
  trigger.style.transform=`translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) rotate(${angle.toFixed(3)}deg) scale(${scaleX.toFixed(4)},${scaleY.toFixed(4)})`;
  backgrounds.style.transform=`translate3d(${(x*.12).toFixed(3)}px,${(y*.12).toFixed(3)}px,0) scale(${(1+tension*.025+impulse*.13).toFixed(4)})`;
  logo.style.setProperty('--charge',charge.toFixed(4));
  logo.style.setProperty('--energy',energy.toFixed(4));
}
document.addEventListener('visibilitychange', () => { previous = null; if(document.hidden) { automatic=false; releaseBoost(); } });

function setupFluid(images) {
  canvas = document.createElement('canvas');
  canvas.className = 'fluid-colors';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha:false, antialias:false, depth:false, powerPreference:'low-power' });
  if (!gl) return null;
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;
  const fragment = `precision mediump float;
    varying vec2 uv; uniform sampler2D currentImage; uniform sampler2D nextImage;
    uniform float time; uniform float blend; uniform vec2 cover;
    vec2 flow(vec2 p, float phase){
      float t=time*.14;
      vec2 wave=vec2(
        sin(p.y*4.2+t+phase)*.075+sin(p.y*7.1-t*.7+phase)*.022,
        cos(p.x*4.6-t*.8+phase)*.068+sin(p.x*6.3+t*.6)*.025
      );
      float angle=sin(t*.45+phase)*.055;
      mat2 rotation=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
      return clamp(rotation*((p-.5)*.76)+.5+wave, .001, .999);
    }
    void main(){
      vec2 p=(vec2(uv.x,1.-uv.y)-.5)*cover+.5;
      vec3 a=texture2D(currentImage,flow(p,0.)).rgb;
      vec3 b=texture2D(nextImage,flow(p,0.)).rgb;
      // Soft mixing keeps the original brand palette and avoids abrupt cuts.
      vec3 color=mix(a,b,blend);
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, source) {
    const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Color renderer could not link');
  gl.useProgram(program);
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position'); gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const textures=images.map(image=>{
    const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
    return texture;
  });
  const timeUniform=gl.getUniformLocation(program,'time');
  const blendUniform=gl.getUniformLocation(program,'blend');
  const coverUniform=gl.getUniformLocation(program,'cover');
  const imageAspect=images[0].width/images[0].height;
  gl.uniform1i(gl.getUniformLocation(program,'currentImage'),0);
  gl.uniform1i(gl.getUniformLocation(program,'nextImage'),1);
  function resize(){
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(backgrounds.clientWidth*ratio);
    canvas.height=Math.round(backgrounds.clientHeight*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
    const aspect=(canvas.width/canvas.height)/imageAspect;
    gl.uniform2f(coverUniform,Math.min(1,aspect),Math.min(1,1/aspect));
  }
  resize(); new ResizeObserver(resize).observe(backgrounds);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault(); renderFluid=null; canvas.remove(); active=-1;
  });
  backgrounds.appendChild(canvas);
  return (time,index,next,blend)=>{
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,textures[index]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,textures[next]);
    gl.uniform1f(timeUniform,time/1000); gl.uniform1f(blendUniform,blend);
    gl.drawArrays(gl.TRIANGLES,0,6);
  };
}
function frame(now) {
  const dt=previous===null || document.hidden ? 0 : Math.min(now-previous,1000);
  previous=now;
  updateBoost(dt);
  if(!paused&&!document.hidden) elapsed+=dt*(1.15+charge*1.1+energy*3.8);
  const index=Math.floor(elapsed/fadeDuration)%layers.length;
  const next=(index+1)%layers.length;
  const progress=(elapsed%fadeDuration)/fadeDuration;
  const blend=progress*progress*(3-2*progress);
  if(renderFluid){ renderFluid(elapsed,index,next,blend); }
  else {
    if(active!==index){
      layers.forEach(layer=>{layer.style.opacity='0';layer.style.zIndex='0';});
      layers[index].style.opacity='1'; layers[index].style.zIndex='1';
      layers[next].style.zIndex='2'; active=index;
    }
    layers[next].style.opacity=String(blend);
    const t=elapsed/1000;
    const x=Math.sin(t*.11)*3.8;
    const y=Math.cos(t*.09)*3.2;
    const angle=Math.sin(t*.07)*2.2;
    const scale=1.16+Math.sin(t*.08)*.025;
    for(const i of [index,next]) layers[i].style.transform=`translate(${x}%,${y}%) rotate(${angle}deg) scale(${scale})`;
  }
  requestAnimationFrame(frame);
}
Promise.all(sources.map(src=>new Promise(resolve=>{
  const image=new Image(); image.onload=()=>resolve(image); image.onerror=()=>resolve(null); image.src=src;
}))).then(images=>{
  if(images.every(Boolean)){
    try {renderFluid=setupFluid(images);} catch(error){canvas?.remove();}
  }
  requestAnimationFrame(frame);
});

// Teaser section: words light up as the manifesto scrolls into view, pillars fade in.
const manifesto=document.querySelector('.manifesto');
manifesto.innerHTML=manifesto.textContent.trim().split(/\s+/).map(word=>`<span class="w">${word}</span>`).join(' ');
const words=[...manifesto.querySelectorAll('.w')];
function lightWords(){
  const box=manifesto.getBoundingClientRect();
  const progress=(innerHeight*.85-box.top)/(innerHeight*.5);
  const lit=Math.round(Math.max(0,Math.min(1,progress))*words.length);
  words.forEach((word,i)=>word.classList.toggle('on',i<lit));
}
addEventListener('scroll',lightWords,{passive:true}); addEventListener('resize',lightWords); lightWords();
const pillars=document.querySelector('.pillars');
new IntersectionObserver((entries,observer)=>{
  if(entries.some(entry=>entry.isIntersecting)){ pillars.classList.add('in'); observer.disconnect(); }
},{threshold:.2}).observe(pillars);
