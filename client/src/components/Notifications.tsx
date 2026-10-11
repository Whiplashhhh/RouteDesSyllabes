import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { IconeCoche, IconeFermer } from './Icones';

interface Notification {
  id: number;
  message: string;
  ton: 'succes' | 'info' | 'erreur';
  action?: { libelle: string; faire: () => void };
}

type Notifier = (n: Omit<Notification, 'id'> & { duree?: number }) => void;

const ContexteNotifications = createContext<Notifier>(() => undefined);

/** Petites bulles de confirmation en bas de l'écran (avec action « Annuler » possible). */
export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Notification[]>([]);
  const compteur = useRef(0);

  const retirer = useCallback((id: number) => {
    setListe((l) => l.filter((n) => n.id !== id));
  }, []);

  const notifier = useCallback<Notifier>(
    ({ duree = 3500, ...n }) => {
      const id = ++compteur.current;
      setListe((l) => [...l.slice(-2), { ...n, id }]);
      window.setTimeout(() => retirer(id), duree);
    },
    [retirer],
  );

  return (
    <ContexteNotifications.Provider value={notifier}>
      {children}
      <div className="notifications" role="status" aria-live="polite">
        {liste.map((n) => (
          <div key={n.id} className={`notification notification-${n.ton}`}>
            {n.ton === 'succes' && (
              <span className="notification-pastille">
                <IconeCoche taille={20} />
              </span>
            )}
            <span className="notification-texte">{n.message}</span>
            {n.action && (
              <button
                type="button"
                className="notification-action"
                onClick={() => {
                  n.action?.faire();
                  retirer(n.id);
                }}
              >
                {n.action.libelle}
              </button>
            )}
            <button
              type="button"
              className="notification-fermer"
              aria-label="Fermer"
              onClick={() => retirer(n.id)}
            >
              <IconeFermer taille={18} />
            </button>
          </div>
        ))}
      </div>
    </ContexteNotifications.Provider>
  );
}

export function useNotifier(): Notifier {
  return useContext(ContexteNotifications);
}
