import { EmailTabs } from './email-tabs';

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmailTabs />
      {children}
    </>
  );
}
