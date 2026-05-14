import React from 'react';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseInline(raw: string): string {
  const s = escapeHtml(raw);
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-size:0.85em;font-family:monospace;color:#ea580c;border:1px solid #e5e7eb">$1</code>');
}

function parseMarkdown(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  const paraLines: string[] = [];

  const flushPara = () => {
    if (paraLines.length > 0) {
      out.push(`<p style="margin-bottom:1rem;line-height:1.75;color:#374151">${paraLines.map(parseInline).join('<br />')}</p>`);
      paraLines.length = 0;
    }
  };
  const closeUl = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
  };
  const closeOl = () => {
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  for (const line of lines) {
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushPara(); closeUl(); closeOl();
      out.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0" />');
      continue;
    }

    // Headings
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h1) {
      flushPara(); closeUl(); closeOl();
      out.push(`<h1 style="font-size:1.5rem;font-weight:900;margin:1.5rem 0 0.75rem;color:#111827">${parseInline(h1[1])}</h1>`);
      continue;
    }
    if (h2) {
      flushPara(); closeUl(); closeOl();
      out.push(`<h2 style="font-size:1.25rem;font-weight:900;margin:1.25rem 0 0.5rem;color:#111827">${parseInline(h2[1])}</h2>`);
      continue;
    }
    if (h3) {
      flushPara(); closeUl(); closeOl();
      out.push(`<h3 style="font-size:1rem;font-weight:900;margin:1rem 0 0.4rem;color:#111827">${parseInline(h3[1])}</h3>`);
      continue;
    }

    // Blockquote
    const bq = line.match(/^> (.+)/);
    if (bq) {
      flushPara(); closeUl(); closeOl();
      out.push(`<blockquote style="border-left:4px solid #f97316;padding:0.25rem 1rem;margin:0.75rem 0;font-style:italic;color:#6b7280">${parseInline(bq[1])}</blockquote>`);
      continue;
    }

    // Unordered list
    const ul = line.match(/^[-*] (.+)/);
    if (ul) {
      flushPara(); closeOl();
      if (!inUl) {
        out.push('<ul style="list-style-type:disc;padding-left:1.5rem;margin-bottom:1rem">');
        inUl = true;
      }
      out.push(`<li style="line-height:1.75;color:#374151;margin-bottom:0.25rem">${parseInline(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\. (.+)/);
    if (ol) {
      flushPara(); closeUl();
      if (!inOl) {
        out.push('<ol style="list-style-type:decimal;padding-left:1.5rem;margin-bottom:1rem">');
        inOl = true;
      }
      out.push(`<li style="line-height:1.75;color:#374151;margin-bottom:0.25rem">${parseInline(ol[1])}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushPara(); closeUl(); closeOl();
      continue;
    }

    // Regular paragraph
    closeUl(); closeOl();
    paraLines.push(line);
  }

  flushPara(); closeUl(); closeOl();
  return out.join('\n');
}

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
