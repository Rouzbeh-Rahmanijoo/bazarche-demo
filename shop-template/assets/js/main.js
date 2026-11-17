/* =========================================================
   اسکریپت قالب «بازارچه» — بدون وابستگی به کتابخانه خارجی
   داده‌های محصولات در فایل products.js قرار دارد.
   ========================================================= */
(function () {
  "use strict";

  var CART_KEY = "bazarche_cart";
  var FREE_SHIPPING_FROM = 2000000; // ارسال رایگان برای خرید بالای این مبلغ (تومان)
  var SHIPPING_COST = 45000;        // هزینه ارسال (تومان)
  var COUPONS = { WELCOME: 10, BAHAR: 15 }; // کد تخفیف: درصد

  /* ---------- ابزارها ---------- */
  var faDigits = "۰۱۲۳۴۵۶۷۸۹";
  function fa(n) {
    return String(n).replace(/\d/g, function (d) { return faDigits[d]; });
  }
  function money(n) {
    return fa(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "٬"));
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function productById(id) {
    var list = window.PRODUCTS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === Number(id)) return list[i];
    return null;
  }

  /* ---------- سبد خرید ---------- */
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    updateBadge();
  }
  function cartCount() {
    return readCart().reduce(function (s, i) { return s + i.qty; }, 0);
  }
  function updateBadge() {
    var c = cartCount();
    $$(".js-cart-count").forEach(function (el) {
      el.textContent = fa(c);
      el.style.display = c ? "" : "none";
    });
  }
  function addToCart(id, qty, opts) {
    var cart = readCart();
    var key = id + "|" + ((opts && opts.variant) || "");
    var found = cart.filter(function (i) { return i.key === key; })[0];
    if (found) found.qty += qty;
    else cart.push({ key: key, id: Number(id), qty: qty, variant: (opts && opts.variant) || "" });
    saveCart(cart);
  }

  /* ---------- پیام کوتاه (Toast) ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $(".toast");
    if (!el) return;
    $("span", el).textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------- منوی موبایل و فیلتر ---------- */
  var overlay = $(".overlay");
  function closePanels() {
    $$(".nav.open, .sidebar.open").forEach(function (el) { el.classList.remove("open"); });
    if (overlay) overlay.classList.remove("show");
  }
  $$("[data-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = $(btn.getAttribute("data-open"));
      if (!target) return;
      target.classList.add("open");
      if (overlay) overlay.classList.add("show");
    });
  });
  if (overlay) overlay.addEventListener("click", closePanels);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanels(); });

  /* ---------- اسلایدر صفحه اصلی ---------- */
  var slider = $(".slider");
  if (slider) {
    var slides = $$(".slide", slider);
    var dotsWrap = $(".dots", slider);
    var current = 0, timer;
    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "اسلاید " + fa(i + 1));
      b.addEventListener("click", function () { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = $$("button", dotsWrap);
    function go(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("active", i === current); });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === current); });
    }
    function restart() { clearInterval(timer); timer = setInterval(function () { go(current + 1); }, 6000); }
    $(".slider-next", slider).addEventListener("click", function () { go(current + 1); restart(); });
    $(".slider-prev", slider).addEventListener("click", function () { go(current - 1); restart(); });
    slider.addEventListener("mouseenter", function () { clearInterval(timer); });
    slider.addEventListener("mouseleave", restart);
    go(0); restart();
  }

  /* ---------- شمارنده معکوس (تا پایان امروز) ---------- */
  var cd = $(".countdown");
  if (cd) {
    var tick = function () {
      var now = new Date();
      var end = new Date(now); end.setHours(23, 59, 59, 999);
      var diff = Math.max(0, end - now);
      var h = Math.floor(diff / 3600000), m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
      var pad = function (n) { return fa(("0" + n).slice(-2)); };
      $("[data-h]", cd).textContent = pad(h);
      $("[data-m]", cd).textContent = pad(m);
      $("[data-s]", cd).textContent = pad(s);
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- افزودن به سبد (کارت‌ها و صفحه محصول) ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-add");
    if (btn) {
      e.preventDefault();
      var id = btn.getAttribute("data-id");
      var qtyInput = $("#qty");
      var qty = qtyInput && btn.hasAttribute("data-use-qty") ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      var sizeBtn = $(".sizes .active");
      var colorBtn = $(".swatches .active");
      var variant = [colorBtn && colorBtn.getAttribute("data-name"), sizeBtn && sizeBtn.textContent.trim()].filter(Boolean).join(" / ");
      addToCart(id, qty, { variant: variant });
      toast("به سبد خرید اضافه شد");
      return;
    }
    var wish = e.target.closest(".wish");
    if (wish) {
      e.preventDefault();
      wish.classList.toggle("on");
      toast(wish.classList.contains("on") ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد");
    }
  });

  /* ---------- صفحه محصول: گالری، تب‌ها، تعداد، گزینه‌ها ---------- */
  var mainImg = $("#main-img");
  $$(".thumbs button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".thumbs button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      if (mainImg) mainImg.src = b.getAttribute("data-src");
    });
  });
  $$(".tab-list button").forEach(function (b) {
    b.addEventListener("click", function () {
      var wrap = b.closest(".tabs");
      $$(".tab-list button", wrap).forEach(function (x) { x.classList.remove("active"); });
      $$(".tab-pane", wrap).forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      $(b.getAttribute("data-tab"), wrap).classList.add("active");
    });
  });
  $$(".sizes button, .swatches .swatch").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(b.parentNode.children).forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
    });
  });
  var qty = $("#qty");
  if (qty) {
    $(".qty-minus").addEventListener("click", function () { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); });
    $(".qty-plus").addEventListener("click", function () { qty.value = Math.min(99, (parseInt(qty.value, 10) || 1) + 1); });
  }

  /* ---------- صفحه فروشگاه: فیلتر قیمت و مرتب‌سازی (نمایشی) ---------- */
  var range = $("#price-range");
  if (range) {
    var out = $("#price-out");
    var upd = function () { out.textContent = money(range.value) + " تومان"; };
    range.addEventListener("input", upd); upd();
  }
  $$(".sorts button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".sorts button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
    });
  });
  $$(".pagination a").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      $$(".pagination a").forEach(function (x) { x.classList.remove("active"); });
      a.classList.add("active");
    });
  });

  /* ---------- صفحه سبد خرید ---------- */
  var cartBody = $("#cart-items");
  if (cartBody) {
    var appliedPercent = 0;
    var render = function () {
      var cart = readCart();
      var wrap = $("#cart-wrap"), emptyBox = $("#cart-empty");
      if (!cart.length) { wrap.style.display = "none"; emptyBox.style.display = ""; return; }
      wrap.style.display = ""; emptyBox.style.display = "none";

      var sub = 0, saved = 0;
      cartBody.innerHTML = "";
      cart.forEach(function (item) {
        var p = productById(item.id);
        if (!p) return;
        sub += p.price * item.qty;
        if (p.old) saved += (p.old - p.price) * item.qty;
        var row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML =
          '<a href="product.html"><img src="assets/img/' + p.img + '" alt=""></a>' +
          '<div><h4><a href="product.html">' + p.title + '</a></h4>' +
          '<div class="sub">' + (item.variant ? item.variant + " • " : "") + 'قیمت واحد: ' + money(p.price) + ' تومان</div>' +
          '<button class="remove" data-key="' + item.key + '"><svg class="icon icon-sm"><use href="#i-trash"/></svg>حذف</button></div>' +
          '<div class="qty"><button data-key="' + item.key + '" data-d="-1" aria-label="کاهش">−</button>' +
          '<input type="text" readonly value="' + fa(item.qty) + '"><button data-key="' + item.key + '" data-d="1" aria-label="افزایش">+</button></div>' +
          '<div class="item-total">' + money(p.price * item.qty) + ' <small>تومان</small></div>';
        cartBody.appendChild(row);
      });

      var coupon = sub * appliedPercent / 100;
      var shipping = sub - coupon >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
      $("#sum-sub").textContent = money(sub + saved) + " تومان";
      $("#sum-saved").textContent = "−" + money(saved) + " تومان";
      $("#row-saved").style.display = saved ? "" : "none";
      $("#sum-coupon").textContent = "−" + money(coupon) + " تومان";
      $("#row-coupon").style.display = coupon ? "" : "none";
      $("#sum-ship").textContent = shipping ? money(shipping) + " تومان" : "رایگان";
      $("#sum-total").textContent = money(sub - coupon + shipping) + " تومان";
      $("#cart-title-count").textContent = fa(cartCount()) + " کالا";
      var left = FREE_SHIPPING_FROM - (sub - coupon);
      $("#ship-note").textContent = left > 0
        ? "با خرید " + money(left) + " تومان دیگر، ارسال رایگان می‌شود."
        : "تبریک! ارسال سفارش شما رایگان است.";
    };

    cartBody.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-key]");
      if (!b) return;
      var cart = readCart();
      var key = b.getAttribute("data-key");
      var item = cart.filter(function (i) { return i.key === key; })[0];
      if (!item) return;
      if (b.classList.contains("remove")) {
        cart = cart.filter(function (i) { return i.key !== key; });
      } else {
        item.qty += Number(b.getAttribute("data-d"));
        if (item.qty < 1) cart = cart.filter(function (i) { return i.key !== key; });
      }
      saveCart(cart); render();
    });

    $("#coupon-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var code = $("#coupon-code").value.trim().toUpperCase();
      var msg = $("#coupon-msg");
      if (COUPONS[code]) {
        appliedPercent = COUPONS[code];
        msg.style.color = "#15803d";
        msg.textContent = "کد تخفیف " + fa(appliedPercent) + " درصدی اعمال شد.";
      } else {
        appliedPercent = 0;
        msg.style.color = "#e11d48";
        msg.textContent = "کد تخفیف معتبر نیست.";
      }
      render();
    });
    $("#clear-cart").addEventListener("click", function () { saveCart([]); render(); });
    render();
  }

  /* ---------- دکمه بازگشت به بالا ---------- */
  var top = $(".to-top");
  if (top) {
    window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 600); }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- فرم خبرنامه ---------- */
  $$(".js-newsletter").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); f.reset(); toast("با تشکر! ایمیل شما ثبت شد."); });
  });

  updateBadge();
})();
