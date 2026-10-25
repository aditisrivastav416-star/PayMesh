export default function Home() {
  return (
    <main>
      <p className="eyebrow">PayMesh</p>
      <h1>Payment authorization for AI agents</h1>
      <p>Agents can request purchases. Owners set the rules. PayMesh enforces the decision before checkout.</p>
      <section aria-label="Upcoming dashboard areas">
        <h2>Owner dashboard</h2>
        <ul>
          <li>Agents and spending policies</li>
          <li>Approval queue</li>
          <li>Payment history and audit trail</li>
        </ul>
      </section>
      <p className="note">Project skeleton · Payment actions are not enabled yet.</p>
    </main>
  );
}
