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
            const context = github.context;
            const isPullRequest = !!context.payload.pull_request;
            if (!isPullRequest) {
                console.log('The event that triggered this action was not a pull request, exiting');
                return;
            }
            if (context.payload.action !== 'closed') {
                console.log('No pull request was closed, exiting');
                return;
            }
            const pull_request = context.payload.pull_request;
            const repoToken = core.getInput('repo-token', { required: true });
            const client = new github.GitHub(repoToken);
            const repo = context.repo;
            const response = yield client.pulls.checkIfMerged({
                owner: repo.owner,
                repo: repo.repo,
                pull_number: pull_request.number
            });
            if (response.status != 204) {
                console.log('No pull request was merged, exiting');
                return;
            }
            const message = core.getInput('merge-message');
            yield client.pulls.createReview({
                owner: repo.owner,
                repo: repo.repo,
                pull_number: pull_request.number,
                body: message,
                event: 'COMMENT'
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
run();
