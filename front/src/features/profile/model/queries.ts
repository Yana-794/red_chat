import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, uploadAvatar } from "@/features/profile/api/profileApi";
import { userKey } from "@/features/auth/model/queries";

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({ mutationFn: updateProfile, onSuccess: (user) => { client.setQueryData(userKey, user); void client.invalidateQueries({ queryKey: ["conversations"] }); } });
}

export function useUploadAvatar() {
  const client = useQueryClient();
  return useMutation({ mutationFn: uploadAvatar, onSuccess: (user) => { client.setQueryData(userKey, user); void client.invalidateQueries({ queryKey: ["conversations"] }); } });
}
