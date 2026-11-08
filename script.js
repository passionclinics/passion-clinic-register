/* =========================================================
   Passion Clinics – Customer Registration
   ---------------------------------------------------------
   Everything you normally need to change is in CONFIG below.
   ========================================================= */

const CONFIG = {
  /**
   * Where submissions are sent:
   *   "google-sheets"  → Google Apps Script Web App URL (ends with /exec)  ← default
   *   "power-automate" → Power Automate "When an HTTP request is received" URL (Excel)
   */
  ENDPOINT_TYPE: "google-sheets",

  /**
   * Paste the full Web App / flow URL here (see README.md).
   * While this is empty the form will NOT pretend to save anything;
   * it shows an error message instead.
   */
  ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbxr6jyzBmzQOJKuuNTfE6n5TdD-iV2QRAO5Kw6lvFc5aXYrjiEiijLtJwVBAfz7oOsa/exec",

  /** Abort the request if the flow does not answer in time (ms). */
  REQUEST_TIMEOUT_MS: 25000,

  /**
   * With Google Sheets, services are loaded live from the "الخدمات" tab,
   * so the clinic edits them in the sheet — no code change needed.
   * The list below is only a fallback used if the sheet can't be reached
   * (or when ENDPOINT_TYPE is "power-automate").
   * `value` is what gets saved; `ar` / `en` are the labels shown.
   */
  LOAD_SERVICES_FROM_SHEET: true,
  SERVICES: [
    { value: "إزالة الشعر بالليزر", ar: "إزالة الشعر بالليزر", en: "Laser Hair Removal" },
    { value: "العناية بالبشرة",     ar: "العناية بالبشرة",     en: "Skin Care" },
    { value: "الحقن التجميلية",     ar: "الحقن التجميلية",     en: "Cosmetic Injections" },
    { value: "نحت القوام",          ar: "نحت القوام",          en: "Body Contouring" },
    { value: "استشارة",             ar: "استشارة",             en: "Consultation" }
  ],

  /** Contact-time slots: from START to END (24h, inclusive) every STEP minutes. */
  TIME_SLOTS: { start: "09:00", end: "21:00", stepMinutes: 30 },

  /** "ar" or "en" */
  DEFAULT_LANG: "ar",

  /** Show the English / العربية switch. */
  ENABLE_LANGUAGE_SWITCH: true
};

/* ---------------------------------------------------------
   Do not edit below unless you are changing behaviour.
   --------------------------------------------------------- */
