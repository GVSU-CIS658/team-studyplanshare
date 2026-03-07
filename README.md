[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/d7M8Pab7)

# StudyPlanShare

A cloud-based web application that allows college students to create, share, browse, and save structured study plans by course and semester.

## Application Idea & Motivation

Many students struggle with organizing coursework and identifying effective study strategies. StudyPlanShare provides a centralized, searchable system where students can publish proven plans, discover high-quality plans from peers, and save useful ones for future use. The target users are university students seeking or sharing structured study strategies.

## Core Features

- User registration and login
- Create, edit, and delete personal study plans
- Browse and search plans by course name
- Sort plans by popularity (upvotes)
- Save plans for later access
- View personal uploaded and saved plans
- Secure upvoting with duplicate prevention

## Preliminary Architecture

| Layer | Technology | Responsibilities |
|---|---|---|
| Frontend | React | UI rendering, routing, token management, API calls, client-side validation |
| Backend | Firebase Cloud Functions | Token verification, access control, request validation, CRUD and upvote logic |
| Database | Cloud Firestore | Structured collections, indexed queries, filtering, sorting, pagination |

## Preliminary Database Design

| Collection | Fields |
|---|---|
| `users` | userId, email, createdAt |
| `studyPlans` | planId, title, courseName, semester, description, imageUrl, userId, upvoteCount, createdAt |
| `savedPlans` | saveId, userId, planId, createdAt |
| `upvotes` (subcollection) | `studyPlans/{planId}/upvotes/{userId}` |

## Team Responsibilities

| Role | Responsibilities |
|---|---|
| Frontend Lead | UI components, routing, authentication integration, API communication |
| Backend Lead | Cloud Functions, token verification, access control, CRUD logic |
| Database/Integration Lead | Firestore schema design, indexing, query optimization, deployment |

## Getting Started

### Prerequisites

- Node.js v20+
- npm
- Firebase CLI: `npm install -g firebase-tools`
- Java 17+ JRE (required for Firestore emulator): `sudo apt-get install -y openjdk-21-jre-headless`

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd functions && npm install
   ```
3. Install frontend dependencies:
   ```
   cd client && npm install
   ```

### Running Locally

Start the backend emulators:
```
firebase emulators:start
```

In a separate terminal, start the frontend:
```
cd client && npm start
```

## Deployment

To deploy to Firebase:
```
firebase deploy
```
