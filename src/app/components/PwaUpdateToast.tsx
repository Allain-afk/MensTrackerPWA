import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_TOAST_ID = 'mens-tracker-pwa-update';

export function PwaUpdateToast() {
  const shownRef = useRef(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh || shownRef.current) return;

    shownRef.current = true;

    toast.custom(
      (instance) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#ffffff',
            border: '1px solid #f5d0fe',
            borderRadius: '18px',
            boxShadow: '0 12px 34px rgba(0, 0, 0, 0.14)',
            padding: '14px 16px',
            fontFamily: "'Nunito', sans-serif",
            minWidth: '290px',
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 800,
                color: '#1f2937',
              }}
            >
              New update available.
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
              }}
            >
              Reload to apply the latest offline build.
            </p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(instance.id);
              void updateServiceWorker(true);
            }}
            style={{
              border: 'none',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f472b6, #8b5cf6)',
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '12px',
              fontWeight: 800,
              padding: '10px 14px',
              whiteSpace: 'nowrap',
            }}
          >
            Reload
          </button>
        </div>
      ),
      {
        id: UPDATE_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
      }
    );
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    if (!needRefresh) {
      shownRef.current = false;
      toast.dismiss(UPDATE_TOAST_ID);
    }
  }, [needRefresh]);

  return null;
}