(function () {
  "use strict";

  const DAYS = [
    { value: "السبت",    en: "Saturday" },
    { value: "الأحد",    en: "Sunday" },
    { value: "الاثنين",  en: "Monday" },
    { value: "الثلاثاء", en: "Tuesday" },
    { value: "الأربعاء", en: "Wednesday" },
    { value: "الخميس",   en: "Thursday" },
    { value: "الجمعة",   en: "Friday" }
  ];

  const I18N = {
    ar: {
      pageTitle: "طلب حجز موعد | Passion Clinics",
      title: "طلب حجز موعد",
      subtitle: "يرجى تعبئة البيانات التالية.",
      fullName: "الاسم الكامل",
      mobile: "رقم الجوال",
      mobileHint: "مثال: 05XXXXXXXX أو 5XXXXXXXX",
      email: "البريد الإلكتروني",
      optional: "(اختياري)",
      service: "الخدمة المطلوبة",
      contactDay: "اليوم المناسب للتواصل",
      contactTime: "الوقت المناسب للتواصل",
      notes: "ملاحظات إضافية",
      consent: "تأكيد البيانات",
      submit: "إرسال البيانات",
      sending: "جارٍ الإرسال…",
      choose: "اختر…",
      chooseService: "اختر الخدمة",
      chooseDay: "اختر اليوم",
      chooseTime: "اختر الوقت",
      am: "ص",
      pm: "م",
      successTitle: "تم استلام طلب الحجز بنجاح",
      successText: "شكرًا لك، سيتم التواصل معك في الوقت الذي اخترته لتأكيد الموعد.",
      newEntry: "طلب جديد",
      langSwitch: "English",
      contactTitle: "أو تواصل معنا مباشرة",
      multiHint: "(يمكن اختيار أكثر من خدمة)",
      whatsapp: "تواصل عبر واتساب",
      call: "اتصل بنا",
      // validation
      errNameRequired: "يرجى إدخال الاسم الكامل.",
      errNameShort: "يرجى إدخال الاسم الكامل بشكل صحيح.",
      errMobileRequired: "يرجى إدخال رقم الجوال.",
      errMobileInvalid: "رقم الجوال غير صحيح. يجب أن يبدأ بـ 5 ويتكون من 9 أرقام (مثال: 05XXXXXXXX).",
      errEmailInvalid: "صيغة البريد الإلكتروني غير صحيحة.",
      errService: "يرجى اختيار خدمة واحدة على الأقل.",
      errDay: "يرجى اختيار اليوم المناسب للتواصل.",
      errTime: "يرجى اختيار الوقت المناسب للتواصل.",
      errConsent: "يرجى تأكيد البيانات لإتمام الطلب.",
      errSummary: "يرجى تصحيح الحقول المحددة ثم إعادة المحاولة.",
      // submission
      errNotConfigured: "تعذّر إرسال البيانات: لم يتم ربط النموذج بقاعدة البيانات بعد. يرجى التواصل مع إدارة العيادة.",
      errTimeout: "انتهت مهلة الاتصال ولم يتم تأكيد حفظ بياناتك. يرجى المحاولة مرة أخرى.",
      errNetwork: "تعذّر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.",
      errFailed: "عذرًا، لم يتم حفظ بياناتك بسبب خطأ في الخادم. يرجى المحاولة مرة أخرى."
    },
    en: {
      pageTitle: "Book an Appointment | Passion Clinics",
      title: "Book an Appointment",
      subtitle: "Please fill in the following details.",
      fullName: "Full Name",
      mobile: "Mobile Number",
      mobileHint: "e.g. 05XXXXXXXX or 5XXXXXXXX",
      email: "Email Address",
      optional: "(optional)",
      service: "Requested Service",
      contactDay: "Preferred Contact Day",
      contactTime: "Preferred Contact Time",
      notes: "Additional Notes",
      consent: "I confirm my details",
      submit: "Submit",
      sending: "Sending…",
      choose: "Select…",
      chooseService: "Select a service",
      chooseDay: "Select a day",
      chooseTime: "Select a time",
      am: "AM",
      pm: "PM",
      successTitle: "Your booking request has been received",
      successText: "Thank you. We will contact you at the time you selected to confirm your appointment.",
      newEntry: "New request",
      langSwitch: "العربية",
      contactTitle: "Or contact us directly",
      multiHint: "(you can select more than one)",
      whatsapp: "Chat on WhatsApp",
      call: "Call us",
      errNameRequired: "Please enter your full name.",
      errNameShort: "Please enter a valid full name.",
      errMobileRequired: "Please enter your mobile number.",
      errMobileInvalid: "Invalid Saudi mobile number. It must start with 5 and have 9 digits (e.g. 05XXXXXXXX).",
      errEmailInvalid: "Please enter a valid email address.",
      errService: "Please select at least one service.",
      errDay: "Please select a preferred contact day.",
      errTime: "Please select a preferred contact time.",
      errConsent: "Please confirm your details to continue.",
      errSummary: "Please correct the highlighted fields and try again.",
      errNotConfigured: "Submission failed: the form is not connected to the data store yet. Please contact the clinic.",
      errTimeout: "The request timed out and your details were not confirmed as saved. Please try again.",
      errNetwork: "Could not reach the server. Please check your internet connection and try again.",
      errFailed: "Sorry, your details were not saved due to a server error. Please try again."
    }
  };

  /* ---------- Elements ---------- */
  const $ = (id) => document.getElementById(id);
  const form = $("registrationForm");
  const fieldset = $("formFields");
  const submitBtn = $("submitBtn");
  const submitLabel = $("submitLabel");
  const alertBox = $("formAlert");
  const successPanel = $("successPanel");
  const els = {
    fullName: $("fullName"),
    mobile: $("mobile"),
    service: $("service"),
    contactDay: $("contactDay"),
    contactTime: $("contactTime"),
    notes: $("notes"),
    consent: $("consent"),
    website: $("website")
  };

  let lang = I18N[CONFIG.DEFAULT_LANG] ? CONFIG.DEFAULT_LANG : "ar";
  let submitting = false;
  let attempted = false;
  let lastErrorKey = null;

  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.ar[key] || key;

  /* ---------- Helpers ---------- */
  function toLatinDigits(str) {
    return String(str || "")
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  }

  /** Returns "+9665XXXXXXXX" or null. Accepts 05…, 5…, 9665…, +9665…, 009665… */
  function normalizeSaudiMobile(raw) {
    let d = toLatinDigits(raw).replace(/[^\d]/g, "");
    if (d.startsWith("00966")) d = d.slice(5);
    else if (d.startsWith("966")) d = d.slice(3);
    if (d.startsWith("0")) d = d.slice(1);
    return /^5\d{8}$/.test(d) ? "+966" + d : null;
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function riyadhTimestamp() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date()).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
  }

  function buildTimeSlots() {
    const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
    const start = toMin(CONFIG.TIME_SLOTS.start);
    const end = toMin(CONFIG.TIME_SLOTS.end);
    const step = Math.max(5, CONFIG.TIME_SLOTS.stepMinutes | 0);
    const slots = [];
    for (let m = start; m <= end; m += step) {
      const h = Math.floor(m / 60), mm = m % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    }
    return slots;
  }

  function timeLabel(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? t("am") : t("pm")}`;
  }

  function fillSelect(select, placeholder, options) {
    const current = select.value;
    select.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder;
    ph.disabled = true;
    ph.selected = true;
    select.appendChild(ph);
    options.forEach(({ value, label }) => {
      const o = document.createElement("option");
      o.value = value;
      o.textContent = label;
      select.appendChild(o);
    });
    if (current && options.some((o) => o.value === current)) select.value = current;
  }

  let services = CONFIG.SERVICES.slice();

  /** Load the active services from the sheet's "الخدمات" tab. */
  async function loadServicesFromSheet() {
    if (!CONFIG.LOAD_SERVICES_FROM_SHEET || !CONFIG.ENDPOINT_URL ||
        CONFIG.ENDPOINT_TYPE === "power-automate") return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const sep = CONFIG.ENDPOINT_URL.includes("?") ? "&" : "?";
      const res = await fetch(`${CONFIG.ENDPOINT_URL}${sep}action=services&_=${Date.now()}`,
        { cache: "no-store", redirect: "follow", signal: controller.signal });
      const data = await res.json();
      if (data && data.ok === true && Array.isArray(data.services) && data.services.length) {
        services = data.services
          .filter((s) => s && s.ar)
          .map((s) => ({ value: String(s.ar), ar: String(s.ar), en: String(s.en || s.ar) }));
        renderOptions();
        applyServiceFromUrl();
      }
    } catch (err) {
      console.warn("Using fallback services list:", err);
    } finally {
      clearTimeout(timer);
    }
  }

  let userPickedService = false;

  /** Selected services (array of values). */
  function selectedServices() {
    return Array.from(els.service.querySelectorAll('input[type="checkbox"]:checked')).map((c) => c.value);
  }

  /** Multi-select service chips (keeps current selection when re-rendered). */
  function renderServiceChips() {
    const keep = new Set(selectedServices());
    els.service.innerHTML = "";
    services.forEach((s, i) => {
      const label = document.createElement("label");
      label.className = "chip";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "service";
      input.value = s.value;
      input.id = `service-${i}`;
      input.checked = keep.has(s.value);
      const box = document.createElement("span");
      box.className = "chip__box";
      box.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = lang === "en" ? (s.en || s.ar) : s.ar;
      label.append(input, box, text);
      els.service.appendChild(label);
    });
  }

  /** Ad links can preselect services: ?service=إزالة الشعر بالليزر  (several: comma-separated) */
  function applyServiceFromUrl() {
    const wanted = new URLSearchParams(location.search).get("service");
    if (!wanted || userPickedService) return;
    wanted.split(/[,،]/).map((w) => w.trim().toLowerCase()).filter(Boolean).forEach((w) => {
      const match = services.find((s) => [s.value, s.ar, s.en].some((x) => String(x).trim().toLowerCase() === w));
      if (!match) return;
      const box = Array.from(els.service.querySelectorAll("input")).find((c) => c.value === match.value);
      if (box) box.checked = true;
    });
  }

  function renderOptions() {
    renderServiceChips();
    fillSelect(els.contactDay, t("chooseDay"),
      DAYS.map((d) => ({ value: d.value, label: lang === "en" ? d.en : d.value })));
    fillSelect(els.contactTime, t("chooseTime"),
      buildTimeSlots().map((s) => ({ value: s, label: timeLabel(s) })));
  }

  /* ---------- Language ---------- */
  function applyLanguage() {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t("pageTitle");
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    const toggle = $("langToggle");
    toggle.textContent = t("langSwitch");
    toggle.lang = lang === "ar" ? "en" : "ar";
    renderOptions();
    if (submitting) submitLabel.textContent = t("sending");
    if (attempted) validateAll();
    if (lastErrorKey) showAlert(lastErrorKey);
  }

  /* ---------- Validation ---------- */
  const validators = {
    fullName() {
      const v = els.fullName.value.trim().replace(/\s+/g, " ");
      if (!v) return "errNameRequired";
      if (v.length < 3 || !/[\p{L}]/u.test(v)) return "errNameShort";
      return null;
    },
    mobile() {
      const v = els.mobile.value.trim();
      if (!v) return "errMobileRequired";
      return normalizeSaudiMobile(v) ? null : "errMobileInvalid";
    },
    service() { return selectedServices().length ? null : "errService"; },
    contactDay() { return els.contactDay.value ? null : "errDay"; },
    contactTime() { return els.contactTime.value ? null : "errTime"; },
    consent() { return els.consent.checked ? null : "errConsent"; }
  };

  function setFieldError(name, key) {
    const wrapper = form.querySelector(`[data-field="${name}"]`);
    const msg = $(`${name}-error`);
    const input = els[name];
    if (key) {
      wrapper.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      msg.textContent = t(key);
    } else {
      wrapper.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      msg.textContent = "";
    }
  }

  function validateField(name) {
    const key = validators[name]();
    setFieldError(name, key);
    return !key;
  }

  /** Returns the first invalid element, or null if the form is valid. */
  function validateAll() {
    let first = null;
    Object.keys(validators).forEach((name) => {
      if (!validateField(name) && !first) first = els[name];
    });
    return first;
  }

  /* ---------- UI states ---------- */
  function showAlert(key) {
    lastErrorKey = key;
    alertBox.textContent = t(key);
    alertBox.hidden = false;
  }

  function hideAlert() {
    lastErrorKey = null;
    alertBox.hidden = true;
    alertBox.textContent = "";
  }

  function setLoading(on) {
    submitting = on;
    fieldset.disabled = on;
    submitBtn.classList.toggle("is-loading", on);
    submitBtn.setAttribute("aria-busy", on ? "true" : "false");
    submitLabel.textContent = on ? t("sending") : t("submit");
  }

  /** Snap Pixel conversion — fired ONLY after the sheet confirms the row was saved. */
  function trackConversion(payload) {
    try {
      if (typeof window.snaptr === "function") {
        window.snaptr("track", "SIGN_UP", {
          sign_up_method: "registration_form",
          item_category: payload.service
        });
      }
    } catch (err) {
      console.warn("Snap Pixel event failed:", err);
    }
  }

  function showSuccess() {
    hideAlert();
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    form.reset();
    attempted = false;
    Object.keys(validators).forEach((n) => setFieldError(n, null));
    renderOptions();
    successPanel.hidden = true;
    form.hidden = false;
    els.fullName.focus();
  }

  /* ---------- Submission ---------- */
  function buildPayload() {
    return {
      fullName: els.fullName.value.trim().replace(/\s+/g, " "),
      mobile: normalizeSaudiMobile(els.mobile.value),
      email: "",
      service: selectedServices().join("، "),
      services: selectedServices(),
      contactDay: els.contactDay.value,
      contactTime: els.contactTime.value,
      notes: els.notes.value.trim(),
      consent: true,
      submittedAt: riyadhTimestamp(),
      language: lang
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;               // prevents double submission

    hideAlert();
    attempted = true;

    const firstInvalid = validateAll();
    if (firstInvalid) {
      showAlert("errSummary");
      (firstInvalid === els.service ? (els.service.querySelector("input") || els.service) : firstInvalid).focus();
      return;
    }

    // Bot filled the hidden honeypot – do nothing and claim nothing.
    if (els.website.value) return;

    if (!CONFIG.ENDPOINT_URL) {
      showAlert("errNotConfigured");
      return;
    }

    const payload = buildPayload();
    setLoading(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

    try {
      // Google Apps Script cannot answer CORS preflight requests, so it gets a
      // "simple" text/plain request (body is still JSON). Power Automate gets JSON.
      const isGoogle = CONFIG.ENDPOINT_TYPE !== "power-automate";
      const res = await fetch(CONFIG.ENDPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": isGoogle ? "text/plain;charset=utf-8" : "application/json" },
        body: JSON.stringify(payload),
        redirect: "follow",
        signal: controller.signal
      });

      let body = null;
      try { body = await res.json(); } catch (_) { /* non-JSON response */ }

      // Success ONLY when the backend confirms the row was written:
      // HTTP 200 with {"ok": true}. Apps Script returns this after appending
      // the row; Power Automate's Response action runs after the Excel row.
      // A 202 "Accepted" (flow only queued) is NOT treated as success.
      if (res.status === 200 && body && body.ok === true) {
        showSuccess();
        trackConversion(payload);
      } else {
        console.error("Submission not confirmed:", res.status, body);
        showAlert("errFailed");
      }
    } catch (err) {
      console.error("Submission error:", err);
      showAlert(err && err.name === "AbortError" ? "errTimeout" : "errNetwork");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    form.addEventListener("submit", handleSubmit);

    Object.keys(validators).forEach((name) => {
      const el = els[name];
      const evt = el.tagName === "SELECT" || el.tagName === "DIV" || el.type === "checkbox" ? "change" : "blur";
      el.addEventListener(evt, () => {
        if (el.value || el.checked || el.tagName === "DIV" || attempted) validateField(name);
      });
      el.addEventListener("input", () => {
        if (attempted || el.closest(".field").classList.contains("is-invalid")) validateField(name);
      });
    });

    // Tidy the mobile number on blur (convert Arabic digits, keep it readable)
    els.mobile.addEventListener("blur", () => {
      const latin = toLatinDigits(els.mobile.value).replace(/[^\d+]/g, "");
      if (latin !== els.mobile.value) els.mobile.value = latin;
    });

    $("newEntryBtn").addEventListener("click", resetForm);
    els.service.addEventListener("change", () => { userPickedService = true; });

    // Snap Pixel: count WhatsApp / call clicks as separate custom events
    const trackClick = (eventName, desc) => {
      try { if (typeof window.snaptr === "function") window.snaptr("track", eventName, { description: desc }); } catch (_) {}
    };
    $("waBtn").addEventListener("click", () => trackClick("CUSTOM_EVENT_1", "whatsapp_click"));
    $("callBtn").addEventListener("click", () => trackClick("CUSTOM_EVENT_2", "call_click"));

    $("langToggle").addEventListener("click", () => {
      lang = lang === "ar" ? "en" : "ar";
      applyLanguage();
    });
  }

  /* ---------- Init ---------- */
  $("year").textContent = new Date().getFullYear();
  $("langBar").hidden = !CONFIG.ENABLE_LANGUAGE_SWITCH;
  bindEvents();
  applyLanguage();
  applyServiceFromUrl();
  loadServicesFromSheet();
})();
