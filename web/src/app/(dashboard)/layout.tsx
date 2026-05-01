import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import AppInitializer from '@/components/layout/AppInitializer';
import { SocketProvider } from '@/context/SocketContext';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider>
      <AppInitializer />
      <Topbar />
      <Sidebar />
      <main className={styles.main}>{children}</main>
      <Footer />
    </SocketProvider>
  );
}
