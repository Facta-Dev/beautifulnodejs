# Graph Report - .  (2026-11-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1153 nodes · 1527 edges · 174 communities (128 shown, 46 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ce6d7c65`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Path
- _support.py
- usecase.ts
- inventory.py
- write
- check-examples.py
- Contributing
- devDependencies
- interface
- test_checker_failure_paths.py
- Beautiful Node.js
- What You Must Do When Invoked
- GateScript
- Node.js best practices
- Google TypeScript Style Guide (digest)
- 3. Design the TypeScript API, then implement it
- Node.js review: <what was reviewed>
- workflow_text
- TypeScript Deep Dive (digest)
- Backend Node stack (digest)
- compilerOptions
- compilerOptions
- Effective TypeScript (digest)
- BestPractices
- compilerOptions
- Node.js Best Practices (digest)
- graphify reference: extra exports and benchmark
- _load
- CiJobs
- <app> API Designer
- <app> Migration Reviewer
- <app> Ownership Reviewer
- <app> Architect Agent
- <app> Build Resolver Agent
- <app> Code Explorer Agent
- <app> Code Reviewer Agent
- <app> Planner Agent
- <app> TDD Guide Agent
- <app> Depguard Reviewer
- <app> Test Author
- <app> Add Handler
- <app> Add Module
- <app> Claim Check skill
- <app> Clean-Room Rebuild skill
- <app> Corpus Retrieval skill
- <app> Depguard Guard
- <app> Diagnosing Bugs skill
- <app> Domain Modeling skill
- <app> Grilling skill
- <app> learn skill
- <app> Ownership Author
- <app> plan skill
- <app> Research skill
- <app> review skill
- <app> ship skill
- <app> spec skill
- <app> TDD skill
- <app> Verified Status skill
- clean.ts
- graphify reference: query, path, explain
- build
- domain.ts
- worker.ts
- beautifulnodejs — agent instructions
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- eslint.config.mjs
- eslint.config.mjs
- check-lints.sh
- guard-bash.sh
- /add-handler
- /add-module
- /claim-check
- /clean-room-rebuild
- /corpus-retrieval
- /depguard-guard
- /diagnosing-bugs
- /domain-modeling
- /grilling
- /learn
- /ownership-author
- /plan
- /research
- /review
- /ship
- /spec
- /tdd
- /verified-status
- Playbooks for `beautifulnodejs` — load on demand
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- non-exhaustive-switch.ts
- domain.ts
- worker.ts
- CLAUDE.md
- README.md
- CREDITS.md
- CREDITS.md
- CREDITS.md
- CREDITS.md
- CREDITS.md
- extraction-spec.md
- CREDITS.md
- CREDITS.md
- CREDITS.md
- CREDITS.md
- domain.ts
- usecase.ts
- misused-promise.ts
- PRIVACY.md
- place-files.sh
- place-files.sh
- place-files.sh

## God Nodes (most connected - your core abstractions)
1. `write()` - 35 edges
2. `CheckSkillTests` - 35 edges
3. `build_valid_repo()` - 32 edges
4. `Checker` - 26 edges
5. `Beautiful Node.js` - 20 edges
6. `check_repo()` - 17 edges
7. `YamlParser` - 16 edges
8. `WithdrawTest` - 15 edges
9. `Node.js best practices` - 15 edges
10. `interface` - 14 edges

## Surprising Connections (you probably didn't know these)
- `ParseInventoryTest` --uses--> `InventoryError`  [INFERRED]
  skills/nodejs-port/evals/port-python-inventory/files/test_inventory.py → skills/nodejs-port/evals/port-python-inventory/files/inventory.py
- `QueryTest` --uses--> `InventoryError`  [INFERRED]
  skills/nodejs-port/evals/port-python-inventory/files/test_inventory.py → skills/nodejs-port/evals/port-python-inventory/files/inventory.py
- `WithdrawTest` --uses--> `InventoryError`  [INFERRED]
  skills/nodejs-port/evals/port-python-inventory/files/test_inventory.py → skills/nodejs-port/evals/port-python-inventory/files/inventory.py
