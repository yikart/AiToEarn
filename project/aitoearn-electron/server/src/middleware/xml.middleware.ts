/*
 * @Author: nevin
 * @Date: 2025-02-25 14:39:09
 * @LastEditTime: 2025-02-25 21:34:03
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { NextFunction } from 'express';
import * as xml2js from 'xml2js';

@Injectable()
export class XMLMiddleware implements NestMiddleware {
  private xmlParser = bodyParser.text({ type: 'text/xml' });

  use(req: any, res: any, next: NextFunction) {
    this.xmlParser(req, res, (err) => {
      if (err) return next(err);

      if (req.body) {
        xml2js.parseString(
          req.body,
          { explicitArray: false },
          (parseErr, result) => {
            if (parseErr) return next(parseErr);
            req.body = result.xml;
          },
        );
      }
      next();
    });
  }
}
