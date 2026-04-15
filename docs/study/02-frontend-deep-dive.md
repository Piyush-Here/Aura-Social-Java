# Frontend Deep Dive

This document explains the React frontend in a code-reading style.

The frontend root is:

`src/client/src`

The goal of this guide is not just to explain React syntax.
It is to explain how this frontend is intentionally shaped to fit the Spring backend.

---

## 1. Entry Point: `main.tsx`

Source:

```tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### What each line does

`import {StrictMode} from 'react';`

- React `StrictMode` helps detect unsafe patterns in development.
- It is a development aid, not a visual UI component.

`import {createRoot} from 'react-dom/client';`

- This is the modern React mount API for React 18+ style rendering.

`import App from './App.tsx';`

- Imports the root component.

`import './index.css';`

- Loads global CSS once for the whole app.

`document.getElementById('root')!`

- Finds the DOM node created by `index.html`.
- The `!` is a TypeScript non-null assertion, saying "I know this exists."

`render(...)`

- mounts the React component tree into the DOM

### What to learn here

- how React boots
- what the root component is
- how CSS is globally loaded

---

## 2. Root Routing: `App.tsx`

This file defines the app shell, route structure, and authentication gating.

### Imports

It imports:

- router primitives from `react-router-dom`
- auth context utilities
- page components
- navbar

That alone teaches a structural point:

- `App.tsx` composes features
- it does not implement feature details

### `AppShell()`

This function is the actual routed UI.

#### `const { user, loading } = useAuth();`

- reads global authentication state from context

#### Loading branch

```tsx
if (loading) {
  return (
    <div className="screen-center">
      <div className="loading-mark">Aura</div>
    </div>
  );
}
```

This is a route guard for the whole app.

Meaning:

- do not try to render final routes until auth restoration finishes

#### Main app shell

```tsx
<BrowserRouter>
  {user && <Navbar />}
  <div className={user ? 'page-shell with-nav' : 'page-shell'}>
```

This teaches conditional layout composition:

- authenticated users see the navbar
- anonymous users do not
- authenticated pages add top padding so fixed nav does not overlap content

### Route definitions

The route table teaches frontend access policy.

#### `/auth`

```tsx
<Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthForm />} />
```

Meaning:

- if logged in, redirect away from login page
- if logged out, show the auth form

#### Protected routes

Every other main route uses:

- the actual page if `user` exists
- redirect to `/auth` otherwise

This is a clean and direct auth-guard pattern.

### `export default function App()`

This wraps the shell with `AuthProvider`.

Important lesson:

- providers are usually added above the components that consume them

---

## 3. Type Contracts: `types.ts`

This file describes the data exchanged with the backend.

It is one of the most educational TypeScript files in the app.

### `ApiErrorShape`

```ts
export interface ApiErrorShape {
  status?: number;
  message?: string;
  errors?: Record<string, string>;
}
```

This mirrors the backend's structured error responses.

It teaches:

- optional properties
- typed dictionaries with `Record<string, string>`

### `User`

Matches `UserResponse` from the backend.

Important design point:

- frontend `User` is an API model
- it is not a full backend entity

### `AuthResponse`

Matches the backend response from login/register:

- token
- user

### `Post`, `Comment`, `Message`, `ConversationSummary`

Each interface mirrors a backend response DTO.

This teaches one of the most important full-stack concepts:

- the frontend and backend need shared mental contracts even if they do not share code

---

## 4. Shared API Layer: `lib/api.ts`

This file is the frontend equivalent of a backend utility package.

It centralizes HTTP behavior.

### Constants

```ts
const API_BASE = '/api';
const TOKEN_KEY = 'aura.auth.token';
```

These prevent repeated string literals across components.

This is a redundancy-removal pattern.

### `ApiError` class

```ts
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
```

This extends the built-in JavaScript `Error`.

Why:

- keep normal error behavior
- add HTTP status
- add field-level validation errors

This is a very good example of custom error modeling.

### `getStoredToken()`

Reads the JWT from `localStorage`.

### `storeToken(token)`

Writes or removes the JWT.

This teaches a browser persistence pattern:

- store auth data in one place
- never scatter raw `localStorage` access across the app

### `parseError(response)`

This is an important function.

Flow:

1. try to parse response JSON
2. if parsing fails, treat payload as null
3. create a normalized `ApiError`

Why this matters:

- all failed requests become consistent errors
- components do not need to understand every raw backend failure shape

### `apiRequest<T>(...)`

This is the most important frontend infrastructure function.

#### Generic return type

`<T>` means the caller decides the expected response type.

That teaches TypeScript generics in a practical way.

#### Header construction

```ts
const headers = new Headers(init.headers);
```

- starts with any headers the caller passed
- lets this helper add auth and content-type behavior

#### Conditional content type

```ts
if (!headers.has('Content-Type') && init.body) {
  headers.set('Content-Type', 'application/json');
}
```

This prevents unnecessary duplication.

#### Authorization header

```ts
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

