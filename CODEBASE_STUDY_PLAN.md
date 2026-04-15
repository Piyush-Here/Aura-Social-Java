# Aura Social Codebase Study Plan

This document is meant to be a long-term study reference for this repository.

It has two jobs:

1. Explain how the current codebase works.
2. Turn the codebase into a structured Java full-stack study plan.

The codebase is not just an app. It is a compact example of:

- Core Java
- Spring Boot
- Spring MVC
- Spring Data JPA
- Spring Security
- Hibernate
- MySQL integration
- JWT authentication
- React frontend integration

## How To Study This Codebase

Do not try to memorize everything in one pass.

Use this document in four layers:

1. Architecture pass
   Understand how requests move through the system.
2. File pass
   Read one file at a time and compare the code to this guide.
3. Framework pass
   Group similar concepts together: entities, repositories, services, security, controllers.
4. Build pass
   Run the app, change one thing, and verify you understand the outcome.

The best way to use this guide is:

- keep the project open in your editor
- open one file from the codebase
- read the matching section below
- trace how that file connects to the next one
- make a tiny change and re-run the app

## Big Picture Architecture

The backend follows a standard layered Spring architecture:

```text
HTTP Request
-> Controller
-> Service
-> Repository
-> Database
```

The frontend follows a standard React architecture:

```text
Route
-> Page Component
-> Shared API helper
-> Backend endpoint
-> Response rendered into UI
```

The authentication flow is:

```text
User logs in with username + password
-> Spring Security authenticates credentials
-> JwtService creates token
-> Frontend stores token
-> Frontend sends token in Authorization header
-> JwtAuthenticationFilter validates token on later requests
-> Spring injects Authentication into controllers
```

That single flow teaches a large part of real-world Java backend development.

---

# Part 1: Backend Study

## 1. `src/server/pom.xml`

This file is the Maven project descriptor. Maven uses it to know:

- project identity
- Java version
- dependencies
- plugins

### Block-by-block explanation

#### XML declaration

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

This tells XML parsers the document format and encoding.

#### `<project ...>`

This opens the Maven project definition and defines the XML namespace and schema.

You do not usually write business logic here. This is configuration.

#### Parent section

```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.2.0</version>
  <relativePath/>
</parent>
```

This gives the project Spring Boot's managed dependency versions and Maven defaults.

Why this matters:

- you avoid manually managing many versions
- Spring Boot keeps its starter ecosystem compatible

#### Project identity

```xml
<groupId>com.aura</groupId>
<artifactId>aura-backend</artifactId>
<version>0.0.1-SNAPSHOT</version>
```

This is the Maven identity of the project.

- `groupId`: organization/package namespace
- `artifactId`: project name
- `version`: current build version

#### Properties

```xml
<properties>
  <java.version>17</java.version>
</properties>
```

This tells Maven and Spring Boot to compile with Java 17 compatibility.

Even though the local JDK may be newer, the code is compiled against Java 17 rules.

#### Dependencies

Each dependency teaches a concept:

- `spring-boot-starter-web`
  Teaches REST APIs, controllers, JSON request/response handling.
- `spring-boot-starter-data-jpa`
  Teaches ORM, repositories, entities, transactions.
- `spring-boot-starter-security`
  Teaches authentication, authorization, filter chains.
- `spring-boot-starter-validation`
  Teaches bean validation using annotations.
- `mysql-connector-j`
  Teaches external database connectivity.
- `jjwt-*`
  Teaches JWT token creation and parsing.
- `spring-boot-starter-test`
  Teaches Spring test bootstrapping.
- `h2`
  Teaches isolated test database usage.

#### Build plugin

```xml
<plugin>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-maven-plugin</artifactId>
</plugin>
```

This plugin makes Spring Boot packaging and execution easier.

It powers commands like:

- `mvn spring-boot:run`
- executable jar packaging

### What to learn here

- what a dependency manager does
- what "starter" dependencies are
- how Java builds are configured

### Exercises

1. Remove `spring-boot-starter-security` and see what compilation/runtime changes happen.
2. Change `java.version` and inspect whether the build still passes.
3. Add a dependency intentionally with a bad version and see Maven fail.

---

## 2. `src/server/src/main/java/com/aura/AuraApplication.java`

```java
@SpringBootApplication
public class AuraApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuraApplication.class, args);
    }
}
```

### Line-by-line meaning

- `package com.aura;`
  Declares the Java package.
- `import org.springframework.boot.SpringApplication;`
  Imports the helper class that starts Spring.
- `import org.springframework.boot.autoconfigure.SpringBootApplication;`
  Imports the main convenience annotation.
- `@SpringBootApplication`
  This is a composed annotation that effectively includes:
  - configuration registration
  - component scanning
  - auto-configuration
