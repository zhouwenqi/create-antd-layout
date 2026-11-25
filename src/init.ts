import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import type {Ora} from "ora";
import { execa } from "execa";
import inquirer from "inquirer";
import degit from "degit";

type TemplateType = 'local' | 'remote';

interface TemplateOption {
  name: string;
  value: string;
  type: TemplateType;
  repo?: string;
}

const TEMPLATES: TemplateOption[] = [
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

type PackageManager = 'npm' | 'yarn' | 'pnpm';

const PACKAGE_MANAGERS: { name: string; value: PackageManager }[] = [
  { name: 'npm', value: 'npm' },
  { name: 'yarn', value: 'yarn' },
  { name: 'pnpm', value: 'pnpm' },
];

async function detectPackageManager(): Promise<PackageManager> {
  try {
    await execa('pnpm', ['--version'], { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    try {
      await execa('yarn', ['--version'], { stdio: 'ignore' });
      return 'yarn';
    } catch {
      return 'npm';
    }
  }
}

async function runInstall(packageManager: PackageManager, cwd: string): Promise<void> {
  const installSpinner = ora(`Installing dependencies with ${packageManager}...`).start();
  const commands: Record<PackageManager, string[]> = {
    npm: ['install'],
    yarn: [],
    pnpm: ['install'],
  };
  try {
    await execa(packageManager, commands[packageManager], {
      cwd,
      stdio: 'ignore',
    });
    installSpinner.succeed(`Dependencies installed with ${packageManager}!`);
  } catch (error) {
    installSpinner.fail(`Failed to install with ${packageManager}.`);
    console.warn(
      chalk.yellow(`💡 Please run:
cd ${path.basename(cwd)}
${packageManager} install`)
    );
  }
}

async function initProject(projectDir: string) {
    const projectName = path.basename(projectDir);
    const targetDir = path.resolve(process.cwd(), projectDir);

    if (fs.existsSync(targetDir)) {
        console.error(chalk.red(`❌ Directory '${projectDir}' already exists.`));
        process.exit(1);
    }

    const answers = await inquirer.prompt([
        {
        type: "list",
        name: "template",
        message: 'Please choose a template',
        choices: TEMPLATES.map(t => ({ name: t.name, value: t.value })),
        default: TEMPLATES[0].value,
        },
    ]);

    const selectedValue = answers.template as string;
    const template = TEMPLATES.find(t => t.value === selectedValue)!;

    let copySpinner: Ora;

    if (template.type === 'local') {
        const templatePath = path.join(__dirname, `../templates/${template.value}`);
        if (!fs.existsSync(templatePath)) {
        console.error(chalk.red(`❌ Local template '${template.value}' does not exist in templates/ directory.`));
        process.exit(1);
        }
        copySpinner = ora(`Copying local template "${template.value}"...`).start();
        try {
        await fs.copy(templatePath, targetDir);
        copySpinner.succeed(`Local template "${template.value}" copied!`);
        } catch (err) {
        copySpinner.fail("Failed to copy local template.");
        console.error(err);
        process.exit(1);
        }
    } else if (template.type === 'remote') {
        if (!template.repo) {
        console.error(chalk.red(`❌ Remote template '${template.value}' missing repo field.`));
        process.exit(1);
        }
        copySpinner = ora(`Downloading remote template from ${template.repo}...`).start();
        try {
        const emitter = degit(template.repo, {
            cache: false,
            force: true,
            verbose: false,
        });
        await emitter.clone(targetDir);
        copySpinner.succeed(`Remote template from ${template.repo} downloaded!`);
        } catch (err) {
        copySpinner.fail("Failed to download remote template.");
        console.error(err);
        process.exit(1);
        }
    }

    const pkgPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = await fs.readJSON(pkgPath);
        pkg.name = projectName;
        await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
    }

    const detected = await detectPackageManager();
    const pmAnswer = await inquirer.prompt([
        {
        type: 'list',
        name: 'packageManager',
        message: 'Please choose package manager:',
        choices: PACKAGE_MANAGERS,
        default: detected,
        },
    ]);
    const packageManager = pmAnswer.packageManager as PackageManager;

    await runInstall(packageManager, targetDir);

    console.log(chalk.green(`
✅ Project created successfully!`));
    console.log(`
📁 Location: ${targetDir}`);
    console.log(`
🚀 To start:`);
    console.log(`   cd ${projectDir}`);
    console.log(`   ${packageManager === 'yarn' ? 'yarn dev' : `${packageManager} run dev`}`);

    try {
        if (packageManager === 'yarn') {
        await execa('yarn', ['dev'], { cwd: targetDir, stdio: 'inherit' });
        } else {
        await execa(packageManager, ['run', 'dev'], { cwd: targetDir, stdio: 'inherit' });
        }
    } catch (error) {
        process.exit(0);
    }
    
}
export {initProject}