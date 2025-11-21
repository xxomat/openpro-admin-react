/**
 * Configuration du thème dark
 * 
 * Ce fichier définit les couleurs du thème dark pour référence dans les composants React.
 * Les variables CSS sont définies dans Layout.astro et peuvent être utilisées via
 * getComputedStyle ou directement dans les styles inline.
 */

/**
 * Couleurs du thème dark
 */
export const darkTheme = {
  // Couleurs de fond
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  bgHover: '#475569',
  
  // Couleurs de texte
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textMuted: '#64748b',
  
  // Bordures
  borderColor: '#334155',
  borderColorLight: '#475569',
  borderColorDark: '#1e293b',
  
  // Couleurs d'état
  success: '#22c55e',
  successBg: 'rgba(34, 197, 94, 0.15)',
  successBgStrong: 'rgba(34, 197, 94, 0.2)',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  errorBgStrong: 'rgba(220, 38, 38, 0.2)',
  warning: '#eab308',
  info: '#3b82f6',
  infoBg: 'rgba(59, 130, 246, 0.15)',
  // Couleurs de réservation
  bookingBg: '#1e3a8a', // Bleu foncé
  bookingBorder: '#1e40af',
  
  // Couleurs de sélection
  selectionBg: 'rgba(59, 130, 246, 0.2)',
  selectionBorder: '#3b82f6',
  selectionDraggingBg: 'rgba(59, 130, 246, 0.3)',
  
  // Boutons
  buttonPrimaryBg: '#3b82f6',
  buttonPrimaryHover: '#2563eb',
  buttonSecondaryBg: '#475569',
  buttonSecondaryHover: '#64748b',
  buttonDisabledBg: '#334155',
  buttonText: '#ffffff',
  
  // Inputs
  inputBg: '#1e293b',
  inputBorder: '#475569',
  inputText: '#f1f5f9',
  inputFocusBorder: '#3b82f6',
  
  // Grille
  gridHeaderBg: '#1e293b',
  gridCellBg: '#0f172a',
  gridCellWeekendBg: '#1e293b',
  gridCellSelectedBg: 'rgba(59, 130, 246, 0.2)',
  gridCellDraggingBg: 'rgba(59, 130, 246, 0.3)',
  
  // Ombres
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Type pour le thème
 */
export type Theme = typeof darkTheme;

