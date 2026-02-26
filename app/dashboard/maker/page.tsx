"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function MakerPage() {
  const { data: policies } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data } = await api.get("/policy");
      return data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Policies</h1>
        <Link href="/dashboard/maker/create" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          Create Policy
        </Link>
      </div>
      <div className="grid gap-4">
        {policies?.map((policy: any) => (
          <Link key={policy.id} href={`/dashboard/maker/${policy.id}/build`} className="p-4 bg-white border rounded-lg hover:shadow">
            <h3 className="font-semibold">{policy.name}</h3>
            <p className="text-sm text-gray-500">{policy.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
