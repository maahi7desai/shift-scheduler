import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Store, User, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function RoleSelection() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async (role) => {
    setError("");
    setLoading(true);
    try {
      await base44.functions.invoke('setUserRole', { role });
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={User}
      title="Choose your role"
      subtitle="Are you an owner or an employee?"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="space-y-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleRoleSelection("admin")}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-accent transition-colors text-left disabled:opacity-50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">I'm an Owner</div>
            <div className="text-xs text-muted-foreground">Create stores, manage shifts and team</div>
          </div>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleRoleSelection("user")}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-accent transition-colors text-left disabled:opacity-50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">I'm an Employee</div>
            <div className="text-xs text-muted-foreground">View your schedule and request shift swaps</div>
          </div>
        </button>
      </div>
      {loading && (
        <div className="flex justify-center mt-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </AuthLayout>
  );
}