import * as path from 'path';
import nock from 'nock';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validScenarios = [
  {
    response: 'pull-request-closed.json'
  }
];

const invalidScenarios = [
  {
    response: 'issue.json'
  },
  {
    response: 'action-opened.json'
  },
  {
    response: 'pull-request-closed-but-not-merged.json'
  }
];

describe('action test suite', () => {
  for (const scenario of validScenarios) {
    it(`It posts a comment on a merged issue for (${scenario.response})`, async () => {
      process.env['INPUT_REPO-TOKEN'] = 'token';
      process.env['INPUT_PR-COMMENT'] = 'message';
      process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
      process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, scenario.response);

      const {run} = await import('../src/main.js');

      const api = nock('https://api.github.com')
        .post('/repos/foo/bar/pulls/10/reviews', '{"body":"message","event":"COMMENT"}')
        .reply(200)
        .get('/repos/foo/bar/issues/10/labels')
        .reply(200, JSON.parse('[]'))
        .post('/repos/foo/bar/issues/10/labels', '{"labels":["label-to-add"]}')
        .reply(200);

      await run();

      expect(api.isDone()).toBeTruthy();
    });
  }

  for (const scenario of invalidScenarios) {
    it(`It does not post a comment on a closed pull request for (${scenario.response})`, async () => {
      process.env['INPUT_REPO-TOKEN'] = 'token';
      process.env['INPUT_PR-COMMENT'] = 'message';
      process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
      process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, scenario.response);

      const {run} = await import('../src/main.js');

      const api = nock('https://api.github.com')
        .post('/repos/foo/bar/pulls/10/reviews', '{"body":"message","event":"COMMENT"}')
        .reply(200)
        .get('/repos/foo/bar/issues/10/labels')
        .reply(200, JSON.parse('[]'))
        .post('/repos/foo/bar/issues/10/labels', '{"labels":["label-to-add"]}')
        .reply(200);

      await run();

      expect(api.isDone()).not.toBeTruthy();
    });
  }
});
