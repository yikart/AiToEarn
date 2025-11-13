import type { PageParams } from '@/app/globals'
import { HotContentCore } from '@/app/[lng]/hotContent/HotContentCore'
import { getMetadata } from '@/utils/general'

export async function generateMetadata({ params }: PageParams) {
  return await getMetadata(
    {
      title: '热门内容',
    },
    'en',
  )
}

export default async function Page() {
  // const res = await platformApi.getRankingContents(
  //   "678f4a5618789840c02c8118",
  //   1,
  //   20,
  //   "全部",
  //   "2025-09-16",
  // );

  return (
    <>
      <HotContentCore defaultHotContentData={undefined} />
    </>
  )
}
