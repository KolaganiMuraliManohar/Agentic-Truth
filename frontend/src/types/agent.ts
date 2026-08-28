/**
 * Agentic-Truth Types & Schemas
 * 3-Agent Adversarial LangGraph Architecture:
 * - True Agent (Advocate / Affirmative Search)
 * - False Agent (Prosecutor / Debunk Search)
 * - Judge Agent (Decider / Synthesis with Borrowed Reasoning)
 */

export type Verdict = 'LIKELY_FAKE' | 'LIKELY_REAL' | 'UNCERTAIN';
export type Severity = 'low' | 'medium' | 'high';
export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Evidence {
  type: string;
  description: string;
  confidence: number;
  severity: Severity;
  source_url?: string;
  proof_quote?: string;
  advocacy_side?: 'true' | 'false' | 'neutral';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface TextAnalysisResult {
  claims: string[];
  fact_check_score: number;
  sentiment: string;
  source_credibility: number;
  evidence: Evidence[];
  ifai_style?: string;
  ifai_content?: string;
  ifai_consistency?: string;
}

export interface MediaAnalysisResult {
  deepfake_score: number;
  biological_signals_score: number;
  physical_consistency_score: number;
  metadata_score: number;
  temporal_score?: number;
  metadata_authenticity_score?: number;
  cross_modal_risk?: number;
  extracted_text?: string;
  suspicious_regions: BoundingBox[];
  evidence: Evidence[];
  metadata_details?: {
    camera_make?: string;
    camera_model?: string;
    software?: string;
    color_space?: string;
    has_exif: boolean;
    is_ai_generated_indicator?: boolean;
  };
}

export interface GraphAnalysisResult {
  propagation_score: number;
  bot_probability: number;
  coordinated_campaign: boolean;
  network_size: number;
  evidence: Evidence[];
}

export interface DetectionResult {
  verdict: Verdict;
  confidence: number;
  uncertainty: number;
  text_score?: number;
  media_score?: number;
  graph_score?: number;
  text_analysis?: TextAnalysisResult;
  media_analysis?: MediaAnalysisResult;
  graph_analysis?: GraphAnalysisResult;
  evidence: Evidence[];
  suspicious_regions?: BoundingBox[];
  human_review_needed: boolean;
  recommendation: string;
  execution_trace?: AgentExecutionTrace;
}

export interface AgentNodeState {
  id: string;
  name: string;
  roleDescription: string;
  status: NodeStatus;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  outputSummary?: string;
  details?: Record<string, any>;
}

export interface AgentThought {
  agentName: string;
  agentRole: 'TrueAgent' | 'FalseAgent' | 'JudgeAgent' | 'Forensic';
  timestamp: number;
  thought: string;
  confidence?: number;
  level?: 'info' | 'warn' | 'success' | 'danger';
}

export interface AgentExecutionTrace {
  pipeline: string;
  totalDurationMs: number;
  nodes: AgentNodeState[];
  thoughts: AgentThought[];
  trueAgentCase?: {
    verdictHypothesis: 'TRUE';
    searchStrategy: string;
    supportingEvidence: string[];
    credibilityScore: number;
    argument: string;
    hasProof?: boolean;
    proofUrl?: string;
  };
  falseAgentCase?: {
    verdictHypothesis: 'FALSE';
    searchStrategy: string;
    refutingEvidence: string[];
    deceptionScore: number;
    argument: string;
    hasProof?: boolean;
    proofUrl?: string;
  };
  judgeSynthesis?: {
    decision: Verdict;
    borrowedRationale: string;
    whyWon: string;
    confidence: number;
  };
}

export interface ApiSettings {
  provider: 'auto' | 'groq' | 'gemini' | 'openai';
  groqApiKey?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  tavilyApiKey?: string;
  modelName?: string;
}
