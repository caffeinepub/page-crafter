import { useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import CanvasWorkspace from "../components/editor/CanvasWorkspace";
import LeftPanel from "../components/editor/LeftPanel";
import RightPanel from "../components/editor/RightPanel";
import TopBar from "../components/editor/TopBar";
import {
  useAutoSave,
  useGetDesign,
  useSaveDesign,
  useUpdateDesign,
} from "../hooks/useQueries";
import { useEditorStore } from "../store/editorStore";

export default function Editor() {
  const params = useParams({ strict: false }) as { designId?: string };
  const designId = params.designId;

  const loadCanvasState = useEditorStore((s) => s.loadCanvasState);
  const getCanvasState = useEditorStore((s) => s.getCanvasState);
  const storeDesignId = useEditorStore((s) => s.designId);
  const setDesignId = useEditorStore((s) => s.setDesignId);
  const designName = useEditorStore((s) => s.designName);
  const pages = useEditorStore((s) => s.pages);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setIsDirty = useEditorStore((s) => s.setIsDirty);

  const saveDesign = useSaveDesign();
  const updateDesign = useUpdateDesign();
  const autoSave = useAutoSave();

  const { data: loadedDesign } = useGetDesign(designId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaving = useRef(false);

  useEffect(() => {
    if (loadedDesign && !storeDesignId) {
      try {
        loadCanvasState(
          JSON.parse(loadedDesign.content),
          loadedDesign.id,
          loadedDesign.name,
        );
      } catch {
        toast.error("Failed to load design content");
      }
    }
  }, [loadedDesign, storeDesignId, loadCanvasState]);

  useEffect(() => {
    if (!isDirty || !storeDesignId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (isSaving.current) return;
      try {
        await autoSave.mutateAsync({
          id: storeDesignId,
          state: getCanvasState(),
        });
        setIsDirty(false);
      } catch {
        /* silent */
      }
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, storeDesignId, getCanvasState, autoSave, setIsDirty]);

  const handleSave = useCallback(async () => {
    if (isSaving.current) return;
    isSaving.current = true;
    const state = getCanvasState();
    const canvasEl = canvasRef.current?.querySelector(
      ".a4-canvas",
    ) as HTMLElement | null;
    try {
      if (storeDesignId) {
        await updateDesign.mutateAsync({
          id: storeDesignId,
          state,
          pageCount: pages.length,
          canvasEl,
        });
        toast.success("Design saved!");
      } else {
        const newId = await saveDesign.mutateAsync({
          name: designName,
          state,
          pageCount: pages.length,
          canvasEl,
        });
        setDesignId(newId);
        toast.success("Design saved!");
      }
      setIsDirty(false);
    } catch {
      toast.error("Failed to save design");
    } finally {
      isSaving.current = false;
    }
  }, [
    storeDesignId,
    designName,
    pages,
    getCanvasState,
    saveDesign,
    updateDesign,
    setDesignId,
    setIsDirty,
  ]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-workspace">
      <TopBar
        onSave={handleSave}
        isSaving={saveDesign.isPending || updateDesign.isPending}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <div ref={canvasRef} className="flex-1 overflow-hidden">
          <CanvasWorkspace onSave={handleSave} />
        </div>
        <RightPanel />
      </div>
    </div>
  );
}
