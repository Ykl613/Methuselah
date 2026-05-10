# Methuselah — Supplier Management System

מערכת ניהול ספקים מלאה עם Next.js 14, Supabase ו-2FA.

> ## ⚠️ 2FA מבוטל זמנית
>
> במהדורה הזו האימות הדו-שלבי **מבוטל זמנית** כדי לאפשר עבודה ראשונית קלה.
> כניסה למערכת = מייל + סיסמה בלבד.
>
> **כשתרצה להחזיר את ה-2FA** (מומלץ לפני שמוסיפים עובדים אמיתיים):
>
> 1. פתח את `src/app/api/login/route.ts`
> 2. שנה את השורה `const DISABLE_2FA = true;` ל-`false`
> 3. דחוף ל-GitHub - Vercel ידפלוי אוטומטית
> 4. בכניסה הבאה תועבר ל-`/setup-2fa` להגדרה ראשונית
>
> זהו - 2FA חוזר לעבוד. כל הקוד של 2FA כבר קיים, רק מנוטרל ב-flag אחד.

---

## תכולה

**מסכים ציבוריים (לספקים):**
- 3 טפסים נפרדים (Stage 1/2/3) עם החלפת שפה EN ↔ 中文
- דף הצלחה ודף חסימה (מייל קיים)

**מסכי מנהל:**
- Dashboard עם 4 כרטיסי סטטיסטיקה (Tasks Awaiting You, Approved, Not Approved, In Progress) ופעמון התראות בזמן אמת
- רשימת ספקים עם 4 פילטר Pills, חיפוש, ו-pagination (25 לעמוד)
- דף ספק עם Timeline, 5 שלבים אינטראקטיביים, 4 שדות הערכה, ו-Notes נפרד
- רשימת משימות עם פילטר לפי שלב
- ניהול משתמשים עם הוספה דרך Modal
- Audit Log עם Date Picker
- Settings - 3 URLs של טפסים, 4 שמות שדות הערכה, 5 שמות שלבים

**מסכי עובד:**
- Task Pool עם נורות אדומות מהבהבות לדחופים
- My Tasks (משימות פעילות + מושלמות לאחרונה)
- Task Detail עם Claim / Mark Complete

**אבטחה:**
- אימות דו-שלבי (TOTP - Google Authenticator) חובה לכולם
- Row Level Security בכל הטבלאות
- Audit Log לכל פעולה (immutable)

---

## התקנה והפעלה

### דרישות

