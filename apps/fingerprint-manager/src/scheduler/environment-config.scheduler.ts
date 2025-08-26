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

    await Promise.all(promises)
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
      folderId: config.multilogin.folderId,
      profileId: profile.profileId,
      windows: [
        {
          url: 'https://aitoearn.ai',
          localStorage: [
            {
              name: 'User',
              value: '{"state":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYWlsIjoibDE0OTEyNTU3ODFAZ21haWwuY29tIiwiaWQiOiI2ODlmNDBiMmVhZjY1ZjYwMDJkNDYzMmIiLCJuYW1lIjoi55So5oi3Xzh1bnM0d0xCIiwiaWF0IjoxNzU2MjAwNjEwLCJleHAiOjE3NTg3OTI2MTB9.YyqKpVdQFiFOY7dlLfXA_r3vQPpRdM2DxUiMXy5iksg","userInfo":{"_id":"689f40b2eaf65f6002d4632b","name":"用户_8uns4wLB","mail":"l1491255781@gmail.com","status":1,"googleAccount":{"googleId":"108483019791958614324","email":"l1491255781@gmail.com","refreshToken":null},"score":10,"updatedAt":"2025-08-15T14:14:10.873Z","createdAt":"2025-08-15T14:14:10.832Z","popularizeCode":"95KXR","id":"689f40b2eaf65f6002d4632b"},"isAddAccountPorxy":false,"lang":"zh-CN","lastUpdateTime":0,"_hasHydrated":true},"version":0}',
            },
          ],
        },
        {
          url: 'https://ping0.cc/',
        },
      ],
    }

    // 创建临时文件
    const timestamp = Date.now()
    const tempInventoryPath = `/tmp/inventory-${environment.id}-${timestamp}.yml`
    const tempTaskConfigPath = `/tmp/task-${environment.id}-${timestamp}.json`

    const inventoryYaml = yaml.dump(dynamicInventory)
    const taskConfigJson = JSON.stringify(taskConfig, null, 2)

    fs.writeFileSync(tempInventoryPath, inventoryYaml)
    fs.writeFileSync(tempTaskConfigPath, taskConfigJson)

    const playbookContent = [
      {
        name: 'Deploy Browser Automation Worker from GitHub Release',
        hosts: 'browser_hosts',
        become: true,
        vars: {
          app_name: 'browser-automation-worker',
          app_dir: '/opt/browser-automation',
          github_repo: config.github.repo,
          task_config_file: tempTaskConfigPath,
          github_token: config.github.token,
        },
        tasks: [
          {
            name: '安装系统依赖',
            apt: {
              name: ['curl', 'ca-certificates', 'gnupg'],
              state: 'present',
              update_cache: true,
            },
          },
          {
            name: '添加 NodeSource v22.x 软件源',
            shell: 'curl -fsSL https://deb.nodesource.com/setup_22.x | bash -',
            args: {
              creates: '/etc/apt/sources.list.d/nodesource.list',
            },
            register: 'nodesource_setup',
            changed_when: `'## Run \`sudo apt-get install -y nodejs\` to install Node.js' in nodesource_setup.stdout`,
          },
          {
            name: '安装 Node.js v22 (从 NodeSource 源)',
            apt: {
              name: ['nodejs'],
              state: 'present',
              update_cache: '{{ nodesource_setup.changed }}',
            },
          },
          {
            name: '获取最新 Release 版本',
            uri: {
              url: 'https://api.github.com/repos/{{ github_repo }}/releases/latest',
              method: 'GET',
              headers: {
                Authorization: 'token {{ github_token }}',
              },
            },
            register: 'release_info',
          },
          {
            name: '设置版本变量',
            set_fact: {
              release_version: '{{ release_info.json.tag_name }}',
              asset_filename: '{{ app_name }}-{{ release_info.json.tag_name }}.tar.gz',
            },
          },
          {
            name: '从 Release 信息中提取资产下载 URL',
            set_fact: {
              asset_download_url: `{{ (release_info.json.assets | selectattr('name', 'equalto', asset_filename) | list | first).url }}`,
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
            name: '创建应用目录',
            file: {
              path: '{{ app_dir }}',
              state: 'directory',
            },
          },
          {
            name: '清理旧的应用文件',
            file: {
              path: '{{ app_dir }}/{{ app_name }}',
              state: 'absent',
            },
          },
          {
            name: '创建应用子目录',
            file: {
              path: '{{ app_dir }}/{{ app_name }}',
              state: 'directory',
            },
          },
          {
            name: '下载应用包',
            shell: `curl --fail -L -H "Authorization: Bearer {{ github_token }}" -H "Accept: application/octet-stream" -o {{ app_dir }}/{{ asset_filename }} "{{ asset_download_url }}"`,
          },
          {
            name: '解压应用包',
            unarchive: {
              src: '{{ app_dir }}/{{ asset_filename }}',
              dest: '{{ app_dir }}/{{ app_name }}',
              remote_src: true,
            },
          },
          {
            name: '安装生产依赖',
            shell: 'pnpm install --prod',
            args: {
              chdir: '{{ app_dir }}/{{ app_name }}',
            },
          },
          {
            name: '复制任务配置文件',
            copy: {
              src: '{{ task_config_file }}',
              dest: '{{ app_dir }}/task.json',
            },
            when: 'task_config_file is defined',
          },
          {
            name: '启动应用',
            shell: 'node src/main.js --config {{ app_dir }}/task.json > {{ app_dir }}/app.log',
            args: {
              chdir: '{{ app_dir }}/{{ app_name }}',
            },
            environment: {
              NODE_ENV: 'production',
            },
          },
          {
            name: '清理下载的压缩包',
            file: {
              path: '{{ app_dir }}/{{ app_name }}-{{ release_version }}.tar.gz',
              state: 'absent',
            },
          },
        ],
      },
    ]

    const tempPlaybookPath = `/tmp/playbook-${environment.id}-${timestamp}.yml`
    const playbookYaml = yaml.dump(playbookContent)
    fs.writeFileSync(tempPlaybookPath, playbookYaml)

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
