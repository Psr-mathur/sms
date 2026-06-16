import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Lock, User, KeyRound, AlertCircle, Settings, X, Server } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [backendUrl, setBackendUrl] = useState("");

  useEffect(() => {
    setBackendUrl(localStorage.getItem("backend_base_url") || "");
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError(null);
    setSubmitting(true);
    const success = await login(username.trim(), password.trim());
    if (!success) {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] p-4 select-none text-foreground">
      <div className="w-full max-w-md bg-card border border-card-border rounded-2xl p-8 shadow-xl animate-in fade-in zoom-in duration-300 relative">
        
        {/* Settings Icon */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Server Settings"
          type="button"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-bounce duration-1000">
            <KeyRound className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Stock Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-sm animate-in shake duration-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Username</label>
            <div className="relative group">
              <span className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Password</label>
            <div className="relative group">
              <span className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/70">
            For access, please use your system credentials.
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-card-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-foreground">API Settings</h2>
              </div>
              <button 
                onClick={() => {
                  setShowSettings(false);
                  setBackendUrl(localStorage.getItem("backend_base_url") || "");
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configure a custom backend API base URL. Leave empty to use the default same-origin address.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Backend Base URL</label>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="e.g. http://localhost:5001"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setBackendUrl(localStorage.getItem("backend_base_url") || "");
                  }}
                  className="flex-1 py-2.5 border border-border text-foreground font-semibold rounded-xl hover:bg-muted/50 transition-colors text-sm"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const trimmed = backendUrl.trim();
                    if (trimmed) {
                      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
                        toast.error("URL must start with http:// or https://");
                        return;
                      }
                      localStorage.setItem("backend_base_url", trimmed);
                      toast.success("Backend URL saved successfully");
                    } else {
                      localStorage.removeItem("backend_base_url");
                      toast.success("Reset to default same-origin API");
                    }
                    setShowSettings(false);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:opacity-95 transition-all text-sm"
                  type="button"
                >
                  Save Settings
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
