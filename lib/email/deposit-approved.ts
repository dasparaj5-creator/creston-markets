/**
 * Deposit confirmation email -- HTML email templates can't reliably use
 * Tailwind classes or CSS custom properties the way the real site does
 * (email clients, especially Outlook, have very limited CSS support),
 * so this is written as inline-styled HTML with the exact same brand
 * colors hardcoded directly: navy #0A0F1E background, gold #D4AF37
 * accent -- matching tailwind.config.ts and globals.css precisely
 * rather than approximating them.
 */
export function buildDepositApprovedEmail({
  clientName,
  amount,
  planName,
  dashboardUrl,
}: {
  clientName: string;
  amount: string;
  planName: string;
  dashboardUrl: string;
}) {
  const firstName = clientName.split(" ")[0] || clientName;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Deposit Confirmed</title>
</head>
<body style="margin:0; padding:0; background-color:#050810; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050810; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; background-color:#0A0F1E; border-radius:16px; border:1px solid rgba(212,175,55,0.2); overflow:hidden;">

          <!-- Header / Logo -->
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:20px; font-weight:700; color:#F9FAFB; letter-spacing:0.5px;">
                    CRESTON <span style="color:#D4AF37;">MARKETS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <div style="height:2px; width:48px; background-color:#D4AF37; border-radius:1px;"></div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <p style="margin:0; font-size:13px; font-weight:600; color:#D4AF37; letter-spacing:1px; text-transform:uppercase;">
                Deposit Confirmed
              </p>
              <h1 style="margin:12px 0 0 0; font-size:24px; font-weight:700; color:#F9FAFB; line-height:1.35;">
                Hey ${firstName}, great news
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 0 32px;">
              <p style="margin:0; font-size:15px; line-height:1.6; color:#D1D5DB;">
                Thanks for your patience. We're glad to inform you that your payment has been approved and your deposit is confirmed, updated, and reflected on your dashboard.
              </p>
            </td>
          </tr>

          <!-- Amount card -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table role="presentation" width="100%" style="background-color:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.2); border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0; font-size:12px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.5px;">Amount Confirmed</p>
                    <p style="margin:6px 0 0 0; font-size:28px; font-weight:700; color:#D4AF37;">${amount}</p>
                    <p style="margin:8px 0 0 0; font-size:13px; color:#9CA3AF;">${planName} Plan</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What happens now -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <p style="margin:0; font-size:15px; font-weight:600; color:#F9FAFB;">
                So, what happens now?
              </p>
              <p style="margin:8px 0 0 0; font-size:15px; line-height:1.6; color:#D1D5DB;">
                Sit back and let us take it from here. Your account is active and your capital is now working within your selected plan. You can track your balance, performance, and everything else, any time, from your dashboard.
              </p>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <a href="${dashboardUrl}" style="display:inline-block; background-color:#D4AF37; color:#0A0F1E; font-size:14px; font-weight:600; text-decoration:none; padding:13px 28px; border-radius:8px;">
                View My Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:40px 32px 32px 32px;">
              <div style="height:1px; background-color:rgba(255,255,255,0.08); margin-bottom:24px;"></div>
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6B7280;">
                All trading involves risk. Capital allocated through Creston Markets participates in live market activity and is subject to loss. Past performance does not guarantee future results.
              </p>
              <p style="margin:16px 0 0 0; font-size:12px; color:#6B7280;">
                Questions? Reach us at <a href="mailto:support@crestonmarkets.com" style="color:#D4AF37; text-decoration:none;">support@crestonmarkets.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `Hey ${firstName}, great news.

Thanks for your patience. We're glad to inform you that your payment has been approved and your deposit is confirmed, updated, and reflected on your dashboard.

Amount Confirmed: ${amount}
Plan: ${planName}

So, what happens now? Sit back and let us take it from here. Your account is active and your capital is now working within your selected plan.

View your dashboard: ${dashboardUrl}

Questions? Reach us at support@crestonmarkets.com

All trading involves risk. Capital allocated through Creston Markets participates in live market activity and is subject to loss. Past performance does not guarantee future results.`;

  return { html, text };
}
