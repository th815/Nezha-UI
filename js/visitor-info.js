/**
 * =================================================================
 * Nezha-UI 访客信息显示模块
 * =================================================================
 */

(function () {
  "use strict";

  // ------------------ 配置 ------------------
  const CONFIG = {
    autoHideDelay: 2600,
    ipApiUrl: "https://ipinfo.io/json",
    // 如需详细信息，填入 ipinfo.io 的 token
    // ipinfoDetailUrl: "https://ipinfo.io/{ip}/json?token=YOUR_TOKEN",
  };

  // 合并用户自定义配置
  if (window.VisitorInfoAutoHideDelay) {
    CONFIG.autoHideDelay = window.VisitorInfoAutoHideDelay;
  }

  // ------------------ 工具函数 ------------------
  function countryCodeToFlagEmoji(code) {
    if (!code || code.length !== 2) return "";
    return String.fromCodePoint(
      ...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + 0x1f1a5)
    );
  }

  function getOS() {
    const ua = navigator.userAgent;
    const osMap = [
      { r: /Windows NT 10\.0/, n: "Windows 10/11" },
      { r: /Windows NT 6\.3/, n: "Windows 8.1" },
      { r: /Windows NT 6\.2/, n: "Windows 8" },
      { r: /Windows NT 6\.1/, n: "Windows 7" },
      { r: /Mac OS X/, n: "macOS" },
      { r: /Android/, n: "Android" },
      { r: /iPhone|iPad|iPod/, n: "iOS" },
      { r: /Linux/, n: "Linux" },
    ];
    const os = osMap.find(({ r }) => r.test(ua))?.n || "Unknown OS";
    let bit = "";
    if (os.startsWith("Windows"))
      bit = /WOW64|Win64/.test(ua) ? "64-bit" : "32-bit";
    if (os === "macOS") bit = /MacIntel/.test(ua) ? "64-bit" : "32-bit";
    return `${os} ${bit}`.trim();
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    const browserMap = [
      { r: /Edg\/([\d.]+)/, n: "Edge" },
      { r: /OPR\/([\d.]+)/, n: "Opera" },
      { r: /Chrome\/([\d.]+)/, n: "Chrome", e: /Edg|OPR/ },
      { r: /Firefox\/([\d.]+)/, n: "Firefox" },
      { r: /Version\/([\d.]+).*Safari/, n: "Safari" },
    ];
    for (const { r, n, e } of browserMap) {
      if (e?.test(ua)) continue;
      const match = ua.match(r);
      if (match) return `${n} ${match[1]}`;
    }
    return "Unknown Browser";
  }

  function getCurrentDate() {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }

  /** HTML 转义，防 XSS */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function isDarkTheme() {
    const theme = document.documentElement.getAttribute("data-theme");
    return (
      theme === "dark" ||
      document.documentElement.classList.contains("dark") ||
      (theme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }

  // ------------------ 主逻辑 ------------------
  function initVisitorInfo() {
    fetch(CONFIG.ipApiUrl)
      .then((r) => r.json())
      .then((data) => renderVisitorInfo(data))
      .catch(() => renderVisitorInfo({}));
  }

  function renderVisitorInfo(data) {
    const isDesktop = window.innerWidth > 768;

    // ---- 创建容器 ----
    const container = document.createElement("div");
    container.id = "nezha-visitor-info";
    container.style.cssText = `
      position: fixed; z-index: 1000; padding: 10px; border-radius: 5px;
      font-size: 14px; font-family: -apple-system, BlinkMacSystemFont,
      "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: none;
    `;

    // ---- 构建内容（安全转义）----
    const flag = countryCodeToFlagEmoji(data.country || "");
    let countryName = data.country || "";
    try {
      countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(
        data.country
      );
    } catch {}

    const typeMap = {
      isp: "ISP",
      business: "Business",
      education: "Education",
      hosting: "Hosting",
    };
    const connType = data.is_hosting
      ? "Hosting"
      : typeMap[data.company?.type?.toLowerCase()] || "Unknown";

    const rows = [
      { icon: "icon-earth-full", value: `${flag} ${countryName} ${data.region || ""} ${data.city || ""}` },
      { icon: "icon-calendar-days", value: getCurrentDate() },
      { icon: "icon-location-dot", value: data.ip || "Unknown" },
      { icon: "icon-tags", value: connType },
      { icon: "icon-shenfengzheng", value: data.asn || data.org || "N/A" },
      { icon: "icon-hollow-computer", value: getOS() },
      { icon: "icon-guge", value: getBrowser() },
    ];

    container.innerHTML = rows
      .map(
        (r) => `
      <div style="display:flex;align-items:center;margin-bottom:2px;">
        <i class="iconfont ${escapeHtml(r.icon)}"
           style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;"></i>
        <span style="font-weight:bold;margin-left:4px;">${escapeHtml(r.icon.replace("icon-", ""))}:&nbsp;</span>
        <span>${escapeHtml(r.value)}</span>
      </div>`
      )
      .join("");

    document.body.appendChild(container);

    // ---- 清理器：统一管理所有监听器 ----
    const cleanups = [];
    const on = (target, event, handler, opts) => {
      target.addEventListener(event, handler, opts);
      cleanups.push(() => target.removeEventListener(event, handler, opts));
    };

    // ---- 主题同步 ----
    const syncTheme = () => {
      const dark = isDarkTheme();
      container.style.backgroundColor = dark
        ? "rgba(30,30,30,0.85)"
        : "rgba(255,255,255,0.85)";
      container.style.color = dark ? "#fff" : "#333";
      container.querySelectorAll("i.iconfont").forEach((i) => {
        i.style.color = dark ? "#fff" : "#242c36";
      });
    };
    syncTheme();

    const themeObs = new MutationObserver(syncTheme);
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    cleanups.push(() => themeObs.disconnect());

    on(window.matchMedia("(prefers-color-scheme: dark)"), "change", syncTheme);

    // ---- 桌面端 ----
    if (isDesktop) {
      container.style.cssText += "right:20px;bottom:20px;width:auto;";

      const btn = document.createElement("button");
      btn.style.cssText = `
        position:fixed;right:20px;bottom:20px;z-index:1100;cursor:pointer;
        border:none;box-shadow:0 2px 8px rgba(45,54,61,.5);
        width:40px;height:40px;padding:0;border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        transition:opacity .3s,background-color .3s ease;
      `;
      btn.innerHTML = `<i class="iconfont icon-footprint-full" style="color:#fff;font-size:22px;"></i>`;
      document.body.appendChild(btn);

      const syncBtnTheme = () => {
        btn.style.backgroundColor = isDarkTheme() ? "#2d363d" : "#4f6980";
      };
      syncBtnTheme();
      on(window.matchMedia("(prefers-color-scheme: dark)"), "change", syncBtnTheme);

      let hideTimer = null;

      const show = (autoHide = false) => {
        clearTimeout(hideTimer);
        container.style.display = "block";
        container.style.opacity = "1";
        btn.style.display = "none";

        if (autoHide) {
          hideTimer = setTimeout(hide, CONFIG.autoHideDelay);
        }
      };

      const hide = () => {
        container.style.opacity = "0";
        setTimeout(() => {
          container.style.display = "none";
          btn.style.display = "flex";
          btn.style.opacity = "0.3";
        }, 300);
      };

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (container.style.display === "none") {
          show(false);
        } else {
          hide();
        }
      });

      btn.addEventListener("mouseenter", () => (btn.style.opacity = "1"));
      btn.addEventListener("mouseleave", () => {
        if (container.style.display === "none") btn.style.opacity = "0.3";
      });

      // 点击外部关闭
      const onDocClick = (e) => {
        if (!container.contains(e.target) && !btn.contains(e.target)) {
          hide();
        }
      };

      // 页面可见性
      on(document, "visibilitychange", () => {
        if (!document.hidden && window.innerWidth > 768) {
          show(true);
        }
      });

      // 初始展开
      show(true);

      // 窗口大小变化
      on(window, "resize", () => {
        if (window.innerWidth <= 768) {
          btn.style.display = "none";
          container.style.display = "none";
        } else {
          btn.style.display = "flex";
        }
      });
    } else {
      // ---- 移动端 ----
      container.style.cssText += `
        left:0;bottom:0;width:100%;display:block;
        transition:opacity .5s ease-in-out,transform .5s ease-in-out;
        transform:translateY(0);opacity:1;
      `;

      setTimeout(() => {
        container.style.opacity = "0";
        container.style.transform = "translateY(100%)";

        setTimeout(() => {
          container.style.display = "none";
          container.style.position = "absolute";
          container.style.transform = "translateY(0)";

          // 滚动到底部时显示
          on(
            window,
            "scroll",
            () => {
              const atBottom =
                window.scrollY + window.innerHeight >=
                document.body.scrollHeight;
              container.style.display = atBottom ? "block" : "none";
            },
            { passive: true }
          );
        }, 500);
      }, CONFIG.autoHideDelay);
    }
  }

  // ---- 启动 ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVisitorInfo);
  } else {
    initVisitorInfo();
  }
})();
