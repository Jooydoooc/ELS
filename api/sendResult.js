// api/sendResult.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram env variables are not set.');
    res.status(200).json({ ok: false, error: 'Telegram not configured' });
    return;
  }

  try {
    const {
      percentage,
      total,
      status,
      extraDetails,
      isGrandTest,
      selectedTestSize,
      unit,
      studentData,
      score
    } = req.body || {};

    const safePercentage = isNaN(percentage) ? 0 : percentage;
    const safeTotal = total || 0;

    let testName;
    if (isGrandTest) {
      testName = `Grand Test (${selectedTestSize || '?'} questions)`;
    } else if (unit) {
      testName = `Unit ${unit.id}: ${unit.title}`;
    } else {
      testName = 'Unit Test';
    }

    const name = studentData?.name || 'Unknown';
    const surname = studentData?.surname || '';
    const group = studentData?.group || 'Unknown';
    const correct = score?.correct ?? 0;
    const wrong = score?.wrong ?? 0;

    const lines = [
      '📘 Test Name: ELS – English Through Reading',
      `🧑‍🎓 Student: ${name} ${surname}`,
      `👥 Group: ${group}`,
      `📚 Mode: ${testName}`,
      `📅 Date/Time: ${new Date().toLocaleString()}`,
      `📊 Score: ${correct}/${safeTotal} (${safePercentage}%)`,
      `${status === 'Completed' ? '✅' : '⚠️'} Status: ${status}`,
      `✅ Correct: ${correct}`,
      `❌ Wrong: ${wrong}`
    ];

    if (extraDetails) {
      lines.push('');
      lines.push(extraDetails);
    }

    const text = lines.join('\n');

    const tgResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text
        })
      }
    );

    if (!tgResponse.ok) {
      const body = await tgResponse.text().catch(() => '');
      console.error('Telegram error:', tgResponse.status, body);
      res.status(200).json({ ok: false, error: 'Telegram request failed' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('sendResult handler error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
