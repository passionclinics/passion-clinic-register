# Passion Clinics – صفحة تسجيل بيانات العملاء

صفحة تسجيل واحدة مكتوبة بـ HTML وCSS وJavaScript، ولا تحتاج أي build. تُرسل كل تسجيل إلى **Google Sheets** عبر **Google Apps Script**، وهو مجاني ولا يحتاج ترخيصًا مدفوعًا.
الربط مع Excel عبر Power Automate ما زال مدعومًا كخيار بديل (القسم 8).

```
passion-clinic/
  index.html                       الصفحة
  style.css                        التصميم: ألوان الهوية، اتجاه RTL، متجاوب
  script.js                        التحقق والإرسال والإعدادات (CONFIG)
  assets/passion-clinics-logo.png  الشعار الرسمي
  README.md
```

> **مهم:** النموذج لا يحاكي الحفظ أبدًا.
> - إذا كان `ENDPOINT_URL` فارغًا، تظهر رسالة خطأ.
> - رسالة النجاح لا تظهر إلا إذا ردّ الخادم بـ `{"ok": true}`، وهذا الرد يُرسَل **بعد** كتابة الصف في الشيت.

---

## 1) الشعار الرسمي

- الملف `assets/passion-clinics-logo.png` هو الصورة الأصلية بدون أي تعديل، بمقاس 447×447.
- لاستبداله بنسخة أعلى دقة، احفظها بالاسم نفسه داخل `assets/`. يُفضَّل أن تكون مربعة.

## 2) الإعدادات (`script.js` ← `CONFIG`)

| الإعداد | الوظيفة |
|---|---|
| `ENDPOINT_TYPE` | `"google-sheets"` (الافتراضي)، أو `"power-automate"` للربط مع Excel |
| `ENDPOINT_URL` | رابط Web App الذي ينتهي بـ `/exec` (الخطوة 3) |
| `SERVICES` | قائمة احتياطية فقط. الخدمات الفعلية تُدار من تبويب «الخدمات» في الشيت (القسم 6) |
| `TIME_SLOTS` | أوقات التواصل: `start` و`end` بنظام 24 ساعة، و`stepMinutes` للفاصل بين الأوقات |
| `ENABLE_LANGUAGE_SWITCH` | إظهار زر English / العربية أو إخفاؤه |


## 3) ربط Google Sheets

الشيت مملوك لبريد العيادة passionclinics@gmail.com، واسمه **Passion Clinics – تسجيلات العملاء**:
https://docs.google.com/spreadsheets/d/1NDNadZMNnO2lCn7wHQ-mp2k5bz_yHn23Fn6xbQFWwSY/edit

فيه ورقة اسمها **التسجيلات** بثمانية أعمدة. الأعمدة منسّقة كنص حتى تبقى علامة `+966`، ومنطقة الشيت الزمنية هي الرياض.
**لا تغيّر ترتيب الأعمدة ولا اسم الورقة**، لأن السكربت يكتب البيانات بحسب هذا الترتيب.

> **كل خطوات هذا القسم تتم وأنت مسجّل دخول بحساب العيادة passionclinics@gmail.com.**

### أ) إضافة السكربت
1. افتح الشيت، ثم اختر **Extensions ← Apps Script** (الإضافات ← Apps Script).
2. احذف المحتوى الموجود في `Code.gs` والصق الكود التالي:

