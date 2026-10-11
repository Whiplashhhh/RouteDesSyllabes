import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  LIMITES,
  configParDefaut,
  type Decor,
  type Retours,
  type SeanceConfig,
} from '../../../shared/seance';
import { ApercuSeance } from '../components/ApercuSeance';
import { SectionDecor } from '../components/editeur/SectionDecor';
import { SectionLettres } from '../components/editeur/SectionLettres';
import { SectionRegles } from '../components/editeur/SectionRegles';
import { SectionRetours } from '../components/editeur/SectionRetours';
import { Entete } from '../components/Entete';
import { IconeCoche, IconeJouer, IconeMelanger, IconeRetour } from '../components/Icones';
import { useNotifier } from '../components/Notifications';
import { api, ErreurApi } from '../lib/api';
import { demanderPleinEcran } from '../lib/pleinEcran';

type Onglet = 'lettres' | 'decor' | 'regles' | 'retours';

const ONGLETS: { id: Onglet; titre: string; numero: number }[] = [
  { id: 'lettres', titre: 'Lettres', numero: 1 },
  { id: 'decor', titre: 'Décor', numero: 2 },
  { id: 'regles', titre: 'Règles', numero: 3 },
  { id: 'retours', titre: 'Retours', numero: 4 },
];

type Statut = 'pret' | 'modifie' | 'enregistrement' | 'enregistre' | 'invalide' | 'erreur';

interface Brouillon {
  nom: string;
  config: SeanceConfig;
}

function probleme(b: Brouillon): string | null {
  if (!b.nom.trim()) return 'Donnez un nom à la séance.';
  if (b.config.consonnes.length === 0) return 'Choisissez au moins une consonne.';
  if (b.config.voyelles.length === 0) return 'Choisissez au moins une voyelle.';
  return null;
}

