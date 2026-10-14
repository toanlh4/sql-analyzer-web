// Types for colibri-manifest.json, produced by dbt-colibri's report generator.

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type NodeType = 'model' | 'source' | 'seed' | 'snapshot' | 'exposure' | 'hardcoded' | 'not_found' | 'unknown' | string;
export type ModelType = 'dimension' | 'fact' | 'intermediate' | 'staging' | 'unknown';
export type LineageType = 'pass-through' | 'rename' | 'transformation' | 'unknown' | string;
export type StructuralEdgeType = 'filter' | 'join';

export interface ColibriTest {
  unique_id?: string | null;
  name?: string | null;
  namespace?: string | null;
  config?: {
    severity?: string | null;
    warn_if?: string | null;
    error_if?: string | null;
  };
  kwargs?: Record<string, JsonValue>;
  compiled_code?: string | null;
  depends_on_nodes?: string[];
}

export interface ColibriColumn {
  columnName: string;
  hasLineage: boolean;
  dataType?: string | null;
  contractType?: string | null;
  description?: string | null;
  tags?: string[];
  quote?: boolean;
  lineageType?: LineageType;
  tests?: ColibriTest[];
  meta?: Record<string, JsonValue>;
}

export interface ExposureOwner {
  email?: string | null;
  name?: string | null;
}

export interface ExposureMetadata {
  type?: string | null;
  owner?: ExposureOwner | null;
  label?: string | null;
  maturity?: string | null;
  url?: string | null;
  package_name?: string | null;
  fqn?: string[] | null;
  tags?: string[] | null;
  created_at?: number | null;
}

export interface ColibriNode {
  id: string;
  name: string;
  fullName: string;
  nodeType: NodeType;
  materialized: string | null;
  modelType: ModelType;
  database: string | null;
  schema: string | null;
  path: string | null;
  description: string | null;
  contractEnforced: boolean | null;
  rawCode: string | null;
  compiledCode?: string | null;
  refs: JsonValue[];
  tags: string[];
  columns: Record<string, ColibriColumn>;
  relationName: string | null;
  catalogMissing?: boolean;
  tests?: ColibriTest[];
  exposure_metadata?: ExposureMetadata;
  meta?: Record<string, JsonValue>;
}

export interface ColibriEdge {
  id: number;
  source: string;
  target: string;
  /** Empty string for model-level edges. */
  sourceColumn: string;
  /** Empty string for model-level and structural (filter/join) edges. */
  targetColumn: string;
  edgeType?: StructuralEdgeType;
}

export interface ColibriMetadata {
  colibri_version?: string;
  generated_at?: string;
  adapter_type?: string | null;
  dbt_version?: string | null;
  dbt_schema_version?: string | null;
  dbt_invocation_id?: string | null;
  dbt_project_name?: string;
  dbt_project_id?: string;
  total_model_count?: number;
  unmaterialized_model_count?: number;
}

/** Folder in the path tree: child folders by name, plus node ids under `__items__`. */
export interface PathTreeFolder {
  __items__?: string[];
  [folder: string]: PathTreeFolder | string[] | undefined;
}

export interface ColibriTree {
  byDatabase: Record<string, Record<string, string[]>>;
  byPath: Record<string, PathTreeFolder>;
}

export interface ColibriManifest {
  metadata: ColibriMetadata;
  nodes: Record<string, ColibriNode>;
  lineage: { edges: ColibriEdge[] };
  tree: ColibriTree;
}
