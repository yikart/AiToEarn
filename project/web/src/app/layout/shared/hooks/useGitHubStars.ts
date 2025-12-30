/**
 * useGitHubStars - 获取 GitHub 仓库 star 数量
 */

import { useEffect, useState } from 'react'
import { GITHUB_REPO } from '../constants'

/**
 * 获取 GitHub 仓库的 star 数量
 * @returns star 数量字符串（如 "9.5k"）
 */
export function useGitHubStars() {
  const [starCount, setStarCount] = useState<string>('9.5k')

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then(res => res.json())
      .then((data) => {
        if (data.stargazers_count) {
          const count = data.stargazers_count
          setStarCount(count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString())
        }
      })
      .catch(() => {
        // 失败时保持默认值
      })
  }, [])

  return starCount
}
