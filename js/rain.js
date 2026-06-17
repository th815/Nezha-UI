/**
 * =================================================================
 * Nezha-UI 背景下雨特效模块
 * @description 预渲染模板 + 印章式绘制，高性能下雨效果。
 * =================================================================
 */

(function () {
  "use strict";

  if (!window.EnableRainEffect) return;

  const CONFIG = {
    density: 0.0004,
    maxDrops: 4000,
    minDrops: 200,
    wind: 1.5,
    trailAlpha: 0.12,
    templateCount: 8, // 预渲染模板数量
  };

  // ---- 主 Canvas ----
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let w, h;
  let drops = [];
  let currentCount = 0;
  let rafId = null;
  let paused = false;

  // ---- 预渲染雨滴模板 ----
  // 按 (长度, 不透明度) 分桶，生成 N 个离屏 canvas 作为印章
  const templates = [];

  function buildTemplates() {
    templates.length = 0;
    for (let i = 0; i < CONFIG.templateCount; i++) {
      const t = i / (CONFIG.templateCount - 1); // 0 ~ 1
      const length = 8 + t * 22;                 // 8px ~ 30px
      const alpha = 0.25 + t * 0.65;            // 0.25 ~ 0.9

      const pad = 2;
      const dw = 6;
      const dh = Math.ceil(length) + pad * 2;

      const offscreen = document.createElement("canvas");
      offscreen.width = dw;
      offscreen.height = dh;
      const oc = offscreen.getContext("2d");

      const g = oc.createLinearGradient(dw / 2, pad, dw / 2, pad + length);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `rgba(255,255,255,${alpha})`);

      oc.strokeStyle = g;
      oc.lineWidth = 1.5;
      oc.lineCap = "round";
      oc.beginPath();
      oc.moveTo(dw / 2, pad);
      oc.lineTo(dw / 2, pad + length);
      oc.stroke();

      templates.push({ canvas: offscreen, w: dw, h: dh, length });
    }
  }

  buildTemplates();

  // ---- 雨滴 ----
  function resetDrop(drop, fullRandom) {
    const scale = Math.random() * 0.9 + 0.1;
    drop.x = Math.random() * w;
    drop.y = fullRandom ? Math.random() * -h : Math.random() * -h * 0.3;
    drop.vy = 12 * scale + 4;
    drop.windOffset = (Math.random() - 0.5) * CONFIG.wind;
    // 随机选一个模板
    drop.tpl = templates[(Math.random() * templates.length) | 0];
  }

  // ---- Resize ----
  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.max(
      CONFIG.minDrops,
      Math.min(Math.floor(w * h * CONFIG.density), CONFIG.maxDrops)
    );

    if (target !== currentCount) {
      currentCount = target;
      drops = [];
      for (let i = 0; i < currentCount; i++) {
        const drop = {};
        resetDrop(drop, true);
        drops.push(drop);
      }
    }
  };

  resize();
  window.addEventListener("resize", resize);

  // ---- 动画 ----
  function animate() {
    if (paused) return;

    if (CONFIG.trailAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${CONFIG.trailAlpha})`;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.vy;
      d.x += d.windOffset;

      if (d.y > h || d.x < -30 || d.x > w + 30) {
        resetDrop(d, false);
      }

      const t = d.tpl;
      ctx.drawImage(t.canvas, d.x - t.w / 2, d.y - t.h);
    }

    rafId = requestAnimationFrame(animate);
  }

  // ---- 可见性控制 ----
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      paused = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else {
      paused = false;
      if (!rafId) rafId = requestAnimationFrame(animate);
    }
  });

  rafId = requestAnimationFrame(animate);

  // ---- 清理接口 ----
  window.destroyRain = () => {
    paused = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    canvas.remove();
  };
})();
