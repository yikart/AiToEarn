#!/bin/bash

# Ansible CLI 自动安装脚本
# 支持 macOS, Linux (Ubuntu/Debian, CentOS/RHEL) 和通用 pip 安装

set -e

echo "检查 Ansible 安装状态..."

# 检查是否已安装 ansible
if command -v ansible-playbook &> /dev/null; then
    ANSIBLE_VERSION=$(ansible-playbook --version | head -n1 | awk '{print $3}')
    echo "✅ Ansible 已安装，版本: $ANSIBLE_VERSION"
    exit 0
fi

echo "🔧 开始安装 Ansible CLI..."

# 检查 Python 和 pip
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3，请先安装 Python 3"
    exit 1
fi

# 根据操作系统安装 ansible
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 检测到 macOS 系统"
    
    # 优先使用 Homebrew
    if command -v brew &> /dev/null; then
        echo "📦 使用 Homebrew 安装 Ansible..."
        brew install ansible
    else
        echo "⚠️  未找到 Homebrew，使用 pip3 安装..."
        pip3 install --user ansible
    fi
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 检测到 Linux 系统"
    
    # Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        echo "📦 使用 apt 安装 Ansible..."
        sudo apt-get update
        sudo apt-get install -y software-properties-common
        sudo add-apt-repository --yes --update ppa:ansible/ansible
        sudo apt-get install -y ansible
        
    # CentOS/RHEL/Fedora
    elif command -v yum &> /dev/null; then
        echo "📦 使用 yum 安装 Ansible..."
        sudo yum install -y epel-release
        sudo yum install -y ansible
        
    # 使用 dnf (Fedora 新版本)
    elif command -v dnf &> /dev/null; then
        echo "📦 使用 dnf 安装 Ansible..."
        sudo dnf install -y ansible
        
    else
        echo "⚠️  未识别的 Linux 发行版，使用 pip3 安装..."
        pip3 install --user ansible
    fi
    
else
    echo "⚠️  未识别的操作系统，使用 pip3 安装..."
    pip3 install --user ansible
fi

# 验证安装
echo "🔍 验证 Ansible 安装..."
if command -v ansible-playbook &> /dev/null; then
    ANSIBLE_VERSION=$(ansible-playbook --version | head -n1 | awk '{print $3}')
    echo "✅ Ansible 安装成功！版本: $ANSIBLE_VERSION"
else
    echo "❌ Ansible 安装失败，请手动安装"
    echo "💡 建议运行: pip3 install --user ansible"
    exit 1
fi

# 安装 sshpass (SSH 密码认证支持)
echo "🔧 检查 sshpass 安装状态..."
if ! command -v sshpass &> /dev/null; then
    echo "📦 安装 sshpass..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install sshpass
        else
            echo "⚠️  未找到 Homebrew，请手动安装 sshpass"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y sshpass
        elif command -v yum &> /dev/null; then
            sudo yum install -y sshpass
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y sshpass
        else
            echo "⚠️  请手动安装 sshpass"
        fi
    fi
else
    echo "✅ sshpass 已安装"
fi

echo "🎉 Ansible CLI 和依赖安装完成！"