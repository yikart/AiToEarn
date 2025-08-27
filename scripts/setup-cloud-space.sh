#!/bin/bash

# ==============================================================================
# 脚本名称: deploy_mlx_stack_v7.sh
# 描述:     无密码版。全自动化安装并配置 MultiloginX, Xvfb, Xpra 的
#           三服务 systemd 堆栈，连接时无需密码。
# 警告:     此配置不安全，请务必使用防火墙限制端口访问。
# 版本:     7.0
# ==============================================================================

set -e

# --- 配置变量 ---
XVFB_SERVICE="mlx-xvfb.service"
MLX_APP_SERVICE="mlx-app.service"
XPRA_SERVICE="mlx-xpra.service"

DISPLAY_NUM=":99"
RESOLUTION="1920x1080x24"

# --- 步骤 0: 前置检查和环境设置 ---
echo "--- 步骤 0: 正在进行环境检查 ---"
if [ "$(id -u)" -ne 0 ]; then
   echo "错误：此脚本需要以 root 权限运行。" >&2
   exit 1
fi

if [ -n "$SUDO_USER" ]; then
    RUN_USER=$SUDO_USER
else
    RUN_USER=$(logname 2>/dev/null || echo "ubuntu")
fi
RUN_GROUP=$(id -gn "$RUN_USER")
echo "所有服务将以用户 '$RUN_USER' (用户组 '$RUN_GROUP') 的身份运行。"
echo ""

# --- 步骤 1: 安装依赖项和 MultiloginX ---
echo "--- 步骤 1: 正在安装系统依赖和 MultiloginX ---"
apt-get update
# pwgen 包已移除
apt-get install -y curl xvfb libayatana-appindicator3-1 xpra libavcodec-extra

MLX_DEB_URL="https://mlxdists.s3.eu-west-3.amazonaws.com/mlx/latest/multiloginx-amd64.deb"
MLX_DEB_FILE="/tmp/mlxdeb.deb"

echo "正在下载最新的 MultiloginX..."
curl -L -f -o "${MLX_DEB_FILE}" "${MLX_DEB_URL}"

echo "正在安装 MultiloginX..."
apt-get install -y --fix-broken "${MLX_DEB_FILE}"
rm -f "${MLX_DEB_FILE}"
echo "安装步骤完成。"
echo ""

# 获取命令的绝对路径
XVFB_PATH=$(which Xvfb)
MLX_PATH=$(which mlx)
XPRA_PATH=$(which xpra)
DBUS_PATH=$(which dbus-run-session)

# --- 步骤 2: 创建 systemd 服务 (无密码版) ---
echo "--- 步骤 2: 正在配置 systemd 服务 ---"

# 1. Xvfb 服务
cat << EOF > "/etc/systemd/system/${XVFB_SERVICE}"
[Unit]
Description=X Virtual Frame Buffer (Xvfb) for MLX
After=network.target

[Service]
Type=simple
ExecStart=${XVFB_PATH} ${DISPLAY_NUM} -screen 0 ${RESOLUTION} -ac
Restart=always
User=${RUN_USER}
Group=${RUN_GROUP}

[Install]
WantedBy=multi-user.target
EOF

# 2. mlx 应用服务
cat << EOF > "/etc/systemd/system/${MLX_APP_SERVICE}"
[Unit]
Description=MLX Application Service
Requires=${XVFB_SERVICE}
After=${XVFB_SERVICE}

[Service]
Type=oneshot
RemainAfterExit=yes
Environment=DISPLAY=${DISPLAY_NUM}
ExecStart=/bin/sh -c '${MLX_PATH} &'
User=${RUN_USER}
Group=${RUN_GROUP}

[Install]
WantedBy=multi-user.target
EOF

# 3. Xpra 服务
cat << EOF > "/etc/systemd/system/${XPRA_SERVICE}"
[Unit]
Description=Xpra Session Manager for MLX
Requires=${MLX_APP_SERVICE}
After=${MLX_APP_SERVICE}

[Service]
Type=simple
Environment=DISPLAY=${DISPLAY_NUM}
ExecStart=${DBUS_PATH} ${XPRA_PATH} start --use-display ${DISPLAY_NUM} --bind-tcp=0.0.0.0:10000 --no-daemon
Restart=always
RestartSec=5
User=${RUN_USER}
Group=${RUN_GROUP}

[Install]
WantedBy=multi-user.target
EOF
echo "所有 systemd 服务文件创建成功。"
echo ""

# --- 步骤 3: 激活服务 ---
echo "--- 步骤 3: 正在激活 systemd 服务 ---"
systemctl stop ${XPRA_SERVICE} || true
systemctl stop ${MLX_APP_SERVICE} || true
systemctl stop ${XVFB_SERVICE} || true
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

systemctl daemon-reload
systemctl enable ${XPRA_SERVICE} ${MLX_APP_SERVICE} ${XVFB_SERVICE}
systemctl restart ${XPRA_SERVICE}

# --- 完成 ---
echo ""
echo "======================================================================"
echo "          🎉 部署完成 🎉"
echo "======================================================================"
echo ""
echo "所有服务已启动并设置为开机自启。"
echo "Xpra 服务已在 10000 端口启动，无需密码即可连接。"
echo ""
echo "!! 安全警告 !!"
echo "此配置允许任何人连接。请立即配置防火墙 (例如 ufw)，"
echo "只允许您信任的 IP 地址访问 TCP 端口 10000。"
echo "例如: 'sudo ufw allow from YOUR_IP_ADDRESS to any port 10000'"
echo ""
echo "您可以使用以下命令检查主服务状态:"
echo "  systemctl status ${XPRA_SERVICE}"
echo "======================================================================"
