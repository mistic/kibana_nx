const { detectPackageManager } = require('@nrwl/devkit');
const execa = require('execa');

module.exports = async function typecheckExecutor(
    options,
    context
) {
    if (!context.projectName) {
        throw new Error('No projectName')
    }
    if (!context.targetName) {
        throw new Error('No targetName')
    }

    const packageManager = detectPackageManager()
    const packageManagerCmd =
        packageManager === 'pnpm'
            ? 'pnpm'
            : packageManager === 'yarn'
            ? 'yarn'
            : 'npx'
    const libRoot = context.workspace.projects[context.projectName].root


    const tsc = execa(packageManagerCmd, [
        'tsc',
        '-b',
        `${libRoot}/tsconfig.types.json`

    ])
    // tsc.stdout?.pipe(process.stdout)
    await tsc

    return {
        success: true,
    }
}