- `ParseInventoryTest` --uses--> `ParseError`  [INFERRED]
  skills/nodejs-port/evals/port-python-inventory/files/test_inventory.py → skills/nodejs-port/evals/port-python-inventory/files/inventory.py
- `QueryTest` --uses--> `ParseError`  [INFERRED]
  skills/nodejs-port/evals/port-python-inventory/files/test_inventory.py → skills/nodejs-port/evals/port-python-inventory/files/inventory.py

## Import Cycles
- None detected.

## Communities (174 total, 46 thin omitted)

### Community 0 - "Path"
Cohesion: 0.11
Nodes (25): check_repo(), Checker, _fold_block(), format_problem(), _is_relative(), _json_key_line(), main(), _normalize_url() (+17 more)

### Community 1 - "_support.py"
Cohesion: 0.05
Nodes (19): ledger_data(), ledger_paths(), ledger_skip_count(), LedgerAgrees, LedgerShape, path -> the file entry, only for entries that are objects., Count of block specs that ledger a skip (the checker must match it)., The checker's skipped count must equal the ledger's skip count. (+11 more)

### Community 2 - "usecase.ts"
Cohesion: 0.06
Nodes (29): assertResendable(), Notification, NotificationStatus, NotificationStatusSchema, parseStatus(), CreateNotificationBody, registerNotifications(), NotificationStore (+21 more)

### Community 3 - "inventory.py"
Cohesion: 0.08
Nodes (25): BadAmount, DuplicateSku, find_item(), InsufficientStock, InventoryError, Item, low_stock(), parse_inventory() (+17 more)

### Community 4 - "write"
Cohesion: 0.14
Nodes (11): write(), DomainWallTest, EndToEndTest, add_portable_plugin(), build_valid_repo(), CheckSkillTests, error_messages(), formatted() (+3 more)

### Community 5 - "check-examples.py"
Cohesion: 0.13
Nodes (33): apply_harness(), as_text(), Block, build_project(), check_brackets(), check_quotes(), check_repo(), doc_files() (+25 more)

### Community 6 - "Contributing"
Cohesion: 0.06
Nodes (27): Added, Changelog, [Unreleased], Contributing, Good first contributions, License, Making a change, Style (+19 more)

### Community 7 - "devDependencies"
Cohesion: 0.07
Nodes (29): description, devDependencies, bullmq, drizzle-orm, eslint, @eslint-community/eslint-plugin-eslint-comments, @eslint/js, eslint-plugin-n (+21 more)

### Community 8 - "interface"
Cohesion: 0.07
Nodes (29): author, name, url, interface, publication, description, extensions, com.openai (+21 more)