- `public class AuraApplication`
  The main application class.
- `public static void main(String[] args)`
  Standard Java entry point.
- `SpringApplication.run(...)`
  Boots the Spring container and starts the web server.

### What to learn here

- how Java applications start
- what dependency injection containers do
- how Spring discovers beans automatically

---

## 3. `src/server/src/main/resources/application.properties`

This is the central runtime configuration file.

### Key properties

#### Application name

```properties
spring.application.name=aura-backend
```

Mostly used for identification/logging.

#### Data source configuration

```properties
spring.datasource.url=...
spring.datasource.username=...
spring.datasource.password=...
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

These tell Spring how to connect to MySQL.

The `${ENV_VAR:default}` syntax means:

- use the environment variable if present
- otherwise use the default value after the colon

This is a very important production pattern.

#### JPA and Hibernate settings

```properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.open-in-view=false
```

Meaning:

- `ddl-auto=update`
  Hibernate updates the schema to match entities.
- `show-sql=true`
  SQL is logged.
- `format_sql=true`
  SQL is printed more readably.
- dialect
  Hibernate knows which SQL flavor to generate.
- `open-in-view=false`
  Prevents lazy-loading during view rendering and keeps boundaries cleaner.

#### JWT settings

```properties
jwt.secret=...
jwt.expiration-ms=86400000
```

The secret signs the token.
The expiration controls token lifetime.

### What to learn here

- externalized configuration
- environment variables
- database config
- auth secret management

### Exercise

Change `jwt.expiration-ms` to a tiny value and observe expired-token behavior.

---

## 4. Config Package

### 4.1 `config/WebConfig.java`

This class customizes Spring MVC behavior.

Key pieces:

- `@Configuration`
  Registers the class as Spring configuration.
- `implements WebMvcConfigurer`
  Lets the class override MVC setup points.
- `addCorsMappings`
  Allows the frontend dev server to call backend APIs from another origin.

Important concept:

Without CORS config, the browser may block frontend requests even if the backend works.

### 4.2 `config/SecurityConfig.java`

This is one of the most educational files in the backend.

It teaches:

- bean registration
- filter chain design
- route authorization
- stateless security
- password hashing

### Read it in sections

#### Class-level annotations

- `@Configuration`
  Registers config.
- `@EnableMethodSecurity`
  Allows security checks at method level if needed later.

#### Constructor-injected dependencies

The class receives:

- `JwtAuthenticationFilter`
- `UserDetailsService`
- `RestAuthenticationEntryPoint`
- `RestAccessDeniedHandler`

This demonstrates dependency injection clearly:

- Spring creates the beans
- Spring supplies them to the constructor
- the config class composes them together

#### `securityFilterChain(HttpSecurity http)`

This method builds the main Spring Security pipeline.

##### `.csrf(csrf -> csrf.disable())`

CSRF is disabled because this app uses JWT bearer tokens, not server-side sessions and browser form posts.

##### `.cors(Customizer.withDefaults())`

Enables CORS support so `WebConfig` can apply.

##### `.exceptionHandling(...)`

Replaces default HTML security error pages with JSON responses.

This is critical for APIs.

##### `.sessionManagement(...STATELESS)`

Tells Spring not to create login sessions.

This is the core rule for JWT auth:

- every request must authenticate itself
- the server does not keep session state

##### `.authorizeHttpRequests(...)`

Defines public vs protected routes.

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/posts/**`
- `GET /api/users/**`

Protected:

- all other routes

This is where you learn practical authorization policy writing.

##### `.authenticationProvider(authenticationProvider())`

Plugs in the username/password authentication provider.

##### `.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`

This is the most important filter-chain rule.

It tells Spring:

- run our JWT filter before the default username/password filter
- if a bearer token is present, authenticate the user early

#### `authenticationProvider()`

Creates `DaoAuthenticationProvider`.

That provider:

- loads users via `UserDetailsService`
- checks passwords with `PasswordEncoder`

#### `authenticationManager(...)`

Exposes Spring's authentication manager for use in `AuthService`.

#### `passwordEncoder()`

Returns `BCryptPasswordEncoder`.

Never store plain-text passwords. This line enforces the secure direction of the app.

### Exercises

1. Make `GET /api/posts/**` protected and test the frontend.
2. Add a role-restricted admin route later.
3. Replace `BCryptPasswordEncoder` with a dummy encoder in a test-only context and observe the difference.

---

## 5. Domain Package

These classes represent persistent business data.

This package teaches Hibernate/JPA mapping.

### 5.1 `domain/Role.java`

```java
public enum Role {
    USER
}
```

This is a Java enum.

Why use an enum:

- strongly typed roles
- safer than raw strings in business logic

### 5.2 `domain/User.java`

