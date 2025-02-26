import { lstat } from 'node:fs/promises';
import { cwd } from 'node:process';

lstat(cwd())
  .then((stats) => {
    console.log('[fs.lstat]', stats);
  })
  .catch((err) => {
    console.error(err);
  });
