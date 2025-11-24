const path = require('path');
const nock = require('nock');

const invalidScenarios = [
  {
    scenario_name: 'no-push-event',
    event_name: 'pull_request',
    sha: '',
    commits: '',
    pulls: ''
  },
  {
    scenario_name: 'no-commit-sha',
    event_name: 'push',
    sha: '',
    commits: '',
    pulls: ''
  },
  {
    scenario_name: 'no-merge-changes',
    event_name: 'push',
    sha: '123abc',
    commits: '',
    pulls: ''
  },
  {
    scenario_name: 'no-pull-request-for-a-given-commit',
    event_name: 'push',
    sha: '123abc',
    commits: JSON.parse(
      '{"parents": [{"url": "0", "sha": "0"}, {"url": "1", "sha": "1"}]}'
    ),
    pulls: ''
  }
];

describe('action test suite', () => {
  it(`It posts a comment on a merged pull request, adds and removes the labels`, async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_PR-COMMENT'] = 'message';
    process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
    process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

    process.env['GITHUB_EVENT_NAME'] = 'push';
    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_SHA'] = 'abc123';

    const api = nock('https://api.github.com')
      .persist()
      .get('/repos/foo/bar/git/commits/abc123')
      .reply(
        200,
        JSON.parse(
          '{"parents": [{"url": "hello-0", "sha": "1acc"}, {"url": "hello-1", "sha": "2acc"}]}'
        )
      )
      .get('/repos/foo/bar/commits/abc123/pulls')
      .reply(200, JSON.parse('[{"number": 10, "state": "closed"}]'))
      .post(
        '/repos/foo/bar/pulls/10/reviews',
        '{"body":"message","event":"COMMENT"}'
      )
      .reply(200)
      .get('/repos/foo/bar/issues/10/labels')
      .reply(200, JSON.parse('[]'))
      .post('/repos/foo/bar/issues/10/labels', '{"labels":["label-to-add"]}')
      .reply(200);

    const main = require('../src/main');
    await main.run();

    expect(api.isDone()).toBeTruthy();
  });

  for (const scenario of invalidScenarios) {
    it(`It does not post a comment on a closed pull request for (${scenario.scenario_name})`, async () => {
      process.env['INPUT_REPO-TOKEN'] = 'token';
      process.env['INPUT_PR-COMMENT'] = 'message';
      process.env['INPUT_PR-LABEL-TO-ADD'] = 'label-to-add';
      process.env['INPUT_PR-LABEL-TO-REMOVE'] = 'label-to-remove';

      process.env['GITHUB_EVENT_NAME'] = scenario.event_name;
      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      process.env['GITHUB_SHA'] = scenario.sha;

      const api = nock('https://api.github.com')
        .persist()
        .get(`/repos/foo/bar/git/commits/${scenario.sha}`)
        .reply(200, `${scenario.commits}`)
        .get(`/repos/foo/bar/commits/${scenario.sha}/pulls`)
        .reply(200, `${scenario.pulls}`)
        .post(
          '/repos/foo/bar/pulls/10/reviews',
          '{"body":"message","event":"COMMENT"}'
        )
        .reply(200)
        .get('/repos/foo/bar/issues/10/labels')
        .reply(200, JSON.parse('[]'))
        .post('/repos/foo/bar/issues/10/labels', '{"labels":["label-to-add"]}')
        .reply(200);

      const main = require('../src/main');
      await main.run();

      expect(api.isDone()).not.toBeTruthy();
    });
  }
});
