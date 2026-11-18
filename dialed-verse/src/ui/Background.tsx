import { useEffect, useRef } from 'react';
import { useUi, useReducedMotion } from './fx';
import { useStore } from '@/core/store';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
const FRAG = `precision mediump float;
uniform vec2 r; uniform float t; uniform float hue; uniform float energy; uniform float light;
vec3 hsv(float h,float s,float v){ vec3 k=vec3(1.,2./3.,1./3.); vec3 p=abs(fract(vec3(h)+k)*6.-3.); return v*mix(vec3(1.),clamp(p-1.,0.,1.),s); }
float n(vec2 p){ return sin(p.x)*sin(p.y); }
float fbm(vec2 p){ float a=0.; float w=.5; for(int i=0;i<5;i++){ a+=w*n(p); p=mat2(1.6,1.2,-1.2,1.6)*p+t*.06; w*=.5; } return a; }
void main(){
  vec2 uv = gl_FragCoord.xy / r; vec2 q = (gl_FragCoord.xy - .5*r) / r.y;
  float f = fbm(q*2.2 + vec2(t*.05, -t*.03));
  float band = smoothstep(.0,.9, sin(q.x*2.5 + f*3. + t*.2)*.5+.5) * smoothstep(1.1,-.2, uv.y + f*.3 - .2);
  float band2 = smoothstep(.2,1., sin(q.x*1.7 - f*2.5 - t*.15 + 2.)*.5+.5) * smoothstep(-.2,1.2, uv.y - f*.2);
  float h = hue/360.;
  vec3 c1 = hsv(h + f*.08, .85, .9);
  vec3 c2 = hsv(h + .45 + f*.1, .8, .85);
  vec3 base = light > .5 ? vec3(.95,.94,1.) : vec3(.012,.01,.035);
  float k = (.28 + energy*.45);
  vec3 col = base + (c1*band*k + c2*band2*k*.75) * (light > .5 ? .35 : 1.);
  float vig = smoothstep(1.3, .2, length(q));
  col *= light > .5 ? 1. : mix(.55, 1., vig);
  gl_FragColor = vec4(col, 1.);
}`;

/** Full-screen WebGL aurora. Renders at reduced resolution and pauses when hidden. */
export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const theme = useStore((s) => s.settings.theme);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r');
    const uT = gl.getUniformLocation(prog, 't');
    const uH = gl.getUniformLocation(prog, 'hue');
    const uE = gl.getUniformLocation(prog, 'energy');
    const uL = gl.getUniformLocation(prog, 'light');
    const scale = 0.35;
    const resize = () => {
      canvas.width = Math.max(1, Math.floor(innerWidth * scale));
      canvas.height = Math.max(1, Math.floor(innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    addEventListener('resize', resize);
    let raf = 0;
    let hue = useUi.getState().hue, energy = useUi.getState().energy;
    const start = performance.now();
    const frame = () => {
      const s = useUi.getState();
      let dh = s.hue - hue;
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
      hue = (hue + dh * 0.03 + 360) % 360;
      energy += (s.energy - energy) * 0.03;
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, reduced ? 10 : (performance.now() - start) / 1000);
      gl.uniform1f(uH, hue);
      gl.uniform1f(uE, energy);
      gl.uniform1f(uL, theme === 'light' ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced && !document.hidden) raf = requestAnimationFrame(frame);
    };
    frame();
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) frame(); };
    document.addEventListener('visibilitychange', vis);
    const unsub = reduced ? useUi.subscribe(() => frame()) : () => {};
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', vis);
      unsub();
    };
  }, [reduced, theme]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="fixed inset-0 -z-10 h-full w-full"
      style={{ imageRendering: 'auto', filter: 'blur(0.5px)', background: 'radial-gradient(circle at 70% 10%, #3b0d4d, #05040b 60%)' }}
    />
  );
}