This entity models application users.

#### Important annotations

- `@Entity`
  Marks the class as a JPA entity.
- `@Table(name = "users")`
  Maps it to the `users` table.
- `@Id`
  Primary key.
- `@GeneratedValue(strategy = GenerationType.IDENTITY)`
  Database auto-generates the id.
- `@Column(nullable = false, unique = true, length = 50)`
  Adds database-level constraints.
- `@Enumerated(EnumType.STRING)`
  Stores enum names as text rather than ordinal numbers.
- `@PrePersist`
  Runs before the entity is inserted.

#### Field meaning

- `id`
  Primary key.
- `username`
  Unique login identity.
- `displayName`
  Public name shown in UI.
- `password`
  Hashed password.
- `bio`
  Optional profile text.
- `photoUrl`
  Optional image URL.
- `role`
  Security role.
- `createdAt`
  Creation timestamp.

#### `onCreate()`

This method demonstrates lifecycle callbacks:

- fill `createdAt`
- set default role if not already set

### 5.3 `domain/Post.java`

Teaches entity relationships.

#### Most important line

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "author_id", nullable = false)
private User author;
```

Meaning:

- many posts belong to one user
- the foreign key column is `author_id`
- `LAZY` means do not fully load the author until needed

Other fields:

- `imageUrl`
- `caption`
- `likesCount`
- `commentsCount`
- `createdAt`

This class demonstrates a common pattern:

- keep counters directly on the parent record for faster reads

### 5.4 `domain/PostLike.java`

This is a join entity between users and posts.

The unique constraint:

```java
@UniqueConstraint(columnNames = {"post_id", "user_id"})
```

prevents duplicate likes by the same user on the same post.

This is a real production-style data integrity rule.

### 5.5 `domain/Comment.java`

A comment belongs to:

- one post
- one author

It stores:

- content
- timestamp

### 5.6 `domain/Message.java`

A message belongs to:

- one sender
- one recipient

It stores:

- content
- timestamp

### What to learn in this package

- JPA annotations
- primary keys
- foreign keys
- entity lifecycle callbacks
- lazy loading
- schema constraints

### Exercises

1. Add `updatedAt` to `Post`.
2. Add a `title` field to `Post`.
3. Add a `delete` feature and think about cascade behavior.

---

## 6. DTO Package

DTO means Data Transfer Object.

These classes/records define API payload shapes.

Why DTOs exist:

- keep entities separate from API contracts
- avoid leaking internal structure
- control validation and response content

### Auth DTOs

#### `AuthRequest`

Fields:

- `username`
- `password`

Validation:

- not blank
- username regex pattern

This is a strong example of declarative validation.

#### `RegisterRequest`

Fields:

- `username`
- `displayName`
- `password`

Validation teaches:

- `@NotBlank`
- `@Size`
- `@Pattern`

#### `AuthResponse`

Returns:

- `token`
- `user`

This is the backend saying:

- here is who you are
- here is your authentication token

### User DTOs

#### `UpdateProfileRequest`

Optional fields:

- `displayName`
- `bio`
- `photoUrl`

#### `UserResponse`

Exposes safe public user data:

- id
- username
- display name
- bio
- photo URL
- createdAt

Notably absent:

- password

### Post DTOs

#### `PostRequest`

Input for creating posts:

- imageUrl
- caption

#### `PostResponse`

Output for listing posts:

- author identity
- caption
- counters
- timestamp

### Comment DTOs

#### `CommentRequest`

Input:

- content

#### `CommentResponse`

Output:

- post id
- author identity
- content
- createdAt

### Message DTOs

#### `MessageRequest`

Input:

- recipientUsername
- content

#### `MessageResponse`

Output:

- senderUsername
- recipientUsername
- content
- timestamp

#### `ConversationSummaryResponse`

This is a UI-focused DTO.

It gives enough data to render an inbox:

- partner username
- partner display name
- partner photo
- latest message
- latest message time

### What to learn here

- record syntax in Java
- validation annotations
- API contract design
- why request and response types differ

---

## 7. Repository Package

These interfaces teach Spring Data JPA.

The key idea:

You declare repository interfaces.
Spring generates implementations at runtime.

### 7.1 `UserRepository`

Extends:

```java
JpaRepository<User, Long>
```

This automatically gives CRUD operations like:

- `findById`
- `save`
- `delete`
- `findAll`

Custom methods:

- `findByUsername`
- `existsByUsername`
- `findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase`

This teaches query derivation from method names.

### 7.2 `PostRepository`

Also extends `JpaRepository`.

The custom `@Query` teaches JPQL.

Important concepts:

- query parameters
- optional filters
- search across multiple fields
- ordering results

This query is not raw SQL.
It is JPQL, which uses entity names and entity fields.

### 7.3 `PostLikeRepository`

Method:

```java
findByPost_IdAndUser_Id(...)
```

This shows nested-property query derivation:

- `PostLike.post.id`
- `PostLike.user.id`

### 7.4 `CommentRepository`

Method:

```java
findByPost_IdOrderByCreatedAtAsc(...)
```

This shows:

- filtering by relationship field
- ordering results

### 7.5 `MessageRepository`

Two JPQL queries:

- `findConversation`
- `findAllForUser`

These teach custom multi-condition repository queries.

### What to learn here

- interface-based persistence
- CRUD from `JpaRepository`
- derived query methods
- JPQL vs SQL

### Exercises

1. Add pagination to post listing.
2. Add "find all posts by a specific date range".
3. Add "find top 5 most liked posts".

---

## 8. Service Package

This is the heart of business logic.

Controllers should be thin.
Repositories should focus on persistence.
Services coordinate real behavior.

### 8.1 `AuthService`

Teaches:

- registration logic
- password hashing
- credential authentication
- JWT creation

#### Constructor dependencies

- `UserRepository`
- `PasswordEncoder`
- `AuthenticationManager`
- `UserDetailsService`
- `JwtService`
- `UserService`

This is important.
Each dependency represents one responsibility.

#### `register(RegisterRequest request)`

Step-by-step:

1. normalize username
2. check uniqueness
3. build new `User`
4. hash password
5. save user
6. load user details for Spring Security
7. generate JWT
8. return token + user DTO

This one method teaches a lot of backend thinking.

#### `login(AuthRequest request)`

Step-by-step:

1. normalize username
2. call `authenticationManager.authenticate(...)`
3. if credentials fail, Spring throws
4. if they pass, load user details
5. generate JWT
6. return token + user DTO

This method teaches how to use Spring Security without manually comparing passwords.

#### `currentUser(String username)`

Delegates to `UserService`.

This reinforces the layered approach.

### 8.2 `UserService`

Teaches:

- profile reads
- search
- conditional updates
- DTO conversion

#### `profile(...)`

Reads a user and maps to `UserResponse`.

#### `search(...)`

Normalizes input, prevents blank search, uses repository finder.

#### `update(...)`

Demonstrates safe partial updates:

- only update display name if provided and non-blank
- convert blank bio/photo values to `null`
- save and return DTO

#### `findByUsername(...)`

Private helper method.

This is a very useful design habit:

- centralize repeated lookup logic
- centralize 404 behavior

#### `toResponse(...)`

Manual DTO mapping.

Manual mapping is explicit and educational.

### 8.3 `PostService`

Teaches:

- searching posts
- creating posts
- toggling likes
- relation lookups

#### `list(...)`

Normalizes optional filters and delegates to repository search.

#### `get(...)`

Simple lookup + DTO mapping.

#### `create(...)`

Looks up the author by authenticated username.
Builds a post entity.
Stores optional image URL as null if blank.

#### `toggleLike(...)`

This is one of the most instructive methods in the app.

It:

1. loads the post
2. loads the user
3. checks whether a like record exists
4. deletes it if present
5. creates it if absent
6. updates the denormalized like count
7. saves the post

This method teaches:

- many-to-many modeling through join entities
- toggle patterns
- transaction boundaries
- denormalized counters

### 8.4 `CommentService`

Teaches:

- fetching related records
- child-entity creation
- parent counter updates

When creating a comment:

1. verify post exists
2. verify author exists
3. build comment
4. save comment
5. increment post comment count
6. save post
7. map to DTO

### 8.5 `MessageService`

Teaches:

- direct messaging
- self-message validation
- conversation queries
- inbox summarization

#### `send(...)`

Key learning points:

- normalize recipient username
- prevent sending a message to self
- build and save message entity

#### `conversation(...)`

Loads the full message history between two users.

#### `conversations(...)`

This method builds an inbox summary from full message history.

It uses:

- `LinkedHashMap`
  Keeps insertion order
- reverse-ordered repository results
  Means the first message seen for a partner is the latest one
- `putIfAbsent`
  Prevents older messages from overwriting newer summaries

This method is a good pure-Java study example in addition to being a service method.

### What to learn in services

- orchestration logic
- lookups and validation
- transactional boundaries
- exception-driven API flow
- manual DTO mapping

### Exercises

1. Add delete-post logic.
2. Add edit-comment logic.
3. Add unread message counts.
4. Extract mapper helpers into dedicated mapper classes.

---

## 9. Security Package

This package teaches JWT auth in Spring.

### 9.1 `CustomUserDetailsService`

Spring Security expects a `UserDetailsService`.

This class adapts your `User` entity to Spring's security model.

Important method:

```java
loadUserByUsername(String username)
```

It:

1. reads user from repository
2. throws `UsernameNotFoundException` if missing
3. returns Spring Security's built-in `UserDetails` implementation

The granted authority:

```java
"ROLE_" + user.getRole().name()
```

is how Spring expects role strings by default.

### 9.2 `JwtService`

This class teaches token generation and validation.

#### Fields with `@Value`

```java
@Value("${jwt.secret}")
private String secret;
```

This injects property values from configuration.

#### `generateToken(...)`

Builds a JWT containing:

- subject = username
- issuedAt
- expiration
- signature

#### `extractUsername(...)`

Parses token claims and returns the subject.

#### `isTokenValid(...)`

Checks:

- token username matches current user details
- expiration time has not passed

#### `signingKey()`

Decodes the Base64 secret and creates the HMAC signing key.

### 9.3 `JwtAuthenticationFilter`

This class teaches request filtering.

It extends `OncePerRequestFilter`, meaning it runs once per request.

#### Filter flow

1. Read `Authorization` header
2. If header missing or not `Bearer ...`, continue without auth
3. Extract token
4. Parse username from token
5. If no auth is already set in security context:
   - load user details
   - validate token
   - build authentication object
   - store it in `SecurityContextHolder`
6. Continue filter chain

This is one of the most important backend patterns in the app.

### 9.4 `RestAuthenticationEntryPoint`

When a user is not authenticated, Spring Security normally may return a generic response.

This class forces a clean JSON API response.

It teaches:

- custom security error handling
- writing JSON manually via `ObjectMapper`

### 9.5 `RestAccessDeniedHandler`

Similar to the entry point, but for authenticated users who are forbidden from accessing a resource.

Teaches:

- distinction between 401 and 403
- custom API error responses

---

## 10. Exception Package

### `GlobalExceptionHandler`

This class centralizes error handling across controllers.

It uses:

- `@RestControllerAdvice`
  Apply globally to controller errors.
- `@ExceptionHandler(...)`
  Handle specific exception types.

### Important handlers

#### `MethodArgumentNotValidException`

Turns validation failures into:

- HTTP 400
- a map of field errors

This is what powers friendly frontend form errors.

#### `ResponseStatusException`

Lets service/controller code throw application-friendly status codes.

#### `HttpMessageNotReadableException`

Handles malformed JSON.

#### `DataIntegrityViolationException`

Handles database conflicts cleanly.

#### generic `Exception`

Fallback 500 response.

### What to learn here

- centralized exception handling
- API error design
- difference between business errors and server errors

---

## 11. Controller Package

Controllers map HTTP requests to service methods.

They should be small.
This codebase does that well.

### 11.1 `AuthController`

Maps:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

What it teaches:

- `@RestController`
- `@RequestMapping`
- `@PostMapping`
- `@GetMapping`
- `@RequestBody`
- `@Valid`
- `Authentication` injection

`/me` works because Spring Security populates the authenticated principal after JWT validation.

### 11.2 `UserController`

Maps:

- search users
- get profile by username
- update current authenticated user

Important design choice:

`PATCH /api/users/me`

This avoids exposing arbitrary profile updates by username in the controller.

### 11.3 `PostController`

Maps:

- list posts
- get single post
- create post
- toggle like

This is a clean example of REST resource design.

### 11.4 `CommentController`

Nested route:

```text
/api/posts/{postId}/comments
```

This teaches sub-resource design.

### 11.5 `MessageController`

Maps:

- send message
- get conversation summaries
- get one conversation by username

This is a good example of controller methods shaped by frontend needs.

---

## 12. Test Package

### `src/server/src/test/java/com/aura/AuraApplicationTests.java`

This is a context-load smoke test.

What it teaches:

- `@SpringBootTest`
- full application context startup during tests

It does not test business behavior deeply, but it catches:

- broken configuration
- dependency injection issues
- security wiring problems
- bean definition conflicts

### `src/server/src/test/resources/application.properties`

This overrides runtime config for tests.

It switches the backend to:

- H2 in-memory DB
- test JWT settings
- test-friendly schema mode

This is a very important lesson:

test configuration should be isolated from development configuration.

---

# Part 2: Frontend Study

The frontend is simpler than the backend but still teaches solid architecture.

## 13. `src/client/src/main.tsx`

This is the React entry point.

It:

1. imports `StrictMode`
2. imports `createRoot`
3. imports the root `App`
4. imports global CSS
5. mounts React into the `#root` element

