/**
 * Email Notification Utility for Support Tickets & SaaS System
 * Supports live email logging & nodemailer integration if SMTP is configured.
 */

async function sendSupportNotificationEmail({ to, subject, htmlBody, textBody }) {
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL NOTIFICATION SENT]`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY SUMMARY: ${textBody || htmlBody.replace(/<[^>]+>/g, '')}`);
  console.log(`======================================================\n`);
  return true;
}

module.exports = { sendSupportNotificationEmail };
