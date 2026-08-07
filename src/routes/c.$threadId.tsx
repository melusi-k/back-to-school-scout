import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChecklistPanel } from "@/components/ChecklistPanel";
import { ChecklistToolResult, ProductResults } from "@/components/ToolResults";
import { useThreads, type ChecklistItem, type ChildThread } from "@/lib/threads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/c/$threadId")({
  head: () => ({
    meta: [
      { title: "Your school list — Satchel" },
      {
        name: "description",
        content:
          "Chat about your child's grade and sizes, get matched school supplies and bundle savings, and track it all on a live checklist.",
      },
      { property: "og:title", content: "Your school list — Satchel" },
      {
        property: "og:description",
        content: "Grade- and size-matched school shopping with a checklist that tracks itself.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThreadPage,
});

const STARTERS = [
  "My daughter is 7 and starting Grade 2",
  "What do I need for Kindergarten?",
  "Show me bundles for Grade 6",
];

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { threads, hydrated, update, create, remove } = useThreads();
  const navigate = useNavigate();

  const thread = threads.find((t) => t.id === threadId);

  useEffect(() => {
    if (hydrated && !thread) {
      void navigate({ to: "/", replace: true });
    }
  }, [hydrated, thread, navigate]);

  return (
    <div className="flex h-screen bg-background">
      <nav className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <GraduationCap className="size-5 text-primary" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">Satchel</span>
        </div>
        <div className="px-3">
          <Button
            className="w-full justify-start gap-2"
            variant="secondary"
            onClick={() => {
              const t = create();
              void navigate({ to: "/c/$threadId", params: { threadId: t.id } });
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add a child
          </Button>
        </div>
        <ul className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {threads.map((t) => (
            <li
              key={t.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg pr-1",
                t.id === threadId ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <Link
                to="/c/$threadId"
                params={{ threadId: t.id }}
                className="flex-1 truncate px-2.5 py-2 text-sm"
              >
                {t.childName}
                <span className="block truncate text-xs text-muted-foreground">
                  {t.grade || `${t.checklist.length} items`}
                </span>
              </Link>
              {threads.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${t.childName}`}
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    remove(t.id);
                    if (t.id === threadId) void navigate({ to: "/", replace: true });
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {thread ? (
        <ChatWindow key={thread.id} thread={thread} update={update} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      )}
    </div>
  );
}

function ChatWindow({
  thread,
  update,
}: {
  thread: ChildThread;
  update: (id: string, patch: Partial<ChildThread>) => void;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const { messages, sendMessage, status } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onError: (error) => toast.error(error.message || "Satchel couldn't reply. Try again."),
  });

  const threadId = thread.id;
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  // Persist messages and sync any checklist additions produced by the assistant.
  useEffect(() => {
    if (busy || messages.length === 0) return;
    const existing = thread.checklist;
    const byId = new Map(existing.map((i) => [i.id, i]));
    for (const message of messages) {
      for (const part of message.parts) {
        if (
          part.type === "tool-add_to_checklist" &&
          "state" in part &&
          part.state === "output-available"
        ) {
          const out = part.output as { items?: Omit<ChecklistItem, "done">[] } | undefined;
          for (const item of out?.items ?? []) {
            if (!byId.has(item.id)) byId.set(item.id, { ...item, done: false });
          }
        }
      }
    }
    const checklist = Array.from(byId.values());
    const changed =
      checklist.length !== existing.length ||
      JSON.stringify(messages) !== JSON.stringify(thread.messages);
    if (changed) update(threadId, { messages: messages as UIMessage[], checklist });
  }, [busy, messages, thread.checklist, thread.messages, threadId, update]);

  const toggleItem = useCallback(
    (id: string) =>
      update(threadId, {
        checklist: thread.checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
      }),
    [thread.checklist, threadId, update],
  );

  const removeItem = useCallback(
    (id: string) =>
      update(threadId, { checklist: thread.checklist.filter((i) => i.id !== id) }),
    [thread.checklist, threadId, update],
  );

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    void sendMessage({ text: value });
  };

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <Input
            value={thread.childName}
            aria-label="Child's name"
            onChange={(e) => update(threadId, { childName: e.target.value })}
            className="h-8 max-w-44 border-transparent bg-transparent px-2 text-sm font-semibold shadow-none focus-visible:border-input"
          />
          <Input
            value={thread.grade}
            aria-label="Grade"
            placeholder="Grade"
            onChange={(e) => update(threadId, { grade: e.target.value })}
            className="h-8 max-w-32 border-transparent bg-transparent px-2 text-sm shadow-none focus-visible:border-input"
          />
        </header>

        <Conversation className="flex-1">
          <ConversationContent className="mx-auto w-full max-w-2xl">
            {messages.length === 0 && (
              <div className="py-10 text-center">
                <GraduationCap className="mx-auto size-8 text-primary" aria-hidden />
                <h1 className="mt-3 text-lg font-semibold tracking-tight">
                  Let's get them kitted out
                </h1>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Tell me your child's age, grade and sizes and I'll match items from the school
                  collection, suggest bundles that save, and build your checklist.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {STARTERS.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => submit(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent
                  className={cn(
                    message.role === "assistant" && "bg-transparent p-0 text-foreground",
                  )}
                >
                  {message.parts.map((part, i) => {
                    const key = `${message.id}-${i}`;
                    if (part.type === "text") {
                      return <MessageResponse key={key}>{part.text}</MessageResponse>;
                    }
                    if (part.type === "tool-recommend_products") {
                      return (
                        <ToolBlock key={key} part={part} title="Matching the school collection">
                          <ProductResults output={part.output} />
                        </ToolBlock>
                      );
                    }
                    if (part.type === "tool-add_to_checklist") {
                      return (
                        <ToolBlock key={key} part={part} title="Updating your checklist">
                          <ChecklistToolResult output={part.output} />
                        </ToolBlock>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))}

            {status === "submitted" && (
              <Shimmer className="text-sm">Checking the school collection…</Shimmer>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="mx-auto w-full max-w-2xl px-4 pb-5">
          <PromptInput
            onSubmit={(_, event) => {
              event.preventDefault();
              submit(input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. He's 9, going into Grade 4, shoe size US 2Y"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      <div className="hidden w-80 shrink-0 border-l border-border lg:block">
        <ChecklistPanel items={thread.checklist} onToggle={toggleItem} onRemove={removeItem} />
      </div>
    </div>
  );
}

function ToolBlock({
  part,
  title,
  children,
}: {
  part: { state?: string; input?: unknown; output?: unknown; errorText?: string };
  title: string;
  children: React.ReactNode;
}) {
  const state = (part.state ?? "input-available") as
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  return (
    <div className="my-2 space-y-2">
      <Tool defaultOpen={false}>
        <ToolHeader title={title} state={state} type="tool-satchel" />
        <ToolContent>
          <ToolInput input={part.input} />
          <ToolOutput output={null} errorText={part.errorText} />
        </ToolContent>
      </Tool>
      {state === "output-available" && children}
    </div>
  );
}
