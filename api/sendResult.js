// api/sendResult.js

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    console.warn(
      "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment. Skipping send."
    );
    res.status(200).json({ ok: true, message: "Telegram not configured" });
    return;
  }

  try {
    const body = req.body || {};

    const {
      percentage = 0,
      total = 0,
      status = "Unknown",
      extraDetails = "",
      isGrandTest = false,
      selectedTestSize,
      unit,
      studentData = {},
      score = {},
    } = body;

    const name = (studentData.name || "").trim() || "Unknown";
    const surname = (studentData.surname || "").trim() || "";
    const group = (studentData.group || "").trim() || "Unknown group";

    const mode = isGrandTest
      ? `Grand Test (${selectedTestSize || "?"} questions)`
      : unit
      ? `Unit ${unit.id}: ${unit.title}`
      : "Unit Test";

    const lines = [
      "📘 Test Name: ELS – English Through Reading",
      `🧑‍🎓 Student: ${name} ${surname}`.trim(),
      `👥 Group: ${group}`,
      `📚 Mode: ${mode}`,
      `📅 Date/Time: ${new Date().toLocaleString()}`,
      `📊 Score: ${score.correct || 0}/${total} (${percentage}%)`,
      `${status === "Completed" ? "✅" : "⚠️"} Status: ${status}`,
    ];

    if (extraDetails) {
      lines.push("");
      lines.push(extraDetails);
    }

    const text = lines.join("\n");

    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
      }),
    });

    if (!tgRes.ok) {
      const errorText = await tgRes.text();
      console.error("Telegram error:", errorText);
      res.status(500).json({ error: "Telegram API error", details: errorText });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("sendResult API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
