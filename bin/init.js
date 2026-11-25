"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initProject = initProject;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const execa_1 = require("execa");
const inquirer_1 = __importDefault(require("inquirer"));
const degit_1 = __importDefault(require("degit"));
const TEMPLATES = [
    {
        name: "SPA + Vite (Simple)",
        value: "antd-layout-vite-simple",
        type: "local",
    },
    {
        name: "SPA + Vite (I18n)",
        value: "antd-layout-vite-max",
        type: "local",
    },
    {
        name: "SPA + Vite (I18n + Skin)",
        value: "antd-layout-pro",
        type: "remote",
        repo: "https://github.com/zhouwenqi/adminui-demo-antd-layout-pro.git",
    },
];
const PACKAGE_MANAGERS = [
    { name: 'npm', value: 'npm' },
    { name: 'yarn', value: 'yarn' },
    { name: 'pnpm', value: 'pnpm' },
];
async function detectPackageManager() {
    try {
        await (0, execa_1.execa)('pnpm', ['--version'], { stdio: 'ignore' });
        return 'pnpm';
    }
    catch {
        try {
            await (0, execa_1.execa)('yarn', ['--version'], { stdio: 'ignore' });
            return 'yarn';
        }
        catch {
            return 'npm';
        }
    }
}
async function runInstall(packageManager, cwd) {
    const installSpinner = (0, ora_1.default)(`Installing dependencies with ${packageManager}...`).start();
    const commands = {
        npm: ['install'],
        yarn: [],
        pnpm: ['install'],
    };
    try {
        await (0, execa_1.execa)(packageManager, commands[packageManager], {
            cwd,
            stdio: 'ignore',
        });
        installSpinner.succeed(`Dependencies installed with ${packageManager}!`);
    }
    catch (error) {
        installSpinner.fail(`Failed to install with ${packageManager}.`);
        console.warn(chalk_1.default.yellow(`💡 Please run:
cd ${path_1.default.basename(cwd)}
${packageManager} install`));
    }
}
async function initProject(projectDir) {
    const projectName = path_1.default.basename(projectDir);
    const targetDir = path_1.default.resolve(process.cwd(), projectDir);
    if (fs_extra_1.default.existsSync(targetDir)) {
        console.error(chalk_1.default.red(`❌ Directory '${projectDir}' already exists.`));
        process.exit(1);
    }
    const answers = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "template",
            message: 'Please choose a template',
            choices: TEMPLATES.map(t => ({ name: t.name, value: t.value })),
            default: TEMPLATES[0].value,
        },
    ]);
    const selectedValue = answers.template;
    const template = TEMPLATES.find(t => t.value === selectedValue);
    let copySpinner;
    if (template.type === 'local') {
        const templatePath = path_1.default.join(__dirname, `../templates/${template.value}`);
        if (!fs_extra_1.default.existsSync(templatePath)) {
            console.error(chalk_1.default.red(`❌ Local template '${template.value}' does not exist in templates/ directory.`));
            process.exit(1);
        }
        copySpinner = (0, ora_1.default)(`Copying local template "${template.value}"...`).start();
        try {
            await fs_extra_1.default.copy(templatePath, targetDir);
            copySpinner.succeed(`Local template "${template.value}" copied!`);
        }
        catch (err) {
            copySpinner.fail("Failed to copy local template.");
            console.error(err);
            process.exit(1);
        }
    }
    else if (template.type === 'remote') {
        if (!template.repo) {
            console.error(chalk_1.default.red(`❌ Remote template '${template.value}' missing repo field.`));
            process.exit(1);
        }
        copySpinner = (0, ora_1.default)(`Downloading remote template from ${template.repo}...`).start();
        try {
            const emitter = (0, degit_1.default)(template.repo, {
                cache: false,
                force: true,
                verbose: false,
            });
            await emitter.clone(targetDir);
            copySpinner.succeed(`Remote template from ${template.repo} downloaded!`);
        }
        catch (err) {
            copySpinner.fail("Failed to download remote template.");
            console.error(err);
            process.exit(1);
        }
    }
    const pkgPath = path_1.default.join(targetDir, 'package.json');
    if (fs_extra_1.default.existsSync(pkgPath)) {
        const pkg = await fs_extra_1.default.readJSON(pkgPath);
        pkg.name = projectName;
        await fs_extra_1.default.writeJSON(pkgPath, pkg, { spaces: 2 });
    }
    const detected = await detectPackageManager();
    const pmAnswer = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'packageManager',
            message: 'Please choose package manager:',
            choices: PACKAGE_MANAGERS,
            default: detected,
        },
    ]);
    const packageManager = pmAnswer.packageManager;
    await runInstall(packageManager, targetDir);
    console.log(chalk_1.default.green(`
✅ Project created successfully!`));
    console.log(`
📁 Location: ${targetDir}`);
    console.log(`
🚀 To start:`);
    console.log(`   cd ${projectDir}`);
    console.log(`   ${packageManager === 'yarn' ? 'yarn dev' : `${packageManager} run dev`}`);
    try {
        if (packageManager === 'yarn') {
            await (0, execa_1.execa)('yarn', ['dev'], { cwd: targetDir, stdio: 'inherit' });
        }
        else {
            await (0, execa_1.execa)(packageManager, ['run', 'dev'], { cwd: targetDir, stdio: 'inherit' });
        }
    }
    catch (error) {
        process.exit(0);
    }
}
