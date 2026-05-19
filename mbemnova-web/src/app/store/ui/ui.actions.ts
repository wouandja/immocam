import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const uiActions = createActionGroup({
  source: 'UI',
  events: {
    'Set Loading':       props<{ loading: boolean }>(),
    'Toggle Sidebar':    emptyProps(),
    'Close Sidebar':     emptyProps(),
    'Set Mobile':        props<{ isMobile: boolean }>(),
    'Open Modal':        props<{ modal: string; data?: any }>(),
    'Close Modal':       emptyProps(),
  },
});
