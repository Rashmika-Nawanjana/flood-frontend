import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.copyright}>© 2026 FloodSense LK</span>
      <div className={styles.status}>
        <span className={styles.statusDot} />
        <span className={styles.statusText}>System Online</span>
      </div>
    </footer>
  );
}
