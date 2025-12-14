# QMU.io Comprehensive Test Suite

> **Version:** 1.0.0
> **Last Updated:** December 13, 2024
> **Test Coverage Target:** 95%+

---

## Table of Contents

1. [Component Status Dashboard](#1-component-status-dashboard)
2. [Technical Tests](#2-technical-tests)
3. [User Acceptance Tests](#3-user-acceptance-tests)
4. [Integration Tests](#4-integration-tests)
5. [Performance Benchmarks](#5-performance-benchmarks)
6. [Test Metrics & Scoring](#6-test-metrics--scoring)
7. [Test Data Sets](#7-test-data-sets)
8. [Regression Test Checklist](#8-regression-test-checklist)

---

## Quick Validation Tests (5-Minute Proof of Learning)

> **Purpose:** These rapid tests prove the system is actively learning and building psychological profiles from user interaction.

### QV-001: Immediate Data Capture Test (~30 seconds)
**Goal:** Verify messages are being stored and analyzed

**Steps:**
1. Send exactly this message: "I love spending time outdoors hiking and exploring nature."
2. Open browser DevTools → Application → IndexedDB → qmu-io-db → messages
3. Verify your message appears in the table

**Pass Criteria:**
- [ ] Message stored with timestamp
- [ ] Role = "user"
- [ ] Message content matches exactly

---

### QV-002: LIWC Signal Detection Test (~1 minute)
**Goal:** Verify word-matching analysis is working

**Steps:**
1. Send: "I feel extremely happy and excited about achieving my goals today!"
2. Navigate to Profile → All Domains tab
3. Look for "Achievement Motivation" and "Big Five: Extraversion"

**Pass Criteria:**
- [ ] Scores are > 0 (not blank)
- [ ] Achievement Motivation increased (achievement words detected)
- [ ] Positive emotion words triggered extraversion signal

**Verification (Console):**
```javascript
const scores = await getDomainScores()
console.log('Achievement:', scores.find(s => s.domainId === 'achievement_motivation'))
```

---

### QV-003: Profile Building Test (~2 minutes)
**Goal:** Verify profile scores change after multiple messages

**Steps:**
1. Note current Big Five scores in Profile → Overview
2. Send these 5 messages (wait for response between each):
   - "I prefer spending time alone reading books"
   - "I always plan my tasks carefully before starting"
   - "Sometimes I worry about things going wrong"
   - "I love trying new foods and visiting new places"
   - "I try to help others whenever I can"
3. Click "Refresh Analysis" button
4. Compare scores to original values

**Pass Criteria:**
- [ ] Extraversion decreased (alone, reading)
- [ ] Conscientiousness increased (plan carefully)
- [ ] Neuroticism signal detected (worry)
- [ ] Openness increased (new foods, new places)
- [ ] Agreeableness signal detected (help others)

---

### QV-004: Three-Signal Integration Test (~2 minutes)
**Goal:** Verify all three analysis signals are contributing

**Steps:**
1. Send 5+ messages about yourself (interests, work, feelings)
2. Go to Profile → click on any domain score
3. In the detail modal, check "Signal Contributions"

**Pass Criteria:**
- [ ] LIWC Signal shows score and confidence
- [ ] Embedding Signal shows score and confidence
- [ ] LLM Signal shows score (after 5 messages) OR shows "Pending"
- [ ] Final score is weighted combination

---

### QV-005: Data Persistence Test (~1 minute)
**Goal:** Verify data survives page refresh

**Steps:**
1. Note your current message count in Profile → Overview
2. Note your Big Five radar chart values
3. Close the browser tab completely
4. Reopen the app
5. Check message count and radar chart

**Pass Criteria:**
- [ ] Message count identical
- [ ] Radar chart values identical
- [ ] No "No Data" messages appear

---

### QV-006: Domain Score Variation Test (~2 minutes)
**Goal:** Prove different messages affect different domains

**Test A - Risk Tolerance:**
1. Send: "I love taking risks and trying dangerous activities like skydiving"
2. Check Profile → All Domains → Risk Tolerance
3. Note the score

**Test B - Opposite Message:**
1. Send: "I prefer safety and always avoid unnecessary risks"
2. Refresh and check Risk Tolerance again

**Pass Criteria:**
- [ ] Test A: Risk Tolerance > 0.5
- [ ] Test B: Risk Tolerance decreases OR shows conflicting signals

---

### QV-007: Real-time Learning Indicator Test (~30 seconds)
**Goal:** Verify visual feedback during analysis

**Steps:**
1. Send a message
2. Watch for loading indicators or animation
3. Check if domain scores update without manual refresh

**Pass Criteria:**
- [ ] Some visual indicator during processing
- [ ] Scores update automatically after AI responds

---

### Quick Validation Summary

| Test | Time | Status | Notes |
|------|------|--------|-------|
| QV-001: Data Capture | 30s | [ ] Pass | |
| QV-002: LIWC Signal | 1m | [ ] Pass | |
| QV-003: Profile Building | 2m | [ ] Pass | |
| QV-004: Three Signals | 2m | [ ] Pass | |
| QV-005: Persistence | 1m | [ ] Pass | |
| QV-006: Domain Variation | 2m | [ ] Pass | |
| QV-007: Real-time | 30s | [ ] Pass | |

**Total Quick Validation Time: ~10 minutes**

If all 7 tests pass, the core learning system is functioning correctly.

---

## 1. Component Status Dashboard

### 1.1 Core Systems Status

| Component | Status | Last Tested | Health |
|-----------|--------|-------------|--------|
| **Database: IndexedDB (Dexie)** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **Database: SQL.js (SQLite WASM)** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **Database: LevelGraph (Knowledge Graph)** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **Database: TinkerBird (Vector Store)** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **LLM Engine (Gemma 3n)** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **Embedding Pipeline** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **LIWC Analysis Engine** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **Hybrid Aggregator** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **Emotion Detector** | [ ] Pass / [ ] Fail | - | [ ] Healthy |
| **Audio Analyzer** | [ ] Pass / [ ] Fail | - | [ ] Healthy |

### 1.2 Page Components Status

| Page | Renders | Interactive | Data Loads | Status |
|------|---------|-------------|------------|--------|
| **ChatPage** | [ ] | [ ] | [ ] | [ ] Ready |
| **ProfileDashboard** | [ ] | [ ] | [ ] | [ ] Ready |
| **ActivityDashboard** | [ ] | [ ] | [ ] | [ ] Ready |
| **SettingsPage** | [ ] | [ ] | [ ] | [ ] Ready |
| **BenchmarkPage** | [ ] | [ ] | [ ] | [ ] Ready |

### 1.3 UI Components Status

| Component | Renders | Variants Work | Interactions | Status |
|-----------|---------|---------------|--------------|--------|
| Button | [ ] | [ ] | [ ] | [ ] Ready |
| Card | [ ] | [ ] | [ ] | [ ] Ready |
| Badge | [ ] | [ ] | [ ] | [ ] Ready |
| Input | [ ] | [ ] | [ ] | [ ] Ready |
| ThemeToggle | [ ] | [ ] | [ ] | [ ] Ready |
| ParticlesBackground | [ ] | N/A | [ ] | [ ] Ready |
| WavyBackground | [ ] | N/A | [ ] | [ ] Ready |
| EmotionIndicator | [ ] | [ ] | [ ] | [ ] Ready |
| GlowingBorder | [ ] | N/A | [ ] | [ ] Ready |

### 1.4 39 Psychological Domains Status

#### Big Five Personality (5 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Openness | [ ] | [ ] | [ ] | [ ] |
| Conscientiousness | [ ] | [ ] | [ ] | [ ] |
| Extraversion | [ ] | [ ] | [ ] | [ ] |
| Agreeableness | [ ] | [ ] | [ ] | [ ] |
| Neuroticism | [ ] | [ ] | [ ] | [ ] |

#### Dark Triad (3 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Narcissism | [ ] | [ ] | [ ] | [ ] |
| Machiavellianism | [ ] | [ ] | [ ] | [ ] |
| Psychopathy | [ ] | [ ] | [ ] | [ ] |

#### Emotional Intelligence (5 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Empathy | [ ] | [ ] | [ ] | [ ] |
| Emotional Intelligence | [ ] | [ ] | [ ] | [ ] |
| Attachment Style | [ ] | [ ] | [ ] | [ ] |
| Love Languages | [ ] | [ ] | [ ] | [ ] |
| Communication Style | [ ] | [ ] | [ ] | [ ] |

#### Decision Making (3 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Risk Tolerance | [ ] | [ ] | [ ] | [ ] |
| Decision Style | [ ] | [ ] | [ ] | [ ] |
| Time Orientation | [ ] | [ ] | [ ] | [ ] |

#### Motivation (4 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Achievement Motivation | [ ] | [ ] | [ ] | [ ] |
| Self-Efficacy | [ ] | [ ] | [ ] | [ ] |
| Locus of Control | [ ] | [ ] | [ ] | [ ] |
| Growth Mindset | [ ] | [ ] | [ ] | [ ] |

#### Values & Well-being (6 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Personal Values | [ ] | [ ] | [ ] | [ ] |
| Interests | [ ] | [ ] | [ ] | [ ] |
| Life Satisfaction | [ ] | [ ] | [ ] | [ ] |
| Stress Coping | [ ] | [ ] | [ ] | [ ] |
| Social Support | [ ] | [ ] | [ ] | [ ] |
| Authenticity | [ ] | [ ] | [ ] | [ ] |

#### Cognitive (6 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Cognitive Abilities | [ ] | [ ] | [ ] | [ ] |
| Creativity | [ ] | [ ] | [ ] | [ ] |
| Learning Styles | [ ] | [ ] | [ ] | [ ] |
| Information Processing | [ ] | [ ] | [ ] | [ ] |
| Metacognition | [ ] | [ ] | [ ] | [ ] |
| Executive Functions | [ ] | [ ] | [ ] | [ ] |

#### Social/Cultural (7 domains)
| Domain | LIWC Signal | Embedding Signal | LLM Signal | Aggregated |
|--------|-------------|------------------|------------|------------|
| Social Cognition | [ ] | [ ] | [ ] | [ ] |
| Political Orientation | [ ] | [ ] | [ ] | [ ] |
| Cultural Identity | [ ] | [ ] | [ ] | [ ] |
| Moral Foundations | [ ] | [ ] | [ ] | [ ] |
| Work/Career | [ ] | [ ] | [ ] | [ ] |
| Sensory Preferences | [ ] | [ ] | [ ] | [ ] |
| Aesthetic Preferences | [ ] | [ ] | [ ] | [ ] |

---

## 2. Technical Tests

### 2.1 Database Layer Tests

#### T-DB-001: IndexedDB (Dexie) Initialization
```
Test ID: T-DB-001
Component: db.ts
Priority: Critical
```

**Steps:**
1. Open browser DevTools → Application → IndexedDB
2. Clear all QMU.io databases
3. Refresh the application
4. Verify `qmu-io-db` database is created

**Expected Results:**
- [ ] Database `qmu-io-db` exists
- [ ] Tables created: `messages`, `linguisticAnalyses`, `personalityTraits`, `userProfile`, `activityLogs`, `sessions`
- [ ] No console errors

**Actual Results:** _________________

---

#### T-DB-002: SQL.js Database Initialization
```
Test ID: T-DB-002
Component: sqldb.ts
Priority: Critical
```

**Steps:**
1. Open browser console
2. Execute: `localStorage.getItem('qmu_sql_db')`
3. Verify data exists (base64 encoded)

**Expected Results:**
- [ ] SQL database initialized in localStorage
- [ ] Schema version is current (check `profiles` table)
- [ ] All 13+ tables created

**Verification Query (run in console):**
```javascript
// Check table count
const tables = await window.__QMU_SQL__.exec("SELECT name FROM sqlite_master WHERE type='table'");
console.log('Tables:', tables[0].values.length);
```

**Actual Results:** _________________

---

#### T-DB-003: Vector Database Initialization
```
Test ID: T-DB-003
Component: vectordb.ts
Priority: High
```

**Steps:**
1. Check IndexedDB for TinkerBird stores
2. Verify embedding model loaded

**Expected Results:**
- [ ] Vector stores created: `message_embeddings`, `topic_embeddings`, `concept_embeddings`
- [ ] Embedding model loaded (Xenova/bge-small-en-v1.5)
- [ ] No model loading errors

**Actual Results:** _________________

---

#### T-DB-004: Graph Database Initialization
```
Test ID: T-DB-004
Component: graphdb.ts
Priority: High
```

**Steps:**
1. Check IndexedDB for LevelDB stores
2. Send a test message
3. Verify relationship triples created

**Expected Results:**
- [ ] LevelGraph store initialized
- [ ] Can create/query triples
- [ ] Relationship types work (DISCUSSES, INTERESTED_IN, etc.)

**Actual Results:** _________________

---

#### T-DB-005: Cross-Database Data Export
```
Test ID: T-DB-005
Component: All databases
Priority: High
```

**Steps:**
1. Navigate to Settings → Export Data
2. Click "Export All Data"
3. Verify JSON file downloaded
4. Open and inspect JSON structure

**Expected Results:**
- [ ] JSON file downloaded successfully
- [ ] Contains: `messages`, `analyses`, `domainScores`, `graph`, `vectors`, `metadata`
- [ ] Data is valid and parseable
- [ ] File size is reasonable (<50MB for typical usage)

**Actual Results:** _________________

---

#### T-DB-006: Full Data Deletion
```
Test ID: T-DB-006
Component: All databases
Priority: Critical
```

**Steps:**
1. Export data first (backup)
2. Navigate to Settings → Delete All Data
3. Confirm deletion in modal
4. Type "DELETE" confirmation
5. Verify all data cleared

**Expected Results:**
- [ ] Confirmation modal appears
- [ ] Requires typing "DELETE"
- [ ] All IndexedDB databases cleared
- [ ] localStorage cleared
- [ ] App resets to initial state
- [ ] Profile shows no data

**Actual Results:** _________________

---

### 2.2 Analysis Engine Tests

#### T-AN-001: LIWC Text Analysis
```
Test ID: T-AN-001
Component: enhanced-analyzer.ts
Priority: Critical
```

**Test Input:**
```
"I feel incredibly happy today! My friends and I achieved something amazing together.
We worked hard and finally succeeded after careful planning and collaboration."
```

**Steps:**
1. Send the test message in chat
2. Check console for analysis output
3. Verify feature extraction

**Expected Results:**
- [ ] Pronoun detection: I (4), we (2)
- [ ] Positive emotion words detected: happy, amazing, succeeded
- [ ] Achievement words: achieved, succeeded, worked hard
- [ ] Social words: friends, together, collaboration
- [ ] Domain scores generated for all 39 domains

**Verification:**
```javascript
// In console after sending message
const analysis = await window.__QMU_ANALYZER__.getLastAnalysis();
console.log('Features:', analysis.features);
console.log('Domain Scores:', analysis.domainScores);
```

**Actual Results:** _________________

---

#### T-AN-002: Emotion Detection from Text
```
Test ID: T-AN-002
Component: emotion-detector.ts
Priority: High
```

**Test Messages:**

| Message | Expected Emotion | Expected Valence | Expected Arousal |
|---------|------------------|------------------|------------------|
| "I'm so excited and thrilled!" | excited | >0.5 | >0.5 |
| "I feel calm and peaceful today" | relaxed | >0.3 | <0 |
| "This is frustrating and annoying" | frustrated | <0 | >0.3 |
| "I'm feeling sad and lonely" | sad | <-0.3 | <0 |

**Steps:**
1. Send each message
2. Check EmotionIndicator component
3. Verify valence/arousal values

**Expected Results:**
- [ ] Emotion labels match expected
- [ ] Valence direction correct
- [ ] Arousal direction correct
- [ ] Confidence > 0.5

**Actual Results:** _________________

---

#### T-AN-003: Hybrid Signal Aggregation
```
Test ID: T-AN-003
Component: hybrid-aggregator.ts
Priority: Critical
```

**Steps:**
1. Send 5+ messages to trigger LLM analysis
2. Check hybrid signal storage
3. Verify weight application

**Expected Results:**
- [ ] LIWC signal generated (weight: 20%)
- [ ] Embedding signal generated (weight: 30%)
- [ ] LLM signal generated after 5 messages (weight: 50%)
- [ ] Aggregated score is weighted average
- [ ] Confidence calculated correctly

**Verification:**
```javascript
const signals = await window.__QMU_SQL__.getAllHybridSignals();
console.log('Hybrid Signals:', signals);
```

**Actual Results:** _________________

---

#### T-AN-004: Context Detection
```
Test ID: T-AN-004
Component: context-profiler.ts
Priority: Medium
```

**Test Messages:**

| Message | Expected Context |
|---------|------------------|
| "Let me schedule a meeting with the team about the quarterly report" | work_professional |
| "I love painting and expressing myself through art" | creative_artistic |
| "My family means everything to me" | family_domestic |
| "I need to manage my budget better this month" | financial_economic |
| "Let's grab coffee and catch up!" | social_casual |

**Expected Results:**
- [ ] Context detected correctly for each message
- [ ] Confidence > 0.6 for clear contexts
- [ ] Context-specific scores stored

**Actual Results:** _________________

---

### 2.3 LLM Engine Tests

#### T-LLM-001: Model Loading
```
Test ID: T-LLM-001
Component: llm.ts
Priority: Critical
```

**Steps:**
1. Clear browser cache
2. Refresh application
3. Observe model loading progress
4. Wait for "Ready" status

**Expected Results:**
- [ ] Connection speed measured
- [ ] Download time estimated
- [ ] Progress bar updates smoothly
- [ ] Model loads without errors
- [ ] Status changes to "Ready"
- [ ] Memory usage reasonable (<2GB for E4B)

**Performance Targets:**
- First load: <60 seconds (depends on connection)
- Cached load: <5 seconds

**Actual Results:** _________________

---

#### T-LLM-002: Inference Quality
```
Test ID: T-LLM-002
Component: llm.ts
Priority: High
```

**Test Prompts:**

1. **Simple Response:**
   - Input: "Hello, how are you?"
   - Expected: Coherent greeting response

2. **Context Awareness:**
   - Input: "My name is Alex. What's my name?"
   - Expected: Response includes "Alex"

3. **Instruction Following:**
   - Input: "List 3 benefits of exercise"
   - Expected: Numbered list with 3 items

**Expected Results:**
- [ ] Responses are coherent
- [ ] Context is maintained
- [ ] Instructions followed
- [ ] No hallucinations or nonsense
- [ ] Response time <3 seconds

**Actual Results:** _________________

---

#### T-LLM-003: Multi-Language Support
```
Test ID: T-LLM-003
Component: llm.ts
Priority: Medium
```

**Steps:**
1. Go to Settings → Language
2. Select "Spanish (Espaol)"
3. Send message: "How do you say hello?"
4. Verify response is in Spanish

**Test Languages:**
- [ ] Spanish
- [ ] French
- [ ] German
- [ ] Japanese
- [ ] Chinese (Simplified)

**Expected Results:**
- [ ] Language setting persists
- [ ] Responses in selected language
- [ ] Analysis still works correctly

**Actual Results:** _________________

---

### 2.4 UI Component Tests

#### T-UI-001: Theme Switching
```
Test ID: T-UI-001
Component: ThemeToggle.tsx
Priority: Medium
```

**Steps:**
1. Click theme toggle to switch to Dark mode
2. Verify all components update
3. Click to switch to Light mode
4. Verify all components update
5. Set to Auto and change system preference

**Expected Results:**
- [ ] Theme switches instantly
- [ ] All text readable in both themes
- [ ] Background colors correct
- [ ] Particles/waves adapt to theme
- [ ] Setting persists on refresh
- [ ] Auto mode follows system

**Actual Results:** _________________

---

#### T-UI-002: Responsive Layout
```
Test ID: T-UI-002
Component: Layout.tsx
Priority: Medium
```

**Test Viewports:**

| Viewport | Width | Expected Behavior |
|----------|-------|-------------------|
| Desktop | 1920px | Full sidebar, full content |
| Laptop | 1366px | Sidebar visible, content adapts |
| Tablet | 768px | Sidebar collapsible |
| Mobile | 375px | Sidebar hidden, hamburger menu |

**Expected Results:**
- [ ] Layout adapts to all viewports
- [ ] No horizontal scrolling
- [ ] All content accessible
- [ ] Navigation functional

**Actual Results:** _________________

---

#### T-UI-003: Particles Background Performance
```
Test ID: T-UI-003
Component: ParticlesBackground.tsx
Priority: Low
```

**Steps:**
1. Open Performance tab in DevTools
2. Record 10 seconds of animation
3. Check frame rate

**Expected Results:**
- [ ] Consistent 60fps
- [ ] No frame drops >5ms
- [ ] CPU usage <10%
- [ ] No memory leaks

**Actual Results:** _________________

---

## 3. User Acceptance Tests

### 3.1 First-Time User Experience

#### UAT-001: Onboarding Flow
```
Test ID: UAT-001
Persona: New User
Priority: Critical
```

**Scenario:** First-time user opens the application

**Steps:**
1. Clear all browser data for the site
2. Navigate to http://localhost:5173/
3. Observe initial loading state
4. Wait for LLM model to load
5. Read any onboarding messages
6. Send first message

**Expected Experience:**
- [ ] Loading screen is informative
- [ ] Download progress visible
- [ ] Time estimate shown
- [ ] First AI message is welcoming
- [ ] Instructions are clear
- [ ] No errors or confusion

**User Feedback Notes:** _________________

---

#### UAT-002: Basic Conversation
```
Test ID: UAT-002
Persona: Casual User
Priority: Critical
```

**Scenario:** User has a basic conversation

**Test Script:**
1. User: "Hi, I'm new here. What can you do?"
2. User: "Tell me about yourself"
3. User: "What do you know about me so far?"
4. User: "I enjoy reading and hiking"
5. User: "What personality traits do I have?"

**Expected Experience:**
- [ ] AI responses are helpful and friendly
- [ ] Responses appear within 3 seconds
- [ ] Profile starts building after messages
- [ ] User feels engaged
- [ ] No technical jargon exposed

**User Feedback Notes:** _________________

---

#### UAT-003: Profile Discovery
```
Test ID: UAT-003
Persona: Curious User
Priority: High
```

**Scenario:** User explores their psychological profile

**Steps:**
1. Send 10+ varied messages about interests, work, relationships
2. Navigate to Profile page
3. Explore domain scores
4. Check confidence levels
5. Review data sources

**Expected Experience:**
- [ ] Profile page loads quickly
- [ ] Scores are displayed clearly
- [ ] Categories make sense
- [ ] Can understand what each domain means
- [ ] Confidence indicators helpful
- [ ] Can see which signals contributed

**User Feedback Notes:** _________________

---

#### UAT-004: Settings Customization
```
Test ID: UAT-004
Persona: Power User
Priority: Medium
```

**Scenario:** User customizes their experience

**Test Tasks:**
1. Change language to Spanish
2. Adjust response size to "Detailed"
3. Modify hybrid weights (30/30/40)
4. Customize system prompt
5. Export data
6. Switch theme

**Expected Experience:**
- [ ] All settings are accessible
- [ ] Changes apply immediately
- [ ] Settings persist after refresh
- [ ] Export works and data is complete
- [ ] No settings cause errors

**User Feedback Notes:** _________________

---

#### UAT-005: Activity Tracking
```
Test ID: UAT-005
Persona: Data-Conscious User
Priority: Medium
```

**Scenario:** User reviews their activity

**Steps:**
1. Use the app for various activities (chat, profile view, settings)
2. Navigate to Activity page
3. Filter by time (Today, Week, Month)
4. Filter by activity type
5. Review charts and statistics

**Expected Experience:**
- [ ] Activity page shows all actions
- [ ] Filters work correctly
- [ ] Charts are informative
- [ ] Can see usage patterns
- [ ] Data matches actual usage

**User Feedback Notes:** _________________

---

#### UAT-006: Privacy Verification
```
Test ID: UAT-006
Persona: Privacy-Conscious User
Priority: Critical
```

**Scenario:** User verifies data stays local

**Steps:**
1. Open Network tab in DevTools
2. Have a conversation
3. Check all network requests
4. Verify no data sent to external servers
5. Check "Private by Design" indicator

**Expected Experience:**
- [ ] No API calls with message content
- [ ] Only model download requests (first load)
- [ ] "Private by Design" indicator visible
- [ ] User feels confident data is local

**Network Requests Observed:** _________________

---

#### UAT-007: Benchmark Execution
```
Test ID: UAT-007
Persona: Technical User
Priority: Low
```

**Scenario:** User runs performance benchmarks

**Steps:**
1. Navigate to Benchmarks page
2. Run "Quick Benchmark"
3. Observe progress
4. Review results
5. Run "Full Benchmark"
6. Export report

**Expected Experience:**
- [ ] Benchmark starts immediately
- [ ] Progress updates smoothly
- [ ] Results are understandable
- [ ] Device tier classification makes sense
- [ ] Report export works

**Benchmark Results Summary:** _________________

---

### 3.2 Error Handling Tests

#### UAT-008: Network Disconnection
```
Test ID: UAT-008
Scenario: User loses internet connection
Priority: High
```

**Steps:**
1. Disconnect from internet (DevTools → Network → Offline)
2. Try to send a message
3. Try to navigate pages
4. Reconnect and retry

**Expected Experience:**
- [ ] App continues to work (local-first)
- [ ] Offline indicator appears
- [ ] Messages still send (to local LLM)
- [ ] No data loss
- [ ] Graceful error messages

**User Feedback Notes:** _________________

---

#### UAT-009: Storage Full
```
Test ID: UAT-009
Scenario: Browser storage quota exceeded
Priority: Medium
```

**Steps:**
1. Fill storage with test data (optional: use DevTools to simulate)
2. Try to send more messages
3. Observe error handling

**Expected Experience:**
- [ ] Clear error message shown
- [ ] Suggestion to export and clear data
- [ ] No app crash
- [ ] Existing data preserved

**User Feedback Notes:** _________________

---

#### UAT-010: Model Loading Failure
```
Test ID: UAT-010
Scenario: LLM model fails to load
Priority: High
```

**Steps:**
1. Block model download URL (DevTools → Network → Block request URL)
2. Refresh application
3. Observe error handling
4. Unblock and retry

**Expected Experience:**
- [ ] Clear error message
- [ ] Retry option available
- [ ] App remains functional for viewing
- [ ] Can switch to smaller model

**User Feedback Notes:** _________________

---

## 4. Integration Tests

### 4.1 End-to-End Flow Tests

#### INT-001: Complete Profile Building
```
Test ID: INT-001
Flow: New User → 20 Messages → Full Profile
Priority: Critical
Duration: ~15 minutes
```

**Test Script:**

**Messages (send in order):**
1. "Hello! I'm excited to try this app."
2. "I work as a software engineer and love solving complex problems."
3. "On weekends, I enjoy hiking in nature and photography."
4. "I'm generally an introvert but enjoy deep conversations with close friends."
5. "I believe in continuous learning and personal growth."
6. "Sometimes I worry too much about what others think."
7. "I prefer making decisions after careful analysis."
8. "Family is very important to me."
9. "I get frustrated when people aren't organized."
10. "I love reading science fiction and philosophy."
11. "I try to be kind and help others when I can."
12. "I'm not very spontaneous - I like to plan ahead."
13. "Music helps me relax after a stressful day."
14. "I value honesty and integrity above all."
15. "I sometimes struggle with procrastination."
16. "I enjoy cooking and trying new recipes."
17. "I'm curious about how AI and technology work."
18. "I feel most productive in the morning."
19. "I appreciate art and beautiful design."
20. "Overall, I'd say I'm a thoughtful and caring person."

**Verification Checkpoints:**

After Message 5:
- [ ] Initial domain scores appearing
- [ ] LIWC signals detected
- [ ] LLM batch analysis triggered

After Message 10:
- [ ] Profile showing meaningful scores
- [ ] Multiple domains have data
- [ ] Confidence increasing

After Message 15:
- [ ] Full profile visible
- [ ] Big Five traits estimated
- [ ] Emotional patterns detected

After Message 20:
- [ ] All 39 domains have scores
- [ ] Confidence levels reasonable (>0.3 for mentioned traits)
- [ ] Profile consistent with messages

**Expected Final Profile (approximate):**
- Openness: High (curiosity, learning, philosophy)
- Conscientiousness: High (organized, planning, work ethic)
- Extraversion: Low-Medium (introvert, but social)
- Agreeableness: High (kind, caring, family)
- Neuroticism: Medium (worries, frustration)

**Actual Results:** _________________

---

#### INT-002: Data Persistence Test
```
Test ID: INT-002
Flow: Create Data → Close → Reopen → Verify
Priority: Critical
```

**Steps:**
1. Complete INT-001 (or use existing data)
2. Note down key metrics:
   - Total messages: ___
   - Profile completeness: ___%
   - Top domain scores: ___
3. Close browser completely
4. Reopen application
5. Verify all data restored

**Expected Results:**
- [ ] Message count matches
- [ ] Profile completeness matches
- [ ] Domain scores unchanged
- [ ] Activity log includes past activities
- [ ] Settings preserved

**Actual Results:** _________________

---

#### INT-003: Export-Import Cycle
```
Test ID: INT-003
Flow: Export → Delete → Import → Verify
Priority: High
```

**Steps:**
1. Export all data (Settings → Export)
2. Note file size and structure
3. Delete all data (Settings → Delete All)
4. Verify empty state
5. Import exported data
6. Verify restoration

**Expected Results:**
- [ ] Export creates valid JSON
- [ ] Delete clears all databases
- [ ] Import restores all data
- [ ] Domain scores match pre-export
- [ ] Messages match pre-export

**Note:** Import functionality may need implementation verification.

**Actual Results:** _________________

---

### 4.2 Signal Pipeline Tests

#### INT-004: LIWC → Embedding → LLM Pipeline
```
Test ID: INT-004
Flow: Message → All 3 Signals → Aggregation → Storage
Priority: Critical
```

**Test Message:**
"I achieved my goal today after working incredibly hard. I feel so proud and grateful for my team's support!"

**Verification Points:**

1. **LIWC Signal Check:**
   ```javascript
   // In console
   const liwc = await window.__QMU_ENHANCED__.getLastFeatures();
   console.log('Achievement:', liwc.ACHIEVEMENT);
   console.log('Positive Emotion:', liwc.POSITIVE_EMOTION);
   console.log('Social:', liwc.SOCIAL);
   ```
   - [ ] Achievement words detected
   - [ ] Positive emotions detected
   - [ ] Social references detected

2. **Embedding Signal Check:**
   ```javascript
   const embedding = await window.__QMU_VECTOR__.getLastEmbedding();
   console.log('Embedding dim:', embedding.length); // Should be 384
   ```
   - [ ] Embedding generated (384 dimensions)
   - [ ] Similarity to achievement prototype high

3. **Aggregation Check:**
   ```javascript
   const hybrid = await window.__QMU_SQL__.getLastHybridSignal();
   console.log('Weights applied:', hybrid.weights);
   console.log('Final score:', hybrid.aggregatedScore);
   ```
   - [ ] All signals present
   - [ ] Weights correctly applied
   - [ ] Final score reasonable

**Actual Results:** _________________

---

## 5. Performance Benchmarks

### 5.1 Latency Targets

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|--------------|
| Message send to response start | <500ms | <1000ms | >2000ms |
| Full response generation | <3000ms | <5000ms | >10000ms |
| LIWC analysis | <50ms | <100ms | >200ms |
| Embedding generation | <200ms | <500ms | >1000ms |
| Page navigation | <100ms | <200ms | >500ms |
| Profile page load | <500ms | <1000ms | >2000ms |
| Data export | <2000ms | <5000ms | >10000ms |

### 5.2 Memory Targets

| State | Target | Acceptable | Unacceptable |
|-------|--------|------------|--------------|
| Initial load (no model) | <100MB | <200MB | >300MB |
| With LLM model loaded | <2GB | <3GB | >4GB |
| After 100 messages | <2.5GB | <3.5GB | >5GB |
| After 1000 messages | <3GB | <4GB | >6GB |

### 5.3 Benchmark Recording Sheet

| Test Date | Tester | Device | Browser | LLM Load (s) | Inference (ms) | Memory (MB) | Score |
|-----------|--------|--------|---------|--------------|----------------|-------------|-------|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

---

## 6. Test Metrics & Scoring

### 6.1 Test Coverage Score

```
Coverage Score = (Passed Tests / Total Tests) × 100

Target: 95%+
Acceptable: 85%+
Critical Threshold: 70%
```

### 6.2 Scoring Rubric

#### Technical Tests (40 points total)
- Database Tests (10 points): ___ / 10
- Analysis Engine Tests (15 points): ___ / 15
- LLM Engine Tests (10 points): ___ / 10
- UI Component Tests (5 points): ___ / 5

#### User Acceptance Tests (40 points total)
- First-Time Experience (15 points): ___ / 15
- Core Functionality (15 points): ___ / 15
- Error Handling (10 points): ___ / 10

#### Integration Tests (20 points total)
- End-to-End Flows (15 points): ___ / 15
- Signal Pipeline (5 points): ___ / 5

### 6.3 Quality Gates

| Gate | Criteria | Status |
|------|----------|--------|
| **Alpha Ready** | Technical tests >80%, UAT >70% | [ ] Pass |
| **Beta Ready** | All categories >85%, no critical bugs | [ ] Pass |
| **Release Ready** | All categories >95%, performance met | [ ] Pass |

### 6.4 Test Summary Report

```
Date: ________________
Tester: ________________
Version: ________________

TECHNICAL TESTS
---------------
Total: ___ / ___
Pass Rate: ___%
Critical Failures: ___

USER ACCEPTANCE TESTS
---------------------
Total: ___ / ___
Pass Rate: ___%
User Satisfaction: ___/10

INTEGRATION TESTS
-----------------
Total: ___ / ___
Pass Rate: ___%

OVERALL SCORE
-------------
Points: ___ / 100
Grade: ___
Status: [ ] Alpha [ ] Beta [ ] Release Ready

CRITICAL ISSUES:
1. _______________
2. _______________
3. _______________

RECOMMENDATIONS:
1. _______________
2. _______________
3. _______________

Sign-off: ________________
```

---

## 7. Test Data Sets

### 7.1 Standard Test Messages

#### Big Five Personality Indicators

**High Openness:**
```
"I'm fascinated by abstract ideas and love exploring new philosophies.
Yesterday I spent hours reading about quantum mechanics just for fun."
```

**High Conscientiousness:**
```
"I always make detailed to-do lists and feel anxious if things aren't organized.
I've never missed a deadline in my career."
```

**High Extraversion:**
```
"I thrive at parties and love meeting new people! Last weekend I organized
a huge gathering and talked to everyone there."
```

**High Agreeableness:**
```
"I always try to see things from others' perspectives. When conflicts arise,
I prefer to find compromises that make everyone happy."
```

**High Neuroticism:**
```
"I tend to worry a lot about things that might go wrong. Small setbacks
can really affect my mood for the whole day."
```

#### Emotion Test Messages

| Emotion | Test Message |
|---------|--------------|
| Joy | "I just got the promotion I've been working toward for years! I'm over the moon!" |
| Sadness | "I've been feeling really down lately. Everything seems gray and meaningless." |
| Anger | "This is absolutely infuriating! They completely ignored my input again!" |
| Fear | "I'm terrified about the upcoming presentation. What if I mess everything up?" |
| Surprise | "Wait, what?! I had no idea that was happening! This changes everything!" |
| Calm | "I feel at peace right now. Just sitting here, watching the sunset, feeling content." |

### 7.2 Edge Case Test Data

#### Empty/Minimal Input
```
""
"."
"Hi"
"Ok"
```

#### Long Input (>1000 words)
```
[Generate a 1000+ word message about a complex topic]
```

#### Special Characters
```
"I feel 😊 happy and 💪 strong! #blessed @life"
"Testing <script>alert('xss')</script> security"
"Math equation: E = mc² and ∑(x²)"
```

#### Multi-Language
```
"Hello! Hola! Bonjour! 你好! こんにちは!"
```

---

## 8. Regression Test Checklist

### Before Each Release

#### Critical Path Tests
- [ ] T-DB-001: Database initialization
- [ ] T-AN-001: LIWC analysis works
- [ ] T-LLM-001: Model loads successfully
- [ ] UAT-001: Onboarding works
- [ ] UAT-002: Basic conversation works
- [ ] INT-001: Profile building works

#### Data Integrity Tests
- [ ] T-DB-005: Export works
- [ ] T-DB-006: Delete works
- [ ] INT-002: Data persists across sessions

#### UI Tests
- [ ] T-UI-001: Theme switching works
- [ ] All pages render without errors
- [ ] No console errors in normal usage

#### Performance Tests
- [ ] LLM inference <3 seconds
- [ ] Page loads <500ms
- [ ] Memory usage reasonable

### Regression Test Sign-off

```
Version: ________________
Date: ________________
Tester: ________________

[ ] All critical path tests pass
[ ] All data integrity tests pass
[ ] All UI tests pass
[ ] Performance within targets
[ ] No new console errors
[ ] No visual regressions

Notes:
________________________________
________________________________

Approved for release: [ ] Yes [ ] No

Signature: ________________
```

---

## Appendix A: Console Debug Commands

```javascript
// Database inspection
window.__QMU_DB__ = await import('/src/lib/db.ts');
window.__QMU_SQL__ = await import('/src/lib/sqldb.ts');
window.__QMU_VECTOR__ = await import('/src/lib/vectordb.ts');
window.__QMU_GRAPH__ = await import('/src/lib/graphdb.ts');

// Get all domain scores
const scores = await window.__QMU_SQL__.getDomainScores();
console.table(scores);

// Get all messages
const messages = await window.__QMU_DB__.db.messages.toArray();
console.log('Messages:', messages.length);

// Get graph stats
const graphStats = await window.__QMU_GRAPH__.getGraphStats();
console.log('Graph:', graphStats);

// Get vector stats
const vectorStats = await window.__QMU_VECTOR__.getVectorStats();
console.log('Vectors:', vectorStats);

// Force hybrid analysis
await window.__QMU_HYBRID__.analyzeHybrid('test', 'Test message content');

// Check LLM status
console.log('LLM Status:', window.__QMU_LLM__.getStatus());
```

---

## Appendix B: Test Environment Setup

### Required Browser
- Chrome 120+ or Firefox 120+ or Safari 17+
- WebGPU support enabled
- IndexedDB enabled
- localStorage enabled (50MB+ quota)

### Hardware Requirements (for full testing)
- RAM: 8GB minimum, 16GB recommended
- GPU: WebGPU-capable (for LLM acceleration)
- Storage: 5GB free space

### Test Environment Checklist
- [ ] Browser updated to latest version
- [ ] DevTools accessible
- [ ] Network throttling available
- [ ] Storage inspection tools working
- [ ] Performance profiler working

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-13 | QMU.io Team | Initial comprehensive test suite |
