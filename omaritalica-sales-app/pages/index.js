// pages/index.js
import { useState, useEffect } from "react";

const COURSES = ["A0","A1","A2","B1","B2","CILS","Conversation","Patente","Hiring Program","Private Lessons"];
const SOURCES = ["Instagram","TikTok","Facebook","Google","Referral","Website","أخرى"];
const MONTHS  = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const nowMonth = () => MONTHS[new Date().getMonth()];
const nowYear  = () => new Date().getFullYear();
const G = "#1B6B4A", R = "#C0392B", AMB = "#f59e0b";

export default function Home() {
  const [tab, setTab] = useState("dash");
  const [students, setStudents] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("loading");
  const [fMonth, setFMonth] = useState(nowMonth());
  const [fSales, setFSales] = useState("الكل");
  const [form, setForm] = useState({ name:"", salesPersonId:"", course:"", source:"", phone:"", notes:"" });

  const msg = (txt, type="ok") => { setToast({txt,type}); setTimeout(()=>setToast(null), 3500); };

  const loadData = async () => {
    try {
      const r = await fetch("/api/data");
      const d = await r.json();
      if (d.ok) {
        setStudents(d.students);
        setTeam(d.team);
        setStatus("ok");
      } else {
        setStatus("err");
        msg("فشل تحميل البيانات من Notion", "err");
      }
    } catch {
      setStatus("err");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const thisMon = students.filter(s => s.month === nowMonth() && String(s.year) === String(nowYear()));
  const filtered = students.filter(s => {
    const mOk = fMonth === "الكل" || s.month === fMonth;
    const sOk = fSales === "الكل" || s.salesPerson === fSales;
    return mOk && sOk;
  });

  const repStats = team
    .map(t => ({ ...t, count: thisMon.filter(s => s.salesPersonId === t.id).length }))
    .sort((a,b) => b.count - a.count);

  const courseStats = COURSES
    .map(c => ({ name:c, count: thisMon.filter(s => s.course === c).length }))
    .filter(c => c.count > 0)
    .sort((a,b) => b.count - a.count);

  const totalThisMon = thisMon.length;
  const totalTarget  = team.reduce((sum,t) => sum + t.target, 0) || 10;
  const remaining    = Math.max(0, totalTarget - totalThisMon);
  const pct          = Math.min(100, Math.round((totalThisMon / totalTarget) * 100));
  const onTarget     = repStats.filter(r => r.count >= r.target).length;
  const medals = ["🥇","🥈","🥉"];

  const submit = async () => {
    if (!form.name.trim())   return msg("❌ اكتب اسم الطالب","err");
    if (!form.salesPersonId) return msg("❌ اختر اسمك","err");
    if (!form.course)        return msg("❌ اختر الكورس","err");
    setSaving(true);
    try {
      const r = await fetch("/api/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          month: nowMonth(),
          year: nowYear(),
          date: new Date().toISOString().split("T")[0],
        }),
      });
      const d = await r.json();
      if (d.ok) {
        msg(`✅ تم تسجيل ${form.name} في Notion`);
        setForm({ name:"", salesPersonId:"", course:"", source:"", phone:"", notes:"" });
        await loadData();
        setTab("dash");
      } else {
        msg("حصل خطأ: " + (d.error || "غير معروف"), "err");
      }
    } catch {
      msg("فشل الاتصال بالسيرفر","err");
    }
    setSaving(false);
  };

  const allSales = [...new Set(students.map(s => s.salesPerson).filter(Boolean))];
  const statusMap = {
    loading: { cls:"nok",  icon:"⏳", txt:"بيتصل بـ Notion..." },
    ok:      { cls:"nok",  icon:"✅", txt:"متصل بـ Notion — البيانات حقيقية ومباشرة" },
    err:     { cls:"nerr", icon:"❌", txt:"فشل الاتصال — تحقق من إعدادات Vercel" },
  };
  const st = statusMap[status];

  return (
    <>
      <style jsx global>{css}</style>

      <div className="bar">
        <div className="bar-l">
          <div className="logo">OI</div>
          <div>
            <h1>Omaritalica — Sales</h1>
            <p>تتبع الطلاب · التارجت · الليدربورد</p>
          </div>
        </div>
        <div className="mbadge">{nowMonth()} {nowYear()}</div>
      </div>

      <div className="nav">
        {[["dash","📊 الداشبورد"],["add","➕ طالب جديد"],["table","📋 الطلاب"]].map(([id,lbl]) => (
          <button key={id} className={`nb${tab===id?" on":""}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      <div className={`pg${tab==="dash"?" on":""}`}>
        <div className={`ns ${st.cls}`}>{st.icon} {st.txt}</div>

        {loading ? (
          <div className="loading"><div className="bi">📊</div><p>بيجيب البيانات...</p></div>
        ) : (
          <>
            <div className="target-hero" style={{"--pct":`${pct}%`}}>
              <div className="target-ring">
                <div className="target-ring-inner">
                  <div className="big">{pct}%</div>
                  <div className="sm">مكتمل</div>
                </div>
              </div>
              <div className="target-info">
                <h2>🎯 تارجت {nowMonth()}</h2>
                <p style={{marginBottom:6}}>{totalThisMon} طالب من أصل {totalTarget} (تارجت الفريق كله)</p>
                <p style={{fontSize:12}}>
                  {pct >= 100 ? "🏆 تارجت الفريق اتكسر!" : onTarget > 0 ? `${onTarget} من ${team.length} وصلوا التارجت الشخصي` : "الفريق لسه شغال على التارجت"}
                </p>
              </div>
              <div className="target-remaining">
                <div className="rnum">{remaining}</div>
                <div className="rlbl">طالب فاضل</div>
              </div>
            </div>

            <div className="krow">
              <div className="kpi"><div className="n">{totalThisMon}</div><div className="l">طالب الشهر ده</div></div>
              <div className="kpi"><div className="n">{students.length}</div><div className="l">إجمالي كل الطلاب</div></div>
              <div className={`kpi${onTarget === 0 ? " bad" : onTarget < team.length ? " warn" : ""}`}>
                <div className="n">{onTarget}</div><div className="l">وصلوا التارجت</div>
              </div>
              <div className="kpi"><div className="n" style={{fontSize:15,paddingTop:5}}>{courseStats[0]?.name || "—"}</div><div className="l">أحسن كورس</div></div>
            </div>

            <div className="card">
              <div className="ct">🏆 ليدربورد الشهر</div>
              {repStats.length === 0
                ? <p className="empty">لسه مفيش طلاب مسجلين الشهر ده</p>
                : repStats.map((r, i) => {
                    const p2 = Math.min(100, Math.round((r.count / r.target) * 100));
                    const bg = p2 >= 100 ? `linear-gradient(90deg,${G},#2d9969)`
                             : p2 >= 60  ? `linear-gradient(90deg,${AMB},#fbbf24)`
                             : `linear-gradient(90deg,${R},#e55347)`;
                    return (
                      <div key={r.id} className="lrow">
                        <span className="lmed">{medals[i] || ""}</span>
                        <div className="lnm">{r.name}</div>
                        <div className="lwp">
                          <div className="lf" style={{width:`${Math.max(p2,3)}%`, background:bg}}>
                            {p2 > 10 && <span className="lpt">{p2}%</span>}
                          </div>
                        </div>
                        <div className="lct">{r.count} / {r.target}</div>
                      </div>
                    );
                  })
              }
              <p className="tip">
                🟢 وصل التارجت · 🟡 60–99% · 🔴 أقل من 60%<br/>
                لتعديل التارجت أو الفريق: Notion ← 👥 فريق السيلز
              </p>
            </div>

            <div className="card">
              <div className="ct">📚 أكتر الكورسات مبيعاً — {nowMonth()}</div>
              {courseStats.length === 0
                ? <p className="empty">لسه مفيش بيانات</p>
                : courseStats.map(c => {
                    const p2 = Math.round((c.count / courseStats[0].count) * 100);
                    return (
                      <div key={c.name} className="crow">
                        <div className="cnm">{c.name}</div>
                        <div className="cwp"><div className="cf" style={{width:`${p2}%`}}/></div>
                        <div className="cct">{c.count}</div>
                      </div>
                    );
                  })
              }
            </div>
          </>
        )}
      </div>

      <div className={`pg${tab==="add"?" on":""}`}>
        <div className="card">
          <div className="ct">➕ تسجيل طالب جديد — {nowMonth()} {nowYear()}</div>
          <div className="fg2">
            <div className="fg full">
              <label>اسم الطالب *</label>
              <input placeholder="مثال: محمد أحمد علي" value={form.name}
                onChange={e => setForm({...form, name:e.target.value})}/>
            </div>
            <div className="fg">
              <label>أنت مين؟ (اسم السيلز) *</label>
              <select value={form.salesPersonId} onChange={e => setForm({...form, salesPersonId:e.target.value})}>
                <option value="">اختر اسمك</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>الكورس *</label>
              <select value={form.course} onChange={e => setForm({...form, course:e.target.value})}>
                <option value="">اختر الكورس</option>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>مصدر الليد — جابه منين؟</label>
              <select value={form.source} onChange={e => setForm({...form, source:e.target.value})}>
                <option value="">اختر المصدر</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>رقم الواتساب</label>
              <input placeholder="+39 ..." value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/>
            </div>
            <div className="fg full">
              <label>ملاحظات</label>
              <textarea placeholder="أي تفاصيل تانية..." value={form.notes}
                onChange={e => setForm({...form, notes:e.target.value})}/>
            </div>
            <div className="fg full">
              <button className="btnp" onClick={submit} disabled={saving}>
                {saving ? <><span className="spin"/>بيحفظ في Notion...</> : "💾 سجّل الطالب"}
              </button>
            </div>
          </div>
        </div>
        <p className="tip">
          لتعديل أسماء الفريق أو التارجت الشهري<br/>
          افتح Notion → 👥 فريق السيلز → عدّل الرقم أو أضف صف جديد
        </p>
      </div>

      <div className={`pg${tab==="table"?" on":""}`}>
        <div className="frow2">
          <select value={fMonth} onChange={e => setFMonth(e.target.value)}>
            <option value="الكل">كل الشهور</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={fSales} onChange={e => setFSales(e.target.value)}>
            <option value="الكل">كل السيلز</option>
            {allSales.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="card">
          <div className="ct">📋 الطلاب المسجلين ({filtered.length})</div>
          {loading ? (
            <div className="loading"><div className="bi">📋</div><p>بيحمّل...</p></div>
          ) : filtered.length === 0 ? (
            <p className="empty">مفيش طلاب بهذا الفلتر</p>
          ) : (
            <div className="tsc">
              <table className="tbl">
                <thead><tr><th>اسم الطالب</th><th>السيلز</th><th>الكورس</th><th>المصدر</th><th>الشهر</th></tr></thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td style={{fontWeight:700}}>{s.name}</td>
                      <td>{s.salesPerson}</td>
                      <td><span className="pill pg2">{s.course}</span></td>
                      <td><span className="pill pb2">{s.source||"—"}</span></td>
                      <td style={{fontSize:11,color:"#6b7280"}}>{s.month} {s.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && <div className={`toast ${toast.type==="err"?"terr":"tok"}`}>{toast.txt}</div>}
    </>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cairo',sans-serif;background:#EEF4F1;color:#0f1f15;direction:rtl}
.bar{background:linear-gradient(135deg,${G},#134d35);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 3px 14px rgba(27,107,74,.28)}
.bar-l{display:flex;align-items:center;gap:10px}
.logo{width:40px;height:40px;background:#fff;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:900;color:${G};font-size:12px;flex-shrink:0}
.bar h1{color:#fff;font-size:16px;font-weight:800}
.bar p{color:rgba(255,255,255,.7);font-size:11px;margin-top:1px}
.mbadge{background:rgba(255,255,255,.18);color:#fff;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700}
.nav{background:#fff;border-bottom:2px solid #e5e7eb;display:flex;padding:0 14px;overflow-x:auto}
.nb{padding:11px 15px;font-size:13px;font-weight:700;color:#6b7280;border:none;background:none;cursor:pointer;border-bottom:3px solid transparent;font-family:'Cairo',sans-serif;transition:all .15s;white-space:nowrap}
.nb:hover{color:${G}}
.nb.on{color:${G};border-bottom-color:${G}}
.pg{display:none;padding:18px 14px;max-width:820px;margin:0 auto}
.pg.on{display:block}
.target-hero{background:linear-gradient(135deg,${G} 0%,#1a7a55 100%);border-radius:16px;padding:20px;margin-bottom:14px;display:flex;align-items:center;gap:16px;box-shadow:0 6px 20px rgba(27,107,74,.25)}
.target-ring{width:88px;height:88px;border-radius:50%;background:conic-gradient(rgba(255,255,255,.9) var(--pct), rgba(255,255,255,.15) 0);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.target-ring-inner{width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,${G},#134d35);display:flex;flex-direction:column;align-items:center;justify-content:center}
.target-ring-inner .big{font-size:22px;font-weight:900;color:#fff;line-height:1}
.target-ring-inner .sm{font-size:10px;color:rgba(255,255,255,.7);margin-top:1px}
.target-info{flex:1}
.target-info h2{font-size:18px;font-weight:900;color:#fff;margin-bottom:4px}
.target-info p{font-size:13px;color:rgba(255,255,255,.8)}
.target-remaining{background:rgba(255,255,255,.15);border-radius:10px;padding:10px 14px;text-align:center}
.target-remaining .rnum{font-size:28px;font-weight:900;color:#fff;line-height:1}
.target-remaining .rlbl{font-size:11px;color:rgba(255,255,255,.75);margin-top:2px}
.krow{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px}
.kpi{background:#fff;border-radius:12px;padding:13px 10px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.05)}
.kpi .n{font-size:26px;font-weight:900;color:${G};line-height:1}
.kpi .l{font-size:11px;color:#6b7280;margin-top:3px}
.kpi.warn .n{color:${AMB}}
.kpi.bad .n{color:${R}}
.card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 6px rgba(0,0,0,.05);margin-bottom:14px}
.ct{font-size:14px;font-weight:800;color:#0f1f15;margin-bottom:11px;padding-bottom:8px;border-bottom:2px solid #f3f4f6}
.lrow{display:flex;align-items:center;gap:7px;margin-bottom:9px}
.lmed{font-size:14px;min-width:20px}
.lnm{font-size:12px;font-weight:700;min-width:68px;color:#0f1f15;text-align:right}
.lwp{flex:1;background:#f3f4f6;border-radius:20px;height:20px;overflow:hidden}
.lf{height:100%;border-radius:20px;display:flex;align-items:center;justify-content:flex-end;transition:width .7s ease}
.lpt{font-size:10px;font-weight:800;color:#fff;padding-left:7px}
.lct{font-size:12px;font-weight:800;min-width:48px;text-align:left;color:#374151}
.crow{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.cnm{font-size:12px;font-weight:700;min-width:108px;text-align:right;color:#0f1f15}
.cwp{flex:1;background:#f3f4f6;border-radius:8px;height:13px}
.cf{height:100%;border-radius:8px;background:linear-gradient(90deg,${G},#2d9969)}
.cct{font-size:12px;font-weight:800;color:${G};min-width:22px;text-align:left}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fg{display:flex;flex-direction:column;gap:5px}
.fg.full{grid-column:1/-1}
label{font-size:12px;font-weight:700;color:#374151}
input,select,textarea{border:2px solid #e5e7eb;border-radius:8px;padding:9px 11px;font-size:14px;font-family:'Cairo',sans-serif;color:#0f1f15;outline:none;transition:border-color .2s;background:#fff;direction:rtl;width:100%}
input:focus,select:focus,textarea:focus{border-color:${G}}
textarea{resize:vertical;min-height:62px}
.btnp{background:linear-gradient(135deg,${G},#134d35);color:#fff;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:800;font-family:'Cairo',sans-serif;cursor:pointer;width:100%;margin-top:4px;transition:opacity .2s}
.btnp:hover{opacity:.88}
.btnp:disabled{opacity:.5;cursor:not-allowed}
.tsc{overflow-x:auto}
.tbl{width:100%;border-collapse:collapse;min-width:460px}
.tbl th{background:${G};color:#fff;padding:9px 10px;font-size:12px;font-weight:700;text-align:right}
.tbl td{padding:9px 10px;font-size:12px;border-bottom:1px solid #f3f4f6;text-align:right}
.tbl tr:hover td{background:#f9fafb}
.pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700}
.pg2{background:#e8f5ef;color:${G}}
.pb2{background:#eff6ff;color:#1d4ed8}
.frow2{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.frow2 select{padding:7px 10px;font-size:12px;border-radius:8px;min-width:95px}
.ns{font-size:11px;padding:6px 12px;border-radius:8px;margin-bottom:12px;font-weight:600;display:flex;align-items:center;gap:5px}
.nok{background:#e8f5ef;color:${G}}
.nerr{background:#fdecea;color:${R}}
.toast{position:fixed;bottom:18px;right:18px;padding:11px 18px;border-radius:10px;font-weight:700;font-size:13px;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.tok{background:${G};color:#fff}
.terr{background:${R};color:#fff}
.spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;vertical-align:middle;margin-left:5px}
@keyframes sp{to{transform:rotate(360deg)}}
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;gap:10px;color:#6b7280;font-size:13px}
.loading .bi{font-size:38px}
.empty{color:#9ca3af;text-align:center;padding:18px 0;font-size:13px}
.tip{font-size:11px;color:#9ca3af;text-align:center;margin-top:6px;line-height:1.5}
@media(max-width:540px){.fg2{grid-template-columns:1fr}.kpi .n{font-size:22px}.target-hero{flex-wrap:wrap}.pg{padding:12px 10px}}
`;
