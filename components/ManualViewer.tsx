"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Download,
  FileText,
  List,
  CheckSquare,
  GripVertical,
  Pencil,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { JobSection, JobStep, Job } from "@/types/database";

interface SectionWithSteps extends Omit<JobSection, "job_id"> {
  job_steps: JobStep[];
}

interface ManualViewerProps {
  job: Job;
  sections: SectionWithSteps[];
}

interface SortableStepProps {
  step: JobStep;
  globalIndex: number;
  onSave: (id: string, title: string, description: string) => void;
}

function SortableStep({ step, globalIndex, onSave }: SortableStepProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onSave(step.id, title, description);
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(step.title);
    setDescription(step.description);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex gap-4 p-4 rounded-lg border bg-card transition-shadow",
        isDragging && "shadow-lg opacity-80 z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-none mt-1 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-none w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
        {globalIndex}
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm text-muted-foreground resize-none rounded-md border border-input bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Check className="h-3 w-3" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-3 w-3" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="font-medium text-sm leading-snug">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
            {step.note && (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded p-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-none" />
                {step.note}
              </div>
            )}
          </>
        )}
      </div>

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="flex-none opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ManualViewer({ job, sections: initialSections }: ManualViewerProps) {
  const [sections, setSections] = useState(initialSections);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allSteps = sections.flatMap((s) =>
    [...s.job_steps].sort((a, b) => a.order_index - b.order_index)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allSteps.findIndex((s) => s.id === active.id);
    const newIndex = allSteps.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(allSteps, oldIndex, newIndex);

    const updatedSections = sections.map((section) => ({
      ...section,
      job_steps: section.job_steps
        .map((step) => ({
          ...step,
          order_index: newOrder.findIndex((s) => s.id === step.id),
        }))
        .sort((a, b) => a.order_index - b.order_index),
    }));
    setSections(updatedSections);

    setSaving(true);
    try {
      await fetch(`/api/jobs/${job.id}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: newOrder.map((s, idx) => ({ ...s, order_index: idx })),
        }),
      });
    } catch {
      toast.error("Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const handleStepSave = async (stepId: string, title: string, description: string) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        job_steps: s.job_steps.map((step) =>
          step.id === stepId ? { ...step, title, description } : step
        ),
      }))
    );

    try {
      await fetch(`/api/jobs/${job.id}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: [{ id: stepId, title, description, order_index: allSteps.findIndex((s) => s.id === stepId) }],
        }),
      });
      toast.success("Step updated");
    } catch {
      toast.error("Failed to save step");
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/export/pdf/${job.id}`, "_blank");
  };

  const handleDownloadSOP = () => {
    window.open(`/api/export/sop/${job.id}`, "_blank");
  };

  let stepCounter = 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{job.title}</h1>
          {job.description && (
            <p className="text-muted-foreground mt-1">{job.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {job.estimated_time && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {job.estimated_time}
              </Badge>
            )}
            <Badge variant="secondary">{allSteps.length} steps</Badge>
            {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownloadSOP}>
            <FileText className="h-4 w-4" />
            SOP
          </Button>
          <Button size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps" className="gap-1.5">
            <List className="h-4 w-4" /> Steps
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5">
            <CheckSquare className="h-4 w-4" /> Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allSteps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {sections.map((section) => {
                  const sectionSteps = [...section.job_steps].sort(
                    (a, b) => a.order_index - b.order_index
                  );
                  return (
                    <div key={section.id}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                        {section.title}
                      </h3>
                      <div className="space-y-2">
                        {sectionSteps.map((step) => {
                          stepCounter++;
                          return (
                            <SortableStep
                              key={step.id}
                              step={step}
                              globalIndex={stepCounter}
                              onSave={handleStepSave}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <div className="space-y-2">
            {allSteps.map((step, idx) => (
              <label
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                  checkedItems.has(step.id)
                    ? "bg-green-50 border-green-200"
                    : "bg-card hover:bg-accent/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={checkedItems.has(step.id)}
                  onChange={(e) => {
                    const next = new Set(checkedItems);
                    if (e.target.checked) next.add(step.id);
                    else next.delete(step.id);
                    setCheckedItems(next);
                  }}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span
                  className={cn(
                    "text-sm",
                    checkedItems.has(step.id) && "line-through text-muted-foreground"
                  )}
                >
                  <span className="font-medium">Step {idx + 1}:</span> {step.title}
                </span>
              </label>
            ))}
          </div>
          {allSteps.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {checkedItems.size} of {allSteps.length} completed
              </span>
              {checkedItems.size > 0 && (
                <button
                  onClick={() => setCheckedItems(new Set())}
                  className="text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
