"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (github.context.eventName !== 'push') {
                console.log('The event that triggered this action was not a push, exiting');
                return;
            }
            const repoToken = core.getInput('repo-token', { required: true });
            const client = new github.GitHub(repoToken);
            const commit = yield getCommit(client, github.context.sha);
            if (!isMergeCommit(commit)) {
                console.log('No merge commit, exiting');
                return;
            }
            const { data: [pullRequest] } = yield getPullRequests(client, github.context.sha);
            const prNumber = pullRequest.number;
            const closed = pullRequest.state == 'closed';
            if (!closed) {
                console.log('No pull request was closed, exiting');
                return;
            }
            const labelToRemove = core.getInput('pr-label-to-remove');
            const canRemoveLabel = yield canRemoveLabelFromIssue(client, prNumber, labelToRemove);
            if (canRemoveLabel) {
                yield removeLabel(client, prNumber, labelToRemove);
            }
            yield addLabels(client, prNumber, [core.getInput('pr-label-to-add')]);
            var comment = core.getInput('pr-comment', { required: false });
            if (comment.length == 0) {
                comment = defaultPrComment(pullRequest.user.login);
            }
            yield addComment(client, prNumber, comment);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
function getCommit(client, commit_sha) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield client.git.getCommit({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            commit_sha: commit_sha
        });
    });
}
function isMergeCommit(commit) {
    return commit.data.parents.length > 1;
}
function getPullRequests(client, commit_sha) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield client.repos.listPullRequestsAssociatedWithCommit({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            commit_sha: commit_sha
        });
    });
}
function addComment(client, prNumber, comment) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.pulls.createReview({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber,
            body: comment,
            event: 'COMMENT'
        });
    });
}
function addLabels(client, prNumber, labels) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            labels: labels
        });
    });
}
function canRemoveLabelFromIssue(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield client.issues.listLabelsOnIssue({
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
    });
}
function removeLabel(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.removeLabel({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            name: label
        });
    });
}
function defaultPrComment(prAuthor) {
    return `Hey @${prAuthor} :wave:
                   
  Thank you for your contribution to _fastlane_ and congrats on getting this pull request merged :tada:
  The code change now lives in the \`master\` branch, however it wasn't released to [RubyGems](https://rubygems.org/gems/fastlane) yet.
  We usually ship about once a week, and your PR will be included in the next one.
  
  Please let us know if this change requires an immediate release by adding a comment here :+1:
  We'll notify you once we shipped a new release with your changes :rocket:`;
}
run();
