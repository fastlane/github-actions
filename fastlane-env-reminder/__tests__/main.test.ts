import nock from 'nock';
import * as path from 'path';
import {fileURLToPath} from 'url';
import {jest} from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validScenarios = [
  {
    response: 'issue.json'
  }
];

const invalidScenarios = [
  {
    response: 'pull-request.json'
  },
  {
    response: 'action-closed.json'
  },
  {
    response: 'issue-missing-body.json'
  },
  {
    response: 'issue-contains-fastlane-env.json'
  },
  {
    response: 'issue-feature-request.json'
  }
];

describe('action test suite', () => {
  afterEach(() => {
    delete process.env['INPUT_ISSUE-MESSAGE'];
    delete process.env['INPUT_REPO-TOKEN'];
    delete process.env['GITHUB_REPOSITORY'];
    delete process.env['GITHUB_EVENT_PATH'];
  });

  for (const scenario of validScenarios) {
    it(`It posts a comment on an opened issue for (${scenario.response})`, async () => {
      const issueMessage = 'message';
      const repoToken = 'token';
      process.env['INPUT_ISSUE-MESSAGE'] = issueMessage;
      process.env['INPUT_REPO-TOKEN'] = repoToken;

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      const eventPath = path.join(__dirname, scenario.response);
      process.env['GITHUB_EVENT_PATH'] = eventPath;

      const {run} = await import('../src/main.js');

      const api = nock('https://api.github.com').post('/repos/foo/bar/issues/10/comments').reply(200);

      await run();

      expect(api.isDone()).toBeTruthy();
    });
  }

  for (const scenario of invalidScenarios) {
    it(`It does not post a comment on an opened issue for (${scenario.response})`, async () => {
      const issueMessage = 'message';
      const repoToken = 'token';
      process.env['INPUT_ISSUE-MESSAGE'] = issueMessage;
      process.env['INPUT_REPO-TOKEN'] = repoToken;

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      const eventPath = path.join(__dirname, scenario.response);
      process.env['GITHUB_EVENT_PATH'] = eventPath;

      const {run} = await import('../src/main.js');

      const api = nock('https://api.github.com')
        .post('/repos/foo/bar/issues/10/comments', '{"body":"message"}')
        .reply(200);

      await run();

      expect(api.isDone()).not.toBeTruthy();
    });
  }
});
