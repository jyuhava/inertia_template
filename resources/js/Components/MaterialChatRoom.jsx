import { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const QUICK_PROMPTS = [
    'Ringkas materi ini dalam 5 poin penting.',
    'Buatkan 3 soal latihan dari materi ini.',
    'Apa konsep paling inti yang harus saya pahami?',
];

export default function MaterialChatRoom({
    materialId,
    endpointRoute,
    title = 'Diskusi Materi',
    overlay = false,
    overlayFixed = true,
    open,
    onOpenChange,
}) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Halo, saya asisten materi ini. Silakan tanya apa pun yang masih terkait dengan materi yang sedang Anda buka.',
        },
    ]);
    const [question, setQuestion] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [internalOpen, setInternalOpen] = useState(true);
    const listRef = useRef(null);

    const canSend = useMemo(() => question.trim().length > 0 && !sending, [question, sending]);
    const isControlled = typeof open === 'boolean';
    const isOpen = isControlled ? open : internalOpen;

    const setIsOpen = (value) => {
        if (!isControlled) {
            setInternalOpen(value);
        }
        if (onOpenChange) {
            onOpenChange(value);
        }
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            if (listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        });
    };

    const askAssistant = async (prompt) => {
        const trimmed = prompt.trim();
        if (!trimmed || sending) {
            return;
        }

        const userMessage = {
            role: 'user',
            content: trimmed,
        };

        const history = [...messages, userMessage];
        setMessages(history);
        setQuestion('');
        setError('');
        setSending(true);
        scrollToBottom();

        try {
            const response = await window.axios.post(route(endpointRoute, materialId), {
                question: trimmed,
                messages: history,
            });

            const payload = response.data || {};

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: payload.answer,
                },
            ]);
            scrollToBottom();
        } catch (e) {
            const apiMessage = e?.response?.data?.message;
            setError(apiMessage || e.message || 'Terjadi kesalahan saat chat AI.');
        } finally {
            setSending(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        askAssistant(question);
    };

    const panelClass = overlay
        ? overlayFixed
            ? 'fixed right-4 top-[56%] z-40 w-[calc(100vw-2rem)] -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-950 text-slate-100 shadow-[0_24px_60px_-18px_rgba(2,6,23,0.65)] ring-1 ring-slate-700/70 md:right-6 md:w-[420px] lg:right-8 lg:max-h-[calc(100vh-5rem)]'
            : 'sticky top-24 z-30 self-start h-fit overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-950 text-slate-100 shadow-[0_24px_60px_-18px_rgba(2,6,23,0.65)] ring-1 ring-slate-700/70'
        : 'sticky top-24 self-start h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100';

    const allowToggle = isControlled || overlay;

    if (allowToggle && !isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-900/30 ring-1 ring-slate-700 hover:bg-slate-800"
            >
                Buka Chat Materi
            </button>
        );
    }

    return (
        <section className={panelClass}>
            <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-slate-950">
                            <ChatGlyph />
                        </span>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
                            <p className="text-[11px] font-medium text-cyan-300">Mode Kontekstual Materi</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-300">Diskusi hanya untuk materi yang sedang dibuka.</p>
                    </div>
                    {allowToggle ? (
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-md border border-slate-600 bg-slate-900/70 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                        >
                            Tutup
                        </button>
                    ) : null}
                </div>
            </div>

            <div ref={listRef} className={`space-y-3 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-4 py-4 ${overlay ? 'max-h-[320px] md:max-h-[390px]' : 'max-h-[440px]'}`}>
                {messages.map((message, idx) => (
                    <div key={`${message.role}-${idx}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm md:max-w-[80%] ${
                                message.role === 'user'
                                    ? 'rounded-br-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-900/30'
                                    : 'rounded-bl-md border border-slate-700 bg-slate-800 text-slate-100'
                            }`}
                        >
                            <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                                {message.role === 'user' ? <UserGlyph /> : <SparkGlyph />}
                                <span>{message.role === 'user' ? 'Anda' : 'Asisten'}</span>
                            </p>
                            <MarkdownMessage content={message.content} isUser={message.role === 'user'} />
                        </div>
                    </div>
                ))}

                {sending ? (
                    <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 shadow-sm">
                            Asisten sedang mengetik...
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="border-t border-slate-800 bg-slate-950 px-4 py-3">
                <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                        <button
                            key={prompt}
                            type="button"
                            onClick={() => askAssistant(prompt)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
                        >
                            <SparkGlyph />
                            {prompt}
                        </button>
                    ))}
                </div>

                {error ? <div className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div> : null}

                <form onSubmit={submit} className="flex items-end gap-2">
                    <textarea
                        rows={2}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Tulis pertanyaan tentang materi ini..."
                        className="block w-full rounded-xl border-slate-700 bg-slate-900 text-sm text-slate-100 shadow-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500"
                    />
                    <button
                        type="submit"
                        disabled={!canSend}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <SendGlyph />
                        <span>Kirim</span>
                    </button>
                </form>
            </div>
        </section>
    );
}

function ChatGlyph() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8M8 14h5M5 19l2.5-2H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function UserGlyph() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
        </svg>
    );
}

function SparkGlyph() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
        </svg>
    );
}

function SendGlyph() {
    return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
    );
}

function MarkdownMessage({ content, isUser }) {
    const text = isUser ? 'text-white' : 'text-slate-100';
    const muted = isUser ? 'text-cyan-100' : 'text-slate-300';
    const codeInline = isUser ? 'bg-cyan-700/50 text-white' : 'bg-slate-900 text-cyan-200';
    const codeBlock = isUser ? 'bg-cyan-800/60 text-white border-cyan-300/30' : 'bg-slate-900 text-slate-100 border-slate-600';
    const hr = isUser ? 'border-cyan-200/30' : 'border-slate-600';
    const tableBorder = isUser ? 'border-cyan-200/30' : 'border-slate-600';

    return (
        <div className={`space-y-2 text-sm leading-relaxed ${text}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 className={`text-base font-bold ${text}`}>{children}</h1>,
                    h2: ({ children }) => <h2 className={`text-[15px] font-bold ${text}`}>{children}</h2>,
                    h3: ({ children }) => <h3 className={`text-sm font-semibold ${text}`}>{children}</h3>,
                    p: ({ children }) => <p className={`whitespace-pre-wrap ${text}`}>{children}</p>,
                    ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
                    li: ({ children }) => <li className={text}>{children}</li>,
                    blockquote: ({ children }) => <blockquote className={`border-l-2 pl-3 italic ${muted}`}>{children}</blockquote>,
                    code({ inline, children }) {
                        if (inline) {
                            return <code className={`rounded px-1 py-0.5 text-[12px] ${codeInline}`}>{children}</code>;
                        }
                        return (
                            <pre className={`overflow-x-auto rounded-lg border p-2 text-[12px] ${codeBlock}`}>
                                <code>{children}</code>
                            </pre>
                        );
                    },
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2">
                            {children}
                        </a>
                    ),
                    hr: () => <hr className={`my-2 border-t ${hr}`} />,
                    table: ({ children }) => (
                        <div className={`overflow-x-auto rounded-lg border ${tableBorder}`}>
                            <table className="w-full border-collapse text-left text-[12px]">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className={isUser ? 'bg-cyan-700/30' : 'bg-slate-800'}>{children}</thead>,
                    th: ({ children }) => <th className={`border px-2 py-1 font-semibold ${tableBorder}`}>{children}</th>,
                    td: ({ children }) => <td className={`border px-2 py-1 ${tableBorder}`}>{children}</td>,
                }}
            >
                {content || ''}
            </ReactMarkdown>
        </div>
    );
}
