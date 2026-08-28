const nodemailer = require('nodemailer');

// Submitted values are interpolated into an HTML email, so escape them first.
const esc = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { firstName, lastName, phone, email, service, city, message } = body;

  // Basic validation
  if (!firstName || !phone || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Values are collapsed onto one line before they reach the email, so a submitted
  // value can't inject mail headers or break the "Label: value" shape below.
  const oneLine = (v) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();

  const fullName = oneLine(`${firstName || ''} ${lastName || ''}`);
  const leadName = fullName || 'Website Lead';

  // No Google Ads on this site — that runs only on the brush.tcrremoval.com
  // landing page — so leads from here are never labelled as ad traffic.
  const subjectLine = `New Request - ${leadName}`;

  // Plain-text twin of the email below, for Zapier's Email Parser. Deliberately
  // the same field list, order and wording the landing page emits, so one parser
  // template covers both sites. Fields this form doesn't collect say 'none'
  // rather than being omitted: a template learns positions, so a line that
  // disappears would silently break every field under it.
  const field = (v) => oneLine(v) || 'none';
  const textBody = [
    'NEW QUOTE REQUEST',
    '',
    `Name: ${field(fullName)}`,
    `Phone: ${field(phone)}`,
    `Email: ${field(email)}`,
    `City: ${field(city)}`,
    `Property: none`,
    `Service: ${field(service)}`,
    `Source: Website contact page`,
    `ClickType: none`,
    `ClickId: none`,
    `ClickAge: none`,
    `Message: ${field(message)}`,
    '',
    '=== END ===',
  ].join('\n');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  // Only trust the address as a reply-to header if it actually looks like one —
  // stops newline-based header injection.
  const replyTo = /^[^\s@<>"]+@[^\s@<>".]+\.[^\s@<>"]+$/.test(String(email || '').trim())
    ? String(email).trim()
    : process.env.GMAIL_USER;

  const mailOptions = {
    from: `"TCR Website" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    replyTo,
    // Optional: a Zapier Email Parser mailbox (parser.zapier.com). Unset is fine —
    // nodemailer ignores an undefined bcc.
    bcc: process.env.PARSER_EMAIL || undefined,
    subject: subjectLine,
    text: textBody,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3d18;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Quote Request</h1>
          <p style="color:rgba(255,255,255,.7);margin:6px 0 0;font-size:14px;">TCR Brush and Concrete Removal</p>
        </div>
        <div style="padding:32px;border:1px solid #e2e2e2;border-top:none;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;width:140px;">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">${esc(fullName)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;"><a href="tel:${esc(phone)}" style="color:#2e5c28;">${esc(phone)}</a></td>
            </tr>
            ${email ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;"><a href="mailto:${esc(email)}" style="color:#2e5c28;">${esc(email)}</a></td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;">Service</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${esc(service) || 'Not specified'}</td>
            </tr>
            ${city ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;">City / Area</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${esc(city)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;">Message</td>
              <td style="padding:10px 0;white-space:pre-wrap;">${esc(message)}</td>
            </tr>
          </table>
          <div style="margin-top:28px;padding:16px 20px;background:#f0f0f0;border-radius:6px;font-size:13px;color:#6b7280;">
            Submitted from tcrremoval.com/contact
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
