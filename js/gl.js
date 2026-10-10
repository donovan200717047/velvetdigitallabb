/* =============================================================================
   VelvetDigitalLabb — gl.js
   -----------------------------------------------------------------------------
   "Velluto liquido": uno shader WebGL disegnato a mano (nessuna libreria).
   Rumore frattale deformato su se stesso (domain warping) → pieghe morbide
   come un tessuto, con riflessi color brace che seguono il mouse.
   Prestazioni: risoluzione ridotta, si ferma quando non è visibile o quando
   la scheda è in background; con "riduci movimento" disegna un solo fotogramma.
   Espone window.VDL_GL.setAccent("#rrggbb") e .setBoost(0..1).
   ========================================================================== */
(() => {
  "use strict";
  const canvases = [...document.querySelectorAll("canvas[data-gl]")];
  if (!canvases.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FRAG = `
precision mediump float;
uniform vec2 R; uniform float T; uniform vec2 M; uniform vec3 A; uniform float B;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);
  for(int i=0;i<5;i++){v+=a*n(p);p=r*p*2.02;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/R; vec2 p=(gl_FragCoord.xy-.5*R)/R.y;
  vec2 m=(M-.5)*vec2(R.x/R.y,1.);
  float t=T*.06;
  float d=length(p-m);
  p+= (p-m)*.18*exp(-d*3.)*(1.+B);            // il mouse "spinge" il tessuto
  vec2 q=vec2(fbm(p*1.6+t),fbm(p*1.6-t+5.2));
  vec2 r=vec2(fbm(p*1.6+3.*q+vec2(1.7,9.2)+t*1.3),fbm(p*1.6+3.*q+vec2(8.3,2.8)-t));
  float f=fbm(p*1.6+3.5*r);
  // pieghe: derivata approssimata → luce radente tipo velluto
  float e=.012; float fx=fbm(p*1.6+3.5*r+vec2(e,0.))-f; float fy=fbm(p*1.6+3.5*r+vec2(0.,e))-f;
  float sheen=clamp(.5+(fx-fy)*28.,0.,1.);
  vec3 ink=vec3(.055,.051,.047), deep=vec3(.13,.11,.10);
  vec3 c=mix(ink,deep,smoothstep(.2,.8,f));
  float glow=smoothstep(.45,1.,f*length(r))*(.85+B*.6);
  c=mix(c,A,glow*.85);
  c+=A*pow(sheen,6.)*.35*(.4+f);
  c+=vec3(1.,.92,.85)*pow(sheen,14.)*.10;
  c+=A*.22*exp(-d*2.4)*(.6+B);                 // alone vicino al mouse
  float v=smoothstep(1.25,.25,length(uv-.5)*1.4); c*=mix(.35,1.,v);
  c+=(h(gl_FragCoord.xy+T)-.5)*.018;           // grana fine anti-banding
  gl_FragColor=vec4(c,1.);
}`;

  const hex = (s) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(s).trim()); return m ? m.slice(1).map((x) => parseInt(x, 16) / 255) : [0.878, 0.333, 0.176]; };
  const state = { accent: hex(getComputedStyle(document.documentElement).getPropertyValue("--accent")), boost: 0 };
  const views = [];

  canvases.forEach((cv) => {
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl) { cv.remove(); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = Object.fromEntries(["R", "T", "M", "A", "B"].map((k) => [k, gl.getUniformLocation(pr, k)]));
    const v = { cv, gl, U, on: false, mx: 0.72, my: 0.55, tx: 0.72, ty: 0.55 };
    const size = () => {
      const scale = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 700 ? 0.45 : 0.55);
      const w = Math.max(2, Math.round(cv.clientWidth * scale)), h = Math.max(2, Math.round(cv.clientHeight * scale));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    };
    v.size = size; size();
    const host = cv.parentElement;
    host.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      v.tx = (e.clientX - r.left) / r.width; v.ty = 1 - (e.clientY - r.top) / r.height;
    }, { passive: true });
    views.push(v);
  });
  if (!views.length) return;

  const t0 = performance.now();
  const draw = (v, now) => {
    v.mx += (v.tx - v.mx) * 0.06; v.my += (v.ty - v.my) * 0.06;
    const { gl, U } = v;
    gl.uniform2f(U.R, v.cv.width, v.cv.height);
    gl.uniform1f(U.T, (now - t0) / 1000 + 20);
    gl.uniform2f(U.M, v.mx, v.my);
    gl.uniform3f(U.A, ...state.accent);
    gl.uniform1f(U.B, state.boost);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  let raf = 0;
  const loop = (now) => {
    raf = 0;
    let any = false;
    views.forEach((v) => { if (v.on) { draw(v, now); any = true; } });
    if (any && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      const v = views.find((x) => x.cv === e.target);
      if (!v) return;
      v.on = e.isIntersecting;
      if (reduce && v.on) draw(v, t0 + 8000);
    });
    kick();
  });
  views.forEach((v) => io.observe(v.cv));
  document.addEventListener("visibilitychange", kick);
  addEventListener("resize", () => { views.forEach((v) => v.size()); if (reduce) views.forEach((v) => v.on && draw(v, t0 + 8000)); });

  window.VDL_GL = {
    setAccent(c) { state.accent = hex(c); if (reduce) views.forEach((v) => v.on && draw(v, t0 + 8000)); },
    setBoost(b) { state.boost = b; },
  };
})();
