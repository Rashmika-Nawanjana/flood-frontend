import { SignUp } from '@clerk/nextjs';
import style from './signup.module.css';

export default function SignUpPage() {
  return (
    <div className={style.container}>
      <style>{`
        .cl-rootBox {
          opacity: 1;
        }
        .cl-card {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          border-radius: 12px;
        }
        .cl-socialButtonsBlockButton {
          border-radius: 8px;
        }
        .cl-formButtonPrimary {
          background-color: #3B82F6 !important;
          border-radius: 8px;
        }
        .cl-formButtonPrimary:hover {
          background-color: #2563EB !important;
        }
        .cl-footerActionLink {
          color: #3B82F6;
        }
        /* Hide Clerk branding and development indicators */
        .cl-logoBox,
        .cl-badge,
        [class*="development"],
        [class*="devBadge"],
        .clerk-icon {
          display: none !important;
        }
      `}</style>
      <SignUp
        appearance={{
          baseTheme: undefined,
          elements: {
            rootBox: {
              width: '100%',
            },
            card: {
              backgroundColor: '#1F2937',
              borderColor: '#374151',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            },
            headerTitle: {
              color: '#F3F4F6',
              fontSize: '24px',
            },
            headerSubtitle: {
              color: '#9CA3AF',
            },
            socialButtonsBlockButton: {
              borderColor: '#374151',
              color: '#F3F4F6',
              '&:hover': {
                backgroundColor: '#374151',
              },
            },
            formFieldLabel: {
              color: '#E5E7EB',
            },
            formFieldInput: {
              backgroundColor: '#111827',
              borderColor: '#374151',
              color: '#F3F4F6',
              '&:focus': {
                borderColor: '#3B82F6',
              },
            },
            formButtonPrimary: {
              backgroundColor: '#3B82F6',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#2563EB',
              },
            },
            footerActionLink: {
              color: '#3B82F6',
              '&:hover': {
                color: '#2563EB',
              },
            },
            dividerLine: {
              backgroundColor: '#374151',
            },
            dividerText: {
              color: '#9CA3AF',
            },
          },
        }}
      />
    </div>
  );
}