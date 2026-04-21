<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=waving&height=260&color=0:2bd2ff,45:7cff6b,100:0b1220&text=MAK%20AI&fontColor=ffffff&fontSize=82&fontAlignY=40&animation=twinkling&desc=Smart%20Learning%20Platform%20for%20Exam%20Success&descAlignY=64&descSize=19" alt="MAK AI banner" />
</p>

<p align="center">
	<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=18&pause=1200&color=2BD2FF&center=true&vCenter=true&width=980&lines=Expo%20React%20Native%20Mobile%20App;React%20%2B%20Vite%20Web%20Dashboard;Node.js%20%2B%20Express%20Backend%20API;Firebase%20Auth%20%7C%20Firestore%20%7C%20AI-Powered%20Exam%20Generation" alt="Animated project intro" />
</p>

<p align="center">
	<img src="https://img.shields.io/badge/THEME-EduTech%20Neon-0b1220?style=for-the-badge&logo=bookstack&logoColor=2bd2ff&labelColor=111827" alt="Theme EduTech Neon" />
	<img src="https://img.shields.io/badge/MOBILE-Expo%20React%20Native-111827?style=for-the-badge&logo=expo&logoColor=2bd2ff&labelColor=0b1220" alt="Mobile Expo React Native" />
	<img src="https://img.shields.io/badge/WEB-React%20%2B%20Vite-111827?style=for-the-badge&logo=react&logoColor=7cff6b&labelColor=0b1220" alt="Web React Vite" />
	<img src="https://img.shields.io/badge/BACKEND-Node.js%20%2B%20Express-111827?style=for-the-badge&logo=express&logoColor=2bd2ff&labelColor=0b1220" alt="Backend Node Express" />
	<img src="https://img.shields.io/badge/DATA-Firebase%20Firestore-111827?style=for-the-badge&logo=firebase&logoColor=7cff6b&labelColor=0b1220" alt="Firebase Firestore" />
</p>

<p align="center">
	<img src="https://img.shields.io/badge/AI-Anthropic%20Exam%20Agents-0b1220?style=flat-square&logo=sparkfun&logoColor=2bd2ff&labelColor=111827" alt="AI Anthropic Exam Agents" />
	<img src="https://img.shields.io/badge/STATUS-Active%20Development%20Path-0b1220?style=flat-square&logo=vercel&logoColor=7cff6b&labelColor=111827" alt="Status Active Development Path" />
</p>

<p align="center">
	<b>MAK AI</b> is a multi-platform educational application that helps students practice past papers, answer MCQs, and receive AI-assisted feedback with progress tracking.
</p>

<p align="center">
	<a href="#1-project-structure">Project Structure</a> •
	<a href="#3-architecture-diagram">Architecture Diagram</a> •
	<a href="#4-sequence-diagram-answering-past-papers-mcqs">MCQ Sequence Flow</a> •
	<a href="#6-er-diagram-core-data-model">ER Diagram</a> •
	<a href="#7-use-case-diagram">Use Case Diagram</a>
</p>

This document explains how the Mak AI platform is organized across mobile, web, and backend services.

## 1. Project Structure

The workspace is split into three main apps:

- `Mak-AI/Mak-AI-Frontend/`: React Native + Expo mobile application
- `Mak-AI/Mak-AI-Web/`: React + Vite web application
- `Mak-AI/Mak-AI-Backend/`: Node.js + Express API layer

Supporting files in the root include test scripts (`test-backend.js`, `test-webhook.js`) and operational notes.

## 2. UML Class Diagram (Core Learning Flow)

```mermaid
classDiagram
	class User {
		+string id
		+string email
		+string displayName
		+login()
		+updateProgress()
	}

	class AuthService {
		+signInWithEmail()
		+signInWithGoogle()
		+verifyToken()
	}

	class PastPaperSession {
		+string sessionId
		+string subject
		+string mode
		+startSession()
		+submitAnswer()
		+finishSession()
	}

	class MCQQuestion {
		+string id
		+string text
		+string[] options
		+string correctOption
		+int marks
	}

	class Answer {
		+string questionId
		+string selectedOption
		+bool isCorrect
		+int timeSpentSec
	}

	class GradingService {
		+gradeMCQ()
		+computeScore()
		+buildFeedback()
	}

	class AIExamAgent {
		+generatePastPaper()
		+generateHints()
		+generateExplanations()
	}

	class ProgressRepository {
		+saveSession()
		+saveAnswers()
		+getHistory()
	}

	User --> PastPaperSession : starts
	PastPaperSession "1" o-- "many" MCQQuestion : contains
	PastPaperSession "1" o-- "many" Answer : collects
	PastPaperSession --> GradingService : uses
	PastPaperSession --> AIExamAgent : requests
	AuthService --> User : authenticates
	ProgressRepository --> PastPaperSession : persists
```

## 3. Architecture Diagram

