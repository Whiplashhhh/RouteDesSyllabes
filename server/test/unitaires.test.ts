import { describe, expect, it } from 'vitest';
import { configParDefaut, LIMITES, seancesExemples } from '../../shared/seance.js';
import { LimiteurTentatives } from '../src/auth/limiteur.js';
import { creerHacheur } from '../src/auth/motDePasse.js';
import { genererToken, hacherToken } from '../src/auth/sessions.js';
import { chargerConfig } from '../src/config.js';
import { nomDeCopie } from '../src/seances/depot.js';
import { schemaSeanceConfig, schemaSeanceEntree } from '../src/validation.js';
import { ARGON2_TEST } from './aide.js';

describe('mots de passe (argon2id)', () => {
  const hacheur = creerHacheur(ARGON2_TEST);

  it('hache en argon2id et vérifie le bon mot de passe', async () => {
    const hache = await hacheur.hacher('mon-mot-de-passe');
    expect(hache.startsWith('$argon2id$')).toBe(true);
    expect(await hacheur.verifier(hache, 'mon-mot-de-passe')).toBe(true);
    expect(await hacheur.verifier(hache, 'autre-mot-de-passe')).toBe(false);
  });

  it('produit un sel différent à chaque hachage', async () => {
    expect(await hacheur.hacher('identique')).not.toBe(await hacheur.hacher('identique'));
  });

  it('refuse sans planter un hash corrompu', async () => {
    expect(await hacheur.verifier('pas-un-hash', 'x')).toBe(false);
  });

  it('la vérification factice échoue toujours', async () => {
    expect(await hacheur.verifierFactice('peu importe')).toBe(false);
  });
});

describe('tokens de session', () => {
  it('génère 32 octets aléatoires en base64url', () => {
    const token = genererToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(genererToken()).not.toBe(token);
  });

  it('hache en HMAC-SHA256 dépendant du secret', () => {
    const token = genererToken();
    const hache = hacherToken('secret-a', token);
    expect(hache).toMatch(/^[0-9a-f]{64}$/);
    expect(hacherToken('secret-a', token)).toBe(hache);
    expect(hacherToken('secret-b', token)).not.toBe(hache);
  });
});

describe('limiteur de tentatives', () => {
  function creer() {
    let maintenant = 0;
    const limiteur = new LimiteurTentatives({
      seuil: 5,
      fenetreMs: 15 * 60_000,
      delaiInitialMs: 30_000,
      delaiMaxMs: 15 * 60_000,
      maintenant: () => maintenant,
    });
    return { limiteur, avancer: (ms: number) => (maintenant += ms) };
  }

  it('laisse passer sous le seuil', () => {
    const { limiteur } = creer();
    for (let i = 0; i < 4; i++) limiteur.enregistrerEchec('a');
    expect(limiteur.attenteRestante('a')).toBe(0);
  });

  it('impose un délai exponentiel plafonné à partir du seuil', () => {
    const { limiteur } = creer();
    const delais: number[] = [];
    for (let i = 0; i < 12; i++) {
      limiteur.enregistrerEchec('a');
      delais.push(limiteur.attenteRestante('a'));
    }
    expect(delais.slice(0, 4)).toEqual([0, 0, 0, 0]);
    expect(delais.slice(4, 9)).toEqual([30_000, 60_000, 120_000, 240_000, 480_000]);
    expect(delais.slice(9)).toEqual([900_000, 900_000, 900_000]);
  });

  it('lève le blocage une fois le délai écoulé', () => {
    const { limiteur, avancer } = creer();
    for (let i = 0; i < 5; i++) limiteur.enregistrerEchec('a');
    avancer(29_999);
    expect(limiteur.attenteRestante('a')).toBe(1);
    avancer(1);
    expect(limiteur.attenteRestante('a')).toBe(0);
  });

  it('isole les clés', () => {
    const { limiteur } = creer();
    for (let i = 0; i < 5; i++) limiteur.enregistrerEchec('a');
    expect(limiteur.attenteRestante('b')).toBe(0);
  });

  it('repart de zéro après réinitialisation', () => {
    const { limiteur } = creer();
    for (let i = 0; i < 6; i++) limiteur.enregistrerEchec('a');
    limiteur.reinitialiser('a');
    expect(limiteur.attenteRestante('a')).toBe(0);
    limiteur.enregistrerEchec('a');
    expect(limiteur.attenteRestante('a')).toBe(0);
  });

  it('oublie les échecs après la fenêtre', () => {
    const { limiteur, avancer } = creer();
    for (let i = 0; i < 4; i++) limiteur.enregistrerEchec('a');
    avancer(15 * 60_000 + 1);
    limiteur.nettoyer();
    expect(limiteur.taille).toBe(0);
    limiteur.enregistrerEchec('a');
    expect(limiteur.attenteRestante('a')).toBe(0);
  });

  it('borne le nombre de clés suivies', () => {
    const limiteur = new LimiteurTentatives({
      seuil: 5,
      fenetreMs: 1000,
      delaiInitialMs: 1000,
      delaiMaxMs: 1000,
      clesMax: 3,
    });
    for (const cle of ['a', 'b', 'c', 'd', 'e']) limiteur.enregistrerEchec(cle);
    expect(limiteur.taille).toBe(3);
  });
});