This is how the frontend participates in JWT auth.

#### Fetch call

The function sends the request and centralizes common logic.

#### Error handling

```ts
if (!response.ok) {
  throw await parseError(response);
}
```

This is a major design choice:

- failed HTTP responses are treated as exceptions
- UI code handles them in `catch`

#### 204 handling

```ts
if (response.status === 204) {
  return undefined as T;
}
```

This is a practical edge case handler.

---

## 5. Global Auth State: `components/AuthContext.tsx`

This file teaches React Context and global auth management.

### `AuthContextType`

Defines the API exposed by the auth context:

- `user`
- `loading`
- `login`
- `signup`
- `logout`
- `refreshUser`

This acts like a frontend service contract.

### `createContext<AuthContextType | null>(null)`

The context starts as `null` before a provider is applied.

### `useAuth()`

This custom hook:

1. reads the context
2. throws if used outside provider
3. returns strongly typed auth state and actions

This is a common React encapsulation pattern.

### `AuthProvider`

This component owns:

- logged-in user state
- loading state

#### `refreshUser`

Calls `/auth/me`.

If successful:

- updates the user

If it fails:

- clears token
- clears user state

This is the app's auth restoration logic.

#### `useEffect(() => { refreshUser().finally(...) }, [])`

This runs once on mount.

It teaches:

- app boot side effects
- restoring session-like auth from local token

#### `login`

Calls backend login, stores token, stores user.

#### `signup`

Calls backend registration, stores token, stores user.

#### `logout`

Local logout only:

- clear stored token
- clear in-memory user

This makes sense because the app uses stateless JWT auth.

---

## 6. `AuthForm.tsx`

This file is excellent for studying controlled forms.

### Local types and helpers

`type Mode = 'login' | 'signup';`

- a narrow union type
- keeps state valid

`normalizeUsername(...)`

- trims
- lowercases

This mirrors backend behavior intentionally.

### State fields

- `mode`
- `form`
- `error`
- `fieldErrors`
- `submitting`

This is a good example of separating:

- user input state
- validation state
- network state

### `title = useMemo(...)`

This computes display text based on mode.

It is not strictly necessary for performance here, but it is harmless and makes intent explicit.

### `updateField(...)`

This helper:

- updates one form key
- clears field-specific error
- clears top-level error

That is good UX and good state cleanup.

### `validate()`

This is a client-side validation pass.

Important lesson:

- frontend validation improves UX
- backend validation still remains the source of truth

The method checks:

- username format
- required display name in signup mode
- password presence and length

### `handleSubmit`

Flow:

1. stop default form submit
2. run local validation
3. set submitting state
4. call login or signup
5. navigate to feed
6. catch normalized errors
7. surface field and form errors

This is a full-stack form workflow in one file.

### JSX structure

The rendered structure teaches:

- semantic layout
- conditional fields
- dynamic button labels
- error display blocks
- mode switch button

---

## 7. `Navbar.tsx`

This is a small but good routing study file.

### `useLocation()`

Reads the current URL.

### `isActive(path)`

Returns whether a nav link should be highlighted.

This teaches:

- basic route-aware UI logic

### Render structure

- brand link
- nav links
- user/profile shortcut
- logout button

The navbar intentionally does not own auth logic.
It just consumes auth context actions.

