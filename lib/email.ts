import { Resend } from "resend";

// Usa una key dummy se non configurata per evitare errori al startup
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_dummy_key_for_development";
const resend = new Resend(RESEND_API_KEY);

const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@localhost";
const HOST = process.env.HOST || "http://localhost:3003";
const COPY = "Dataviz";

async function sendMail(addresses: string[], html: string, subject: string = "Dataviz Notification") {
  // Skip email in development se la key è dummy
  if (RESEND_API_KEY === "re_dummy_key_for_development") {
    console.log("📧 Email sending skipped (development mode)");
    console.log(`To: ${addresses.join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML preview: ${html.substring(0, 200)}...`);
    return { success: true, messageId: "dev-mode-skip" };
  }

  try {
    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: addresses,
      subject,
      html,
    });
    console.log("📧 Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("📧 Email sending failed:", error);
    throw error;
  }
}

function compileTemplate(template: string, data: any) {
  return template.replace(/\${(.*?)}/g, (_, key) => data[key]);
}

export async function sendActivationEmail(recipient: string, pin: string[]) {
  const html = activationTemplate(HOST, pin);
  return await sendMail([recipient], html, "Activate Your Account");
}

export async function sendResetPasswordEmail(recipient: string, pin: string[]) {
  const html = resetTemplate(HOST, pin);
  return await sendMail([recipient], html, "Reset Your Password");
}

function resetTemplate(baseUrl: string, pin: string[]) {
  const url = `${baseUrl}/auth/reset?pin=${pin.join("")}`;
  const code = pin
    .map((item: string) => {
      return `<span><code style="display:inline;padding:16px 4.5%;width:auto;margin:0 4px;background-color:#f4f4f4;border-radius:5px;border:1px solid #eee;color:#333">${item}</code></span>`;
    })
    .join("");
  
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
  <meta name="x-apple-disable-message-reformatting"/>
</head>
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
  Reset Password<div></div>
</div>
<body style="background-color:#fff">
  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;padding:0 12px;margin:0 auto;background-color:#fefefe;border:1px solid #eee">
    <tbody>
      <tr style="width:100%">
        <td>
          <h1 style="color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:24px;font-weight:bold;margin:20px 0 40px 0;padding:0">
            Reset Password
          </h1>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-bottom:14px">
            Click the following link to reset your password
          </p>
          <a href="${url}" style="color:#00cc66;text-decoration-line:none;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:14px;text-decoration:underline;display:block;margin-bottom:16px" target="_blank">
            ${url}
          </a>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-bottom:14px">
            Or, copy and paste this temporary code:
          </p>
          <div style="margin-top:30px;margin-bottom:30px">
            ${code}
          </div>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#ababab;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-top:14px;margin-bottom:16px">
            If you didn't try to reset your password, you can safely ignore this email.
          </p>
          <p style="font-size:16px;line-height:22px;margin:16px 0;color:#898989;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-top:45px">
            ${COPY}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

function activationTemplate(baseUrl: string, pin: string[]) {
  const url = `${baseUrl}/auth/activate?pin=${pin.join("")}`;
  const code = pin
    .map((item: string) => {
      return `<span><code style="display:inline;padding:16px 4.5%;width:auto;margin:0 4px;background-color:#f4f4f4;border-radius:5px;border:1px solid #eee;color:#333">${item}</code></span>`;
    })
    .join("");

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
  <meta name="x-apple-disable-message-reformatting"/>
</head>
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
  Confirm Your Email<div></div>
</div>
<body style="background-color:#fff">
  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;padding:0 12px;margin:0 auto;background-color:#fefefe;border:1px solid #eee">
    <tbody>
      <tr style="width:100%">
        <td>
          <h1 style="color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:24px;font-weight:bold;margin:20px 0 40px 0;padding:0">
            Activate Your Account
          </h1>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-bottom:14px">
            Click the following link to confirm your email
          </p>
          <a href="${url}" style="color:#00cc66;text-decoration-line:none;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:14px;text-decoration:underline;display:block;margin-bottom:16px" target="_blank">
            ${url}
          </a>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-bottom:14px">
            Or, copy and paste this temporary code:
          </p>
          <div style="margin-top:30px;margin-bottom:30px">
            ${code}
          </div>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#ababab;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-top:14px;margin-bottom:16px">
            If you didn't try to signup, you can safely ignore this email.
          </p>
          <p style="font-size:16px;line-height:22px;margin:16px 0;color:#898989;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;margin-top:45px">
            ${COPY}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

// Utility per test email in development
export async function testEmailSystem() {
  if (RESEND_API_KEY === "re_dummy_key_for_development") {
    console.log("📧 Email system: Development mode (emails will be logged, not sent)");
    return { mode: "development", configured: false };
  } else {
    console.log("📧 Email system: Production mode with Resend API");
    return { mode: "production", configured: true };
  }
}