describe('validation de la configuration de séance', () => {
  it('accepte la configuration par défaut et les exemples', () => {
    expect(schemaSeanceConfig.safeParse(configParDefaut()).success).toBe(true);
    for (const { config } of seancesExemples()) {
      expect(schemaSeanceConfig.safeParse(config).success).toBe(true);
    }
  });

  it.each([
    ['nbRoutes hors bornes', { nbRoutes: 5 }],
    ['nbRoutes non entier', { nbRoutes: 1.5 }],
    ['voyellesParRoute nul', { voyellesParRoute: 0 }],
    ['graphème invalide', { consonnes: ['l', '<script>'] }],
    ['graphème trop long', { voyelles: ['aaaaa'] }],
    ['liste vide', { consonnes: [] }],
    ['liste trop longue', { voyelles: Array(LIMITES.lettresMax + 1).fill('a') }],
    ['tirage inconnu', { tirage: 'magique' }],
    ['police inconnue', { police: 'comic-sans' }],
  ])('refuse : %s', (_, surcharge) => {
    expect(schemaSeanceConfig.safeParse({ ...configParDefaut(), ...surcharge }).success).toBe(
      false,
    );
  });

  it.each([
    ['couleur non hexadécimale', { couleurUnie: 'red' }],
    ['3 véhicules', { vehicules: configParDefaut().decor.vehicules.slice(0, 3) }],
    ['véhicule inconnu', { vehicules: Array(4).fill({ type: 'fusee', couleur: 'rouge' }) }],
    ['couleur inconnue', { vehicules: Array(4).fill({ type: 'bus', couleur: 'beige' }) }],
    ['fond inconnu', { fond: 'espace' }],
  ])('refuse un décor avec %s', (_, surcharge) => {
    const config = configParDefaut();
    expect(
      schemaSeanceConfig.safeParse({ ...config, decor: { ...config.decor, ...surcharge } }).success,
    ).toBe(false);
  });

  it('refuse une configuration incomplète', () => {
    const { retours: _retours, ...sansRetours } = configParDefaut();
    expect(schemaSeanceConfig.safeParse(sansRetours).success).toBe(false);
  });

  it('normalise : couleur en minuscules, champs inconnus retirés, routes fixes complétées', () => {
    const config = configParDefaut();
    const resultat = schemaSeanceEntree.parse({
      nom: '  Ma séance  ',
      config: {
        ...config,
        routesFixes: [],
        intrus: true,
        decor: { ...config.decor, couleurUnie: '#ABCDEF' },
      },
    });
    expect(resultat.nom).toBe('Ma séance');
    expect(resultat.config.decor.couleurUnie).toBe('#abcdef');
    expect(resultat.config).not.toHaveProperty('intrus');
    expect(resultat.config.routesFixes).toHaveLength(4);
  });

  it('borne la longueur du nom', () => {
    const config = configParDefaut();
    expect(schemaSeanceEntree.safeParse({ nom: '', config }).success).toBe(false);
    expect(schemaSeanceEntree.safeParse({ nom: 'x'.repeat(61), config }).success).toBe(false);
  });
});

describe('nom de copie', () => {
  it('ajoute « (copie) » en respectant la longueur maximale', () => {
    expect(nomDeCopie('Séance')).toBe('Séance (copie)');
    const long = nomDeCopie('a'.repeat(LIMITES.nomMax));
    expect(long).toHaveLength(LIMITES.nomMax);
    expect(long.endsWith(' (copie)')).toBe(true);
  });
});

describe('configuration', () => {
  it('applique les valeurs par défaut en développement', () => {
    const { config, avertissements } = chargerConfig({ STATIC_DIR: '/dossier/inexistant' });
    expect(config.port).toBe(3000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.allowSignup).toBe(false);
    expect(config.cookieSecure).toBe(false);
    expect(config.trustProxy).toBe(false);
    expect(config.staticDir).toBeNull();
    expect(config.databasePath).toMatch(/server[/\\]data[/\\]route-des-syllabes\.sqlite$/);
    expect(avertissements.some((a) => a.includes('SESSION_SECRET'))).toBe(true);
  });

  it("exige un SESSION_SECRET d'au moins 32 caractères en production", () => {
    expect(() => chargerConfig({ NODE_ENV: 'production' })).toThrow(/SESSION_SECRET/);
    expect(() => chargerConfig({ NODE_ENV: 'production', SESSION_SECRET: 'court' })).toThrow(
      /32 caractères/,
    );
    const { config } = chargerConfig({ NODE_ENV: 'production', SESSION_SECRET: 'x'.repeat(32) });
    expect(config.sessionSecret).toHaveLength(32);
  });

  it('lit les booléens et la liste de proxys', () => {
    const { config } = chargerConfig({
      ALLOW_SIGNUP: 'true',
      COOKIE_SECURE: '1',
      TRUST_PROXY: '127.0.0.1, 10.0.0.0/8',
    });
    expect(config.allowSignup).toBe(true);
    expect(config.cookieSecure).toBe(true);
    expect(config.trustProxy).toEqual(['127.0.0.1', '10.0.0.0/8']);
  });

  it('refuse une valeur invalide', () => {
    expect(() => chargerConfig({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => chargerConfig({ ALLOW_SIGNUP: 'peut-être' })).toThrow(/ALLOW_SIGNUP/);
  });
});
