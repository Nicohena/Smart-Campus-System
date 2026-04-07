import { FormEvent, useState } from "react";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatusBadge,
  TextArea,
  getErrorMessage,
} from "../../components/admin/adminShared";

interface AssistantReply {
  reply: string;
}

export function StudentAssistant() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askAssistant = async (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<AssistantReply>>("/assistant/chat", {
        method: "POST",
        body: { message: prompt.trim() },
      });
      setReply(response.data.reply);
    } catch (err) {
      setReply("");
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant" description="Ask campus questions using the authenticated assistant endpoint." />

      {error ? <EmptyState title="Assistant unavailable" description={error} /> : null}

      <Panel title="Ask a Question" description="Students can use the AI assistant for campus help and service guidance.">
        <form className="space-y-4" onSubmit={askAssistant}>
          <Field label="Prompt">
            <TextArea
              rows={5}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Where should I go to fix a maintenance issue in my dorm, and how do I check campus notices?"
            />
          </Field>
          <ActionButton type="submit" variant="primary" disabled={loading}>
            {loading ? "Thinking..." : "Ask assistant"}
          </ActionButton>
        </form>

        {reply ? (
          <div className="mt-5 rounded-2xl border border-white/5 bg-[#141415] p-4 text-sm leading-7 text-zinc-200">
            <div className="mb-3">
              <StatusBadge tone="info">Assistant Reply</StatusBadge>
            </div>
            {reply}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