```javascript
// Passion Clinics – استقبال التسجيلات وكتابتها في Google Sheets
const SPREADSHEET_ID = '1NDNadZMNnO2lCn7wHQ-mp2k5bz_yHn23Fn6xbQFWwSY';
const SHEET_NAME = 'التسجيلات';
const SERVICES_SHEET = 'الخدمات';
const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // يمنع تداخل تسجيلين في اللحظة نفسها

    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

    const fullName = clean(d.fullName, 100);
    const mobile = clean(d.mobile, 20);
    const email = clean(d.email, 120);
    const service = clean(d.service, 100);
    const day = clean(d.contactDay, 20);
    const time = clean(d.contactTime, 5);
    const notes = clean(d.notes, 1000);

    // تحقق من جهة الخادم أيضًا
    const valid =
      fullName.length >= 3 &&
      /^\+9665\d{8}$/.test(mobile) &&
      (!email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) &&
      getServices_(false).some(s => s.ar === service) &&
      DAYS.indexOf(day) !== -1 &&
      /^\d{2}:\d{2}$/.test(time) &&
      d.consent === true;
    if (!valid) return json_({ ok: false, error: 'validation' });

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const row = [
      Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd HH:mm:ss'),
      fullName, mobile, email, service, day, time, notes
    ];

    const r = sheet.getLastRow() + 1;
    if (r > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 500);
    // تنسيق نصي: يحفظ +966 ويمنع تفسير أي قيمة كمعادلة
    sheet.getRange(r, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    SpreadsheetApp.flush();

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

// قائمة الخدمات للصفحة:  .../exec?action=services
// وبدون action يرد {"status":"ready"} لاختبار الرابط
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'services') {
    return json_({ ok: true, services: getServices_(true) });
  }
  return json_({ status: 'ready' });
}

// يقرأ تبويب «الخدمات»: الخدمة | Service (English) | تظهر في الصفحة
function getServices_(activeOnly) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SERVICES_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues()
    .filter(r => String(r[0]).trim() && (!activeOnly || r[2] === true))
    .map(r => ({ ar: String(r[0]).trim(), en: String(r[1] || r[0]).trim() }));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. اضغط **Save** (أيقونة الحفظ).

### ب) نشر السكربت كـ Web App
1. اختر **Deploy ← New deployment**.
2. من أيقونة الترس اختر النوع **Web app**.
3. اضبط الإعدادات:
   - **Execute as:** `Me (passionclinics@gmail.com)`
   - **Who has access:** `Anyone`
4. اضغط **Deploy**، ثم وافق على الصلاحيات (**Authorize access**).
   إذا ظهرت رسالة «Google hasn't verified this app» فهذا طبيعي لأنه سكربتك أنت. اختر **Advanced** ثم **Go to … (unsafe)** ثم **Allow**.
5. انسخ **Web app URL**، وهو ينتهي بـ `/exec`، والصقه في `script.js`:

```js
ENDPOINT_TYPE: "google-sheets",
ENDPOINT_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

> عند تعديل كود السكربت لاحقًا: اختر **Deploy ← Manage deployments**، ثم ✏️، ثم **Version: New version**، ثم **Deploy**.
> هكذا يبقى الرابط نفسه. أما **New deployment** فيُنشئ رابطًا جديدًا يجب تحديثه في الصفحة.

### ملاحظات
- **الأمان:** رابط `/exec` ظاهر في كود الصفحة، لذا يمكن لأي شخص يعرفه أن يرسل إليه. الحماية الموجودة: حقل مخفي يوقف برامج السبام، وتحقق من البيانات في الصفحة وفي السكربت، وتنسيق نصي يمنع حقن المعادلات.
- **من يرى البيانات:** الشيت يبقى خاصًا بك. إعداد `Anyone` يسمح فقط بإرسال البيانات إلى السكربت، ولا يسمح بقراءة الشيت.
- **الحدود:** حساب Gmail المجاني يكفي بسهولة لتسجيلات عيادة، إذ يسمح بآلاف الطلبات يوميًا.

## 4) اختبار الإرسال

1. افتح رابط `/exec` في المتصفح. يجب أن يظهر `{"status":"ready"}`.
2. شغّل الصفحة محليًا من داخل المجلد:
   ```bash
   npx serve .        # أو: python3 -m http.server 8080
   ```
3. **التحقق من الحقول:** اضغط «إرسال البيانات» والنموذج فارغ. يجب أن تظهر رسالة عربية تحت كل حقل إلزامي.
   أرقام الجوال المقبولة: `05XXXXXXXX` أو `5XXXXXXXX` أو `+9665XXXXXXXX` أو `009665XXXXXXXX`، ويُقبل إدخالها بالأرقام العربية أيضًا. كل الأرقام تُحفظ بصيغة `+9665XXXXXXXX`.
4. **الإرسال الناجح:** أرسل تسجيلًا تجريبيًا. يجب أن تظهر رسالة النجاح، **وأن** يظهر صف جديد في ورقة «التسجيلات». بعد الاختبار احذف الصف التجريبي.
5. **الفشل:** غيّر حرفًا في `ENDPOINT_URL` ثم أرسل. يجب أن تظهر رسالة خطأ **بدون** رسالة نجاح.
6. إذا لم يُحفظ شيء:
   - افحص سجل التنفيذ في Apps Script ← **Executions**.
   - تأكد أن **Who has access = Anyone**.
   - تأكد أن الرابط ينتهي بـ `/exec` وليس `/dev`.

