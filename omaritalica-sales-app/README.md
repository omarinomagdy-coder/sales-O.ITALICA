# Omaritalica Sales Tracker

أبلكيشن ويب لفريق السيلز — تسجيل طلاب، تتبع تارجت، ليدربورد. كل البيانات متخزنة في Notion.

## النشر على Vercel (خطوة بخطوة)

### 1. ارفع المشروع على GitHub
```
cd omaritalica-app
git init
git add .
git commit -m "Omaritalica Sales App"
```
بعدين اعمل repo جديد على GitHub وارفعه (`git remote add origin ...` و `git push`).

### 2. اربطه بـ Vercel
- روح [vercel.com](https://vercel.com) → New Project → اختار الـ repo
- **قبل ما تعمل Deploy**، روح Settings → Environment Variables وضيف الـ 3 متغيرات دول:

| Key | Value |
|---|---|
| `NOTION_TOKEN` | `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` |
| `NOTION_STUDENTS_DB` | `833d02747fe245da9fcf214833b6eaf9` |
| `NOTION_TEAM_DB` | `01730692171a4e998feb24ed6d3358a1` |

- دوس **Deploy**

### 3. هتاخد لينك جاهز
حاجة زي `https://omaritalica-sales.vercel.app` — ابعته لفريق السيلز، يفتحوه من أي موبايل.

## التعديل بعد كده

- **تغيير التارجت / إضافة سيلز**: من Notion مباشرة → جدول "👥 فريق السيلز" → غيّر الرقم أو ضيف صف
- **الكود نفسه لو محتاج تعديل**: `pages/index.js` (الواجهة) و `lib/notion.js` (الاتصال بـ Notion)

## ملاحظة أمان
متشاركش التوكن ده مع حد، ومتحطوش في أي repo عام (public). لو حسيت إنه اتسرب، روح notion.so/my-integrations وعمل Refresh للتوكن.
