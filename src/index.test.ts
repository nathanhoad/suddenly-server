import * as request from 'supertest';
import { createServer, createRouter, UnauthorizedError } from '.';
import { Router } from 'express';

describe('Server', () => {
  it('can create a server with routes', async () => {
    const Things = Router();
    Things.get('/', (request, response) => {
      response.json({ thing: true });
    });
    Things.get('/bad', (request, response) => {
      throw new UnauthorizedError();
    });

    const server = createServer();
    server.use(
      createRouter({
        '/api': {
          '/things': Things
        }
      })
    );

    let response = await request(server).get('/api/things');
    expect(response.body.thing).toBeTruthy();

    response = await request(server).get('/api/things/bad');
    expect(response.statusCode).toBe(401);
  });
});
