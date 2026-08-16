import { z } from "zod";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { addAuditEvent, addConversationMessage, createConversationForOwner, getConversationWithMessages, listConversationsForOwner } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export function providerForModel(model: string) {
  if (model.startsWith("gemini")) return "Gemini";
  if (model.startsWith("claude")) return "Claude";
  if (model.startsWith("gpt")) return "GPT";
  return "Other";
}

export const chatRouter = router({
  models: protectedProcedure.query(async () => {
    const { data } = await listLLMModels();
    return data.map(model => ({ id: model.id, name: model.id, provider: providerForModel(model.id) }));
  }),
  conversations: protectedProcedure.query(({ ctx }) => listConversationsForOwner(ctx.user.id)),
  conversation: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getConversationWithMessages(ctx.user.id, input.id)),
  send: protectedProcedure.input(z.object({
    conversationId: z.number().int().positive().optional(),
    model: z.string().trim().max(160).optional(),
    content: z.string().trim().min(1).max(12000),
  })).mutation(async ({ ctx, input }) => {
    const catalog = (await listLLMModels()).data;
    const selectedModel = input.model ?? catalog[0]?.id;
    if (!selectedModel || !catalog.some(model => model.id === selectedModel)) throw new Error("Selected model is not available to this project");
    let conversationId = input.conversationId;
    if (conversationId) {
      const existing = await getConversationWithMessages(ctx.user.id, conversationId);
      if (!existing) throw new Error("Conversation not found");
    } else {
      conversationId = await createConversationForOwner(ctx.user.id, {
        title: input.content.slice(0, 72),
        selectedModel,
        provider: providerForModel(selectedModel),
      });
    }
    if (!conversationId) throw new Error("Conversation could not be created");
    const history = await getConversationWithMessages(ctx.user.id, conversationId);
    const requestMessages = [
      { role: "system" as const, content: "You are the AI Automation Command Center assistant. Explain proposed actions clearly, never claim an unavailable integration is connected, and surface approval requirements for external or destructive actions." },
      ...(history?.messages ?? []).map(message => ({ role: message.role, content: message.content })),
      { role: "user" as const, content: input.content },
    ];
    await addConversationMessage(conversationId, { role: "user", content: input.content, model: selectedModel });
    const response = await invokeLLM({ model: selectedModel, messages: requestMessages });
    const answer = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "The selected model returned no text output.";
    await addConversationMessage(conversationId, { role: "assistant", content: answer, model: selectedModel });
    await addAuditEvent(ctx.user.id, { action: "chat.completed", resourceType: "conversation", resourceId: String(conversationId), outcome: "success", detail: `Completed a ${providerForModel(selectedModel)} conversation response.` });
    return { conversationId, answer, model: selectedModel, provider: providerForModel(selectedModel) };
  }),
});
