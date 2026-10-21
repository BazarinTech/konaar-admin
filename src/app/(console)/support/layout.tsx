import { SupportTabs } from './support-tabs';

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SupportTabs />
      {children}
    </>
  );
}
