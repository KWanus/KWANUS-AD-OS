# Website Builder Fix Plan - Make It Work Like Competitors

## Based on Competitor Research: Webflow, Shopify, Wix, Squarespace

---

## 🎯 Goal

Transform our website builder from "broken and frustrating" to "professional and intuitive" while keeping our AI advantage.

---

## 📋 Implementation Checklist

### Phase 1: Fix Critical Errors ✅ IN PROGRESS
- [x] Research competitors (Webflow, Shopify, Wix)
- [x] Identify missing features
- [x] Clear Turbopack cache
- [ ] Verify server runs without errors
- [ ] Test block rendering works

### Phase 2: Add Drag-and-Drop (CRITICAL)
- [ ] Install @dnd-kit/core
- [ ] Wrap blocks in DndContext
- [ ] Add drag handles to blocks
- [ ] Implement reordering logic
- [ ] Save new order to database

### Phase 3: Add Inline Editing (CRITICAL)
- [ ] Make text contentEditable
- [ ] Add click-to-edit functionality
- [ ] Implement auto-save on blur
- [ ] Add visual feedback

### Phase 4: Improve UX
- [ ] Add undo/redo
- [ ] Convert modal to sidebar
- [ ] Add layout controls
- [ ] Add keyboard shortcuts

---

## 🔧 Phase 2: Drag-and-Drop Implementation

### Step 1: Install Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Step 2: Update InlineEditor.tsx

```typescript
// components/website/InlineEditor.tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';

export function InlineEditor({ siteId, pageId }: { siteId: string; pageId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((blocks) => {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);

        const newBlocks = arrayMove(blocks, oldIndex, newIndex);

        // Update order in database
        updateBlockOrder(newBlocks.map((b, idx) => ({ id: b.id, order: idx })));

        return newBlocks;
      });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              onEdit={handleEditBlock}
              onDelete={handleDeleteBlock}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// API call to update order
async function updateBlockOrder(updates: { id: string; order: number }[]) {
  await fetch(`/api/sites/${siteId}/pages/${pageId}/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
}
```

### Step 3: Create SortableBlock Component

```typescript
// components/website/SortableBlock.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { BlockRenderer } from '../site-builder/BlockRenderer';

export function SortableBlock({
  block,
  onEdit,
  onDelete,
}: {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-xl border border-white/10 hover:border-white/20 transition-all"
    >
      {/* Drag Handle - Left Side */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-white/[0.02] to-transparent"
      >
        <GripVertical className="w-5 h-5 text-white/40" />
      </div>

      {/* Block Controls - Right Side */}
      <div className="absolute right-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => onEdit(block)}
          className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Block Content */}
      <div className="pl-12">
        <BlockRenderer block={block} theme={theme} />
      </div>
    </div>
  );
}
```

### Step 4: Create Reorder API Route

```typescript
// app/api/sites/[siteId]/pages/[pageId]/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; pageId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { siteId, pageId } = await params;
  const { updates } = await req.json();

  // Verify site ownership
  const site = await prisma.site.findUnique({
    where: { id: siteId, userId },
  });

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  // Update block orders in a transaction
  await prisma.$transaction(
    updates.map((update: { id: string; order: number }) =>
      prisma.block.update({
        where: { id: update.id },
        data: { order: update.order },
      })
    )
  );

  return NextResponse.json({ success: true });
}
```

---

## 🔧 Phase 3: Inline Editing Implementation

### Step 1: Add ContentEditable Wrapper

```typescript
// components/website/EditableText.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

