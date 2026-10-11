import { useState } from 'react';
import type { Retours, SeanceConfig } from '../../../../shared/seance';
import { debloquerAudio, jouerDing, Moteur } from '../../game/retours/sons';
import { direSyllabe, preparerVoix, voixFrancaiseDisponible } from '../../game/retours/voix';
import { BlocReglage, Interrupteur } from './Controles';

interface Props {
  config: SeanceConfig;
  modifierRetours: (maj: Partial<Retours>) => void;
}

function testerMoteur() {
  debloquerAudio();
  const moteur = new Moteur();
  moteur.demarrer();
  moteur.regler(0.3);
  window.setTimeout(() => moteur.regler(0.8), 400);
  window.setTimeout(() => moteur.arreter(), 1100);
  window.setTimeout(jouerDing, 900);
}

/** Retours visuels et sonores : chacun s'active ou se désactive. */
export function SectionRetours({ config, modifierRetours }: Props) {
  const r = config.retours;
  const [voixAbsente, setVoixAbsente] = useState(false);

  const testerVoix = () => {
    preparerVoix();
    if (!voixFrancaiseDisponible()) setVoixAbsente(true);
    direSyllabe(
      config.consonnes[0] && config.voyelles[0]
        ? `${config.consonnes[0]}${config.voyelles[0]}`
        : 'la',
    );
  };

  return (
    <div className="section-editeur">
      <BlocReglage titre="Pendant le glissement">
        <Interrupteur
          libelle="Traînée du son"
          description="La consonne laisse « l l l » derrière elle : le son se prolonge."
          actif={r.trainee}
          onChange={(v) => modifierRetours({ trainee: v })}
        />
        <Interrupteur
          libelle="Petit nuage de fumée"
          description="Quand on tire vite."
          actif={r.fumee}
          onChange={(v) => modifierRetours({ fumee: v })}
        />
      </BlocReglage>

      <BlocReglage titre="Quand la syllabe se forme">
        <Interrupteur
          libelle="Fusion animée"
          description="La syllabe grossit avec un rebond doux et se colore."
          actif={r.fusion}
          onChange={(v) => modifierRetours({ fusion: v })}
        />
        <Interrupteur
          libelle="Petite fête"
          description="Quelques étoiles, légères et courtes."
          actif={r.fete}
          onChange={(v) => modifierRetours({ fete: v })}
        />
        <Interrupteur
          libelle="Retour au départ"
          description="Après une syllabe, le véhicule revient doucement à gauche."
          actif={r.retourAuto}
          onChange={(v) => modifierRetours({ retourAuto: v })}
        />
      </BlocReglage>

      <BlocReglage titre="Sons">
        <Interrupteur
          libelle="Bruitages"
          description="Un petit « ding » et le ronron du moteur, au volume modéré."
          actif={r.bruitages}
          onChange={(v) => modifierRetours({ bruitages: v })}
          onTester={testerMoteur}
        />
        <Interrupteur
          libelle="Voix"
          description="La syllabe est lue à voix haute (jamais une consonne seule)."
          actif={r.voix}
          onChange={(v) => modifierRetours({ voix: v })}
          onTester={testerVoix}
        />
        {voixAbsente && (
          <p className="message-info">
            Aucune voix française n’est installée sur cet appareil : la lecture risque d’avoir un
            accent étranger, ou de rester muette.
          </p>
        )}
      </BlocReglage>

      <BlocReglage titre="Confort">
        <Interrupteur
          libelle="Animations réduites"
          description="Moins de mouvements à l’écran, pour les enfants sensibles."
          actif={r.animationsReduites}
          onChange={(v) => modifierRetours({ animationsReduites: v })}
        />
      </BlocReglage>
    </div>
  );
}
