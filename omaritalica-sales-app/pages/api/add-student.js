// pages/api/add-student.js
import { createStudent } from "../../lib/notion";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { name, salesPersonId, course, source, phone, notes, month, year, date } = req.body;
    if (!name || !salesPersonId || !course) {
      return res.status(400).json({ ok: false, error: "بيانات ناقصة" });
    }
    const result = await createStudent({
      name, salesPersonId, course, source, phone, notes, month, year, date,
    });
    res.status(200).json({ ok: true, id: result.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