This is the frontend equivalent of `AuraApplication.java`.

## 14. `src/client/src/App.tsx`

This file controls routing and top-level UI flow.

### `AppShell`

Reads auth state from context.

If loading:

- show loading screen

Otherwise:

- create router
- show navbar only when user is authenticated
- protect application routes by redirecting to `/auth`

### Route design

- `/auth`
- `/`
- `/search`
- `/messages`
- `/messages/:username`
- `/profile/:username`

This file teaches route-level auth guarding in React.

## 15. `src/client/src/types.ts`

This file teaches TypeScript modeling.

It mirrors backend response shapes:

- `User`
- `AuthResponse`
- `Post`
- `Comment`
- `Message`
- `ConversationSummary`
- API error shape

This is the contract layer between frontend and backend.

When these shapes are correct, frontend logic becomes safer.

## 16. `src/client/src/lib/api.ts`

This is one of the most important frontend files.

It centralizes:

- token storage
- authenticated fetch logic
- API error parsing

### `ApiError`

Custom error class that stores:

- HTTP status
- field-level validation errors

This lets UI code display nice error messages instead of raw failed fetches.

### `getStoredToken()` / `storeToken()`

Simple wrapper around `localStorage`.

Teaches:

- browser persistence
- why auth helpers should be centralized

