# NestJS Security Library

This NestJS security library provides a comprehensive set of tools and features for securing NestJS applications.
Inspired by Spring Security, it offers various authentication mechanisms and protection against common security threats,
allowing you to secure your web applications quickly and efficiently.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
    - [authentication](#authentication)
    - [authorization](#authorization)
- [Activation](#activation)
    - [Basic Authentication](#basic-authentication)
    - [JWT Authentication](#jwt-authentication)
    - [Session Authentication](#session-authentication)
- [Adding Authorization](#adding-authorization)
    - [Without Authentication](#without-authentication)
    - [With Authentication](#with-authentication)
- [Request Authentication Configuration](#request-authentication-configuration)
    - [Basic Authentication](#basic-authentication)
    - [Digest Authentication](#digest-authentication)
    - [JWT Authentication](#jwt-authentication)
    - [Session Authentication](#session-authentication)
        - [Session Setup](#session-setup)
            - [Use with Express](#use-with-express)
            - [Use with Fastify](#use-with-fastify)
        - [Activation](#activation-1)
        - [Login Form](#login-form)
            - [Default Login Form](#default-login-form)
            - [Custom Login Form](#custom-login-form)
- [Decorators](#decorators)
    - [@Authentication](#authentication-1)
    - [@PreAuthorize](#preauthorize)
- [Tips and Tricks](#tips-and-tricks)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

You can install the library via npm:

```bash
npm install @tbnestjs/security
```

## Features

NestJS Security provides comprehensive support for [authentication](#authentication), [authorization](#authorization).
It also provides multiple authentication mechanisms to suit your application's needs.

### Authentication

Authentication is the process by which we confirm the identity of individuals attempting to access a specific resource.
Typically, users are authenticated by inputting a username and password.
Once authentication is successfully completed, we ascertain the user's identity and can proceed with authorization.

### Authorization

Authorization involves determining which individuals have permission to access specific resources.
NestJS Security enhances security through defense in depth by enabling both request-based authorization and method-based
authorization.

### Activation

To activate security for your NestJS application, you simply need to import and use the appropriate authentication
mechanism.

```typescript
import {
    SecurityConfig,
    SecurityModule,
} from '@tbnestjs/security';

// Use SecurityConfig.builder() to build the security mechanism configuration
const builder = SecurityConfig.builder();

@Module({
    imports: [SecurityModule.forRoot(builder.build())],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
```

We use `SecurityConfig.builder()` to build the security mechanism configuration.

At this stage, all endpoints are secured and there is no way to access them because there is no way to authenticate
requests.
Any attempt to access them without proper authentication will result in a 401 Unauthorized response.

## Adding Authorization

Access control configurations are added via the `builder.httpSecurity().authorize()` function or using decorators, we
will explore the usage of decorators later.

### Without Authentication

While securing all endpoints is crucial for your application, there may be cases where you need to add access to certain
endpoints for everyone.
For example, to allow access to all endpoint that match `/public/(.*)` without authentication.

```typescript
const builder = SecurityConfig.builder();
builder
    .httpSecurity()
    .authorize(
        AuthorizeRequests.builder()
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/public/(.*)').permitAll()
            ),
    );
```

### With Authentication

In some cases, you may need to grant access to specific users based on their roles or authorities. This library
implements Role-Based Access Control (RBAC), leveraging two main concepts: Roles and Authorities, to secure endpoints.

- Roles: Roles represent a set of permissions granted to a user. Users can be assigned one or more roles, and access to
  endpoints is granted based on these roles.
- Authorities: Authorities represent specific permissions granted to a user. Authorities are typically more granular
  than roles and can be used to control access to specific resources or actions.

For example, to restrict access to endpoints to users with a specific roles or authorities:

```typescript
const builder = SecurityConfig.builder();
builder
    .httpSecurity()
    .authorize(
        AuthorizeRequests.builder()
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/admin/(.*)')
                    .hasRole('ADMIN')
            )
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/user')
                    .hasAnyRole('ADMIN', 'USER')
            )
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/user').withMethod(RequestMethod.POST)
                    .hasRole('ADMIN')
                    .hasAuthority('USER_CREATE')
            )
    );
```

In this enhanced example:

- Endpoints matching `/admin/(.*)` are exclusively accessible to users with the `ADMIN` role.
- Endpoints matching `/user` are accessible to users with either the `ADMIN` or `USER` roles.

  However, for POST requests to `/user`(ex. User Creation in a CRUD application), access is restricted.
  Users must possess either the `ADMIN` role or the `USER_CREATE` authority.
- For All other Endpoints are accessible by any authenticated user.

## Request Authentication Configuration

Configuring the authentication mechanisms for requests is a critical aspect of securing your NestJS application. This
library provides convenient options to configure authentication mechanisms, catering to both stateless and stateful
scenarios.

- Stateless authentication mechanisms, such as JWT (JSON Web Token) authentication, do not require the server to
  maintain session state.
  Instead, authentication information is encapsulated within each request, typically in the form of tokens.

  This approach is scalable and suitable for distributed systems.


- Stateful authentication mechanisms, on the other hand, involve maintaining session state on the server.
  This typically requires the use of session cookies or other session management techniques to identify authenticated
  users.

### Basic Authentication

Basic Authentication is a simple stateless authentication scheme built into the HTTP protocol. It involves sending
credentials (
usually username and password) in the HTTP request header.

```typescript
const builder = SecurityConfig.builder();
builder
    .httpSecurity()
    .authorize(
        AuthorizeRequests.builder()
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/admin/*)')
                    .hasRole('ADMIN'),
            ),
    );

builder
    .authenticationBuilder()
    .authenticationProvider(
        builder.provide()
            .basicAuthentication()
            .realm('Nestjs Application')
    )
    .authenticator(
        builder.provide()
            .inMemoryAuthenticator()
            .addUser(
                MemoryAuthentication.with('user', 'password')
                    .withRoles('USER')
            )
            .addUser(
                MemoryAuthentication.with('admin', 'root')
                    .withRoles('ADMIN')
            )
    );
```

> **_NOTE:_** In this example, we utilize builder.provide().inMemoryAuthenticator() as the authenticator to authenticate
> a user with a login and a password.
> This setup is suitable for testing purposes only. In later sections, we will explore how to integrate with databases
> or
> other data storage systems for user authentication.

### Digest Authentication

Digest Authentication is an improvement over Basic Authentication that addresses some of its security shortcomings.
It is a stateless authentication scheme involving sending hashed credentials in the HTTP request header.

```typescript
const builder = SecurityConfig.builder();
builder
    .httpSecurity()
    .authorize(
        AuthorizeRequests.builder()
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/admin/*)')
                    .hasRole('ADMIN'),
            ),
    );

builder
    .authenticationBuilder()
    .authenticationProvider(
        builder.provide()
            .digestAuthentication()
            .realm('Nestjs Application')
            .algorithm('MD5-sess')
            .opaque()
            .qop()
    )
    .authenticator(
        builder.provide()
            .inMemoryAuthenticator()
            .addUser(
                MemoryAuthentication
                    .with('user', 'password')
                    .withRoles('USER')
            )
            .addUser(
                MemoryAuthentication
                    .with('admin', 'root')
                    .withRoles('ADMIN')
            )
    );
```

### JWT Authentication

JWT (JSON Web Token) Authentication is a stateless authentication mechanism where tokens containing user information are
sent with each request. This allows for scalable and efficient authentication in distributed systems.

> **Warning**
> JWT Authentication relies on the "jsonwebtoken" library, which is not installed by default.
> You need to run `npm install jsonwebtoken` to install it before using JWT authentication in your NestJS application.

```typescript
const builder = SecurityConfig.builder();
builder
    .httpSecurity()
    .authorize(
        AuthorizeRequests.builder()
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/admin/*)')
                    .hasRole('ADMIN'),
            ),
    );

builder
    .authenticationBuilder()
    .authenticationProvider(
        builder.provide()
            .jwtTokenAuthentication('the-secret')
            .realm('Nestjs Application')
    )
```

> **_NOTE:_** In JWT Authentication, there is no need for an authenticator because typically, all user information is
> included in the decoded JSON token itself.
> This makes JWT a convenient and scalable authentication solution, particularly for distributed systems.

By default, authorities and roles are extracted from the claims of the decoded JSON token (`claims.roles`
and `claims.authorities`).
However, this behavior can be replaced by using a custom JWT data extractor if needed. This flexibility allows for
customization to fit specific application requirements.

Example:

```typescript 
export class CustomJwtDataExtractor implements JwtDataExtractor {

    getAuthorities(decodedToken: any): string[] {
        // TODO replace the following line depending on your JSON token structure
        return decodedToken?.claims?.authorities || [];
    }

    getRoles(decodedToken: any): string[] {
        // TODO replace the following line depending on your JSON token structure
        return decodedToken?.claims?.roles || [];
    }

    getUsername(decodedToken: any): string {
        // TODO replace the following line depending on your JSON token structure
        return decodedToken?.username;
    }
}

const builder = SecurityConfig.builder();
builder
    .authenticationBuilder()
    .authenticationProvider(
        builder.provide()
            .jwtTokenAuthentication('the-secret')
            .realm('Nestjs Application')
            .jwtTokenParser()
            .dataExtractor(new CustomJwtDataExtractor())
    )

```

### Session Authentication

Session Authentication is a traditional approach where the server maintains the session state for each authenticated
user. It typically involves using session cookies to identify authenticated users.

By default, this library provides a built-in authentication form for session-based authentication. However, you have the
flexibility to disable this default form and use your own custom authentication form if needed.

> **Warning**
> Before starting, you need to configure the session mechanism for your application.
> Please refer to [the official documentation](https://docs.nestjs.com/techniques/session) for detailed instructions on
> configuring sessions.

> **Danger**
> CSRF Vulnerability with Session Authentication
>
> Before using session authentication, please note that it is vulnerable to CSRF (Cross-Site Request Forgery) attacks. To enhance the security of your application, it is highly recommended to enable CSRF protection.
>
> You can enable CSRF protection in your NestJS application by using the CSRF module provided by NestJS. For more information on how to configure CSRF protection, please refer to the official NestJS documentation on [CSRF Protection](https://docs.nestjs.com/security/csrf).

#### Session Setup

HTTP sessions provide a way to store information about the user across multiple requests, which is particularly useful
for MVC applications.

##### Use with Express

First install the required packages:

```shell
npm i express-session
npm i -D @types/express-session
```

Once the installation is complete, apply the express-session middleware as global middleware in your main.ts file:

```typescript
import * as session from 'express-session';
// somewhere in your initialization file
app.use(
    session({
        secret: 'my-secret',
        resave: false,
        saveUninitialized: false,
    }),
);
```

##### Use with Fastify

First install the required package:

```shell
npm i @fastify/secure-session
```

Once the installation is complete, register the fastify-secure-session plugin:

``` typescript
import secureSession from '@fastify/secure-session';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(secureSession, {
  secret: 'averylogphrasebiggerthanthirtytwochars',
  salt: 'mq9hDxBVDbspDR6n',
});
```

#### Activation

Once you've set up the session for your application, you can activate session authentication.
Here's an example of how to activate:

```typescript
const builder = SecurityConfig.builder();
builder
    .httpSecurity()
    .authorize(
        AuthorizeRequests.builder()
            .requestMatcher(
                RequestMatcher
                    .builder()
                    .requestMatcher('/admin/*)')
                    .hasRole('ADMIN'),
            ),
    );

builder
    .authenticationBuilder()
    .authenticationProvider(
        builder
            .provide()
            .sessionAuthentication()
    )
    .authenticator(
        builder.provide()
            .inMemoryAuthenticator()
            .addUser(
                MemoryAuthentication
                    .with('user', 'password')
                    .withRoles('USER')
            )
            .addUser(
                MemoryAuthentication
                    .with('admin', 'root')
                    .withRoles('ADMIN')
            )
    );
```

#### Login Form

By default, this library provides a built-in authentication form for session-based authentication.
However, you have the flexibility to disable this default form and use your own custom authentication form if needed.

##### Default Login Form

The default login form is accessible at the endpoint `/page/login`.
It utilizes the `/auth/login` endpoint for login functionality and provides a separate `/auth/logout` endpoint for
logout.

Additionally, the form allows users to set a redirect URL, not set by default, enabling redirection to a specific page
after login or logout.

These endpoints offer customization options while preserving the default form.

```typescript
const sessionAuthentication = builder.provide().sessionAuthentication();
sessionAuthentication
    .formLogin()
    .loginPage('/custom/page')
    .loginUrl('/custom/login')
    .logoutUrl('/custom/logout')
    .redirectUrl('/home/page');

builder
    .authenticationBuilder()
    .authenticationProvider(
        sessionAuthentication
    );
```

#### Custom Login Form

To utilize a custom login form, you need to deactivate the default one provided by the library and set up endpoints to
handle authentication requests from your custom form.

```typescript
const sessionAuthentication = builder.provide().sessionAuthentication();
sessionAuthentication
    .formLogin()
    .disableDefault();
```

After that we have two options:

Use the default injected `LoginService`. In this case, it's necessary to configure an extractor to retrieve the username
and password from the request.

```typescript
@Controller()
class MyCustomLoginController {

    constructor(
        private loginService: LoginService
    ) {
    }

    @Get('/my/custom/page')
    page(@Authentication() authentication: RequestAuthentication) {
        if (authentication.isAuthenticated()) {
            // TODO Redirect
        }
        // TODO Redirect
    }

    @Get('/my/custom/login')
    login(@Request() request: any, @Response() response: any) {
        this.loginService.login(request, response);
    }

    @Get('/my/custom/logout')
    logout(@Request() request: any, @Response() response: any) {
        this.loginService.logout(request, response);
    }
}

class MyCustomCredentialsExtractor implements CredentialsExtractor<Credentials> {
    // Extract login and password from query params for example
    extract(request: any): Credentials {
        return {
            username: request.query['login'],
            password: request.query['password']
        }
    }
}

sessionAuthentication.credentialsExtractor(new MyCustomCredentialsExtractor());

sessionAuthentication
    .formLogin()
    .loginPage('/my/custom/page')
    .loginUrl('/my/custom/login')
    .logoutUrl('/my/custom/logout');
```

The second option involves disabling the injection of `LoginService` and instead utilizing your own custom
implementation.

```typescript
@Controller()
class MyCustomLoginController {

    constructor(
        private loginService: MyCustomLoginService
    ) {
    }

    @Get('/my/custom/page')
    page(@Authentication() authentication: RequestAuthentication) {
        if (authentication.isAuthenticated()) {
            // TODO Redirect
        }
        // TODO return the form page
    }

    @Get('/my/custom/login')
    login(@Request() request: any, @Response() response: any) {
        this.loginService.login(request, response);
    }

    @Get('/my/custom/logout')
    logout(@Request() request: any, @Response() response: any) {
        this.loginService.logout(request, response);
    }
}

class MyCustomCredentialsExtractor implements CredentialsExtractor<Credentials> {
    // Extract login and password from query params for example
    extract(request: any): Credentials {
        return {
            username: request.query['login'],
            password: request.query['password']
        }
    }
}

sessionAuthentication
    .formLogin()
    .disableDefault()
    .disableLoginService()
    .loginPage('/my/custom/page')
    .loginUrl('/my/custom/login')
    .logoutUrl('/my/custom/logout');
```

### Decorators

Decorators play a vital role in enhancing the functionality of the security library. The library offers two custom
decorators that integrate seamlessly with NestJS.

#### @Authentication

The `@Authentication` decorator is a parameter decorator used to inject the current authentication context into a NestJS
controller method.
This decorator allows you to access information about the authenticated user, including their roles, authorities, and
other relevant details.

```typescript
import {Controller, Get} from '@tbnestjs/common';
import {Authentication} from '@tbnestjs/security';

@Controller('profile')
export class ProfileController {

    @Get('/username')
    getUsername(@Authentication() authentication: RequestAuthentication) {
        return authentication.getUsername();
    }
}
```

#### @PreAuthorize

The `@PreAuthorize` decorator is used to define access control rules directly within a NestJS controller method. This
decorator integrates with the guard system in NestJS, allowing you to specify fine-grained authorization logic based on
user roles, authorities, or other conditions.

```typescript
import {Controller, Get} from '@tbnestjs/common';
import {PreAuthorize} from '@tbnestjs/security';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {
    }

    @Get('reports')
    @PreAuthorize("$.hasRole('ADMIN')")
    getReports() {
        // Access restricted endpoint only for users with the 'ADMIN' role
        return this.adminService.generateReports();
    }

    @Get('settings')
    @PreAuthorize("$.hasRole('ADMIN') And $.hasAuthority('SETTINGS_ACCESS')")
    getSettings() {
        // Access restricted endpoint only for users with the 'SETTINGS_ACCESS' authority
        return this.adminService.getSettings();
    }
}
```

By default, the available functions with $. syntax within the `@PreAuthorize` decorator are `hasRole`, `hasAnyRole`,
`hasAuthority`, `hasAnyAuthority`, and you can combine them using `AND`, `And`, `and`, `OR`, `Or`, `or` for conditions. However, you can
add custom functions, which will be covered in the customization section. Using these functions, you can define
sophisticated access control rules tailored to your application's requirements.

### Tips and Tricks

Here are some helpful tips and tricks for using the security library effectively.

// TBD

## Examples

// TBD

## Contributing

// TBD

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.