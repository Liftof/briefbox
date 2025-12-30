import { Text, Button, Section, Img } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface EngagementEmailProps {
  userName: string;
  unsubscribeUrl: string;
  generationUrl?: string;
  brandName?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://palette.app';

export function EngagementEmail({
  userName,
  unsubscribeUrl,
  generationUrl,
  brandName,
}: EngagementEmailProps) {
  return (
    <EmailLayout
      previewText="Your visual is ready to download!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={heading}>Have you downloaded your creation?</Text>

      <Text style={paragraph}>
        Hi {userName},
      </Text>

      <Text style={paragraph}>
        You recently created {brandName ? `a visual for ${brandName}` : 'a stunning visual'} on
        Palette. Have you downloaded it yet?
      </Text>

      {generationUrl && (
        <Section style={imageSection}>
          <Img
            src={generationUrl}
            width="400"
            alt="Your creation"
            style={generationImage}
          />
        </Section>
      )}

      <Text style={paragraph}>
        Your creations are waiting in your dashboard. Download them before they
        get lonely!
      </Text>

      <Section style={buttonSection}>
        <Button
          href={`${baseUrl}/playground`}
          style={button}
        >
          View My Creations
        </Button>
      </Section>

      <Text style={tipText}>
        Tip: You can also generate more variations or try different templates for
        your brand.
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

const imageSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
};

const generationImage = {
  borderRadius: '8px',
  maxWidth: '100%',
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
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const tipText = {
  fontSize: '14px',
  color: '#8898aa',
  fontStyle: 'italic' as const,
  marginTop: '24px',
};

export default EngagementEmail;
