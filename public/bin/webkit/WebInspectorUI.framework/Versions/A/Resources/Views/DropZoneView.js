/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

// DropZoneView creates an invisible drop zone when a drag enters a target element.
// There are delegate methods for deciding if the drop zone should appear, drag
// progress such as entering and leaving, and the drop itself. Clients should
// always initialize with a delegate and set a target element before showing.

WI.DropZoneView = class DropZoneView extends WI.View
{
    constructor(delegate)
    {
        console.assert(delegate);
        console.assert(typeof delegate.dropZoneShouldAppearForDragEvent === "function");

        super();

        this._delegate = delegate;
        this._targetElement = null;
        this._activelyHandlingDrag = false;

        this.element.classList.add("drop-zone");
    }

    // Public

    get delegate() { return this._delegate; }

    get targetElement()
    {
        return this._targetElement;
    }

    set targetElement(element)
    {
        console.assert(!this._activelyHandlingDrag);

        if (this._targetElement === element)
            return;

        if (!this._boundHandleDragEnter)
            this._boundHandleDragEnter = this._handleDragEnter.bind(this);

        if (this._targetElement)
            this._targetElement.removeEventListener("dragenter", this._boundHandleDragEnter);

        this._targetElement = element;

        if (this._targetElement)
            this._targetElement.addEventListener("dragenter", this._boundHandleDragEnter);
    }

    set text(text)
    {
        this.element.textContent = text;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        console.assert(this._targetElement);

        this.element.addEventListener("dragover", this._handleDragOver.bind(this));
        this.element.addEventListener("dragleave", this._handleDragLeave.bind(this));
        this.element.addEventListener("drop", this._handleDrop.bind(this));
    }

    // Private

    _startActiveDrag()
    {
        console.assert(!this._activelyHandlingDrag);
        this._activelyHandlingDrag = true;
        this.element.classList.add("visible");
    }

    _stopActiveDrag()
    {
        console.assert(this._activelyHandlingDrag);
        this._activelyHandlingDrag = false;
        this.element.classList.remove("visible");
    }

    _handleDragEnter(event)
    {
        console.assert(this.isAttached);
        if (this._activelyHandlingDrag)
            return;

        if (!this._delegate.dropZoneShouldAppearForDragEvent(this, event))
            return;

        this._startActiveDrag();

        if (this._delegate.dropZoneHandleDragEnter)
            this._delegate.dropZoneHandleDragEnter(this, event);
    }

    _handleDragLeave(event)
    {
        if (!this._activelyHandlingDrag)
            return;

        this._stopActiveDrag();

        if (this._delegate.dropZoneHandleDragLeave)
            this._delegate.dropZoneHandleDragLeave(this, event);
    }

    _handleDragOver(event)
    {
        if (!this._activelyHandlingDrag)
            return;

        event.preventDefault();

        event.dataTransfer.dropEffect = "copy";
    }

    _handleDrop(event)
    {
        if (!this._activelyHandlingDrag)
            return;

        event.preventDefault();

        this._stopActiveDrag();

        if (this._delegate.dropZoneHandleDrop)
            this._delegate.dropZoneHandleDrop(this, event);
    }
};