### `apiRequest<T>(...)`

This generic function teaches a lot:

- how to write reusable fetch wrappers
- how to attach Authorization headers
- how to parse JSON conditionally
- how to throw normalized errors
- how TypeScript generics help with response typing

This file is a frontend analogue of a backend utility/service helper.

## 17. `components/AuthContext.tsx`

This teaches global state with React Context.

### Responsibilities

- store current user
- store loading state
- restore current user from token on app boot
- expose login/signup/logout/refresh functions

### `refreshUser()`

Calls `/api/auth/me`.

If it fails:

- token is cleared
- user becomes null

This is a clean recovery path.

### `login()` and `signup()`

Both:

- call backend auth endpoints
- store returned JWT
- update user state

### `logout()`

Clears the token and resets user state.

This file teaches practical auth-state management in React.

## 18. `components/AuthForm.tsx`

This file teaches:

- controlled inputs
- local form validation
- async submit handling
- field-level error display
- mode switching between login and signup

### Important concepts

- `Mode = 'login' | 'signup'`
- `useState` for form, errors, and submit state
- normalization of username to lowercase
- regex validation before request submission
- catching `ApiError` and showing both general and field errors

This is a very good full-stack learning file because it mirrors backend validation rules.

## 19. `components/Navbar.tsx`

