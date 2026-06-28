export interface NotificationResponse {
  id: number;
  type: 'SIGNALEMENT' | 'INSCRIPTION';
  titre: string;
  message: string;
  lien?: string;
  referenceId?: number;
  lu: boolean;
  dateCreation: string;
}