/** Atelier de création d'une séance, avec aperçu en direct et enregistrement automatique. */
export function Editeur() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const notifier = useNotifier();
  const [brouillon, setBrouillon] = useState<Brouillon | null>(
    id ? null : { nom: 'Ma nouvelle séance', config: configParDefaut() },
  );
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Onglet>('lettres');
  const [statut, setStatut] = useState<Statut>(id ? 'pret' : 'modifie');
  const [generation, setGeneration] = useState(0);
  const idRef = useRef<string | undefined>(id);
  const enregistrementEnCours = useRef<Promise<void> | null>(null);
  const brouillonRef = useRef(brouillon);
  brouillonRef.current = brouillon;
  const dernierEnregistre = useRef<string>('');

  useEffect(() => {
    if (!id || idRef.current !== id || brouillonRef.current) return;
    api
      .seance(id)
      .then((s) => {
        const b = { nom: s.nom, config: s.config };
        dernierEnregistre.current = JSON.stringify(b);
        setBrouillon(b);
        setStatut('enregistre');
      })
      .catch((e: unknown) =>
        setErreurChargement(
          e instanceof ErreurApi ? e.message : 'Oups, la connexion a été coupée.',
        ),
      );
  }, [id]);

  /** Enregistre le brouillon courant (création au premier enregistrement). */
  const enregistrer = useCallback(async (): Promise<string | undefined> => {
    if (enregistrementEnCours.current) await enregistrementEnCours.current;
    const b = brouillonRef.current;
    if (!b) return idRef.current;
    const pb = probleme(b);
    if (pb) {
      setStatut('invalide');
      return undefined;
    }
    const serialise = JSON.stringify(b);
    if (serialise === dernierEnregistre.current && idRef.current) {
      setStatut('enregistre');
      return idRef.current;
    }
    setStatut('enregistrement');
    const travail = (async () => {
      const entree = { nom: b.nom.trim(), config: b.config };
      if (idRef.current) {
        await api.modifierSeance(idRef.current, entree);
      } else {
        const creee = await api.creerSeance(entree);
        idRef.current = creee.id;
        naviguer(`/seances/${creee.id}`, { replace: true });
      }
      dernierEnregistre.current = serialise;
    })();
    enregistrementEnCours.current = travail;
    try {
      await travail;
      setStatut(JSON.stringify(brouillonRef.current) === serialise ? 'enregistre' : 'modifie');
      return idRef.current;
    } catch (e) {
      setStatut('erreur');
      notifier({ ton: 'erreur', message: e instanceof ErreurApi ? e.message : String(e) });
      return undefined;
    } finally {
      enregistrementEnCours.current = null;
    }
  }, [naviguer, notifier]);

  // Enregistrement automatique, un court instant après la dernière modification.
  useEffect(() => {
    if (!brouillon || statut !== 'modifie') return;
    const minuteur = window.setTimeout(() => void enregistrer(), 900);
    return () => window.clearTimeout(minuteur);
  }, [brouillon, statut, enregistrer]);

  // Prévenir avant de fermer l'onglet avec des changements non enregistrés.
  useEffect(() => {
    const avertir = (e: BeforeUnloadEvent) => {
      if (statut === 'modifie' || statut === 'enregistrement') e.preventDefault();
    };
    window.addEventListener('beforeunload', avertir);
    return () => window.removeEventListener('beforeunload', avertir);
  }, [statut]);

  const modifier = (maj: Partial<Brouillon>) => {
    setBrouillon((b) => (b ? { ...b, ...maj } : b));
    setStatut('modifie');
  };
  const modifierConfig = (maj: Partial<SeanceConfig>) =>
    brouillon && modifier({ config: { ...brouillon.config, ...maj } });
  const modifierDecor = (maj: Partial<Decor>) =>
    brouillon && modifierConfig({ decor: { ...brouillon.config.decor, ...maj } });
  const modifierRetours = (maj: Partial<Retours>) =>
    brouillon && modifierConfig({ retours: { ...brouillon.config.retours, ...maj } });

  const terminer = async () => {
    const ok = await enregistrer();
    if (ok) {
      notifier({ ton: 'succes', message: 'C’est enregistré !' });
      naviguer('/');
    }
  };

  const jouer = async () => {
    demanderPleinEcran();
    const ok = await enregistrer();
    if (ok) naviguer(`/jouer/${ok}`);
  };

  if (erreurChargement) {
    return (
      <div className="page-maitresse">
        <Entete />
        <main className="contenu">
          <div className="encart-erreur" role="alert">
            <p>{erreurChargement}</p>
            <Link to="/" className="bouton bouton-secondaire">
              Retour à mes séances
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const pb = brouillon ? probleme(brouillon) : null;
  const libelleStatut: Record<Statut, string> = {
    pret: '',
    modifie: 'Modifications en cours…',
    enregistrement: 'Enregistrement…',
    enregistre: 'Enregistré',
    invalide: pb ?? 'À compléter',
    erreur: 'Pas encore enregistré',
  };

  return (
    <div className="page-maitresse page-editeur">
      <Entete />
      <main className="contenu contenu-editeur">
        <div className="editeur-barre">
          <Link to="/" className="bouton-discret" onClick={() => void enregistrer()}>
            <IconeRetour taille={20} />
            Mes séances
          </Link>
          <span className={`statut statut-${statut}`} role="status" aria-live="polite">
            {statut === 'enregistre' && <IconeCoche taille={18} />}
            {libelleStatut[statut]}
          </span>
        </div>

        {!brouillon ? (
          <div className="editeur-chargement">
            <div className="squelette-ligne epaisse" style={{ width: '40%' }} />
            <div className="apercu squelette-bloc" />
          </div>
        ) : (
          <div className="editeur">
            <div className="editeur-reglages">
              <label className="champ-nom">
                <span className="visuellement-cache">Nom de la séance</span>
                <input
                  type="text"
                  value={brouillon.nom}
                  maxLength={LIMITES.nomMax}
                  placeholder="Nom de la séance"
                  onChange={(e) => modifier({ nom: e.target.value })}
                />
              </label>

              <nav className="onglets" role="tablist" aria-label="Réglages de la séance">
                {ONGLETS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={onglet === o.id}
                    className={`onglet${onglet === o.id ? ' actif' : ''}`}
                    onClick={() => setOnglet(o.id)}
                  >
                    <span className="onglet-numero">{o.numero}</span>
                    {o.titre}
                  </button>
                ))}
              </nav>

              <div role="tabpanel" className="panneau-onglet">
                {onglet === 'lettres' && (
                  <SectionLettres config={brouillon.config} modifier={modifierConfig} />
                )}
                {onglet === 'decor' && (
                  <SectionDecor config={brouillon.config} modifierDecor={modifierDecor} />
                )}
                {onglet === 'regles' && (
                  <SectionRegles config={brouillon.config} modifier={modifierConfig} />
                )}
                {onglet === 'retours' && (
                  <SectionRetours config={brouillon.config} modifierRetours={modifierRetours} />
                )}
              </div>
            </div>

            <aside className="editeur-apercu">
              <div className="apercu-cadre">
                <ApercuSeance
                  config={brouillon.config}
                  graine={idRef.current ?? 'nouvelle'}
                  generation={generation}
                  interactif
                />
              </div>
              <p className="apercu-legende">
                Aperçu en direct : vous pouvez faire glisser les véhicules.
              </p>
              <div className="apercu-actions">
                <button
                  type="button"
                  className="bouton bouton-secondaire"
                  onClick={() => setGeneration((g) => g + 1)}
                >
                  <IconeMelanger taille={22} />
                  Nouvelles lettres
                </button>
                <button
                  type="button"
                  className="bouton bouton-soleil"
                  onClick={() => void jouer()}
                  disabled={!!pb}
                >
                  <IconeJouer taille={22} />
                  Jouer
                </button>
              </div>
              {pb && <p className="message-info">{pb}</p>}
              <button
                type="button"
                className="bouton bouton-principal bouton-large bouton-enregistrer"
                onClick={() => void terminer()}
                disabled={!!pb || statut === 'enregistrement'}
              >
                <IconeCoche taille={24} />
                Enregistrer et revenir aux séances
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
