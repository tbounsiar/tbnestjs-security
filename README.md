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
    - [Authentication Injection](#authentication-injection)
    - [Custom Authentication Provider](#custom-authentication-provider)
    - [Custom Authenticator](#custom-authenticator)
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
  imports: [SecurityModule.forRoot(builder)],
  controllers: [HomeController],
  providers: [HomeService],
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
import { AuthorizeRequests, RequestMatcher, SecurityConfig } from '@tbnestjs/security';

const builder = SecurityConfig.builder();
builder
  .httpSecurity()
  .authorize(
    AuthorizeRequests.with()
      .requestMatcher(
        RequestMatcher.match('/public/(.*)').permitAll()
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
import { AuthorizeRequests, RequestMatcher, SecurityConfig } from '@tbnestjs/security';
import { RequestMethod } from '@nestjs/common';

const builder = SecurityConfig.builder();
builder
  .httpSecurity()
  .authorize(
    AuthorizeRequests.with()
      .requestMatcher(
        RequestMatcher.match('/admin/(.*)').hasRole('ADMIN')
      )
      .requestMatcher(
        RequestMatcher.match('/user').hasAnyRole('ADMIN', 'USER')
      )
      .requestMatcher(
        RequestMatcher.match('/user')
          .withMethod(RequestMethod.POST)
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
import { MemoryAuthentication, Provider, RequestMatcher, SecurityConfig } from '@tbnestjs/security';

const builder = SecurityConfig.builder();
builder
  .httpSecurity()
  .authorize(
    AuthorizeRequests.with()
      .requestMatcher(
        RequestMatcher.match('/admin/*)').hasRole('ADMIN')
      )
  );

builder
  .authenticationBuilder()
  .authenticationProvider(
    Provider.basicAuthentication()
      .realm('Nestjs Application')
  )
  .authenticator(
    Provider.inMemoryAuthenticator()
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
import { AuthorizeRequests, MemoryAuthentication, Provider, RequestMatcher, SecurityConfig } from '@tbnestjs/security';

const builder = SecurityConfig.builder();
builder
  .httpSecurity()
  .authorize(
    AuthorizeRequests.with()
      .requestMatcher(
        RequestMatcher.match('/admin/*)').hasRole('ADMIN')
      )
  );

builder
  .authenticationBuilder()
  .authenticationProvider(
    Provider
      .digestAuthentication()
      .realm('Nestjs Application')
      .algorithm('MD5-sess')
      .opaque()
      .qop()
  )
  .authenticator(
    Provider
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
> Default JWT Authentication relies on the `jsonwebtoken` library, which is not installed by default.
> You need to run `npm install jsonwebtoken` to install it before using JWT authentication in your NestJS application.

```typescript
import { AuthorizeRequests, Provider, RequestMatcher, SecurityConfig } from '@tbnestjs/security';

const builder = SecurityConfig.builder();
builder
  .httpSecurity()
  .authorize(
    AuthorizeRequests.with()
      .requestMatcher(
        RequestMatcher.match('/admin/*)').hasRole('ADMIN')
      )
  );

builder
  .authenticationBuilder()
  .authenticationProvider(
    Provider
      .jwtTokenAuthentication()
      .secret('the-secret')
      .realm('Nestjs Application')
  );
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
import { JwtDataExtractor, JwtTokenParser, Provider, SecurityConfig } from '@tbnestjs/security';

class CustomJwtDataExtractor implements JwtDataExtractor {

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

const tokenParser = new JwtTokenParser('the-secret');
tokenParser.jwtDataExtractor(new CustomJwtDataExtractor());

const builder = SecurityConfig.builder();
builder
  .authenticationBuilder()
  .authenticationProvider(
    Provider
      .jwtTokenAuthentication()
      .tokenParser(tokenParser)
      .realm('Nestjs Application')
  );
```

If you prefer not to use the `jsonwebtoken` library provided by default, you can implement your custom JWT token parser
in NestJS Security.
This allows you to have more control over how JWT tokens are parsed and validated in your application.

Here's an example of how you can implement a custom JWT token parser:

```typescript
import { Provider, SecurityConfig, TokenParser } from '@tbnestjs/security';

export class MyJwtTokenParser implements TokenParser {

  parse(token: string): RequestAuthentication {
    // TODO implement your jwt token parsing here
    return requestAuthentication;
  }
}

const builder = SecurityConfig.builder();
builder
  .authenticationBuilder()
  .authenticationProvider(
    Provider
      .jwtTokenAuthentication()
      .tokenParser(new MyJwtTokenParser())
      .realm('Nestjs Application')
  );
```

### Session Authentication

Session Authentication is a traditional approach where the server maintains the session state for each authenticated
user. It typically involves using session cookies to identify authenticated users.

By default, this library provides a built-in authentication form for session-based authentication. However, you have the
flexibility to disable this default form and use your own custom authentication form if needed.

> **_Warning_**
> Before starting, you need to configure the session mechanism for your application.
> Please refer to [the official documentation](https://docs.nestjs.com/techniques/session) for detailed instructions on
> configuring sessions.

> **_Danger_**
> CSRF Vulnerability with Session Authentication
>
> Before using session authentication, please note that it is vulnerable to CSRF (Cross-Site Request Forgery) attacks.
> To enhance the security of your application, it is highly recommended to enable CSRF protection.
>
> This library offers built-in CSRF protection to enhance the security of your NestJS application.
>
> However, if you prefer to use a different CSRF protection solution or customize the CSRF handling,
> you can refer to the official documentation for more options and details on implementation.
> Visit the official NestJS documentation for guidance on [CSRF Protection](https://docs.nestjs.com/security/csrf).

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
import { AuthorizeRequests, MemoryAuthentication, Provider, SecurityConfig } from '@tbnestjs/security';

const builder = SecurityConfig.builder();
builder
  .httpSecurity()
  .authorize(
    AuthorizeRequests.with()
      .requestMatcher(
        RequestMatcher.match('/admin/*)').hasRole('ADMIN')
      )
  );

builder
  .authenticationBuilder()
  .authenticationProvider(
    Provider.sessionAuthentication()
  )
  .authenticator(
    Provider
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
import { FormLogin, Provider, SecurityConfig } from '@tbnestjs/security';

const sessionAuthentication = Provider.sessionAuthentication();
sessionAuthentication
  .formLogin()
  .loginPage('/custom/page')
  .loginUrl('/custom/login')
  .logoutUrl('/custom/logout')
  .redirectUrl('/home/page');

const builder = SecurityConfig.builder();
builder
  .authenticationBuilder()
  .authenticationProvider(
    sessionAuthentication
  );
```

#### Custom Login Form

To use a custom login form, you need to deactivate the default one provided by the library and set up endpoints to
handle authentication requests from your custom form.

```typescript
import { Provider } from '@tbnestjs/security';

const sessionAuthentication = Provider.sessionAuthentication();
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

// CredentialsExtractor example, depending on your fogin form
// In this example, the login is the email sent using query param, the password is sent via query param also
const myCredentialsExtractor = (request: any) => {
  return {
    username: request.query['email'],
    password: request.query['password']
  };
}


sessionAuthentication.credentialsExtractor(myCredentialsExtractor);

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

  @Get('/my/custom/page')
  page(@Authentication() authentication: RequestAuthentication) {
    if (authentication.isAuthenticated()) {
      // TODO Redirect
    }
    // TODO return the form page
  }

  @Get('/my/custom/login')
  login(@Request() request: any, @Response() response: any) {
    // TODO login;
  }

  @Get('/my/custom/logout')
  logout(@Request() request: any, @Response() response: any) {
    // TODO logout;
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

> **_Note:_** It's important to define `loginPage`, `loginUrl`, and `logoutUrl` to ensure that these endpoints are
> authorized by the HTTP security configuration.

### Decorators

Decorators play a vital role in enhancing the functionality of the security library. The library offers two custom
decorators that integrate seamlessly with NestJS.

#### @Authentication

The `@Authentication` decorator is a parameter decorator used to inject the current authentication context into a NestJS
controller method.
This decorator allows you to access information about the authenticated user, including their roles, authorities, and
other relevant details.

```typescript
import { Controller, Get } from '@tbnestjs/common';
import { Authentication } from '@tbnestjs/security';

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
import { Controller, Get } from '@tbnestjs/common';
import { PreAuthorize } from '@tbnestjs/security';

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
`hasAuthority`, `hasAnyAuthority`, and you can combine them using `AND`, `And`, `and`, `OR`, `Or`, `or` for conditions.
However, you can
add custom functions, which will be covered in the customization section. Using these functions, you can define
sophisticated access control rules tailored to your application's requirements.

### Tips and Tricks

Here are some helpful tips and tricks for using the security library effectively.

#### Authentication Injection

The Authentication instance is injected with request scope, enabling its accessibility within any provider or
component handling the incoming request. This ensures that authentication details are readily available throughout the
request lifecycle, empowering developers to implement custom logic or perform authentication-related operations
seamlessly across different parts of their NestJS application.

```typescript
import { RequestAuthentication } from '@tbnestjs/security';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestService {
  constructor(private authentication: RequestAuthentication) {
  }
}
```

#### Custom Authentication Provider

NestJS Security provides flexibility for implementing custom authentication providers tailored to your application's
specific requirements. This enables you to integrate various authentication mechanisms beyond the ones provided
out-of-the-box, allowing for seamless integration with existing systems or services.

```typescript
import { AuthenticationProvider, RequestAuthenticationProvider, SecurityConfig } from '@tbnestjs/security';
import { Controller, Injectable, Param } from '@nestjs/common';
import { PreAuthorize } from './pre-authorize.decorator';

export interface MyAuthentication extends Authentication {
  organisations: number[];
}

export class MyRequestAuthentication extends RequestAuthenticationImpl<MyAuthentication> {

  private organisations: number[];

  constructor(authentication?: MyAuthentication) {
    super(authentication);
    if (authentication) {
      this.organisations = authentication.organisations || [];
    }
  }

  isInOrganisation(id: number) {
    return this.organisations.indexOf(id) !== -1;
  }
}

// Statefull Case
@Injectable()
export class CustomRequestAuthenticationProvider extends RequestAuthenticationProvider {

  protected buildAuthentication(
    request: any
  ): Promise<RequestAuthentication> {
    // TODO build MyAuthentication from request
    return new MyRequestAuthentication(myAuthentication);
  }

  setAuthentication(
    request: any,
    response: any,
    authentication: MyAuthentication
  ): void {
    // TODO SET myAuthentication to request to build it later(ex. in session)
  };
}

// Stateless Case
@Injectable()
export class CustomRequestAuthenticationProvider extends AuthenticationProvider {
  protected buildAuthentication(
    request: any
  ): Promise<RequestAuthentication> {
    // TODO build MyAuthentication from request
    return new MyRequestAuthentication(myAuthentication);
  }
}

@Controller('/api/v1/employee')
export class EmployeeController {

  @Get('/:organization')
  @PreAuthorize('$.hasRole("ADMIN") AND $.isInOrganisation(@Param("organization"))')
  list(@Param('organization') id: number): Employee[] {
    // TODO return list of employees
  }
}

const builder = SecurityConfig.builder();
builder
  .authenticationBuilder()
  .authenticationProvider(CustomRequestAuthenticationProvider);
```

#### Custom Authenticator

NestJS Security facilitates the implementation of custom authenticators, enabling the expansion of authentication
capabilities tailored to your application's needs. These authenticators seamlessly integrate various authentication
mechanisms, such as authenticating users from a database, beyond the provided options. This versatility ensures precise
alignment with your application's unique requirements, enhancing authentication efficiency and security.

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {
  }

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      include: {
        roles: true,
        authorities: true
      }
    });
  }
}

@Injectable()
export class AuthenticatorService extends Authenticator {
  constructor(private userService: UserService) {
    super();
  }

  async authenticate(
    username: string,
    password?: string
  ): Promise<Authentication> {
    const user = await this.userService.user({
      email: username
    });
    if (user && user.password === password) {
      // @ts-ignore
      return {
        username,
        // @ts-ignore
        roles: user.roles.map((a) => a.name),
        // @ts-ignore
        authorities: user.authorities.map((a) => a.name)
      };
    }
    return undefined;
  }
}

const builder = SecurityConfig.builder();
builder.authenticationBuilder().authenticator(AuthenticatorService);
builder.metadata({
  // Mandatory provide all AuthenticatorService hierarchical dependencies
  providers: [UserService, PrismaService]
});
```

## Examples

Explore [various examples](https://github.com/tbounsiar/tbnestjs-security/tree/master/examples) to understand how to
implement security features in your NestJS applications.
Feel free to explore these examples to gain insights into implementing security features effectively in your NestJS
applications.

## Contributing

// TBD

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.