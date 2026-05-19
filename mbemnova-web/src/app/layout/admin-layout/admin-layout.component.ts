import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-100">
      <app-admin-sidebar/>
      <main class="flex-1 ml-64 p-6 overflow-auto">
        <router-outlet/>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {}
