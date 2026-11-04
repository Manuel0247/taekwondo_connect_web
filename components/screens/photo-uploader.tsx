"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { uploadsApi } from "@/lib/api/endpoints";
import { extractApiError } from "@/lib/api-error";
import { useRefreshSessionUser } from "@/lib/hooks/misc";
import { Avatar } from "../ui/display";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { FilePick } from "../ui/file-pick";

/** Photo de profil : sélection → aperçu « Utiliser cette photo ? » → envoi (comme le mobile) */
export function PhotoUploader({
  src, name, model, modelId, onUploaded, size = 88,
}: {
  src?: string | null;
  name: string;
  model: "athlete" | "user";
  modelId?: string;
  onUploaded?: () => void;
  size?: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const refreshUser = useRefreshSessionUser();
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const confirm = async () => {
    if (!file || !modelId) return;
    setBusy(true);
    try {
      await uploadsApi.image(file, { model, model_id: modelId, collection: "photo_profil" });
      await refreshUser().catch(() => {});
      onUploaded?.();
      toast.success("Photo mise à jour");
      setFile(null);
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <Avatar src={src} name={name} size={size} />
        <FilePick
          accept="image/jpeg,image/png"
          onFiles={(f) => setFile(f[0])}
          disabled={!modelId}
          label="Changer la photo"
          className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-2 border-surface bg-primary text-white transition-transform hover:scale-105"
        >
          <Camera className="size-4" />
        </FilePick>
      </div>
      <Dialog
        open={!!file}
        onClose={() => !busy && setFile(null)}
        title="Utiliser cette photo ?"
        size="sm"
        footer={
          <>
            <Button variant="subtle" fullWidth disabled={busy} onClick={() => setFile(null)}>
              Annuler
            </Button>
            <Button fullWidth loading={busy} onClick={confirm}>
              Confirmer
            </Button>
          </>
        }
      >
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Aperçu" className="mx-auto size-48 rounded-full object-cover" />
        )}
      </Dialog>
    </>
  );
}
