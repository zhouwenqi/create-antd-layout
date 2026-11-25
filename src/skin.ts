import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";

interface SkinInfo {
  name: string;
  path: string;
}

async function getSkinList(): Promise<SkinInfo[]> {
  const skinsDir = path.join(__dirname, "../skins");

  if (!fs.existsSync(skinsDir)) {
    return [];
  }

  const dirs = await fs.readdir(skinsDir);

  return dirs
    .map(name => ({
      name,
      path: path.join(skinsDir, name),
    }))
    .filter(item => {
      return fs.statSync(item.path).isDirectory();
    });
}

async function copySkinFiles(
  skinName: string,
  skinDir: string,
  projectRoot: string
) {
  const skinIndexFile = path.join(skinDir, "index.ts");

  const skinImagesDir = path.join(skinDir, "images");

  const targetSkinDir = path.join(
    projectRoot,
    "src/components/warden-skin",
    skinName
  );

  const targetImagesDir = path.join(
    projectRoot,
    "public/images",
    skinName
  );

  await fs.ensureDir(targetSkinDir);

  if (!fs.existsSync(skinIndexFile)) {
    throw new Error(`${skinName}/index.ts not found`);
  }

  await fs.copy(
    skinIndexFile,
    path.join(targetSkinDir, "index.ts")
  );

  if (fs.existsSync(skinImagesDir)) {
    await fs.copy(
      skinImagesDir,
      targetImagesDir
    );
  }
}

async function updateSkinIndex(
  skinName: string,
  projectRoot: string
) {
  const skinRoot = path.join(
    projectRoot,
    "src/components/warden-skin"
  );

  const indexFile = path.join(
    skinRoot,
    "index.ts"
  );

  await fs.ensureDir(skinRoot);

  const dirs = (await fs.readdir(skinRoot))
    .filter(item => item !== "index.ts")
    .filter(item =>
      fs.statSync(path.join(skinRoot, item)).isDirectory()
    );

  const skinNames = Array.from(
    new Set([...dirs, skinName])
  );

  const imports = skinNames
    .map(name => {
      const varName = toVarName(name);

      return `import ${varName} from "./${name}"`;
    })
    .join("\n");

  const exports = skinNames
    .map(name => toVarName(name))
    .join(", ");

  const content = `${imports}

export default [${exports}]
`;

  await fs.writeFile(indexFile, content);
}

function toVarName(name: string) {
  return name
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, s => s.toUpperCase());
}

async function installSkin(skinName?: string) {
  const cwd = process.cwd();

  const skins = await getSkinList();

  if (!skins.length) {
    console.error(chalk.red("❌ No skins found."));
    process.exit(1);
  }

  let selectedSkin = skinName;

  if (!selectedSkin) {
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "skin",
        message: "Choose a skin",
        choices: skins.map(item => ({
          name: item.name,
          value: item.name,
        })),
      },
    ]);

    selectedSkin = answer.skin;
  }

  const skin = skins.find(item => item.name === selectedSkin);

  if (!skin) {
    console.error(chalk.red(`❌ Skin "${selectedSkin}" not found.`));
    process.exit(1);
  }

  const spinner = ora(`Installing skin "${selectedSkin}"...`).start();

  try {
    await copySkinFiles(selectedSkin!, skin.path, cwd);
    await updateSkinIndex(selectedSkin!, cwd);

    spinner.succeed(`Skin "${selectedSkin}" installed.`);
  } catch (e) {
    spinner.fail("Install skin failed.");
    console.error(e);
    process.exit(1);
  }
}

export {installSkin}