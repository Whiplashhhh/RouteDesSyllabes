import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Identifiants, Utilisateur } from '../../../shared/api';
import { api, ErreurApi } from './api';

interface Session {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  /** Erreur réseau au démarrage (distincte d'un simple « non connectée »). */
  erreur: string | null;
  connecter: (identifiants: Identifiants) => Promise<void>;
  inscrire: (identifiants: Identifiants) => Promise<void>;
  deconnecter: () => Promise<void>;
  reessayer: () => void;
}

const ContexteSession = createContext<Session | null>(null);

export function FournisseurSession({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    api
      .moi()
      .then((u) => actif && (setUtilisateur(u), setErreur(null)))
      .catch((e: unknown) => {
        if (!actif) return;
        setUtilisateur(null);
        setErreur(e instanceof ErreurApi && e.statut === 0 ? e.message : null);
      })
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
  }, [essai]);

  const connecter = useCallback(async (identifiants: Identifiants) => {
    setUtilisateur(await api.connexion(identifiants));
  }, []);

  const inscrire = useCallback(async (identifiants: Identifiants) => {
    setUtilisateur(await api.inscription(identifiants));
  }, []);

  const deconnecter = useCallback(async () => {
    try {
      await api.deconnexion();
    } finally {
      setUtilisateur(null);
    }
  }, []);

  return (
    <ContexteSession.Provider
      value={{
        utilisateur,
        chargement,
        erreur,
        connecter,
        inscrire,
        deconnecter,
        reessayer: () => setEssai((n) => n + 1),
      }}
    >
      {children}
    </ContexteSession.Provider>
  );
}

export function useSession(): Session {
  const s = useContext(ContexteSession);
  if (!s) throw new Error('useSession doit être utilisé dans FournisseurSession');
  return s;
}