export function EditableText({
  content,
  onChange,
  className = '',
  placeholder = 'Click to edit...',
}: {
  content: string;
  onChange: (newContent: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      // Focus and select all text
      contentRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const newContent = contentRef.current?.textContent || '';
    if (newContent !== content) {
      onChange(newContent);
    }
  };

  return (
    <div
      ref={contentRef}
      contentEditable={isEditing}
      onClick={() => setIsEditing(true)}
      onBlur={handleBlur}
      suppressContentEditableWarning
      className={`${className} ${isEditing ? 'outline outline-2 outline-blue-500 outline-offset-2' : 'cursor-text hover:outline hover:outline-1 hover:outline-white/20'}`}
      data-placeholder={!content ? placeholder : ''}
    >
      {content || placeholder}
    </div>
  );
}
```

### Step 2: Update BlockRenderer to Use EditableText

```typescript
// components/site-builder/BlockRenderer.tsx
import { EditableText } from '../website/EditableText';

function HeroBlock({ block, onUpdate }: { block: Block; onUpdate: (updates: Partial<Block>) => void }) {
  const { title, subtitle, buttonText } = block.props ?? {};

  return (
    <section className="...">
      <EditableText
        content={title ?? ''}
        onChange={(newTitle) => onUpdate({ props: { ...block.props, title: newTitle } })}
        className="text-6xl font-black"
        placeholder="Enter headline..."
      />
      <EditableText
        content={subtitle ?? ''}
        onChange={(newSubtitle) => onUpdate({ props: { ...block.props, subtitle: newSubtitle } })}
        className="text-xl"
        placeholder="Enter subheadline..."
      />
      <button>
        <EditableText
          content={buttonText ?? 'Get Started'}
          onChange={(newText) => onUpdate({ props: { ...block.props, buttonText: newText } })}
          className="px-8 py-4 bg-orange-500"
        />
      </button>
    </section>
  );
}
```

### Step 3: Auto-Save Updates

```typescript
// utils/debounce.ts
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// components/website/InlineEditor.tsx
const debouncedSave = debounce(async (blockId: string, updates: Partial<Block>) => {
  await fetch(`/api/sites/${siteId}/blocks/${blockId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  toast.success('Changes saved');
}, 1000); // Save 1 second after user stops typing

const handleUpdateBlock = (blockId: string, updates: Partial<Block>) => {
  // Update local state immediately
  setBlocks(blocks => blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));

  // Save to database (debounced)
  debouncedSave(blockId, updates);
};
```

---

## 🔧 Phase 4: Undo/Redo Implementation

### Step 1: Install use-immer

```bash
npm install use-immer immer
```

### Step 2: Create History Hook

```typescript
// hooks/useHistory.ts
import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<T[]>([initialState]);

  const state = history[index];

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, index + 1);
      const resolvedState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev[index])
        : newState;
      return [...newHistory, resolvedState];
    });
    setIndex((i) => i + 1);
  }, [index]);

  const undo = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) setIndex((i) => i + 1);
  }, [index, history.length]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo };
}
```

### Step 3: Use History in Editor

```typescript
// components/website/InlineEditor.tsx
import { useHistory } from '@/hooks/useHistory';
import { Undo, Redo } from 'lucide-react';

export function InlineEditor({ siteId, pageId }: { siteId: string; pageId: string }) {
  const { state: blocks, setState: setBlocks, undo, redo, canUndo, canRedo } = useHistory<Block[]>([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded-lg bg-white/[0.02] border border-white/10 disabled:opacity-30 hover:bg-white/[0.05]"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded-lg bg-white/[0.02] border border-white/10 disabled:opacity-30 hover:bg-white/[0.05]"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <DndContext onDragEnd={handleDragEnd}>
        {/* ... */}
      </DndContext>
    </div>
  );
}
```

---

## 🔧 Phase 4b: Block Library Sidebar

### Replace Modal with Sidebar

```typescript
// components/website/InlineEditor.tsx
export function InlineEditor({ siteId, pageId }: { siteId: string; pageId: string }) {
  const [showBlockLibrary, setShowBlockLibrary] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Block Library */}
      {showBlockLibrary && (
        <div className="w-80 border-r border-white/10 bg-[#0c0a08] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-black text-white mb-4">Add Sections</h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search blocks..."
              className="w-full px-4 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-white mb-4"
            />

            {/* Categories */}
            <div className="space-y-6">
              {BLOCK_CATEGORIES.map(category => (
                <div key={category.name}>
                  <h3 className="text-sm font-bold text-white/60 mb-3">{category.name}</h3>
                  <div className="space-y-2">
                    {category.blocks.map(block => (
                      <button
                        key={block.type}
                        onClick={() => handleAddBlock(block.type)}
                        className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{block.icon}</div>
                          <div>
                            <p className="text-sm font-bold text-white">{block.name}</p>
                            <p className="text-xs text-white/40">{block.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto">
        {/* Editor content */}
      </div>

      {/* Right Sidebar - Block Settings (when block selected) */}
      {selectedBlock && (
        <div className="w-96 border-l border-white/10 bg-[#0c0a08] overflow-y-auto">
          <BlockSettings block={selectedBlock} onChange={handleUpdateBlock} />
        </div>
      )}
    </div>
  );
}

const BLOCK_CATEGORIES = [
  {
    name: 'Layout',
    blocks: [
      { type: 'hero', name: 'Hero Section', icon: '🎯', description: 'Eye-catching headline + CTA' },
      { type: 'features', name: 'Features', icon: '⭐', description: '3-column benefit showcase' },
      { type: 'testimonials', name: 'Testimonials', icon: '💬', description: 'Customer reviews' },
    ],
  },
  {
    name: 'Conversion',
    blocks: [
      { type: 'pricing', name: 'Pricing', icon: '💰', description: '3-tier pricing table' },
      { type: 'cta', name: 'Call to Action', icon: '🚀', description: 'Centered CTA with button' },
      { type: 'form', name: 'Contact Form', icon: '📧', description: 'Lead capture form' },
    ],
  },
  {
    name: 'Content',
    blocks: [
      { type: 'text', name: 'Text Block', icon: '📝', description: 'Rich text content' },
      { type: 'faq', name: 'FAQ', icon: '❓', description: 'Accordion Q&A' },
      { type: 'stats', name: 'Stats', icon: '📊', description: '4-column numbers showcase' },
    ],
  },
];
```

---

## 📊 Testing Checklist

### After Phase 2 (Drag-and-Drop)
- [ ] Blocks can be dragged up/down
- [ ] Drag handle appears on hover
- [ ] Visual feedback during drag
- [ ] Order persists after refresh
- [ ] Undo/redo works with reordering

### After Phase 3 (Inline Editing)
- [ ] Click text to edit
- [ ] Outline appears when editing
- [ ] Changes save automatically
- [ ] Undo/redo works with text edits
- [ ] No lag or flickering

### After Phase 4 (UX Improvements)
- [ ] Undo/redo with Ctrl+Z / Ctrl+Shift+Z
- [ ] Sidebar shows all blocks
- [ ] Search filters blocks
- [ ] Settings panel updates block
- [ ] Keyboard shortcuts work

---

## 🎯 Success Criteria

Website builder is "working" when:

1. ✅ **Visual Feedback**
   - See blocks in preview
   - Drag handles visible
   - Editing state clear

2. ✅ **Intuitive Controls**
   - Drag to reorder
   - Click to edit
   - Undo mistakes

3. ✅ **No Errors**
   - No console errors
   - Blocks render correctly
   - Changes save properly

4. ✅ **Matches Competitors**
   - Drag-and-drop ✅
   - Inline editing ✅
   - Block library ✅
   - Undo/redo ✅

5. ✅ **Keeps Our Advantages**
   - AI generation ✅
   - Auto-publishing ✅
   - Marketing suite ✅

---

## 🚀 Deployment Plan

### Development
1. Implement Phase 2 (drag-and-drop)
2. Test locally
3. Implement Phase 3 (inline editing)
4. Test locally
5. Implement Phase 4 (UX)
6. Test locally

### Staging
1. Deploy to test environment
2. User testing with 5 people
3. Collect feedback
4. Fix bugs

### Production
1. Deploy to production
2. Monitor for errors
3. Collect user feedback
4. Iterate

---

## 📝 Notes from Competitor Research

### What We Learned

1. **Drag-and-Drop is Table Stakes**
   - Every competitor has it
   - Users expect it
   - Without it, feels "broken"

2. **Inline Editing is Expected**
   - Click-to-edit is standard
   - Sidebar editing feels outdated
   - Immediate feedback is crucial

3. **Undo/Redo is Safety Net**
   - Encourages experimentation
   - Reduces stress
   - Industry standard

4. **Our AI is Unique**
   - Competitors: Basic AI for content
   - Us: ENTIRE BUSINESS generation
   - This is our competitive advantage

### What We Should NOT Copy

1. **Complexity**
   - Webflow: Too many options (overwhelming)
   - Wix: Too much freedom (analysis paralysis)
   - Us: Keep it simple (guided experience)

2. **Pricing**
   - Competitors: $15-$40/month for builder
   - Us: FREE (our advantage)

3. **Separate Tools**
   - Competitors: Website builder only
   - Us: Integrated marketing suite (better)

---

## ✅ Action Items (Prioritized)

1. **TODAY**: Fix block rendering errors
2. **THIS WEEK**: Add drag-and-drop
3. **THIS WEEK**: Add inline editing
4. **THIS WEEK**: Add undo/redo
5. **NEXT WEEK**: Add block library sidebar
6. **NEXT WEEK**: Add layout controls
7. **LATER**: Add responsive editing
8. **LATER**: Add component library

**Goal**: Website builder working professionally within 2 weeks.
