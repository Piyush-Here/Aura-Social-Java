# Aura Social

Aura Social is a Java full-stack social app with:

- Spring Boot
- Spring MVC
- Spring Data JPA
- Spring Security
- Hibernate
- MySQL
- JWT authentication
- React + CSS frontend with Vite

Users authenticate with `username` and `password`. Usernames are unique across the system.

## Project Layout

```text
aura-social/
├─ src/client/                       React frontend
│  ├─ index.html
│  └─ src/
│     ├─ App.tsx
│     ├─ index.css
│     ├─ types.ts
│     ├─ lib/api.ts
│     └─ components/
├─ src/server/                       Spring Boot backend
│  ├─ pom.xml
│  └─ src/
│     ├─ main/java/com/aura/
│     │  ├─ config/
│     │  ├─ controller/
│     │  ├─ domain/
│     │  ├─ dto/
│     │  ├─ exception/
│     │  ├─ repository/
│     │  ├─ security/
│     │  └─ service/
│     ├─ main/resources/application.properties
│     └─ test/
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## Requirements

- Java 17 or newer
- Node.js 18 or newer
- MySQL 8 or newer

Optional:

- Maven on PATH, or
- IntelliJ IDEA Community/Ultimate with bundled Maven

This machine already had a working Maven binary at:

```powershell
C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.4\plugins\maven\lib\maven3\bin\mvn.cmd
```

## Environment Setup

Backend configuration is read from `src/server/src/main/resources/application.properties`.

Default local values:

```properties
DB_URL=jdbc:mysql://localhost:3306/aura_social?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=root
JWT_SECRET=bXktc3VwZXItc2VjdXJlLWF1cmEtc29jaWFsLWtleS1mb3ItZGV2ZWxvcG1lbnQtb25seQ==
JWT_EXPIRATION_MS=86400000
```

You can override them in your shell before starting the backend.

PowerShell example:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/aura_social?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="root"
$env:JWT_SECRET="replace-with-your-own-base64-secret"
$env:JWT_EXPIRATION_MS="86400000"
```

## Run In Developer Mode

Open two terminals.

### 1. Start MySQL

Make sure MySQL is running and the configured user can create/access the `aura_social` database.

### 2. Start the Spring backend

If `mvn` is on your PATH:

```powershell
Set-Location src/server
mvn spring-boot:run
```

If Maven is not on PATH but IntelliJ is installed:

```powershell
Set-Location src/server
& "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.4\plugins\maven\lib\maven3\bin\mvn.cmd" spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

### 3. Start the React frontend

From the project root:

```powershell
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

Vite proxies `/api` requests to `http://localhost:8080`.

## Build And Validate

Frontend checks:

```powershell
npm run lint
npm run build
```

Backend tests with Maven on PATH:

```powershell
Set-Location src/server
mvn clean test
```

Backend tests using IntelliJ bundled Maven:

```powershell
Set-Location src/server
& "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean test
```

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users/{username}`
- `GET /api/users/search?q=...`
- `PATCH /api/users/me`

### Posts

- `GET /api/posts`
- `GET /api/posts/{postId}`
- `POST /api/posts`
- `POST /api/posts/{postId}/like`

### Comments

- `GET /api/posts/{postId}/comments`
- `POST /api/posts/{postId}/comments`

### Messages

- `GET /api/messages/conversations`
- `GET /api/messages/{username}`
- `POST /api/messages`

## Backend Architecture

### `config/`

- `SecurityConfig` configures stateless JWT security, public routes, password encoding, and filter registration.
- `WebConfig` configures CORS for the frontend dev server.

### `domain/`

JPA entities mapped with Hibernate:

- `User`
- `Post`
- `PostLike`
- `Comment`
- `Message`
- `Role`

### `repository/`

Spring Data repositories handle persistence and custom queries:

- `UserRepository`
- `PostRepository`
- `PostLikeRepository`
- `CommentRepository`
- `MessageRepository`

### `dto/`

DTOs isolate API payloads from entity classes.

- `dto/auth` for login/register
- `dto/user` for profile updates and user responses
- `dto/post` for post create/read payloads
- `dto/comment` for comment create/read payloads
- `dto/message` for messaging payloads

### `service/`

Business logic lives here:

- `AuthService` handles registration, login, JWT issuance, and current user lookup.
- `UserService` handles profile reads, updates, and search.
- `PostService` handles feed reads, post creation, and like toggling.
- `CommentService` handles comment reads and creation.
- `MessageService` handles conversations and direct messages.

### `security/`

- `CustomUserDetailsService` loads users for Spring Security.
- `JwtService` creates and validates JWT tokens.
- `JwtAuthenticationFilter` extracts bearer tokens from requests.
- `RestAuthenticationEntryPoint` returns JSON for unauthenticated access.
- `RestAccessDeniedHandler` returns JSON for forbidden access.

### `exception/`

- `GlobalExceptionHandler` converts validation errors, malformed JSON, conflicts, and server failures into structured JSON responses.

### `controller/`

REST endpoints are exposed through:

- `AuthController`
- `UserController`
- `PostController`
- `CommentController`
- `MessageController`

## Frontend Architecture

### `App.tsx`

Defines the app shell and routes:

- `/auth`
- `/`
- `/search`
- `/messages`
- `/messages/:username`
- `/profile/:username`

### `lib/api.ts`

Shared API layer for:

- bearer token storage
- authenticated fetch requests
- uniform API error parsing

### `components/AuthContext.tsx`

Global auth state:

- restores logged-in user from stored JWT
- provides `login`, `signup`, `logout`, and `refreshUser`

### UI components

- `AuthForm` handles login/sign-up validation and error display.
- `Navbar` handles navigation and logout.
- `FeedPage` loads posts and opens the create-post modal.
- `CreatePostModal` validates new post input.
- `PostCard` renders posts with like and comment actions.
- `CommentSection` loads and submits comments with inline error handling.
- `ProfilePage` reads user profiles and lets the owner edit their details.
- `SearchPage` searches posts and users.
- `MessagesPage` loads conversations, searches users, and sends direct messages.

### `index.css`

All styling is plain CSS. No Tailwind or component library is required.

## Invalid Input Handling

The app now handles invalid input gracefully in both layers.

Backend:

- validation annotations reject bad usernames, empty payloads, and oversize fields
- malformed JSON returns structured `400` responses
- duplicate/invalid state returns `409` or `400` responses
- unauthorized and forbidden requests return JSON instead of HTML

Frontend:

- forms validate before submission
- field-level and request-level errors are shown to the user
- API failures are normalized through a single client helper
- redundant inline styling and duplicate app wiring were removed

## Verified Commands

These were run successfully in this workspace:

```powershell
npm run lint
npm run build
Set-Location src/server
& "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean test
```
