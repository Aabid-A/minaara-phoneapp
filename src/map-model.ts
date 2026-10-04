import type { Curriculum } from './types';
export type MapItem = { id: string; label: string; kind: 'surah' | 'concept' | 'domain'; x: number; y: number; conceptId?: string };
export function buildMap(data: Curriculum) {
  const concepts = data.concepts.slice(0, 3);
  const domain = data.domains.find(d => d.id === concepts[0]?.domain_id);
  const items: MapItem[] = [{ id: 'surah-1', label: 'Al-Fatihah', kind: 'surah', x: 170, y: 58 }];
  const positions = [[56, 184], [176, 252], [280, 156]];
  const aliases: Record<string, string> = {
    'The Core Dynamic of Al-Fatihah': 'Core dynamic',
    'The Dual Nature of Divine Mercy': 'Divine mercy',
    'The Path of Realized Models': 'Realized models',
  };
  concepts.forEach((c, i) => {
    const q = data.questions.find(q => q.concept_id === c.id);
    const block = data.blocks.find(b => b.id === q?.source_excerpt_id);
    items.push({ id: c.id, conceptId: c.id, label: block ? aliases[block.section_title] ?? `Concept ${i + 1}` : `Concept ${i + 1}`, kind: 'concept', x: positions[i][0], y: positions[i][1] });
  });
  if (domain) items.push({ id: domain.id, label: domain.name, kind: 'domain', x: 125, y: 365 });
  const routes = [
    { outward: 'M170 58 C110 48 20 94 56 184', returning: 'M56 184 C22 276 88 298 125 365' },
    { outward: 'M170 58 C229 126 114 176 176 252', returning: 'M176 252 C212 309 136 307 125 365' },
    { outward: 'M170 58 C252 36 332 100 280 156', returning: 'M280 156 C226 220 272 317 125 365' },
  ];
  const edges = concepts.flatMap((c, i) => {
    return [
      { from: 'surah-1', to: c.id, relation: 'belongs to surah', path: routes[i].outward },
      ...(domain && c.domain_id === domain.id ? [{ from: c.id, to: domain.id, relation: 'belongs to domain', path: routes[i].returning }] : []),
    ];
  });
  return { items, edges, hiddenConcepts: Math.max(0, data.concepts.length - concepts.length) };
}
