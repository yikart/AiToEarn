/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.ExecutionContext = class ExecutionContext
{
    constructor(target, id, type, name, frame)
    {
        console.assert(target instanceof WI.Target);
        console.assert(typeof id === "number" || id === WI.RuntimeManager.TopLevelExecutionContextIdentifier);
        console.assert(Object.values(WI.ExecutionContext.Type).includes(type));
        console.assert(!name || typeof name === "string");
        console.assert(frame instanceof WI.Frame || id === WI.RuntimeManager.TopLevelExecutionContextIdentifier);

        this._target = target;
        this._id = id;
        this._type = type || WI.ExecutionContext.Type.Internal;
        this._name = name || "";
        this._frame = frame || null;
    }

    // Static

    static typeFromPayload(payload)
    {
        // COMPATIBILITY (iOS 13.1): `Runtime.ExecutionContextType` did not exist yet.
        if (!("type" in payload))
            return payload.isPageContext ? WI.ExecutionContext.Type.Normal : WI.ExecutionContext.Type.Internal;

        switch (payload.type) {
        case InspectorBackend.Enum.Runtime.ExecutionContextType.Normal:
            return WI.ExecutionContext.Type.Normal;
        case InspectorBackend.Enum.Runtime.ExecutionContextType.User:
            return WI.ExecutionContext.Type.User;
        case InspectorBackend.Enum.Runtime.ExecutionContextType.Internal:
            return WI.ExecutionContext.Type.Internal;
        }

        console.assert(false, "Unknown Runtime.ExecutionContextType", payload.type);
        return WI.ExecutionContext.Type.Internal;
    }

    // Public

    get target() { return this._target; }
    get id() { return this._id; }
    get type() { return this._type; }
    get name() { return this._name; }
    get frame() { return this._frame; }
};

WI.ExecutionContext.Type = {
    Normal: "normal",
    User: "user",
    Internal: "internal",
};
