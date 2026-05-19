export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  errors?: string[];
}

export interface PageResponse<T> {
  contenu: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  timestamp: string;
}
