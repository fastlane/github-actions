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

    it(`It does not crash when labels are empty for (${scenario.response})`, async () => {
      process.env['INPUT_REPO-TOKEN'] = 'token';
      process.env['INPUT_PR-COMMENT'] = 'message';
      process.env['INPUT_PR-LABEL-TO-ADD'] = '';
      process.env['INPUT_PR-LABEL-TO-REMOVE'] = '';

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, scenario.response);

      const {run} = await import('../src/main.js');

      const api = nock('https://api.github.com')
        .post('/repos/foo/bar/pulls/10/reviews', '{"body":"message","event":"COMMENT"}')
        .reply(200);

      // These should NOT be called
      const labelsGet = nock('https://api.github.com').get('/repos/foo/bar/issues/10/labels').reply(200, []);
      const labelsPost = nock('https://api.github.com').post('/repos/foo/bar/issues/10/labels').reply(200);

      await run();

      expect(api.isDone()).toBeTruthy();
      expect(labelsGet.isDone()).toBeFalsy();
      expect(labelsPost.isDone()).toBeFalsy();
    });
  }

  it('It applies labels but skips the comment for a bot-authored pull request', async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_PR-COMMENT'] = 'message';
    process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
    process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'pull-request-closed-by-bot.json');

    const {run} = await import('../src/main.js');

    const api = nock('https://api.github.com')
      .get('/repos/foo/bar/issues/10/labels')
      .reply(200, JSON.parse('[]'))
      .post('/repos/foo/bar/issues/10/labels', '{"labels":["label-to-add"]}')
      .reply(200);

    // This should NOT be called
    const review = nock('https://api.github.com').post('/repos/foo/bar/pulls/10/reviews').reply(200);

    await run();

    expect(api.isDone()).toBeTruthy();
    expect(review.isDone()).toBeFalsy();
  });

  it('It posts a comment for a bot-authored pull request when skip-comment-for-bots is false', async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_PR-COMMENT'] = 'message';
    process.env['INPUT_PR-LABEL-TO-ADD'] = '';
    process.env['INPUT_PR-LABEL-TO-REMOVE'] = '';
    process.env['INPUT_SKIP-COMMENT-FOR-BOTS'] = 'false';

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'pull-request-closed-by-bot.json');

    const {run} = await import('../src/main.js');

    const api = nock('https://api.github.com')
      .post('/repos/foo/bar/pulls/10/reviews', '{"body":"message","event":"COMMENT"}')
      .reply(200);

    await run();

    expect(api.isDone()).toBeTruthy();
  });

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
