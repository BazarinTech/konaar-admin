import { redirect } from 'next/navigation';

/** The area's front door is the engine; skills are one link from it. */
export default function AiPage() {
  redirect('/ai/engine');
}