That is good separation.

---

## 8. `FeedPage.tsx`

This page teaches request lifecycle and page state.

### State

- `posts`
- `loading`
- `error`
- `createOpen`

### `loadPosts`

This function:

1. requests `/posts`
2. stores posts if successful
3. stores error if failed
4. always clears loading

This is a good reusable page-loading pattern.

### `useEffect(() => { void loadPosts(); }, [])`

Runs once when the page mounts.

### `handleCreate`

Posts new content to the backend.

Important lesson:

- after a successful create, the newly created item is prepended to local state
- the whole page does not need to be reloaded

### `handleLike`

Sends a like toggle request.

The backend returns the updated `Post`, and the state replaces the matching post.

That keeps frontend logic simple.

### Render branches

- loading state
- empty state
- normal feed

This is good UI-state design.

---

## 9. `CreatePostModal.tsx`

This component teaches modal behavior and async form submission.

### Props

- `isOpen`
- `onClose`
- `onSubmit`

This is a classic reusable component contract.

### Reset effect

When the modal opens:

- clear caption
- clear image URL
- clear error

This prevents stale state from previous modal sessions.

### Escape-key effect

Adds a `keydown` listener only while open.

This teaches careful effect cleanup:

- add listener
- return cleanup function

### Early return

```tsx
if (!isOpen) {
  return null;
}
```

Common React modal pattern:

- render nothing when closed

### `handleSubmit`

Validates caption, then calls parent `onSubmit`.

The component does not know how posts are stored.
It only knows how to collect modal input.

That is good component responsibility design.

### Backdrop click logic

```tsx
<div className="modal-backdrop" onClick={onClose}>
  <div onClick={(event) => event.stopPropagation()}>
```

Meaning:

- click outside closes modal
- click inside does not

---

## 10. `PostCard.tsx`

This is a presentational component with a little behavior.

### Props

- `post`
- `onLike`

Important lesson:

- the parent owns data updates
- the child triggers actions through callbacks

### `formatTime`

Simple formatting helper.

This could later be extracted if reused widely.

### Render structure

- author link
- username
- timestamp
- optional image
- caption
- like button
- comment count
- embedded `CommentSection`

This is a good example of composition:

- `PostCard` is not trying to own comment state itself

---

## 11. `CommentSection.tsx`

This file teaches lazy-loading nested data.

### State

- `expanded`
- `comments`
- `content`
- `loading`
- `submitting`
- `error`

### `useEffect` when `expanded` changes

If not expanded:

- do nothing

If expanded:

- load comments from backend

That teaches:

- conditional effects
- avoid fetching data until needed

### `submit`

Flow:

1. trim content
2. reject empty comments
3. set submitting state
4. post comment to backend
5. append created comment to local list
6. clear input

This teaches small local mutations after successful API writes.

### Keyboard interaction

Pressing Enter submits the comment.

This improves UX with only a small amount of logic.

---

## 12. `ProfilePage.tsx`

This is the richest single UI page in the app.

### Route state

```tsx
const { username } = useParams<{ username: string }>();
```

This reads the username from the route.

### Auth comparison

```tsx
const isOwner = currentUser?.username === username;
```

This determines whether editing controls should be shown.

This teaches:

- authorization is enforced by backend
- but the frontend can still adapt UI based on identity

### Load effect

Uses `Promise.all` to fetch:

- profile info
- user's posts

This teaches parallel API loading.

### Draft state

`draft` holds editable form values separately from saved profile state.

That is a critical UI design pattern:

- persisted state
- editable transient state

should not always be the same variable

### `saveProfile`

PATCHes `/users/me` and then:

- updates the page profile
- closes editor
- refreshes auth context user

That final refresh matters because the navbar uses auth context too.

This is a good lesson in cross-component consistency.

### Render branches

- loading
- missing profile
- normal profile

### Profile posts section

Displays posts in a grid and links back to the feed.

Simple, but useful for teaching page composition.

---

## 13. `SearchPage.tsx`

This file teaches debounced search.

### Mode state

`type SearchMode = 'posts' | 'users';`

This creates a controlled, safe set of search modes.

### Debounced effect

