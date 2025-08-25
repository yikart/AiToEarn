import * as fs from 'node:fs'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AnsibleService } from '@yikart/ansible'
import { AppException, BrowserEnvironmentStatus, ResponseCode } from '@yikart/common'
import { BrowserEnvironment, BrowserEnvironmentRepository, BrowserProfileRepository } from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import * as yaml from 'js-yaml'
import { RedlockKey } from '../common/enums'
import { config } from '../config'
import { CloudInstanceService } from '../core/cloud-instance'
import { MultiloginAccountService } from '../core/multilogin-account'

@Injectable()
export class EnvironmentConfigScheduler {
  private readonly logger = new Logger(EnvironmentConfigScheduler.name)

  constructor(
    private readonly browserEnvironmentRepository: BrowserEnvironmentRepository,
    private readonly browserProfileRepository: BrowserProfileRepository,
    private readonly multiloginAccountService: MultiloginAccountService,
    private readonly cloudInstanceService: CloudInstanceService,
    private readonly ansibleService: AnsibleService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  @Redlock(RedlockKey.EnvironmentConfigTask)
  async processEnvironmentConfiguration() {
    const [environments] = await this.browserEnvironmentRepository.listWithPagination({
      status: BrowserEnvironmentStatus.Creating,
      page: 1,
      pageSize: 50,
    })

    if (environments.length === 0) {
      return
    }

    this.logger.log(`找到 ${environments.length} 个待配置的环境`)

    const promises = environments.map(environment =>
      this.doConfigureEnvironment(environment),
    )

    await Promise.allSettled(promises)
  }

  @Redlock(env => RedlockKey.EnvConfig((env as BrowserEnvironment).id))
  private async doConfigureEnvironment(environment: BrowserEnvironment): Promise<void> {
    this.logger.debug(`开始配置环境: ${environment.id}`)

    if (environment.status !== BrowserEnvironmentStatus.Creating) {
      return
    }

    try {
      await this.cloudInstanceService.waitForInstanceReady(environment.instanceId, environment.region)
      await this.deployBrowserAgent(environment)
    }
    catch (error) {
      this.logger.error({
        message: `环境 ${environment.id} 配置过程中发生错误`,
        error,
      })

      // await this.browserEnvironmentRepository.updateById(environment.id, {
      //   status: BrowserEnvironmentStatus.Error,
      // })
    }
  }

  private async deployBrowserAgent(environment: BrowserEnvironment) {
    this.logger.log(`Deploying browser agent for environment ${environment.id}`)

    const profile = await this.browserProfileRepository.getByEnvironmentId(environment.id)
    if (!profile) {
      throw new AppException(ResponseCode.BrowserProfileNotFound)
    }

    const multiloginAccount = await this.multiloginAccountService.getById(profile.accountId)

    const dynamicInventory = {
      all: {
        children: {
          browser_hosts: {
            hosts: {
              [`browser-worker-${environment.id}`]: {
                ansible_host: environment.ip,
                ansible_user: 'ubuntu',
                ansible_ssh_pass: environment.password,
                ansible_python_interpreter: '/usr/bin/python3',
              },
            },
          },
        },
      },
    }

    // 动态生成task.json配置文件内容
    const taskConfig = {
      multilogin: multiloginAccount,
      task: {
        profileId: profile.profileId,
        folderId: config.multilogin.folderId,
        url: config.multilogin.agent.url,
        cookies: [],
      },
    }

    // 创建临时文件
    const timestamp = Date.now()
    const tempInventoryPath = `/tmp/inventory-${environment.id}-${timestamp}.yml`
    const tempTaskConfigPath = `/tmp/task-${environment.id}-${timestamp}.json`

    const inventoryYaml = yaml.dump(dynamicInventory)
    const taskConfigJson = JSON.stringify(taskConfig, null, 2)

    fs.writeFileSync(tempInventoryPath, inventoryYaml)
    fs.writeFileSync(tempTaskConfigPath, taskConfigJson)

    // 定义内联 playbook 内容
    const playbookContent = [
      {
        name: 'Execute Browser Automation Task',
        hosts: 'browser_hosts',
        become: true,
        vars: {
          node_version: '22',
          task_config_file: tempTaskConfigPath,
          monorepo_git_url: 'https://github.com/yikart/aitoearn-monorepo.git',
          git_branch: 'main',
        },
        tasks: [
          {
            name: '安装系统依赖',
            apt: {
              name: ['nodejs', 'npm', 'git', 'curl'],
              state: 'present',
              update_cache: true,
            },
          },
          {
            name: '安装 pnpm',
            shell: 'npm install -g pnpm',
            args: {
              creates: '/usr/local/bin/pnpm',
            },
          },
          {
            name: '创建工作目录',
            file: {
              path: '/opt/browser-automation',
              state: 'directory',
              mode: '0755',
            },
          },
          {
            name: '克隆代码仓库',
            git: {
              repo: '{{ monorepo_git_url }}',
              dest: '/opt/browser-automation/monorepo',
              version: '{{ git_branch }}',
              force: true,
            },
          },
          {
            name: '安装依赖',
            shell: 'pnpm install',
            args: {
              chdir: '/opt/browser-automation/monorepo',
            },
          },
          {
            name: '复制任务配置文件',
            copy: {
              src: '{{ task_config_file }}',
              dest: '/tmp/task.json',
              mode: '0644',
            },
          },
          {
            name: '执行浏览器自动化任务',
            shell: 'pnpm nx serve browser-automation-worker --config /tmp/task.json',
            args: {
              chdir: '/opt/browser-automation/monorepo',
            },
            register: 'automation_result',
          },
        ],
      },
    ]
    const tempPlaybookPath = `/tmp/playbook-${environment.id}-${timestamp}.yml`
    const playbookYaml = yaml.dump(playbookContent)
    fs.writeFileSync(tempPlaybookPath, playbookYaml)

    // 使用Ansible执行浏览器自动化任务部署
    const result = await this.ansibleService.runPlaybook(tempPlaybookPath, {
      inventory: tempInventoryPath,
      sshCommonArgs: '-o ControlMaster=no',
    })

    if (fs.existsSync(tempInventoryPath)) {
      fs.unlinkSync(tempInventoryPath)
    }
    if (fs.existsSync(tempTaskConfigPath)) {
      fs.unlinkSync(tempTaskConfigPath)
    }
    if (fs.existsSync(tempPlaybookPath)) {
      fs.unlinkSync(tempPlaybookPath)
    }

    if (!result.success) {
      throw new AppException(ResponseCode.BrowserEnvironmentCreationFailed)
    }

    await this.browserEnvironmentRepository.updateById(environment.id, {
      status: BrowserEnvironmentStatus.Ready,
    })
  }
}
