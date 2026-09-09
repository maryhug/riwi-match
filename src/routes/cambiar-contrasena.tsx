import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { changeInitialPassword, getSession } from "@/lib/api/auth.functions";
import { useAuth } from "@/lib/auth-context";
import curvaMatchLogo from "@/assets/CurvaMatch.svg";

export const Route = createFileRoute("/cambiar-contrasena")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session.isAuthenticated) {
      throw redirect({ to: "/" });
    }
    if (!session.user?.password_change_required) {
      throw redirect({ to: "/app" });
    }
  },
  component: ChangeInitialPassword,
});

function ChangeInitialPassword() {
  const navigate = useNavigate();
  const { completeInitialPasswordChange } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const result = await changeInitialPassword({ data: { newPassword } });
    setLoading(false);
    if ("error" in result) {
      setError(result.error ?? "No se pudo actualizar la contraseña.");
      return;
    }
    completeInitialPasswordChange();
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-background/85 p-6 shadow-lg"
      >
        <img src={curvaMatchLogo} alt="Match" className="mx-auto w-48" />
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Actualiza tu contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Por seguridad, debes definir una contraseña personal antes de continuar.
          </p>
        </div>
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <label className="block text-sm font-medium">
          Nueva contraseña
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Confirmar contraseña
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Actualizando…" : "Guardar y continuar"}
        </button>
      </form>
    </div>
  );
}
