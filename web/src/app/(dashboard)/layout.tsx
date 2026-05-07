import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Footer from '@/components/layout/Footer';
import AppInitializer from '@/components/layout/AppInitializer';
<<<<<<< HEAD
import { SocketProvider } from '@/context/SocketContext';
=======
>>>>>>> origin/main
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<<<<<<< HEAD
    <SocketProvider>
=======
    <>
>>>>>>> origin/main
      <AppInitializer />
      <Topbar />
      <Sidebar />
      <main className={styles.main}>{children}</main>
      <Footer />
<<<<<<< HEAD
    </SocketProvider>
=======
    </>
>>>>>>> origin/main
  );
}
