import type { ConceptMetric } from './learning/types';
export type Block = { id: string; section_title: string; content: string; layer: 'high_yield' | 'extended'; ayah_range: string | null; source_book?: string; source_reference?: string | null };
export type Concept = { id: string; domain_id: string; primary_statement: string; high_yieldness: number; ayah_range?: string | null };
export type Option = { id: string; content: string; is_correct: boolean };
export type Question = { id: string; question_type: 'card' | 'mcq'; concept_id: string; source_excerpt_id: string; prompt: string; explanation_excerpt: string; high_yieldness: number; mcq_options: Option[] };
export type Metric = ConceptMetric & { next_review_at: string | null; interval_days?: number; streak?: number; ease_factor?: number };
export type Curriculum = { blocks: Block[]; concepts: Concept[]; domains: { id: string; name: string }[]; questions: Question[]; metrics: Record<string, Metric> };
