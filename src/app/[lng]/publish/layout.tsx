import styles from "./publish.module.scss";
import PublishSidebar from "@/app/[lng]/publish/components/PublishSidebar";

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}>) {
  return (
    <div className={styles.publish}>
      <PublishSidebar />
      {children}
    </div>
  );
}