## 5) النشر على Vercel

**الطريقة الأولى: عبر GitHub (موصى بها)**
1. ارفع مجلد `passion-clinic` إلى مستودع GitHub.
2. في vercel.com اختر **Add New ← Project** واستورد المستودع.
3. اضبط **Framework Preset** على `Other`، واترك **Build Command** و**Output Directory** فارغين.
4. اضغط **Deploy**.

**الطريقة الثانية: سطر الأوامر**
```bash
cd passion-clinic
npx vercel --prod
```

**نطاق خاص:** من Project ← Settings ← Domains. بعد النشر أعد اختبارات القسم 4 على الرابط المنشور.

## 6) إدارة الخدمات حسب الإعلان (بدون تعديل الكود)

الخدمات تُقرأ مباشرة من تبويب **«الخدمات»** في الشيت:

| الخدمة | Service (English) | تظهر في الصفحة |
|---|---|---|
| إزالة الشعر بالليزر | Laser Hair Removal | ☑ |

- **إضافة خدمة:** اكتبها في صف جديد، ثم فعّل مربع «تظهر في الصفحة».
- **إخفاء خدمة مؤقتًا** عند انتهاء الإعلان: ألغِ تفعيل المربع. لا تحذف الصف، حتى تبقى التسجيلات القديمة مطابقة لاسم الخدمة.
- **تعديل الاسم:** عدّله في الخلية مباشرة.
- **الترتيب:** يتبع ترتيب الصفوف في التبويب.
- التغييرات تظهر في الصفحة فورًا عند فتحها أو تحديثها، ولا تحتاج إعادة نشر.

**رابط خاص لكل إعلان:** يمكن أن يأتي الرابط والخدمة مختارة مسبقًا، هكذا:
```
https://your-site.vercel.app/?service=إزالة الشعر بالليزر
```
تكتب في الرابط اسم الخدمة كما هو في الشيت، بالعربي أو بالإنجليزي. يبقى بإمكان العميل تغيير الخدمة من القائمة.

> إذا تعذّر الوصول إلى الشيت لأي سبب، تعرض الصفحة القائمة الاحتياطية الموجودة في `CONFIG.SERVICES` داخل `script.js`.

## 7) الاطلاع على التسجيلات

- افتح الشيت من أي جهاز، أو من تطبيق Google Sheets على الجوال.
- لمشاركته مع موظفي الاستقبال: **Share**، ثم أضف بريدهم بصلاحية **Viewer** أو **Editor**.
- للتصدير إلى Excel: **File ← Download ← Microsoft Excel (.xlsx)**.

## 8) بديل: Excel عبر Power Automate

استخدم هذا الخيار إذا كان يجب أن تبقى البيانات في Excel على OneDrive for Business أو SharePoint. يحتاج ترخيص **Power Automate Premium**.

1. ملف Excel فيه جدول (Ctrl+T) اسمه `Registrations` بهذه الأعمدة:
   `SubmittedAt | FullName | Mobile | Email | Service | ContactDay | ContactTime | Notes`
2. أنشئ Flow بمشغّل **When an HTTP request is received**، واضبط Who can trigger على `Anyone` وMethod على `POST`. الحقول المرسلة: `fullName, mobile, email, service, contactDay, contactTime, notes, consent, submittedAt, language`.
3. أضف خطوة **Excel Online (Business) ← Add a row into a table**. في عمود `SubmittedAt` استخدم:
   `convertFromUtc(utcNow(), 'Arab Standard Time', 'yyyy-MM-dd HH:mm:ss')`
4. أضف خطوة **Response**:
   - Status: `200`
   - Headers: `Content-Type: application/json` و`Access-Control-Allow-Origin: *`
   - Body: `{"ok": true}`

   **لا تحذف هذه الخطوة.** بدونها يرد Power Automate بـ `202`، والصفحة تعامل هذا الرد كفشل.
5. في `script.js` اضبط `ENDPOINT_TYPE: "power-automate"` والصق رابط الـ Flow.
