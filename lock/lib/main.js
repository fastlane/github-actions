"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            const args = getAndValidateArgs();
            const client = new github.GitHub(args.repoToken);
            yield processIssues(client, args.daysBeforeLock, args.operationsPerRun);
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
function getAndValidateArgs() {
    const args = {
        repoToken: core.getInput('repo-token', { required: true }),
        daysBeforeLock: parseInt(core.getInput('days-before-lock', { required: true })),
        operationsPerRun: parseInt(core.getInput('operations-per-run', { required: true }))
    };
    for (var numberInput of ['days-before-lock', 'operations-per-run']) {
        if (isNaN(parseInt(core.getInput(numberInput)))) {
            throw Error(`input ${numberInput} did not parse to a valid integer`);
        }
    }
    return args;
}
function processIssues(client, daysBeforeLock, operationsLeft, page = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        const issues = yield client.issues.listForRepo({
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
            core.debug(`Found issue: "${issue.title}", last updated ${issue.updated_at}`);
            if (wasLastUpdatedBefore(issue, daysBeforeLock) && !issue.locked) {
                operationsLeft -= yield lock(client, issue);
            }
            if (operationsLeft <= 0) {
                return 0;
            }
        }
        return yield processIssues(client, daysBeforeLock, operationsLeft, page + 1);
    });
}
function wasLastUpdatedBefore(issue, days) {
    const daysInMillis = 1000 * 60 * 60 * 24 * days;
    const millisSinceLastUpdated = new Date().getTime() - new Date(issue.updated_at).getTime();
    return millisSinceLastUpdated >= daysInMillis;
}
function lock(client, issue) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Locking issue "${issue.title}"`);
        yield client.issues.lock({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issue.number,
            headers: { 'Content-Length': 0 } // if you choose not to pass any parameters, you'll need to set Content-Length to zero when calling out to this endpoint. For more info see https://developer.github.com/v3/#http-verbs
        });
        return 1; // the number of API operations performed
    });
}
run();
