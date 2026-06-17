/**
 * =================================================================
 * Nezha-UI 插图插入模块
 * @description 异步加载并插入自定义插图。
 * =================================================================
 */

(function () {
  "use strict";

  const CONTAINER_SELECTORS = [
    ".server-cards-container > div:last-child",
    ".section > div:last-child > div",
    ".card:last-child",
  ];

  const IMAGE_STYLE = {
    position: "absolute",
    right: "-10px",
    top: "-120px",
    zIndex: "10",
    width: "120px",
    transition: "opacity 0.4s ease-in-out, transform 0.4s ease-in-out",
  };

  let observer = null;

  function findContainer() {
    for (const sel of CONTAINER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function applyImage(img) {
    // 清理旧的
    const old = document.getElementById("nezha-custom-illustration");
    if (old) old.remove();

    const container = findContainer();
    if (!container) return false;

    // 仅在需要时设置 relative（不覆盖已有值）
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    // 设置样式
    Object.assign(img.style, IMAGE_STYLE);
    img.className = "custom-illustration";
    img.id = "nezha-custom-illustration";
    img.style.opacity = "0";
    img.style.transform = "translateY(20px)";

    container.appendChild(img);

    // 双 rAF 触发动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        img.style.opacity = "1";
        img.style.transform = "translateY(0)";
      });
    });

    return true;
  }

  function startObserver(img) {
    if (observer) observer.disconnect();

    let timer = null;
    observer = new MutationObserver(() => {
      // 防抖：150ms 内的连续变动只处理一次
      clearTimeout(timer);
      timer = setTimeout(() => {
        const existing = document.getElementById("nezha-custom-illustration");
        if (!existing || !existing.offsetParent) {
          applyImage(img);
        }
      }, 150);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function init() {
    const src = window.CustomIllustration;
    if (!src || typeof src !== "string" || !src.trim()) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      // 首次尝试
      if (applyImage(img)) {
        startObserver(img);
        return;
      }

      // 目标容器还没渲染出来，等页面 load 后重试
      const tryAttach = () => {
        if (applyImage(img)) {
          startObserver(img);
        }
      };

      if (document.readyState === "complete") {
        // 页面已 load，直接重试
        setTimeout(tryAttach, 500);
      } else {
        window.addEventListener("load", () => setTimeout(tryAttach, 500), {
          once: true,
        });
      }
    };

    // 路由变化时重新挂载
    const onRouteChange = () => {
      img.style.opacity = "0";
      img.style.transform = "translateY(20px)";
      setTimeout(() => applyImage(img), 150);
    };

    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("hashchange", onRouteChange);
  }

  // 启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
