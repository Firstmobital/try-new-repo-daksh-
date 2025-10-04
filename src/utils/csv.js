// src/utils/csv.js
export function toCSV(rows) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const head = headers.join(",");
  const body = rows.map(r => headers.map(h => escape(r[h])).join(",")).join("\n");
  return head + "\n" + body;
}

export function readCSV(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const text = fr.result;
        const [head, ...lines] = text.split(/\r?\n/).filter(Boolean);
        const headers = head.split(",").map(h=>h.trim());
        const rows = lines.map(line => {
          // naive CSV split (works for simple templates we’ll export)
          const cols = line.split(",");
          const obj = {};
          headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
          return obj;
        });
        resolve(rows);
      } catch (e) { reject(e); }
    };
    fr.onerror = reject;
    fr.readAsText(file);
  });
}
