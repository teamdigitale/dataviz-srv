import { Resend } from "resend";
import fs from "fs/promises";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const SENDER_EMAIL = process.env.SENDER_EMAIL || "";

async function senMail(email: string, html: string) {
  await resend.emails.send({
    from: SENDER_EMAIL,
    to: "user@gmail.com",
    subject: "Activate Account",
    html,
  });
}

function compileTemplate(template: string, data: any) {
  return template.replace(/\${(.*?)}/g, (_, key) => data[key]);
}

export async function sendActivationEmail(email: string, token: string) {
  const frontendUrl = process.env.FE_HOST;
  const template = await fs.readFile(`data/email_templates/activate.html`);

  const html = compileTemplate(template.toString(), {
    token,
    frontendUrl,
  });
  await senMail(email, html);
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const frontendUrl = process.env.FE_HOST;
  const template = await fs.readFile(`data/email_templates/reset.html`);

  const html = compileTemplate(template.toString(), {
    token,
    frontendUrl,
  });

  await senMail(email, html);
}
