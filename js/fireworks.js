/**
 * =================================================================
 * Nezha-UI 鼠标点击烟花特效模块
 * =================================================================
 */

(function () {
  "use strict";

  if (!window.EnableFireworks) return;

  const CONFIG = {
    maxParticles: 500,
    perClick: 30,
    gravity: 0.06,
    trailAlpha: 0.15,
    colors: ["#ff1461", "#18ff92", "#5a87ff", "#fbf38c", "#ff6ec7", "#7dfff2"],
  };

  // ---- Canvas ----
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let w, h, dpr;

  const resize = () => {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
  };
  resize();
  window.addEventListener("resize", resize);

  // ---- 粒子池 + 空闲列表 ----
  const pool = new Array(CONFIG.maxParticles);
  const freeList = []; // 存放空闲粒子的索引
  let activeCount = 0;
  let rafId = null;

  // 初始化池，所有索引放入空闲列表
  for (let i = 0; i < CONFIG.maxParticles; i++) {
    pool[i] = { active: false };
    freeList.push(i);
  }

  function launch(x, y) {
    const color = CONFIG.colors[(Math.random() * CONFIG.colors.length) | 0];
    const count = Math.min(CONFIG.perClick, freeList.length);

    for (let i = 0; i < count; i++) {
      const idx = freeList.pop();
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      const p = pool[idx];

      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.radius = Math.random() * 2 + 1;
      p.alpha = 1;
      p.decay = Math.random() * 0.015 + 0.003;
      // 同一次点击里部分粒子换色，增加层次感
      p.color =
        i % 3 === 0
          ? CONFIG.colors[(Math.random() * CONFIG.colors.length) | 0]
          : color;
      p.idx = idx; // 记住自己的索引，回收时用

      activeCount++;
    }
  }

  function animate() {
    // 拖尾效果：半透明覆盖代替全清
    ctx.fillStyle = `rgba(0,0,0,${CONFIG.trailAlpha})`;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (!p.active) continue;

      p.vy += CONFIG.gravity; // 重力
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        p.active = false;
        activeCount--;
        freeList.push(p.idx); // 归还空闲索引
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (activeCount > 0) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
      ctx.clearRect(0, 0, w, h);
    }
  }

  const onClick = (e) => {
    launch(e.clientX, e.clientY);
    if (!rafId) rafId = requestAnimationFrame(animate);
  };

  window.addEventListener("click", onClick);

  // 暴露清理接口，需要时可调用
  window.destroyFireworks = () => {
    window.removeEventListener("click", onClick);
    window.removeEventListener("resize", resize);
    if (rafId) cancelAnimationFrame(rafId);
    canvas.remove();
  };
})();
