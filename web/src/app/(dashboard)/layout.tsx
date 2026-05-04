import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import AppInitializer from '@/components/layout/AppInitializer';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppInitializer />
      <Topbar />
      <Sidebar />
      <main className={styles.main}>{children}</main>
      <Footer />
    </>
  );
}
