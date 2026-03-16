/**
 * useGitHubStars - 获取 GitHub 仓库 star 数量（每天缓存一次）
 */

import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSystemStore } from '@/store/system'
import { GITHUB_REPO } from '../constants'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * 获取 GitHub 仓库的 star 数量
 * @returns star 数量字符串（如 "9.5k"）
 */
export function useGitHubStars() {
  const { githubStars, githubStarsUpdatedAt } = useSystemStore(
    useShallow(s => ({
      githubStars: s.githubStars,
      githubStarsUpdatedAt: s.githubStarsUpdatedAt,
    })),
  )

  useEffect(() => {
    if (Date.now() - githubStarsUpdatedAt < ONE_DAY_MS)
      return

    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then(res => res.json())
      .then((data) => {
        if (data.stargazers_count) {
          const count = data.stargazers_count
          const formatted = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()
          useSystemStore.getState().setGitHubStars(formatted)
        }
      })
      .catch(() => {
        // 失败时保持缓存值
      })
  }, [githubStarsUpdatedAt])

  return githubStars
}
