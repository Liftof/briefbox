import { Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface WelcomeEmailProps {
  userName: string;
  unsubscribeUrl: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://palette.app';

export function WelcomeEmail({ userName, unsubscribeUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      previewText="Welcome to Palette - Let's create something amazing!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={heading}>Welcome to Palette!</Text>

      <Text style={paragraph}>
        Hi {userName},
      </Text>

      <Text style={paragraph}>
        You are now part of the Palette community. We are excited to help you
        create stunning visuals for your brand in seconds.
      </Text>

      <Text style={paragraph}>
        Here is what you can do:
      </Text>

      <Section style={list}>
        <Text style={listItem}>Add your brand and let AI analyze it</Text>
        <Text style={listItem}>Generate professional social media visuals</Text>
        <Text style={listItem}>Download and share instantly</Text>
      </Section>

      <Section style={buttonSection}>
        <Button
          href={`${baseUrl}/playground`}
          style={button}
        >
          Create Your First Visual
        </Button>
      </Section>

      <Text style={paragraph}>
        Have questions? Just reply to this email - we read every message.
      </Text>

      <Text style={signature}>
        The Palette Team
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

const list = {
  marginBottom: '24px',
};

const listItem = {
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
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const signature = {
  fontSize: '16px',
  color: '#525f7f',
  marginTop: '32px',
};

export default WelcomeEmail;
