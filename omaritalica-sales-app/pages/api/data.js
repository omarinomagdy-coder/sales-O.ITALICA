// pages/api/data.js
import { getTeam, getStudents } from "../../lib/notion";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const [team, students] = await Promise.all([getTeam(), getStudents()]);
    res.status(200).json({ ok: true, team, students });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
