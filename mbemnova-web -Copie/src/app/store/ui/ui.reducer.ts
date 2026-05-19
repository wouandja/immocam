import { createReducer, on } from '@ngrx/store';
import { uiActions } from './ui.actions';

export interface UiState {
  loading:     boolean;
  sidebarOpen: boolean;
  isMobile:    boolean;
  modal:       { name: string; data?: any } | null;
}

const initialState: UiState = {
  loading:     false,
  sidebarOpen: false,
  isMobile:    false,
  modal:       null,
};

export const uiReducer = createReducer(
  initialState,
  on(uiActions.setLoading,    (s, { loading }) => ({ ...s, loading })),
  on(uiActions.toggleSidebar, s => ({ ...s, sidebarOpen: !s.sidebarOpen })),
  on(uiActions.closeSidebar,  s => ({ ...s, sidebarOpen: false })),
  on(uiActions.setMobile,     (s, { isMobile }) => ({ ...s, isMobile })),
  on(uiActions.openModal,     (s, { modal, data }) => ({ ...s, modal: { name: modal, data } })),
  on(uiActions.closeModal,    s => ({ ...s, modal: null })),
);
