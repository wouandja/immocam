// =============================================================================
// IMMOCAM — Root Component
// =============================================================================
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DevToolsComponent } from './shared/components/dev-tools/dev-tools.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DevToolsComponent],
  template: `
    <router-outlet/>
    <app-dev-tools/>
  `,
})
export class AppComponent {
  readonly title = 'immocam-frontend';
}