```mermaid
flowchart LR
	subgraph Clients
		M[Mobile App\nExpo React Native]
		W[Web App\nReact + Vite]
	end

	subgraph API
		B[Backend API\nNode.js + Express]
		A1[Auth Routes]
		A2[Past Paper Routes]
		A3[Health Routes]
	end

	subgraph Services
		FAuth[Firebase Auth]
		FDB[Firestore]
		AI[Anthropic AI Agents]
		G[Google OAuth]
	end

	M --> B
	W --> B
	B --> A1
	B --> A2
	B --> A3
	A1 --> FAuth
	A1 --> G
	A2 --> AI
	A2 --> FDB
	A1 --> FDB
```

## 4. Sequence Diagram: Answering Past Papers (MCQs)

```mermaid
sequenceDiagram
	autonumber
	participant U as User
	participant C as Client App (Mobile/Web)
	participant API as Backend API
	participant AG as AI Exam Agent
	participant DB as Firestore

	U->>C: Choose subject and start MCQ past paper
	C->>API: POST /past-paper/start (token, subject, mode=MCQ)
	API->>AG: Generate MCQ paper
	AG-->>API: MCQ questions + metadata
	API->>DB: Save session + question set
	API-->>C: Return sessionId + questions

	loop For each MCQ
		U->>C: Select option and submit
		C->>API: POST /past-paper/answer (sessionId, questionId, selectedOption)
		API->>API: Validate answer and update score state
		API->>DB: Persist answer attempt
		API-->>C: Return correctness + feedback snippet
	end

	U->>C: Finish paper
	C->>API: POST /past-paper/finish (sessionId)
	API->>API: Compute final score and analytics
	API->>DB: Save final results and progress
	API-->>C: Return results summary + recommendations
	C-->>U: Show score, corrections, and next revision topics
```

## 5. Notes

- Authentication is handled through Firebase Authentication and Google OAuth.
- Learning sessions and progress data are persisted in Firestore.
- AI agents generate and enrich educational content such as exam items and feedback.

## 6. ER Diagram (Core Data Model)

```mermaid
erDiagram
	USER ||--o{ PAST_PAPER_SESSION : starts
	USER ||--o{ EXAM_HISTORY : owns
	USER ||--o{ FLASHCARD_PROGRESS : tracks
	PAST_PAPER_SESSION ||--|{ MCQ_QUESTION : contains
	PAST_PAPER_SESSION ||--o{ ANSWER : collects
	MCQ_QUESTION ||--o{ ANSWER : answered_by
	SUBJECT ||--o{ PAST_PAPER_SESSION : used_in
	SUBJECT ||--o{ MCQ_QUESTION : categorizes

	USER {
		string id PK
		string email
		string display_name
		datetime created_at
	}

	SUBJECT {
		string id PK
		string name
		string level
	}

	PAST_PAPER_SESSION {
		string id PK
		string user_id FK
		string subject_id FK
		string mode
		int total_questions
		int score
		datetime started_at
		datetime completed_at
	}

	MCQ_QUESTION {
		string id PK
		string session_id FK
		string subject_id FK
		string prompt
		string option_a
		string option_b
		string option_c
		string option_d
		string correct_option
		int marks
	}

	ANSWER {
		string id PK
		string session_id FK
		string question_id FK
		string selected_option
		bool is_correct
		int time_spent_sec
	}

	EXAM_HISTORY {
		string id PK
		string user_id FK
		string session_id FK
		int final_score
		string feedback_summary
		datetime created_at
	}

	FLASHCARD_PROGRESS {
		string id PK
		string user_id FK
		string subject_id FK
		int mastered_count
		int review_count
		datetime updated_at
	}
```

## 7. Use Case Diagram

```mermaid
flowchart LR
	User((Student))
	Admin((Admin))
	AI((AI Agent))
	Auth((Firebase Auth))
	Store((Firestore))

	subgraph Mak_AI_System[Mak AI System]
		UC1([Sign Up / Log In])
		UC2([Start Past Paper MCQ])
		UC3([Answer MCQ Questions])
		UC4([Get Instant Feedback])
		UC5([Submit and View Score])
		UC6([Review Exam History])
		UC7([Study Flashcards])
		UC8([View Progress Analytics])
		UC9([Manage Content and Monitoring])
	end

	User --> UC1
	User --> UC2
	User --> UC3
	User --> UC4
	User --> UC5
	User --> UC6
	User --> UC7
	User --> UC8

	Admin --> UC9

	UC1 --> Auth
	UC2 --> AI
	UC4 --> AI
	UC5 --> Store
	UC6 --> Store
	UC7 --> Store
	UC8 --> Store
	UC9 --> Store
```

## 8. Platform Description (Detailed)

### 1. Project Vision

Build a reliable AI-powered learning platform where students can:

- Discover and practice exam-focused content by subject and level.
- Answer past-paper style MCQs and receive instant feedback.
- Track progress across revision sessions, topics, and flashcards.
- Maintain continuity across mobile and web with persistent account data.

