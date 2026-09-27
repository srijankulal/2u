import { Resend } from 'resend'
import type { Letter } from './db/schema'

const resend = new Resend(process.env['RESEND_API_KEY']!)

export async function sendLetterEmail(opts: {
    to: string
    toName: string
    letter: Letter
}): Promise<void> {
    const { to, toName, letter } = opts

    const isTyped = letter.type === 'typed'

    const htmlContent = isTyped
        ? buildTypedEmailHtml(toName, letter)
        : buildScannedEmailHtml(toName, letter)

    const attachments = !isTyped && letter.imageUrl
        ? [{
            filename: 'your-letter.jpg',
            path: letter.imageUrl,
        }]
        : []

    await resend.emails.send({
        from: `"2U — Letters" <${process.env['RESEND_FROM'] ?? 'onboarding@resend.dev'}>`,
        to,
        subject: `💌 A letter from your past self — ${letter.title}`,
        html: htmlContent,
        attachments,
    })
}

function buildTypedEmailHtml(name: string, letter: Letter) {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { margin:0; padding:0; background:#F5EDD6; font-family:'Georgia', serif; }
      .wrapper { max-width:600px; margin:40px auto; }
      .envelope-top { background:#8B1A1A; color:#fff; padding:20px 32px; border-radius:12px 12px 0 0; text-align:center; }
      .envelope-top h1 { margin:0; font-size:22px; letter-spacing:1px; }
      .envelope-top p { margin:4px 0 0; font-size:13px; opacity:.8; }
      .letter { background:#FEF9EE; padding:40px; border:1px solid #E8D5A3; border-top:none; border-radius:0 0 12px 12px; }
      .letter-salutation { font-size:20px; font-style:italic; color:#2C1810; margin-bottom:20px; }
      .letter-body { font-size:16px; line-height:1.9; color:#3a2a1a; white-space:pre-wrap; }
      .stamp { text-align:right; margin-top:32px; }
      .stamp span { display:inline-block; border:2px solid #8B1A1A; border-radius:4px; padding:6px 14px; font-size:12px; color:#8B1A1A; letter-spacing:2px; text-transform:uppercase; }
      .footer { text-align:center; margin-top:24px; font-size:12px; color:#999; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="envelope-top">
        <h1>📮 2U — A Letter For You</h1>
        <p>Your past self wrote you something special</p>
      </div>
      <div class="letter">
        <div class="letter-salutation">Dear ${name},</div>
        <div class="letter-body">${letter.content ?? ''}</div>
        <div class="stamp"><span>✉ Delivered via 2U</span></div>
      </div>
      <div class="footer">This letter was sealed by your past self and delivered today with love.</div>
    </div>
  </body>
  </html>`
}

function buildScannedEmailHtml(name: string, letter: Letter) {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body{margin:0;padding:0;background:#F5EDD6;font-family:'Georgia',serif;}
      .wrapper{max-width:600px;margin:40px auto;}
      .top{background:#8B1A1A;color:#fff;padding:20px 32px;border-radius:12px 12px 0 0;text-align:center;}
      .top h1{margin:0;font-size:22px;}
      .body{background:#FEF9EE;padding:40px;border:1px solid #E8D5A3;border-top:none;border-radius:0 0 12px 12px;text-align:center;}
      .body p{font-size:16px;color:#2C1810;line-height:1.7;}
      .img{max-width:100%;border-radius:8px;border:2px solid #E8D5A3;margin-top:20px;}
      .footer{text-align:center;margin-top:24px;font-size:12px;color:#999;}
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="top"><h1>📮 2U — A Letter For You</h1></div>
      <div class="body">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your past self sent you a handwritten letter titled <em>"${letter.title}"</em>.<br>It's attached to this email and also shown below:</p>
        ${letter.imageUrl ? `<img src="${letter.imageUrl}" class="img" alt="Your scanned letter" />` : ''}
      </div>
      <div class="footer">Sealed and delivered with love via 2U.</div>
    </div>
  </body>
  </html>`
}