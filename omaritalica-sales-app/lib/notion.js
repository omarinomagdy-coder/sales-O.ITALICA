// lib/notion.js
// كل النداءات لـ Notion بتحصل من السيرفر بس (مش من المتصفح) — كده مفيش مشكلة CORS أبداً

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const STUDENTS_DB  = process.env.NOTION_STUDENTS_DB;   // 833d02747fe245da9fcf214833b6eaf9
const TEAM_DB       = process.env.NOTION_TEAM_DB;       // 01730692171a4e998feb24ed6d3358a1

const BASE = "https://api.notion.com/v1";
const HEADERS = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function notionFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: HEADERS });
  const data = await res.json();
  if (!res.ok) {
    console.error("Notion API error:", data);
    throw new Error(data.message || "Notion API error");
  }
  return data;
}

// ── أعضاء فريق السيلز (التارجت الشهري) ────────────────────
export async function getTeam() {
  const data = await notionFetch(`/databases/${TEAM_DB}/query`, {
    method: "POST",
    body: JSON.stringify({ page_size: 50 }),
  });
  return data.results
    .map(p => ({
      id:     p.id,
      name:   p.properties["اسم السيلز"]?.title?.[0]?.plain_text || "",
      target: p.properties["التارجت الشهري"]?.number || 10,
      active: p.properties["نشط؟"]?.checkbox ?? true,
    }))
    .filter(t => t.name && t.active);
}

// ── كل الطلاب ──────────────────────────────────────────────
export async function getStudents() {
  const data = await notionFetch(`/databases/${STUDENTS_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      page_size: 200,
      sorts: [{ property: "تاريخ التسجيل", direction: "descending" }],
    }),
  });

  // اسم السيلز بقى Relation، فلازم نعمل lookup لأسامي الفريق
  const team = await getTeam();
  const teamById = Object.fromEntries(team.map(t => [t.id, t.name]));

  return data.results.map(p => {
    const relIds = (p.properties["السيلز"]?.relation || []).map(r => r.id);
    const salesPerson = relIds.map(id => teamById[id]).filter(Boolean)[0] || "";
    return {
      id:          p.id,
      name:        p.properties["اسم الطالب"]?.title?.[0]?.plain_text || "",
      salesPersonId: relIds[0] || "",
      salesPerson,
      course:      p.properties["الكورس"]?.select?.name || "",
      source:      p.properties["مصدر الليد"]?.select?.name || "",
      month:       p.properties["الشهر"]?.select?.name || "",
      year:        p.properties["السنة"]?.number || new Date().getFullYear(),
      phone:       p.properties["رقم الواتساب"]?.phone_number || "",
      notes:       p.properties["ملاحظات"]?.rich_text?.[0]?.plain_text || "",
      date:        p.properties["تاريخ التسجيل"]?.date?.start || "",
    };
  });
}

// ── تسجيل طالب جديد ────────────────────────────────────────
export async function createStudent(student) {
  const body = {
    parent: { database_id: STUDENTS_DB },
    properties: {
      "اسم الطالب":    { title: [{ text: { content: student.name } }] },
      "السيلز":        { relation: [{ id: student.salesPersonId }] },
      "الكورس":        { select: { name: student.course } },
      "مصدر الليد":    student.source ? { select: { name: student.source } } : { select: null },
      "رقم الواتساب":  { phone_number: student.phone || null },
      "ملاحظات":       { rich_text: [{ text: { content: student.notes || "" } }] },
      "الشهر":         { select: { name: student.month } },
      "السنة":         { number: student.year },
      "تاريخ التسجيل": { date: { start: student.date } },
    },
  };
  const data = await notionFetch(`/pages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data;
}
