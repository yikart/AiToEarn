import * as fs from 'node:fs'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { AitoearnUserClient } from '@yikart/aitoearn-user-client'
import { AnsibleService } from '@yikart/ansible'
import { AppException, ResponseCode } from '@yikart/common'
import { BrowserProfileRepository, CloudSpace, CloudSpaceRepository, CloudSpaceStatus } from '@yikart/mongodb'
import { Job } from 'bullmq'
import * as yaml from 'js-yaml'
import * as jwt from 'jsonwebtoken'
import { QueueName } from '../common/enums'
import { config } from '../config'
import { MultiloginAccountService } from '../core/multilogin-account'

interface ConfigureCloudSpaceJobData {
  cloudSpaceId: string
}

@Processor(QueueName.CloudspaceConfigure)
export class CloudSpaceConfigConsumer extends WorkerHost {
  private readonly logger = new Logger(CloudSpaceConfigConsumer.name)

  constructor(
    private readonly cloudSpaceRepository: CloudSpaceRepository,
    private readonly browserProfileRepository: BrowserProfileRepository,
    private readonly multiloginAccountService: MultiloginAccountService,
    private readonly ansibleService: AnsibleService,
    private readonly userClient: AitoearnUserClient,
  ) {
    super()
  }

  async process(job: Job<ConfigureCloudSpaceJobData>) {
    const { cloudSpaceId } = job.data
    this.logger.log(`开始处理配置任务: ${cloudSpaceId}`)

    const cloudSpace = await this.cloudSpaceRepository.getById(cloudSpaceId)
    if (!cloudSpace) {
      throw new AppException(ResponseCode.CloudSpaceNotFound)
    }

    // 更新状态为Configuring
    await this.cloudSpaceRepository.updateById(cloudSpaceId, {
      status: CloudSpaceStatus.Configuring,
    })

    try {
      await this.deployBrowserAgent(cloudSpace)

      await this.cloudSpaceRepository.updateById(cloudSpaceId, {
        status: CloudSpaceStatus.Ready,
      })
    }
    catch (error) {
      this.logger.error({
        job,
        error,
      })

      await this.cloudSpaceRepository.updateById(cloudSpaceId, {
        status: CloudSpaceStatus.Error,
      })

      throw error
    }
  }

  private async deployBrowserAgent(cloudSpace: CloudSpace) {
    this.logger.log(`Deploying browser agent for cloudSpace ${cloudSpace.id}`)

    const profile = await this.browserProfileRepository.getByCloudSpaceId(cloudSpace.id)
    if (!profile) {
      throw new AppException(ResponseCode.BrowserProfileNotFound)
    }

    const multiloginAccount = await this.multiloginAccountService.getById(profile.accountId)

    const dynamicInventory = {
      all: {
        children: {
          browser_hosts: {
            hosts: {
              [`browser-worker-${cloudSpace.id}`]: {
                ansible_host: cloudSpace.ip,
                ansible_user: 'ubuntu',
                ansible_ssh_pass: cloudSpace.password,
                ansible_python_interpreter: '/usr/bin/python3',
              },
            },
          },
        },
      },
    }

    const user = await this.userClient.getUserInfoById({ id: cloudSpace.userId })

    const token = jwt.sign(
      {
        id: user.id,
        mail: user.mail,
        name: user.name,
      },
      config.jwt.secret,
      {
        algorithm: 'HS256',
        expiresIn: config.jwt.expiresIn,
      },
    )

    const localStorageValue = {
      state: {
        token,
        userInfo: user,
      },
      version: 0,
    }

    const taskConfig = {
      multilogin: multiloginAccount,
      folderId: config.multilogin.folderId,
      profileId: profile.profileId,
      windows: [
        {
          url: `https://aitoearn.ai/accounts?spaceId=${cloudSpace.accountGroupId}`,
          localStorage: [
            {
              name: 'User',
              value: JSON.stringify(localStorageValue),
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
    const tempInventoryPath = `/tmp/inventory-${cloudSpace.id}-${timestamp}.yml`
    const tempTaskConfigPath = `/tmp/task-${cloudSpace.id}-${timestamp}.json`

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

    const tempPlaybookPath = `/tmp/playbook-${cloudSpace.id}-${timestamp}.yml`
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
      throw new AppException(ResponseCode.CloudSpaceCreationFailed)
    }

    await this.cloudSpaceRepository.updateById(cloudSpace.id, {
      status: CloudSpaceStatus.Ready,
    })
  }
}
