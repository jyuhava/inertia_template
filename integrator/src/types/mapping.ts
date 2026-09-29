import type { DataStatus, EntityKey, MappingStatus } from './integration';

export interface MappingRecord {
    entity: EntityKey;
    localId: string;
    localCode: string;
    localLabel: string;
    localMeta: Record<string, string | number | null>;
    externalId: string | null;
    externalCode: string | null;
    externalLabel: string | null;
    mappingType: 'by-code' | 'by-name' | 'by-identity' | 'manual' | null;
    status: MappingStatus;
    confidence: number | null;
    lastSyncedAt: string | null;
    lastMessage: string | null;
}

export interface MappingCandidate {
    externalId: string;
    externalCode: string | null;
    label: string;
    score: number;
    reason: string;
}

export interface MappingStats {
    entity: EntityKey;
    label: string;
    total: number;
    mapped: number;
    unmapped: number;
    conflict: number;
    invalid: number;
    progress: number;
    required: boolean;
}

export interface AutoMapResult {
    entity: EntityKey;
    matched: number;
    skipped: number;
    conflicts: number;
    details: {
        localId: string;
        localLabel: string;
        externalId: string | null;
        externalLabel: string | null;
        status: MappingStatus;
        reason: string;
    }[];
}

export interface BulkMappingRequest {
    entity: EntityKey;
    items: { localId: string; externalId: string; mappingType: MappingRecord['mappingType'] }[];
}

export interface MappingStatusDescriptor {
    status: MappingStatus | DataStatus;
    label: string;
    tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
    description: string;
}
