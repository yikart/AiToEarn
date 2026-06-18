Set-Location 'E:\project-dev\web\艺咖\aitoearn\AiToEarn\project\aitoearn-backend'
$env:NX_DAEMON='false'
$env:NO_COLOR='1'
pnpm nx serve aitoearn-ai --configuration=local *>&1 | Tee-Object -FilePath 'E:\project-dev\web\艺咖\aitoearn\AiToEarn\project\aitoearn-backend\.scratch\logs\aitoearn-ai.log'
