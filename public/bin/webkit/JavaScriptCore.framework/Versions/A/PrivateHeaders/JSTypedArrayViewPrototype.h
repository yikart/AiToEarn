/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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

#include "JSObject.h"

namespace JSC {

class JSTypedArrayViewPrototype final : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSTypedArrayViewPrototype, Base);
        return &vm.plainObjectSpace();
    }

    static JSTypedArrayViewPrototype* create(VM&, JSGlobalObject*, Structure*);

    DECLARE_INFO;

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);

private:
    JSTypedArrayViewPrototype(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*);
};

JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncIsTypedArrayView);
JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncIsSharedTypedArrayView);
JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncIsResizableOrGrowableSharedTypedArrayView);
JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncTypedArrayFromFast);
JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncIsDetached);
JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncLength);
JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncContentType);
JSC_DECLARE_HOST_FUNCTION(typedArrayViewPrivateFuncGetOriginalConstructor);

} // namespace JSC
