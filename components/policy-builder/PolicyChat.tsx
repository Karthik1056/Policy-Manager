import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import api from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface PolicyChatProps {
  currentPolicy: any;
  onPolicyUpdate: (action: any) => void;
  policyId: string;
}

export default function PolicyChat({ currentPolicy, onPolicyUpdate, policyId }: PolicyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [queuedSuggestions, setQueuedSuggestions] = useState<any>(null);
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const findTabIdByName = (tabName?: string) => {
    if (!tabName) return undefined;
    const normalized = tabName.trim().toLowerCase();
    return currentPolicy?.tabs?.find((tab: any) => String(tab?.name || '').trim().toLowerCase() === normalized)?.id;
  };

  const findSubTabIdByName = (subTabName?: string, tabName?: string) => {
    if (!subTabName) return undefined;
    const normalizedSubTab = subTabName.trim().toLowerCase();
    const tabs = (currentPolicy?.tabs || []) as any[];
    const tabScope = tabName
      ? tabs.filter((tab: any) => String(tab?.name || '').trim().toLowerCase() === tabName.trim().toLowerCase())
      : tabs;

    for (const tab of tabScope) {
      const found = (tab?.subTabs || []).find(
        (subTab: any) => String(subTab?.name || '').trim().toLowerCase() === normalizedSubTab
      );
      if (found?.id) return found.id;
    }
    return undefined;
  };

  const fetchOrThrow = async (url: string, body: Record<string, any>) => {
    const { data } = await api.post(url, body);
    return data;
  };

  const createPolicyItem = async (action: any) => {
    if (!action?.type) throw new Error('Action type is missing');

    if (action.type === 'create_tab') {
      const tabPayload = {
        ...(action.tab || {}),
        policyEngineId: action?.tab?.policyEngineId || policyId,
        orderIndex: action?.tab?.orderIndex ?? (currentPolicy?.tabs?.length || 0),
      };
      await fetchOrThrow('/api/tab/createTab', tabPayload);
      return;
    }

    if (action.type === 'create_subtab') {
      const inputSubTab = action.subtab || {};
      const resolvedTabId = inputSubTab.tabId || findTabIdByName(inputSubTab.tabName);
      const subTabPayload = {
        ...inputSubTab,
        tabId: resolvedTabId,
        orderIndex: inputSubTab.orderIndex ?? 0,
      };
      if (!subTabPayload.tabId) {
        throw new Error('Unable to resolve tabId for subtab. Add tabId or tabName in draft JSON.');
      }
      await fetchOrThrow('/api/subtab/create', subTabPayload);
      return;
    }

    if (action.type === 'create_field') {
      const inputField = action.field || {};
      const resolvedSubTabId =
        inputField.subTabId ||
        findSubTabIdByName(inputField.subTabName || inputField.subtabName, inputField.tabName);
      const fieldPayload = {
        ...inputField,
        subTabId: resolvedSubTabId,
        fieldType: inputField.fieldType || 'TEXT',
        orderIndex: inputField.orderIndex ?? 0,
      };
      if (!fieldPayload.subTabId) {
        throw new Error('Unable to resolve subTabId for field. Add subTabId or subTabName in draft JSON.');
      }
      await fetchOrThrow('/api/field/create', fieldPayload);
      return;
    }

    throw new Error(`Unsupported action type: ${action.type}`);
  };

  const openDraftEditor = () => {
    if (!pendingAction) return;
    setDraftError(null);
    setShowDraftPreview(true);
  };

  const applyDraft = async () => {
    setDraftError(null);
    try {
      if (!pendingAction) {
        throw new Error('No action available in draft preview.');
      }
      await createPolicyItem(pendingAction);

      setPendingAction(null);
      setSuggestions(queuedSuggestions || null);
      setQueuedSuggestions(null);
      setShowDraftPreview(false);
      onPolicyUpdate(pendingAction);
    } catch (error: any) {
      setDraftError(error?.message || 'Failed to create from draft preview');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data } = await api.post('http://localhost:8000/api/chat/policy-builder', {
        message: input,
        current_policy: currentPolicy
      });
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.result.message 
      }]);

      const result = data?.result || {};

      if (result.action && result.action.type !== 'error') {
        setPendingAction(result.action);
      } else {
        setPendingAction(null);
      }

      if (result.suggestions) {
        setQueuedSuggestions(result.suggestions);
        if (!result.action || result.action.type === 'error') {
          setSuggestions(result.suggestions);
          setQueuedSuggestions(null);
        } else {
          setSuggestions(null);
        }
      } else {
        setSuggestions(null);
        setQueuedSuggestions(null);
      }

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Error processing request' 
      }]);
    }

    setInput('');
    setLoading(false);
  };

  return (
    <Card className="p-4 h-96 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
            {msg.content}
          </div>
        ))}
        
        {pendingAction && (
          <div className="border-2 border-dashed border-blue-300 p-3 rounded bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">
                {pendingAction.type.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={openDraftEditor}>
                  Draft
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!pendingAction) return;
                    try {
                      await createPolicyItem(pendingAction);
                      setPendingAction(null);
                      setSuggestions(queuedSuggestions || null);
                      setQueuedSuggestions(null);
                      setShowDraftPreview(false);
                      onPolicyUpdate(pendingAction);
                    } catch (error) {
                      console.error('Failed to create policy item:', error);
                    }
                  }}
                  disabled={!pendingAction}
                >
                  <Check size={14} className="mr-1" /> Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPendingAction(null);
                    setQueuedSuggestions(null);
                    setSuggestions(null);
                    setShowDraftPreview(false);
                  }}
                >
                  <X size={14} className="mr-1" /> Dismiss
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-700">
              {pendingAction?.tab && <p><strong>Tab:</strong> {pendingAction.tab.name}</p>}
              {pendingAction?.subtab && <p><strong>SubTab:</strong> {pendingAction.subtab.name}</p>}
              {pendingAction?.field && <p><strong>Field:</strong> {pendingAction.field.fieldName} ({pendingAction.field.fieldType})</p>}
            </div>
          </div>
        )}

        {suggestions && (
          <div className="border border-gray-200 p-3 rounded bg-gray-50">
            <p className="text-sm font-medium mb-2">You can also create:</p>
            {suggestions?.subtabs && (
              <div className="mb-2">
                <p className="text-xs text-gray-600">SubTabs:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestions?.subtabs.map((item: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
            )}
            {suggestions?.fields && (
              <div className="mb-2">
                <p className="text-xs text-gray-600">Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestions?.fields.map((item: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showDraftPreview && pendingAction && (
          <div className="border border-amber-300 p-3 rounded bg-amber-50">
            <p className="text-sm font-semibold mb-2">Draft Preview</p>
            <div className="rounded-xl border bg-white p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  {pendingAction?.tab?.name || pendingAction?.subtab?.tabName || pendingAction?.field?.tabName || "Draft Tab"}
                </p>
              </div>

              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-gray-700">
                  {pendingAction?.subtab?.documentNotes ||
                    pendingAction?.tab?.documentNotes ||
                    "Documentation for this rule group"}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    1
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-600 uppercase">
                        {pendingAction?.subtab?.name || "Rule Group"}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">Attribute</p>
                        <div className="px-2 py-1.5 border rounded bg-gray-50 text-xs text-gray-900">
                          {pendingAction?.field?.fieldName || "N/A"}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">Operator</p>
                        <div className="px-2 py-1.5 border rounded bg-gray-50 text-xs text-gray-900">
                          {pendingAction?.field?.operator || "N/A"}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">Value</p>
                        <div className="px-2 py-1.5 border rounded bg-gray-50 text-xs text-gray-900">
                          {pendingAction?.field?.thresholdValue || pendingAction?.field?.fieldValues || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border bg-gray-50 px-3 py-2">
                      <p className="text-xs font-medium text-gray-700">Field Rules</p>
                    </div>

                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Documentation</p>
                      <div className="rounded border bg-white px-3 py-2 text-sm text-gray-700">
                        {pendingAction?.field?.documentNotes || "No documentation added"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border-2 border-dashed text-center py-2 text-xs text-gray-500">
                + Add Rule
              </div>
            </div>

            {queuedSuggestions && (
              <div className="rounded border bg-white p-3">
                <p className="text-[11px] font-semibold text-gray-700 uppercase mb-2">Will be suggested after create</p>
                <div className="space-y-2">
                  {queuedSuggestions?.subtabs && (
                    <div className="flex flex-wrap gap-1">
                      {queuedSuggestions.subtabs.map((item: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  )}
                  {queuedSuggestions?.fields && (
                    <div className="flex flex-wrap gap-1">
                      {queuedSuggestions.fields.map((item: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {draftError && <p className="text-xs text-red-600 mt-2">{draftError}</p>}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={applyDraft}>Create</Button>
              <Button size="sm" variant="outline" onClick={() => setShowDraftPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to help build your policy... (Shift+Enter for new line)"
          className="min-h-[60px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} disabled={loading}>
          Send
        </Button>
      </div>
    </Card>
  );
}
