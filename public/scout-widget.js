/**
 * Back to School Scout — embeddable floating chat widget.
 *
 * Drop this on any page (e.g. an Ackermans theme.liquid):
 *   <script src="https://YOUR-APP-DOMAIN/scout-widget.js" defer
 *           data-label="Back to School Scout"
 *           data-position="right"></script>
 */
(function () {
  if (window.__satchelScoutLoaded) return;
  window.__satchelScoutLoaded = true;

  var script =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src && all[i].src.indexOf("scout-widget.js") !== -1) return all[i];
      }
      return null;
    })();

  var origin = script ? new URL(script.src, window.location.href).origin : window.location.origin;
  var label = (script && script.getAttribute("data-label")) || "Back to School Scout";
  var side = (script && script.getAttribute("data-position")) === "left" ? "left" : "right";
  var accent = (script && script.getAttribute("data-accent")) || "#008a3e";

  var open = false;

  var style = document.createElement("style");
  style.textContent = [
    ".satchel-scout-launcher{position:fixed;bottom:20px;" + side + ":20px;z-index:2147483000;",
    "display:flex;align-items:center;gap:10px;padding:12px 18px 12px 14px;border:0;cursor:pointer;",
    "border-radius:999px;background:" + accent + ";color:#fff;font:600 15px/1 Figtree,system-ui,sans-serif;",
    "box-shadow:0 10px 30px rgba(0,0,0,.22);transition:transform .18s ease,box-shadow .18s ease}",
    ".satchel-scout-launcher:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(0,0,0,.28)}",
    ".satchel-scout-launcher svg{width:20px;height:20px;flex:none}",
    ".satchel-scout-frame{position:fixed;bottom:88px;" + side + ":20px;z-index:2147483000;",
    "width:400px;height:min(640px,calc(100vh - 120px));border:0;border-radius:18px;background:#fff;",
    "box-shadow:0 24px 70px rgba(0,0,0,.28);opacity:0;transform:translateY(12px) scale(.98);",
    "pointer-events:none;transition:opacity .2s ease,transform .2s ease}",
    ".satchel-scout-frame.is-open{opacity:1;transform:none;pointer-events:auto}",
    "@media (max-width:520px){.satchel-scout-frame{inset:0;width:100%;height:100%;border-radius:0;bottom:0}",
    ".satchel-scout-launcher.is-open{display:none}",
    ".satchel-scout-launcher span{display:none}.satchel-scout-launcher{padding:14px;border-radius:999px}}",
  ].join("");
  document.head.appendChild(style);

  var frame = document.createElement("iframe");
  frame.className = "satchel-scout-frame";
  frame.title = label;
  frame.setAttribute("allow", "clipboard-write");
  frame.src = origin + "/widget";

  var button = document.createElement("button");
  button.type = "button";
  button.className = "satchel-scout-launcher";
  button.setAttribute("aria-label", label);
  button.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' +
    "<span>" +
    label +
    "</span>";

  function setOpen(next) {
    open = next;
    frame.classList.toggle("is-open", open);
    button.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
  }

  button.addEventListener("click", function () {
    setOpen(!open);
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    if (event.data && event.data.type === "satchel:close") setOpen(false);
  });

  function mount() {
    document.body.appendChild(frame);
    document.body.appendChild(button);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.SatchelScout = {
    open: function () {
      setOpen(true);
    },
    close: function () {
      setOpen(false);
    },
    toggle: function () {
      setOpen(!open);
    },
  };
})();
