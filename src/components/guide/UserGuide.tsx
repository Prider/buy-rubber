'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import DarkModeToggle from '@/components/DarkModeToggle';
import Logo from '@/components/Logo';
import { canAccessAppPath, homePathForRole, isAdminLike } from '@/types/user';
import {
  GUIDE_GROUPS,
  GUIDE_PHASES,
  GUIDE_SHORTCUTS,
  GUIDE_TOPICS,
  searchTopics,
  topicById,
  type GuideBlock,
  type GuideTopic,
} from '@/lib/guide/manual';

function isHeading(block: GuideBlock): block is Extract<GuideBlock, { kind: 'h' }> {
  return block.kind === 'h';
}

function isFigure(block: GuideBlock): block is Extract<GuideBlock, { kind: 'figure' }> {
  return block.kind === 'figure';
}

function withoutLeadFigure(blocks: GuideBlock[]): {
  lead: Extract<GuideBlock, { kind: 'figure' }> | undefined;
  rest: GuideBlock[];
} {
  const index = blocks.findIndex(isFigure);
  if (index < 0) return { lead: undefined, rest: blocks };
  const lead = blocks[index];
  if (!isFigure(lead)) return { lead: undefined, rest: blocks };
  return { lead, rest: blocks.filter((_, blockIndex) => blockIndex !== index) };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToId(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
}

function revealCurrentTopic() {
  const nav = document.getElementById('guide-nav');
  const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!nav || !current || nav.clientHeight === 0) return;
  const navBox = nav.getBoundingClientRect();
  const itemBox = current.getBoundingClientRect();
  if (itemBox.top >= navBox.top && itemBox.bottom <= navBox.bottom) return;
  const delta = itemBox.top - navBox.top - nav.clientHeight / 2 + itemBox.height / 2;
  nav.scrollTo({
    top: nav.scrollTop + delta,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold text-gray-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[0.92em] text-gray-800 dark:bg-gray-700 dark:text-gray-100"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

const NOTE_STYLE = {
  tip: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50',
  warn: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50',
  danger: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-50',
} as const;

const NOTE_LABEL = {
  tip: 'คำแนะนำ',
  warn: 'ควรรู้',
  danger: 'ระวัง',
} as const;

function GuideFigure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <figure className="overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900/40">
      <button
        type="button"
        className="block w-full cursor-zoom-in rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        aria-haspopup="dialog"
        aria-label={`ขยายภาพ: ${alt}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="block w-full rounded-xl shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.1)]"
        />
      </button>
      <figcaption className="px-4 py-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {caption}
        <span className="text-gray-400"> · กดที่ภาพเพื่อขยาย</span>
      </figcaption>
      <dialog
        ref={dialogRef}
        aria-label={alt}
        className="w-[min(72rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-auto rounded-2xl bg-white p-3 text-gray-900 shadow-xl backdrop:bg-black/60 dark:bg-gray-900 dark:text-gray-100"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold leading-6">{caption}</p>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => dialogRef.current?.close()}
          >
            ปิด
          </button>
        </div>
        <img
          src={src}
          alt=""
          className="w-full rounded-lg shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.1)]"
        />
      </dialog>
    </figure>
  );
}

function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.kind === 'p') {
          return (
            <p key={index} className="text-base leading-7 text-gray-700 dark:text-gray-200">
              <RichText text={block.text} />
            </p>
          );
        }

        if (block.kind === 'h') {
          return (
            <h2
              key={block.id}
              id={block.id}
              className="scroll-mt-36 pt-2 text-lg font-bold text-gray-900 dark:text-white"
            >
              {block.title}
            </h2>
          );
        }

        if (block.kind === 'steps') {
          return (
            <ol key={index} className="space-y-3">
              {block.items.map((item, stepIndex) => (
                <li key={stepIndex} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-800 dark:bg-primary-900/50 dark:text-primary-100">
                    {stepIndex + 1}
                  </span>
                  <p className="min-w-0 flex-1 pt-0.5 text-base leading-7 text-gray-700 dark:text-gray-200">
                    <RichText text={item} />
                  </p>
                </li>
              ))}
            </ol>
          );
        }

        if (block.kind === 'list') {
          return (
            <ul key={index} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-3 text-base leading-7 text-gray-700 dark:text-gray-200">
                  <span
                    aria-hidden="true"
                    className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"
                  />
                  <span className="min-w-0 flex-1">
                    <RichText text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'note') {
          return (
            <aside key={index} className={`rounded-xl border px-4 py-3 ${NOTE_STYLE[block.tone]}`}>
              <p className="text-sm font-semibold">{NOTE_LABEL[block.tone]}</p>
              <p className="mt-1 text-base leading-7">
                <RichText text={block.text} />
              </p>
            </aside>
          );
        }

        if (block.kind === 'figure') {
          return <GuideFigure key={index} src={block.src} alt={block.alt} caption={block.caption} />;
        }

        if (block.kind === 'table') {
          return (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 bg-gray-50 text-sm font-semibold text-gray-500 dark:bg-gray-900/60 dark:text-gray-400 sm:grid-cols-2">
                <div className="px-4 py-2.5">{block.headers[0]}</div>
                <div className="hidden px-4 py-2.5 sm:block">{block.headers[1]}</div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {block.rows.map((row) => (
                  <div
                    key={row[0]}
                    className="grid grid-cols-1 sm:grid-cols-2"
                  >
                    <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 dark:bg-gray-900/40 dark:text-white sm:text-base">
                      {row[0]}
                    </div>
                    <div className="px-4 py-3 text-base leading-7 text-gray-700 dark:text-gray-200">
                      {row[1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (block.kind === 'split') {
          return (
            <div key={index} className="grid gap-3 lg:grid-cols-3">
              {block.columns.map((column, columnIndex) => (
                <section
                  key={column.title}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    <span className="mr-2 text-primary-600 dark:text-primary-300">{columnIndex + 1}</span>
                    {column.title}
                  </h2>
                  <ol className="mt-3 space-y-2">
                    {column.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-2 text-sm leading-6 text-gray-700 dark:text-gray-200">
                        <span className="mt-0.5 font-semibold text-gray-400">{itemIndex + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          );
        }

        return (
          <div key={index} className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {block.items.map((item) => {
              const open = openFaq === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left text-base font-semibold text-gray-900 motion-safe:transition-[background-color] motion-safe:duration-150 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700/40"
                    aria-expanded={open}
                    aria-controls={`faq-${item.id}`}
                    onClick={() => setOpenFaq(open ? null : item.id)}
                  >
                    <span>{item.q}</span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className={`h-5 w-5 shrink-0 text-gray-400 motion-safe:transition-transform motion-safe:duration-150 ${open ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    id={`faq-${item.id}`}
                    role="region"
                    className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 motion-safe:ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden" {...(open ? {} : { inert: true, 'aria-hidden': true as const })}>
                      <p className="px-4 pb-4 text-base leading-7 text-gray-700 dark:text-gray-200">
                        <RichText text={item.a} />
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function TopicButton({
  topic,
  active,
  onSelect,
}: {
  topic: GuideTopic;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(topic.id)}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-sm motion-safe:transition-[background-color,color] motion-safe:duration-150 ${
        active
          ? 'bg-primary-50 font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-100'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      {topic.title}
    </button>
  );
}

export default function UserGuide() {
  const { user, isLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [topicId, setTopicId] = useState('home');
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace(/^#/, '');
      setTopicId(topicById(id) ? id : 'home');
    };
    sync();
    setReady(true);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    revealCurrentTopic();
  }, [ready, topicId]);

  const topic = topicId === 'home' ? undefined : topicById(topicId);
  const results = useMemo(() => searchTopics(query), [query]);
  const searching = query.trim().length > 0;
  const groupLabel = GUIDE_GROUPS.find((group) => group.id === topic?.group)?.label;
  const nextTopic = topic?.nextId ? topicById(topic.nextId) : undefined;
  const headings = topic?.blocks.filter(isHeading) ?? [];
  const { lead: leadFigure, rest: bodyBlocks } = withoutLeadFigure(topic?.blocks ?? []);
  const phaseIndex = GUIDE_PHASES.findIndex((phase) => phase.topicId === topic?.id);
  const menuPath = topic?.href?.split('?')[0];
  const canOpenMenu = Boolean(
    user &&
    topic?.href &&
    menuPath &&
    canAccessAppPath(user.role, menuPath) &&
    (menuPath !== '/admin' || isAdminLike(user.role))
  );

  useEffect(() => {
    const title = searching
      ? 'ค้นหาคู่มือ'
      : topic
        ? topic.title
        : 'คู่มือผู้ใช้งาน';
    document.title = `${title} - Yang Dee`;
  }, [searching, topic]);

  function openTopic(id: string) {
    setTopicId(id);
    setQuery('');
    setNavOpen(false);
    const nextUrl = id === 'home'
      ? window.location.pathname
      : `${window.location.pathname}#${id}`;
    window.history.pushState(null, '', nextUrl);
    window.requestAnimationFrame(() => {
      const article = document.getElementById('guide-article');
      article?.focus({ preventScroll: true });
      scrollToId('guide-article');
      revealCurrentTopic();
    });
  }

  const backHref = user ? homePathForRole(user.role) : '/login';
  const backLabel = user ? 'กลับโปรแกรม' : 'เข้าสู่ระบบ';

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-gray-900 dark:text-gray-100">
      <button
        type="button"
        onClick={() => document.getElementById('guide-article')?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-sm dark:focus:bg-gray-800"
      >
        ข้ามไปเนื้อหา
      </button>

      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur-md dark:border-gray-700/80 dark:bg-gray-900/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 lg:px-6">
          <Logo className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">คู่มือผู้ใช้งาน</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">Yang Dee · จุดรับซื้อยาง</p>
          </div>
          {!isLoading && (
            <Link
              href={backHref}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary-700 motion-safe:transition-[scale,background-color] motion-safe:duration-150 motion-safe:ease-out hover:bg-primary-50 motion-safe:active:scale-[0.96] dark:text-primary-300 dark:hover:bg-primary-900/30"
            >
              {backLabel}
            </Link>
          )}
          <DarkModeToggle />
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pb-3 lg:px-6">
          <form
            role="search"
            className="relative min-w-0 flex-1"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="guide-search" className="sr-only">
              ค้นหาในคู่มือ
            </label>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              id="guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) {
                  event.preventDefault();
                  setQuery('');
                }
              }}
              placeholder="ค้นหา เช่น รับซื้อ, สลิป, สำรองข้อมูล"
              className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 text-base text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="ล้างคำค้น"
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </form>
          <button
            type="button"
            className="inline-flex h-12 shrink-0 items-center rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700 lg:hidden dark:border-gray-600 dark:text-gray-200"
            aria-expanded={navOpen}
            aria-controls="guide-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            หัวข้อ
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:px-6">
        <aside
          id="guide-nav"
          className={`${navOpen ? 'block' : 'hidden'} lg:sticky lg:top-32 lg:block lg:max-h-[calc(100dvh-8.5rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain`}
        >
          <nav aria-label="หัวข้อคู่มือ" className="space-y-4">
            <button
              type="button"
              onClick={() => openTopic('home')}
              aria-current={!searching && topicId === 'home' ? 'page' : undefined}
              className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold motion-safe:transition-[background-color,color] motion-safe:duration-150 ${
                !searching && topicId === 'home'
                  ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-100'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              เริ่มจากตรงนี้
            </button>
            {GUIDE_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="px-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {GUIDE_TOPICS.filter((item) => item.group === group.id).map((item) => (
                    <TopicButton
                      key={item.id}
                      topic={item}
                      active={!searching && item.id === topicId}
                      onSelect={openTopic}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div id="guide-article" tabIndex={-1} className="min-w-0 scroll-mt-36 outline-none">
          {!ready ? (
            <div className="h-64 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" aria-hidden="true" />
          ) : searching ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {results.length > 0 ? `พบ ${results.length} หัวข้อ` : 'ไม่พบหัวข้อ'}
              </h1>
              <p className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
                {results.length > 0
                  ? `คำว่า “${query.trim()}”`
                  : 'ลองคำว่า รับซื้อ, สลิป, สำรองข้อมูล หรือ ใบอนุญาต'}
              </p>
              <ul className="mt-5 space-y-2">
                {results.map((item) => {
                  const label = GUIDE_GROUPS.find((group) => group.id === item.group)?.label;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openTopic(item.id)}
                        className="flex min-h-11 w-full flex-col items-start rounded-xl border border-gray-200 px-4 py-3 text-left motion-safe:transition-[scale,background-color,border-color] motion-safe:duration-150 motion-safe:ease-out hover:border-primary-300 hover:bg-primary-50 motion-safe:enabled:active:scale-[0.96] dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                      >
                        <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">{label}</span>
                        <span className="text-base font-semibold text-gray-900 dark:text-white">{item.title}</span>
                        <span className="text-sm leading-6 text-gray-600 dark:text-gray-300">{item.summary}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : topicId === 'home' ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">Yang Dee</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                อยากทำอะไร เปิดหัวข้อนั้น
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-700 dark:text-gray-200">
                แต่ละหัวข้อมีภาพจากหน้าจอจริง แล้วตามด้วยขั้นตอนสั้นๆ
              </p>

              <button
                type="button"
                onClick={() => openTopic('purchase')}
                className="mt-6 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-primary-600 px-4 py-4 text-left text-white motion-safe:transition-[scale,background-color] motion-safe:duration-150 motion-safe:ease-out hover:bg-primary-700 motion-safe:active:scale-[0.96]"
              >
                <span>
                  <span className="block text-lg font-bold">รับซื้อยาง</span>
                  <span className="mt-1 block text-sm leading-6 text-primary-50">งานที่ใช้บ่อยที่สุด ชั่ง ใส่ราคา บันทึก แล้วพิมพ์สลิป</span>
                </span>
                <span aria-hidden="true" className="text-xl">→</span>
              </button>

              <h2 className="mt-8 text-lg font-bold text-gray-900 dark:text-white">หนึ่งวันของร้าน</h2>
              <ol className="mt-3 grid gap-3 sm:grid-cols-2">
                {GUIDE_PHASES.map((phase, index) => (
                  <li key={phase.topicId}>
                    <button
                      type="button"
                      onClick={() => openTopic(phase.topicId)}
                      className="flex h-full min-h-11 w-full gap-3 rounded-xl border border-gray-200 p-4 text-left motion-safe:transition-[scale,background-color,border-color] motion-safe:duration-150 motion-safe:ease-out hover:border-primary-300 hover:bg-primary-50 motion-safe:enabled:active:scale-[0.96] dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-900 dark:text-white">{phase.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-gray-600 dark:text-gray-300">{phase.detail}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <h2 className="mt-8 text-lg font-bold text-gray-900 dark:text-white">หน้าตาโปรแกรม</h2>
              <div className="mt-3">
                <GuideFigure
                  src="/guide/dashboard.jpg"
                  alt="แดชบอร์ดของ Yang Dee พร้อมเมนูด้านซ้าย"
                  caption="เมนูอยู่แถบซ้าย แดชบอร์ดคือหน้าแรกหลังเข้าสู่ระบบ"
                />
              </div>

              <h2 className="mt-8 text-lg font-bold text-gray-900 dark:text-white">เรื่องอื่นที่เจอบ่อย</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {GUIDE_SHORTCUTS.filter((shortcut) => shortcut.topicId !== 'purchase').map((shortcut) => (
                  <li key={shortcut.topicId}>
                    <button
                      type="button"
                      onClick={() => openTopic(shortcut.topicId)}
                      className="flex min-h-11 w-full flex-col items-start rounded-xl border border-gray-200 px-4 py-3 text-left motion-safe:transition-[scale,background-color,border-color] motion-safe:duration-150 motion-safe:ease-out hover:border-primary-300 hover:bg-primary-50 motion-safe:enabled:active:scale-[0.96] dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">{shortcut.title}</span>
                      <span className="text-sm leading-6 text-gray-600 dark:text-gray-300">{shortcut.detail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : topic ? (
            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
              <button
                type="button"
                onClick={() => openTopic('home')}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
              >
                ← หน้าแรกของคู่มือ
              </button>
              {phaseIndex >= 0 && (
                <p className="mt-3 text-sm font-semibold text-primary-700 dark:text-primary-300">
                  ขั้นที่ {phaseIndex + 1} จาก {GUIDE_PHASES.length} ในหนึ่งวัน
                </p>
              )}
              {groupLabel && phaseIndex < 0 && (
                <p className="mt-3 text-sm font-semibold text-primary-700 dark:text-primary-300">{groupLabel}</p>
              )}
              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {topic.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-gray-700 dark:text-gray-200">{topic.summary}</p>
              {leadFigure && (
                <div className="mt-5">
                  <GuideFigure src={leadFigure.src} alt={leadFigure.alt} caption={leadFigure.caption} />
                </div>
              )}
              {topic.menu && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  เปิดเมนู <span className="font-semibold text-gray-900 dark:text-white">{topic.menu}</span>
                </p>
              )}
              {canOpenMenu && topic.href && (
                <Link
                  href={topic.href}
                  className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white motion-safe:transition-[scale,background-color] motion-safe:duration-150 motion-safe:ease-out hover:bg-primary-700 motion-safe:active:scale-[0.96]"
                >
                  เปิดหน้านี้ในโปรแกรม
                </Link>
              )}
              {headings.length >= 2 && (
                <nav aria-label="ในหัวข้อนี้" className="mt-5">
                  <ul className="flex flex-wrap gap-2">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <button
                          type="button"
                          onClick={() => scrollToId(heading.id)}
                          className="inline-flex min-h-11 items-center rounded-full border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          {heading.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="mt-6">
                <GuideBlocks key={topic.id} blocks={bodyBlocks} />
              </div>
              {nextTopic && (
                <div className="mt-8 border-t border-gray-200 pt-5 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">ขั้นถัดไป</p>
                  <button
                    type="button"
                    onClick={() => openTopic(nextTopic.id)}
                    className="mt-2 flex min-h-11 w-full flex-col items-start rounded-xl border border-gray-200 px-4 py-3 text-left motion-safe:transition-[scale,background-color] motion-safe:duration-150 motion-safe:ease-out hover:bg-gray-50 motion-safe:enabled:active:scale-[0.96] dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{nextTopic.title}</span>
                    <span className="text-sm leading-6 text-gray-600 dark:text-gray-300">{nextTopic.summary}</span>
                  </button>
                </div>
              )}
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}
