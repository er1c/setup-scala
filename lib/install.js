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
const shell = __importStar(require("shelljs"));
const path = __importStar(require("path"));
const homedir = require("os").homedir();
const bin = path.join(homedir, "bin");
function install(javaVersion, jabbaVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        setEnvironmentVariableCI();
        installJava(javaVersion, jabbaVersion);
    });
}
exports.install = install;
function setEnvironmentVariableCI() {
    core.exportVariable("CI", "true");
}
function jabbaUrlSuffix() {
    const runnerOs = shell.env["RUNNER_OS"] || "undefined";
    switch (runnerOs.toLowerCase()) {
        case "linux":
            return "linux-amd64";
        case "macos":
            return "darwin-amd64";
        case "windows":
            return "windows-amd64.exe";
        default:
            throw new Error(`unknown runner OS: ${runnerOs}, expected one of Linux, macOS or Windows.`);
    }
}
function isWindows() {
    return shell.env["RUNNER_OS"] === "Windows";
}
function jabbaName() {
    if (isWindows())
        return "jabba.exe";
    else
        return "jabba";
}
function installJava(javaVersion, jabbaVersion) {
    core.startGroup("Install Java");
    core.addPath(bin);
    const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${jabbaUrlSuffix()}`;
    shell.mkdir(bin);
    const jabba = path.join(bin, jabbaName());
    shell.set("-ev");
    shell.exec(`curl -sL -o ${jabba} ${jabbaUrl}`, { silent: true });
    shell.chmod(755, jabba);
    const toInstall = shell
        .exec(`${jabba} ls-remote`)
        .grep(javaVersion)
        .head({ "-n": 1 })
        .stdout.trim();
    if (!toInstall) {
        core.setFailed(`Couldn't find Java ${javaVersion}. To fix this problem, run 'jabba ls-remote' to see the list of valid Java versions.`);
        return;
    }
    console.log(`Installing ${toInstall}`);
    const result = shell.exec(`${jabba} install ${toInstall}`);
    if (result.code > 0) {
        core.setFailed(`Failed to install Java ${javaVersion}, Jabba stderr: ${result.stderr}`);
        return;
    }
    const javaHome = shell
        .exec(`${jabba} which --home ${toInstall}`)
        .stdout.trim();
    core.exportVariable("JAVA_HOME", javaHome);
    core.addPath(path.join(javaHome, "bin"));
    core.endGroup();
}
function curl(url, outputFile) {
    shell.exec(`curl -sL ${url}`, { silent: true }).to(outputFile);
    shell.chmod(755, outputFile);
    shell.cat(outputFile);
    console.log(`Downloaded '${path.basename(outputFile)}' to ${outputFile}`);
}
