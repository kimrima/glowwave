/**
 * GlowWave Unified Email Delivery Module using Resend REST API
 */
export async function sendEmail(email: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || '';
  
  if (!apiKey) {
    console.log('\n[SIMULATED EMAIL LOG] RESEND_API_KEY is not set. Falling back to local console trace.');
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML length): ${html.length} chars\n`);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GlowWave <noreply@glow-wave.net>',
        to: [email.trim().toLowerCase()],
        subject: subject,
        html: html
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[Email Success] Resend sent email to ${email}. ID:`, data.id);
      return true;
    } else {
      const errText = await res.text();
      console.error(`[Email Error] Resend returned non-OK status: ${res.status}`, errText);
      return false;
    }
  } catch (error) {
    console.error('[Email Error] Fatal crash while calling Resend API:', error);
    return false;
  }
}
