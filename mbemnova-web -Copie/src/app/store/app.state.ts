import { AuthState }   from './auth/auth.reducer';
import { AnnonceState } from './annonce/annonce.reducer';
import { FavoriState }  from './favori/favori.reducer';
import { UiState }      from './ui/ui.reducer';

export interface AppState {
  auth:    AuthState;
  annonce: AnnonceState;
  favori:  FavoriState;
  ui:      UiState;
}
