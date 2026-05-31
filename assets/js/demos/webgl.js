// Vanilla WebGL — one rotating cube, drag to orbit.
//
// Intentionally hand-rolled (no three.js, no glMatrix) so the demo
// shows what the platform itself does.

(function () {
  "use strict";

  const wrap   = document.getElementById("wrap");
  const canvas = document.getElementById("canvas");
  const status = document.getElementById("status");

  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) {
    window.iPadOS?.setStatus(status, "err", "WebGL not available");
    window.iPadOS?.showFallback(
      wrap.parentElement,
      "This browser doesn't expose WebGL, so there's nothing to render here."
    );
    return;
  }

  const VS = `
    attribute vec3 aPos;
    attribute vec3 aColor;
    uniform mat4 uMVP;
    varying vec3 vColor;
    void main() {
      vColor = aColor;
      gl_Position = uMVP * vec4(aPos, 1.0);
    }
  `;
  const FS = `
    precision mediump float;
    varying vec3 vColor;
    void main() { gl_FragColor = vec4(vColor, 1.0); }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER,   VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  // Cube — 6 faces, each its own color, 2 triangles each.
  function face(v0, v1, v2, v3, c) {
    return [
      ...v0, ...c, ...v1, ...c, ...v2, ...c,
      ...v0, ...c, ...v2, ...c, ...v3, ...c,
    ];
  }
  const A = [-1, -1,  1], B = [ 1, -1,  1], C = [ 1,  1,  1], D = [-1,  1,  1];
  const E = [-1, -1, -1], F = [ 1, -1, -1], G = [ 1,  1, -1], H = [-1,  1, -1];
  const verts = new Float32Array([
    ...face(A, B, C, D, [0.18, 0.40, 1.00]), // +Z front (blue)
    ...face(B, F, G, C, [0.62, 0.36, 1.00]), // +X right (purple)
    ...face(F, E, H, G, [0.00, 0.78, 0.92]), // -Z back  (cyan)
    ...face(E, A, D, H, [1.00, 0.42, 0.65]), // -X left  (pink)
    ...face(D, C, G, H, [1.00, 0.82, 0.40]), // +Y top   (gold)
    ...face(E, F, B, A, [0.50, 0.92, 0.60]), // -Y bot   (mint)
  ]);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const aPos   = gl.getAttribLocation(prog, "aPos");
  const aColor = gl.getAttribLocation(prog, "aColor");
  const stride = 6 * 4;
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos,   3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(aColor);
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, stride, 3 * 4);

  const uMVP = gl.getUniformLocation(prog, "uMVP");

  // ----- minimal matrix math (column-major) -----
  function mat4() { return new Float32Array(16); }
  function ident(m) {
    m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m;
  }
  function perspective(m, fovy, aspect, n, f) {
    const t = 1 / Math.tan(fovy / 2);
    m.fill(0);
    m[0] = t / aspect; m[5] = t;
    m[10] = (f + n) / (n - f); m[11] = -1;
    m[14] = (2 * f * n) / (n - f);
    return m;
  }
  function rotate(m, ax, ay, az) {
    const cx = Math.cos(ax), sx = Math.sin(ax);
    const cy = Math.cos(ay), sy = Math.sin(ay);
    const cz = Math.cos(az), sz = Math.sin(az);
    // R = Rz * Ry * Rx, then place at z = -6
    const m00 = cz * cy;
    const m01 = cz * sy * sx - sz * cx;
    const m02 = cz * sy * cx + sz * sx;
    const m10 = sz * cy;
    const m11 = sz * sy * sx + cz * cx;
    const m12 = sz * sy * cx - cz * sx;
    const m20 = -sy;
    const m21 = cy * sx;
    const m22 = cy * cx;
    m[0]=m00; m[1]=m10; m[2]=m20; m[3]=0;
    m[4]=m01; m[5]=m11; m[6]=m21; m[7]=0;
    m[8]=m02; m[9]=m12; m[10]=m22; m[11]=0;
    m[12]=0;  m[13]=0;  m[14]=-6; m[15]=1;
    return m;
  }
  function multiply(out, a, b) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        out[c * 4 + r] =
          a[0 * 4 + r] * b[c * 4 + 0] +
          a[1 * 4 + r] * b[c * 4 + 1] +
          a[2 * 4 + r] * b[c * 4 + 2] +
          a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  const proj  = mat4();
  const model = mat4();
  const mvp   = mat4();

  // ----- interaction -----
  let rotX = 0.55, rotY = 0.8;
  let auto = true;
  let dragging = null;

  canvas.addEventListener("pointerdown", (ev) => {
    canvas.setPointerCapture(ev.pointerId);
    dragging = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    auto = false;
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!dragging || dragging.id !== ev.pointerId) return;
    rotY += (ev.clientX - dragging.x) * 0.01;
    rotX += (ev.clientY - dragging.y) * 0.01;
    dragging.x = ev.clientX; dragging.y = ev.clientY;
  });
  function endDrag() { dragging = null; }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // ----- resize & render -----
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function fit() {
    const r = wrap.getBoundingClientRect();
    canvas.width  = Math.floor(r.width  * dpr);
    canvas.height = Math.floor(r.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    perspective(proj, Math.PI / 4, canvas.width / Math.max(1, canvas.height), 0.1, 100);
  }
  new ResizeObserver(fit).observe(wrap);
  fit();

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.043, 0.059, 0.102, 1.0);

  let last = performance.now();
  function frame(now) {
    const dt = (now - last) / 1000; last = now;
    if (auto) { rotY += dt * 0.6; rotX += dt * 0.3; }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotate(model, rotX, rotY, 0);
    multiply(mvp, proj, model);
    gl.uniformMatrix4fv(uMVP, false, mvp);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