### Community 9 - "test_checker_failure_paths.py"
Cohesion: 0.10
Nodes (15): BrokenTsBlock, CopiedRepoFailures, DeletedLints, GuardedRepoCase, has_eslint(), A broken ```ts block in a bare doc tree fails check-examples., Failure paths that mutate a full copy of the repo., Text surgery on a copy's lints: removing a pinned rule from BOTH the     drop-in (+7 more)

### Community 10 - "Beautiful Node.js"
Cohesion: 0.07
Nodes (27): Agent kit (Claude Code), Any agent, one command, Architecture diagrams, Beautiful Node.js, claude.ai, Claude Code, Contributing, Cursor or anything else: copy the folder (+19 more)

### Community 11 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 12 - "GateScript"
Cohesion: 0.12
Nodes (7): ConfigPairing, explicit_rules(), GateScript, HarnessCoverage, marker_names(), The shell contract: bounded runs, surfaced stderr, explicit non-JSON., Rule ids configured at the top level of any rules block in the config.

### Community 13 - "Node.js best practices"
Cohesion: 0.12
Nodes (15): 10. Architecture contract (the backend-node stack), 11. Tests, 12. Documentation and comments, 13. Final checklist, 1. Mindset, 2. Before you hand back code, 3. Types and API design, 4. Async and the event loop (+7 more)

### Community 14 - "Google TypeScript Style Guide (digest)"
Cohesion: 0.13
Nodes (14): Classes and objects, Control flow and expressions, Dependencies and ecosystem, Functions, Google TypeScript Style Guide (digest), Language features: prefer and avoid, Naming, Null and undefined (+6 more)

### Community 15 - "3. Design the TypeScript API, then implement it"
Cohesion: 0.13
Nodes (14): 1. Understand the original before writing anything, 2. Port the tests first, 3. Design the TypeScript API, then implement it, 4. Keep the port proportionate, 5. Verify, 6. Write the porting notes, A port is domain code, Errors become one exported discriminated union (+6 more)

### Community 16 - "Node.js review: <what was reviewed>"
Cohesion: 0.13
Nodes (14): 1. Decide the scope, 1. <Short title> (`src/features/notifications/usecase.ts:42`), 2. ..., 2. Run the tools first, if you can, 3. ..., 3. What to look for, in priority order, 4. Write the report, 5. Offer the lints (+6 more)

### Community 17 - "workflow_text"
Cohesion: 0.22
Nodes (5): CheckerSteps, Every existing CI job keeps its exact entrypoint and pin., The unittest gate: the full discovery is the CI job itself., TestsJob, workflow_text()

### Community 18 - "TypeScript Deep Dive (digest)"
Cohesion: 0.15
Nodes (12): Advanced types, Ambient declarations, Basics, Exceptions, Generics, NoImplicitAny chapter (Deep Dive's no-implicit-any chapter, condensed), Structural vs nominal (why ports compile), Testing (Deep Dive on jest/vitest, condensed) (+4 more)

### Community 19 - "Backend Node stack (digest)"
Cohesion: 0.17
Nodes (11): Backend Node stack (digest), Error envelope (doc 10), Hexagonal parts (doc 01), Observability (doc 10), Quiet failure modes (pass every general lint), Request lifecycle (doc 07), See also, Skeleton facts (doc 13) (+3 more)

### Community 20 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, noImplicitOverride, noUncheckedIndexedAccess, skipLibCheck, strict (+3 more)

### Community 21 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, module, moduleResolution, noEmit, noImplicitOverride, noUncheckedIndexedAccess, skipLibCheck, strict (+2 more)

### Community 22 - "Effective TypeScript (digest)"
Cohesion: 0.18
Nodes (10): any management, Declarations and module shape, Effective TypeScript (digest), Getting up to speed, Inference and narrowing, Tests (the book's testing guidance, condensed), Type design, Type system fundamentals (+2 more)

### Community 23 - "BestPractices"
Cohesion: 0.29
Nodes (4): BestPractices, bp_body(), ReviewSkill, rv_body()

### Community 24 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict, target (+1 more)

### Community 25 - "Node.js Best Practices (digest)"
Cohesion: 0.20
Nodes (9): Code style practices (the subset relevant to services), Error handling practices, Going to production, Node.js Best Practices (digest), Performance practices, Project structure practices, Security practices (the subset relevant to services), Testing practices (+1 more)

### Community 26 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 27 - "_load"
Cohesion: 0.36
Nodes (4): _load(), ManifestPairing, Path, skill_dirs()

### Community 29 - "<app> API Designer"
Cohesion: 0.29
Nodes (6): <app> API Designer, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 30 - "<app> Migration Reviewer"
Cohesion: 0.29
Nodes (6): <app> Migration Reviewer, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 31 - "<app> Ownership Reviewer"
Cohesion: 0.29
Nodes (6): <app> Ownership Reviewer, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 32 - "<app> Architect Agent"
Cohesion: 0.29
Nodes (6): <app> Architect Agent, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 33 - "<app> Build Resolver Agent"
Cohesion: 0.29
Nodes (6): <app> Build Resolver Agent, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 34 - "<app> Code Explorer Agent"
Cohesion: 0.29
Nodes (6): <app> Code Explorer Agent, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 35 - "<app> Code Reviewer Agent"
Cohesion: 0.29
Nodes (6): <app> Code Reviewer Agent, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 36 - "<app> Planner Agent"
Cohesion: 0.29
Nodes (6): <app> Planner Agent, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 37 - "<app> TDD Guide Agent"
Cohesion: 0.29
Nodes (6): <app> TDD Guide Agent, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 38 - "<app> Depguard Reviewer"
Cohesion: 0.29
Nodes (6): <app> Depguard Reviewer, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 39 - "<app> Test Author"
Cohesion: 0.29
Nodes (6): <app> Test Author, Core Mission, Expertise Areas, Guiding Principles, Output Format, Quality Standards

### Community 40 - "<app> Add Handler"
Cohesion: 0.29
Nodes (6): <app> Add Handler, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 41 - "<app> Add Module"
Cohesion: 0.29
Nodes (6): <app> Add Module, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 42 - "<app> Claim Check skill"
Cohesion: 0.29
Nodes (6): <app> Claim Check skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 43 - "<app> Clean-Room Rebuild skill"
Cohesion: 0.29
Nodes (6): <app> Clean-Room Rebuild skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 44 - "<app> Corpus Retrieval skill"
Cohesion: 0.29
Nodes (6): <app> Corpus Retrieval skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 45 - "<app> Depguard Guard"
Cohesion: 0.29
Nodes (6): <app> Depguard Guard, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 46 - "<app> Diagnosing Bugs skill"
Cohesion: 0.29
Nodes (6): <app> Diagnosing Bugs skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 47 - "<app> Domain Modeling skill"
Cohesion: 0.29
Nodes (6): <app> Domain Modeling skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 48 - "<app> Grilling skill"
Cohesion: 0.29
Nodes (6): <app> Grilling skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 49 - "<app> learn skill"
Cohesion: 0.29
Nodes (6): <app> learn skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 50 - "<app> Ownership Author"
Cohesion: 0.29
Nodes (6): <app> Ownership Author, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 51 - "<app> plan skill"
Cohesion: 0.29
Nodes (6): <app> plan skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 52 - "<app> Research skill"
Cohesion: 0.29
Nodes (6): <app> Research skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 53 - "<app> review skill"
Cohesion: 0.29
Nodes (6): <app> review skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 54 - "<app> ship skill"
Cohesion: 0.29
Nodes (6): <app> ship skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 55 - "<app> spec skill"
Cohesion: 0.29
Nodes (6): <app> spec skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 56 - "<app> TDD skill"
Cohesion: 0.29
Nodes (6): <app> TDD skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 57 - "<app> Verified Status skill"
Cohesion: 0.29
Nodes (6): <app> Verified Status skill, Core Principles, Output Format, Research References, Rules, When to Activate

### Community 58 - "clean.ts"
Cohesion: 0.29
Nodes (3): DispatchPort, PORT_TOKEN, PortToken

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - "build"
Cohesion: 0.53
Nodes (5): build(), main(), package_files(), Path, Files to package, relative to root, in a stable order.

### Community 63 - "beautifulnodejs — agent instructions"
Cohesion: 0.50
Nodes (3): beautifulnodejs — agent instructions, graphify, Model routing (Claude Code + Ollama)

### Community 64 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 65 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 66 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 67 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): DOMAIN_PATTERNS, SLICE_PATTERN, USECASE_PATTERNS

### Community 69 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): DOMAIN_PATTERNS, SLICE_PATTERN, USECASE_PATTERNS

### Community 70 - "check-lints.sh"
Cohesion: 0.83
Nodes (3): bounded(), fail(), check-lints.sh script

### Community 71 - "guard-bash.sh"
Cohesion: 0.83
Nodes (3): has(), has_i(), guard-bash.sh script

## Knowledge Gaps
- **451 isolated node(s):** `SLICE_PATTERN`, `DOMAIN_PATTERNS`, `USECASE_PATTERNS`, `name`, `version` (+446 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `write()` connect `write` to `_support.py`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `render()` connect `check-examples.py` to `Path`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `load_script()` connect `_support.py` to `write`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `SLICE_PATTERN`, `DOMAIN_PATTERNS`, `USECASE_PATTERNS` to the rest of the system?**
  _489 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Path` be split into smaller, more focused modules?**
  _Cohesion score 0.10615079365079365 - nodes in this community are weakly interconnected._
- **Should `_support.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05222734254992319 - nodes in this community are weakly interconnected._
- **Should `usecase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062146892655367235 - nodes in this community are weakly interconnected._