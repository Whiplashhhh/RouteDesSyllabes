import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { FournisseurNotifications } from './components/Notifications';
import { FournisseurSession, useSession } from './lib/session';
import { Accueil } from './pages/Accueil';
import { Connexion } from './pages/Connexion';
import { Demo } from './pages/Demo';
import { Editeur } from './pages/Editeur';
import { Jouer } from './pages/Jouer';
import { Vitrine } from './pages/Vitrine';

/** Réserve une page aux personnes connectées. */
function Protege({ children }: { children: ReactNode }) {
  const { utilisateur, chargement, erreur, reessayer } = useSession();
  const lieu = useLocation();
  if (chargement) {
    return (
      <main className="page-attente" aria-busy>
        <span className="chargement-roue" aria-label="Chargement" />
      </main>
    );
  }
  if (erreur) {
    return (
      <main className="page-attente">
        <div className="encart-erreur" role="alert">
          <p>{erreur}</p>
          <button type="button" className="bouton bouton-secondaire" onClick={reessayer}>
            Réessayer
          </button>
        </div>
      </main>
    );
  }
  if (!utilisateur) return <Navigate to="/connexion" replace state={{ depuis: lieu.pathname }} />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <FournisseurSession>
        <FournisseurNotifications>
          <Routes>
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/vitrine" element={<Vitrine />} />
            <Route
              path="/"
              element={
                <Protege>
                  <Accueil />
                </Protege>
              }
            />
            <Route
              path="/seances/nouvelle"
              element={
                <Protege>
                  <Editeur />
                </Protege>
              }
            />
            <Route
              path="/seances/:id"
              element={
                <Protege>
                  <Editeur />
                </Protege>
              }
            />
            <Route
              path="/jouer/:id"
              element={
                <Protege>
                  <Jouer />
                </Protege>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FournisseurNotifications>
      </FournisseurSession>
    </BrowserRouter>
  );
}
