import { getMetadata } from "@/utils/general";
import { DemoPageCore } from "@/app/demo/demoPageCore";

export const metadata = getMetadata({
  title: "Demo",
  keywords: "Demo",
  description: `Demo`,
});

export default function Page() {
  return (
    <>
      <div>11111</div>
      <DemoPageCore />
    </>
  );
}
  