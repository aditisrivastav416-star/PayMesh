'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Agent, IssuedAgentKey } from '@paymesh/shared';
import { api } from '@/lib/api';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [issued, setIssued] = useState<IssuedAgentKey | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setAgents(await api.agents());
  }
  useEffect(() => {
    void refresh().catch((e: Error) => setError(e.message));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await api.createAgent(name, description);
      setName('');
      setDescription('');
    });
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Agents</h1>
        <p className="mt-2 text-slate-600">
          Register agents and manage API keys for payment requests.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      <form
        onSubmit={create}
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-5"
      >
        <h2 className="text-lg font-semibold">Register agent</h2>
        <label className="block text-sm font-medium">
          Name
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Description (optional)
          <textarea
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          Create agent
        </button>
      </form>
      {issued && (
        <div
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-5"
        >
          <h2 className="font-semibold">Copy this key now</h2>
          <p className="mt-1 text-sm">
            It will not be shown again. Store it in the agent environment.
          </p>
          <code className="mt-3 block break-all rounded bg-white p-3 text-sm">
            {issued.key}
          </code>
          <button
            onClick={() => setIssued(null)}
            className="mt-3 text-sm text-blue-700 underline"
          >
            I have saved it
          </button>
        </div>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Registered agents</h2>
        {agents.length === 0 && (
          <p className="text-slate-600">No agents yet.</p>
        )}
        {agents.map((agent) => (
          <article
            key={agent.id}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  {agent.name}{' '}
                  {!agent.active && (
                    <span className="text-sm text-slate-500">(inactive)</span>
                  )}
                </h3>
                {agent.description && (
                  <p className="mt-1 text-sm text-slate-600">
                    {agent.description}
                  </p>
                )}
              </div>
              {agent.active && (
                <div className="flex gap-3">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        setIssued(await api.issueAgentKey(agent.id));
                      })
                    }
                    className="text-sm text-blue-700 disabled:opacity-50"
                  >
                    Create key
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Deactivate ${agent.name} and revoke its keys?`,
                        )
                      )
                        void run(() =>
                          api.deactivateAgent(agent.id).then(() => {
                            setIssued(null);
                          }),
                        );
                    }}
                    className="text-sm text-red-700 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
              )}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {agent.keys.map((key) => (
                <li
                  key={key.id}
                  className="flex justify-between gap-3 border-t border-slate-100 pt-2"
                >
                  <span>
                    Key {key.id.slice(0, 8)} · {key.scopes.join(', ')} ·{' '}
                    {key.revokedAt
                      ? 'Revoked'
                      : key.expiresAt && new Date(key.expiresAt) <= new Date()
                        ? 'Expired'
                        : 'Active'}
                  </span>
                  {agent.active && !key.revokedAt && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(() =>
                          api.revokeAgentKey(agent.id, key.id).then(() => {
                            if (issued?.id === key.id) setIssued(null);
                          }),
                        )
                      }
                      className="text-red-700 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
