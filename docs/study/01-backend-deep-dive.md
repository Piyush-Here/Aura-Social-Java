# Backend Deep Dive

This document explains the Spring Boot backend at a closer level than the main study plan.

It focuses on:

- what each file is for
- what each major block is doing
- why the code is written in that layer
- what Java and Spring concepts each file teaches

The backend root is:

`src/server/src/main/java/com/aura`

---

## 1. Entry Point: `AuraApplication.java`

Source:

```java
package com.aura;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuraApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuraApplication.class, args);
    }
}
```

### What each line teaches

`package com.aura;`

- Every Java class belongs to a package.
- Packages prevent naming collisions and organize code.
- This package is also important for Spring component scanning.

`import org.springframework.boot.SpringApplication;`

- Java imports let you use classes from other packages without typing the full name each time.
- `SpringApplication` is Spring Boot's startup helper.

`import org.springframework.boot.autoconfigure.SpringBootApplication;`

- This annotation is a convenience bundle.
- It combines multiple Spring annotations into one entry-point annotation.

`@SpringBootApplication`

- Tells Spring Boot this is the main application class.
- Enables component scanning below `com.aura`.
- Enables auto-configuration based on classpath contents.

`public class AuraApplication`

- A normal Java class.
- Spring Boot uses it as the root boot class.

`public static void main(String[] args)`

- The classic Java program entry point.
- `public`: accessible to the JVM launcher.
- `static`: can be called without creating an object.
- `void`: returns nothing.
- `String[] args`: command-line arguments.

`SpringApplication.run(AuraApplication.class, args);`

- Builds the Spring application context.
- Starts the embedded web server.
- Scans for controllers, services, repositories, and configs.
- Applies auto-configuration.

### What to remember

This file is small because the real work is delegated to Spring.

That is an important lesson in framework-based development:

- entry points stay tiny
- application behavior is composed by configuration and beans

---

## 2. Runtime Configuration: `application.properties`

This file controls how the app behaves without changing Java code.

### Data source settings

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/aura_social?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:root}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### What this teaches

- Spring resolves configuration properties at startup.
- Environment variables are preferred over hardcoded values.
- Local defaults exist for developer convenience.
- The JDBC URL contains multiple database options:
  - `createDatabaseIfNotExist=true`
  - `useSSL=false`
  - `allowPublicKeyRetrieval=true`
  - `serverTimezone=UTC`

This is a good example of "configuration over code."

### JPA settings

```properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.open-in-view=false
```

### Why each line exists

`ddl-auto=update`

- Hibernate compares entities to the schema and updates the schema.
- Good for development.
- Risky for serious production schema management.

`show-sql=true`

- Logs SQL statements to help debugging and learning.

`format_sql=true`

- Makes logged SQL readable.

`hibernate.dialect`

- Tells Hibernate which database flavor it is targeting.

`open-in-view=false`

- Prevents lazy loading from leaking beyond the service layer.
- Encourages clearer transaction boundaries.

### JWT settings

```properties
jwt.secret=...
jwt.expiration-ms=86400000
```

These are consumed by `JwtService`.

Important concept:

- application configuration can be injected directly into beans using `@Value`

---

## 3. Config Package

The `config` package defines how Spring and MVC should behave.

### 3.1 `WebConfig.java`

Source purpose:

- allow frontend dev servers to call backend APIs

Key code:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
```

### Why this matters

`@Configuration`

- tells Spring to treat this class as configuration

`implements WebMvcConfigurer`

- gives hooks into MVC setup without replacing the whole MVC system

### CORS method

```java
registry.addMapping("/api/**")
    .allowedOriginPatterns("http://localhost:3000", "http://localhost:5173", "http://localhost:*")
    .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
    .allowedHeaders("*");
