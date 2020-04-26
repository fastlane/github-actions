import * as core from '@actions/core';
import * as github from '@actions/github';
import * as Octokit from '@octokit/rest';

type Issue = Octokit.IssuesListForRepoResponseItem;

export async function run() {
  try {
    const args = getAndValidateArgs();
    const client: github.GitHub = new github.GitHub(args.repoToken);
    await processIssues(client, args.daysBeforeLock, args.operationsPerRun);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function getAndValidateArgs(): {
  repoToken: string;
  daysBeforeLock: number;
  operationsPerRun: number;
} {
  const args = {
    repoToken: core.getInput('repo-token', {required: true}),
    daysBeforeLock: parseInt(
      core.getInput('days-before-lock', {required: true})
    ),
    operationsPerRun: parseInt(
      core.getInput('operations-per-run', {required: true})
    )
  };

  for (var numberInput of ['days-before-lock', 'operations-per-run']) {
    if (isNaN(parseInt(core.getInput(numberInput)))) {
      throw Error(`input ${numberInput} did not parse to a valid integer`);
    }
  }

  return args;
}

async function processIssues(
  client: github.GitHub,
  daysBeforeLock: number,
  operationsLeft: number,
  page: number = 1
): Promise<number> {
  const issues = await client.issues.listForRepo({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    state: 'closed',
    per_page: 100,
    page: page
  });

  operationsLeft -= 1;

  if (issues.data.length === 0 || operationsLeft === 0) {
    return operationsLeft;
  }

  for (var issue of issues.data.values()) {
    core.debug(
      `Found issue: "${issue.title}", last updated ${issue.updated_at}`
    );

    if (wasLastUpdatedBefore(issue, daysBeforeLock) && !issue.locked) {
      operationsLeft -= await lock(client, issue);
    }

    if (operationsLeft <= 0) {
      return 0;
    }
  }

  return await processIssues(client, daysBeforeLock, operationsLeft, page + 1);
}

function wasLastUpdatedBefore(issue: Issue, days: number): boolean {
  const daysInMillis = 1000 * 60 * 60 * 24 * days;
  const millisSinceLastUpdated =
    new Date().getTime() - new Date(issue.updated_at).getTime();
  return millisSinceLastUpdated >= daysInMillis;
}

async function lock(client: github.GitHub, issue: Issue): Promise<number> {
  core.debug(`Locking issue "${issue.title}"`);

  await client.issues.lock({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue.number,
    headers: {'Content-Length': 0} // if you choose not to pass any parameters, you'll need to set Content-Length to zero when calling out to this endpoint. For more info see https://developer.github.com/v3/#http-verbs
  });

  return 1; // the number of API operations performed
}

run();
