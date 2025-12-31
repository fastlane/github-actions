const path = require('path');
const nock = require('nock');

describe('action test suite', () => {
  it(`It locks a closed issue when the issue was not updated in a given timespan`, async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_DAYS-BEFORE-LOCK'] = '60';
    process.env['INPUT_OPERATIONS-PER-RUN'] = '2';

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';

    var date = new Date();
    date.setDate(date.getDate() - 61);

    const api = nock('https://api.github.com')
      .persist()
      .get('/repos/foo/bar/issues?state=closed&per_page=100&page=1')
      .reply(
        200,
        JSON.parse(
          `[{"id": 1, "title": "Issue to be locked", "number": 1347, "locked": false, "updated_at": "${date.toISOString()}"}]`
        )
      )
      .put('/repos/foo/bar/issues/1347/lock')
      .reply(204);

    require('../src/index');

    expect(api.isDone()).toBeTruthy();
    nock.cleanAll();
  });

  it(`It does not lock an issue, when the required time has not passed`, async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_DAYS-BEFORE-LOCK'] = '60';
    process.env['INPUT_OPERATIONS-PER-RUN'] = '1';

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';

    var date = new Date();
    date.setDate(date.getDate() - 1); // yesterday

    const api = nock('https://api.github.com')
      .persist()
      .get('/repos/foo/bar/issues?state=closed&per_page=100&page=1')
      .reply(
        200,
        JSON.parse(
          `[{"id": 1, "title": "The issue cannot be locked yet", "number": 1347, "locked": false, "updated_at": "${date.toISOString()}"}]`
        )
      )
      .put('/repos/foo/bar/issues/1347/lock')
      .reply(204);

    require('../src/index');

    expect(api.isDone()).not.toBeTruthy();
    nock.cleanAll();
  });

  it(`It does not lock an issue, when the issue is already locked`, async () => {
    process.env['INPUT_REPO-TOKEN'] = 'token';
    process.env['INPUT_DAYS-BEFORE-LOCK'] = '60';
    process.env['INPUT_OPERATIONS-PER-RUN'] = '1';

    process.env['GITHUB_REPOSITORY'] = 'foo/bar';

    var date = new Date();
    date.setDate(date.getDate() - 61);

    const api = nock('https://api.github.com')
      .persist()
      .get('/repos/foo/bar/issues?state=closed&per_page=100&page=1')
      .reply(
        200,
        JSON.parse(
          `[{"id": 1, "title": "Locked issue", "number": 1347, "locked": true, "updated_at": "${date.toISOString()}"}]`
        )
      )
      .put('/repos/foo/bar/issues/1347/lock')
      .reply(204);

    require('../src/index');

    expect(api.isDone()).not.toBeTruthy();
    nock.cleanAll();
  });
});