This file teaches:

- route-aware navigation
- reading current URL with `useLocation`
- conditional styling for active links
- logout integration

It is intentionally simple and good for beginners.

## 20. `components/FeedPage.tsx`

Teaches:

- loading data on mount
- modal state
- optimistic-ish UI refresh after create/like
- empty state vs loading state

### Key lessons

- `useEffect` for side effects
- keeping page state local
- calling shared API helper rather than raw fetch

## 21. `components/CreatePostModal.tsx`

Teaches:

- modal rendering via conditional UI
- controlled form fields
- escape-key handling
- click-outside-to-close behavior
- validating required caption before submit

This is a good UI behavior study file.

## 22. `components/PostCard.tsx`

Teaches:

- component props
- reusable presentation components
- composition, because it embeds `CommentSection`
- formatting timestamps

It keeps logic thin and presentation clear.

## 23. `components/CommentSection.tsx`

Teaches:

- conditional data loading when expanding a section
- local error state
- keyboard submit with Enter
- nested resource calls

This is a good example of lazy loading UI data only when the user asks for it.

## 24. `components/ProfilePage.tsx`

Teaches:

- route parameter reading
- parallel data loading with `Promise.all`
- owner vs non-owner behavior
- draft edit state
- patch-style partial updates

Important design:

- it uses the authenticated user from context to decide whether editing is allowed
- it loads the user's posts and profile separately

## 25. `components/SearchPage.tsx`

Teaches:

- debounced search with `setTimeout`
- mode switching between post search and user search
- loading/error/result state separation

This is a clean example of a search page without extra libraries.

## 26. `components/MessagesPage.tsx`

Teaches:

- route-driven conversation selection
- separate inbox list and message thread
- search to start new conversations
- sending messages
- reloading summaries after send

This is useful because it combines:

- list state
- detail state
- compose state
- route state

in one page.

## 27. `src/client/src/index.css`

This file teaches plain CSS architecture.

It contains:

- theme variables in `:root`
- base resets
- reusable layout classes
- shared component classes
- responsive behavior via media queries

### What to learn here

- CSS custom properties
- reusable utility-ish classes
- layout with flex and grid
- responsive breakpoints
- visual consistency through shared classes

This file also demonstrates the benefit of removing repeated inline styles from React components.

---

# Part 3: End-to-End Request Walkthroughs

These are the most important study paths in the whole codebase.

## 28. Walkthrough: User Registration

### Frontend path

