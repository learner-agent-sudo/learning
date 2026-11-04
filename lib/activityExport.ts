import { STRENGTH_LABEL, type Activity, type ActivityGroup, type ActivityKit, type Regime } from './banking';
import { plain, unlink } from './vendorExport';

export const GROUP_LABEL: Record<ActivityGroup, string> = {
  crypto: 'Virtual assets',
  stablecoins: 'Stablecoins',
  tokenisation: 'Tokenisation',
  wallets: 'Wallets & payments',
  lending: 'P2P & platform lending',
  web3: 'Web3 & DeFi',
  markets: 'Markets & execution',
  'listed-products': 'Listed products',
  'trading-services': 'Around the trade',
  'funds-bonds': 'Funds, bonds & structured products',
  advice: 'Advice & portfolios',
  'insurance-pensions': 'Insurance & MPF',
  'deposits-crossborder': 'Deposits & cross-boundary',
  'ins-models': 'Distribution models',
  'ins-setup': 'Setting up',
  'ins-general': 'General & protection',
  'ins-savings': 'Savings & investment-linked',
  'ins-journeys': 'Journeys & customers',
};

export const REGIME_LABEL: Record<Regime, string> = {
  'in-force': 'In force',
  transitional: 'In transition',
  proposed: 'Proposed',
  pilot: 'Pilot',
};

/** The shown activities as launch notes, with this browser's gate ticks. */
export function launchNotesMarkdown(
  acts: Activity[],
  kit: ActivityKit,
  ticks: Record<string, boolean[]>,
  date: string,
  title = 'Digital assets'
): string {
  const out: string[] = [`# ${title}: launch notes`, ''];
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
    out.push('### What the rules require', '', ...a.require.map((s) => `- ${unlink(s)}`), '');
    out.push('### Launch gates', '', ...a.gates.map((s, i) => `- [${done[i] ? 'x' : ' '}] ${unlink(s)}`), '');
    out.push('### Watch for', '', ...a.watchFor.map((s) => `- ${unlink(s)}`), '');
    out.push(
      'Sources: ' + a.sources.map((s) => `${s.label} ${s.ref} (${STRENGTH_LABEL[s.strength]})${s.url ? ` <${s.url}>` : ''}`).join('; '),
      ''
    );
  }
  return out.join('\n');
}
