(function () {
  var details = document.querySelector(".nav-details");
  if (details) {
    details.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        details.open = false;
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") details.open = false;
    });
  }

  document.querySelectorAll(".device-shot").forEach(function (img) {
    var show = function () {
      img.hidden = false;
      var screen = img.closest(".device-screen");
      if (!screen) return;
      var fallback = screen.querySelector(".device-fallback");
      var badge = screen.querySelector(".preview-badge");
      if (fallback) fallback.hidden = true;
      if (badge) badge.hidden = true;
    };
    if (img.complete && img.naturalWidth > 0) show();
    else img.addEventListener("load", show);
  });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  if (!reduce && "IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    document.querySelectorAll(".card, .spotlight, .band, .why-card, .plan-card, .steps li, .faq-item, .tour-block, .split, .cta-band").forEach(function (el) {
      el.classList.add("reveal");
      seen.observe(el);
    });
  }

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".shot-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".shot-dot"));
    var index = Math.max(0, slides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    }));
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    }
    var prev = root.querySelector(".shot-prev");
    var next = root.querySelector(".shot-next");
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { show(i); });
    });
    var view = root.querySelector(".shot-carousel-view");
    if (view) {
      var startX = 0;
      view.addEventListener("touchstart", function (event) {
        startX = event.changedTouches[0].clientX;
      }, { passive: true });
      view.addEventListener("touchend", function (event) {
        var delta = event.changedTouches[0].clientX - startX;
        if (Math.abs(delta) < 40) return;
        show(index + (delta < 0 ? 1 : -1));
      }, { passive: true });
    }
  });

  var tours = [];

  document.querySelectorAll(".tour-block").forEach(function (block) {
    var stage = block.querySelector(".tour-stage");
    var steps = Array.prototype.slice.call(block.querySelectorAll(".tour-step"));
    if (!stage || !steps.length) return;

    stage.innerHTML =
      '<div class="device tour-device">' +
        '<div class="tour-screen">' +
          '<div class="tour-reel"><img alt="" src=""></div>' +
          '<div class="swap-ring" hidden></div>' +
        "</div>" +
        '<div class="swap-float" hidden><i class="swap-arrow" aria-hidden="true"></i>Replace Exercise</div>' +
      "</div>" +
      '<div class="tour-dots"></div>';

    var img = stage.querySelector("img");
    var reel = stage.querySelector(".tour-reel");
    var screen = stage.querySelector(".tour-screen");
    var ring = stage.querySelector(".swap-ring");
    var floatLabel = stage.querySelector(".swap-float");
    var dots = stage.querySelector(".tour-dots");

    steps.forEach(function (step, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tour-dot";
      var title = step.querySelector("h3");
      button.setAttribute("aria-label", title ? title.textContent : "Screen " + (index + 1));
      button.addEventListener("click", function () {
        var top = step.getBoundingClientRect().top + window.scrollY - (window.innerWidth >= 960 ? window.innerHeight * 0.22 : stage.offsetHeight + 80);
        window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      });
      dots.appendChild(button);
    });

    tours.push({
      steps: steps,
      stage: stage,
      img: img,
      reel: reel,
      screen: screen,
      ring: ring,
      floatLabel: floatLabel,
      dots: dots.querySelectorAll(".tour-dot")
    });
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function paint() {
    tours.forEach(function (tour) {
      var stageRect = tour.stage.getBoundingClientRect();
      var anchor = window.innerWidth >= 960
        ? stageRect.top + stageRect.height * 0.4
        : stageRect.bottom + 28;
      var active = tour.steps[0];
      tour.steps.forEach(function (step) {
        var rect = step.getBoundingClientRect();
        if (rect.top <= anchor && rect.bottom > anchor) active = step;
      });

      tour.steps.forEach(function (step, index) {
        var on = step === active;
        step.classList.toggle("is-active", on);
        if (tour.dots[index]) {
          if (on) tour.dots[index].setAttribute("aria-current", "true");
          else tour.dots[index].removeAttribute("aria-current");
        }
      });

      var src = active.getAttribute("data-src");
      var alt = active.getAttribute("data-alt") || "";
      if (src && tour.img.getAttribute("src") !== src) {
        tour.img.style.opacity = reduce ? "1" : "0";
        tour.img.alt = alt;
        tour.img.src = src;
        if (tour.img.complete && tour.img.naturalWidth) tour.img.style.opacity = "1";
      }

      var progress = 0;
      var rect = active.getBoundingClientRect();
      if (rect.height) progress = clamp((anchor - rect.top) / rect.height, 0, 1);

      var apply = function () {
        tour.img.style.width = "100%";

        var overflow = tour.img.offsetHeight - tour.screen.clientHeight;
        var y = 0;
        if (!reduce && overflow > 12) y = -overflow * progress;
        else if (overflow < -12) y = -overflow / 2;
        var dpr = window.devicePixelRatio || 1;
        y = Math.round(y * dpr) / dpr;
        tour.reel.style.transform = "translate3d(0," + y + "px,0)";

        var focus = parseFloat(active.getAttribute("data-focus") || "");
        if (!focus || !tour.img.offsetHeight) {
          tour.ring.hidden = true;
          tour.floatLabel.hidden = true;
          return;
        }
        var center = y + tour.img.offsetHeight * (focus / 100);
        var visible = center > 28 && center < tour.screen.clientHeight - 28;
        tour.ring.hidden = !visible;
        tour.floatLabel.hidden = !visible;
        if (visible) {
          tour.ring.style.top = center - 13 + "px";
          tour.floatLabel.style.top = tour.screen.offsetTop + center - tour.floatLabel.offsetHeight / 2 + "px";
        }
      };

      if (tour.img.complete && tour.img.naturalWidth) apply();
      else tour.img.addEventListener("load", function onLoad() {
        tour.img.removeEventListener("load", onLoad);
        tour.img.style.opacity = "1";
        apply();
      });
    });
  }

  var frame = 0;
  function requestPaint() {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      paint();
    });
  }

  document.querySelectorAll(".tour-reel img").forEach(function (img) {
    img.addEventListener("load", function () {
      img.style.opacity = "1";
      requestPaint();
    });
  });

  paint();
  window.addEventListener("scroll", requestPaint, { passive: true });
  window.addEventListener("resize", requestPaint);
})();
