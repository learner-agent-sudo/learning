import { STRENGTH_LABEL, type Activity, type ActivityGroup, type ActivityKit, type Regime } from './banking';
import { plain } from './vendorExport';

export const GROUP_LABEL: Record<ActivityGroup, string> = {
  crypto: 'Virtual assets',
  stablecoins: 'Stablecoins',
  tokenisation: 'Tokenisation',
  wallets: 'Wallets & payments',
  lending: 'P2P & platform lending',
  web3: 'Web3 & DeFi',
};

export const REGIME_LABEL: Record<Regime, string> = {
  'in-force': 'In force',
  transitional: 'Transitional',
  proposed: 'Proposed',
  pilot: 'Pilot',
};

/** The shown activities as launch notes, with this browser's gate ticks. */
export function launchNotesMarkdown(
  acts: Activity[],
  kit: ActivityKit,
  ticks: Record<string, boolean[]>,
  date: string
): string {
  const out: string[] = ['# Digital assets: launch notes', ''];
  out.push(`Exported ${date}. Study material, not legal advice.`, '');
  if (kit.caveat) out.push(plain(kit.caveat), '');
  for (const a of acts) {
    const done = ticks[a.id] ?? [];
    out.push(`## ${a.title}`, '');
    out.push(
      `${GROUP_LABEL[a.group]} · ${REGIME_LABEL[a.regime]} · ${a.regulators.join(', ')} · ` +
        `gates confirmed ${done.filter(Boolean).length}/${a.gates.length}`,
      ''
    );
    out.push(plain(a.summary), '', `**Can the bank do it?** ${plain(a.route)}`, '');
    out.push('### What the rules require', '', ...a.require.map((s) => `- ${s}`), '');
    out.push('### Launch gates', '', ...a.gates.map((s, i) => `- [${done[i] ? 'x' : ' '}] ${s}`), '');
    out.push('### Watch for', '', ...a.watchFor.map((s) => `- ${s}`), '');
    out.push(
      'Sources: ' + a.sources.map((s) => `${s.label} ${s.ref} (${STRENGTH_LABEL[s.strength]})${s.url ? ` <${s.url}>` : ''}`).join('; '),
      ''
    );
  }
  return out.join('\n');
}
