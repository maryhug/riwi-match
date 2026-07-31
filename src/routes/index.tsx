import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import curvaMatchLogo from "@/assets/CurvaMatch.svg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RIWI MATCH — Iniciar sesión" },
      { name: "description", content: "Plataforma interna de reclutamiento con IA de Riwi." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoEntrance, setShowLogoEntrance] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShowLogoEntrance(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate({ to: "/app" });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden w-full">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-info/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-success/20 blur-3xl" />
      </div>

      {/* Form */}
      <div className="relative z-10 flex items-center justify-center p-8 w-full">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="mx-auto mb-10 block w-full max-w-[17rem]" aria-label="Match">
            <img
              src={curvaMatchLogo}
              alt="Match"
              className={showLogoEntrance ? "login-logo-entrance h-auto w-full" : "h-auto w-full"}
            />
          </Link>

          <form onSubmit={handleSubmit} className="mt-8 glass rounded-2xl p-6 space-y-4 text-left">
            <h1 className="text-center text-2xl font-bold tracking-tight">Bienvenido de vuelta</h1>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-background/70 px-3 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                <span className="block">¿Olvidaste tu contraseña?</span>
                <span className="block">Contacta a un administrador para restablecerla.</span>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mx-auto block w-60 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
