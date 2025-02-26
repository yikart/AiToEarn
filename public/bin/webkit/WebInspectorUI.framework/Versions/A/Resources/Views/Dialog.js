/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.Dialog = class Dialog extends WI.View
{
    constructor(delegate)
    {
        super();

        this._delegate = delegate;
        this._dismissing = false;
        this._representedObject = null;
        this._cookie = null;
        this._visible = false;
    }

    // Public

    get visible() { return this._visible; }
    get delegate() { return this._delegate; }
    get representedObject() { return this._representedObject; }
    get cookie() { return this._cookie; }

    present(parentElement)
    {
        console.assert(!this.element.parentNode);

        parentElement.appendChild(this.element);

        this._visible = true;

        this.didPresentDialog();
    }

    dismiss(representedObject, cookie)
    {
        if (this._dismissing)
            return;

        let parent = this.element.parentNode;
        if (!parent)
            return;

        this._dismissing = true;
        this._representedObject = representedObject || null;
        this._cookie = cookie || null;
        this._visible = false;

        this.element.remove();

        if (this.representedObjectIsValid(this._representedObject)) {
            if (this._delegate && typeof this._delegate.dialogWasDismissedWithRepresentedObject === "function")
                this._delegate.dialogWasDismissedWithRepresentedObject(this, this._representedObject);
        }

        this._dismissing = false;

        this.didDismissDialog();
    }

    // Protected

    didDismissDialog()
    {
        // Implemented by subclasses.
    }

    didPresetDialog()
    {
        // Implemented by subclasses.
    }

    representedObjectIsValid(value)
    {
        // Can be overridden by subclasses.

        if (this.delegate && typeof this.delegate.isDialogRepresentedObjectValid === "function")
            return this.delegate.isDialogRepresentedObjectValid(this, value);

        return true;
    }
};
