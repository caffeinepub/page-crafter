import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type { CanvasState } from "../types/editor";
import { useActor } from "./useActor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function api(actor: unknown) {
  return actor as any;
}

export function useMyDesigns() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["designs"],
    queryFn: async () => {
      if (!actor) return [];
      return api(actor).listMyDesigns();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useGetDesign(id: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["design", id],
    queryFn: async () => {
      if (!actor || !id) throw new Error("No actor or id");
      return api(actor).getDesign(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

async function makeThumbnail(
  canvasEl: HTMLElement | null | undefined,
): Promise<ExternalBlob> {
  try {
    if (canvasEl && typeof html2canvas !== "undefined") {
      const cvs = await html2canvas(canvasEl, {
        scale: 0.3,
        useCORS: true,
        logging: false,
      });
      const bytes = await new Promise<Uint8Array<ArrayBuffer>>((resolve) => {
        cvs.toBlob(
          (blob) => {
            blob
              ?.arrayBuffer()
              .then((ab) =>
                resolve(new Uint8Array(ab) as Uint8Array<ArrayBuffer>),
              );
          },
          "image/jpeg",
          0.7,
        );
      });
      return ExternalBlob.fromBytes(bytes);
    }
  } catch {
    /* fallback */
  }
  return ExternalBlob.fromBytes(
    new Uint8Array(0) as unknown as Uint8Array<ArrayBuffer>,
  );
}

export function useSaveDesign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      state,
      pageCount,
      canvasEl,
    }: {
      name: string;
      state: CanvasState;
      pageCount: number;
      canvasEl?: HTMLElement | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      const content = JSON.stringify(state);
      const thumbnail = await makeThumbnail(canvasEl);
      return api(actor).saveDesign(
        name,
        content,
        thumbnail,
        BigInt(pageCount),
      ) as Promise<string>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["designs"] }),
  });
}

export function useUpdateDesign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      state,
      pageCount,
      canvasEl,
    }: {
      id: string;
      state: CanvasState;
      pageCount: number;
      canvasEl?: HTMLElement | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      const content = JSON.stringify(state);
      const thumbnail = await makeThumbnail(canvasEl);
      return api(actor).updateDesign(
        id,
        content,
        thumbnail,
        BigInt(pageCount),
      ) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["designs"] }),
  });
}

export function useAutoSave() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: ({ id, state }: { id: string; state: CanvasState }) => {
      if (!actor) throw new Error("Not connected");
      return api(actor).autoSaveDesign(
        id,
        JSON.stringify(state),
      ) as Promise<void>;
    },
  });
}

export function useDeleteDesign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Not connected");
      return api(actor).deleteDesign(id) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["designs"] }),
  });
}
