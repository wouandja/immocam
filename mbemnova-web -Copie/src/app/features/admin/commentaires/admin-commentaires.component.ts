import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '@core/services/api/admin.api';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { ToastService } from '@core/services/toast.service';
import { CommentaireResponse } from '@core/services/models';

@Component({
  selector: 'app-admin-commentaires',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  template: `
    <div class="space-y-4">
      <h2 class="text-lg font-bold text-slate-800">Modération des commentaires</h2>

      @if (commentaires().length === 0) {
        <div class="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p class="text-4xl mb-3">💬</p>
          <p class="text-slate-600 font-medium">Aucun commentaire signalé</p>
        </div>
      } @else {
        <div
          class="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50"
        >
          @for (c of commentaires(); track c.id) {
            <div class="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
              <div
                class="w-8 h-8 bg-slate-100 rounded-full flex items-center
                          justify-center text-slate-600 font-semibold text-xs shrink-0"
              >
                {{ c.auteurPrenom[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-semibold text-slate-800">{{ c.auteurPrenom }}</p>
                  <span class="text-xs text-slate-400">{{ c.dateCreation | timeAgo }}</span>
                </div>
                <p class="text-sm text-slate-600">{{ c.contenu }}</p>
              </div>
              <button
                (click)="supprimer(c.id)"
                class="shrink-0 px-3 py-1.5 text-xs border border-red-200 text-red-600
                       rounded-lg hover:bg-red-50 transition-all font-medium"
              >
                Supprimer
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminCommentairesComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(ToastService);
  commentaires = signal<CommentaireResponse[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminApi
      .getCommentaires()
      .subscribe({ next: (r) => this.commentaires.set(r.data.contenu) });
  }

  supprimer(id: number): void {
    this.adminApi.supprimerCommentaire(id).subscribe({
      next: () => {
        this.toast.success('Commentaire supprimé');
        this.load();
      },
    });
  }
}
