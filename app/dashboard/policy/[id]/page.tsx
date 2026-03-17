"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Plus, History } from "lucide-react";
import Link from "next/link";
import GenerateAIDoc from "@/components/policy-builder/GenerateAIDoc";
import DownloadPolicyDoc from "@/components/policy-builder/DownloadPolicyDoc";
import PolicyQueryEngine from "@/components/policy-builder/PolicyQueryEngine";
import LivePolicyDraft from "@/components/policy-builder/LivePolicyDraft";
import AnalysisButton from "@/components/policy-builder/AnalysisButton";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTabs } from "@/hooks/useHierarchy";
import type { Tab } from "@/types";

type PolicyComment = {
  id: string;
  comment_text: string;
  commenter_name?: string;
  created_at: string;
};

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [comments, setComments] = useState<PolicyComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDraftPanelOpen, setIsDraftPanelOpen] = useState(false);

  const role = String(user?.role || "").toUpperCase();
  const isPolicyAdmin = role === "ADMIN";
  const canEditPolicy = role === "MAKER";
  const policyId = String(params?.id || "");

  const { data: tabsData = [] } = useTabs(policyId);
  const tabs = ((tabsData as Tab[])?.length ? (tabsData as Tab[]) : (policy?.tabs || [])) as Tab[];

  const getFieldValue = (field: any) => {
    if (field?.thresholdValue) return field.thresholdValue;
    if (field?.fieldValues) {
      try {
        const parsed = JSON.parse(field.fieldValues);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch {
        // Keep original string if not JSON.
      }
      return field.fieldValues;
    }
    return "N/A";
  };

  const loadComments = async (policyId: string) => {
    try {
      const { data } = await api.get(`/policy/${policyId}/comments?_t=${Date.now()}`);
      setComments(data?.data || []);
    } catch {
      setComments([]);
    }
  };

  const addComment = async () => {
    if (!params?.id || !newComment.trim() || isSubmittingComment || !isPolicyAdmin) return;
    setIsSubmittingComment(true);
    try {
      const { data } = await api.post(`/policy/${params.id}/comments`, { comment: newComment.trim() });
      if (!data?.id && data?.message) {
        toast.error(data?.message || "Failed to add comment");
        return;
      }
      setNewComment("");
      await loadComments(String(params.id));
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const deletePolicy = async () => {
    if (!params?.id || isDeleting) return;
    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting policy...");

    try {
      await api.delete(`/policy/${params.id}`);
      toast.success("Policy deleted successfully", { id: loadingToast });
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete policy", { id: loadingToast });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const goToLogicBuilder = () => {
    if (!params?.id) return;
    if (!canEditPolicy) {
      toast.error("Only MAKER can edit policy structure");
      return;
    }
    if (policy?.status === "PUBLISHED") {
      toast.error("Published policies cannot be modified");
      return;
    }
    router.push(`/dashboard/maker/${params.id}/build`);
  };

  useEffect(() => {
    if (params && params.id) {
      api.get(`/policy/${params.id}?_t=${Date.now()}`).then(({ data }) => {
        setPolicy(data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
      loadComments(String(params.id));
    }
  }, [params]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!policy) return <div className="p-8">Policy not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft size={20} className="mr-2" />
            Back to Policies
          </Button>
          <div className="flex gap-3">
            <GenerateAIDoc policyId={policy.id} policyName={policy.name} />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/policy/${params?.id}/versions`}>
                <History size={16} className="mr-2" />
                View Versions
              </Link>
            </Button>
            {canEditPolicy && (
              <Button asChild>
                <Link href={`/dashboard/maker/${params?.id}`}>
                  <Edit size={16} className="mr-2" />
                  Edit Policy
                </Link>
              </Button>
            )}
            {canEditPolicy && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <PolicyQueryEngine policyId={policy.id} />
        </div>

        {(isPolicyAdmin || comments.length > 0) && (
          <Card className="mb-6">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Policy Comments</h2>
                <span className="text-xs text-gray-500">{comments.length} comments</span>
              </div>

              {isPolicyAdmin && (
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full rounded-md border p-3 text-sm"
                    rows={3}
                    placeholder="Add policy oversight comment..."
                  />
                  <Button onClick={addComment} disabled={isSubmittingComment || !newComment.trim()}>
                    {isSubmittingComment ? "Posting..." : "Add Comment"}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border bg-gray-50 p-3">
                    <div className="text-sm text-gray-800">{comment.comment_text}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {comment.commenter_name || "ADMIN"} | {new Date(comment.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{policy.name}</h1>
                <p className="text-sm text-gray-500 mt-2">Policy ID: {policy.id}</p>
              </div>
              <Badge variant={policy.status === "PUBLISHED" ? "default" : policy.status === "DRAFT" ? "secondary" : "outline"}>
                {policy.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Product Type</p>
                  <p className="text-lg font-semibold text-gray-900">{policy.product || "N/A"}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Version</p>
                  <p className="text-lg font-semibold text-gray-900">{policy.version || "v1.0"}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Modified</p>
                  <p className="text-lg font-semibold text-gray-900">{new Date(policy.updatedAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Policy Document</h2>
              <AnalysisButton 
                policyData={{
                  ...policy,
                  tabs: tabs
                }}
                policyId={policyId}
              />
            </div>
            <LivePolicyDraft
              policyId={policyId}
              tabs={tabs}
              policyName={policy?.name}
              policyDescription={policy?.description}
              policyProduct={policy?.product}
              policyVersion={policy?.version}
              policyStatus={policy?.status}
              policyStartDate={policy?.startDate || policy?.effectiveDate || policy?.createdAt}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this policy? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePolicy} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