The long-term objective is to move from mixed local-state interactions to complete backend-driven persistence with strong data integrity and analytics.

### 2. Current Implementation Status

Implemented

- Multi-platform experience across mobile (Expo React Native), web (React + Vite), and backend API (Node.js + Express).
- Firebase Authentication with email/password and Google sign-in integration.
- Firestore-backed user and learning data persistence.
- AI-assisted educational features for exam generation and learning support.
- Core study flows: revision modes, custom exam flows, flashcards, and history views.

Partially Implemented / In Progress

- Some learning interactions still rely on frontend-managed state before full synchronization.
- Certain social or notification-driven workflows are scaffolded and require full persistence wiring.
- Advanced analytics and recommendation ranking can be expanded into dedicated backend services.

### 3. Technical Architecture

- Frontend Mobile: Expo + React Native + Expo Router.
- Frontend Web: React + Vite.
- Backend: Express.js API running in Node.js.
- Authentication: Firebase Auth + Google OAuth.
- Data Layer: Firestore as primary persistence store.
- AI Layer: Anthropic-powered agents for exam and content assistance.

### 4. Routing and Feature Mapping

Frontend Navigation (High-Level)

- Onboarding and authentication flow.
- Subject and mode selection flow.
- MCQ and custom exam answering flow.
- Revision and flashcard learning flow.
- Exam history and progress review flow.

Backend API (Current)

- Authentication endpoints under `/api/auth/*`.
- Health and readiness endpoints under `/api/health/*`.
- Core service endpoints for content and learning workflows.

Backend API (Recommended Next)

- `POST /api/exams/start`
- `POST /api/exams/:sessionId/answers`
- `POST /api/exams/:sessionId/finish`
- `GET /api/exams/history/:userId`
- `GET /api/progress/:userId`
- `POST /api/flashcards/review`
- `GET /api/notifications/:userId`

### 5. Data-First Design (Critical Section)

Cardinality and Integrity Rules

- One user can create many learning sessions.
- One learning session contains many questions.
- One session stores many answer attempts.
- One user can own many flashcard progress records by subject/topic.
- One user can have many exam history records.

Constraints to Enforce

- Unique user identifiers and normalized subject codes.
- Session and answer records must always reference valid users and questions.
- Scores and attempt counters must remain non-negative.
- Finalized sessions should be immutable except for teacher/admin corrections.
- Progress updates should be idempotent for retry-safe writes.

### 6. Suggested Target Data Model

Primary Collections / Entities

- `users`
- `subjects`
- `exam_sessions`
- `questions`
- `answers`
- `exam_history`
- `flashcard_progress`
- `notifications`

Recommended Indexed Access Patterns

- `exam_sessions` by `user_id, started_at desc`
- `answers` by `session_id`
- `exam_history` by `user_id, created_at desc`
- `flashcard_progress` by `user_id, subject_id`
- `notifications` by `user_id, is_read, created_at desc`

### 7. Transaction Blueprint (MCQ Submission)

Use a single logical backend operation per answer submission:

1. Validate user token and active session.
2. Validate question belongs to session.
3. Compute correctness and marks for selected option.
4. Persist answer attempt.
5. Update session aggregate score and counters.
6. Emit progress update and optional recommendation hints.
7. Return updated attempt status to client.

For session completion:

1. Lock or mark session as finalizing.
2. Recompute totals from persisted answers.
3. Save final score, summary, and weak-topic insights.
4. Write exam history snapshot.
5. Mark session as completed and return final result payload.

### 8. App Feature Showcase

- Past-paper style MCQ practice with fast feedback loops.
- Subject-based learning pathways and revision modes.
- Flashcard practice with progress tracking.
- AI-enhanced question support and explanations.
- Mobile and web continuity for student study journeys.

### 9. Repository Structure

- `Mak-AI/Mak-AI-Frontend/`: Expo mobile client.
- `Mak-AI/Mak-AI-Web/`: React web client.
- `Mak-AI/Mak-AI-Backend/`: Express API and service integrations.
- Root-level test and operational docs for quick verification.

### 10. Local Setup

Prerequisites

- Node.js LTS
- npm
- Firebase project configuration (Auth + Firestore)
- Backend environment variables in `.env`

Run (Backend)

1. `cd Mak-AI/Mak-AI-Backend`
2. `npm install`
3. `npm run dev`

Run (Mobile)

1. `cd Mak-AI/Mak-AI-Frontend`
2. `npm install`
3. `npm start`

Run (Web)

1. `cd Mak-AI/Mak-AI-Web`
2. `npm install`
3. `npm run dev`

### 11. Practical Next Steps (Production Readiness)

1. Consolidate all exam flows on backend-validated session logic.
2. Complete notifications persistence and read-state syncing.
3. Add robust endpoint-level tests for exam lifecycle and scoring integrity.
4. Introduce analytics dashboards for weak-topic and trend detection.
5. Harden role-based access and operational monitoring for scale.
