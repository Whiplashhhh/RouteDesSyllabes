import { useState, type FormEvent } from 'react';
import {
  CONSONNES,
  LIMITES,
  SONS_COMPLEXES_CONSONNES,
  SONS_COMPLEXES_VOYELLES,
  VOYELLES,
  estQuiGlisse,
  type SeanceConfig,
} from '../../../../shared/seance';
import { IconePlus, IconeVague } from '../Icones';
import { BlocReglage, Pastille, Segments } from './Controles';

interface Props {
  config: SeanceConfig;
  modifier: (maj: Partial<SeanceConfig>) => void;
}

type Liste = 'consonnes' | 'voyelles';

/** Choix des lettres : un clavier de pastilles. */
export function SectionLettres({ config, modifier }: Props) {
  const [saisie, setSaisie] = useState('');
  const [typeSaisie, setTypeSaisie] = useState<Liste>('consonnes');
  const [erreur, setErreur] = useState<string | null>(null);

  const basculer = (liste: Liste, g: string) => {
    const actuelle = config[liste];
    modifier({
      [liste]: actuelle.includes(g) ? actuelle.filter((x) => x !== g) : [...actuelle, g],
    });
  };

  const connus = new Set<string>([
    ...CONSONNES,
    ...VOYELLES,
    ...SONS_COMPLEXES_CONSONNES,
    ...SONS_COMPLEXES_VOYELLES,
  ]);
  const persos = [
    ...config.consonnes.filter((g) => !connus.has(g)).map((g) => ['consonnes', g] as const),
    ...config.voyelles.filter((g) => !connus.has(g)).map((g) => ['voyelles', g] as const),
  ];

  const ajouter = (e: FormEvent) => {
    e.preventDefault();
    const g = saisie.trim().toLocaleLowerCase('fr-FR');
    if (!LIMITES.grapheme.test(g)) {
      setErreur('Tapez de 1 à 4 lettres, sans espace ni chiffre.');
      return;
    }
    setErreur(null);
    setSaisie('');
    if (!config[typeSaisie].includes(g)) modifier({ [typeSaisie]: [...config[typeSaisie], g] });
  };

  return (
    <div className="section-editeur">
      <BlocReglage
        titre="Consonnes"
        aide={
          <>
            <span className="legende-vague">
              <IconeVague taille={16} />
            </span>{' '}
            son qui se prolonge, idéal pour débuter
          </>
        }
      >
        <div className="clavier-pastilles">
          {CONSONNES.map((g) => (
            <Pastille
              key={g}
              texte={g}
              actif={config.consonnes.includes(g)}
              glisse={estQuiGlisse(g)}
              onClick={() => basculer('consonnes', g)}
            />
          ))}
        </div>
      </BlocReglage>

      <BlocReglage titre="Voyelles">
        <div className="clavier-pastilles">
          {VOYELLES.map((g) => (
            <Pastille
              key={g}
              texte={g}
              type="voyelle"
              actif={config.voyelles.includes(g)}
              onClick={() => basculer('voyelles', g)}
            />
          ))}
        </div>
      </BlocReglage>

      <BlocReglage titre="Sons complexes" aide="Chaque son forme une seule étiquette.">
        <div className="clavier-pastilles">
          {SONS_COMPLEXES_CONSONNES.map((g) => (
            <Pastille
              key={g}
              texte={g}
              actif={config.consonnes.includes(g)}
              glisse={estQuiGlisse(g)}
              onClick={() => basculer('consonnes', g)}
            />
          ))}
          {SONS_COMPLEXES_VOYELLES.map((g) => (
            <Pastille
              key={g}
              texte={g}
              type="voyelle"
              actif={config.voyelles.includes(g)}
              onClick={() => basculer('voyelles', g)}
            />
          ))}
        </div>
      </BlocReglage>

      <BlocReglage titre="Ajouter un son" aide="Pour un son qui ne figure pas ci-dessus.">
        {persos.length > 0 && (
          <div className="clavier-pastilles">
            {persos.map(([liste, g]) => (
              <Pastille
                key={`${liste}${g}`}
                texte={g}
                type={liste === 'consonnes' ? 'consonne' : 'voyelle'}
                actif
                onClick={() => basculer(liste, g)}
              />
            ))}
          </div>
        )}
        <form className="ajout-son" onSubmit={ajouter}>
          <input
            type="text"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            maxLength={4}
            placeholder="ex. tr"
            aria-label="Son à ajouter"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <Segments
            libelle="Type de son"
            valeur={typeSaisie}
            onChange={setTypeSaisie}
            options={[
              { valeur: 'consonnes', libelle: 'Consonne' },
              { valeur: 'voyelles', libelle: 'Voyelle' },
            ]}
          />
          <button type="submit" className="bouton bouton-secondaire">
            <IconePlus taille={20} />
            Ajouter
          </button>
        </form>
        {erreur && <p className="message-erreur">{erreur}</p>}
      </BlocReglage>
    </div>
  );
}
