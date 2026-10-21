'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * An email's HTML, shown without letting it touch the console.
 *
 * Inbound mail is written by strangers. A sandboxed iframe with no
 * `allow-scripts` means nothing in it runs; `allow-same-origin` is granted
 * only so this component can read the document's height, which needs no
 * script inside the frame. Links open in a new tab, never in the frame.
 * Remote images load by default — a reader expects them — unless `blockRemote`.
 */
export function HtmlFrame({
  html,
  className,
  blockRemote = false,
  minHeight = 80,
  fixedHeight,
}: {
  html: string;
  className?: string;
  blockRemote?: boolean;
  minHeight?: number;
  /** A fixed height (a preview pane) instead of growing to the content. */
  fixedHeight?: number | string;
}) {
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState(minHeight);

  const doc = React.useMemo(() => {
    const csp = blockRemote
      ? "default-src 'none'; img-src data: cid:; style-src 'unsafe-inline'; font-src data:"
      : "default-src 'none'; img-src * data: cid:; style-src 'unsafe-inline' *; font-src * data:";
    const head = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>html,body{margin:0;padding:0;background:#fff;color:#18181b;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;overflow-wrap:anywhere}img{max-width:100%;height:auto}body{padding:2px}</style>`;
    return /<html[\s>]/i.test(html)
      ? html.replace(/<head([^>]*)>/i, `<head$1>${head}`)
      : `<!doctype html><html><head>${head}</head><body>${html}</body></html>`;
  }, [html, blockRemote]);

  const measure = React.useCallback(() => {
    const body = ref.current?.contentDocument?.body;
    const root = ref.current?.contentDocument?.documentElement;
    if (!body || !root) return;
    setHeight(Math.max(minHeight, root.scrollHeight, body.scrollHeight));
  }, [minHeight]);

  return (
    <iframe
      ref={ref}
      title="Email content"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={doc}
      onLoad={() => {
        measure();
        // Images arrive after load and change the height.
        const imgs = ref.current?.contentDocument?.images;
        if (imgs) for (const img of Array.from(imgs)) img.addEventListener('load', measure);
      }}
      style={{ height: fixedHeight ?? height }}
      className={cn('w-full rounded-md border-0 bg-white', className)}
    />
  );
}
