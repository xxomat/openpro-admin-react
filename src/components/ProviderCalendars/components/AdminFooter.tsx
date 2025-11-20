/**
 * Composant AdminFooter
 * 
 * Ce composant affiche un footer avec des informations sur l'application
 * et le lien vers le backend.
 */

import React from 'react';
import { darkTheme } from '../utils/theme';

export function AdminFooter(): React.ReactElement {
  const backendUrl = import.meta.env.PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001';
  
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
        OpenPro.Admin - Backend API:{' '}
        <a
          href={backendUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: darkTheme.info,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          {backendUrl}
        </a>
      </div>
    </footer>
  );
}

