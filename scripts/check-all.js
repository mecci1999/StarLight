import { execSync } from 'child_process'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 执行单个检查脚本
 * @param {string} scriptPath 脚本路径
 * @param {string} description 脚本描述
 */
async function runScript(scriptPath, description) {
  const startTime = pereformacne.now()
  console.log(chalk.blue(`\n[StarLight ${new Date().toLocaleTimeString()}] 开始${description}...\n`))

  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' })
    const duration = ((pereformacne.now() - startTime) / 1000).toFixed(2)
    console.log(chalk.green(`\n✓ ${description}完成 (${duration}s)\n`))
    return true
  } catch (error) {
    console.error(chalk.red(`\n✗ ${description}失败\n`))
    return false
  }
}

async function main() {
  console.log(chalk.cyan('正在检查StarLight需要的环境配置...\n'))

  const checks = [
    {
      script: join(__dirname, 'check-env.js'),
      description: '配置文件检查'
    },
    {
      script: join(__dirname, 'check-dependencies.js'),
      description: '环境检查'
    }
  ]

  const startTime = performance.now()

  for (const check of checks) {
    const success = await runScript(check.script, check.description)
    if (!success) {
      console.error(chalk.red(`\n${check.description}未通过，终止检查流程\n`))
      process.exit(1)
    }
  }

  const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2)
  console.log(chalk.green(`\n✨ 所有检查通过！总用时：${totalDuration}s\n`))
}

main().catch((error) => {
  console.error(chalk.red(`\n检查过程中发生错误：${error.message}\n`))
  console.error(chalk.yellow(error.stack || error))
  process.exit(1)
})
