# @suddenly/server

Some handy helpers for Express apps.

## Usage

Create a server with bodyParser, CORS, Helmet, and EJS views already applied.

Create a router with subrouters and an error handler already set up.

```js
import { createServer, createRoutes } from '@suddenly/server';

const server = createServer({ views: 'src/server/views' });
server.use(
  createRouter(
    {
      '/api': {
        '/users': Users,
        '/things': Things
      },
      '/': Root
    } /* , override the error handler by passing a function here */
  )
);

server.listen(5000, () => {
  console.log('Listening at http://localhost:5000');
});
```

## Contributors

- Nathan Hoad - [nathan@nathanhoad.net](mailto:nathan@nathanhoad.net)
