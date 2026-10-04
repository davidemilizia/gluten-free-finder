"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type UserRow = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  displayName: string;
  role: string;
  accountStatus: "pending" | "active" | "suspended" | "rejected";
  reviewCount: number;
  marketingConsent: boolean;
};

type Filter = "all" | "pending" | "active" | "suspended" | "rejected" | "admin";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage("Sessione non disponibile.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Impossibile caricare gli utenti.");
      setLoading(false);
      return;
    }
    setUsers(result.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesText = !term || user.displayName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "admin" ? user.role === "admin" : user.accountStatus === filter);
      return matchesText && matchesFilter;
    });
  }, [users, search, filter]);

  const counts = useMemo(() => ({
    pending: users.filter((u) => u.accountStatus === "pending").length,
    active: users.filter((u) => u.accountStatus === "active").length,
    suspended: users.filter((u) => u.accountStatus === "suspended").length,
    rejected: users.filter((u) => u.accountStatus === "rejected").length,
    admin: users.filter((u) => u.role === "admin").length,
  }), [users]);

  async function act(user: UserRow, action: string, label: string) {
    if (!window.confirm(`${label} l'account di ${user.displayName}?`)) return;
    setBusyId(user.id);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage("Sessione non disponibile.");
      setBusyId(null);
      return;
    }

    const response = await fetch("/api/admin/users/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: user.id, action }),
    });
    const result = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setMessage(result.error || "Operazione non riuscita.");
      return;
    }
    setMessage(`Operazione completata per ${user.displayName}.`);
    await load();
  }

  return (
    <main style={pageStyle}>
      <h1>Gestione iscritti</h1>
      <p>Approva gli account, sospendi gli utenti e gestisci i ruoli amministrativi.</p>

      <section style={statsStyle}>
        <Stat label="In attesa" value={counts.pending} />
        <Stat label="Attivi" value={counts.active} />
        <Stat label="Sospesi" value={counts.suspended} />
        <Stat label="Rifiutati" value={counts.rejected} />
        <Stat label="Admin" value={counts.admin} />
      </section>

      <section style={filtersStyle}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca nickname o email"
          style={inputStyle}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} style={inputStyle}>
          <option value="all">Tutti</option>
          <option value="pending">In attesa</option>
          <option value="active">Attivi</option>
          <option value="suspended">Sospesi</option>
          <option value="rejected">Rifiutati</option>
          <option value="admin">Amministratori</option>
        </select>
        <button onClick={() => void load()} disabled={loading || busyId !== null} style={secondaryButton}>
          Aggiorna
        </button>
      </section>

      {message && <div style={messageStyle}>{message}</div>}
      {loading && <p>Caricamento iscritti...</p>}

      <section style={{ display: "grid", gap: 14, marginTop: 20 }}>
        {filtered.map((user) => (
          <article key={user.id} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>{user.displayName}</h2>
                <p style={{ margin: "5px 0" }}>{user.email}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge text={statusLabel(user.accountStatus)} color={statusColor(user.accountStatus)} />
                <Badge text={user.role === "admin" ? "Amministratore" : "Utente"} color={user.role === "admin" ? "#14532d" : "#334155"} />
              </div>
            </div>

            <div style={detailsStyle}>
              <span>Email confermata: <strong>{user.emailConfirmed ? "Sì" : "No"}</strong></span>
              <span>Registrato: <strong>{formatDate(user.createdAt)}</strong></span>
              <span>Ultimo accesso: <strong>{user.lastSignInAt ? formatDate(user.lastSignInAt) : "Mai"}</strong></span>
              <span>Recensioni: <strong>{user.reviewCount}</strong></span>
              <span>Marketing: <strong>{user.marketingConsent ? "Sì" : "No"}</strong></span>
            </div>

            <div style={actionsStyle}>
              {user.accountStatus === "pending" && (
                <>
                  <button onClick={() => void act(user, "approve", "Approvare")} disabled={busyId !== null} style={approveButton}>✓ Approva</button>
                  <button onClick={() => void act(user, "reject", "Rifiutare")} disabled={busyId !== null} style={dangerButton}>✕ Rifiuta</button>
                </>
              )}
              {user.accountStatus === "active" && (
                <button onClick={() => void act(user, "suspend", "Sospendere")} disabled={busyId !== null} style={warningButton}>Sospendi</button>
              )}
              {(user.accountStatus === "suspended" || user.accountStatus === "rejected") && (
                <button onClick={() => void act(user, "reactivate", "Riattivare")} disabled={busyId !== null} style={approveButton}>Riattiva</button>
              )}
              {user.role !== "admin" ? (
                <button onClick={() => void act(user, "promote", "Promuovere ad amministratore")} disabled={busyId !== null} style={adminButton}>Promuovi ad Admin</button>
              ) : (
                <button onClick={() => void act(user, "demote", "Revocare il ruolo amministratore a")} disabled={busyId !== null} style={secondaryButton}>Revoca ruolo Admin</button>
              )}
            </div>
          </article>
        ))}
      </section>

      {!loading && filtered.length === 0 && <p>Nessun iscritto corrisponde ai filtri.</p>}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div style={statCardStyle}><strong style={{ fontSize: 24 }}>{value}</strong><span>{label}</span></div>;
}
function Badge({ text, color }: { text: string; color: string }) {
  return <span style={{ padding: "5px 9px", borderRadius: 999, background: "#f1f5f9", color, fontWeight: 700, fontSize: 13 }}>{text}</span>;
}
function statusLabel(status: UserRow["accountStatus"]) {
  return { pending: "In attesa", active: "Attivo", suspended: "Sospeso", rejected: "Rifiutato" }[status];
}
function statusColor(status: UserRow["accountStatus"]) {
  return { pending: "#854d0e", active: "#166534", suspended: "#9a3412", rejected: "#991b1b" }[status];
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("it-IT");
}

