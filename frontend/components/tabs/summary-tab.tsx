'use client';

import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/lib/session-context';
import { getSummary } from '@/lib/api';
import { SummarySkeleton } from '../skeletons';
import { StarRating } from '../star-rating';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles } from 'lucide-react';

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch && /^https?:\/\//.test(linkMatch[2])) {
        parts.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-4"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function cleanMarkdownLine(line: string) {
  return line.replace(/[●•]/g, '').trim();
}

function MarkdownSummary({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(' ').trim();
    paragraphLines.length = 0;
    if (!text) return;

    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-7 text-foreground">
        {renderInlineMarkdown(text, `p-${blocks.length}`)}
      </p>
    );
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];

    blocks.push(
      <ul key={`list-${blocks.length}`} className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="text-sm leading-7 text-foreground">
            {renderInlineMarkdown(item, `li-${blocks.length}-${index}`)}
          </li>
        ))}
      </ul>
    );
  };

  content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = /^(#{1,4})\s+(.+)$/.exec(line);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        const headingText = cleanMarkdownLine(heading[2]);
        const className =
          level === 1
            ? 'text-xl font-semibold leading-7 text-foreground'
            : 'text-base font-semibold leading-7 text-foreground';

        blocks.push(
          <h3 key={`h-${blocks.length}`} className={className}>
            {renderInlineMarkdown(headingText, `h-${blocks.length}`)}
          </h3>
        );
        return;
      }

      const listItem = /^(?:[-*+]|\d+[.)]|[●•])\s+(.+)$/.exec(line);
      if (listItem) {
        flushParagraph();
        listItems.push(cleanMarkdownLine(listItem[1]));
        return;
      }

      const quote = /^>\s+(.+)$/.exec(line);
      if (quote) {
        flushParagraph();
        flushList();
        const quoteText = cleanMarkdownLine(quote[1]);
        blocks.push(
          <blockquote
            key={`quote-${blocks.length}`}
            className="border-l-2 border-primary/40 pl-4 text-sm leading-7 text-muted-foreground"
          >
            {renderInlineMarkdown(quoteText, `quote-${blocks.length}`)}
          </blockquote>
        );
        return;
      }

      paragraphLines.push(cleanMarkdownLine(line));
    });

  flushParagraph();
  flushList();

  return <div className="space-y-4">{blocks}</div>;
}

export function SummaryTab() {
  const {
    sessionData,
    summary,
    setSummary,
    summaryRating,
    setSummaryRating,
    isLoading,
    setIsLoading,
    setError,
  } = useSession();

  useEffect(() => {
    if (!sessionData || summary) return;

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getSummary(sessionData.session_id);
        setSummary(response.summary);
      } catch (err) {
        setError(`Failed to fetch summary: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [sessionData, summary, setSummary, setIsLoading, setError]);

  if (isLoading) {
    return <SummarySkeleton />;
  }

  if (!summary) {
    return (
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Summary
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">No summary available</h2>
        </div>
        <div className="px-6 py-8 text-sm text-muted-foreground">
          The document summary could not be generated for this session.
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
      <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Summary
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Document summary
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            AI-generated from the uploaded PDF
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 sm:p-6">
          <MarkdownSummary content={summary} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Was this summary useful?
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Rate the quality so the model performance review stays grounded in your feedback.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <StarRating value={summaryRating || 0} onChange={setSummaryRating} size="lg" />
          </div>
        </div>
      </div>
    </Card>
  );
}
