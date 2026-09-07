import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GraduationCap, Plus, X, ListChecks, MessageCircle, Trash2 } from "lucide-react";
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
import { ChecklistPanel } from "@/components/ChecklistPanel";
import { ChecklistToolResult, ProductResults } from "@/components/ToolResults";
import { ensureThreads, useThreads, type ChecklistItem, type ChildThread } from "@/lib/threads";
import { cn } from "@/lib/utils";

const STARTERS = [
  "My daughter is 7, starting Grade 2",
  "What do I need for Grade 4?",
  "School shoes, size 2",
];

/** Compact chat + checklist designed to live inside a floating widget panel. */
export function WidgetChat() {
  const { threads, hydrated, update, create, remove } = useThreads();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "list">("chat");

  useEffect(() => {
    if (!hydrated) return;
    const seeded = ensureThreads();
    setActiveId((current) =>
      current && seeded.some((t) => t.id === current) ? current : (seeded[0]?.id ?? null),
    );
  }, [hydrated, threads.length]);

  const thread = threads.find((t) => t.id === activeId) ?? threads[0];
  const itemCount = thread?.checklist.length ?? 0;

  const close = () => {
    if (typeof window !== "undefined") {
      window.parent.postMessage({ type: "satchel:close" }, "*");
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <GraduationCap className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">Back to School Scout</p>
          <p className="truncate text-xs text-muted-foreground">Sizes, grades &amp; a live list</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close chat" onClick={close}>
          <X className="size-4" aria-hidden />
        </Button>
      </header>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1.5">
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={cn(
              "group flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              t.id === thread?.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            <span className="max-w-24 truncate">{t.childName}</span>
            {threads.length > 1 && (
              <Trash2
                className="size-3 opacity-60 hover:opacity-100"
                aria-hidden
                onClick={(e) => {
                  e.stopPropagation();
                  remove(t.id);
                }}
              />
            )}
          </button>
        ))}
        <button
          type="button"
          aria-label="Add a child"
          onClick={() => setActiveId(create().id)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <Plus className="size-3" aria-hidden /> Child
        </button>
      </div>

      <div className="grid grid-cols-2 border-b border-border text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2",
            tab === "chat" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground",
          )}
        >
          <MessageCircle className="size-3.5" aria-hidden /> Chat
        </button>
        <button
          type="button"
          onClick={() => setTab("list")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2",
            tab === "list" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground",
          )}
        >
          <ListChecks className="size-3.5" aria-hidden /> List
          {itemCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {thread ? (
        tab === "chat" ? (
          <WidgetConversation key={thread.id} thread={thread} update={update} />
        ) : (
          <div className="min-h-0 flex-1">
            <ChecklistPanel
              items={thread.checklist}
              onToggle={(id) =>
                update(thread.id, {
                  checklist: thread.checklist.map((i) =>
                    i.id === id ? { ...i, done: !i.done } : i,
                  ),
                })
              }
              onRemove={(id) =>
                update(thread.id, { checklist: thread.checklist.filter((i) => i.id !== id) })
              }
            />
          </div>
        )
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      )}
    </div>
  );
}

function WidgetConversation({
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
    if (busy || messages.length === 0) return;
    const byId = new Map(thread.checklist.map((i) => [i.id, i]));
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
      checklist.length !== thread.checklist.length ||
      JSON.stringify(messages) !== JSON.stringify(thread.messages);
    if (changed) update(threadId, { messages: messages as UIMessage[], checklist });
  }, [busy, messages, thread.checklist, thread.messages, threadId, update]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      setInput("");
      void sendMessage({ text: value });
    },
    [busy, sendMessage],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="px-3 py-3">
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <GraduationCap className="mx-auto size-7 text-primary" aria-hidden />
              <p className="mt-2 text-sm font-semibold">Let's get them kitted out</p>
              <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
                Tell me your child's age, grade and sizes and I'll match items and build your
                checklist.
              </p>
              <div className="mt-4 flex flex-col gap-1.5">
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
                  "text-sm",
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
                      <WidgetToolBlock key={key} part={part} title="Matching the school range">
                        <ProductResults output={part.output} />
                      </WidgetToolBlock>
                    );
                  }
                  if (part.type === "tool-add_to_checklist") {
                    return (
                      <WidgetToolBlock key={key} part={part} title="Updating your checklist">
                        <ChecklistToolResult output={part.output} />
                      </WidgetToolBlock>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && (
            <Shimmer className="text-xs">Checking the school range…</Shimmer>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-2.5">
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
            placeholder="He's 9, Grade 4, shoe size 2…"
            className="text-sm"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

function WidgetToolBlock({
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