The `useEffect`:

1. trims query
2. clears results if blank
3. sets a timeout
4. fires request after 250 ms
5. clears timeout if query/mode changes quickly

This is a standard debounce pattern without extra libraries.

### Branching by mode

If mode is posts:

- call `/posts?q=...`

If mode is users:

- call `/users/search?q=...`

This is a good study example for simple polymorphic UI behavior.

### Render sections

- segmented mode selector
- input field
- error message
- loading message
- result list
- empty results state

This is a clean example of explicit UI states.

---

## 14. `MessagesPage.tsx`

This page combines multiple concepts and is worth studying more than once.

### Route + auth inputs

- current conversation username comes from route
- current user comes from auth context

### State

- `conversations`
- `messages`
- `draft`
- `userQuery`
- `userResults`
- `error`
- `sending`

This is a realistic page-state model.

### `loadConversations`

Loads summary cards for the inbox sidebar.

### First effect

Runs on mount to load conversations.

### Second effect

Runs when `username` changes to load one thread.

Important lesson:

- summary list and message thread are separate concerns

### Third effect

Debounces user search for starting a new chat.

### `sendMessage`

Flow:

1. reject empty message
2. set sending state
3. POST `/messages`
4. append created message locally
5. clear input
6. reload conversation summaries

This is a realistic asynchronous UI action pattern.

### Layout

The page is split into:

- sidebar
- thread pane

That makes it a good example of multi-panel responsive page design.

---

## 15. Global CSS: `index.css`

This file is valuable even if you are primarily studying Java.

It teaches how frontend maintainability improves when styles are centralized.

### `:root`

Defines design tokens:

- colors
- radius
- shadow
- typography base

This is a maintainable CSS pattern because the app theme is centralized.

### Base resets

- `box-sizing`
- full-height root
- body defaults
- anchor defaults
- form-control font inheritance

These remove inconsistent browser defaults.

### Shared layout classes

Examples:

- `.page-container`
- `.stack-sm`
- `.stack-md`
- `.stack-lg`
- `.row-end`

These reduce JSX redundancy.

### Shared component classes

Examples:

- `.button`
- `.card`
- `.form-banner`
- `.empty-card`
- `.result-card`

This is why the rewritten frontend is simpler than the original inline-style-heavy version.

### Responsive section

The media query teaches:

- how layouts adapt under smaller screens
- why design systems usually contain responsive utility rules

---

## 16. Frontend Study Exercises

To learn more deeply, implement these yourself:

1. Add a loading skeleton component and use it on feed/profile/messages.
2. Add a reusable date formatting helper and replace repeated `toLocaleString()` logic.
3. Show the currently active conversation count in the messages sidebar.
4. Add a success message after creating a post.
5. Add optimistic like UI before the backend response arrives.
6. Add avatar images to conversation results using `photoUrl`.
7. Extract a reusable `EmptyState` component.

If you can do those cleanly, your React understanding will improve a lot.

---

## 17. Full-Stack Lessons From The Frontend

This frontend teaches several non-obvious backend lessons too.

### Lesson 1

Backend DTO design matters because frontend code becomes much simpler when responses are already shaped for UI use.

### Lesson 2

Consistent backend error format makes frontend error handling dramatically easier.

### Lesson 3

Token-based auth becomes manageable on the frontend only when there is a shared request helper.

### Lesson 4

Removing duplication in CSS and API access has the same long-term value as removing duplication in Java services.

That is a key engineering principle:

- maintainability patterns repeat across languages

---

## 18. Recommended Reading Order For Frontend

1. `main.tsx`
2. `App.tsx`
3. `types.ts`
4. `lib/api.ts`
5. `components/AuthContext.tsx`
6. `components/AuthForm.tsx`
7. `components/Navbar.tsx`
8. `components/FeedPage.tsx`
9. `components/CreatePostModal.tsx`
10. `components/PostCard.tsx`
11. `components/CommentSection.tsx`
12. `components/ProfilePage.tsx`
13. `components/SearchPage.tsx`
14. `components/MessagesPage.tsx`
15. `index.css`

This order works because it moves from infrastructure to features to styling.