1. User fills `AuthForm`
2. `AuthForm` validates username/display name/password
3. `signup(...)` from `AuthContext` is called
4. `apiRequest('/auth/register', ...)` sends JSON

### Backend path

5. `AuthController.register(...)` receives request
6. `@Valid` triggers validation on `RegisterRequest`
7. `AuthService.register(...)` normalizes and checks username
8. password is hashed
9. entity is saved through `UserRepository`
10. JWT is generated
11. `AuthResponse` is returned

### Back to frontend

12. token is stored in localStorage
13. user state is updated
14. app route changes to `/`

### Concepts learned

- form validation
- controller validation
- service orchestration
- password hashing
- repository save
- JWT creation
- auth state persistence

## 29. Walkthrough: Protected Request

Example: create a post.

1. Frontend opens post modal
2. submit triggers `apiRequest('/posts', { method: 'POST', ... })`
3. `apiRequest` adds `Authorization: Bearer ...`
4. backend receives request
5. `JwtAuthenticationFilter` reads token
6. token username is extracted and validated
7. `SecurityContextHolder` gets authentication
8. `PostController.create(...)` receives `Authentication authentication`
9. controller passes username to `PostService`
10. service resolves author and saves post

### Concepts learned

- header-based auth
- request filters
- security context
- authenticated service actions

## 30. Walkthrough: Search

Post or user search teaches:

- frontend debounce
- query parameters
- repository-derived queries
- JPQL search
- result rendering

## 31. Walkthrough: Messaging

1. frontend loads `/messages/conversations`
2. backend builds summaries using `MessageRepository.findAllForUser`
3. frontend opens a specific conversation route
4. backend returns full thread using `findConversation`
5. frontend sends a message
6. backend validates sender and recipient and saves message
7. frontend reloads summary list

This combines repository queries, services, DTOs, routes, and UI state.

---

# Part 4: What This Codebase Teaches About Core Java

Even though this is a Spring app, it teaches a lot of plain Java.

## 32. Core Java Concepts Present Here

### Classes and objects

Every service, controller, entity, and config class is a Java class.

### Interfaces

- `UserDetailsService`
- `JpaRepository`
- `WebMvcConfigurer`

These teach polymorphism and framework contracts.

### Constructors

Constructor injection is everywhere.

This is not just a Spring pattern.
It is also good object-oriented design.

### Enums

`Role` teaches type-safe constants.

### Records

DTOs like `AuthRequest` and `UserResponse` teach concise immutable data carriers.

### Collections

- `List`
- `Map`
- `LinkedHashMap`

These appear in services, repositories, and exception handling.

### Streams

Examples:

- `.stream()`
- `.map(...)`
- `.toList()`

These teach functional-style transformation.

### Exceptions

The whole backend teaches practical exception use.

### Date/time API

`LocalDateTime.now()` teaches Java's modern time API.

### Generics

Seen in:

- `JpaRepository<User, Long>`
- `ResponseEntity<Map<String, Object>>`
- `List<PostResponse>`

### Annotations

This codebase is full of annotations, which is a core part of modern Java frameworks.

---

# Part 5: Full Study Roadmap

This roadmap is designed so someone can grow from beginner to strong junior-level Java full-stack understanding using this repo.

## Phase 1: Core Java Foundation

Study goals:

- classes
- objects
- constructors
- methods
- collections
- exceptions
- enums
- records
- generics

Study in this repo:

- `Role.java`
- DTO records
- service constructors
- mapping methods like `toResponse`
- collection logic in `MessageService`

Exercises:

1. Rewrite one DTO as a normal class instead of a record.
2. Add a utility method to format dates on the backend.
3. Replace one stream pipeline with a loop and compare readability.

## Phase 2: Spring Fundamentals

Study goals:

- dependency injection
- component scanning
- bean lifecycle
- configuration classes

Study in this repo:

- `AuraApplication`
- `SecurityConfig`
- `WebConfig`
- `@Service`
- `@RestController`
- constructor injection everywhere

Exercises:

1. Add a simple `HealthController`.
2. Create a new `@Service` and inject it into a controller.
3. Add a custom configuration property and inject it using `@Value`.

## Phase 3: Spring MVC

Study goals:

- controllers
- request mapping
- path variables
- query params
- request bodies
- validation

Study in this repo:

- all controller classes
- DTO validation annotations

Exercises:

1. Add an endpoint to delete a post.
2. Add an endpoint to list posts by date.
3. Add a global `GET /api/health` endpoint.

## Phase 4: Spring Data JPA + Hibernate

Study goals:

- entities
- repositories
- relationships
- JPQL
- transactions

Study in this repo:

- all entity classes
- all repository interfaces
- all `@Transactional` service methods

Exercises:

