/** Demande le plein écran (doit être appelé pendant un geste de l'utilisatrice). */
export function demanderPleinEcran(): void {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
      /* refusé ou non disponible : le jeu fonctionne quand même */
    });
  }
}

export function quitterPleinEcran(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
}
