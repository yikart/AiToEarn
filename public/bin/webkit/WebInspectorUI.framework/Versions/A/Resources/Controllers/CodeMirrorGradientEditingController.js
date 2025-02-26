/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

WI.CodeMirrorGradientEditingController = class CodeMirrorGradientEditingController extends WI.CodeMirrorEditingController
{
    // Public

    get initialValue()
    {
        return WI.Gradient.fromString(this.text);
    }

    get cssClassName()
    {
        return "gradient";
    }

    get popoverPreferredEdges()
    {
        // Since the gradient editor can resize to be quite tall, let's avoid displaying the popover
        // above the edited value so that it may not change which edge it attaches to upon editing a stop.
        return [WI.RectEdge.MIN_X, WI.RectEdge.MAX_Y, WI.RectEdge.MAX_X];
    }

    popoverTargetFrameWithRects(rects)
    {
        // If a gradient is defined across several lines, we probably want to use the first line only
        // as a target frame for the editor since we may reformat the gradient value to fit on a single line.
        return rects[0];
    }

    popoverWillPresent(popover)
    {
        function handleColorPickerToggled(event)
        {
            popover.update();
        }

        this._gradientEditor = new WI.GradientEditor;
        this._gradientEditor.addEventListener(WI.GradientEditor.Event.GradientChanged, this._gradientEditorGradientChanged, this);
        this._gradientEditor.addEventListener(WI.GradientEditor.Event.ColorPickerToggled, handleColorPickerToggled, this);
        popover.content = this._gradientEditor.element;
    }

    popoverDidPresent(popover)
    {
        this._gradientEditor.gradient = this.value;
    }

    // Private

    _gradientEditorGradientChanged(event)
    {
        this.value = event.data.gradient;
    }
};
