export interface profileModalState {
    isOpen: boolean;
    isEditing: boolean;
    formData: {
        username: string;
        description: string;
        avatar?: string;
    };
    avatarFile: File | null;
    error: string;
}

