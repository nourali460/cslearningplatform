"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /admin to /admin/overview
    router.replace("/admin/overview");
  }, [router]);

  return null;
}
