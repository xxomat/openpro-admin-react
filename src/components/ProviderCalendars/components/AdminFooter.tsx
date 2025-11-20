/**
 * Composant AdminFooter
 * 
 * Ce composant affiche un footer avec des informations sur l'application
 * et le lien vers le backend.
 */

import React from 'react';
import { darkTheme } from '../utils/theme';

export function AdminFooter(): React.ReactElement {
  return (
    <footer
      style={{
        marginTop: '32px',
        padding: '16px',
        borderTop: `1px solid ${darkTheme.borderColor}`,
        color: darkTheme.textSecondary,
        fontSize: '12px',
        textAlign: 'center'
      }}
    >
      <div>
        OpenPro.Admin - Backend API: {import.meta.env.PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001'}
      </div>
    </footer>
  );
}

