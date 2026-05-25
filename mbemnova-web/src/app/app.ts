import {
  ChangeDetectionStrategy, Component, inject, computed, signal, effect, PLATFORM_ID, OnInit
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthApi } from '@core/services/api/auth.api';
import { StorageService } from '@core/services/storage.service';
import { Store } from '@ngrx/store';
import { authActions } from '@store/auth/auth.actions';
 
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App   implements OnInit {
  private readonly store   = inject(Store);
  private readonly storage = inject(StorageService);
  private readonly authApi = inject(AuthApi);

  ngOnInit(): void {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) return;

    // Token présent → on vérifie qu'il est encore valide
    this.authApi.refresh({ refreshToken }).subscribe({
      next: (res) => {
        if (res?.data) {
          this.store.dispatch(authActions.loginSuccess({ user: res.data }));
        }
      },
      error: () => {
        // Token expiré/invalide → on nettoie
        this.storage.clearTokens();
        this.store.dispatch(authActions.logout());
      },
    });
  }
}