- Node.js 20+
- חשבון Supabase ([supabase.com](https://supabase.com))
- חשבון Vercel ([vercel.com](https://vercel.com))
- חשבון GitHub

---

### שלב 1: יצירת פרויקט Supabase

1. כנס ל-[supabase.com/dashboard](https://supabase.com/dashboard) ולחץ **New project**
2. תן שם לפרויקט (למשל `methuselah`)
3. בחר סיסמה לדאטאבייס (שמור אותה!)
4. בחר אזור (Singapore או Frankfurt - הקרובים אלינו)
5. המתן 2 דקות עד שהפרויקט נוצר

### שלב 2: הרצת ה-Schema

1. בפרויקט Supabase, לך ל-**SQL Editor** (בסרגל הצד)
2. לחץ **New query**
3. פתח את הקובץ `supabase/schema.sql` מהפרויקט הזה
4. העתק את כל התוכן ל-SQL Editor
5. לחץ **Run** (או Ctrl/Cmd + Enter)
6. ודא שכל הטבלאות נוצרו: לך ל-**Table Editor** ותראה: `user_profiles`, `suppliers`, `tasks`, `supplier_notes`, `audit_log`, `settings`, `notifications`

### שלב 3: לקיחת מפתחות API

ב-Supabase, לך ל-**Project Settings → API** ושמור:
- `Project URL` (משהו כמו `https://abcdefg.supabase.co`)
- `anon public` key
- `service_role` key (סודי! אל תשתף)

---

### שלב 4: התקנה מקומית והרצה

```bash
# 1. התקן dependencies
npm install

# 2. צור קובץ .env.local
cp .env.example .env.local

# 3. ערוך את .env.local עם המפתחות שלך:
# NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# ADMIN_EMAIL=yehiel@ykl.asia
# ADMIN_PASSWORD=BCnV2026Strong!
# APP_URL=http://localhost:3000

# 4. הרץ את ה-seed כדי ליצור את משתמש המנהל הראשון
npm run seed

# 5. הפעל את השרת המקומי
npm run dev

# פתח http://localhost:3000
```

**כניסה ראשונה:**
- מייל: `yehiel@ykl.asia` (או מה שהגדרת ב-ADMIN_EMAIL)
- סיסמה: מה שהגדרת ב-ADMIN_PASSWORD
- תועבר אוטומטית להגדרת 2FA - סרוק את ה-QR ב-Google Authenticator
- מהפעם הבאה תידרש להזין קוד 2FA בכל כניסה

---

### שלב 5: העלאה ל-GitHub

```bash
cd methuselah
git init
git add .
git commit -m "Initial commit: Methuselah supplier management system"
git branch -M main

# צור repo חדש ב-github.com (פרטי!)
git remote add origin https://github.com/YOUR_USERNAME/methuselah.git
git push -u origin main
```

---

### שלב 6: פריסה ל-Vercel

1. כנס ל-[vercel.com](https://vercel.com) והתחבר עם GitHub
2. לחץ **Add New → Project**
3. בחר את ה-repo `methuselah`
4. ב-**Environment Variables** הוסף את כל המשתנים מ-`.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `APP_URL` (אחרי הפריסה הראשונה - תעדכן ל-URL של Vercel)
5. לחץ **Deploy** והמתן 2-3 דקות
6. ה-URL שלך יהיה משהו כמו `https://methuselah-xyz.vercel.app`

**אחרי הפריסה הראשונה:**
1. ב-Vercel → Settings → Environment Variables, עדכן את `APP_URL` ל-URL הפומבי
2. ב-Supabase → Authentication → URL Configuration, הוסף את ה-URL של Vercel ל-**Site URL** ול-**Redirect URLs**
3. עשה **Redeploy** ב-Vercel

---

## מבנה הקבצים

```
methuselah/
├── src/
│   ├── app/
│   │   ├── (app)/                    # מסכים מאומתים
│   │   │   ├── dashboard/             # דשבורד מנהל
│   │   │   ├── suppliers/             # רשימת ספקים + [id]
│   │   │   ├── tasks/                 # רשימת משימות + [id]
│   │   │   ├── users/                 # ניהול משתמשים
│   │   │   ├── audit/                 # יומן ביקורת
│   │   │   ├── settings/              # הגדרות
│   │   │   ├── task-pool/             # מאגר משימות עובד
│   │   │   ├── my-tasks/              # המשימות שלי
│   │   │   └── layout.tsx             # סיידבר + auth guard
│   │   ├── api/                       # כל ה-API routes
│   │   ├── forms/                     # טפסים פומביים (stage-1, 2, 3)
│   │   ├── login/                     # התחברות
│   │   └── setup-2fa/                 # הגדרת 2FA
│   ├── components/                    # Sidebar, NotificationBell, StatusBadge, Logo
│   ├── lib/                           # auth, supabase clients, totp, types
│   └── middleware.ts                  # auth middleware
├── supabase/
│   ├── schema.sql                     # סכמה + RLS + triggers
│   └── seed.ts                        # יוצר משתמש admin ראשוני
└── public/
```

---

## איך זה עובד - לוגיקה עסקית

**זרימת ספק חדש:**
1. ספק ממלא Form Stage 1 → מערכת בודקת שמייל לא קיים → רושמת ספק חדש
2. אדמין רואה התראה → לוחץ "Send Stage 2 Link" → סטטוס משתנה ל-`form_2`
3. ספק נכנס ל-`/forms/stage-2`, מזין מייל זהה, ממלא → ה-DB מתעדכן
4. אדמין שולח לינק Stage 3 → ספק ממלא
5. **אוטומטי:** trigger במסד הנתונים יוצר 5 משימות לספק (`stage_1` עד `stage_5`)
6. עובד נכנס ל-Task Pool, לוקח את משימת `stage_1` → מסיים → לוחץ Mark Complete
7. שלב 2 נפתח, וכן הלאה
8. **אוטומטי:** כשמשימה `stage_5` מסומנת כהושלמה - הספק הופך אוטומטית ל-`approved`

**דחייה:**
- אדמין יכול ללחוץ Reject בכל שלב → מציין סיבה → סטטוס הופך `not_approved`, כל המשימות נסגרות

---

## פתרון בעיות

**`npm run seed` נכשל:**
- ודא ש-`.env.local` מכיל את 3 ה-keys של Supabase
- ודא שהרצת את `schema.sql` ב-Supabase קודם

**אני לא מצליח להתחבר אחרי seed:**
- ב-Supabase → Authentication → Users, ודא שהמשתמש קיים
- בדוק שב-Supabase → Authentication → Email confirm כבוי, או שהמייל אושר

**Vercel build נכשל:**
- ודא שכל ה-env vars הוגדרו ב-Vercel
- בדוק ב-Function Logs את השגיאה המדויקת

**הפעמון לא מציג התראות בזמן אמת:**
- ב-Supabase → Database → Replication, ודא שטבלת `notifications` מאופשרת ל-Realtime

---

## רישיון

פרטי - ירידי ק. ברק (yehiel@ykl.asia) © 2026
