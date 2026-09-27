/** Tipe khusus lapisan UI (dipisah agar tidak diekspor dari <script setup>). */

export interface ActionMenuItem {
    key: string;
    label: string;
    description?: string;
    icon?: string;
    tone?: 'default' | 'danger';
    disabled?: boolean;
    shortcut?: string;
}

export interface DetailTab {
    key: string;
    label: string;
    count?: number;
    tone?: 'default' | 'warning' | 'danger';
}

export interface ToastPayload {
    tone: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    detail?: string | null;
    timeout?: number;
}
