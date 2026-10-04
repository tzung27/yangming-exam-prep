/* 共用腳本：導覽列、分頁籤、互動考古題、倒數、檢核清單 */
(function () {
  var NAV = [
    ["index.html", "首頁"],
    ["exam.html", "考試日期與規範"],
    ["books.html", "教科書與範圍"],
    "|",
    ["math.html", "數學"],
    ["chinese.html", "國文"],
    ["geography.html", "地理"],
    ["physics.html", "物理"],
    ["english.html", "英文"],
    ["history.html", "歷史"],
    ["biology.html", "生物"]
  ];

  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* 首頁連結：本機開檔用 index.html，網站上用 ./ */
  var HOME = location.protocol === "file:" ? "index.html" : "./";

  /* ---------- nav ---------- */
  var bar = document.getElementById("topbar");
  if (bar) {
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (here.indexOf(".html") < 0) here = "index.html";
    var html = '<div class="topbar-inner"><a class="brand" href="' + HOME + '">陽明高一段考衝刺 <span class="seat">107</span></a><nav class="nav" aria-label="主選單">';
    NAV.forEach(function (n) {
      if (n === "|") { html += '<span class="sep" aria-hidden="true"></span>'; return; }
      html += '<a href="' + (n[0] === "index.html" ? HOME : n[0]) + '"' + (here === n[0] ? ' aria-current="page"' : "") + ">" + n[1] + "</a>";
    });
    bar.innerHTML = html + "</nav></div>";
    var setH = function () { document.documentElement.style.setProperty("--topbar-h", bar.offsetHeight + "px"); };
    setH(); window.addEventListener("resize", setH);
  }

  document.querySelectorAll('a[href="index.html"]').forEach(function (a) { a.setAttribute("href", HOME); });

  /* ---------- tabs ---------- */
  var tabBar = document.querySelector(".tabs");
  if (tabBar) {
    var btns = Array.prototype.slice.call(tabBar.querySelectorAll("button[data-tab]"));
    var panels = btns.map(function (b) { return document.getElementById(b.dataset.tab); });
    tabBar.setAttribute("role", "tablist");
    function show(id, push) {
      var found = false;
      btns.forEach(function (b, i) {
        var on = b.dataset.tab === id;
        if (on) found = true;
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", on ? "true" : "false");
        if (panels[i]) { panels[i].hidden = !on; panels[i].setAttribute("role", "tabpanel"); }
      });
      if (!found) {
        // 錨點在某個分頁裡（例如 #ch-1-1）：打開那個分頁再捲過去
        var target = id && document.getElementById(id);
        var panel = target && target.closest && target.closest(".panel");
        if (panel && panel.id) {
          show(panel.id, false);
          setTimeout(function () { target.scrollIntoView({ block: "start" }); }, 0);
          return;
        }
        return show(btns[0].dataset.tab, false);
      }
      if (push) {
        try { history.replaceState(null, "", "#" + id); } catch (e) { location.hash = id; }
        var top = tabBar.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0) - 4;
        if (window.scrollY > top) window.scrollTo(0, top);
      }
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { show(b.dataset.tab, true); }); });
    show((location.hash || "").slice(1) || btns[0].dataset.tab, false);
    window.addEventListener("hashchange", function () { show(location.hash.slice(1), false); });
  }

  /* ---------- quiz ---------- */
  document.querySelectorAll(".q[data-answer]").forEach(function (q) {
    var ans = q.dataset.answer.toUpperCase();
    var multi = q.hasAttribute("data-multi");
    var buttons = Array.prototype.slice.call(q.querySelectorAll(".opts button"));
    var details = q.querySelector("details");
    buttons.forEach(function (b, i) {
      var letter = b.dataset.opt || String.fromCharCode(65 + i);
      b.dataset.opt = letter;
      b.type = "button";
      b.innerHTML = '<span class="bubble" aria-hidden="true">' + letter + "</span><span>" + b.innerHTML + "</span>";
    });
    function reveal() {
      buttons.forEach(function (b) {
        var isAns = ans.indexOf(b.dataset.opt) >= 0;
        if (isAns) b.classList.add("correct");
        else if (b.classList.contains("picked") || b.classList.contains("picked-multi")) b.classList.add("wrong");
        b.classList.remove("picked-multi");
        b.disabled = true;
      });
      if (details) details.open = true;
    }
    if (!multi) {
      buttons.forEach(function (b) {
        b.addEventListener("click", function () { b.classList.add("picked"); reveal(); });
      });
    } else {
      buttons.forEach(function (b) {
        b.addEventListener("click", function () { b.classList.toggle("picked-multi"); b.classList.toggle("picked"); });
      });
      var chk = document.createElement("button");
      chk.type = "button"; chk.className = "multi-check"; chk.textContent = "多選題：選好後按這裡對答案";
      q.querySelector(".opts").after(chk);
      chk.addEventListener("click", function () { reveal(); chk.remove(); });
    }
  });

  /* ---------- countdown ---------- */
  document.querySelectorAll("[data-countdown]").forEach(function (el) {
    var target = new Date(el.dataset.countdown).getTime();
    function tick() {
      var ms = target - Date.now();
      var out = el.querySelector(".num"), unit = el.querySelector(".unit");
      if (ms <= 0) { out.textContent = "考試週"; unit.textContent = "加油，穩穩寫！"; return; }
      var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5);
      out.innerHTML = d + "<small>天</small>" + h + "<small>小時</small>";
      unit.textContent = "距離第一節數學開考（10/07 08:20）";
    }
    tick(); setInterval(tick, 60000);
  });

  /* ---------- checklists ---------- */
  document.querySelectorAll(".checklist[data-key]").forEach(function (ul) {
    var key = "janet-check-" + ul.dataset.key;
    var saved = store(key) || {};
    ul.querySelectorAll("input[type=checkbox]").forEach(function (cb, i) {
      cb.id = cb.id || (ul.dataset.key + "-c" + i);
      if (saved[i]) cb.checked = true;
      cb.addEventListener("change", function () { saved[i] = cb.checked; store(key, saved); });
    });
  });
})();