```

### What is happening

- only `/api/**` routes get this policy
- local frontend origins are allowed
- standard REST methods are allowed
- all headers are allowed

This teaches browser/backend integration more than Java syntax.

### 3.2 `SecurityConfig.java`

This is one of the best files to study repeatedly.

#### Constructor dependencies

```java
private final JwtAuthenticationFilter jwtAuthenticationFilter;
private final UserDetailsService userDetailsService;
private final RestAuthenticationEntryPoint authenticationEntryPoint;
private final RestAccessDeniedHandler accessDeniedHandler;
```

### Why these fields are `final`

- They are set once through the constructor.
- They should not change after object creation.
- This is a common immutability pattern in Java services/config classes.

### Constructor injection

```java
public SecurityConfig(...)
```

Spring sees this constructor and injects the required beans.

This teaches:

- inversion of control
- dependency injection
- why framework code can stay decoupled

### `securityFilterChain(HttpSecurity http)`

This method builds the security pipeline.

#### CSRF disabled

```java
.csrf(csrf -> csrf.disable())
```

This uses lambda-based configuration.

Meaning:

- do not require CSRF tokens
- suitable here because the app uses bearer tokens, not cookie session auth

#### CORS enabled

```java
.cors(Customizer.withDefaults())
```

- activates CORS support
- allows `WebConfig` to participate

#### Exception handling

```java
.exceptionHandling(ex -> ex
    .authenticationEntryPoint(authenticationEntryPoint)
    .accessDeniedHandler(accessDeniedHandler)
)
```

Meaning:

- if a request is unauthenticated, return JSON through `RestAuthenticationEntryPoint`
- if a request is forbidden, return JSON through `RestAccessDeniedHandler`

This is essential for API-first apps.

#### Stateless session policy

```java
.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
```

Meaning:

- do not create server-side login sessions
- each request must authenticate itself

This is the backbone of JWT auth.

#### Route rules

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/error").permitAll()
    .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/posts/**", "/api/users/**").permitAll()
    .anyRequest().authenticated()
)
```

This is the access policy of the application.

Study it carefully because it answers:

- what is public
- what is protected
- which routes the frontend can access before login

#### Authentication provider

```java
.authenticationProvider(authenticationProvider())
```

Spring Security needs a provider to verify username and password.

#### JWT filter ordering

```java
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
```

Meaning:

- process bearer tokens before the default username/password filter

That ordering matters.
If the filter ran too late, security context would not be set in time.

### Bean methods

#### `authenticationProvider()`

Creates a `DaoAuthenticationProvider`.

This provider knows:

- how to load a user
- how to compare passwords

#### `authenticationManager(...)`

Exposes the manager for `AuthService`.

#### `passwordEncoder()`

Creates `BCryptPasswordEncoder`.

This teaches a critical production rule:

- password storage should be one-way hashed

---

## 4. Domain Package

The `domain` package maps Java objects to database tables.

### 4.1 `Role.java`

```java
public enum Role {
    USER
}
```

This is the simplest file in the backend, but it matters.

Why:

- it makes user roles type-safe
- it avoids raw magic strings
- it integrates cleanly with Spring Security

### 4.2 `User.java`

This file teaches the most JPA basics.

#### Class annotations

```java
@Entity
@Table(name = "users")
```

Meaning:

- `User` is a persistent JPA entity
- it maps to the `users` table

#### Primary key

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

What this teaches:

- each row needs a primary key
- the database auto-generates it
- `Long` is used instead of primitive `long` because entities often begin with null ids before persistence

#### Username field

```java
@Column(nullable = false, unique = true, length = 50)
private String username;
```

This is both a Java field and a schema rule.

It teaches:

- validation is not only for controllers
- schema constraints matter too
- unique usernames are enforced at DB level

#### `displayName`, `password`, `bio`, `photoUrl`

Each field shows how to encode business constraints directly in entity metadata.

#### Role mapping

```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private Role role;
```

Why `STRING` matters:

- safer than ordinal storage
- database stores `USER` instead of `0`
- adding enum values later is less dangerous

#### Creation timestamp

```java
@Column(nullable = false, updatable = false)
private LocalDateTime createdAt;
```

This teaches:

- timestamps should often be non-null
- creation time should not be editable

#### Lifecycle callback

```java
@PrePersist
public void onCreate() {
    createdAt = LocalDateTime.now();
    if (role == null) {
        role = Role.USER;
    }
}
```

This method runs before insertion.

It teaches:

- entity lifecycle hooks
- default values at persistence time
- encapsulating persistence-related setup inside the entity

#### Getters and setters

This class uses classic JavaBean style accessors.

Important lesson:

- many Java frameworks still depend on this style
- modern Java records are great, but mutable JPA entities often still use fields + getters/setters

### 4.3 `Post.java`

This file introduces entity relationships.

#### Author relationship

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "author_id", nullable = false)
private User author;
```

This teaches several advanced ideas at once:

- many posts can belong to one user
- the foreign key is `author_id`
- `LAZY` loading delays fetching the author until needed
- `optional = false` means a post must have an author

#### Count fields

```java
private int likesCount;
private int commentsCount;
```

These are denormalized counters.

Why keep them:

- faster reads for feed views
- easier frontend display

Tradeoff:

- service code must update them correctly

### 4.4 `PostLike.java`

This class models a like as a separate entity.

Why not store an array inside `Post`?

- relational databases work best with normalized join data
- one user can like many posts
- one post can be liked by many users

This is a classic many-to-many relationship modeled explicitly.

#### Unique constraint

```java
@Table(name = "post_likes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"post_id", "user_id"})
})
```

This is one of the most educational lines in the backend.

It teaches:

- data integrity belongs in the database too
- even if app code has a bug, the DB still prevents duplicate likes

### 4.5 `Comment.java`

This is a child entity of both `Post` and `User`.

Important relationships:

- each comment belongs to exactly one post
- each comment has exactly one author

This file reinforces relationship mapping.

### 4.6 `Message.java`

This is similar to `Comment` structurally but models user-to-user communication.

Important business interpretation:

- `sender` and `recipient` are both `User`
- the difference comes from the meaning of the field, not from different types

That is a good modeling lesson.

---

## 5. DTO Package

The DTO package teaches how API models differ from persistence models.

### Why DTOs exist in this app

- entities model database structure
- DTOs model API contracts
- validation is usually attached to input DTOs
- response DTOs prevent accidental leakage of sensitive fields

### 5.1 `dto/auth/AuthRequest.java`

Key ideas:

- uses a Java `record`
- input is immutable after construction
- validation rules are attached directly to fields

```java
@NotBlank(message = "Username is required")
@Pattern(
    regexp = "^[a-z0-9_.-]+$",
    message = "Username can only contain lowercase letters, numbers, dot, underscore, and hyphen"
)
String username
```

This teaches:

- declarative validation
- regex-based business rules
- alignment with frontend validation

### 5.2 `dto/auth/RegisterRequest.java`

This expands the same ideas:

- username validation
- display name length rules
- password minimum and maximum lengths

This is a good place to study how backend validation is more trustworthy than frontend-only validation.

### 5.3 `dto/auth/AuthResponse.java`

```java
public record AuthResponse(
    String token,
    UserResponse user
) {
}
```

Simple but important:

- the login/register response returns both auth state and user profile
- this reduces extra frontend requests right after login

### 5.4 User DTOs

#### `UpdateProfileRequest`

All fields are optional.

This teaches PATCH-like thinking:

- missing fields mean "do not change"
- present fields mean "update this"

#### `UserResponse`

This is the public shape of a user.

Notice what is missing:

- password
- role

That is intentional API design.

### 5.5 Post DTOs

#### `PostRequest`

This validates:

- optional image URL length
- required caption
- caption max length

#### `PostResponse`

This response is already shaped for UI use.

It includes:

- author display info
- content
- counts
- timestamp

The frontend does not need to perform joins itself.

### 5.6 Comment DTOs

#### `CommentRequest`

Only contains the content field because the server derives author identity from authentication.

This teaches an important API rule:

- never trust the client to tell you who the author is

#### `CommentResponse`

Includes author info and post id so the UI can render comments directly.

### 5.7 Message DTOs

#### `MessageRequest`

The client only sends:

- target username
- message content

Again, sender identity comes from the token, not the request body.

#### `MessageResponse`

This returns enough information to render a thread.

#### `ConversationSummaryResponse`

This is designed for the conversation list UI and saves the frontend from building summaries manually.

---

## 6. Repository Package

Repositories are the persistence abstraction layer.

### 6.1 `UserRepository`

```java
public interface UserRepository extends JpaRepository<User, Long>
```

This line alone gives a lot:

- CRUD operations
- pagination support if needed later
- query abstraction

Custom methods:

- `findByUsername`
- `existsByUsername`
- `findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase`

These names are long on purpose.
Spring parses them and generates queries automatically.

Learning takeaway:

- method names can encode query intent in Spring Data

### 6.2 `PostRepository`

This one uses JPQL instead of method-name derivation.

Why:

- the search rules are more complex
- optional query params are involved
- multiple fields are searched

Key idea:

```java
select p from Post p
```

This is JPQL, not raw SQL.

- `Post` is the entity class
- `p.author.username` navigates entity relationships

This teaches object-oriented query thinking.

### 6.3 `PostLikeRepository`

```java
Optional<PostLike> findByPost_IdAndUser_Id(Long postId, Long userId);
```

This teaches nested property traversal in derived query methods.

### 6.4 `CommentRepository`

```java
List<Comment> findByPost_IdOrderByCreatedAtAsc(Long postId);
```

This teaches:

- relation-based filtering
- explicit sort direction in query method names

### 6.5 `MessageRepository`

The custom queries here are worth careful study.

#### `findConversation`

This finds messages in either direction between two users.

That teaches:

- OR logic in JPQL
- how to model conversations from directional messages

#### `findAllForUser`

This returns all messages touching one user, newest first.

That ordering is later used by the service to build summaries efficiently.

---

## 7. Service Package

If you want to understand the real behavior of the app, spend the most time here.

### Why services are important

Controllers should map HTTP to method calls.
Repositories should talk to the database.
Services should hold business rules.

This project mostly follows that rule.

### 7.1 `AuthService`

#### `register(...)`

Read this method as a story:

1. normalize the username
2. reject duplicates
3. build entity
4. hash password
5. save user
6. load security user
7. generate JWT
8. return API response

Important design lesson:

- `passwordEncoder.encode(...)` is not optional security polish
- it is required core business logic

#### `login(...)`

This method is interesting because it does not compare passwords manually.

Instead:

```java
authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(username, request.password())
);
```

That line hands the verification process to Spring Security infrastructure.

Why that is good:

- avoids reimplementing auth logic
- reuses configured provider and encoder
- centralizes authentication rules

#### `currentUser(...)`

Simple delegation, but useful as a design example.

It keeps controller logic minimal and keeps profile lookup behavior inside the service layer.

### 7.2 `UserService`

#### `profile(...)`

Loads one user and maps to `UserResponse`.

Important lesson:

- service methods can stay small and still be valuable if they establish boundaries

#### `search(...)`

Returns empty list for blank queries instead of throwing.

This is a subtle good API design choice:

- blank search is not an exceptional state

#### `update(...)`

This method teaches partial update logic.

Notice the difference between:

- `null`
- blank string
- meaningful value

That distinction matters a lot in real APIs.

`bio` and `photoUrl` convert blank strings to `null`.

That means:

- empty input clears the optional field

This is a very practical design pattern.

#### `findByUsername(...)`

A private helper that centralizes not-found behavior.

This prevents repetitive lookup code across methods.

#### `toResponse(...)`

Manual mapping teaches exactly what data leaves the service layer.

### 7.3 `PostService`

#### `list(...)`

Normalizes optional filters and calls repository search.

This teaches input normalization before database access.

#### `get(...)`

Simple not-found handling + DTO mapping.

#### `create(...)`

Key lessons:

- authenticated username is trusted, not request body author data
- optional image URL is normalized through `blankToNull(...)`
- post ownership is established server-side

#### `toggleLike(...)`

This is one of the best study methods in the codebase.

Read it slowly:

1. load post
2. load user
3. check for existing like record
4. if present: delete like, decrement counter
5. if absent: create like, increment counter
6. save post
7. return updated DTO

Important concepts:

- state toggle pattern
- join entity management
- denormalized counter maintenance
- use of `ifPresentOrElse`

### 7.4 `CommentService`

#### `listByPost(...)`

Fetches comments ordered oldest-to-newest.

This is a UI-friendly default because comments render naturally in chronological order.

#### `create(...)`

Teaches multi-entity orchestration:

- load post
- load author
- create comment
- persist comment
- update parent counter

This is a simple but real transactional workflow.

### 7.5 `MessageService`

#### `send(...)`

Key lesson:

- sender comes from auth
- recipient comes from request

The service also prevents self-messaging:

```java
if (sender.getUsername().equals(recipient.getUsername())) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot send a message to yourself");
}
```

This is a clean example of service-layer business validation.

#### `conversation(...)`

Loads all messages exchanged between two users.

#### `conversations(...)`

This method deserves extra attention because it mixes persistence results with plain Java collection logic.

It uses:

- `LinkedHashMap`
- a `for` loop
- conditional partner selection
- `putIfAbsent`

Why `putIfAbsent` works:

- the repository returns newest messages first
- the first message encountered for each partner is the latest one
- later, older messages are ignored

This is a very good "Java logic inside a service" example.

---

## 8. Security Package

### 8.1 `CustomUserDetailsService`

Spring Security needs a `UserDetailsService`.

This class converts application users into security users.

Key line:

```java
return new org.springframework.security.core.userdetails.User(
    user.getUsername(),
    user.getPassword(),
    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
);
```

This teaches:

- adapting one domain model to another
- authority construction
- why role naming conventions matter

### 8.2 `JwtService`

This class is pure security utility logic.

#### `generateToken(...)`

Teaches:

- claim creation
- token signing
- expiration timestamps

#### `extractUsername(...)`

Teaches how to read token claims.

#### `isTokenValid(...)`

Teaches validation logic:

- same user
- not expired

#### `signingKey()`

Teaches a practical cryptography integration detail:

- secrets are stored Base64-encoded
- they are decoded before key construction

### 8.3 `JwtAuthenticationFilter`

This file is critical to understanding stateless auth.

Read its flow in order:

1. look for `Authorization`
2. ignore request if no bearer token
3. parse token
4. extract username
5. avoid re-authenticating if context already has auth
6. load user details
7. validate token
8. build `UsernamePasswordAuthenticationToken`
9. store it in `SecurityContextHolder`
10. continue the filter chain

This teaches the real mechanics behind "logged in with JWT."

### 8.4 `RestAuthenticationEntryPoint`

This class is only a few lines long, but it solves a real API problem:

- browsers and frontend apps need JSON, not HTML error pages

It uses `ObjectMapper` directly to write JSON to the response stream.

### 8.5 `RestAccessDeniedHandler`

Same idea, but for 403 responses.

This teaches the difference between:

- unauthenticated
- authenticated but forbidden

That distinction is fundamental in security design.

---

## 9. Exception Handling

### `GlobalExceptionHandler`

Study this class as a response-normalization layer.

#### Validation handler

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
```

This converts validation failures into structured field maps.

That is why the frontend can show specific input errors.

#### Response status handler

This passes through application errors raised with `ResponseStatusException`.

This pattern is used throughout the services.

#### Malformed JSON handler

This is important for robustness:

- bad JSON should not become an ugly generic 500

#### Data integrity handler

This catches DB conflicts and returns a `409`.

#### Generic exception handler

Acts as the final fallback.

This is important in any API:

- every exception should become a controlled response

---

## 10. Controller Package

Controllers are the HTTP surface of the backend.

### 10.1 `AuthController`

Key teaching points:

- `@RequestBody` maps JSON into DTOs
- `@Valid` triggers validation before service logic runs
- `Authentication` can be injected directly for authenticated routes

Each method is intentionally thin:

- controller receives request
- service does real work
- controller returns DTO

That is good layering.

### 10.2 `UserController`

Notice the route design:

- `/search`
- `/{username}`
- `/me`

This is a good example of API naming:

- public read routes use usernames
- self-update uses `/me`

### 10.3 `PostController`

Notice the split between:

- list/get
- create
- like action

This is a useful REST compromise:

- create is a resource creation
- like is modeled as an action on a resource

### 10.4 `CommentController`

Nested resources teach hierarchical API design:

- comments are subordinate to posts in the URL structure

### 10.5 `MessageController`

This controller is shaped around the UI:

- list conversation summaries
- fetch one conversation
- send one message

That is a good reminder that API design often follows use cases, not pure theory.

---

## 11. Test Files

### `AuraApplicationTests.java`

This is a smoke test.

It does not assert business behavior.
It asserts that the application context starts successfully.

That catches:

- broken configuration
- bean conflicts
- miswired security
- repository parsing errors

### `src/test/resources/application.properties`

This file teaches environment isolation for tests.

It switches the app to:

- H2 in-memory database
- test JWT values
- create-drop schema mode

Without this file, tests would depend on local MySQL and be much less reliable.

---

## 12. Backend Study Exercises

To go deeper, make these changes yourself:

1. Add `ADMIN` to `Role`.
2. Add an admin-only controller route.
3. Add `DELETE /api/posts/{postId}` with ownership checks.
4. Add edit support for comments.
5. Add a service-level rule that blocks captions shorter than 3 characters even if validation passes.
6. Add repository pagination to post list.
7. Write a real test for `AuthService.register(...)`.

If you can implement those correctly, you are moving from code reading into actual Java backend engineering.
