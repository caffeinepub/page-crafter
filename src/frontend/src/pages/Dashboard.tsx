import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import {
  Calculator,
  ChevronRight,
  Clock,
  Edit3,
  FileSignature,
  FileText,
  Layout,
  Loader2,
  Mail,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import TemplatePickerModal from "../components/TemplatePickerModal";
import { BUILT_IN_TEMPLATES } from "../data/templates";
import { useDeleteDesign, useMyDesigns } from "../hooks/useQueries";
import { useEditorStore } from "../store/editorStore";

const categoryIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="w-5 h-5" />,
  quotation: <FileSignature className="w-5 h-5" />,
  letterhead: <Mail className="w-5 h-5" />,
  receipt: <Receipt className="w-5 h-5" />,
};

export default function Dashboard() {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const { data: designs, isLoading } = useMyDesigns();
  const deleteDesign = useDeleteDesign();
  const resetEditor = useEditorStore((s) => s.resetEditor);
  const loadCanvasState = useEditorStore((s) => s.loadCanvasState);

  const handleNewBlank = () => {
    resetEditor();
    router.navigate({ to: "/editor" });
  };

  const handleOpenDesign = (id: string, name: string, content: string) => {
    try {
      loadCanvasState(JSON.parse(content), id, name);
      router.navigate({ to: "/editor/$designId", params: { designId: id } });
    } catch {
      toast.error("Failed to load design");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDesign.mutateAsync(id);
      toast.success("Design deleted");
    } catch {
      toast.error("Failed to delete design");
    }
  };

  const handleUseTemplate = (templateId: string) => {
    const tpl = BUILT_IN_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    resetEditor();
    loadCanvasState(tpl.state, undefined, tpl.name);
    router.navigate({ to: "/editor" });
    setShowPicker(false);
  };

  return (
    <div className="min-h-screen bg-workspace flex flex-col">
      <header className="bg-white border-b border-border h-14 flex items-center px-6 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            Page Crafter
          </span>
        </div>
        <div className="ml-auto">
          <Button
            data-ocid="dashboard.new_design_button"
            onClick={() => setShowPicker(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> New Design
          </Button>
        </div>
      </header>

      <main className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Welcome to Page Crafter
          </h1>
          <p className="text-muted-foreground text-sm">
            Design professional invoices, quotations, letterheads and more.
          </p>
        </motion.div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Start from a Template
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPicker(true)}
              className="gap-1 text-primary"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BUILT_IN_TEMPLATES.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                data-ocid={`dashboard.template_item.${i + 1}`}
              >
                <button
                  type="button"
                  onClick={() => handleUseTemplate(tpl.id)}
                  className="w-full bg-white border border-border rounded-xl p-5 text-left hover:border-primary hover:shadow-md transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white"
                    style={{ background: tpl.accentColor }}
                  >
                    {categoryIcons[tpl.category]}
                  </div>
                  <div className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                    {tpl.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tpl.description}
                  </div>
                  <Badge variant="outline" className="mt-3 text-xs capitalize">
                    {tpl.category}
                  </Badge>
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="mb-6">
          <button
            type="button"
            data-ocid="dashboard.blank_canvas_button"
            onClick={handleNewBlank}
            className="flex items-center gap-3 w-full md:w-auto bg-white border-2 border-dashed border-border rounded-xl px-6 py-4 text-muted-foreground hover:border-primary hover:text-primary transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">
              Start with a blank canvas
            </span>
          </button>
        </div>

        {/* Invoice Generator feature card */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              type="button"
              data-ocid="dashboard.invoice_generator_button"
              onClick={() => router.navigate({ to: "/invoice" })}
              className="flex items-center gap-4 w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-6 py-4 text-left hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">
                  Invoice Generator
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Create dynamic invoices with tables, GST (18%) calculation
                  &amp; PDF/PNG export
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 ml-auto" />
            </button>
          </motion.div>
        </div>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">
            My Designs
          </h2>
          {isLoading ? (
            <div
              className="flex items-center gap-2 text-muted-foreground text-sm"
              data-ocid="dashboard.designs.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your
              designs...
            </div>
          ) : !designs || designs.length === 0 ? (
            <div
              data-ocid="dashboard.designs.empty_state"
              className="bg-white border border-dashed border-border rounded-xl p-12 text-center"
            >
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                No designs yet
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Create your first design using a template or start blank.
              </p>
              <Button size="sm" onClick={() => setShowPicker(true)}>
                Get Started
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {designs.map((design, i) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  data-ocid={`dashboard.design_item.${i + 1}`}
                  className="group bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-all"
                >
                  <div
                    className="h-36 bg-workspace flex items-center justify-center cursor-pointer"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleOpenDesign(
                          design.id,
                          design.name,
                          design.content,
                        );
                    }}
                    onClick={() =>
                      handleOpenDesign(design.id, design.name, design.content)
                    }
                  >
                    {design.thumbnail?.getDirectURL() ? (
                      <img
                        src={design.thumbnail.getDirectURL()}
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm text-foreground truncate mb-1">
                      {design.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Clock className="w-3 h-3" />
                      {new Date(
                        Number(design.modifiedAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`dashboard.edit_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() =>
                          handleOpenDesign(
                            design.id,
                            design.name,
                            design.content,
                          )
                        }
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            data-ocid={`dashboard.delete_button.${i + 1}`}
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Design</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;
                              {design.name}&quot;?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="dashboard.delete_dialog.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              data-ocid="dashboard.delete_dialog.confirm_button"
                              className="bg-destructive"
                              onClick={() => handleDelete(design.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          caffeine.ai
        </a>
      </footer>

      <TemplatePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleUseTemplate}
      />
    </div>
  );
}
