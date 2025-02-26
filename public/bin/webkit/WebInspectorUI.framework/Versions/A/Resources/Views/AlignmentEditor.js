/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.AlignmentEditor = class AlignmentEditor extends WI.Object
{
    constructor()
    {
        super();

        this._alignment = null;
        this._valueToGlyphElement = new Map;

        this._element = document.createElement("div");
        this._element.className = "alignment-editor";
        this._element.role = "radiogroup";
    }

    // Static

    static glyphPath(alignment)
    {
        let glyphs = WI.AlignmentEditor._glyphsForType(alignment.type);
        console.assert(glyphs, `No glyphs found for propertyName: ${alignment.type}`);
        return glyphs?.[alignment.text] || WI.AlignmentEditor.UnknownValueGlyph;
    }

    static shouldRotateGlyph(type)
    {
        // FIXME: <https://webkit.org/b/233053> Web Inspector: mirror/rotate alignment icons when flex-direction/grid-auto-flow/RTL affect axis or direction
        switch (type) {
        case WI.AlignmentData.Type.JustifyContent:
        case WI.AlignmentData.Type.JustifyItems:
        case WI.AlignmentData.Type.JustifySelf:
            return true;
        case WI.AlignmentData.Type.AlignContent:
        case WI.AlignmentData.Type.AlignItems:
        case WI.AlignmentData.Type.AlignSelf:
            return false;
        }
        console.assert(false, "Unsupported type", type);
        return false;
    }

    static _glyphsForType(type)
    {
        switch (type) {
        case WI.AlignmentData.Type.AlignContent:
        case WI.AlignmentData.Type.JustifyContent:
            return WI.AlignmentEditor.AlignContentGlyphs;
        case WI.AlignmentData.Type.AlignItems:
        case WI.AlignmentData.Type.AlignSelf:
        case WI.AlignmentData.Type.JustifyItems:
        case WI.AlignmentData.Type.JustifySelf:
            return WI.AlignmentEditor.AlignItemsGlyphs;
        }
        return null;
    }

    // Public

    get element() { return this._element; }

    get alignment()
    {
        return this._alignment;
    }

    set alignment(alignment)
    {
        console.assert(alignment instanceof WI.AlignmentData);

        if (this._alignment?.type !== alignment.type) {
            this._valueToGlyphElement.clear();
            this._element.removeChildren();

            // FIXME: <https://webkit.org/b/233053> Web Inspector: mirror/rotate alignment icons when flex-direction/grid-auto-flow/RTL affect axis or direction
            let shouldRotate = WI.AlignmentEditor.shouldRotateGlyph(alignment.type)

            for (let [value, path] of Object.entries(WI.AlignmentEditor._glyphsForType(alignment.type))) {
                let glyphElement = WI.ImageUtilities.useSVGSymbol(path, "glyph", value);
                glyphElement.role = "radio";
                glyphElement.tabIndex = 0;
                this._element.append(glyphElement);
                glyphElement.classList.toggle("rotate-left", shouldRotate);
                glyphElement.addEventListener("click", () => {
                    this._removePreviouslySelected();
                    this._alignment.text = value;
                    this._updateSelected();
                    this.dispatchEventToListeners(WI.AlignmentEditor.Event.ValueChanged, {alignment: this._alignment});
                });
                this._valueToGlyphElement.set(value, glyphElement);
            }
        } else
            this._removePreviouslySelected();

        this._alignment = alignment;
        this._updateSelected();
    }

    // Private

    _removePreviouslySelected()
    {
        let previousGlyphElement = this._valueToGlyphElement.get(this._alignment.text);
        previousGlyphElement?.classList.remove("selected");
        previousGlyphElement?.removeAttribute("aria-checked");
    }

    _updateSelected()
    {
        let glyphElement = this._valueToGlyphElement.get(this._alignment.text);
        glyphElement?.classList.add("selected");
        glyphElement?.setAttribute("aria-checked", true);
    }
};

// FIXME: <https://webkit.org/b/233055> Web Inspector: Add a swatch for justify-content, justify-items, and justify-self
WI.AlignmentEditor.AlignContentGlyphs = {
    "start": "Images/AlignContentStart.svg",
    "center": "Images/AlignContentCenter.svg",
    "end": "Images/AlignContentEnd.svg",
    "space-between": "Images/AlignContentSpaceBetween.svg",
    "space-around": "Images/AlignContentSpaceAround.svg",
    "space-evenly": "Images/AlignContentSpaceEvenly.svg",
    "stretch": "Images/AlignContentStretch.svg",
};

WI.AlignmentEditor.AlignItemsGlyphs = {
    "start": "Images/AlignItemsStart.svg",
    "center": "Images/AlignItemsCenter.svg",
    "end": "Images/AlignItemsEnd.svg",
    "stretch": "Images/AlignItemsStretch.svg",
};

WI.AlignmentEditor.UnknownValueGlyph = "Images/AlignmentUnknown.svg";

WI.AlignmentEditor.Event = {
    ValueChanged: "alignment-editor-value-changed",
};
