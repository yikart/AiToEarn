/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

// The following should only be used for response local override file mapping.

Object.defineProperty(File.prototype, "getPath", {
    value() {
        return InspectorFrontendHost.getPath(this);
    },
});

// The following should only be used for rendering (and interacting with) canvas 2D recordings.

Object.defineProperty(CanvasRenderingContext2D.prototype, "currentX", {
    get() {
        return InspectorFrontendHost.getCurrentX(this);
    },
});

Object.defineProperty(CanvasRenderingContext2D.prototype, "currentY", {
    get() {
        return InspectorFrontendHost.getCurrentY(this);
    },
});

Object.defineProperty(CanvasRenderingContext2D.prototype, "getPath", {
    value() {
        return InspectorFrontendHost.getPath(this);
    },
});

Object.defineProperty(CanvasRenderingContext2D.prototype, "setPath", {
    value(path) {
        return InspectorFrontendHost.setPath(this, path);
    },
});

if (window.OffscreenCanvasRenderingContext2D) {
    Object.defineProperty(OffscreenCanvasRenderingContext2D.prototype, "currentX", {
        get() {
            return InspectorFrontendHost.getCurrentX(this);
        },
    });

    Object.defineProperty(OffscreenCanvasRenderingContext2D.prototype, "currentY", {
        get() {
            return InspectorFrontendHost.getCurrentY(this);
        },
    });

    Object.defineProperty(OffscreenCanvasRenderingContext2D.prototype, "getPath", {
        value() {
            return InspectorFrontendHost.getPath(this);
        },
    });

    Object.defineProperty(OffscreenCanvasRenderingContext2D.prototype, "setPath", {
        value(path) {
            return InspectorFrontendHost.setPath(this, path);
        },
    });
}
