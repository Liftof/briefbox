import { getResend, EMAIL_CONFIG } from './resend';
import { EmailType } from '@/db/schema';
import WelcomeEmail from '@/emails/WelcomeEmail';
import EngagementEmail from '@/emails/EngagementEmail';
import ConversionEmail from '@/emails/ConversionEmail';
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://palette.app';

interface SendEmailOptions {
  to: string;
  userName?: string;
  emailType: EmailType;
  metadata?: {
    generationId?: number;
    generationUrl?: string;
    brandName?: string;
    discountCode?: string;
  };
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, userName, emailType, metadata } = options;

  try {
    const resend = getResend();

    const token = generateUnsubscribeToken(to);
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(to)}&token=${token}`;
    const displayName = userName || 'there';

    let subject: string;
    let react: React.ReactElement;

    switch (emailType) {
      case 'welcome':
        subject = 'Welcome to Palette! Your creative journey starts now';
        react = WelcomeEmail({
          userName: displayName,
          unsubscribeUrl,
        });
        break;

      case 'engagement':
        subject = 'Your visual is waiting for you';
        react = EngagementEmail({
          userName: displayName,
          unsubscribeUrl,
          generationUrl: metadata?.generationUrl,
          brandName: metadata?.brandName,
        });
        break;

      case 'conversion':
        subject = 'Unlock unlimited creations - 50% off Pro';
        react = ConversionEmail({
          userName: displayName,
          unsubscribeUrl,
          discountCode: metadata?.discountCode || 'WELCOME50',
        });
        break;

      default:
        return { success: false, error: `Unknown email type: ${emailType}` };
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      react,
      replyTo: EMAIL_CONFIG.replyTo,
    });

    if (error) {
      console.error(`Failed to send ${emailType} email to ${to}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Sent ${emailType} email to ${to}, id: ${data?.id}`);
    return { success: true };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending ${emailType} email to ${to}:`, message);
    return { success: false, error: message };
  }
}
