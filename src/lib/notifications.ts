import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendSMS(to: string, message: string) {
  try {
    await twilioClient.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await sgMail.send({
      to,
      from: 'your-verified-sender@yourdomain.com', // Update this
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendReferralInvite(
  phoneNumber: string,
  email: string,
  referralCode: string,
  videoUrl: string
) {
  const message = `Thank you for being a valued customer! Here's your unique referral code: ${referralCode}. Watch this video to learn more: ${videoUrl}`;
  
  await Promise.all([
    sendSMS(phoneNumber, message),
    sendEmail(
      email,
      'Your Referral Code',
      `
        <h2>Thank you for being a valued customer!</h2>
        <p>Here's your unique referral code: <strong>${referralCode}</strong></p>
        <p>Watch this video to learn more: <a href="${videoUrl}">${videoUrl}</a></p>
      `
    ),
  ]);
}
