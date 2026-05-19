import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendCodeRequest,
  UtilisateurProfil,
} from '@core/services/models';

export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    // Register
    Register: props<{ req: RegisterRequest }>(),
    'Register Success': props<{ email: string }>(),
    'Register Failure': props<{ error: string }>(),

    // Verify Email
    'Verify Email': props<{ req: VerifyEmailRequest }>(),
    'Verify Email Success': props<{ user: UtilisateurProfil }>(),
    'Verify Email Failure': props<{ error: string }>(),

    // Resend Code
    'Resend Code': props<{ req: ResendCodeRequest }>(),
    'Resend Code Success': emptyProps(),
    'Resend Code Failure': props<{ error: string }>(),

    // Login
    Login: props<{ req: LoginRequest }>(),
    'Login Success': props<{ user: UtilisateurProfil }>(),
    'Login Failure': props<{ error: string }>(),

    // Forgot Password
    'Forgot Password': props<{ req: ForgotPasswordRequest }>(),
    'Forgot Password Success': emptyProps(),
    'Forgot Password Failure': props<{ error: string }>(),

    // Reset Password
    'Reset Password': props<{ req: ResetPasswordRequest }>(),
    'Reset Password Success': emptyProps(),
    'Reset Password Failure': props<{ error: string }>(),

    // Logout
    Logout: emptyProps(),
    'Logout Success': emptyProps(),

    // Update user
    'Update User': props<{ user: UtilisateurProfil }>(),

    // Init from storage
    Init: emptyProps(),
    'Init Success': props<{ user: UtilisateurProfil }>(),
    'Init Failure': emptyProps(),
  },
});
