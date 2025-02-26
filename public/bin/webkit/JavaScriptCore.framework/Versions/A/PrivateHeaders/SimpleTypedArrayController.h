/*
 * Copyright (C) 2013-2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "Handle.h"
#include "TypedArrayController.h"
#include "WeakHandleOwner.h"

namespace JSC {

// The default controller used for managing the relationship between
// array buffers and their wrappers in JavaScriptCore. This isn't what
// WebCore uses, but it is what JSC uses when running standalone. This
// is pretty simple:
//
// - If the JSArrayBuffer is live, then the ArrayBuffer stays alive.
//
// - If there is a JSArrayBufferView that is holding an ArrayBuffer
//   then any existing wrapper for that ArrayBuffer will be kept
//   alive.
//
// - If you ask an ArrayBuffer for a JSArrayBuffer after one had
//   already been created and it didn't die, then you get the same
//   one.

class SimpleTypedArrayController final : public TypedArrayController {
public:
    JS_EXPORT_PRIVATE SimpleTypedArrayController(bool allowAtomicsWait = true);
    ~SimpleTypedArrayController() final;
    
    JSArrayBuffer* toJS(JSGlobalObject*, JSGlobalObject*, ArrayBuffer*) final;
    void registerWrapper(JSGlobalObject*, ArrayBuffer*, JSArrayBuffer*) final;
    bool isAtomicsWaitAllowedOnCurrentThread() final;

private:
    class JSArrayBufferOwner final : public WeakHandleOwner {
    public:
        bool isReachableFromOpaqueRoots(JSC::Handle<JSC::Unknown>, void* context, AbstractSlotVisitor&, ASCIILiteral* reason) final;
        void finalize(JSC::Handle<JSC::Unknown>, void* context) final;
    };

    JSArrayBufferOwner m_owner;
    bool m_allowAtomicsWait { false };
};

} // namespace JSC
