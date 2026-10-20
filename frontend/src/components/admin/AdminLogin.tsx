import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { loginAdmin, type AdminUser } from "@/api/admin";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackHome: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackHome }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loginAdmin({
        username: username.trim(),
        password,
      });
      onLoginSuccess(response.user);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-background p-4 sm:p-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackHome}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Home</span>
        </Button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="border-border/60 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex items-center justify-center mb-3">
              <FotokitaLogo variant="mark" size="xl" className="shadow-xs rounded-xl" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Fotokita Admin
              </CardTitle>
            </div>

            <CardDescription className="text-sm">
              Please enter your username & password to access the control panel
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">
              {errorMessage && (
                <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-username"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <User className="size-3.5 text-muted-foreground" />
                  <span>Username</span>
                </label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <Lock className="size-3.5 text-muted-foreground" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Super Admin Sign In
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Fotokita Security Control Panel &bull; Restricted Administrator Access
        </p>
      </div>
    </div>
  );
}
