import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
  try {
    if (github.context.eventName !== 'push') {
      console.log(
        'The event that triggered this action was not a push, exiting'
      );
      return;
    }

    const repoToken = core.getInput('repo-token', {required: true});
    const client: github.GitHub = new github.GitHub(repoToken);

    const commit = await getCommit(client, github.context.sha);
    if (!isMergeCommit(commit)) {
      console.log('No merge commit, exiting');
      return;
    }

    const {
      data: [pullRequest]
    } = await getPullRequests(client, github.context.sha);
    const prNumber = pullRequest.number;
    const closed = pullRequest.state == 'closed';
    if (!closed) {
      console.log('No pull request was closed, exiting');
      return;
    }

    const labelToRemove = core.getInput('pr-label-to-remove');
    const canRemoveLabel = await canRemoveLabelFromIssue(
      client,
      prNumber,
      labelToRemove
    );
    if (canRemoveLabel) {
      await removeLabel(client, prNumber, labelToRemove);
    }

    await addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);

    var comment = core.getInput('pr-comment', {required: false});
    if (comment.length == 0) {
      comment = defaultPrComment(pullRequest.user.login);
    }
    await addComment(client, prNumber, comment);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getCommit(client: github.GitHub, commit_sha: string) {
  return await client.git.getCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commit_sha: commit_sha
  });
}

function isMergeCommit(commit): boolean {
  return commit.data.parents.length > 1;
}

async function getPullRequests(client: github.GitHub, commit_sha: string) {
  return await client.repos.listPullRequestsAssociatedWithCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commit_sha: commit_sha
  });
}

async function addComment(
  client: github.GitHub,
  prNumber: number,
  comment: string
) {
  await client.pulls.createReview({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
    body: comment,
    event: 'COMMENT'
  });
}

async function addLabels(
  client: github.GitHub,
  prNumber: number,
  labels: string[]
) {
  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels
  });
}

async function canRemoveLabelFromIssue(
  client: github.GitHub,
  prNumber: number,
  label: string
): Promise<boolean> {
  const response = await client.issues.listLabelsOnIssue({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber
  });

  const issueLabels = response.data;
  for (let issueLabel of issueLabels) {
    if (issueLabel.name === label) {
      return true;
    }
  }
  return false;
}

async function removeLabel(
  client: github.GitHub,
  prNumber: number,
  label: string
) {
  await client.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    name: label
  });
}

function defaultPrComment(prAuthor: string): string {
  return `Hey @${prAuthor} :wave:
                   
  Thank you for your contribution to _fastlane_ and congrats on getting this pull request merged :tada:
  The code change now lives in the \`master\` branch, however it wasn't released to [RubyGems](https://rubygems.org/gems/fastlane) yet.
  We usually ship about once a week, and your PR will be included in the next one.
  
  Please let us know if this change requires an immediate release by adding a comment here :+1:
  We'll notify you once we shipped a new release with your changes :rocket:`;
}

run();
