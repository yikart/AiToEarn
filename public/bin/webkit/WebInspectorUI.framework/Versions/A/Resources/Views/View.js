/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.View = class View extends WI.Object
{
    constructor(element)
    {
        super();

        this._element = element || document.createElement("div");
        this._element.__view = this;
        this._parentView = null;
        this._subviews = [];
        this._dirty = false;
        this._dirtyDescendantsCount = 0;
        this._isAttachedToRoot = false;
        this._layoutReason = null;
        this._didInitialLayout = false;
    }

    // Static

    static fromElement(element)
    {
        if (!element || !(element instanceof HTMLElement))
            return null;

        if (element.__view instanceof WI.View)
            return element.__view;
        return null;
    }

    static rootView()
    {
        if (!WI.View._rootView) {
            // Since the root view is attached by definition, it does not go through the
            // normal view attachment process. Simply mark it as attached.
            WI.View._rootView = new WI.View(document.body);
            WI.View._rootView._isAttachedToRoot = true;
        }

        return WI.View._rootView;
    }

    // Public

    get element() { return this._element; }
    get layoutPending() { return this._dirty; }
    get parentView() { return this._parentView; }
    get subviews() { return this._subviews; }
    get isAttached() { return this._isAttachedToRoot; }

    isDescendantOf(view)
    {
        let parentView = this._parentView;
        while (parentView) {
            if (parentView === view)
                return true;
            parentView = parentView.parentView;
        }

        return false;
    }

    addSubview(view)
    {
        this.insertSubviewBefore(view, null);
    }

    insertSubviewBefore(view, referenceView)
    {
        console.assert(view instanceof WI.View);
        console.assert(!referenceView || referenceView instanceof WI.View);
        console.assert(view !== WI.View._rootView, "Root view cannot be a subview.");

        console.assert(!view.parentView, view);

        if (this._subviews.includes(view)) {
            console.assert(false, "Cannot add view that is already a subview.", view);
            return;
        }

        const beforeIndex = referenceView ? this._subviews.indexOf(referenceView) : this._subviews.length;
        if (beforeIndex === -1) {
            console.assert(false, "Cannot insert view. Invalid reference view.", referenceView);
            return;
        }

        this._subviews.insertAtIndex(view, beforeIndex);

        console.assert(!view.element.parentNode || this._element.contains(view.element.parentNode), "Subview DOM element must be a descendant of the parent view element.");
        if (!view.element.parentNode)
            this._element.insertBefore(view.element, referenceView ? referenceView.element : null);

        view._didMoveToParent(this);
    }

    removeSubview(view)
    {
        console.assert(view instanceof WI.View);
        console.assert(this._element.contains(view.element), "Subview DOM element must be a child of the parent view element.");

        let index = this._subviews.lastIndexOf(view);
        if (index === -1) {
            console.assert(false, "Cannot remove view which isn't a subview.", view);
            return;
        }

        view._didMoveToParent(null);

        this._subviews.splice(index, 1);
        view.element.remove();
    }

    removeAllSubviews()
    {
        for (let subview of this._subviews)
            subview._didMoveToParent(null);

        this._subviews = [];
        this._element.removeChildren();
    }

    replaceSubview(oldView, newView)
    {
        console.assert(oldView !== newView, "Cannot replace subview with itself.");
        if (oldView === newView)
            return;

        this.insertSubviewBefore(newView, oldView);
        this.removeSubview(oldView);
    }

    updateLayout(layoutReason)
    {
        this._setLayoutReason(layoutReason);
        this._layoutSubtree();
        this._parentView?.didLayoutSubtree();
    }

    updateLayoutIfNeeded(layoutReason)
    {
        if (!this._dirty && this._didInitialLayout)
            return;

        this.updateLayout(layoutReason);
    }

    needsLayout(layoutReason)
    {
        this._setLayoutReason(layoutReason);

        WI.View._scheduleLayoutForView(this);
    }

    // Protected

    get layoutReason() { return this._layoutReason; }
    get didInitialLayout() { return this._didInitialLayout; }

    attached()
    {
        // Implemented by subclasses.
    }

    detached()
    {
        // Implemented by subclasses.
    }

    initialLayout()
    {
        // Implemented by subclasses.

        // Called once when the view is shown for the first time.
        // Views with complex DOM subtrees should create UI elements in
        // initialLayout rather than at construction time.
    }

    layout()
    {
        // Implemented by subclasses.

        // Not responsible for recursing to child views.
        // Should not be called directly; use updateLayout() instead.
    }

    didLayoutSubtree()
    {
        // Implemented by subclasses.

        // Called after the view and its entire subtree have finished layout.
        // Also called on the immediate parent view that did not layout because it wasn't dirty.
    }

    sizeDidChange()
    {
        // Implemented by subclasses.

        // Called after initialLayout, and before layout.
    }

    // Private

    _setDirty(dirty)
    {
        if (this._dirty === dirty)
            return;

        this._dirty = dirty;

        for (let parentView = this.parentView; parentView; parentView = parentView.parentView) {
            parentView._dirtyDescendantsCount += this._dirty ? 1 : -1;
            console.assert(parentView._dirtyDescendantsCount >= 0);
        }
    }

    _didMoveToParent(parentView)
    {
        if (this._parentView === parentView)
            return;

        let dirtyDescendantsCount = this._dirtyDescendantsCount;
        if (this._dirty)
            ++dirtyDescendantsCount;

        if (dirtyDescendantsCount) {
            for (let view = this.parentView; view; view = view.parentView) {
                view._dirtyDescendantsCount -= dirtyDescendantsCount;
                console.assert(view._dirtyDescendantsCount >= 0);
            }
        }

        this._parentView = parentView;
        let isAttachedToRoot = this.isDescendantOf(WI.View._rootView);

        let views = [this];
        for (let i = 0; i < views.length; ++i) {
            let view = views[i];
            views.pushAll(view.subviews);

            view._dirty = false;
            view._dirtyDescendantsCount = 0;

            if (view._isAttachedToRoot === isAttachedToRoot)
                continue;

            view._isAttachedToRoot = isAttachedToRoot;
            if (view._isAttachedToRoot)
                view.attached();
            else
                view.detached();
        }

        if (isAttachedToRoot)
            WI.View._scheduleLayoutForView(this);
    }

    _layoutSubtree()
    {
        this._setDirty(false);
        let isInitialLayout = !this._didInitialLayout;
        if (isInitialLayout) {
            console.assert(WI.setReentrantCheck(this, "initialLayout"), "ERROR: calling `initialLayout` while already in it", this);
            this.initialLayout();
            this._didInitialLayout = true;
        }

        if (this._layoutReason === WI.View.LayoutReason.Resize || isInitialLayout) {
            console.assert(WI.setReentrantCheck(this, "sizeDidChange"), "ERROR: calling `sizeDidChange` while already in it", this);
            this.sizeDidChange();
            console.assert(WI.clearReentrantCheck(this, "sizeDidChange"), "ERROR: missing return from `sizeDidChange`", this);
        }

        let savedLayoutReason = this._layoutReason;
        if (isInitialLayout) {
            // The initial layout should always be treated as dirty.
            this._setLayoutReason();
        }

        console.assert(WI.setReentrantCheck(this, "layout"), "ERROR: calling `layout` while already in it", this);
        this.layout();
        console.assert(WI.clearReentrantCheck(this, "layout"), "ERROR: missing return from `layout`", this);

        // Ensure that the initial layout override doesn't affects to subviews.
        this._layoutReason = savedLayoutReason;

        if (WI.settings.debugEnableLayoutFlashing.value)
            this._drawLayoutFlashingOutline(isInitialLayout);

        for (let view of this._subviews) {
            view._setLayoutReason(this._layoutReason);
            view._layoutSubtree();
        }

        this._layoutReason = null;

        console.assert(WI.setReentrantCheck(this, "didLayoutSubtree"), "ERROR: calling `didLayoutSubtree` while already in it", this);
        this.didLayoutSubtree();
        console.assert(WI.clearReentrantCheck(this, "didLayoutSubtree"), "ERROR: missing return from `didLayoutSubtree`", this);
    }

    _setLayoutReason(layoutReason)
    {
        this._layoutReason = layoutReason || WI.View.LayoutReason.Dirty;
    }

    _drawLayoutFlashingOutline(isInitialLayout)
    {
        if (this._layoutFlashingTimeout)
            clearTimeout(this._layoutFlashingTimeout);
        else
            this._layoutFlashingPreviousOutline = this._element.style.outline;

        let hue = isInitialLayout ? 20 : 40;
        this._element.style.outline = `1px solid hsla(${hue}, 100%, 51%, 0.8)`;

        this._layoutFlashingTimeout = setTimeout(() => {
            if (this._element)
                this._element.style.outline = this._layoutFlashingPreviousOutline;

            this._layoutFlashingTimeout = undefined;
            this._layoutFlashingPreviousOutline = null;
        }, 500);
    }

    // Layout controller logic

    static _scheduleLayoutForView(view)
    {
        view._setDirty(true);

        if (!view._isAttachedToRoot)
            return;

        if (WI.View._scheduledLayoutUpdateIdentifier)
            return;

        WI.View._scheduledLayoutUpdateIdentifier = requestAnimationFrame(WI.View._visitViewTreeForLayout);
    }

    static _visitViewTreeForLayout()
    {
        console.assert(WI.View._rootView, "Cannot layout view tree without a root.");

        WI.View._scheduledLayoutUpdateIdentifier = undefined;

        let views = [WI.View._rootView];
        let cleanViews = new Set;
        for (let i = 0; i < views.length; ++i) {
            let view = views[i];

            if (cleanViews.has(view)) {
                console.assert(WI.setReentrantCheck(view, "didLayoutSubtree"), "ERROR: calling `didLayoutSubtree` while already in it", view);
                view.didLayoutSubtree();
                console.assert(WI.clearReentrantCheck(view, "didLayoutSubtree"), "ERROR: missing return from `didLayoutSubtree`", view);
                continue;
            }

            if (view.layoutPending) {
                view._layoutSubtree();
                continue;
            }

            if (view._dirtyDescendantsCount) {
                cleanViews.add(view);

                let hasDirtySubview = false;
                for (let subview of view.subviews) {
                    hasDirtySubview ||= subview.layoutPending;
                    views.push(subview);
                }

                // Add again the parent view to the list we're iterating over, right after its subviews.
                // By the time it is encountered again, all its subviews will have done _layoutSubtree() and then we can call didLayoutSubtree() on it.
                if (hasDirtySubview)
                    views.push(view);
                continue;
            }
        }
    }
};

WI.View.LayoutReason = {
    Dirty: Symbol("layout-reason-dirty"),
    Resize: Symbol("layout-reason-resize")
};

WI.View._rootView = null;
WI.View._scheduledLayoutUpdateIdentifier = undefined;
