require('dotenv').config();

import * as express from 'express';
import { Application, Router, Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as Path from 'path';
import * as guessRootPath from 'guess-root-path';

export interface ServerOptions {
  views?: string[] | string;
  urlencodedOptions?: any;
}

const DEFAULT_SERVER_OPTIONS: ServerOptions = {
  views: ['dist/public', 'src/server/views'],
  urlencodedOptions: { extended: false }
};

/**
 * Create a new Express app and set up some standard stuff
 * @param options some optional basic preferences for the server
 */
export function createServer(options: ServerOptions = {}): Application {
  options = Object.assign({}, DEFAULT_SERVER_OPTIONS, options);

  const server = express();

  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded(options.urlencodedOptions));
  server.use(cors());
  server.use(helmet());

  server.set('view engine', 'ejs');
  server.set('views', [].concat(options.views).map(v => Path.join(guessRootPath(), v)));

  return server;
}

export interface Routes {
  [key: string]: Routes | Router;
}

type ErrorHandler = (error: Error, request: Request, response: Response, next: NextFunction) => void;

/**
 * Create an application router from a routes tree. A routes tree looks something like:
 *
 *    {
 *      '/api': {
 *        'things': Things,
 *        'bars': Bars
 *      },
 *      '/': Static
 *    }
 *
 * where `Things`, `Bars`, and `Static` are express.Router instances
 * @param tree Nested route definitions
 * @param useErrorHandler an Express error handler (or true to use an automatic one)
 */
export function createRouter(tree: Routes, useErrorHandler: boolean | ErrorHandler = true): Router {
  const router = express.Router();
  Object.keys(tree).forEach(path => {
    const subtree = tree[path];
    // Router's have a stack property that is an array
    // otherwise they are a subtree of more routes
    if ((subtree as any).stack instanceof Array) {
      router.use(path, subtree as Router);
    } else {
      router.use(path, createRouter(subtree as Routes, false));
    }
  });

  if (useErrorHandler) {
    if (typeof useErrorHandler === 'boolean') {
      router.use(handleError);
    } else {
      router.use(useErrorHandler);
    }
  }

  return router;
}

export class ResponseError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super();

    this.status = status;
    this.message = message;
  }
}

export class BadRequestError extends ResponseError {
  constructor(message?: string) {
    super(400, message || 'There was a problem processing your request.');
  }
}

export class UnauthorizedError extends ResponseError {
  constructor(message?: string) {
    super(401, message || 'You are not authorized to make that request');
  }
}

export class NotFoundError extends ResponseError {
  constructor(message?: string) {
    super(404, message || 'The requested resource could not be found.');
  }
}

export class UnprocessableEntityError extends ResponseError {
  constructor(message?: string) {
    super(422, message || 'Your request could not be completed.');
  }
}

export class InternalServerError extends ResponseError {
  constructor(message?: string) {
    super(500, message || 'There was an internal server error');
  }
}

/**
 *
 * @param error
 * @param request
 * @param response
 * @param next
 */
export function handleError(error: ResponseError, request: Request, response: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development' || (process.env.LOG || '').includes('errors')) {
    console.error(error.stack);
  }

  if (request.headers['content-type'] === 'application/json') {
    response.status(error.status || 500).json({ status: error.status, message: error.message });
  } else {
    response.status(error.status || 500).render(`${error.status || 500}.html.ejs`);
  }
}
