'use client';

import type { ReactNode } from 'react';
import { Landmark } from 'lucide-react';
import { swExtract, type HongKongBlock } from '@/lib/softwareIp';
import { SW_HK, swHkPrefix } from '@/lib/softwareIpOutline';
import { provisionUnitId } from '@/lib/swUnits';
import { RichText } from '../RichText';
import { KeyPoints, SectionedPoints, SectionTitle } from '../ui/Bullets';
import { DraftNotice } from '../ui/DraftNotice';
import { NoteCard } from '../ui/NoteCard';
import { ProvisionList } from '../ui/ProvisionList';

interface Props {
  stageId: string;
  idBase: string;
  hk: HongKongBlock;
  // Questions to show above a block when "questions while reading" is on.
  askFor: (unit: string) => ReactNode;
}

/** A stage's subject under Hong Kong law: short version, sections, ordinance cards, bank notes. */
export function HongKongTab({ stageId, idBase, hk, askFor }: Props) {
  const prefix = swHkPrefix(stageId);
  const keyId = `${idBase}-${SW_HK.key.key}`;
  return (
    <>
      {hk.review === 'draft' && <DraftNotice what="Hong Kong case citations and HKMA and PCPD guidance references" />}
      <div className="mb-6 rounded-xl border border-line bg-panel px-4 py-3.5 text-[15px] leading-relaxed text-ink/85">
        <RichText text={hk.summary} />
      </div>
      {askFor(keyId)}
      <KeyPoints id={keyId} title={SW_HK.key.label} points={hk.keyPoints} />
      <div className="mt-10">
        <SectionTitle>In depth · Hong Kong law</SectionTitle>
        <SectionedPoints sections={hk.sections} idPrefix={prefix} before={(i) => askFor(`${prefix}-s${i + 1}`)} />
      </div>
      {hk.provisions.length > 0 && (
        <section id={`${idBase}-${SW_HK.provisions.key}`} className="mt-10 scroll-mt-28">
          <SectionTitle>{SW_HK.provisions.label}</SectionTitle>
          <ProvisionList
            provisions={hk.provisions}
            lookup={swExtract}
            idOf={(p) => provisionUnitId(stageId, p)}
            note="Ordinance cards include the current text from Hong Kong e-Legislation (Department of Justice), which is not a verified copy; cases and guidance are summarised in our own words."
          />
        </section>
      )}
      {hk.bankNotes.length > 0 && (
        <div className="mt-10">
          <NoteCard
            id={`${idBase}-${SW_HK.bank.key}`}
            title={SW_HK.bank.label}
            subtitle="What the HKMA, the PCPD and a Hong Kong bank's own risks add"
            icon={Landmark}
            tone="violet"
            items={hk.bankNotes}
          />
        </div>
      )}
    </>
  );
}
