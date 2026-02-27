"use client";

import { useState, useRef, useEffect } from "react";
import { useApprovalQueue, useProcessApproval } from "@/hooks/useChecker";
import { Clock, Eye, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CheckerQueuePage() {
  const router = useRouter();
  const { data: queue = [], isLoading } = useApprovalQueue();
  const processApproval = useProcessApproval();
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDecision = (policyId: string, action: "APPROVE" | "REJECT") => {
    processApproval.mutate({
      policyId,
      action,
      notes,
    }, {
      onSuccess: () => {
        setSelectedPolicy(null);
        setNotes("");
      }
    });
  };

  // Helper function to find policy by id
  const getPolicyById = (id: string) => queue.find(q => q.id === id);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Review and process pending policy submissions</p>
        </div>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="flex items-center gap-2 p-3">
            <Clock size={16} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-900">{queue.length} Pending</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><Checkbox /></TableHead>
                <TableHead>Policy Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Current Level</TableHead>
                <TableHead>Time in Queue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
              ) : queue.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No policies pending approval</TableCell></TableRow>
              ) : (
                queue.map((item) => {
                  const timeInQueue = Math.floor((Date.now() - new Date(item.timeInQueue).getTime()) / (1000 * 60));
                  const hours = Math.floor(timeInQueue / 60);
                  const minutes = timeInQueue % 60;
                  const isUrgent = hours >= 2;

                  return (
                    <TableRow key={item.id}>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{item.policyEngine?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">ID: {item.policyEngineId?.slice(0, 12) || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          v{item.policyEngine?.version || "1.0"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                            {item.policyEngine?.maker?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.policyEngine?.maker?.name || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{item.policyEngine?.maker?.role || "Maker"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.currentLevel === "LEVEL_1_REVIEW" ? "default" :
                          item.currentLevel === "LEVEL_2_REVIEW" ? "outline" :
                          "secondary"
                        }>
                          {item.currentLevel === "LEVEL_1_REVIEW" ? "Risk Manager Review" :
                           item.currentLevel === "LEVEL_2_REVIEW" ? "Compliance Check" :
                           "Legal Review"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isUrgent && <span className="text-orange-500">⚠</span>}
                          <span className={isUrgent ? "text-orange-600 font-medium" : "text-gray-600"}>
                            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/policy/${item.policyEngineId}`)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <CheckCircle size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/policy/${item.policyEngineId}`)}>
                                <Eye size={14} className="mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedPolicy(item.id)} className="text-green-600">
                                <CheckCircle size={14} className="mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedPolicy(item.id)} className="text-red-600">
                                <XCircle size={14} className="mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPolicy && (
        <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Decision</DialogTitle>
              <DialogDescription>
                Add your review comments and approve or reject this policy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="notes">Review Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your review comments..."
                rows={4}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedPolicy(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDecision(getPolicyById(selectedPolicy)?.policyEngineId || "", "REJECT")}
                disabled={processApproval.isPending}
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleDecision(getPolicyById(selectedPolicy)?.policyEngineId || "", "APPROVE")}
                disabled={processApproval.isPending}
              >
                <CheckCircle size={16} className="mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
