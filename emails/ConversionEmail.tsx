import { Text, Button, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface ConversionEmailProps {
  userName: string;
  unsubscribeUrl: string;
  discountCode: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://palette.app';

export function ConversionEmail({
  userName,
  unsubscribeUrl,
  discountCode,
}: ConversionEmailProps) {
  return (
    <EmailLayout
      previewText="Special offer: 50% off Palette Pro - Limited time!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={heading}>Unlock Unlimited Creations</Text>

      <Text style={paragraph}>
        Hi {userName},
      </Text>

      <Text style={paragraph}>
        You have been creating amazing visuals with Palette. We noticed you are
        on the free plan - which means you are limited to just 2 generations.
      </Text>

      <Text style={paragraph}>
        Ready to take your content to the next level?
      </Text>

      <Section style={offerBox}>
        <Text style={offerTitle}>Special Welcome Offer</Text>
        <Text style={offerDiscount}>50% OFF</Text>
        <Text style={offerDescription}>
          Upgrade to Pro and get 50 generations per month
        </Text>
        <Text style={offerCode}>
          Use code: <span style={offerCodeBold}>{discountCode}</span>
        </Text>
      </Section>

      <Text style={benefitsTitle}>What you will get with Pro:</Text>

      <Section style={benefitsList}>
        <Text style={benefit}>50 generations per month</Text>
        <Text style={benefit}>Priority support</Text>
        <Text style={benefit}>Access to all templates</Text>
        <Text style={benefit}>Higher resolution exports</Text>
      </Section>

      <Section style={buttonSection}>
        <Button
          href={`${baseUrl}/pricing?code=${discountCode}`}
          style={button}
        >
          Claim 50% Off Now
        </Button>
      </Section>

      <Hr style={hr} />

      <Text style={urgency}>
        This offer expires in 48 hours. Do not miss out!
      </Text>
    </EmailLayout>
  );
}

// Styles
const heading = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525f7f',
  marginBottom: '16px',
};

const offerBox = {
  backgroundColor: '#f0f0ff',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
  border: '2px solid #5046e5',
};

const offerTitle = {
  fontSize: '14px',
  color: '#5046e5',
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  marginBottom: '8px',
  margin: '0 0 8px 0',
};

const offerDiscount = {
  fontSize: '48px',
  fontWeight: '700' as const,
  color: '#5046e5',
  margin: '0 0 8px 0',
};

const offerDescription = {
  fontSize: '16px',
  color: '#525f7f',
  margin: '0 0 16px 0',
};

const offerCode = {
  fontSize: '18px',
  color: '#1a1a1a',
  backgroundColor: '#fff',
  padding: '8px 16px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '0',
};

const offerCodeBold = {
  fontWeight: '700' as const,
};

const benefitsTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  marginTop: '24px',
  marginBottom: '16px',
};

const benefitsList = {
  marginBottom: '24px',
};

const benefit = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#525f7f',
  paddingLeft: '16px',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#5046e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
};

const urgency = {
  fontSize: '14px',
  color: '#e53e3e',
  fontWeight: '600' as const,
  textAlign: 'center' as const,
};

export default ConversionEmail;
