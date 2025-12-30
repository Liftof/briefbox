import {
  Html,
  Head,
  Body,
  Container,
  Img,
  Section,
  Text,
  Hr,
  Link,
  Preview,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText: string;
  unsubscribeUrl: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://palette.app';

export function EmailLayout({ children, previewText, unsubscribeUrl }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>Palette</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Palette - AI-Powered Visual Creation
            </Text>
            <Text style={footerLinks}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
              {' | '}
              <Link href={baseUrl} style={footerLink}>
                Visit Palette
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const logoSection = {
  padding: '24px 48px',
  borderBottom: '1px solid #e6ebf1',
};

const logoText = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#5046e5',
  margin: '0',
};

const content = {
  padding: '32px 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '0',
};

const footer = {
  padding: '24px 48px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 8px 0',
};

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};

const footerLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};

export default EmailLayout;
