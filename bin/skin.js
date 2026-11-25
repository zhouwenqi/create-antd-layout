"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installSkin = installSkin;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
async function getSkinList() {
    const skinsDir = path_1.default.join(__dirname, "../skins");
    if (!fs_extra_1.default.existsSync(skinsDir)) {
        return [];
    }
    const dirs = await fs_extra_1.default.readdir(skinsDir);
    return dirs
        .map(name => ({
        name,
        path: path_1.default.join(skinsDir, name),
    }))
        .filter(item => {
        return fs_extra_1.default.statSync(item.path).isDirectory();
    });
}
async function copySkinFiles(skinName, skinDir, projectRoot) {
    const skinIndexFile = path_1.default.join(skinDir, "index.ts");
    const skinImagesDir = path_1.default.join(skinDir, "images");
    const targetSkinDir = path_1.default.join(projectRoot, "src/components/warden-skin", skinName);
    const targetImagesDir = path_1.default.join(projectRoot, "public/images", skinName);
    await fs_extra_1.default.ensureDir(targetSkinDir);
    if (!fs_extra_1.default.existsSync(skinIndexFile)) {
        throw new Error(`${skinName}/index.ts not found`);
    }
    await fs_extra_1.default.copy(skinIndexFile, path_1.default.join(targetSkinDir, "index.ts"));
    if (fs_extra_1.default.existsSync(skinImagesDir)) {
        await fs_extra_1.default.copy(skinImagesDir, targetImagesDir);
    }
}
async function updateSkinIndex(skinName, projectRoot) {
    const skinRoot = path_1.default.join(projectRoot, "src/components/warden-skin");
    const indexFile = path_1.default.join(skinRoot, "index.ts");
    await fs_extra_1.default.ensureDir(skinRoot);
    const dirs = (await fs_extra_1.default.readdir(skinRoot))
        .filter(item => item !== "index.ts")
        .filter(item => fs_extra_1.default.statSync(path_1.default.join(skinRoot, item)).isDirectory());
    const skinNames = Array.from(new Set([...dirs, skinName]));
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
    await fs_extra_1.default.writeFile(indexFile, content);
}
function toVarName(name) {
    return name
        .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
        .replace(/^\w/, s => s.toUpperCase());
}
async function installSkin(skinName) {
    const cwd = process.cwd();
    const skins = await getSkinList();
    if (!skins.length) {
        console.error(chalk_1.default.red("❌ No skins found."));
        process.exit(1);
    }
    let selectedSkin = skinName;
    if (!selectedSkin) {
        const answer = await inquirer_1.default.prompt([
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
        console.error(chalk_1.default.red(`❌ Skin "${selectedSkin}" not found.`));
        process.exit(1);
    }
    const spinner = (0, ora_1.default)(`Installing skin "${selectedSkin}"...`).start();
    try {
        await copySkinFiles(selectedSkin, skin.path, cwd);
        await updateSkinIndex(selectedSkin, cwd);
        spinner.succeed(`Skin "${selectedSkin}" installed.`);
    }
    catch (e) {
        spinner.fail("Install skin failed.");
        console.error(e);
        process.exit(1);
    }
}
