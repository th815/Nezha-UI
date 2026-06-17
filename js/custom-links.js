/**
 * =================================================================
 * Nezha-UI 自定义链接图标模块
 * @description 为导航栏的自定义链接动态添加可配置的 iconfont 图标。
 * =================================================================
 */

// ------------------ 配置区 ------------------
window.CustomLinks = [
  { link: "https://blog.tianhao.tech", icon: "icon-book" },
  { link: "https://github.com/th815/Nezha-Dash-UI", icon: "icon-github" },
  { link: "https://uptime.tianhao.tech", icon: "icon-hourglass-start" },
];
// icon 值请确保是 iconfont.css 中真实存在的 class

window.CustomLinkIconSize = "16px";
window.CustomLinkIconColor = "";       // 留空则继承文本颜色
window.CustomLinkIconMarginRight = "1px";

// ------------------ 内部逻辑 ------------------
(function () {
  "use strict";

  let observer = null;

  function applyIcons() {
    const links = window.CustomLinks;
    if (!Array.isArray(links)) return;

    links.forEach(({ link, icon }) => {
      if (!link || !icon) return;

      // 用 querySelectorAll 安全匹配（避免选择器注入）
      const linkElements = document.querySelectorAll("a");
      linkElements.forEach((linkEl) => {
        // 手动匹配 href，避免特殊字符破坏选择器
        if (linkEl.getAttribute("href") !== link) return;
        // 已有图标则跳过
        if (linkEl.querySelector(".custom-link-icon")) return;
        // 排除音乐播放器
        if (linkEl.closest(".music-player-container")) return;

        const iconEl = document.createElement("i");
        iconEl.className = `iconfont ${icon} custom-link-icon`;
        iconEl.style.fontSize = window.CustomLinkIconSize || "inherit";
        if (window.CustomLinkIconColor) {
          iconEl.style.color = window.CustomLinkIconColor;
        }
        iconEl.style.marginRight = window.CustomLinkIconMarginRight || "5px";
        linkEl.prepend(iconEl);
      });
    });
  }

  // 首次运行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  function run() {
    applyIcons();
    startObserver();
  }

  function startObserver() {
    // 先断开旧的
    if (observer) observer.disconnect();

    // 用防抖避免高频触发
    let timer = null;
    observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(applyIcons, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
})();
