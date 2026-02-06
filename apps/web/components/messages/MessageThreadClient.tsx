"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useClientT } from "@/lib/i18n/useClientT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  content: string;
  created_at: string;
};

type Employee = {
  id: string;
  user_id?: string | null;
  full_name: string;
  email?: string | null;
};

type MessageThreadClientProps = {
  userId: string;
};

export default function MessageThreadClient({ userId }: MessageThreadClientProps) {
  const { t } = useClientT("messages");
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meUserId, setMeUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const lastReadAtRef = useRef(0);
  const readInFlightRef = useRef(false);

  const markThreadRead = useCallback(async () => {
    const now = Date.now();
    if (readInFlightRef.current || now - lastReadAtRef.current < 2500) {
      return;
    }
    readInFlightRef.current = true;
    await fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ with_user_id: userId })
    });
    window.dispatchEvent(new Event("fv-messages-read"));
    lastReadAtRef.current = now;
    readInFlightRef.current = false;
  }, [userId]);

  const fetchMessages = useCallback(async () => {
    const response = await fetch(`/api/messages?with=${encodeURIComponent(userId)}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return;
    }
    const messagesPayload = (await response.json()) as { data?: Message[] };
    if (messagesPayload.data) {
      setMessages((prev) => {
        const merged = [...prev];
        const seen = new Set(prev.map((message) => message.id));
        messagesPayload.data?.forEach((message) => {
          if (!seen.has(message.id)) {
            merged.push(message);
          }
        });
        return merged;
      });
      await markThreadRead();
    }
  }, [userId, markThreadRead]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [meResponse, employeesResponse, messagesResponse] = await Promise.all([
          fetch("/api/employees/me", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
          fetch(`/api/messages?with=${encodeURIComponent(userId)}`, {
            cache: "no-store"
          })
        ]);
        if (meResponse.ok) {
          const mePayload = (await meResponse.json()) as {
            data?: { user_id?: string | null; company_id?: string | null };
          };
          if (isMounted) {
            setMeUserId(mePayload.data?.user_id ?? null);
            setCompanyId(mePayload.data?.company_id ?? null);
          }
        }
        if (employeesResponse.ok) {
          const employeesPayload = (await employeesResponse.json()) as {
            data?: Employee[];
          };
          if (isMounted) {
            setEmployees(employeesPayload.data ?? []);
          }
        }
        if (messagesResponse.ok) {
          const messagesPayload = (await messagesResponse.json()) as {
            data?: Message[];
          };
          if (isMounted) {
            setMessages(messagesPayload.data ?? []);
          }
          if (isMounted) {
            await markThreadRead();
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (!companyId || !meUserId) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`messages-thread-${companyId}-${meUserId}`);
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `company_id=eq.${companyId}`
      },
      (payload) => {
        const record = payload.new as Message;
        const isThread =
          (record.sender_user_id === userId && record.recipient_user_id === meUserId) ||
          (record.sender_user_id === meUserId && record.recipient_user_id === userId);
        if (isThread) {
          setMessages((prev) => [...prev, record]);
          if (record.sender_user_id === userId) {
            markThreadRead();
          }
        }
      }
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, meUserId, userId]);

  const recipient = useMemo(
    () => employees.find((employee) => employee.user_id === userId) ?? null,
    [employees, userId]
  );

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) {
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_user_id: userId,
          content
        })
      });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { data?: Message };
      if (payload.data) {
        setMessages((prev) => [...prev, payload.data as Message]);
        setDraft("");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/messages")}
            className="h-10 w-10 rounded-full p-0"
            aria-label={t("thread.back")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </Button>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {recipient?.full_name ?? t("thread.title")}
            </p>
            <p className="text-xs text-slate-500">{recipient?.email ?? ""}</p>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => router.push("/messages")}>
          {t("thread.back")}
        </Button>
      </div>

      <div className="flex-1 min-h-[320px] max-h-[60vh] space-y-3 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/95 p-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-8 rounded-xl bg-slate-100" />
            <div className="h-8 rounded-xl bg-slate-100" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">{t("thread.empty")}</p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_user_id === meUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    isMine
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <textarea
          className="min-h-[44px] w-full rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          placeholder={t("thread.placeholder")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="button" onClick={handleSend} disabled={isSending}>
          {t("thread.send")}
        </Button>
      </div>
    </div>
  );
}
