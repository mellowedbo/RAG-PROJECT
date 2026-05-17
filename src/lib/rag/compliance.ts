/**
 * RAG Pipeline - Compliance Scanner (re-export)
 *
 * All compliance scanning logic is consolidated in @/lib/compliance.
 * This module re-exports the shared scanner for use by the RAG pipeline.
 */

export { COMPLIANCE_PATTERNS, scanForCompliance, type ComplianceChunkInput } from '@/lib/compliance';
export type { ComplianceFinding } from '@/types';
