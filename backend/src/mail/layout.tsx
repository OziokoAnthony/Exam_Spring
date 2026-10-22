import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

const body = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#111827',
};
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 16px' };
const button = {
  display: 'inline-block',
  backgroundColor: '#008040',
  color: '#ffffff',
  padding: '12px 20px',
  borderRadius: '6px',
  textDecoration: 'none',
};
const footer = { fontSize: '12px', color: '#6b7280', marginTop: '32px' };

export function EmailLayout({
  preview,
  title,
  children,
}: {
  preview: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={{ fontSize: '22px' }}>
            {title}
          </Heading>
          {children}
          <Text style={footer}>
            ExamSpring · Exam practice for Nigerian students. No ads, and we never sell your data.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/** Primary action plus the raw URL, for mail clients that strip buttons. */
export function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ margin: '24px 0' }}>
      <Link href={href} style={button}>
        {label}
      </Link>
      <Text style={{ fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' }}>{href}</Text>
    </Section>
  );
}
