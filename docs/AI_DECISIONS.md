# AI Boundaries & Responsibility Matrix (Global)

SkillBridge explicitly enforces a strict boundary between deterministic rule processing, vector embedding similarity, and LLM text generation to prevent hallucinations and maintain product trust.

## 1. Responsibility Assignment Matrix

| Task | Tool Assigned | Reasoning |
|---|---|---|
| Resume Interpretation & Extraction | **LLM (Structured JSON Output)** | Handles unstructured natural language formats, irregular bullet points, and varied resume layouts. |
| Candidate Skill Extraction | **LLM (Structured JSON Output)** | Extracts skills from text blocks, project descriptions, and experience bullet points. |
| Requirement Extraction (JD Parsing) | **LLM (Structured JSON Output)** | Parses raw opportunity descriptions into structured eligibility rules and skill lists. |
| **Hard Eligibility Checks** | **Rule Engine (Deterministic Code)** | **Zero LLM involvement.** Strict logic comparison (e.g. `UserExp >= MinExp`, `DeadlineCheck`). |
| **Semantic Skill Matching** | **Vector Embeddings + Code** | Computes cosine distance between candidate skill vectors and opportunity requirement vectors. |
| **Readiness Score Calculation** | **Mathematical Rules Engine** | Explicit weighted formula combining hard gate binary multiplier and soft semantic match percentages. |
| Opportunity Prioritization | **Rules Engine (Sorting)** | Sorts opportunities by Hard Gate Pass -> Readiness Tier -> Score. |
| Result Explanation Generation | **LLM (Grounded Context)** | Generates natural language summary ("You have X, missing Y, why it matters") bound strictly to input context. |
| **Gap Classification** | **Rule Engine (Deterministic Code)** | Classifies gaps strictly into Skill Gap, Evidence Gap, Experience Gap, or Hard Eligibility Gap. |
| Personalized Action-Plan Gen | **LLM + Schema Validation** | Translates identified skill/evidence gaps into structured step-by-step milestones. |
| Targeted Project Recommendation | **LLM (Structured Output)** | Generates custom project spec targeting specific skill/evidence gaps while checking project feasibility. |

---

## 2. Evidence Provenance Requirement

SkillBridge must maintain explainable lineage for all candidate skills and extracted opportunity requirements.

Every extracted candidate skill or requirement entity retained in the system should eventually store provenance metadata:
* **`source`**: Origin document (e.g. `Resume_John_Doe.pdf`, `JD_BI_Intern_102`).
* **`source_location`**: Context location (e.g. `Skills Section, Line 12`, `Projects -> E-commerce Analytics`).
* **`extracted_claim`**: Raw extracted text string before normalization.
* **`evidence_text`**: Supporting excerpt or reference code URL confirming capability.
* **`confidence`**: Rated extraction confidence (High, Medium, Low, Unknown).

Phase 1 database design must incorporate provenance schema fields into candidate profile and opportunity requirement tables where appropriate.

---

## 3. Extraction Confidence Model

SkillBridge distinguishes between explicit statements and AI inferences. The system must **never** silently convert uncertain AI inference into a definitive candidate fact.

* **HIGH CONFIDENCE (Explicit Evidence)**: Candidate resume explicitly states: *"2 years experience with Python"* or lists Python in Skills.
* **MEDIUM CONFIDENCE (Strong Inference)**: Candidate describes building several Python data analysis scripts in project descriptions, but does not explicitly list Python in Skills.
* **LOW CONFIDENCE (Weak Inference)**: LLM infers candidate knows statistics based on a vaguely described market research project.
* **UNKNOWN**: No evidence or inference found in profile.

> [!IMPORTANT]
> **Confidence Impact**: Low-confidence candidate skills are tagged as `UNVERIFIED_CLAIM` and cannot satisfy high-weight `EVIDENCE_GAP` requirements without generating a project recommendation to produce high-confidence evidence.

---

## 4. Semantic Skill Matching Clarifications & Limitations

We use the term **SEMANTIC SKILL MATCHING** rather than treating vector embeddings as authoritative skill equivalence.

### Standard Processing Pipeline
```
[Candidate Skill Extraction] 
       │
       ▼
[Canonical Skill Normalization (Where Appropriate)] 
       │
       ▼
[Semantic Matching (Vector Cosine Similarity)] 
       │
       ▼
[Deterministic Rules (For Exact Equivalence / Hard Gates)] 
       │
       ▼
[Explainable Diagnostic Result]
```

### Semantic Matching Limitations
High vector similarity does **NOT** automatically mean two skills are identical or interchangeable:
* **"Machine Learning" vs "Deep Learning"**: Related domains, but Deep Learning requires specific neural network frameworks.
* **"React" vs "React Native"**: Shared paradigm, but web DOM vs native mobile runtime environments.
* **"SQL Data Querying" vs "Database Administration"**: Query syntax vs index tuning, backup, and infrastructure management.

Phase 1 vector matching logic must enforce exact keyword/deterministic checks where domain equivalence is strict.

---

## 5. Responsible AI Safeguards
1. **Zero Demographics**: Non-discrimination by construction. No gender, caste, religion, photo, surname, socioeconomic status, or college prestige used in evaluation.
2. **Strict Grounding**: Prompt templates inject verified candidate resume JSON and opportunity requirement JSON into LLM context with explicit instructions forbidding invention of qualifications or deadlines.
3. **No Project Magic**: The system explicitly forbids classifying a project as a replacement for hard eligibility rules (e.g., mandatory 3-year workplace experience or accredited degree).