1. Add `updatedAt` fields and update them correctly.
2. Add pagination to post list.
3. Add a "recent posts only" query.

## Phase 5: Spring Security + JWT

Study goals:

- authentication
- authorization
- filters
- user details service
- stateless APIs

Study in this repo:

- `SecurityConfig`
- `CustomUserDetailsService`
- `JwtService`
- `JwtAuthenticationFilter`
- `RestAuthenticationEntryPoint`
- `RestAccessDeniedHandler`

Exercises:

1. Add an `ADMIN` role.
2. Restrict a route by role.
3. Add token refresh logic as a new exercise project.

## Phase 6: Error Handling and Validation

Study goals:

- validation annotations
- global exception handling
- structured API errors

Study in this repo:

- DTOs
- `GlobalExceptionHandler`

Exercises:

1. Add custom validation for image URLs.
2. Add better uniqueness-error messages from DB conflicts.
3. Return a request correlation ID in error responses.

## Phase 7: Frontend Integration

Study goals:

- client-server contracts
- token storage
- route protection
- API wrappers
- form and page state

Study in this repo:

- `lib/api.ts`
- `AuthContext.tsx`
- `App.tsx`
- `AuthForm.tsx`
- page components

Exercises:

1. Add loading skeletons.
2. Add toast notifications.
3. Add a "like" visual active state per user.

## Phase 8: Real Project Thinking

Study goals:

- separation of concerns
- layered design
- safe defaults
- code reuse
- maintainability

Questions to ask yourself while reading:

- Why is this in a service and not a controller?
- Why is this a DTO and not an entity?
- Why is this validation done here and not in the frontend only?
- What would break if this code moved to another layer?

---

# Part 6: Recommended Reading Order

If you want the best learning sequence, read files in this order:

1. `src/server/pom.xml`
2. `src/server/src/main/java/com/aura/AuraApplication.java`
3. `src/server/src/main/resources/application.properties`
4. `src/server/src/main/java/com/aura/domain/*`
5. `src/server/src/main/java/com/aura/repository/*`
6. `src/server/src/main/java/com/aura/dto/*`
7. `src/server/src/main/java/com/aura/service/*`
8. `src/server/src/main/java/com/aura/security/*`
9. `src/server/src/main/java/com/aura/config/*`
10. `src/server/src/main/java/com/aura/controller/*`
11. `src/server/src/main/java/com/aura/exception/GlobalExceptionHandler.java`
12. `src/server/src/test/*`
13. `src/client/src/types.ts`
14. `src/client/src/lib/api.ts`
15. `src/client/src/components/AuthContext.tsx`
16. `src/client/src/App.tsx`
17. `src/client/src/components/*`
18. `src/client/src/index.css`

Why this order works:

- start with build and boot
- then learn data model
- then persistence
- then business logic
- then security
- then endpoints
- then tests
- then frontend consumption

---

# Part 7: Questions You Should Be Able To Answer After Studying

If you can answer these clearly, you are learning well.

## Backend

1. Why are DTOs separate from entities?
2. Why is `PasswordEncoder` used in the service instead of storing the raw password?
3. Why does the app use `STATELESS` session policy?
4. What does `JwtAuthenticationFilter` do before the controller runs?
5. Why do repositories extend `JpaRepository`?
6. Why is `@Transactional` placed on service methods?
7. Why is `@PrePersist` useful?
8. Why is there a join entity for likes?
9. Why is `GlobalExceptionHandler` important for APIs?
10. Why is `spring.jpa.open-in-view=false` a good default?

## Frontend

1. Why is there a shared `apiRequest` helper?
2. Why does `AuthContext` own user state?
3. Why are routes redirected when `user` is null?
4. Why is local validation still useful even though the backend validates too?
5. Why is CSS centralized instead of using repeated inline styles?

---

# Part 8: Suggested Expansion Projects

Once you understand this codebase, build one of these next:

1. Add refresh tokens and secure logout.
2. Add file upload instead of photo/image URLs.
3. Add comments deletion and editing.
4. Add post deletion with ownership checks.
5. Add pagination and infinite scroll.
6. Add WebSocket messaging instead of request/response refresh.
7. Add unit tests for services and integration tests for controllers.
8. Add role-based admin moderation endpoints.

---

# Final Advice

Do not study this codebase as a static document.
Study it as a living system.

For every file:

1. Read the imports.
2. Read the annotations.
3. Read the fields.
4. Read the constructor.
5. Read one method.
6. Ask what layer this file belongs to.
7. Ask what the next file in the request flow is.

The strongest way to learn from this repo is:

- run the app
- place breakpoints or logs
- send a request
- trace the exact path through controller -> service -> repository -> database

If you do that repeatedly, this repo becomes a practical Java development course.
