"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/dashboard/maker/${params.id}`);
    }
  }, [params?.id, router]);

  return <div className="p-8">Redirecting...</div>;
}
