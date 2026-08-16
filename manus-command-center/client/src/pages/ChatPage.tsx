import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Bot, MessageSquarePlus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function providerTone(provider: string) { return provider === "Gemini" ? "bg-cyan-50 text-cyan-800 border-cyan-200" : provider === "Claude" ? "bg-rose-50 text-rose-800 border-rose-200" : provider === "GPT" ? "bg-violet-50 text-violet-800 border-violet-200" : "bg-slate-50 text-slate-700 border-slate-200"; }

export default function ChatPage() {
  const utils = trpc.useUtils();
  const models = trpc.chat.models.useQuery();
  const conversations = trpc.chat.conversations.useQuery();
  const [activeId, setActiveId] = useState<number | undefined>();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const conversation = trpc.chat.conversation.useQuery({ id: activeId ?? 0 }, { enabled: Boolean(activeId) });
  const send = trpc.chat.send.useMutation({
    onSuccess: async response => {
      setActiveId(response.conversationId);
      await Promise.all([utils.chat.conversations.invalidate(), utils.chat.conversation.invalidate({ id: response.conversationId }), utils.commandCenter.dashboard.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => { if (!selectedModel && models.data?.[0]?.id) setSelectedModel(models.data[0].id); }, [models.data, selectedModel]);
  const messageList: Message[] = useMemo(() => (conversation.data?.messages ?? []).map(message => ({ role: message.role === "tool" ? "assistant" : message.role, content: message.content })) as Message[], [conversation.data?.messages]);
  const currentModel = models.data?.find(model => model.id === selectedModel);
  const handleSend = (content: string) => send.mutate({ conversationId: activeId, model: selectedModel || undefined, content });
  const newConversation = () => setActiveId(undefined);

  return <div className="mx-auto grid max-w-[1450px] gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
    <aside className="blueprint-card flex min-h-[650px] flex-col overflow-hidden"><div className="border-b border-slate-200 p-4"><p className="eyebrow">PERSISTENT HISTORY</p><Button className="mt-3 w-full" variant="outline" onClick={newConversation}><MessageSquarePlus className="mr-2 size-4" />New conversation</Button></div><ScrollArea className="flex-1 p-2">{conversations.isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="m-2 h-14" />) : conversations.data?.length ? conversations.data.map(item => <button key={item.id} onClick={() => setActiveId(item.id)} className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition-colors ${activeId === item.id ? "bg-cyan-50" : "hover:bg-slate-50"}`}><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 font-mono text-[10px] uppercase text-slate-400">{item.provider || "Model pending"}</p></button>) : <div className="p-6 text-center"><Bot className="mx-auto size-5 text-slate-300" /><p className="mt-3 text-xs text-slate-500">Your conversations will appear here.</p></div>}</ScrollArea></aside>
    <section className="space-y-5"><section className="blueprint-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">MULTI-MODEL COMMAND LINE</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">AI Chat</h1><p className="mt-1 text-xs text-slate-500">Select an authorized runtime model. Model availability is discovered from the server, not hard-coded.</p></div><div className="flex items-center gap-2"><Select value={selectedModel} onValueChange={setSelectedModel} disabled={models.isLoading || !models.data?.length}><SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Choose model" /></SelectTrigger><SelectContent>{models.data?.map(model => <SelectItem key={model.id} value={model.id}>{model.provider} · {model.name}</SelectItem>)}</SelectContent></Select>{currentModel && <Badge variant="outline" className={providerTone(currentModel.provider)}>{currentModel.provider}</Badge>}</div></section>
      <Card className="blueprint-card border-0"><CardContent className="p-0"><AIChatBox messages={messageList} onSendMessage={handleSend} isLoading={send.isPending || conversation.isLoading} height="min(68vh, 720px)" placeholder="Ask the command center to plan, analyze, or explain…" emptyStateMessage="Start an account-scoped multi-model conversation" suggestedPrompts={["Plan a safe workflow for a repository release", "Explain the difference between Manual and Assisted autonomy", "Draft a research-to-video content pipeline"]} /></CardContent></Card>
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-5 text-amber-900"><Sparkles className="mt-0.5 size-4 shrink-0" /><p>Responses are stored with the selected model and conversation history. The chat explains approval requirements; it does not silently execute external actions or assume an unavailable integration is connected.</p></div>
    </section>
  </div>;
}