const pageStyle = { maxWidth: 1100, margin: "0 auto", padding: "30px 18px 60px" };
const statsStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, margin: "22px 0" };
const statCardStyle = { padding: 15, border: "1px solid #dbe3ea", borderRadius: 10, display: "grid", gap: 4, background: "#fff" };
const filtersStyle = { display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(170px,240px) auto", gap: 10, alignItems: "center" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: 10, border: "1px solid #94a3b8", borderRadius: 7 };
const cardStyle = { padding: 18, border: "1px solid #dbe3ea", borderRadius: 12, background: "#fff", boxShadow: "0 2px 10px rgba(15,23,42,.05)" };
const cardHeaderStyle = { display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" as const };
const detailsStyle = { display: "flex", gap: 18, flexWrap: "wrap" as const, margin: "15px 0", color: "#475569", fontSize: 14 };
const actionsStyle = { display: "flex", gap: 9, flexWrap: "wrap" as const };
const messageStyle = { margin: "16px 0", padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc" };
const approveButton = { padding: "9px 13px", border: 0, borderRadius: 7, background: "#15803d", color: "#fff", fontWeight: 700, cursor: "pointer" } as const;
const dangerButton = { padding: "9px 13px", border: "1px solid #dc2626", borderRadius: 7, background: "#fff", color: "#b91c1c", fontWeight: 700, cursor: "pointer" } as const;
const warningButton = { padding: "9px 13px", border: 0, borderRadius: 7, background: "#c2410c", color: "#fff", fontWeight: 700, cursor: "pointer" } as const;
const adminButton = { padding: "9px 13px", border: 0, borderRadius: 7, background: "#1d4ed8", color: "#fff", fontWeight: 700, cursor: "pointer" } as const;
const secondaryButton = { padding: "9px 13px", border: "1px solid #94a3b8", borderRadius: 7, background: "#fff", color: "#334155", fontWeight: 700, cursor: "pointer" } as const;
