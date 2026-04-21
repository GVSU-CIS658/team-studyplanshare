# StudyPlanShare Backend

This backend is implemented using Node.js (Express) and Firebase Functions. It provides RESTful API endpoints for managing users, study plans, upvotes, and saved plans.

## Project Structure

```
functions/
├── index.js                # Entry point for Firebase Functions
├── package.json            # Backend dependencies
├── src/
│   ├── middleware/
│   │   └── auth.js         # Authentication middleware
│   └── routes/
│       ├── savedPlans.js   # Saved plans routes
│       ├── studyPlans.js   # Study plans routes
│       ├── upvotes.js      # Upvotes routes
│       └── users.js        # User routes
```

## Setup & Installation

1. **Install dependencies:**
   ```sh
   cd functions
   pnpm install
   ```

2. **Set up Firebase CLI:**
   - Install globally if needed: `npm install -g firebase-tools`
   - Log in: `firebase login`
   - Initialize (if not already): `firebase init`

3. **Configure environment variables:**
   - Use `.env` or set directly in Firebase console for secrets (API keys, etc).

## Running Locally

To emulate functions locally:
```sh
firebase emulators:start --only functions
```

## Deployment

Deploy backend functions to Firebase:
```sh
firebase deploy --only functions
```

## API Endpoints

- **/users**: User registration, login, profile
- **/studyPlans**: CRUD for study plans
- **/upvotes**: Upvote/unupvote study plans
- **/savedPlans**: Save/unsave study plans

See each file in `src/routes/` for detailed endpoint documentation.

## Middleware

- **auth.js**: Protects routes that require authentication (JWT-based)

## Notes
- Uses Firebase Admin SDK for database and authentication.
- All business logic is in `src/routes/` and `src/middleware/`.
- For client-side code, see the `client/` directory.

---

For questions or contributions, please open an issue or PR.
