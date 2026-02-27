"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Plus, History } from "lucide-react";
import Link from "next/link";
import GenerateAIDoc from "@/components/policy-builder/GenerateAIDoc";
import DownloadPolicyDoc from "@/components/policy-builder/DownloadPolicyDoc";
import PolicyQueryEngine from "@/components/policy-builder/PolicyQueryEngine";
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

  const role = String(user?.role || "").toUpperCase();
  const isPolicyAdmin = role === "ADMIN";
  const canEditPolicy = role === "MAKER";

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
      const res = await fetch(`/api/policy/${policyId}/comments?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setComments(data?.data || []);
    } catch {
      setComments([]);
    }
  };

  const addComment = async () => {
    if (!params?.id || !newComment.trim() || isSubmittingComment || !isPolicyAdmin) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/policy/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to add comment");
        return;
      }
      setNewComment("");
      await loadComments(String(params.id));
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
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
      fetch(`/api/policy/${params.id}?_t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setPolicy(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
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
            <DownloadPolicyDoc policyId={policy.id} policyName={policy.name} />
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

        <div className="bg-white rounded-xl border shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Policy Flow</h2>

          <div className="flex flex-col items-center space-y-6">
            <button className="px-6 py-3 bg-gray-900 text-white rounded-full font-semibold">START</button>

            {policy.tabs?.map((tab: any) => (
              <div key={tab.id} className="w-full max-w-4xl">
                <div className="flex justify-center mb-4">
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase mb-4">{tab.name}</h3>

                  {(tab.subTabs || tab.subtabs || [])?.map((subTab: any, subTabIndex: number) => (
                    <div key={subTab.id} className="mb-4 last:mb-0">
                      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                        <div className="space-y-3">
                          {(subTab.fields || subTab.subFields || subTab.subfields || [])?.map((field: any, fieldIndex: number) => (
                            <div key={field.id}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                  {fieldIndex + 1}
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-lg p-3 border">
                                  <div className="flex items-center gap-4">
                                    <span className="font-semibold text-gray-900">{field.fieldName}</span>
                                    <span className="text-gray-500">{field.operator || "="}</span>
                                    <span className="font-semibold text-blue-600">{getFieldValue(field)}</span>
                                  </div>
                                </div>
                              </div>
                              {fieldIndex < ((subTab.fields || subTab.subFields || subTab.subfields || [])?.length || 0) - 1 && (
                                <div className="flex justify-center py-2">
                                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded">AND</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {subTabIndex < ((tab.subTabs || tab.subtabs || [])?.length || 0) - 1 && (
                        <div className="flex justify-center py-3">
                          <span className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded">AND</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {(!policy.tabs || policy.tabs.length === 0) && canEditPolicy && (
              <div className="text-center py-16 border-2 border-dashed rounded-lg bg-gray-50 w-full">
                <p className="text-gray-400 text-sm mb-4">No policy rules defined yet</p>
                <Link href={`/dashboard/maker/${params?.id}/build`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={16} />
                  Add Rules
                </Link>
              </div>
            )}

            {canEditPolicy && (
              <button onClick={goToLogicBuilder} className="px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-2">
                <Plus size={16} />
                Add New Logic Block
              </button>
            )}
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
